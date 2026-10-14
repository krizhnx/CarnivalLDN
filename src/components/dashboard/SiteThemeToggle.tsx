import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useSiteThemeStore } from '../../theme/siteTheme';
import { ADMIN_THEME_SWITCH, HALLOWEEN_END, HALLOWEEN_START, SITE_THEME } from '../../theme/config';
import { JackOLantern } from '../halloween/decorations';

const formatLondon = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });

const PreviewLink = () => (
  <a
    href="/?theme=halloween"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-sm text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
    title="Preview the Halloween design in a new tab (only you see it)"
  >
    Preview <ExternalLink className="h-3.5 w-3.5" />
  </a>
);

/** Read-only status while the theme is controlled from src/theme/config.ts. */
const CodeThemeStatus = () => {
  const on = useSiteThemeStore((s) => s.liveTheme) === 'halloween';
  const now = Date.now();

  let detail: string;
  if (SITE_THEME === 'halloween') detail = 'forced on';
  else if (SITE_THEME === 'default') detail = 'forced off';
  else if (on) detail = `auto-off ${formatLondon(HALLOWEEN_END)}`;
  else if (now < Date.parse(HALLOWEEN_START)) detail = `starts ${formatLondon(HALLOWEEN_START)}`;
  else detail = 'season over';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className={cn(
          'inline-flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium',
          on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-gray-300 bg-white text-gray-700'
        )}
        title="Set in src/theme/config.ts (SITE_THEME) - change it and redeploy"
      >
        <JackOLantern className={cn('h-5 w-5', !on && 'grayscale opacity-60')} lit={on} />
        <span>
          Halloween mode: <strong className={on ? 'text-orange-600' : 'text-gray-500'}>{on ? 'ON' : 'OFF'}</strong>
        </span>
        <span className="text-xs text-gray-500">· {detail} · set in code</span>
      </div>
      <PreviewLink />
    </div>
  );
};

/**
 * Admin switch for the seasonal site theme (only when ADMIN_THEME_SWITCH is on).
 * Writes `site_settings.theme` in Supabase; open public pages pick the change up
 * via realtime (or on next focus/visit).
 */
const AdminThemeSwitch = () => {
  const liveTheme = useSiteThemeStore((s) => s.liveTheme);
  const status = useSiteThemeStore((s) => s.status);
  const error = useSiteThemeStore((s) => s.error);
  const saving = useSiteThemeStore((s) => s.saving);
  const setLiveTheme = useSiteThemeStore((s) => s.setLiveTheme);
  const refresh = useSiteThemeStore((s) => s.refresh);

  const on = liveTheme === 'halloween';
  const busy = saving || status === 'loading' || status === 'idle';

  const toggle = async () => {
    const next = on ? 'default' : 'halloween';
    const message = on
      ? 'Turn OFF Halloween mode?\n\nThe live site will switch back to the standard design for all visitors.'
      : 'Turn ON Halloween mode?\n\nAll visitors will see the Halloween design immediately.';
    if (!window.confirm(message)) return;

    const ok = await setLiveTheme(next);
    if (ok) {
      toast.success(next === 'halloween' ? 'Halloween mode is live 🎃' : 'Standard theme restored');
    } else {
      toast.error(useSiteThemeStore.getState().error ?? 'Could not update the site theme');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Halloween mode"
        onClick={toggle}
        disabled={busy}
        className={cn(
          'group inline-flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-70',
          on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <JackOLantern className={cn('h-5 w-5 transition', !on && 'grayscale opacity-60')} lit={on} />
        <span>Halloween mode</span>
        <span
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
            on ? 'bg-orange-500' : 'bg-gray-300'
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 grid h-4 w-4 place-items-center rounded-full bg-white shadow transition-transform',
              on && 'translate-x-4'
            )}
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin text-gray-500" />}
          </span>
        </span>
        <span className={cn('text-xs font-semibold uppercase tracking-wide', on ? 'text-orange-600' : 'text-gray-400')}>
          {status === 'idle' || status === 'loading' ? '…' : on ? 'Live' : 'Off'}
        </span>
      </button>

      <PreviewLink />

      {error && (
        <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
          <button type="button" onClick={() => void refresh()} className="font-semibold underline">
            Retry
          </button>
        </span>
      )}
    </div>
  );
};

const SiteThemeToggle = ADMIN_THEME_SWITCH ? AdminThemeSwitch : CodeThemeStatus;

export default SiteThemeToggle;
