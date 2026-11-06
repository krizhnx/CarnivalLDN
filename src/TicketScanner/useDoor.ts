// Door data: the event's orders, group passes and check-ins, kept on the phone.
//
// - The list is downloaded when the scanner opens (and cached), so checks are instant and
//   keep working with bad or no signal.
// - Every check-in is saved on the phone first, then sent to the database in the background
//   and retried until it lands. Rows carry ids made on the phone, so a retry can never count
//   anyone twice.
// - Check-ins from other door phones are picked up every 10 seconds.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  DoorEvent,
  DoorOrder,
  DoorPass,
  DoorResult,
  PassUsage,
  SearchHit,
  TicketUsage,
  admittedResult,
  judgePass,
  judgeTicket,
  parsePayload,
  pickEvent,
  refQuery,
  refRange,
  searchDoor,
  shortRef,
  uuid,
} from './doorLogic';

const KEYS = {
  events: 'cldn.door.events.v1',
  event: 'cldn.door.event.v1',
  snapshot: (id: string) => `cldn.door.snapshot.v1.${id}`,
  local: 'cldn.door.local.v1',
};

const REFRESH_MS = 10_000;
const FULL_RELOAD_MS = 60_000;
const RETRY_MS = 5_000;

const ORDER_FIELDS = 'id,event_id,customer_name,customer_email,customer_phone,status,order_tickets(ticket_tier_id,quantity)';
const PASS_FIELDS = 'id,event_id,lead_name,lead_email,lead_phone,total_tickets,remaining_scans,category,notes';

type TicketScanRow = { id: string; orderId: string; tierId: string; at: string };
type PassScanRow = { id: string; passId: string; at: string };

type Snapshot = {
  eventId: string;
  tiers: Record<string, string>;
  orders: DoorOrder[];
  passes: DoorPass[];
  ticketScans: TicketScanRow[];
  passScans: PassScanRow[];
  loadedAt: number;
  refreshedAt: number;
};

type LocalTicketScan = {
  kind: 'ticket';
  id: string;
  eventId: string;
  orderId: string;
  tierId: string;
  email: string;
  at: string;
  manual: boolean;
  synced: boolean;
  tries: number;
  error?: string;
  /** last failure was no connection rather than the database refusing it */
  offline?: boolean;
};
type LocalPassScan = {
  kind: 'pass';
  id: string;
  eventId: string;
  passId: string;
  count: number;
  rowIds: string[];
  at: string;
  manual: boolean;
  inserted: boolean;
  synced: boolean;
  tries: number;
  error?: string;
  offline?: boolean;
};
type LocalScan = LocalTicketScan | LocalPassScan;

export type Connection = 'loading' | 'live' | 'saving' | 'offline';

// ---------------------------------------------------------------------------
// Storage + network helpers
// ---------------------------------------------------------------------------

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked - the in-memory copy still works
  }
};

const timeout = (ms: number) => {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
};

