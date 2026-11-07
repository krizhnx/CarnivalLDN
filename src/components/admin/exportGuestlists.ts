// Guestlist CSV exports: one event (optionally one category) or every event, with door
// check-in progress and times.

import { supabase } from '../../lib/supabase';
import { eventDayStart } from '../../lib/eventDates';
import { downloadCsv } from './format';

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Reads every row (Supabase returns at most 1000 per request). */
const fetchAll = async <T,>(page: (from: number, to: number) => Page<T>): Promise<T[]> => {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
};

type EventRow = { id: string; title: string; date: string; venue: string | null };
type PassRow = {
  id: string;
  event_id: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  total_tickets: number | null;
  remaining_scans: number | null;
  category: string | null;
  notes: string | null;
  created_at: string | null;
  created_by: string | null;
};
type ScanRow = { guestlist_id: string; scanned_at: string };

// Same categories and labels as the Guestlists table in admin (anything else counts as Other)
const CATEGORY_LABELS: Record<string, string> = { free: 'Free', GL: 'GL', tables: 'Tables', other: 'Other' };
const categoryKey = (c: string | null) => (c && c in CATEGORY_LABELS ? c : 'other');

/** "✨ DIWALI IN PALACE ✨" -> "diwali-in-palace" */
const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'event';

/** "07/11/2026 21:40" in London time (Excel reads it as a date). */
const londonTime = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
};

/**
 * Downloads the CSV and returns how many guestlists it contains.
 * Without an eventId it covers every event (current and archived).
 */
export const exportGuestlists = async ({ eventId, category }: { eventId?: string; category?: string } = {}): Promise<number> => {
  const [events, allPasses, scans] = await Promise.all([
    fetchAll<EventRow>((a, b) => {
      const q = supabase.from('events').select('id,title,date,venue').order('created_at');
      return (eventId ? q.eq('id', eventId) : q).range(a, b);
    }),
    fetchAll<PassRow>((a, b) => {
      const q = supabase
        .from('guestlists')
        .select('id,event_id,lead_name,lead_email,lead_phone,total_tickets,remaining_scans,category,notes,created_at,created_by')
        .order('created_at');
      return (eventId ? q.eq('event_id', eventId) : q).range(a, b);
    }),
    fetchAll<ScanRow>((a, b) => {
      const q = supabase.from('guestlist_scans').select('guestlist_id,scanned_at').eq('scan_type', 'entry').order('scanned_at');
      return (eventId ? q.eq('event_id', eventId) : q).range(a, b);
    }),
  ]);
  const passes = category ? allPasses.filter((p) => categoryKey(p.category) === category) : allPasses;
  if (!passes.length) return 0;

  const eventById = new Map(events.map((e) => [e.id, e]));
  const times = new Map<string, { first: string; last: string }>();
  for (const s of scans) {
    const t = times.get(s.guestlist_id);
    if (!t) times.set(s.guestlist_id, { first: s.scanned_at, last: s.scanned_at });
    else t.last = s.scanned_at;
  }

  // Newest event first, then by category and lead name
  const eventTime = (p: PassRow) => eventDayStart(eventById.get(p.event_id)?.date)?.getTime() ?? 0;
  const sorted = [...passes].sort(
    (a, b) =>
      eventTime(b) - eventTime(a) ||
      (eventById.get(a.event_id)?.title ?? '').localeCompare(eventById.get(b.event_id)?.title ?? '') ||
      (a.category ?? '').localeCompare(b.category ?? '') ||
      (a.lead_name ?? '').localeCompare(b.lead_name ?? '')
  );

  const rows = sorted.map((p) => {
    const event = eventById.get(p.event_id);
    const total = p.total_tickets ?? 0;
    const remaining = Math.max(0, p.remaining_scans ?? 0);
    const checkedIn = Math.max(0, total - remaining);
    const t = times.get(p.id);
    return [
      event?.title ?? 'Deleted event',
      event?.date ?? '',
      event?.venue ?? '',
      `#${p.id.slice(0, 8).toUpperCase()}`,
      CATEGORY_LABELS[categoryKey(p.category)],
      p.lead_name ?? '',
      p.lead_email ?? '',
      p.lead_phone ?? '',
      total,
      checkedIn,
      remaining,
      remaining === 0 && total > 0 ? 'All in' : checkedIn > 0 ? 'Partly in' : 'Not arrived',
      londonTime(t?.first),
      londonTime(t?.last),
      (p.notes ?? '').trim(),
      londonTime(p.created_at),
      p.created_by ?? '',
      p.id,
    ];
  });

  const exported = eventId ? eventById.get(eventId) : undefined;
  const name = [
    'guestlists',
    eventId ? slug(exported?.title ?? 'event') : 'all-events',
    category ? slug(CATEGORY_LABELS[category] ?? category) : null,
    new Date().toISOString().slice(0, 10),
  ]
    .filter(Boolean)
    .join('-');

  downloadCsv(
    `${name}.csv`,
    [
      'Event',
      'Event date',
      'Venue',
      'Pass #',
      'Category',
      'Lead name',
      'Email',
      'Phone',
      'Group size',
      'Checked in',
      'Still to come',
      'Status',
      'First check-in',
      'Last check-in',
      'Notes',
      'Created',
      'Created by',
      'Pass ID',
    ],
    rows,
    { bom: true }
  );
  return rows.length;
};
