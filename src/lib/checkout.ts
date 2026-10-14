import type { Event, TicketTier } from '../types';

/**
 * Pure checkout helpers. Pricing rules here are a 1:1 port of the logic that
 * previously lived inline in Checkout.tsx - keep them in sync with the API.
 */

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface TicketSelection {
  tierId: string;
  tier: TicketTier;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  /** ISO `YYYY-MM-DD` (same format the old native date input produced) */
  dateOfBirth: string;
  gender: Gender | '';
}

export const EMPTY_CUSTOMER: CustomerInfo = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
};

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const gbpWhole = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** £12.50 */
export const formatGBP = (pence: number) => gbp.format(pence / 100);

/** £12 when whole, £12.50 otherwise - for compact labels like "From £12" */
export const formatGBPCompact = (pence: number) =>
  pence % 100 === 0 ? gbpWhole.format(pence / 100) : gbp.format(pence / 100);

export const formatTierPrice = (pence: number) => (pence === 0 ? 'Free' : formatGBP(pence));

// ---------------------------------------------------------------------------
// Tiers & availability
// ---------------------------------------------------------------------------

export const sortTiers = (tiers: TicketTier[] = []) => [...tiers].sort((a, b) => a.price - b.price);

export const tierRemaining = (tier: TicketTier) => Math.max(0, tier.capacity - tier.soldCount);

export const isTierSoldOut = (tier: TicketTier) => tierRemaining(tier) <= 0 || tier.isActive === false;

/** "Only N left" once a tier is within its last ~30% (capped at 25 tickets). */
export const isTierLowStock = (tier: TicketTier) => {
  if (isTierSoldOut(tier)) return false;
  return tierRemaining(tier) <= Math.min(25, Math.ceil(tier.capacity * 0.3));
};

export const isEventSoldOut = (event: Event) =>
  !!event.ticketTiers?.length && event.ticketTiers.every(isTierSoldOut);

export const isEventSellingFast = (event: Event) => !!event.ticketTiers?.some(isTierLowStock);

/** Cheapest *available* tier price, falling back to cheapest overall. */
export const lowestPrice = (event: Event): number | null => {
  const tiers = event.ticketTiers ?? [];
  if (!tiers.length) return null;
  const pool = tiers.filter((t) => !isTierSoldOut(t));
  return Math.min(...(pool.length ? pool : tiers).map((t) => t.price));
};

// ---------------------------------------------------------------------------
// Pricing (pence)
// ---------------------------------------------------------------------------

/**
 * Tiered booking fee per ticket:
 *   up to £40  -> £1.50
 *   £40 - £50  -> £2.00
 *   above £50  -> £2.50
 */
export const bookingFeePerTicket = (ticketPricePence: number) => {
  if (ticketPricePence <= 4000) return 150;
  if (ticketPricePence <= 5000) return 200;
  return 250;
};

const DISCOUNT_CODES: Record<string, number> = {
  LSEHOLI: 1000, // £10.00
  HOLIHAI: 250, // £2.50
};

export const normaliseCode = (code: string) => code.trim().toUpperCase();

export const isValidDiscountCode = (code: string) =>
  Object.prototype.hasOwnProperty.call(DISCOUNT_CODES, normaliseCode(code));

export interface CheckoutTotals {
  quantity: number;
  subtotal: number;
  discount: number;
  fee: number;
  total: number;
}

export const computeTotals = (selections: TicketSelection[], discountCode: string | null): CheckoutTotals => {
  let quantity = 0;
  let subtotal = 0;
  let fee = 0;

  for (const s of selections) {
    if (s.quantity <= 0) continue;
    quantity += s.quantity;
    subtotal += s.tier.price * s.quantity;
    fee += bookingFeePerTicket(s.tier.price) * s.quantity;
  }

  const discountValue = discountCode && isValidDiscountCode(discountCode) ? DISCOUNT_CODES[normaliseCode(discountCode)] : 0;
  const discount = Math.min(discountValue, subtotal);

  return { quantity, subtotal, discount, fee, total: subtotal - discount + fee };
};

