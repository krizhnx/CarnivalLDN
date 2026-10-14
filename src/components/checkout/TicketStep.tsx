import { motion } from 'framer-motion';
import { Calendar, Check, Clock, ExternalLink, Flame, MapPin, Ticket } from 'lucide-react';
import { useState } from 'react';
import type { Event, TicketTier } from '../../types';
import { cn } from '../../lib/utils';
import {
  bookingFeePerTicket,
  formatGBP,
  formatEventDateShort,
  formatGBPCompact,
  formatTierPrice,
  isTierLowStock,
  isTierSoldOut,
  tierRemaining,
} from '../../lib/checkout';
import { QuantityStepper } from './primitives';

interface TicketStepProps {
  event: Event;
  tiers: TicketTier[];
  quantities: Record<string, number>;
  onQuantityChange: (tierId: string, quantity: number) => void;
}

const MetaChip = ({
  icon: Icon,
  children,
  href,
  className: extra,
}: {
  icon: typeof Calendar;
  children: string;
  href?: string;
  className?: string;
}) => {
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
      <span className="truncate">{children}</span>
      {/* hidden on phones so the venue gets more room in the single row */}
      {href && <ExternalLink className="hidden h-3 w-3 shrink-0 text-white/40 sm:block" />}
    </>
  );
  const className = cn(
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/80',
    extra
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cn(className, 'transition hover:border-white/25 hover:bg-white/[0.08]')}>
      {content}
    </a>
  ) : (
    <span className={className}>{content}</span>
  );
};

export const EventHero = ({ event }: { event: Event }) => {
  const [expanded, setExpanded] = useState(false);
  const longDescription = (event.description?.length ?? 0) > 160;

  return (
    <div>
      <div className="relative h-64 overflow-hidden md:h-72">
        <motion.img
          src={event.image}
          alt=""
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-black/30" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          {event.tags?.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {event.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-4xl"
          >
            {event.title}
          </motion.h2>
        </div>
      </div>

      <div className="space-y-4 px-5">
        {/* One row: date + time keep their size, venue truncates */}
        <div className="flex gap-2">
          {event.date && (
            <MetaChip icon={Calendar} className="shrink-0">
              {formatEventDateShort(event.date)}
            </MetaChip>
          )}
          {event.time && (
            <MetaChip icon={Clock} className="shrink-0">
              {event.time}
            </MetaChip>
          )}
          {event.venue && (
            <MetaChip
              icon={MapPin}
              className="min-w-0"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
            >
              {event.venue}
            </MetaChip>
          )}
        </div>

        {event.description && (
          <div className="text-sm leading-relaxed text-white/65">
            <p className={cn('whitespace-pre-line', !expanded && longDescription && 'line-clamp-3')}>{event.description}</p>
            {longDescription && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 min-h-0 text-xs font-medium text-white underline-offset-4 hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TierCard = ({
  tier,
  quantity,
  onChange,
  index,
}: {
  tier: TicketTier;
  quantity: number;
  onChange: (quantity: number) => void;
  index: number;
}) => {
  const soldOut = isTierSoldOut(tier);
  const lowStock = isTierLowStock(tier);
  const remaining = tierRemaining(tier);
  const selected = quantity > 0;
  const hasDiscount = !!tier.originalPrice && tier.originalPrice > tier.price;

  if (soldOut) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 + index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-white/[0.02] px-5 py-3.5"
      >
        <span className="min-w-0 truncate text-sm text-white/40">{tier.name}</span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-white/25 line-through">{formatTierPrice(tier.price)}</span>
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/45">
            Sold out
          </span>
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-3xl border px-5 py-4 transition-[border-color,background-color,box-shadow] duration-300',
        selected
          ? 'border-accent/50 bg-white/[0.07] shadow-[0_0_40px_-12px_rgb(var(--glow)/0.5)]'
          : 'border-white/10 bg-white/[0.035] hover:border-white/20'
      )}
    >
      {selected && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgb(var(--glow-2)/0.14),transparent_55%)]" />
      )}

      {/* Name + last entry (left) top-aligned with price + fee (right) */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[19px] font-medium leading-snug tracking-tight text-white">{tier.name}</h4>
          {(tier.lastEntryTime || lowStock) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {tier.lastEntryTime && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] leading-4 text-white/70">
                  <Clock className="h-3 w-3 shrink-0 text-accent2" /> Last entry {tier.lastEntryTime}
                </span>
              )}
              {lowStock && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium uppercase leading-4 tracking-wider text-amber-300">
                  <Flame className="h-3 w-3" /> {remaining} left
                </span>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[32px] font-semibold leading-none tracking-tight tabular-nums text-white">
            {tier.price === 0 ? 'Free' : formatGBPCompact(tier.price)}
          </span>
          {(hasDiscount || tier.price > 0) && (
            <span className="mt-1.5 block text-xs text-white/45">
              {hasDiscount && <span className="mr-1.5 text-white/35 line-through">{formatGBPCompact(tier.originalPrice!)}</span>}
              {tier.price > 0 && `+ ${formatGBP(bookingFeePerTicket(tier.price))} fee`}
            </span>
          )}
        </div>
      </div>

      {tier.description && <p className="relative mt-3 text-sm text-white/55">{tier.description}</p>}

      {!!tier.benefits?.length && (
        <ul className="relative mt-3 space-y-1.5">
          {tier.benefits.filter(Boolean).map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
              {benefit}
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-4 flex min-h-[48px] items-center justify-between gap-3">
        {selected ? (
          <motion.span
            key="count"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-medium tabular-nums text-white"
            aria-hidden
          >
            <Ticket className="h-4 w-4 text-accent" />
            {quantity}
            {tier.price > 0 && <span className="text-white/55">× {formatGBPCompact(tier.price)}</span>}
          </motion.span>
        ) : (
          <span />
        )}
        <QuantityStepper value={quantity} max={remaining} label={tier.name} onChange={onChange} />
      </div>
    </motion.div>
  );
};

const TicketStep = ({ event, tiers, quantities, onQuantityChange }: TicketStepProps) => {
  const allSoldOut = tiers.length > 0 && tiers.every(isTierSoldOut);
  // Available tiers first (by price), sold-out ones after
  const ordered = [...tiers.filter((t) => !isTierSoldOut(t)), ...tiers.filter(isTierSoldOut)];

  return (
    <div className="space-y-6 pb-6">
      <EventHero event={event} />

      <section className="space-y-3 px-5">
        <div className="flex items-end justify-between">
          <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">Tickets</h3>
          {allSoldOut && <span className="text-xs font-medium text-rose-300">This event is sold out</span>}
        </div>

        {tiers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="font-medium text-white">Tickets aren&apos;t on sale here yet</p>
            {event.bookingUrl ? (
              <a
                href={event.bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-cta px-5 text-sm font-medium text-cta-fg"
              >
                Book via partner <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="mt-1 text-sm text-white/55">Check back soon - follow us for drop alerts.</p>
            )}
          </div>
        ) : (
          ordered.map((tier, i) => (
            <TierCard
              key={tier.id}
              tier={tier}
              index={i}
              quantity={quantities[tier.id] ?? 0}
              onChange={(q) => onQuantityChange(tier.id, q)}
            />
          ))
        )}
      </section>
    </div>
  );
};

export default TicketStep;
