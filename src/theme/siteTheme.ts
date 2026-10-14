import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ADMIN_THEME_SWITCH, HALLOWEEN_END, HALLOWEEN_START, SITE_THEME } from './config';

/**
 * Site-wide seasonal theme.
 *
 * - By default the *live* theme comes from code: SITE_THEME / the date window in
 *   ./config.ts. No network calls.
 * - If ADMIN_THEME_SWITCH is enabled, it is read from Supabase (`site_settings`
 *   row `theme`, see /site_settings.sql) and flipped from the admin dashboard; the
 *   code setting becomes the fallback. The last remote value is cached in
 *   localStorage to avoid a flash of the wrong theme.
 * - A *preview* theme can be forced for the current tab with `?theme=halloween`
 *   (or `?theme=default`); `?theme=live` clears it. Preview never affects visitors.
 */

export type SiteTheme = 'default' | 'halloween';

const CACHE_KEY = 'carnival_site_theme';
const PREVIEW_KEY = 'carnival_site_theme_preview';
const SETTINGS_TABLE = 'site_settings';
const THEME_KEY = 'theme';

export const isSiteTheme = (value: unknown): value is SiteTheme => value === 'default' || value === 'halloween';

/** Theme decided by the code setting in ./config.ts. */
export const codeTheme = (now: number = Date.now()): SiteTheme => {
  if (SITE_THEME !== 'auto') return SITE_THEME;
  return now >= Date.parse(HALLOWEEN_START) && now < Date.parse(HALLOWEEN_END) ? 'halloween' : 'default';
};

const storage = {
  get(store: 'local' | 'session', key: string) {
    try {
      return (store === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(store: 'local' | 'session', key: string, value: string | null) {
    try {
      const s = store === 'local' ? window.localStorage : window.sessionStorage;
      if (value === null) s.removeItem(key);
      else s.setItem(key, value);
    } catch {
      /* private mode etc. */
    }
  },
};

const readInitialPreview = (): SiteTheme | null => {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('theme');
  if (param === 'live' || param === 'off') {
    storage.set('session', PREVIEW_KEY, null);
    return null;
  }
  if (isSiteTheme(param)) {
    storage.set('session', PREVIEW_KEY, param);
    return param;
  }
  const stored = storage.get('session', PREVIEW_KEY);
  return isSiteTheme(stored) ? stored : null;
};

const readInitialLive = (): SiteTheme => {
  if (ADMIN_THEME_SWITCH && typeof window !== 'undefined') {
    const cached = storage.get('local', CACHE_KEY);
    if (isSiteTheme(cached)) return cached;
  }
  return codeTheme();
};

const describeError = (error: { code?: string; message?: string }) => {
  if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')) {
    return 'The site_settings table is missing - run site_settings.sql in Supabase.';
  }
  return error.message || 'Could not reach Supabase.';
};

interface SiteThemeState {
  liveTheme: SiteTheme;
  previewTheme: SiteTheme | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  saving: boolean;
  refresh: () => Promise<void>;
  setLiveTheme: (theme: SiteTheme) => Promise<boolean>;
  setPreviewTheme: (theme: SiteTheme | null) => void;
}

export const useSiteThemeStore = create<SiteThemeState>()((set) => ({
  liveTheme: readInitialLive(),
  previewTheme: readInitialPreview(),
  status: ADMIN_THEME_SWITCH ? 'idle' : 'ready',
  error: null,
  saving: false,

  refresh: async () => {
    if (!ADMIN_THEME_SWITCH) {
      // Code-controlled: just re-evaluate the date window
      set({ liveTheme: codeTheme(), status: 'ready', error: null });
      return;
    }
    set((s) => ({ status: s.status === 'ready' ? 'ready' : 'loading' }));
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('value')
      .eq('key', THEME_KEY)
      .maybeSingle();

    if (error) {
      set({ status: 'error', error: describeError(error) });
      return;
    }
    const value = isSiteTheme(data?.value) ? data.value : codeTheme();
    storage.set('local', CACHE_KEY, value);
    set({ liveTheme: value, status: 'ready', error: null });
  },

  setLiveTheme: async (theme) => {
    if (!ADMIN_THEME_SWITCH) {
      set({ error: 'The theme is set in code (src/theme/config.ts).' });
      return false;
    }
    set({ saving: true, error: null });
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .update({ value: theme, updated_at: new Date().toISOString() })
      .eq('key', THEME_KEY)
      .select('value');

    if (error || !data?.length) {
      set({
        saving: false,
        error: error ? describeError(error) : 'No settings row was updated - run site_settings.sql in Supabase.',
      });
      return false;
    }
    storage.set('local', CACHE_KEY, theme);
    set({ liveTheme: theme, saving: false, status: 'ready' });
    return true;
  },

  setPreviewTheme: (theme) => {
    storage.set('session', PREVIEW_KEY, theme);
    set({ previewTheme: theme });
  },
}));

/** Effective theme for rendering (preview wins over live). */
export const useSiteTheme = () => {
  const liveTheme = useSiteThemeStore((s) => s.liveTheme);
  const previewTheme = useSiteThemeStore((s) => s.previewTheme);
  const theme = previewTheme ?? liveTheme;
  return { theme, isHalloween: theme === 'halloween', isPreview: previewTheme !== null };
};

/** Routes that never get the seasonal theme (admin tools, and the standalone Halloween landing page which has its own look). */
const UNTHEMED_PREFIXES = ['/admin', '/scanner', '/halloween'];

export const isThemedPath = (pathname: string) =>
  !UNTHEMED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const effectiveTheme = (): SiteTheme => {
  const s = useSiteThemeStore.getState();
  return s.previewTheme ?? s.liveTheme;
};

/** Writes `data-theme` on <html>; global CSS tokens/overrides key off it. Call again after route changes. */
export const syncDocumentTheme = (pathname: string = window.location.pathname) => {
  document.documentElement.dataset.theme = isThemedPath(pathname) ? effectiveTheme() : 'default';
};

let bootstrapped = false;

/** Call once before rendering: applies the theme to <html>, loads + subscribes to the live value. */
export const bootstrapSiteTheme = () => {
  if (bootstrapped || typeof window === 'undefined') return;
  bootstrapped = true;

  syncDocumentTheme();
  useSiteThemeStore.subscribe(() => syncDocumentTheme());

  // Re-check when the tab regains focus (date window may have ended / admin may have flipped it)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void useSiteThemeStore.getState().refresh();
  });

  if (!ADMIN_THEME_SWITCH) return;

  void useSiteThemeStore.getState().refresh();

  // Live updates when an admin flips the switch (requires realtime on the table)
  supabase
    .channel('site_settings_theme')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: SETTINGS_TABLE, filter: `key=eq.${THEME_KEY}` },
      (payload) => {
        const value = (payload.new as { value?: unknown } | null)?.value;
        if (isSiteTheme(value)) {
          storage.set('local', CACHE_KEY, value);
          useSiteThemeStore.setState({ liveTheme: value });
        }
      }
    )
    .subscribe();
};
