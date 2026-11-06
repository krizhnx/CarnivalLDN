// Door check-in rules, kept free of React and Supabase so they can be tested on their own.
// The door list (orders, group passes, scans) is loaded once per event; every check runs
// against it locally, so a scan is instant and still works with no signal.

import { eventDayStart, eventHasPassed, scanWindowEnd } from '../lib/eventDates';

export type DoorEvent = { id: string; title: string; date: string; time: string | null; venue: string | null };
export type DoorLine = { tierId: string; tierName: string; quantity: number };
export type DoorOrder = {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  lines: DoorLine[];
};
export type DoorPass = {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  total: number;
  /** guestlists.remaining_scans as last loaded from the server */
  remaining: number;
  category: string;
  notes: string;
};

/** Ticket check-ins so far for one ticket type on one order. */
export type TicketUsage = { used: number; lastAt: string | null };
/** Group pass check-ins so far. */
export type PassUsage = { used: number; remaining: number; lastAt: string | null };

/** Reference printed on tickets, PDFs and emails ("#3F9C2A71"). */
export const shortRef = (id: string) => id.slice(0, 8).toUpperCase();

export const uuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

// ---------------------------------------------------------------------------
// QR codes
// ---------------------------------------------------------------------------

export type QrPayload =
  | { kind: 'ticket'; orderId: string; tierId: string; email: string }
  | { kind: 'pass'; passId: string }
  | { kind: 'unknown' };

/** Reads the QR codes in ticket PDFs ({orderId, ticketTierId, customer}) and group passes ({type:'guestlist', guestlistId}). */
export const parsePayload = (text: string): QrPayload => {
  try {
    const d = JSON.parse(text);
    if (d && d.type === 'guestlist' && typeof d.guestlistId === 'string') return { kind: 'pass', passId: d.guestlistId };
    if (d && typeof d.orderId === 'string' && typeof d.ticketTierId === 'string') {
      return { kind: 'ticket', orderId: d.orderId, tierId: d.ticketTierId, email: String(d.customer ?? '') };
    }
  } catch {
    // not JSON
  }
  return { kind: 'unknown' };
};

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export type Tone = 'valid' | 'warn' | 'invalid';

/** What the door sees after a scan or a manual check-in. */
export type DoorResult = {
  tone: Tone;
  title: string;
  message: string;
  name?: string;
  detail?: string;
  ref?: string;
  /** set when the result is about a ticket type on an order (for "let in another") */
  ticket?: { orderId: string; tierId: string };
  /** set for a valid group pass: the door picks how many people are entering */
  pass?: { passId: string };
};

const clock = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null;

const closedMessage = (event: DoorEvent) => {
  const end = scanWindowEnd(event.date);
  return end
    ? `Check-in closed at ${end.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', weekday: 'short', day: 'numeric', month: 'short' })}`
    : 'Check-in for this event has closed';
};

export type TicketJudgement =
  | { admit: true; order: DoorOrder; line: DoorLine }
  | { admit: false; result: DoorResult };

/**
 * Whether a ticket QR (or a manual check-in) can let one more person in.
 * `order` is null when the order can't be found anywhere; `otherEventTitle` names the event a
 * ticket belongs to when it isn't the one being checked in.
 */
