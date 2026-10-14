import { Eye, X } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { isThemedPath, useSiteTheme, useSiteThemeStore } from '../../theme/siteTheme';

const LABEL = { default: 'Standard', halloween: 'Halloween' } as const;

/** Floating reminder shown while `?theme=...` preview is active in this tab. */
const ThemePreviewBadge = () => {
  const { theme, isPreview } = useSiteTheme();
  const liveTheme = useSiteThemeStore((s) => s.liveTheme);
  const setPreviewTheme = useSiteThemeStore((s) => s.setPreviewTheme);
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!isPreview || !isThemedPath(pathname)) return null;

  const exit = () => {
    setPreviewTheme(null);
    if (searchParams.has('theme')) {
      const next = new URLSearchParams(searchParams);
      next.delete('theme');
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-white/15 bg-black/80 py-1.5 pl-3 pr-1.5 text-xs text-white shadow-2xl backdrop-blur-md">
      <Eye className="h-3.5 w-3.5 shrink-0 text-accent" />
      <span className="truncate">
        Previewing <strong className="font-semibold">{LABEL[theme]}</strong>
        <span className="text-white/50"> · live site: {LABEL[liveTheme]}</span>
      </span>
      <button
        type="button"
        onClick={exit}
        className="inline-flex h-7 min-h-0 min-w-0 shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 font-semibold transition hover:bg-white/20"
      >
        <X className="h-3 w-3" /> Exit
      </button>
    </div>
  );
};

export default ThemePreviewBadge;
