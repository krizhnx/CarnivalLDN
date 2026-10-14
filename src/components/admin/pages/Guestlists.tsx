import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import type { Event } from '../../../types';
import { cn } from '../../../lib/utils';
import { formatEventDateShort } from '../../../lib/checkout';
import GuestlistManagement from '../../GuestlistManagement';
import { Card, EmptyState } from '../ui';

const EventItem = ({ event, active, onClick }: { event: Event; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
      active ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100'
    )}
  >
    <span className={cn('h-10 w-8 shrink-0 overflow-hidden rounded-md ring-1', active ? 'ring-white/20' : 'bg-zinc-100 ring-zinc-200')}>
      {event.image && <img src={event.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
    </span>
    <span className="min-w-0">
      <span className={cn('block truncate text-[13px] font-medium', active ? 'text-white' : 'text-zinc-900')}>{event.title}</span>
      <span className={cn('block truncate text-xs', active ? 'text-zinc-300' : 'text-zinc-500')}>{formatEventDateShort(event.date)}</span>
    </span>
  </button>
);

const Guestlists = ({
  currentEvents,
  archivedEvents,
  selectedId,
  onSelect,
  onCreate,
  refreshKey,
}: {
  currentEvents: Event[];
  archivedEvents: Event[];
  selectedId?: string;
  onSelect: (eventId: string) => void;
  onCreate: (event: Event) => void;
  refreshKey: number;
}) => {
  const [showArchived, setShowArchived] = useState(false);
  const all = [...currentEvents, ...archivedEvents];
  const selected = all.find((e) => e.id === selectedId) || currentEvents[0];

  if (all.length === 0) {
    return (
      <Card>
        <EmptyState icon={CalendarDays} title="No events yet" description="Guestlists belong to an event — create one first." />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
      <Card className="h-fit p-2 lg:sticky lg:top-24">
        <p className="px-2.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Current events</p>
        <div className="space-y-0.5">
          {currentEvents.length === 0 && <p className="px-2.5 py-2 text-[13px] text-zinc-400">None</p>}
          {currentEvents.map((e) => (
            <EventItem key={e.id} event={e} active={selected?.id === e.id} onClick={() => onSelect(e.id)} />
          ))}
        </div>
        {archivedEvents.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="mt-2 flex w-full items-center justify-between px-2.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-600"
            >
              Archived ({archivedEvents.length})
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showArchived && 'rotate-180')} />
            </button>
            {showArchived && (
              <div className="max-h-[360px] space-y-0.5 overflow-y-auto">
                {archivedEvents.map((e) => (
                  <EventItem key={e.id} event={e} active={selected?.id === e.id} onClick={() => onSelect(e.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <div className="min-w-0">
        {selected ? (
          <>
            <div className="mb-4">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900">{selected.title}</h2>
              <p className="text-[13px] text-zinc-500">
                {formatEventDateShort(selected.date)} · {selected.venue}
              </p>
            </div>
            <GuestlistManagement key={selected.id} event={selected} onCreateNew={() => onCreate(selected)} refreshKey={refreshKey} />
          </>
        ) : (
          <Card>
            <EmptyState icon={CalendarDays} title="Pick an event" description="Choose an event on the left to manage its guestlists." />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Guestlists;