export const judgeTicket = (args: {
  event: DoorEvent;
  order: DoorOrder | null;
  tierId: string;
  /** email from the QR code; omitted for manual check-ins */
  email?: string;
  usage: TicketUsage;
  otherEventTitle?: string;
  now?: Date;
}): TicketJudgement => {
  const { event, order, tierId, usage } = args;
  const now = args.now ?? new Date();
  if (!order) {
    return {
      admit: false,
      result: { tone: 'invalid', title: 'Not found', message: 'No order matches this ticket. Try Look up with the order number or name.' },
    };
  }
  const base = { name: order.name, ref: `#${shortRef(order.id)}` };
  if (order.eventId !== event.id) {
    return {
      admit: false,
      result: { ...base, tone: 'invalid', title: 'Wrong event', message: `This ticket is for ${args.otherEventTitle || 'a different event'}.` },
    };
  }
  if (order.status !== 'completed') {
    return { admit: false, result: { ...base, tone: 'invalid', title: 'Not paid', message: `Payment not completed (order is ${order.status}).` } };
  }
  if (args.email !== undefined && args.email.trim().toLowerCase() !== order.email.trim().toLowerCase()) {
    return { admit: false, result: { ...base, tone: 'invalid', title: 'Not valid', message: "The ticket's email doesn't match the order." } };
  }
  const line = order.lines.find((l) => l.tierId === tierId);
  if (!line) {
    return { admit: false, result: { ...base, tone: 'invalid', title: 'Not valid', message: "This ticket type isn't on the order." } };
  }
  const ticket = { orderId: order.id, tierId: line.tierId };
  if (usage.used >= line.quantity) {
    const at = clock(usage.lastAt);
    const all = line.quantity === 1 ? 'Already checked in' : `All ${line.quantity} already checked in`;
    return {
      admit: false,
      result: { ...base, ticket, detail: line.tierName, tone: 'warn', title: 'Already scanned', message: at ? `${all} (last at ${at}).` : `${all}.` },
    };
  }
  if (eventHasPassed(event.date, now)) {
    return { admit: false, result: { ...base, ticket, detail: line.tierName, tone: 'invalid', title: 'Event has passed', message: closedMessage(event) } };
  }
  return { admit: true, order, line };
};

/** Result shown after letting someone in on a ticket. */
export const admittedResult = (order: DoorOrder, line: DoorLine, usedNow: number, manual: boolean): DoorResult => ({
  tone: 'valid',
  title: manual ? 'Checked in' : 'Valid ticket',
  message: line.quantity === 1 ? '1 person' : `${usedNow} of ${line.quantity} in`,
  name: order.name,
  detail: line.tierName,
  ref: `#${shortRef(order.id)}`,
  ticket: { orderId: order.id, tierId: line.tierId },
});

export type PassJudgement = { open: true; pass: DoorPass; result: DoorResult } | { open: false; result: DoorResult };

/** Whether a group pass still has entries left. If so the door chooses how many people are entering. */
export const judgePass = (args: {
  event: DoorEvent;
  pass: DoorPass | null;
  usage: PassUsage;
  otherEventTitle?: string;
  now?: Date;
}): PassJudgement => {
  const { event, pass, usage } = args;
  const now = args.now ?? new Date();
  if (!pass) {
    return { open: false, result: { tone: 'invalid', title: 'Not found', message: 'No group pass matches this code. Try Look up with the name.' } };
  }
  const base = { name: pass.name, ref: `#${shortRef(pass.id)}`, detail: passLabel(pass) };
  if (pass.eventId !== event.id) {
    return { open: false, result: { ...base, tone: 'invalid', title: 'Wrong event', message: `This group pass is for ${args.otherEventTitle || 'a different event'}.` } };
  }
  if (usage.remaining <= 0) {
    const at = clock(usage.lastAt);
    return {
      open: false,
      result: { ...base, tone: 'warn', title: 'Already used', message: `All ${pass.total} entries on this pass are used${at ? ` (last at ${at})` : ''}.` },
    };
  }
  if (eventHasPassed(event.date, now)) {
    return { open: false, result: { ...base, tone: 'invalid', title: 'Event has passed', message: closedMessage(event) } };
  }
  return {
    open: true,
    pass,
    result: {
      ...base,
      tone: 'valid',
      title: 'Group pass',
      message: `${usage.remaining} of ${pass.total} ${pass.total === 1 ? 'entry' : 'entries'} left`,
      pass: { passId: pass.id },
    },
  };
};

export const passLabel = (pass: DoorPass) => {
  const c = pass.category.trim();
  const kind = !c ? 'Group pass' : c.toUpperCase() === 'GL' ? 'Guestlist' : c.toLowerCase() === 'free' ? 'Free entry' : c[0].toUpperCase() + c.slice(1);
  return `${kind} · ${pass.total} ${pass.total === 1 ? 'person' : 'people'}`;
};

// ---------------------------------------------------------------------------
// Look up
// ---------------------------------------------------------------------------

