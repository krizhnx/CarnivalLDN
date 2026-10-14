import type { Event, Order } from '../../types';
import { bookingFeePerTicket } from '../../lib/checkout';

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const gbpWhole = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const gbpCompact = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat('en-GB');

/** Pence -> "£1,234.50" */
export const money = (pence: number) => gbp.format((pence || 0) / 100);
/** Pence -> "£1,235" */
export const moneyWhole = (pence: number) => gbpWhole.format((pence || 0) / 100);
/** Pence -> "£1.2K" */
export const moneyCompact = (pence: number) =>
  Math.abs(pence) < 100000 ? moneyWhole(pence) : gbpCompact.format((pence || 0) / 100);
export const num = (n: number) => int.format(n || 0);
export const pct = (n: number, digits = 0) => `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;

export const toDate = (value: unknown): Date => (value instanceof Date ? value : new Date(value as string));

export const shortDate = (value: unknown) =>
  toDate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const shortDateTime = (value: unknown) =>
  toDate(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const longDate = (value: unknown) =>
  toDate(value).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

export const timeOnly = (value: unknown) =>
  toDate(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const relativeTime = (value: unknown) => {
  const diff = Date.now() - toDate(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate(value);
};

export const ticketCount = (order: Order) =>
  (order.tickets || []).reduce((sum, t) => sum + (t.quantity || 0), 0);

/** Booking fees included in an order total (same tiers as checkout). */
export const orderFees = (order: Order) =>
  (order.tickets || []).reduce((sum, t) => sum + bookingFeePerTicket(t.unitPrice || 0) * (t.quantity || 0), 0);

export type ScanState = 'none' | 'in' | 'out' | 'inout';

export const scanState = (order: Order): { state: ScanState; label: string; at?: Date } => {
  const scans = order.scans || [];
  if (scans.length === 0) return { state: 'none', label: 'Not scanned' };
  const hasIn = scans.some((s) => s.scanType === 'entry');
  const hasOut = scans.some((s) => s.scanType === 'exit');
  const at = toDate(scans[0].scannedAt);
  if (hasIn && hasOut) return { state: 'inout', label: 'In & out', at };
  if (hasIn) return { state: 'in', label: 'Checked in', at };
  if (hasOut) return { state: 'out', label: 'Scanned out', at };
  return { state: 'none', label: 'Not scanned' };
};

export const ageFrom = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const genderLabel = (g?: string) =>
  !g ? '' : g === 'prefer_not_to_say' ? 'Prefer not to say' : g.charAt(0).toUpperCase() + g.slice(1);

/** Lenient parser for the free-text event dates stored on events. */
export const parseLooseDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  let s = String(dateStr).trim();
  const weekday = s.match(/^[A-Za-z]+,\s*(.*)$/);
  if (weekday) s = weekday[1];
  s = s.replace(/(\d+)(st|nd|rd|th)\b/gi, '$1');

  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  const dmy = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dmy) {
    d = new Date(`${dmy[2]} ${dmy[1]}, ${dmy[3]}`);
    if (!isNaN(d.getTime())) return d;
  }

  const slash = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const pad = (n: string) => n.padStart(2, '0');
    d = new Date(`${slash[3]}-${pad(slash[2])}-${pad(slash[1])}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const eventCapacity = (event: Event) => {
  const tierCap = (event.ticketTiers || []).reduce((s, t) => s + (t.capacity || 0), 0);
  return tierCap || parseInt(event.capacity || '0', 10) || 0;
};

export const eventSold = (event: Event) => (event.ticketTiers || []).reduce((s, t) => s + (t.soldCount || 0), 0);

export const initials = (name?: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Turn a list of rows into a CSV download (values are quoted/escaped). */
export const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
