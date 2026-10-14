import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

const useWidth = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (ref.current) setWidth(ref.current.getBoundingClientRect().width);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
};

const niceMax = (max: number) => {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
};

export interface SeriesPoint {
  label: string;
  value: number;
  /** Optional secondary figure shown in the tooltip (e.g. orders). */
  sub?: number;
}

/** Smooth area chart with gridlines, axis labels and a hover tooltip. */
export const AreaChart = ({
  data,
  height = 260,
  formatValue = (v) => String(v),
  formatAxis,
  subLabel,
  className,
}: {
  data: SeriesPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  formatAxis?: (v: number) => string;
  subLabel?: (n: number) => string;
  className?: string;
}) => {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useMemo(() => `area-${Math.random().toString(36).slice(2, 8)}`, []);

  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const w = Math.max(0, width - padL - padR);
  const h = height - padT - padB;

  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const n = data.length;
  const x = (i: number) => padL + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => padT + h - (v / max) * h;

  const line = useMemo(() => {
    if (n === 0 || w <= 0) return '';
    let d = `M ${x(0)} ${y(data[0].value)}`;
    for (let i = 1; i < n; i++) {
      const x0 = x(i - 1);
      const x1 = x(i);
      const mx = (x0 + x1) / 2;
      d += ` C ${mx} ${y(data[i - 1].value)}, ${mx} ${y(data[i].value)}, ${x1} ${y(data[i].value)}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, w, h, max]);

  const area = line ? `${line} L ${x(n - 1)} ${padT + h} L ${x(0)} ${padT + h} Z` : '';
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 90))));

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = n <= 1 ? 0 : Math.round((px / rect.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const hp = hover !== null ? data[hover] : null;

  return (
    <div ref={ref} className={cn('relative w-full select-none', className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(139 92 246)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(139 92 246)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={padL + w} y1={y(t)} y2={y(t)} stroke="rgb(228 228 231)" strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={padL - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-zinc-400 text-[11px] tabular-nums">
                {(formatAxis || formatValue)(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <text
                key={i}
                x={x(i)}
                y={height - 8}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                className="fill-zinc-400 text-[11px]"
              >
                {i !== n - 1 && i !== 0 && n - 1 - i < labelEvery * 0.6 ? '' : d.label}
              </text>
            ) : null
          )}
          {area && <path d={area} fill={`url(#${gid})`} />}
          {line && <path d={line} fill="none" stroke="rgb(124 58 237)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {hp && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + h} stroke="rgb(161 161 170)" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(hp.value)} r={4.5} fill="white" stroke="rgb(124 58 237)" strokeWidth={2} />
            </g>
          )}
          <rect
            x={padL}
            y={padT}
            width={w}
            height={h}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hp && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: Math.min(Math.max(x(hover), padL + 60), width - 60), top: y(hp.value) - 10 }}
        >
          <p className="text-zinc-400">{hp.label}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatValue(hp.value)}</p>
          {hp.sub !== undefined && subLabel && <p className="text-zinc-400">{subLabel(hp.sub)}</p>}
        </div>
      )}
    </div>
  );
};

/** Horizontal ranked bars (label inside the bar, value on the right). */
export const BarList = ({
  items,
  formatValue = (v) => String(v),
  className,
  empty,
}: {
  items: { label: ReactNode; value: number; meta?: ReactNode; key?: string }[];
  formatValue?: (v: number) => string;
  className?: string;
  empty?: ReactNode;
}) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item, idx) => (
        <li key={item.key ?? idx} className="flex items-center gap-4">
          <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-lg">
            <div
              className="absolute inset-y-0 left-0 rounded-lg bg-violet-100/80 transition-[width] duration-500"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
            <div className="relative flex h-full items-center gap-2 px-3 text-[13px]">
              <span className="min-w-0 max-w-[75%] shrink-0 truncate font-medium text-zinc-800">{item.label}</span>
              {item.meta && <span className="min-w-0 truncate text-zinc-500">{item.meta}</span>}
            </div>
          </div>
          <span className="w-20 shrink-0 text-right text-[13px] font-semibold tabular-nums text-zinc-900">{formatValue(item.value)}</span>
        </li>
      ))}
    </ul>
  );
};

/** Donut with legend. */
export const Donut = ({
  segments,
  centerLabel,
  centerValue,
  size = 168,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: ReactNode;
  size?: number;
}) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(244 244 245)" strokeWidth="10" />
          {total > 0 &&
            segments.map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={s.label}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="10"
                  strokeDasharray={`${Math.max(0, len - (s.value > 0 && len < c ? 0.8 : 0))} ${c}`}
                  strokeDashoffset={-acc}
                />
              );
              acc += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">{centerValue ?? total}</p>
            {centerLabel && <p className="text-xs text-zinc-500">{centerLabel}</p>}
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className={cn('flex-1 truncate', s.value === 0 ? 'text-zinc-400' : 'text-zinc-700')}>{s.label}</span>
            <span className="tabular-nums font-medium text-zinc-900">{s.value}</span>
            <span className="w-12 text-right tabular-nums text-zinc-400">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
