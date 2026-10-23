import type { SiteTheme } from './siteTheme';

/**
 * SEASONAL THEME SWITCH - change this one line and redeploy.
 *   'auto'      = use whichever season in SEASONS (below) covers today, else standard
 *   'diwali' / 'halloween' = always on
 *   'default'   = always off
 */
export const SITE_THEME: SiteTheme | 'auto' = 'auto';

export type SeasonalTheme = Exclude<SiteTheme, 'default'>;

export interface Season {
  theme: SeasonalTheme;
  /** Inclusive, ISO with London offset */
  start: string;
  /** Exclusive, ISO with London offset */
  end: string;
}

/**
 * Date windows used when SITE_THEME is 'auto'. First match wins.
 *
 * Diwali 2026 is Sunday 8 November. The Diwali look is scoped to the home hero,
 * the home Events section and the /events page; everything else stays standard.
 * Halloween (site-wide look) is kept in code - add a window back to reuse it.
 */
export const SEASONS: Season[] = [
  { theme: 'diwali', start: '2026-10-20T00:00:00+01:00', end: '2026-11-16T00:00:00+00:00' }, // until Sun 15 Nov, end of day
  // { theme: 'halloween', start: '2027-10-01T00:00:00+01:00', end: '2027-11-01T00:00:00+00:00' },
];

/**
 * Leave false unless you have run site_settings.sql in Supabase. When true, the
 * seasonal switch in the admin dashboard controls the theme instead and the
 * settings above are only used as a fallback.
 */
export const ADMIN_THEME_SWITCH = false;
