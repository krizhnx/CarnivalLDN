import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

/*
 * One-shot fireworks volley: rockets launch from the left and right edges of
 * the screen and burst over the page. Played when a Diwali event card is
 * opened. Fixed, above the checkout sheet, pointer-events-none; skipped for
 * prefers-reduced-motion. Keyframes (dw-launch / dw-pop / dw-fall / dw-pop-flash)
 * live in index.css.
 */

const PALETTES: [string, string][] = [
  ['#ffd166', '#fff4d6'], // gold
  ['#f472b6', '#ffd1ea'], // rani pink
  ['#fb923c', '#ffe0b8'], // saffron
  ['#fbbf24', '#fff7d6'], // amber
  ['#f9a8d4', '#ffffff'], // pink / white
];

interface Shot {
  bx: number; // burst point (px)
  by: number;
  dx: number; // launch offset from the burst point (px)
  dy: number;
  angle: number; // rocket heading (deg)
  delay: number; // s
  flight: number; // s
  radius: number; // px
  streaks: { a: number; r: number }[];
  palette: [string, string];
}

const between = (min: number, max: number) => min + Math.random() * (max - min);

const planShow = (w: number, h: number): Shot[] => {
  const mobile = w < 640;
  const count = mobile ? 6 : 8;
  return Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0;
    // Burst 8-36% in from the edge, in the upper half
    const inset = w * between(0.08, 0.36);
    const bx = left ? inset : w - inset;
    const by = h * between(0.12, 0.45);
    // Launch from just off the side edge, lower part of the screen
    const sx = left ? -12 : w + 12;
    const sy = h * between(0.68, 0.98);
    const dx = sx - bx;
    const dy = sy - by;
    // Rotate the vertical streak so its head points along the flight path
    const angle = (Math.atan2(-dx, dy) * 180) / Math.PI;
    const radius = mobile ? between(60, 85) : between(95, 140);
    const sparks = mobile ? 20 : 28;
    return {
      bx,
      by,
      dx,
      dy,
      angle,
      delay: Math.floor(i / 2) * 0.34 + (left ? 0 : 0.14) + between(0, 0.08),
      flight: between(0.55, 0.75),
      radius,
      streaks: Array.from({ length: sparks }, (_, j) => ({
        a: (360 / sparks) * j + between(-4, 4),
        r: radius * between(0.85, 1.1),
      })),
      palette: PALETTES[i % PALETTES.length],
    };
  });
};

const BURST_S = 1.4;

const Burst = ({ shot }: { shot: Shot }) => {
  const t = shot.delay + shot.flight;
  const [c1, c2] = shot.palette;
  return (
    <div className="absolute h-0 w-0" style={{ left: shot.bx, top: shot.by }}>
      {/* Rocket + trail */}
      <span
        className="dw-anim absolute -left-[1.5px] top-0 h-6 w-[3px] origin-top rounded-full opacity-0"
        style={
          {
            background: `linear-gradient(to top, transparent, ${c2})`,
            boxShadow: `0 0 8px ${c1}`,
            '--sx': `${shot.dx}px`,
            '--sy': `${shot.dy}px`,
            '--ra': `${shot.angle}deg`,
            animation: `dw-launch ${shot.flight}s cubic-bezier(0.3, 0.55, 0.45, 1) ${shot.delay}s both`,
          } as CSSProperties
        }
      />
      {/* Flash */}
      <span
        className="dw-anim absolute -left-14 -top-14 h-28 w-28 rounded-full opacity-0"
        style={{
          background: `radial-gradient(circle, ${c2}cc, ${c1}55 35%, transparent 70%)`,
          animation: `dw-pop-flash 0.9s ease-out ${t}s both`,
        }}
      />
      {/* Outer streaks */}
      {shot.streaks.map(({ a, r }, i) => {
        const colour = i % 2 ? c1 : c2;
        return (
          <span
            key={`s${i}`}
            className="dw-anim absolute"
            style={{ animation: `dw-fall ${BURST_S}s ease-in ${t}s both` }}
          >
            <span
              className="dw-anim absolute -ml-px -mt-[9px] block h-[18px] w-[2px] rounded-full opacity-0"
              style={
                {
                  background: `linear-gradient(to top, transparent, ${colour})`,
                  boxShadow: `0 0 6px ${colour}`,
                  '--a': `${a.toFixed(1)}deg`,
                  '--r': `${r.toFixed(0)}px`,
                  animation: `dw-pop ${BURST_S}s cubic-bezier(0.1, 0.75, 0.3, 1) ${t}s both`,
                } as CSSProperties
              }
            />
          </span>
        );
      })}
      {/* Inner glitter ring */}
      {Array.from({ length: 12 }, (_, i) => (
        <span key={`g${i}`} className="dw-anim absolute" style={{ animation: `dw-fall ${BURST_S}s ease-in ${t + 0.05}s both` }}>
          <span
            className="dw-anim absolute -ml-[1.5px] -mt-[1.5px] block h-[3px] w-[3px] rounded-full opacity-0"
            style={
              {
                background: '#fffbe6',
                boxShadow: `0 0 6px ${c1}`,
                '--a': `${30 * i + 15}deg`,
                '--r': `${(shot.radius * 0.5).toFixed(0)}px`,
                animation: `dw-pop ${BURST_S - 0.2}s cubic-bezier(0.1, 0.75, 0.3, 1) ${t + 0.05}s both`,
              } as CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
};

/** Plays once, then calls onDone. Mount with a fresh `key` to replay. */
export const DiwaliFireworksShow = ({ onDone }: { onDone: () => void }) => {
  const [shots] = useState(() =>
    typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? []
      : planShow(window.innerWidth, window.innerHeight)
  );

  useEffect(() => {
    const end = shots.reduce((max, s) => Math.max(max, s.delay + s.flight + BURST_S), 0);
    const id = window.setTimeout(onDone, (end + 0.2) * 1000);
    return () => window.clearTimeout(id);
  }, [shots, onDone]);

  if (!shots.length || typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" aria-hidden="true">
      {shots.map((shot, i) => (
        <Burst key={i} shot={shot} />
      ))}
    </div>,
    document.body
  );
};
