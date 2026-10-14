import { useId, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';
import { useSiteTheme } from '../../theme/siteTheme';

/* Small, dependency-free SVG decorations for the Halloween theme.
   Everything is aria-hidden and pointer-events-none. */

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');

/* ------------------------------------------------------------------ */
/* Bat                                                                 */
/* ------------------------------------------------------------------ */

export const Bat = ({ className, style, flap = true }: { className?: string; style?: CSSProperties; flap?: boolean }) => (
  <svg viewBox="0 0 64 32" className={cn('overflow-visible', className)} style={style} aria-hidden="true" fill="currentColor">
    <path
      className={flap ? 'hw-bat-wing-l' : undefined}
      d="M30 14C24 6 14 4 2 8c4 2 6 5 6 8 3-2 6-1 8 2 2-3 5-3 8 1 2-3 4-3 6-1z"
    />
    <path
      className={flap ? 'hw-bat-wing-r' : undefined}
      d="M34 14c6-8 16-10 28-6-4 2-6 5-6 8-3-2-6-1-8 2-2-3-5-3-8 1-2-3-4-3-6-1z"
    />
    <ellipse cx="32" cy="17.5" rx="3.6" ry="5.8" />
    <circle cx="32" cy="11.5" r="3.1" />
    <path d="M29.6 10 29 5.6l2.1 3zM34.4 10l.6-4.4-2.1 3z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Cobweb (drawn for the top-left corner; mirror with -scale-x-100)    */
/* ------------------------------------------------------------------ */

const WEB_PATH = (() => {
  const angles = [0, 14, 29, 45, 61, 76, 90].map((deg) => (deg * Math.PI) / 180);
  const jitter = [0, 0.05, -0.04, 0.06, -0.03, 0.04, 0];
  const rings = [15, 29, 44, 60, 77, 95];
  const p = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;

  let d = angles.map((a) => `M0 0L${p(150, a)}`).join('');
  rings.forEach((ring, ri) => {
    angles.forEach((a, i) => {
      const r = ring * (1 + (i === 0 || i === angles.length - 1 ? 0 : jitter[(i + ri) % jitter.length]));
      if (i === 0) {
        d += `M${p(r, a)}`;
      } else {
        const mid = (angles[i - 1] + a) / 2;
        d += `Q${p(r * 0.82, mid)} ${p(r, a)}`;
      }
    });
  });
  return d;
})();

export const Cobweb = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg viewBox="0 0 100 100" className={cn('overflow-hidden', className)} style={style} aria-hidden="true">
    <path d={WEB_PATH} fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Jack-o'-lantern                                                     */
/* ------------------------------------------------------------------ */

export const JackOLantern = ({ className, lit = true }: { className?: string; lit?: boolean }) => {
  const id = safeId(useId());
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-body`} cx="40%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ffb347" />
          <stop offset="55%" stopColor="#ff7a1a" />
          <stop offset="100%" stopColor="#a83700" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="#fff7c7" />
          <stop offset="55%" stopColor="#ffd23f" />
          <stop offset="100%" stopColor="#ff9f1a" />
        </radialGradient>
      </defs>
      <path d="M30.5 21c-.4-4.6 1.2-8.8 5.4-11.6l2.7 2.6c-3 2.1-4.4 5-4.2 9z" fill="#5b7f1e" />
      <g fill={`url(#${id}-body)`} stroke="#8a2c00" strokeOpacity="0.55" strokeWidth="1">
        <ellipse cx="20" cy="40" rx="14" ry="19" />
        <ellipse cx="44" cy="40" rx="14" ry="19" />
        <ellipse cx="32" cy="40" rx="13" ry="20.5" />
      </g>
      <g
        className={lit ? 'hw-flicker' : undefined}
        fill={`url(#${id}-face)`}
        style={{ filter: 'drop-shadow(0 0 2.5px #ffcc33)' }}
      >
        <path d="M17 36l5-8 5 8z" />
        <path d="M37 36l5-8 5 8z" />
        <path d="M30 42l2-4 2 4z" />
        <path d="M15.5 45c5 2 9 2.5 11 1l2.5 3 3-3 3 3 2.5-3c2 1.5 6 1 11-1-2 7-8.5 11.5-16.5 11.5S17.5 52 15.5 45z" />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Moon                                                                */
/* ------------------------------------------------------------------ */

export const Moon = ({ className }: { className?: string }) => {
  const id = safeId(useId());
  return (
    <div className={cn('pointer-events-none', className)} aria-hidden="true">
      <svg
        viewBox="0 0 100 100"
        className="hw-anim h-full w-full"
        style={{ animation: 'hw-glow-pulse 6s ease-in-out infinite' }}
      >
        <defs>
          <radialGradient id={`${id}-moon`} cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#fffbea" />
            <stop offset="55%" stopColor="#f7e2a4" />
            <stop offset="100%" stopColor="#d8ae5d" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill={`url(#${id}-moon)`} />
        <g fill="#b98d45" opacity="0.28">
          <circle cx="35" cy="38" r="8" />
          <circle cx="62" cy="30" r="5" />
          <circle cx="58" cy="62" r="11" />
          <circle cx="30" cy="66" r="4.5" />
          <circle cx="74" cy="50" r="3.5" />
        </g>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Dangling spider                                                     */
/* ------------------------------------------------------------------ */

export const DanglingSpider = ({
  className,
  thread = 120,
  duration = 6,
}: {
  className?: string;
  /** Resting thread length in px */
  thread?: number;
  duration?: number;
}) => (
  <div className={cn('pointer-events-none absolute -top-10 z-[1]', className)} aria-hidden="true">
    <div className="hw-anim flex flex-col items-center" style={{ animation: `hw-dangle ${duration}s ease-in-out infinite` }}>
      <div className="w-px bg-gradient-to-b from-white/0 via-white/35 to-white/60" style={{ height: thread + 40 }} />
      <svg
        viewBox="0 0 40 40"
        className="hw-anim -mt-1 h-9 w-9"
        style={{ animation: 'hw-swing 3.4s ease-in-out infinite', transformOrigin: '50% 0%' }}
      >
        <g fill="none" stroke="#0b0610" strokeWidth="1.6" strokeLinecap="round">
          <path d="M16 17Q8 9 3 13M15.5 20Q6 16 2 21M15.5 23Q6 25 3 31M16 26Q9 32 6 38" />
          <path d="M24 17Q32 9 37 13M24.5 20Q34 16 38 21M24.5 23Q34 25 37 31M24 26Q31 32 34 38" />
        </g>
        <g fill="#120a18" stroke="rgb(255 255 255 / 0.28)" strokeWidth="0.6">
          <ellipse cx="20" cy="25" rx="7" ry="8.2" />
          <circle cx="20" cy="14.5" r="4.6" />
        </g>
        <circle cx="18.3" cy="14" r="1.1" fill="#ff7a1a" />
        <circle cx="21.7" cy="14" r="1.1" fill="#ff7a1a" />
      </svg>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Drip divider - tiles horizontally at natural size                   */
/* ------------------------------------------------------------------ */

const DRIP_TILE = 640;
const DRIP_PATH = (() => {
  const base = 7;
  // [centerX, width, length]
  const drips: [number, number, number][] = [
    [34, 14, 16], [92, 9, 9], [150, 18, 30], [214, 10, 12], [268, 13, 22],
    [330, 8, 8], [384, 20, 34], [452, 11, 14], [512, 15, 24], [578, 9, 11],
  ];
  let d = `M0 0H${DRIP_TILE}V${base}`;
  [...drips].reverse().forEach(([x, w, len]) => {
    const r = x + w / 2;
    const l = x - w / 2;
    const tip = base + len;
    d += `L${r + 5} ${base}Q${r} ${base} ${r} ${base + 4}`;
    d += `C${r} ${tip - w * 0.2} ${r - w * 0.05} ${tip} ${x} ${tip}`;
    d += `C${l + w * 0.05} ${tip} ${l} ${tip - w * 0.2} ${l} ${base + 4}`;
    d += `Q${l} ${base} ${l - 5} ${base}`;
  });
  return `${d}L0 ${base}Z`;
})();

export const DripDivider = ({ className, height = 44 }: { className?: string; height?: number }) => {
  const id = safeId(useId());
  return (
    <svg
      className={cn('pointer-events-none block w-full', className)}
      height={height}
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 6px 10px rgb(var(--glow) / 0.35))' }}
    >
      <defs>
        <pattern id={id} width={DRIP_TILE} height={height} patternUnits="userSpaceOnUse">
          <path d={DRIP_PATH} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Section-level helpers (render nothing unless Halloween is active)   */
/* ------------------------------------------------------------------ */

/** Cobwebs in the top corners of a `relative` section. */
export const HauntedCorners = ({ className, size = 'h-28 w-28 md:h-44 md:w-44' }: { className?: string; size?: string }) => {
  const { isHalloween } = useSiteTheme();
  if (!isHalloween) return null;
  return (
    <div className={cn('pointer-events-none absolute inset-x-0 top-0 z-[1]', className)} aria-hidden="true">
      <Cobweb className={cn('absolute left-0 top-0 text-white/25', size)} />
      <Cobweb className={cn('absolute right-0 top-0 -scale-x-100 text-white/25', size)} />
    </div>
  );
};

/** Low drifting fog along the bottom of a `relative` section. */
export const SectionFog = ({ className }: { className?: string }) => {
  const { isHalloween } = useSiteTheme();
  if (!isHalloween) return null;
  return (
    <div className={cn('pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-48 overflow-hidden', className)} aria-hidden="true">
      <div
        className="hw-anim absolute -inset-x-1/4 bottom-[-30%] h-full opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 30% 55% at 25% 70%, rgb(196 181 253 / 0.22), transparent 70%), radial-gradient(ellipse 35% 60% at 70% 80%, rgb(226 232 240 / 0.16), transparent 70%)',
          animation: 'hw-fog 18s ease-in-out infinite alternate',
        }}
      />
    </div>
  );
};

/** Pumpkin-orange drip hanging from the top edge of a `relative` section. */
export const SectionDrip = ({ className }: { className?: string }) => {
  const { isHalloween } = useSiteTheme();
  if (!isHalloween) return null;
  return (
    <div className={cn('pointer-events-none absolute inset-x-0 top-0 z-[2] text-accent', className)} aria-hidden="true">
      <DripDivider />
    </div>
  );
};
