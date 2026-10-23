import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Calendar, Check, Inbox, MapPin } from 'lucide-react';
import type { Event, Order } from '../../types';
import { formatGBP, type TicketSelection } from '../../lib/checkout';
import { Burst } from './primitives';
import { cn } from '../../lib/utils';
import { useSiteTheme } from '../../theme/siteTheme';
import { useThemeCopy } from '../../theme/copy';
import { JackOLantern } from '../halloween/decorations';
import { eventTheme } from '../../theme/eventTheme';
import { DiwaliFireworksShow } from '../diwali/FireworksShow';

interface SuccessStepProps {
  event: Event;
  order: Order;
  selections: TicketSelection[];
}

const SuccessStep = ({ event, order, selections }: SuccessStepProps) => {
  const ticketCount = selections.reduce((sum, s) => sum + s.quantity, 0);
  const reference = order.id?.slice(0, 8).toUpperCase() || 'N/A';
  const { isHalloween } = useSiteTheme();
  const copy = useThemeCopy();
  // Diwali events celebrate a confirmed order with the same fireworks volley as opening the card
  const [fireworks, setFireworks] = useState(() => eventTheme(event) === 'diwali');
  const endFireworks = useCallback(() => setFireworks(false), []);

  return (
    <div className="flex flex-col items-center px-5 pb-8 pt-14 text-center">
      {fireworks && <DiwaliFireworksShow onDone={endFireworks} />}
      <div className="relative mb-6">
        <Burst />
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className={cn(
            'relative grid h-20 w-20 place-items-center rounded-full shadow-[0_0_60px_-6px_rgb(var(--glow)/0.7)]',
            isHalloween
              ? 'bg-[radial-gradient(circle_at_50%_40%,#3b1760,#140822)] ring-2 ring-accent/60'
              : 'bg-gradient-to-br from-accent via-white to-accent2'
          )}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}>
            {isHalloween ? (
              <JackOLantern className="h-14 w-14" />
            ) : (
              <Check className="h-10 w-10 text-zinc-950" strokeWidth={3} />
            )}
          </motion.div>
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={cn('font-display text-4xl font-bold uppercase tracking-tight', isHalloween ? 'text-accent' : 'text-white')}
      >
        {copy.successTitle}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="mt-2 max-w-xs text-sm text-white/60"
      >
        {ticketCount} ticket{ticketCount === 1 ? '' : 's'} {copy.successLead}{' '}
        <span className="font-medium text-white">{order.customerEmail}</span>
      </motion.p>

      {/* Ticket stub */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 25 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 20 }}
        className="relative mt-8 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-surface-2 text-left shadow-[0_30px_80px_-30px_rgb(var(--glow-2)/0.45)]"
        style={{ transformPerspective: 800 }}
      >
        <div className="relative h-28 overflow-hidden">
          <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-2 to-transparent" />
          <p className="absolute bottom-3 left-4 right-4 truncate font-display text-lg font-bold uppercase tracking-tight text-white">
            {event.title}
          </p>
        </div>
        <div className="space-y-1.5 px-4 pb-4 pt-1 text-xs text-white/65">
          {event.date && (
            <p className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-accent" /> {[event.date, event.time].filter(Boolean).join(' · ')}
            </p>
          )}
          {event.venue && (
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-accent" /> {event.venue}
            </p>
          )}
        </div>

        <div className="relative h-px" aria-hidden>
          <div className="absolute inset-x-5 top-0 border-t border-dashed border-white/15" />
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-surface" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-surface" />
        </div>

        <div className="grid grid-cols-3 gap-2 p-4 text-[11px]">
          <div>
            <p className="font-medium uppercase tracking-wider text-white/40">Tickets</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{ticketCount}</p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-white/40">Paid</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{formatGBP(order.totalAmount || 0)}</p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-white/40">Ref</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-white">{reference}</p>
          </div>
        </div>
        <div className="space-y-1 border-t border-white/5 px-4 py-3 text-xs text-white/55">
          {selections.map((s) => (
            <p key={s.tierId}>
              {s.quantity} × {s.tier.name}
              {s.tier.lastEntryTime ? ` · last entry ${s.tier.lastEntryTime}` : ''}
            </p>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex max-w-sm items-start gap-3 rounded-2xl bg-white/[0.04] p-4 text-left text-xs text-white/60"
      >
        <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-accent2" />
        <p>{copy.successNote}</p>
      </motion.div>
    </div>
  );
};

export default SuccessStep;
