import { AlertTriangle, ArrowUpRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useSiteThemeStore } from '../../theme/siteTheme';
import { ADMIN_THEME_SWITCH, HALLOWEEN_END, HALLOWEEN_START, SITE_THEME } from '../../theme/config';
import { JackOLantern } from '../halloween/decorations';

const formatLondon = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' });

const PreviewLink = () => (
  <a
    href="/?theme=halloween"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-0.5 text-xs font-medium text-zinc-500 hover:text-zinc-900"
    title="Preview the Halloween design in a new tab (only you see it)"
  >
    Preview <ArrowUpRight className="h-3 w-3" />
  </a>
);

const Shell = ({ on, children }: { on: boolean; children: React.ReactNode }) => (
  <div
    className={cn(
      'rounded-xl border px-3 py-2.5 text-[13px]',
      on ? 'border-orange-200 bg-orange-50/70' : 'border-zinc-200 bg-zinc-50/60'
    )}
  >
    {children}
  </div>
);

/** Read-only status while the theme is controlled from src/theme/config.ts. */
const CodeThemeStatus = () => {
  const on = useSiteThemeStore((s) => s.liveTheme) === 'halloween';
  const now = Date.now();

  let detail: string;
  if (SITE_THEME === 'halloween') detail = 'Forced on';
  else if (SITE_THEME === 'default') detail = 'Forced off';
  else if (on) detail = `Ends ${formatLondon(HALLOWEEN_END)}`;
  else if (now < Date.parse(HALLOWEEN_START)) detail = `Starts ${formatLondon(HALLOWEEN_START)}`;
  else detail = 'Season over';

  return (
    <Shell on={on}>
      <div className="flex items-center gap-2" title="Set in src/theme/config.ts (SITE_THEME) - change it and redeploy">
        <JackOLantern className={cn('h-4 w-4 shrink-0', !on && 'opacity-50 grayscale')} lit={on} />
        <span className="flex-1 font-medium text-zinc-800">Halloween</span>
        <span
          className={cn(
            'rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide',
            on ? 'bg-orange-500 text-white' : 'bg-zinc-200 text-zinc-500'
          )}
        >
          {on ? 'On' : 'Off'}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 pl-6">
        <span className="truncate text-xs text-zinc-500" title="Set in src/theme/config.ts">{detail}</span>
        <PreviewLink />
      </div>
    </Shell>
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
    <Shell on={on}>
      <div className="flex items-center gap-2">
        <JackOLantern className={cn('h-4 w-4 shrink-0', !on && 'opacity-50 grayscale')} lit={on} />
        <span className="flex-1 font-medium text-zinc-800">Halloween</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Halloween mode"
          onClick={toggle}
          disabled={busy}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-60',
            on ? 'bg-orange-500' : 'bg-zinc-300'
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 grid h-4 w-4 place-items-center rounded-full bg-white shadow transition-transform',
              on && 'translate-x-4'
            )}
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />}
          </span>
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 pl-6">
        <span className="text-xs text-zinc-500">{status === 'idle' || status === 'loading' ? 'Checking…' : on ? 'Live for everyone' : 'Off'}</span>
        <PreviewLink />
      </div>
      {error && (
        <p className="mt-2 flex items-start gap-1.5 pl-6 text-xs text-red-600">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            {error}{' '}
            <button type="button" onClick={() => void refresh()} className="font-semibold underline">
              Retry
            </button>
          </span>
        </p>
      )}
    </Shell>
  );
};

const SiteThemeToggle = ADMIN_THEME_SWITCH ? AdminThemeSwitch : CodeThemeStatus;

export default SiteThemeToggle;
