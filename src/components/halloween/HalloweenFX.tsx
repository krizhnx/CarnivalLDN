import { useMemo, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { isThemedPath, useSiteTheme } from '../../theme/siteTheme';
import { Bat } from './decorations';

/** Pages that stay calm even in Halloween mode (legal copy, plus anything unthemed). */
const FX_EXCLUDED = ['/privacy-policy', '/terms-of-service', '/cookie-policy'];

// Deterministic pseudo-random so the layout is stable between renders
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const EMBER_COLOURS = ['#ff8a1f', '#ffb347', '#ff6a00', '#a3e635', '#ffd23f'];

interface Ember {
  left: string;
  size: number;
  colour: string;
  style: CSSProperties;
}

const makeEmbers = (count: number): Ember[] =>
  Array.from({ length: count }, (_, i) => {
    const size = 2 + Math.round(rand(i + 1) * 3);
    const duration = 11 + rand(i + 7) * 12;
    return {
      left: `${(rand(i + 3) * 100).toFixed(2)}%`,
      size,
      colour: EMBER_COLOURS[i % EMBER_COLOURS.length],
      style: {
        animation: `hw-rise ${duration.toFixed(1)}s linear ${(-rand(i + 11) * duration).toFixed(1)}s infinite`,
        ['--hw-sway' as string]: `${Math.round((rand(i + 5) - 0.5) * 80)}px`,
        ['--hw-o' as string]: (0.45 + rand(i + 9) * 0.45).toFixed(2),
      },
    };
  });

const BATS = [
  { top: '14%', size: 46, duration: 26, delay: 0, reverse: false, opacity: 0.9 },
  { top: '30%', size: 30, duration: 34, delay: 9, reverse: true, opacity: 0.7 },
  { top: '9%', size: 22, duration: 30, delay: 17, reverse: false, opacity: 0.55 },
  { top: '46%', size: 36, duration: 38, delay: 24, reverse: true, opacity: 0.6 },
  { top: '22%', size: 26, duration: 28, delay: 31, reverse: false, opacity: 0.5 },
];

/**
 * Site-wide ambient Halloween layer: vignette, fog, embers and the odd bat.
 * Fixed, non-interactive, sits under the navbar (z-50) and modals (z-100).
 */
const HalloweenFX = () => {
  const { isHalloween } = useSiteTheme();
  const { pathname } = useLocation();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  const embers = useMemo(() => makeEmbers(isMobile ? 9 : 20), [isMobile]);
  const bats = isMobile ? BATS.slice(0, 3) : BATS;

  if (!isHalloween || !isThemedPath(pathname) || FX_EXCLUDED.includes(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[45] overflow-hidden" aria-hidden="true">
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgb(12 2 20 / 0.55) 100%)' }}
      />

      {!reducedMotion && (
        <>
          {/* Ground fog */}
          <div className="absolute inset-x-0 bottom-0 h-[28vh] opacity-50">
            <div
              className="hw-anim absolute -inset-x-1/4 bottom-[-35%] h-full"
              style={{
                background:
                  'radial-gradient(ellipse 25% 60% at 20% 75%, rgb(196 181 253 / 0.18), transparent 70%), radial-gradient(ellipse 30% 55% at 60% 85%, rgb(226 232 240 / 0.12), transparent 70%), radial-gradient(ellipse 22% 50% at 90% 80%, rgb(167 139 250 / 0.16), transparent 70%)',
                animation: 'hw-fog 22s ease-in-out infinite alternate',
              }}
            />
          </div>

          {/* Embers */}
          {embers.map((ember, i) => (
            <span
              key={i}
              className="hw-anim absolute bottom-[-12px] rounded-full opacity-0"
              style={{
                left: ember.left,
                width: ember.size,
                height: ember.size,
                background: ember.colour,
                boxShadow: `0 0 ${ember.size * 3}px ${ember.colour}`,
                ...ember.style,
              }}
            />
          ))}

          {/* Bats */}
          {bats.map((bat, i) => (
            <div
              key={i}
              className="hw-anim absolute left-0"
              style={{
                top: bat.top,
                width: bat.size,
                opacity: bat.opacity,
                transform: 'translate3d(-15vw,0,0)',
                animation: `${bat.reverse ? 'hw-fly-rev' : 'hw-fly'} ${bat.duration}s linear ${bat.delay}s infinite`,
              }}
            >
              <div className="hw-anim" style={{ animation: `hw-bob ${1.6 + i * 0.3}s ease-in-out infinite` }}>
                <Bat className="w-full text-[#07030b] drop-shadow-[0_0_6px_rgba(255,122,26,0.35)]" />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default HalloweenFX;
