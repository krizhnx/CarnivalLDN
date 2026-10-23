import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/* Dependency-free SVG decorations for the Diwali theme. Everything is
   aria-hidden and pointer-events-none; animations use the dw-* keyframes in
   index.css and switch off for prefers-reduced-motion. */

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');

// Deterministic pseudo-random so layouts are stable between renders
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const MARIGOLD = [
  { base: '#f97316', dark: '#b8400a' }, // orange
  { base: '#facc15', dark: '#c58a06' }, // yellow
  { base: '#fb923c', dark: '#c2410c' }, // light orange
  { base: '#fbbf24', dark: '#b97708' }, // amber
];

/* ------------------------------------------------------------------ */
/* Diya (clay oil lamp with a flickering flame)                         */
/* ------------------------------------------------------------------ */

export const Diya = ({ className, style, delay = 0 }: { className?: string; style?: CSSProperties; delay?: number }) => {
  const id = safeId(useId());
  const dots = [
    [13, 42.2],
    [19.5, 45],
    [26.5, 46.8],
    [33.5, 47.7],
    [40.5, 47.9],
    [47.5, 47.3],
    [54.5, 45.8],
    [61, 43.4],
  ];
  return (
    <svg viewBox="0 0 80 64" className={cn('overflow-visible', className)} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#ff9a2e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff7a00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-body`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f08a43" />
          <stop offset="45%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#6b2109" />
        </linearGradient>
        <linearGradient id={`${id}-flame`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stopColor="#ff5a00" />
          <stop offset="45%" stopColor="#ffa31a" />
          <stop offset="100%" stopColor="#fff1b8" />
        </linearGradient>
      </defs>

      {/* Light */}
      <circle
        className="dw-anim"
        cx="70"
        cy="18"
        r="24"
        fill={`url(#${id}-glow)`}
        style={{ animation: `dw-glow 2.4s ease-in-out ${-delay}s infinite` }}
      />

      {/* Foot + bowl */}
      <ellipse cx="40" cy="56.5" rx="11" ry="3" fill="#4a1606" />
      <path
        d="M6 34C8 48 24 56 40 56c14 0 24-7 30-18l7-10c-7 5-13 9-25 11-16 2-36 1-46-5z"
        fill={`url(#${id}-body)`}
      />
      <path d="M9 37c3 7 10 12 18 15" fill="none" stroke="#ffb27a" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />
      {dots.map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="1.25" fill="#fcd34d" />
      ))}
      <path d="M17 50.5c8 3.5 22 4.2 34 .6" fill="none" stroke="#f9a8d4" strokeOpacity="0.7" strokeWidth="1" strokeDasharray="2 2.2" />

      {/* Oil + rim */}
      <path d="M6 34c12-6 40-7 56-4l15-2c-7 5-13 9-25 11-16 2-36 1-46-5z" fill="#3a1204" />
      <path d="M6 34c10 6 30 7 46 5 12-2 18-6 25-11" fill="none" stroke="#fbbf24" strokeWidth="1.3" strokeLinecap="round" />

      {/* Wick + flame */}
      <path d="M71.5 29.5 70 25.5" stroke="#2a0d03" strokeWidth="1.6" strokeLinecap="round" />
      <g
        className="dw-anim"
        style={{
          transformBox: 'fill-box',
          transformOrigin: '50% 100%',
          animation: `dw-flame ${1.6 + (delay % 0.7)}s ease-in-out ${-delay}s infinite`,
        }}
      >
        <path d="M70 27c-6-5-5.2-13 0-23 5.2 10 6 18 0 23z" fill={`url(#${id}-flame)`} />
        <path d="M70 26c-2.8-2.8-2.4-7.4 0-13 2.4 5.6 2.8 10.2 0 13z" fill="#fffbe6" />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Rangoli / mandala                                                    */
/* ------------------------------------------------------------------ */

const petal = (inner: number, outer: number, width: number) => {
  const mid1 = inner + (outer - inner) * 0.3;
  const mid2 = inner + (outer - inner) * 0.75;
  return `M0 ${-inner}C${width} ${-mid1} ${width} ${-mid2} 0 ${-outer}C${-width} ${-mid2} ${-width} ${-mid1} 0 ${-inner}Z`;
};

const ring = (n: number, offsetDeg = 0) => Array.from({ length: n }, (_, i) => offsetDeg + (360 / n) * i);

/**
 * Concentric rangoli. `line` is a single-colour outline (uses currentColor) for
 * faint backdrops; `color` is the full festive palette.
 */
export const Rangoli = ({
  className,
  variant = 'line',
  spin,
  style,
}: {
  className?: string;
  variant?: 'line' | 'color';
  /** Seconds per revolution (omit for static) */
  spin?: number;
  style?: CSSProperties;
}) => {
  const line = variant === 'line';
  const P = {
    outer: line ? 'none' : '#db2777',
    mid: line ? 'none' : '#f97316',
    midInner: line ? 'none' : '#facc15',
    inner: line ? 'none' : '#fde047',
    dots: line ? 'currentColor' : '#fbbf24',
    stroke: line ? 'currentColor' : '#fff3c4',
  };
  const sw = line ? 1.1 : 0.8;

  return (
    <svg
      viewBox="-100 -100 200 200"
      className={cn(spin && 'dw-anim', className)}
      style={{ ...(spin ? { animation: `dw-spin ${spin}s linear infinite` } : null), ...style }}
      aria-hidden="true"
    >
      <g stroke={P.stroke} strokeWidth={sw} strokeLinejoin="round">
        {ring(32).map((a) => (
          <circle key={`d${a}`} cx="0" cy="-94" r="2.2" fill={P.dots} stroke="none" transform={`rotate(${a})`} />
        ))}
        {ring(16).map((a) => (
          <path key={`o${a}`} d={petal(62, 89, 10)} fill={P.outer} transform={`rotate(${a})`} />
        ))}
        {ring(16, 11.25).map((a) => (
          <circle key={`od${a}`} cx="0" cy="-66" r="1.8" fill={P.dots} stroke="none" transform={`rotate(${a})`} />
        ))}
        <circle r="58" fill="none" />
        <circle r="54" fill="none" strokeDasharray="1.5 3.5" />
        {ring(12).map((a) => (
          <g key={`m${a}`} transform={`rotate(${a})`}>
            <path d={petal(26, 50, 13)} fill={P.mid} />
            <path d={petal(31, 45, 6)} fill={P.midInner} />
          </g>
        ))}
        {ring(12, 15).map((a) => (
          <circle key={`md${a}`} cx="0" cy="-42" r="2" fill={P.dots} stroke="none" transform={`rotate(${a})`} />
        ))}
        <circle r="23" fill="none" />
        {ring(8).map((a) => (
          <path key={`i${a}`} d={petal(6, 21, 6)} fill={P.inner} transform={`rotate(${a})`} />
        ))}
        <circle r="4.5" fill={line ? 'currentColor' : '#ffffff'} />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Marigolds                                                            */
/* ------------------------------------------------------------------ */

const Marigold = ({ cx, cy, r, tone }: { cx: number; cy: number; r: number; tone: number }) => {
  const c = MARIGOLD[tone % MARIGOLD.length];
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={c.base} />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.7}
        fill="none"
        stroke={c.dark}
        strokeOpacity="0.55"
        strokeWidth={r * 0.3}
        strokeDasharray={`${(r * 0.32).toFixed(2)} ${(r * 0.22).toFixed(2)}`}
      />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={c.dark} opacity="0.5" />
      <circle cx={cx - r * 0.35} cy={cy - r * 0.4} r={r * 0.22} fill="#fff" opacity="0.25" />
    </g>
  );
};

const Leaf = ({ x, y, angle, size = 1 }: { x: number; y: number; angle: number; size?: number }) => (
  <path
    d={`M0 0C${4 * size} ${4 * size} ${4 * size} ${12 * size} 0 ${17 * size}C${-4 * size} ${12 * size} ${-4 * size} ${4 * size} 0 0Z`}
    fill="#3f8f2f"
    stroke="#2a6a1f"
    strokeWidth="0.6"
    transform={`translate(${x} ${y}) rotate(${angle})`}
  />
);

const Bell = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-4 6C-4 1-2.5-1 0-1s4 2 4 7z" fill="#f2b33d" stroke="#a56b0c" strokeWidth="0.6" />
    <rect x="-5" y="5.6" width="10" height="1.6" rx="0.8" fill="#d99a22" />
    <circle cx="0" cy="8.6" r="1.3" fill="#a56b0c" />
  </g>
);

