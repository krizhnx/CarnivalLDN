import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, BarChart3, CalendarDays, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Event, Order } from '../../../types';
import { cn } from '../../../lib/utils';
import { formatEventDateShort, isEventSoldOut } from '../../../lib/checkout';
import { Badge, Button, Card, EmptyState, IconButton, Progress, SearchInput, Segmented, sellThroughTone, td, th } from '../ui';
import { eventCapacity, eventSold, moneyWhole, num, parseLooseDate, startOfToday } from '../format';

const Events = ({
  currentEvents,
  archivedEvents,
  orders,
  onAdd,
  onEdit,
  onArchiveToggle,
  onDelete,
  onGuestlists,
  onOpenStats,
}: {
  currentEvents: Event[];
  archivedEvents: Event[];
  orders: Order[];
  onAdd: () => void;
  onEdit: (event: Event) => void;
  onArchiveToggle: (event: Event) => void;
  onDelete: (event: Event) => void;
  onGuestlists: (event: Event) => void;
  onOpenStats: (eventId: string) => void;
}) => {
  const [view, setView] = useState<'current' | 'archived'>('current');
  const [search, setSearch] = useState('');

  const revenue = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders) m.set(o.eventId, (m.get(o.eventId) || 0) + (o.totalAmount || 0));
    return m;
  }, [orders]);

  const list = (view === 'current' ? currentEvents : archivedEvents).filter((e) => {
    const q = search.trim().toLowerCase();
    return !q || e.title.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q);
  });

  const today = startOfToday();

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'current', label: 'Current', count: currentEvents.length },
            { value: 'archived', label: 'Archived', count: archivedEvents.length },
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Search events or venues" className="w-72" />
      </div>

      {list.length === 0 ? (
        <div className="border-t border-zinc-100">
          <EmptyState
            icon={CalendarDays}
            title={search ? 'No matching events' : view === 'current' ? 'No current events' : 'Nothing archived'}
            description={view === 'current' && !search ? 'Create your first event to start selling tickets.' : undefined}
            action={
              view === 'current' && !search ? (
                <Button variant="primary" icon={Plus} onClick={onAdd}>
                  New event
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-y border-zinc-100 bg-zinc-50/70">
              <tr>
                <th className={th}>Event</th>
                <th className={th}>Date</th>
                <th className={th}>Status</th>
                <th className={cn(th, 'w-[18%]')}>Sold</th>
                <th className={cn(th, 'text-right')}>Revenue</th>
                <th className={cn(th, 'text-right')}>Tiers</th>
                <th className={cn(th, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((ev) => {
                const cap = eventCapacity(ev);
                const sold = eventSold(ev);
                const p = cap ? (sold / cap) * 100 : 0;
                const d = parseLooseDate(ev.date);
                const past = d ? d < today : false;
                return (
                  <tr key={ev.id} className="group transition-colors hover:bg-zinc-50/70">
                    <td className={td}>
                      <button type="button" onClick={() => onOpenStats(ev.id)} className="flex items-center gap-3 text-left">
                        <span className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200">
                          {ev.image && <img src={ev.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[280px] truncate font-medium text-zinc-900 group-hover:underline group-hover:decoration-zinc-300 group-hover:underline-offset-4">
                            {ev.title}
                          </span>
                          <span className="block max-w-[280px] truncate text-xs text-zinc-500">{ev.venue}</span>
                        </span>
                      </button>
                    </td>
                    <td className={td}>
                      <p className="text-zinc-800">{formatEventDateShort(ev.date)}</p>
                      {ev.time && <p className="text-xs text-zinc-500">{ev.time}</p>}
                    </td>
                    <td className={td}>
                      {ev.isArchived ? (
                        <Badge>Archived</Badge>
                      ) : past ? (
                        <Badge>Past</Badge>
                      ) : isEventSoldOut(ev) ? (
                        <Badge tone="red">Sold out</Badge>
                      ) : (
                        <Badge tone="green" dot>
                          On sale
                        </Badge>
                      )}
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Progress value={p} tone={sellThroughTone(p)} className="flex-1" />
                        <span className="w-16 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                          {num(sold)}/{num(cap)}
                        </span>
                      </div>
                    </td>
                    <td className={cn(td, 'text-right font-medium tabular-nums text-zinc-900')}>{moneyWhole(revenue.get(ev.id) || 0)}</td>
                    <td className={cn(td, 'text-right tabular-nums')}>{ev.ticketTiers?.length || 0}</td>
                    <td className={td}>
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton icon={BarChart3} label="View stats" size="sm" onClick={() => onOpenStats(ev.id)} />
                        <IconButton icon={ClipboardList} label="Guestlists" size="sm" onClick={() => onGuestlists(ev)} />
                        <IconButton icon={Pencil} label="Edit event" size="sm" onClick={() => onEdit(ev)} />
                        <IconButton
                          icon={ev.isArchived ? ArchiveRestore : Archive}
                          label={ev.isArchived ? 'Unarchive' : 'Archive'}
                          size="sm"
                          onClick={() => onArchiveToggle(ev)}
                        />
                        {ev.isArchived && <IconButton icon={Trash2} label="Delete event" size="sm" variant="danger-subtle" onClick={() => onDelete(ev)} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default Events;