export type SearchHit = { kind: 'order'; order: DoorOrder; score: number } | { kind: 'pass'; pass: DoorPass; score: number };

/** Phone digits in one shape: "+44 7123 456789" and "07123456789" both become "07123456789". */
export const phoneDigits = (value: string) => {
  const d = value.replace(/\D/g, '');
  return d.startsWith('44') && d.length >= 11 ? `0${d.slice(2)}` : d;
};

/** Order reference typed at the door: "#3f9c 2a71" -> "3f9c2a71" (null if it can't be one). */
export const refQuery = (q: string) => {
  const r = q.trim().replace(/^#/, '').replace(/[\s-]/g, '').toLowerCase();
  return /^[0-9a-f]{4,32}$/.test(r) ? r : null;
};

const scoreText = (q: string, name: string, email: string, phone: string, id: string) => {
  const ql = q.trim().toLowerCase();
  if (ql.length < 2) return 0;
  let score = 0;
  const ref = refQuery(q);
  if (ref) {
    const compact = id.replace(/-/g, '');
    if (compact.startsWith(ref)) score = Math.max(score, ref.length >= 8 ? 120 : 90);
  }
  const n = name.toLowerCase();
  if (n === ql) score = Math.max(score, 80);
  else if (n.startsWith(ql)) score = Math.max(score, 60);
  else if (n.split(/\s+/).some((w) => w.startsWith(ql))) score = Math.max(score, 50);
  else if (n.includes(ql)) score = Math.max(score, 40);
  if (email.toLowerCase().includes(ql)) score = Math.max(score, email.toLowerCase().startsWith(ql) ? 55 : 35);
  const qd = phoneDigits(q);
  if (qd.length >= 4 && /^[+\d\s()-]+$/.test(q.trim()) && phoneDigits(phone).includes(qd)) score = Math.max(score, 45);
  return score;
};

/** Search the door list by order/pass reference, name, email or phone. Best matches first. */
export const searchDoor = (q: string, orders: DoorOrder[], passes: DoorPass[], limit = 30): SearchHit[] => {
  const hits: SearchHit[] = [];
  for (const order of orders) {
    const score = scoreText(q, order.name, order.email, order.phone, order.id);
    if (score) hits.push({ kind: 'order', order, score: order.status === 'completed' ? score : score - 30 });
  }
  for (const pass of passes) {
    const score = scoreText(q, pass.name, pass.email, pass.phone, pass.id);
    if (score) hits.push({ kind: 'pass', pass, score });
  }
  const nameOf = (h: SearchHit) => (h.kind === 'order' ? h.order.name : h.pass.name);
  return hits.sort((a, b) => b.score - a.score || nameOf(a).localeCompare(nameOf(b))).slice(0, limit);
};

/** UUID bounds for a reference prefix, for looking it up on the server ("3f9c2a71" -> first and last possible ids). */
export const refRange = (ref: string): [string, string] => {
  const fmt = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
  return [fmt(ref.padEnd(32, '0')), fmt(ref.padEnd(32, 'f'))];
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Event to check in by default: the one happening now (from 06:00 on the day until check-in closes
 * at noon the next day), otherwise the next one coming up, otherwise the most recent.
 */
export const pickEvent = (events: DoorEvent[], now: Date = new Date()): DoorEvent | null => {
  const dated = events
    .map((e) => ({ e, start: eventDayStart(e.date), end: scanWindowEnd(e.date) }))
    .filter((x): x is { e: DoorEvent; start: Date; end: Date } => !!x.start && !!x.end);
  const live = dated.filter((x) => now.getTime() >= x.start.getTime() + 6 * 3600e3 && now <= x.end);
  if (live.length) return live.sort((a, b) => b.start.getTime() - a.start.getTime())[0].e;
  const upcoming = dated.filter((x) => x.start > now).sort((a, b) => a.start.getTime() - b.start.getTime());
  if (upcoming.length) return upcoming[0].e;
  const past = dated.sort((a, b) => b.start.getTime() - a.start.getTime());
  return past[0]?.e ?? events[0] ?? null;
};