/** Vertical string of marigolds ("ladi") that sways from its top edge. */
export const MarigoldStrand = ({
  count = 12,
  className,
  style,
  seed = 1,
  sway = true,
}: {
  count?: number;
  className?: string;
  style?: CSSProperties;
  seed?: number;
  sway?: boolean;
}) => {
  const step = 12.5;
  const h = count * step + 20;
  return (
    <svg
      viewBox={`0 0 20 ${h}`}
      width={20}
      height={h}
      className={cn('overflow-visible', sway && 'dw-anim', className)}
      style={{
        transformOrigin: '50% 0',
        ...(sway ? { animation: `dw-sway ${5 + rand(seed) * 3}s ease-in-out ${-rand(seed + 3) * 6}s infinite` } : null),
        ...style,
      }}
      aria-hidden="true"
    >
      <line x1="10" y1="0" x2="10" y2={count * step} stroke="#7c2d12" strokeWidth="0.8" />
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          {i > 0 && i % 4 === 0 && (
            <>
              <Leaf x={10} y={4 + i * step} angle={-70} size={0.7} />
              <Leaf x={10} y={4 + i * step} angle={70} size={0.7} />
            </>
          )}
          <Marigold cx={10} cy={7 + i * step} r={6.3} tone={(i + seed) % 4} />
        </g>
      ))}
      <Bell x={10} y={count * step + 2} />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Toran - swagged marigold garland along the top of a section          */
