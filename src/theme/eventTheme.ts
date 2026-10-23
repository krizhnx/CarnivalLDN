import type { Event } from '../types';
import { THEME_LABEL, type SiteTheme } from './siteTheme';

/**
 * Per-event card theme, picked in the admin event form ("Card theme").
 *
 * Stored in the existing `events.gradient` column - the old "colour theme"
 * field, which nothing on the site reads any more - so no database change is
 * needed. Anything other than 'halloween' / 'diwali' (including the legacy
 * Tailwind gradient values) means the standard look.
 *
 * An event card always renders in its own theme, regardless of the site theme.
 */
export const eventTheme = (event: Pick<Event, 'gradient'> | null | undefined): SiteTheme =>
  event?.gradient === 'halloween' || event?.gradient === 'diwali' ? event.gradient : 'default';

export const EVENT_THEME_OPTIONS: { value: SiteTheme; label: string }[] = (['default', 'diwali', 'halloween'] as const).map(
  (value) => ({ value, label: THEME_LABEL[value] })
);
