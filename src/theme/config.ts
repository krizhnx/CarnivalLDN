import type { SiteTheme } from './siteTheme';

/**
 * HALLOWEEN SWITCH - change this one line and redeploy.
 *   'auto'      = Halloween between HALLOWEEN_START and HALLOWEEN_END (below)
 *   'halloween' = always on
 *   'default'   = always off
 */
export const SITE_THEME: SiteTheme | 'auto' = 'auto';

/** Window used when SITE_THEME is 'auto' (start inclusive, end exclusive). */
export const HALLOWEEN_START = '2026-10-01T00:00:00+01:00'; // 1 Oct, 00:00 London (BST)
export const HALLOWEEN_END = '2026-11-01T00:00:00+00:00'; // 1 Nov, 00:00 London (GMT - clocks go back 25 Oct)

/**
 * Leave false unless you have run site_settings.sql in Supabase. When true, the
 * "Halloween mode" switch in the admin dashboard controls the theme instead and
 * the settings above are only used as a fallback.
 */
export const ADMIN_THEME_SWITCH = false;