/** Supabase reports network failures (no signal, timeouts) without a database error code. */
const isNetworkError = (error: { code?: string } | null) => !!error && (!error.code || error.code === '20');

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>;
const fetchAll = async <T,>(page: (from: number, to: number) => Page<T>): Promise<T[]> => {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const toOrder = (r: any, tiers: Record<string, string>): DoorOrder => {
  const byTier = new Map<string, number>();
  for (const t of r.order_tickets ?? []) byTier.set(t.ticket_tier_id, (byTier.get(t.ticket_tier_id) ?? 0) + (t.quantity || 0));
  return {
    id: r.id,
    eventId: r.event_id,
    name: (r.customer_name || r.customer_email || 'Guest').trim(),
    email: r.customer_email || '',
    phone: r.customer_phone || '',
    status: r.status || 'unknown',
    lines: [...byTier].map(([tierId, quantity]) => ({ tierId, quantity, tierName: tiers[tierId] || 'Ticket' })),
  };
};
const toPass = (r: any): DoorPass => ({
  id: r.id,
  eventId: r.event_id,
  name: (r.lead_name || r.lead_email || 'Guest').trim(),
  email: r.lead_email || '',
  phone: r.lead_phone || '',
  total: r.total_tickets || 0,
  remaining: r.remaining_scans ?? 0,
  category: r.category || '',
  notes: r.notes || '',
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const loadSnapshot = async (eventId: string): Promise<Snapshot> => {
  const signal = timeout(20_000);
  const tiersRes = await supabase.from('ticket_tiers').select('id,name').eq('event_id', eventId).abortSignal(signal);
  if (tiersRes.error) throw tiersRes.error;
  const tiers = Object.fromEntries((tiersRes.data ?? []).map((t) => [t.id, t.name]));
  const [orders, passes, ticketScans, passScans] = await Promise.all([
    fetchAll((a, b) => supabase.from('orders').select(ORDER_FIELDS).eq('event_id', eventId).order('created_at').range(a, b).abortSignal(signal)),
    fetchAll((a, b) => supabase.from('guestlists').select(PASS_FIELDS).eq('event_id', eventId).order('created_at').range(a, b).abortSignal(signal)),
    fetchTicketScans(eventId, signal),
    fetchPassScans(eventId, signal),
  ]);
  const now = Date.now();
  return { eventId, tiers, orders: orders.map((o) => toOrder(o, tiers)), passes: passes.map(toPass), ticketScans, passScans, loadedAt: now, refreshedAt: now };
};

const fetchTicketScans = async (eventId: string, signal: AbortSignal): Promise<TicketScanRow[]> =>
  (
    await fetchAll<{ id: string; order_id: string; ticket_tier_id: string; scanned_at: string }>((a, b) =>
      supabase.from('ticket_scans').select('id,order_id,ticket_tier_id,scanned_at').eq('event_id', eventId).eq('scan_type', 'entry').order('scanned_at').range(a, b).abortSignal(signal)
    )
  ).map((s) => ({ id: s.id, orderId: s.order_id, tierId: s.ticket_tier_id, at: s.scanned_at }));

const fetchPassScans = async (eventId: string, signal: AbortSignal): Promise<PassScanRow[]> =>
  (
    await fetchAll<{ id: string; guestlist_id: string; scanned_at: string }>((a, b) =>
      supabase.from('guestlist_scans').select('id,guestlist_id,scanned_at').eq('event_id', eventId).eq('scan_type', 'entry').order('scanned_at').range(a, b).abortSignal(signal)
    )
  ).map((s) => ({ id: s.id, passId: s.guestlist_id, at: s.scanned_at }));

/** Check-ins so far, combining what the server has with check-ins made on this phone (deduplicated by row id). */
const computeUsage = (snapshot: Snapshot | null, local: LocalScan[], eventId: string | null) => {
  const tickets = new Map<string, { ids: Set<string>; lastAt: string | null }>();
  const passes = new Map<string, { ids: Set<string>; lastAt: string | null }>();
  const add = (map: typeof tickets, key: string, id: string, at: string) => {
    let u = map.get(key);
    if (!u) map.set(key, (u = { ids: new Set(), lastAt: null }));
    u.ids.add(id);
    if (!u.lastAt || at > u.lastAt) u.lastAt = at;
  };
  for (const s of snapshot?.ticketScans ?? []) add(tickets, `${s.orderId}|${s.tierId}`, s.id, s.at);
  for (const s of snapshot?.passScans ?? []) add(passes, s.passId, s.id, s.at);
  for (const l of local) {
    if (l.eventId !== eventId) continue;
    if (l.kind === 'ticket') add(tickets, `${l.orderId}|${l.tierId}`, l.id, l.at);
    else for (const id of l.rowIds) add(passes, l.passId, id, l.at);
  }
  const ticketUsage = (orderId: string, tierId: string): TicketUsage => {
    const u = tickets.get(`${orderId}|${tierId}`);
    return { used: u?.ids.size ?? 0, lastAt: u?.lastAt ?? null };
  };
  const passUsage = (pass: DoorPass): PassUsage => {
    const u = passes.get(pass.id);
    // The server's remaining_scans also covers check-ins recorded by older scanner versions.
    const used = Math.min(pass.total, Math.max(u?.ids.size ?? 0, pass.total - pass.remaining));
    return { used, remaining: Math.max(0, pass.total - used), lastAt: u?.lastAt ?? null };
  };
  return { ticketUsage, passUsage };
};

/** Synced check-ins are kept for a day and a half (so counts survive a reload), unsynced ones until they're sent. */
const pruneLocal = (items: LocalScan[]) => {
  const cutoff = Date.now() - 36 * 3600e3;
  return items.filter((l) => !l.synced || new Date(l.at).getTime() > cutoff);
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDoor() {
  const [events, setEvents] = useState<DoorEvent[]>(() => read(KEYS.events, []));
  const [eventId, setEventIdState] = useState<string | null>(null);
  const [snapshot, setSnapshotState] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [local, setLocalState] = useState<LocalScan[]>(() => pruneLocal(read(KEYS.local, [])));
  const [netOk, setNetOk] = useState(true);

  const eventIdRef = useRef<string | null>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const localRef = useRef<LocalScan[]>(local);
  const eventsRef = useRef<DoorEvent[]>(events);
  const loadingRef = useRef<string | null>(null); // event id being loaded
  const flushingRef = useRef(false);
  eventsRef.current = events;

  const setSnapshot = useCallback((next: Snapshot | null) => {
    snapshotRef.current = next;
    setSnapshotState(next);
    if (next) write(KEYS.snapshot(next.eventId), next);
  }, []);

  /** Updates the phone's check-ins; written to storage straight away so nothing is lost if the page closes. */
  const updateLocal = useCallback((fn: (prev: LocalScan[]) => LocalScan[]) => {
    const next = fn(localRef.current);
    localRef.current = next;
    write(KEYS.local, next);
    setLocalState(next);
  }, []);
  const patchLocal = useCallback(
    (id: string, patch: Partial<LocalTicketScan> | Partial<LocalPassScan>) =>
      updateLocal((prev) => prev.map((l) => (l.id === id ? ({ ...l, ...patch } as LocalScan) : l))),
    [updateLocal]
  );

  // ---- events --------------------------------------------------------------

  const selectEvent = useCallback(
    (id: string, remember = true) => {
      if (remember) write(KEYS.event, { id, at: Date.now() });
      eventIdRef.current = id;
      setEventIdState(id);
      setLoadError(null);
      setSnapshot(read<Snapshot | null>(KEYS.snapshot(id), null));
    },
    [setSnapshot]
  );

  useEffect(() => {
    let cancelled = false;
    const choose = (list: DoorEvent[]) => {
      if (cancelled || eventIdRef.current) return;
      const saved = read<{ id: string; at: number } | null>(KEYS.event, null);
      const keep = saved && Date.now() - saved.at < 16 * 3600e3 && list.find((e) => e.id === saved.id);
      const pick = keep || pickEvent(list);
      if (pick) selectEvent(pick.id, false);
    };
    (async () => {
      const { data, error } = await supabase.from('events').select('id,title,date,time,venue').order('created_at', { ascending: false }).abortSignal(timeout(15_000));
      if (cancelled) return;
      if (error || !data) {
        setNetOk(false);
        choose(eventsRef.current);
        if (!eventsRef.current.length) setLoadError("Couldn't load events. Check the signal and try again.");
        return;
      }
      const list: DoorEvent[] = data.map((e) => ({ id: e.id, title: e.title, date: e.date, time: e.time ?? null, venue: e.venue ?? null }));
      write(KEYS.events, list);
      setEvents(list);
      eventsRef.current = list;
      choose(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectEvent]);

  // ---- loading + refreshing -------------------------------------------------

  const fullLoad = useCallback(async () => {
    const id = eventIdRef.current;
    if (!id || loadingRef.current === id) return;
    loadingRef.current = id;
    try {
      const next = await loadSnapshot(id);
      if (eventIdRef.current !== id) return;
      setSnapshot(next);
      setLoadError(null);
      setNetOk(true);
    } catch (err) {
      if (eventIdRef.current !== id) return;
      setNetOk(false);
      if (!snapshotRef.current) setLoadError("Couldn't download the guest list. Check the signal and try again.");
      console.warn('Door list load failed', err);
    } finally {
      if (loadingRef.current === id) loadingRef.current = null;
    }
  }, [setSnapshot]);

  const refresh = useCallback(async () => {
    const id = eventIdRef.current;
    const current = snapshotRef.current;
    if (!id || !current || current.eventId !== id) return fullLoad();
    if (Date.now() - current.loadedAt > FULL_RELOAD_MS) return fullLoad();
    if (loadingRef.current === id) return;
    loadingRef.current = id;
    try {
      const signal = timeout(12_000);
      const [ticketScans, passScans, passesRes] = await Promise.all([
        fetchTicketScans(id, signal),
        fetchPassScans(id, signal),
        supabase.from('guestlists').select(PASS_FIELDS).eq('event_id', id).abortSignal(signal),
      ]);
      if (passesRes.error) throw passesRes.error;
      const latest = snapshotRef.current;
      if (eventIdRef.current !== id || !latest) return;
      setSnapshot({ ...latest, ticketScans, passScans, passes: (passesRes.data ?? []).map(toPass), refreshedAt: Date.now() });
      setNetOk(true);
    } catch (err) {
      setNetOk(false);
      console.warn('Door refresh failed', err);
    } finally {
      if (loadingRef.current === id) loadingRef.current = null;
    }
  }, [fullLoad, setSnapshot]);

  // ---- sending check-ins -------------------------------------------------------

  const syncOne = useCallback(
    async (item: LocalScan): Promise<'ok' | 'offline' | 'failed'> => {
      const notes = item.manual ? 'Manual check-in' : '';
      if (item.kind === 'ticket') {
        const { error } = await supabase
          .from('ticket_scans')
          .insert({
            id: item.id,
            order_id: item.orderId,
            ticket_tier_id: item.tierId,
            customer_email: item.email,
            event_id: item.eventId,
            scan_type: 'entry',
            scanned_by: 'door',
            location: '',
            notes,
            scanned_at: item.at,
          })
          .abortSignal(timeout(10_000));
        // 23505 = this row is already there (an earlier attempt landed)
        if (!error || error.code === '23505') {
          patchLocal(item.id, { synced: true, error: undefined, offline: undefined });
          return 'ok';
        }
        const offline = isNetworkError(error);
        patchLocal(item.id, { tries: item.tries + 1, error: error.message, offline });
        return offline ? 'offline' : 'failed';
      }

      if (!item.inserted) {
        const rows = item.rowIds.map((id) => ({
          id,
          guestlist_id: item.passId,
          event_id: item.eventId,
          scan_type: 'entry',
          scanned_by: 'door',
          location: '',
          notes,
          scanned_at: item.at,
        }));
        const { error } = await supabase.from('guestlist_scans').insert(rows).abortSignal(timeout(10_000));
        if (error && error.code !== '23505') {
          const offline = isNetworkError(error);
          patchLocal(item.id, { tries: item.tries + 1, error: error.message, offline });
          return offline ? 'offline' : 'failed';
        }
        patchLocal(item.id, { inserted: true });
      }
      // Keep guestlists.remaining_scans (shown in admin) in step with the scan rows.
      const { error } = await supabase
        .rpc('decrement_guestlist_scans_by_amount', { guestlist_uuid: item.passId, scan_count: item.count })
        .abortSignal(timeout(10_000));
      if (error && isNetworkError(error)) {
        patchLocal(item.id, { tries: item.tries + 1, error: error.message, offline: true });
        return 'offline';
      }
      if (error) console.warn('Could not update remaining entries for group pass', item.passId, error);
      patchLocal(item.id, { synced: true, error: undefined, offline: undefined });
      return 'ok';
    },
    [patchLocal]
  );

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    try {
      const pending = localRef.current.filter((l) => !l.synced);
      for (const item of pending) {
        const latest = localRef.current.find((l) => l.id === item.id);
        if (!latest || latest.synced) continue;
        const outcome = await syncOne(latest);
        if (outcome === 'offline') {
          setNetOk(false);
          break;
        }
        if (outcome === 'ok') setNetOk(true);
      }
    } finally {
      flushingRef.current = false;
    }
  }, [syncOne]);

  // ---- timers ----------------------------------------------------------------------

  useEffect(() => {
    if (!eventId) return;
    fullLoad();
    const tick = () => {
      if (!document.hidden) refresh();
    };
    const timer = setInterval(tick, REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) {
        refresh();
        flush();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [eventId, fullLoad, refresh, flush]);

  useEffect(() => {
    flush();
    const timer = setInterval(() => {
      if (localRef.current.some((l) => !l.synced)) flush();
    }, RETRY_MS);
    const onOnline = () => {
      flush();
      refresh();
    };
    window.addEventListener('online', onOnline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
    };
  }, [flush, refresh]);

  // ---- lookups ------------------------------------------------------------------------

  const event = useMemo(() => events.find((e) => e.id === eventId) ?? null, [events, eventId]);
  const titleOf = useCallback((id?: string) => eventsRef.current.find((e) => e.id === id)?.title, []);
  const usageNow = useCallback(() => computeUsage(snapshotRef.current, localRef.current, eventIdRef.current), []);

  /** Adds an order/pass found on the server (e.g. bought after the list was downloaded) to the list. */
  const mergeIntoSnapshot = useCallback(
    (orders: DoorOrder[], passes: DoorPass[]) => {
      const s = snapshotRef.current;
      if (!s) return;
      const o = orders.filter((x) => x.eventId === s.eventId && !s.orders.some((y) => y.id === x.id));
      const p = passes.filter((x) => x.eventId === s.eventId && !s.passes.some((y) => y.id === x.id));
      if (o.length || p.length) setSnapshot({ ...s, orders: [...s.orders, ...o], passes: [...s.passes, ...p] });
    },
    [setSnapshot]
  );

  const fetchOne = useCallback(
    async (table: 'orders' | 'guestlists', id: string): Promise<DoorOrder | DoorPass | null | 'offline'> => {
      const { data, error } = await supabase
        .from(table)
        .select(table === 'orders' ? ORDER_FIELDS : PASS_FIELDS)
        .eq('id', id)
        .abortSignal(timeout(6_000))
        .maybeSingle();
      if (error) {
        // a QR code with an id that isn't a valid UUID simply isn't one of ours
        if (error.code === '22P02') return null;
        setNetOk(false);
        return 'offline';
      }
      if (!data) return null;
      return table === 'orders' ? toOrder(data, snapshotRef.current?.tiers ?? {}) : toPass(data);
    },
    []
  );

  // ---- check-ins ---------------------------------------------------------------------

  const noEvent: DoorResult = { tone: 'invalid', title: 'No event', message: 'Pick the event you are checking in first.' };
  const noSignal: DoorResult = {
    tone: 'warn',
    title: 'No signal',
    message: "This ticket isn't on the downloaded list and the server can't be reached. Try again, or use Look up.",
  };

  const admitTicket = useCallback(
    (orderId: string, tierId: string, count: number, manual: boolean): DoorResult => {
      const ev = eventsRef.current.find((e) => e.id === eventIdRef.current);
      if (!ev) return noEvent;
      const order = snapshotRef.current?.orders.find((o) => o.id === orderId) ?? null;
      const usage = usageNow().ticketUsage(orderId, tierId);
      const j = judgeTicket({ event: ev, order, tierId, usage, otherEventTitle: titleOf(order?.eventId) });
      if (!j.admit) return j.result;
      const n = Math.max(1, Math.min(count, j.line.quantity - usage.used));
      const at = new Date().toISOString();
      const items: LocalTicketScan[] = Array.from({ length: n }, () => ({
        kind: 'ticket',
        id: uuid(),
        eventId: ev.id,
        orderId,
        tierId,
        email: j.order.email,
        at,
        manual,
        synced: false,
        tries: 0,
      }));
      updateLocal((prev) => [...prev, ...items]);
      setTimeout(flush, 0);
      return admittedResult(j.order, j.line, usage.used + n, manual);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flush, titleOf, updateLocal, usageNow]
  );

  const admitPass = useCallback(
    (passId: string, count: number, manual: boolean): DoorResult => {
      const ev = eventsRef.current.find((e) => e.id === eventIdRef.current);
      if (!ev) return noEvent;
      const pass = snapshotRef.current?.passes.find((p) => p.id === passId) ?? null;
      const usage = pass ? usageNow().passUsage(pass) : { used: 0, remaining: 0, lastAt: null };
      const j = judgePass({ event: ev, pass, usage, otherEventTitle: titleOf(pass?.eventId) });
      if (!j.open) return j.result;
      const n = Math.max(1, Math.min(count, usage.remaining));
      const item: LocalPassScan = {
        kind: 'pass',
        id: uuid(),
        eventId: ev.id,
        passId,
        count: n,
        rowIds: Array.from({ length: n }, () => uuid()),
        at: new Date().toISOString(),
        manual,
        inserted: false,
        synced: false,
        tries: 0,
      };
      updateLocal((prev) => [...prev, item]);
      setTimeout(flush, 0);
      const left = usage.remaining - n;
      return {
        ...j.result,
        title: 'Checked in',
        message: `Let in ${n} ${n === 1 ? 'person' : 'people'}. ${left === 0 ? 'All entries used' : `${left} left on this pass`}.`,
        pass: undefined,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flush, titleOf, updateLocal, usageNow]
  );

  /** A group pass picked in Look up: valid ones open the "how many people" step. */
  const openPass = useCallback(
    (passId: string): DoorResult => {
      const ev = eventsRef.current.find((e) => e.id === eventIdRef.current);
      if (!ev) return noEvent;
      const pass = snapshotRef.current?.passes.find((p) => p.id === passId) ?? null;
      const usage = pass ? usageNow().passUsage(pass) : { used: 0, remaining: 0, lastAt: null };
      return judgePass({ event: ev, pass, usage, otherEventTitle: titleOf(pass?.eventId) }).result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [titleOf, usageNow]
  );

  /** Handles a scanned QR code: tickets check one person in straight away; group passes ask how many. */
  const scan = useCallback(
    async (text: string): Promise<DoorResult> => {
      const ev = eventsRef.current.find((e) => e.id === eventIdRef.current);
      if (!ev) return noEvent;
      const payload = parsePayload(text);
      if (payload.kind === 'unknown') {
        return { tone: 'invalid', title: 'Not a ticket', message: "This QR code isn't a Carnival LDN ticket or group pass." };
      }

      if (payload.kind === 'ticket') {
        let order = snapshotRef.current?.orders.find((o) => o.id === payload.orderId) ?? null;
        if (!order) {
          const found = await fetchOne('orders', payload.orderId);
          if (found === 'offline') return noSignal;
          order = found as DoorOrder | null;
          if (order) mergeIntoSnapshot([order], []);
        }
        const usage = usageNow().ticketUsage(payload.orderId, payload.tierId);
        const j = judgeTicket({ event: ev, order, tierId: payload.tierId, email: payload.email, usage, otherEventTitle: titleOf(order?.eventId) });
        if (!j.admit) return j.result;
        return admitTicket(j.order.id, j.line.tierId, 1, false);
      }

      let pass = snapshotRef.current?.passes.find((p) => p.id === payload.passId) ?? null;
      if (!pass) {
        const found = await fetchOne('guestlists', payload.passId);
        if (found === 'offline') return noSignal;
        pass = found as DoorPass | null;
        if (pass) mergeIntoSnapshot([], [pass]);
      }
      const usage = pass ? usageNow().passUsage(pass) : { used: 0, remaining: 0, lastAt: null };
      return judgePass({ event: ev, pass, usage, otherEventTitle: titleOf(pass?.eventId) }).result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admitTicket, fetchOne, mergeIntoSnapshot, titleOf, usageNow]
  );

  // ---- look up ------------------------------------------------------------------------

  const search = useCallback((q: string): SearchHit[] => {
    const s = snapshotRef.current;
    return s ? searchDoor(q, s.orders, s.passes) : [];
  }, []);

  /** Looks an order/pass reference up on the server (for ones not on this event's list). */
  const searchServer = useCallback(
    async (q: string): Promise<{ hits: SearchHit[]; offline: boolean }> => {
      const ref = refQuery(q);
      if (!ref || ref.length < 6) return { hits: [], offline: false };
      const [lo, hi] = refRange(ref);
      const signal = timeout(8_000);
      const [o, p] = await Promise.all([
        supabase.from('orders').select(ORDER_FIELDS).gte('id', lo).lte('id', hi).limit(10).abortSignal(signal),
        supabase.from('guestlists').select(PASS_FIELDS).gte('id', lo).lte('id', hi).limit(10).abortSignal(signal),
      ]);
      if (o.error || p.error) {
        setNetOk(false);
        return { hits: [], offline: true };
      }
      const orders = (o.data ?? []).map((r) => toOrder(r, snapshotRef.current?.tiers ?? {}));
      const passes = (p.data ?? []).map(toPass);
      mergeIntoSnapshot(orders, passes);
      return {
        hits: [
          ...orders.map((order) => ({ kind: 'order' as const, order, score: 100 })),
          ...passes.map((pass) => ({ kind: 'pass' as const, pass, score: 100 })),
        ],
        offline: false,
      };
    },
    [mergeIntoSnapshot]
  );

  // ---- status -------------------------------------------------------------------------

  const usage = useMemo(() => computeUsage(snapshot, local, eventId), [snapshot, local, eventId]);

  const totals = useMemo(() => {
    let inside = 0;
    let expected = 0;
    for (const o of snapshot?.orders ?? []) {
      if (o.status !== 'completed') continue;
      for (const l of o.lines) {
        expected += l.quantity;
        inside += Math.min(l.quantity, usage.ticketUsage(o.id, l.tierId).used);
      }
    }
    for (const p of snapshot?.passes ?? []) {
      expected += p.total;
      inside += usage.passUsage(p).used;
    }
    return { inside, expected };
  }, [snapshot, usage]);

  const pending = local.filter((l) => !l.synced);
  // No signal is shown by the status pill; this is for saves the database keeps refusing.
  const failing = pending.filter((l) => l.tries >= 3 && l.error && !l.offline);
  const connection: Connection = !snapshot ? (loadError ? 'offline' : 'loading') : !netOk ? 'offline' : pending.length ? 'saving' : 'live';

  return {
    events,
    event,
    selectEvent,
    ready: !!snapshot && snapshot.eventId === eventId,
    loadError,
    connection,
    pendingCount: pending.length,
    failing: failing.map((f) => ({ id: f.id, error: f.error ?? '', ref: shortRef(f.kind === 'ticket' ? f.orderId : f.passId) })),
    lastUpdated: snapshot?.refreshedAt ?? null,
    totals,
    orderCount: snapshot?.orders.length ?? 0,
    passCount: snapshot?.passes.length ?? 0,
    ticketUsage: usage.ticketUsage,
    passUsage: usage.passUsage,
    findOrder: (id: string) => snapshot?.orders.find((o) => o.id === id) ?? null,
    findPass: (id: string) => snapshot?.passes.find((p) => p.id === id) ?? null,
    titleOf,
    scan,
    admitTicket,
    admitPass,
    openPass,
    search,
    searchServer,
    reload: fullLoad,
    retrySaving: flush,
  };
}

export type Door = ReturnType<typeof useDoor>;