export const analyticsItems = (selections: TicketSelection[], free = false) =>
  selections.map((s) => ({ tier: s.tier.name, price: free ? 0 : s.tier.price, quantity: s.quantity }));

// ---------------------------------------------------------------------------
// Customer validation
// ---------------------------------------------------------------------------

export type CustomerField = keyof CustomerInfo;
export type FieldErrors = Partial<Record<CustomerField, string>>;

export const MIN_AGE = 18;

export const calculateAge = (birthDate: Date, today = new Date()) => {
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

/** Parses a strict `YYYY-MM-DD` string into a local Date, rejecting impossible dates like 31/02. */
export const parseIsoDate = (iso: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validateField = (field: CustomerField, info: CustomerInfo): string | undefined => {
  switch (field) {
    case 'name':
      return info.name.trim().length < 2 ? 'Enter your full name' : undefined;
    case 'email':
      if (!info.email.trim()) return 'Enter your email address';
      return EMAIL_RE.test(info.email.trim()) ? undefined : "That email doesn't look right";
    case 'phone':
      return info.phone.replace(/\D/g, '').length < 7 ? 'Enter a valid phone number' : undefined;
    case 'dateOfBirth': {
      if (!info.dateOfBirth) return 'Enter your date of birth';
      const dob = parseIsoDate(info.dateOfBirth);
      if (!dob || dob.getFullYear() < 1900 || dob > new Date()) return 'Enter a valid date of birth';
      return calculateAge(dob) < MIN_AGE ? `You must be ${MIN_AGE} or older to buy tickets` : undefined;
    }
    case 'gender':
      return info.gender ? undefined : 'Select an option';
    default:
      return undefined;
  }
};

export const validateCustomer = (info: CustomerInfo): FieldErrors => {
  const errors: FieldErrors = {};
  (['name', 'email', 'phone', 'dateOfBirth', 'gender'] as CustomerField[]).forEach((field) => {
    const message = validateField(field, info);
    if (message) errors[field] = message;
  });
  return errors;
};

// ---------------------------------------------------------------------------
// Event date parsing (event.date is free text, e.g. "Saturday, 1 November 2025")
// ---------------------------------------------------------------------------

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthIndex = (name: string) => MONTHS.indexOf(name.slice(0, 3).toLowerCase());

export interface DateBadge {
  day: string;
  month: string;
  weekday?: string;
}

export const parseEventDate = (input?: string): DateBadge | null => {
  if (!input) return null;

  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;

  const iso = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(input);
  const ukNumeric = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(input);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]) - 1;
    day = Number(iso[3]);
  } else if (ukNumeric) {
    day = Number(ukNumeric[1]);
    month = Number(ukNumeric[2]) - 1;
    year = Number(ukNumeric[3]);
  } else {
    const dayFirst = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3,9})\b/i.exec(input);
    const monthFirst = /\b([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\b/i.exec(input);
    if (dayFirst && monthIndex(dayFirst[2]) >= 0) {
      day = Number(dayFirst[1]);
      month = monthIndex(dayFirst[2]);
    } else if (monthFirst && monthIndex(monthFirst[1]) >= 0) {
      day = Number(monthFirst[2]);
      month = monthIndex(monthFirst[1]);
    }
    const y = /\b(20\d{2})\b/.exec(input);
    if (y) year = Number(y[1]);
  }

  if (day === undefined || month === undefined || month < 0 || month > 11 || day < 1 || day > 31) return null;

  let weekday: string | undefined;
  const named = /\b(mon|tue|wed|thu|fri|sat|sun)(?:day|sday|nesday|rsday|urday)?\b/i.exec(input);
  if (named) weekday = named[1].toUpperCase();
  else if (year) weekday = new Date(year, month, day).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();

  return { day: String(day), month: MONTHS[month].toUpperCase(), weekday };
};

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** "Tuesday, 27 October 2026" -> "Tue, 27 Oct" (falls back to the original text) */
export const formatEventDateShort = (input?: string): string => {
  const badge = parseEventDate(input);
  if (!badge) return input ?? '';
  const dayMonth = `${badge.day} ${titleCase(badge.month)}`;
  return badge.weekday ? `${titleCase(badge.weekday)}, ${dayMonth}` : dayMonth;
};