/* ------------------------------------------------------------------ */

const ToranKnot = ({ x }: { x: number }) => (
  <g>
    <Leaf x={x} y={4} angle={-38} />
    <Leaf x={x} y={4} angle={38} />
    <Leaf x={x} y={4} angle={0} size={1.15} />
    <line x1={x} y1="6" x2={x} y2="50" stroke="#7c2d12" strokeWidth="0.8" />
    <Marigold cx={x} cy={26} r={6} tone={1} />
    <Marigold cx={x} cy={37.5} r={5.6} tone={0} />
    <Marigold cx={x} cy={48} r={5.2} tone={1} />
    <Bell x={x} y={54} />
    <Marigold cx={x} cy={8} r={7.2} tone={3} />
  </g>
);

const useElementWidth = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
};

/** Marigold garland that swags across the full width; whole swags only, sized from the container width. */
export const Toran = ({ className }: { className?: string }) => {
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const layout = useMemo(() => {
    if (!width) return null;
    const target = width < 640 ? 130 : 190;
    const n = Math.max(2, Math.round(width / target));
    const sw = width / n;
    const sag = Math.min(54, Math.max(30, sw * 0.28));
    const perSwag = Math.max(7, Math.round(sw / 14));
    const swags = Array.from({ length: n }, (_, i) => {
      const x0 = i * sw;
      const cx = x0 + sw / 2;
      const cy = 6 + sag * 2;
      const flowers = Array.from({ length: perSwag }, (_, j) => {
        const t = 0.08 + (0.84 * j) / (perSwag - 1);
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * (x0 + sw);
        const y = (1 - t) * (1 - t) * 6 + 2 * (1 - t) * t * cy + t * t * 6;
        return { x, y, tone: (i + j) % 4 };
      });
      return { d: `M${x0} 6Q${cx} ${cy} ${x0 + sw} 6`, flowers };
    });
    const knots = Array.from({ length: n + 1 }, (_, i) => i * sw);
    return { swags, knots, height: Math.max(6 + sag + 10, 66) };
  }, [width]);

  return (
    <div ref={ref} className={cn('pointer-events-none w-full', className)} aria-hidden="true">
      {layout && (
        <svg
          width={width}
          height={layout.height}
          viewBox={`0 0 ${width} ${layout.height}`}
          className="block overflow-visible"
          style={{ filter: 'drop-shadow(0 6px 8px rgb(0 0 0 / 0.45))' }}
        >
          <rect y="0" width={width} height="3" fill="#9a3412" />
          <rect y="0" width={width} height="1" fill="#fbbf24" opacity="0.8" />
          {layout.swags.map((s, i) => (
            <g key={i}>
              <path d={s.d} fill="none" stroke="#7c2d12" strokeWidth="1" />
              {s.flowers.map((f, j) => (
                <Marigold key={j} cx={f.x} cy={f.y} r={6.4} tone={f.tone} />
              ))}
            </g>
          ))}
          {layout.knots.map((x) => (
            <ToranKnot key={x} x={Math.min(width - 8, Math.max(8, x))} />
          ))}
        </svg>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Hanging lantern (akash kandil)                                        */
/* ------------------------------------------------------------------ */

export const Lantern = ({
  className,
  string = 60,
  delay = 0,
  hue = 'saffron',
}: {
  className?: string;
  string?: number;
  delay?: number;
  hue?: 'saffron' | 'rani';
}) => {
  const id = safeId(useId());
  const [c1, c2, c3] = hue === 'rani' ? ['#ffe1a8', '#f472b6', '#9d174d'] : ['#fff1b8', '#fb923c', '#b4231a'];
  const top = string;
  return (
    <svg
      viewBox={`0 0 48 ${top + 74}`}
      className={cn('dw-anim overflow-visible', className)}
      style={{ transformOrigin: '50% 0', animation: `hw-swing ${5.5 + delay}s ease-in-out ${-delay * 2}s infinite` }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-b`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="55%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </radialGradient>
        <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c2} stopOpacity="0.55" />
          <stop offset="100%" stopColor={c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1="24" y1="0" x2="24" y2={top} stroke="#d6a24a" strokeOpacity="0.7" strokeWidth="0.8" />
      <circle className="dw-anim" cx="24" cy={top + 30} r="34" fill={`url(#${id}-g)`} style={{ animation: `dw-glow 3s ease-in-out ${-delay}s infinite` }} />
      <path d={`M17 ${top}h14l5 6H12z`} fill="#e9b04a" stroke="#9a6514" strokeWidth="0.6" />
      <path d={`M12 ${top + 6}h24q9 20 0 40H12q-9-20 0-40z`} fill={`url(#${id}-b)`} />
      <g fill="none" stroke={c3} strokeOpacity="0.35" strokeWidth="0.8">
        <path d={`M18 ${top + 6}q-4 20 0 40`} />
        <path d={`M24 ${top + 6}v40`} />
        <path d={`M30 ${top + 6}q4 20 0 40`} />
      </g>
      <path d={`M24 ${top + 18}l6 8-6 8-6-8z`} fill="#fffbe6" opacity="0.75" />
      <path d={`M12 ${top + 46}h24l-5 6H17z`} fill="#e9b04a" stroke="#9a6514" strokeWidth="0.6" />
      <g stroke={c2} strokeWidth="1.1" strokeLinecap="round">
        {[18, 21, 24, 27, 30].map((x, i) => (
          <line key={x} x1={x} y1={top + 52} x2={x + (i - 2) * 0.6} y2={top + 66 + (i % 2) * 3} />
        ))}
      </g>
      <circle cx="24" cy={top + 54} r="1.8" fill="#e9b04a" />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Fireworks                                                            */
/* ------------------------------------------------------------------ */

const FIREWORK_COLOURS = ['#ffd166', '#f472b6', '#fff4d6', '#fb923c', '#fbbf24', '#f9a8d4'];

interface Burst {
  left: number; // %
  top: number; // %
  radius: number; // px
  colour: string;
  delay: number; // s
}

const DESKTOP_BURSTS: Burst[] = [
  { left: 13, top: 22, radius: 78, colour: FIREWORK_COLOURS[0], delay: 0 },
  { left: 85, top: 18, radius: 88, colour: FIREWORK_COLOURS[1], delay: 1.3 },
  { left: 26, top: 40, radius: 52, colour: FIREWORK_COLOURS[2], delay: 2.5 },
  { left: 74, top: 36, radius: 60, colour: FIREWORK_COLOURS[3], delay: 3.4 },
  { left: 7, top: 52, radius: 46, colour: FIREWORK_COLOURS[5], delay: 4.4 },
  { left: 93, top: 48, radius: 50, colour: FIREWORK_COLOURS[4], delay: 5.2 },
  { left: 36, top: 16, radius: 44, colour: FIREWORK_COLOURS[1], delay: 6.1 },
  { left: 64, top: 14, radius: 48, colour: FIREWORK_COLOURS[0], delay: 7 },
];

const MOBILE_BURSTS: Burst[] = [
  { left: 20, top: 17, radius: 52, colour: FIREWORK_COLOURS[0], delay: 0 },
  { left: 80, top: 22, radius: 58, colour: FIREWORK_COLOURS[1], delay: 1.6 },
  { left: 70, top: 12, radius: 38, colour: FIREWORK_COLOURS[2], delay: 3.2 },
  { left: 28, top: 28, radius: 40, colour: FIREWORK_COLOURS[3], delay: 4.6 },
];

const CYCLE = 8; // seconds per burst loop

export const Fireworks = ({ className }: { className?: string }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  if (reducedMotion) return null;
  const bursts = isMobile ? MOBILE_BURSTS : DESKTOP_BURSTS;
  const sparks = isMobile ? 14 : 18;

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {bursts.map((b, bi) => (
        <div key={bi} className="absolute h-0 w-0" style={{ left: `${b.left}%`, top: `${b.top}%` }}>
          <span
            className="dw-anim absolute -left-10 -top-10 h-20 w-20 rounded-full opacity-0"
            style={{
              background: `radial-gradient(circle, ${b.colour}88, transparent 65%)`,
              animation: `dw-flash ${CYCLE}s ease-out ${b.delay}s infinite`,
            }}
          />
          {Array.from({ length: sparks }, (_, i) => {
            const angle = (360 / sparks) * i + rand(bi * 31 + i) * 8;
            const r = b.radius * (0.82 + rand(bi * 17 + i) * 0.3);
            return (
              <span
                key={i}
                className="dw-anim absolute -ml-px -mt-[6px] h-3 w-[2px] rounded-full opacity-0"
                style={{
                  background: `linear-gradient(to top, transparent, ${b.colour})`,
                  boxShadow: `0 0 6px ${b.colour}`,
                  ['--a' as string]: `${angle.toFixed(1)}deg`,
                  ['--r' as string]: `${r.toFixed(0)}px`,
                  animation: `dw-burst ${CYCLE}s cubic-bezier(0.15, 0.7, 0.3, 1) ${b.delay}s infinite`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Rising gold sparkles                                                 */
/* ------------------------------------------------------------------ */

const SPARK_COLOURS = ['#ffd166', '#fbbf24', '#fff1c1', '#fb923c', '#f9a8d4'];

export const Sparkles = ({ count = 18, className }: { count?: number; className?: string }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const n = isMobile ? Math.ceil(count / 2) : count;
  const sparks = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const size = 2 + Math.round(rand(i + 21) * 2.5);
        const duration = 9 + rand(i + 4) * 10;
        const colour = SPARK_COLOURS[i % SPARK_COLOURS.length];
        return {
          left: `${(rand(i + 13) * 100).toFixed(2)}%`,
          size,
          colour,
          style: {
            animation: `hw-rise ${duration.toFixed(1)}s linear ${(-rand(i + 2) * duration).toFixed(1)}s infinite`,
            ['--hw-sway' as string]: `${Math.round((rand(i + 8) - 0.5) * 70)}px`,
            ['--hw-o' as string]: (0.5 + rand(i + 6) * 0.45).toFixed(2),
          } as CSSProperties,
        };
      }),
    [n]
  );
  if (reducedMotion) return null;
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {sparks.map((s, i) => (
        <span
          key={i}
          className="dw-anim absolute bottom-[-10px] rounded-full opacity-0"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.colour,
            boxShadow: `0 0 ${s.size * 4}px ${s.colour}`,
            ...s.style,
          }}
        />
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Composite pieces                                                     */
/* ------------------------------------------------------------------ */

/** Row of lit diyas along the bottom of a `relative` container. */
export const DiyaRow = ({ className }: { className?: string }) => {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const count = isMobile ? 5 : 9;
  return (
    <div className={cn('pointer-events-none absolute inset-x-0 bottom-0', className)} aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgb(255_160_40/0.22),transparent_70%)]" />
      <div className="relative mx-auto flex max-w-6xl items-end justify-between px-4 pb-4 sm:px-10 md:pb-6">
        {Array.from({ length: count }, (_, i) => {
          const mid = (count - 1) / 2;
          const fromMid = Math.abs(i - mid) / mid; // 0 centre .. 1 edges
          return (
            <Diya
              key={i}
              delay={rand(i + 40) * 3}
              className="w-10 sm:w-12 md:w-14"
              style={{ opacity: 0.85 + (1 - fromMid) * 0.15, transform: `${i > mid ? 'scaleX(-1) ' : ''}translateY(${(-fromMid * 4).toFixed(1)}px)` }}
            />
          );
        })}
      </div>
    </div>
  );
};

/** Gold rule with a diya in the middle, used under Diwali section titles. */
export const DiyaDivider = ({ className }: { className?: string }) => (
  <div className={cn('mx-auto mt-3 flex w-full max-w-[280px] items-center gap-3', className)} aria-hidden="true">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-300/70" />
    <span className="h-1.5 w-1.5 rotate-45 bg-amber-300/80" />
    <Diya className="w-11" />
    <span className="h-1.5 w-1.5 rotate-45 bg-amber-300/80" />
    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-300/70" />
  </div>
);

const STRANDS_LEFT = [
  { x: '0.4%', count: 14, seed: 1, mobile: true },
  { x: '2%', count: 9, seed: 2, mobile: true },
  { x: '3.4%', count: 18, seed: 3, mobile: false },
  { x: '4.8%', count: 7, seed: 4, mobile: false },
];

/** Hero backdrop decorations: rangoli, fireworks, garlands, lanterns, sparkles, diyas. */
export const DiwaliHeroDecor = () => (
  <>
    {/* Festive wash over the video */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#12040a]/75 via-[#2b0918]/40 to-surface" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_0%_0%,rgb(219_39_119/0.2),transparent_70%),radial-gradient(ellipse_55%_40%_at_100%_0%,rgb(219_39_119/0.2),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_100%,rgb(255_170_50/0.18),transparent_70%)]" />

    {/* Mandala behind the title */}
    <div className="absolute left-1/2 top-1/2 w-[min(135vw,960px)] -translate-x-1/2 -translate-y-1/2">
      <Rangoli spin={140} className="w-full text-amber-200/[0.1]" />
    </div>

    <Fireworks />

    {/* Marigold strands down both edges */}
    {STRANDS_LEFT.map((s) => (
      <div key={`l${s.seed}`} className={cn('absolute top-0', !s.mobile && 'hidden md:block')} style={{ left: s.x }}>
        <MarigoldStrand count={s.count} seed={s.seed} className="w-4 h-auto md:w-5" />
      </div>
    ))}
    {STRANDS_LEFT.map((s) => (
      <div key={`r${s.seed}`} className={cn('absolute top-0', !s.mobile && 'hidden md:block')} style={{ right: s.x }}>
        <MarigoldStrand count={s.count} seed={s.seed + 10} className="w-4 h-auto md:w-5" />
      </div>
    ))}

    {/* Lanterns */}
    <div className="absolute left-[11%] top-0 hidden w-10 sm:block md:left-[13%] md:w-14">
      <Lantern string={90} delay={0.4} />
    </div>
    <div className="absolute right-[11%] top-0 hidden w-9 sm:block md:right-[14%] md:w-12">
      <Lantern string={130} delay={1.2} hue="rani" />
    </div>
    <div className="absolute right-[22%] top-0 hidden w-8 lg:block">
      <Lantern string={60} delay={2.1} />
    </div>

    <Sparkles count={22} />
    <DiyaRow />
  </>
);

/** Section decorations: toran across the top, faint corner rangolis and sparkles. */
export const DiwaliSectionDecor = ({ toran = true }: { toran?: boolean }) => (
  <>
    <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] md:-bottom-48 md:-left-48 md:h-[560px] md:w-[560px]" aria-hidden="true">
      <Rangoli spin={180} className="h-full w-full text-amber-200/[0.07]" />
    </div>
    <div className="pointer-events-none absolute -right-40 -top-24 h-[420px] w-[420px] md:-right-48 md:h-[560px] md:w-[560px]" aria-hidden="true">
      <Rangoli spin={200} className="h-full w-full text-pink-200/[0.06]" />
    </div>
    <Sparkles count={12} className="z-[1]" />
    {toran && (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2]" aria-hidden="true">
        <Toran />
      </div>
    )}
  </>
);
