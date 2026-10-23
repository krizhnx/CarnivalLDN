import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, Flame, MapPin, Star } from 'lucide-react';
import { useCallback, useState, type KeyboardEvent } from 'react';
import type { Event } from '../types';
import { cn } from '../lib/utils';
import {
  formatGBPCompact,
  isEventSellingFast,
  isEventSoldOut,
  lowestPrice,
  parseEventDate,
} from '../lib/checkout';
import { eventTheme } from '../theme/eventTheme';
import { Cobweb } from './halloween/decorations';
import { Rangoli } from './diwali/decorations';
import { DiwaliFireworksShow } from './diwali/FireworksShow';

interface EventCardProps {
  event: Event;
  onSelect: (event: Event) => void;
  index?: number;
  featured?: boolean;
  /** Optional brand glitch effect on the title (from useGlitchEffect) */
  glitchClassName?: string;
}

const EventCard = ({ event, onSelect, index = 0, featured = false, glitchClassName }: EventCardProps) => {
  const soldOut = isEventSoldOut(event);
  const sellingFast = !soldOut && isEventSellingFast(event);
  const fromPrice = lowestPrice(event);
  const badge = parseEventDate(event.date);
  const hasTiers = (event.ticketTiers?.length ?? 0) > 0;
  // Each card renders in its own theme (admin "Card theme"), whatever the site theme is
  const cardTheme = eventTheme(event);
  const isHalloween = cardTheme === 'halloween';
  const isDiwali = cardTheme === 'diwali';

  // Diwali cards launch a fireworks volley from both sides of the screen when opened
  const [showKey, setShowKey] = useState<number | null>(null);
  const endShow = useCallback(() => setShowKey(null), []);

  const open = () => {
    if (isDiwali) setShowKey(Date.now());
    onSelect(event);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  return (
    <>
      <motion.div
        role="button"
        tabIndex={0}
        data-event-theme={cardTheme}
        aria-label={`${event.title} - ${soldOut ? 'sold out' : 'get tickets'}`}
        onClick={open}
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: featured ? 0.15 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.985 }}
        className={cn(
          'group relative isolate cursor-pointer overflow-hidden rounded-[28px] bg-surface-2 text-left outline-none',
          'ring-1 ring-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] transition-shadow duration-500',
          'hover:ring-white/25 hover:shadow-[0_30px_80px_-24px_rgb(var(--glow)/0.35)]',
          'focus-visible:ring-2 focus-visible:ring-accent',
          (isHalloween || isDiwali) && 'ring-accent/20 hover:ring-accent/50',
          featured && 'ring-2 ring-accent/70 shadow-[0_0_60px_-10px_rgb(var(--glow)/0.55)]'
        )}
      >
        {/* Poster */}
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <img
            src={event.image}
            alt=""
            loading="lazy"
            className={cn(
              'absolute inset-0 h-full w-full object-cover object-[center_20%] transition-transform duration-700 ease-out group-hover:scale-[1.06]',
              soldOut && 'grayscale-[60%]'
            )}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x500/18181b/FFFFFF?text=${encodeURIComponent(event.title)}`;
            }}
          />

          {/* Legibility gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black from-[22%] via-black/80 via-[45%] to-transparent to-[75%]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
          {/* Brand sheen on hover */}
          <div className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_15%_0%,rgb(var(--glow)/0.25),transparent_45%),radial-gradient(circle_at_100%_100%,rgb(var(--glow-2)/0.25),transparent_45%)]" />

          {isHalloween && (
            <Cobweb className="pointer-events-none absolute right-0 top-0 h-28 w-28 -scale-x-100 text-white/30" />
          )}
          {isDiwali && (
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 opacity-60 drop-shadow-[0_0_10px_rgba(255,170,40,0.35)]">
              <Rangoli variant="color" spin={90} className="h-full w-full" />
            </div>
          )}

          {/* Date tile */}
          <div className="absolute left-4 top-4">
            {badge ? (
              <div className="flex min-w-[58px] flex-col items-center rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-white backdrop-blur-md">
                {badge.weekday && <span className="text-[10px] font-medium tracking-[0.18em] text-white/60">{badge.weekday}</span>}
                <span className="text-2xl font-bold leading-none tabular-nums">{badge.day}</span>
                <span className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-accent">{badge.month}</span>
              </div>
            ) : (
              <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                {event.date}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
            {featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-glow to-glow-2 px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
                <Star className="h-3 w-3 fill-current" /> Featured
              </span>
            )}
            {soldOut ? (
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-900">
                Sold out
              </span>
            ) : sellingFast ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-zinc-900 shadow-lg">
                <Flame className="h-3 w-3" /> Selling fast
              </span>
            ) : null}
          </div>

          {/* Content */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            {event.tags?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {event.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h3
              className={cn(
                'line-clamp-2 font-display text-2xl font-black uppercase leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]',
                isHalloween && 'text-[1.7rem] leading-[1.1] drop-shadow-[0_0_14px_rgba(255,122,26,0.45)]',
                isDiwali && 'text-[1.5rem] leading-[1.18] text-[#ffe7a3] drop-shadow-[0_0_14px_rgba(255,170,40,0.45)]'
              )}
            >
              {glitchClassName ? (
                <span className={glitchClassName} data-text={event.title}>
                  {event.title}
                </span>
              ) : (
                event.title
              )}
            </h3>

            {(event.time || event.venue) && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] font-medium text-white">
                {[
                  event.time && { icon: Clock, text: event.time, tone: 'border-accent/40 bg-accent/15', iconTone: 'text-accent' },
                  event.venue && { icon: MapPin, text: event.venue, tone: 'border-accent2/40 bg-accent2/15', iconTone: 'text-accent2' },
                ]
                  .filter((m): m is { icon: typeof Clock; text: string; tone: string; iconTone: string } => !!m)
                  .map(({ icon: Icon, text, tone, iconTone }, _i, all) => (
                    <span
                      key={text}
                      className={cn(
                        'flex min-w-0 items-center justify-center gap-1.5 rounded-full border px-3 py-2 backdrop-blur-md',
                        tone,
                        all.length === 1 && 'col-span-2'
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', iconTone)} />
                      <span className="truncate">{text}</span>
                    </span>
                  ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="min-w-0 leading-tight">
                {fromPrice !== null ? (
                  <>
                    <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                      {fromPrice === 0 ? 'Entry' : 'From'}
                    </span>
                    <span className="text-[30px] font-semibold leading-tight tracking-tight text-white">
                      {fromPrice === 0 ? 'Free' : formatGBPCompact(fromPrice)}
                    </span>
      </>
                ) : (
                  <span className="text-sm text-white/60">Tickets soon</span>
                )}
              </div>

              <span
                className={cn(
                  'inline-flex h-12 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-6 text-[15px] font-medium transition-all duration-300',
                  soldOut
                    ? 'bg-white/10 text-white/60'
                    : 'bg-cta text-cta-fg group-hover:gap-2.5 group-hover:shadow-[0_0_30px_-4px_rgb(var(--cta-glow)/0.6)]'
                )}
              >
                {soldOut ? 'View' : hasTiers ? 'Get tickets' : 'Details'}
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      {showKey !== null && <DiwaliFireworksShow key={showKey} onDone={endShow} />}
    </>
  );
};

export default EventCard;
