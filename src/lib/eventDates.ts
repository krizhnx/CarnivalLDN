// Event dates are typed in admin as free text ("Saturday, 7 November 2026") with no time.
// Browsers read that as midnight at the start of the day, so comparing it with "now" says
// the event has passed as soon as event day begins. These helpers read the calendar day
// explicitly and keep tickets valid through the night.

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/** Local midnight at the start of the event day, or null if the date can't be read. */
export const eventDayStart = (text: string | null | undefined): Date | null => {
  if (!text) return null;
  const s = String(text).trim();

  // 2026-11-07 (optionally with a time after it)
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  // "Saturday, 7 November 2026", "7th Nov 2026", "Saturday 04 October 2026"
  const dmy = /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,})\.?,?\s+(\d{4})/.exec(s);
  if (dmy) {
    const month = MONTHS[dmy[2].slice(0, 4).toLowerCase()] ?? MONTHS[dmy[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) return new Date(Number(dmy[3]), month, Number(dmy[1]));
  }

  // "November 7, 2026"
  const mdy = /([A-Za-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/.exec(s);
  if (mdy) {
    const month = MONTHS[mdy[1].slice(0, 4).toLowerCase()] ?? MONTHS[mdy[1].slice(0, 3).toLowerCase()];
    if (month !== undefined) return new Date(Number(mdy[3]), month, Number(mdy[2]));
  }

  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

/** When door check-in closes: 12:00 the day after the event date (events run past midnight). Null if unreadable. */
export const scanWindowEnd = (text: string | null | undefined): Date | null => {
  const start = eventDayStart(text);
  if (!start) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(12, 0, 0, 0);
  return end;
};

/** True once check-in has closed. Unreadable dates never block entry. */
export const eventHasPassed = (text: string | null | undefined, now: Date = new Date()): boolean => {
  const end = scanWindowEnd(text);
  return !!end && now > end;
};
