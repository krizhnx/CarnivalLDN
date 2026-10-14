import { useMemo, useState } from 'react';
import type { Event, Order } from '../../../types';
import OrdersTable from '../OrdersTable';
import { Card, SearchInput, Segmented, Select } from '../ui';
import { money, ticketCount } from '../format';

type StatusFilter = 'all' | Order['status'];

const Orders = ({
  orders,
  events,
  onOpen,
  onDelete,
}: {
  orders: Order[];
  events: Event[];
  onOpen: (order: Order) => void;
  onDelete: (order: Order) => void;
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [eventId, setEventId] = useState('all');

  const titleById = useMemo(() => new Map(events.map((e) => [e.id, e.title.toLowerCase()])), [events]);

  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (eventId !== 'all' && o.eventId !== eventId) return false;
      if (!q) return true;
      return (
        o.customerName?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        titleById.get(o.eventId)?.includes(q)
      );
    });
  }, [orders, search, eventId, titleById]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: base.length, completed: 0, pending: 0, failed: 0, refunded: 0 };
    base.forEach((o) => (c[o.status] = (c[o.status] || 0) + 1));
    return c;
  }, [base]);

  const filtered = status === 'all' ? base : base.filter((o) => o.status === status);
  const totals = useMemo(
    () => ({ revenue: filtered.reduce((s, o) => s + (o.totalAmount || 0), 0), tickets: filtered.reduce((s, o) => s + ticketCount(o), 0) }),
    [filtered]
  );

  const statusOptions = (
    [
      { value: 'all', label: 'All' },
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'failed', label: 'Failed' },
      { value: 'refunded', label: 'Refunded' },
    ] as { value: StatusFilter; label: string }[]
  )
    .filter((o) => o.value === 'all' || o.value === status || counts[o.value] > 0)
    .map((o) => ({ ...o, count: counts[o.value] }));

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <Segmented value={status} onChange={setStatus} options={statusOptions} />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Select size="sm" value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-60">
            <option value="all">All events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </Select>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, order ID" className="w-72" />
        </div>
      </div>
      <div className="flex items-center gap-6 border-t border-zinc-100 bg-zinc-50/40 px-5 py-2.5 text-[13px] text-zinc-500">
        <span>
          <span className="font-semibold tabular-nums text-zinc-900">{filtered.length}</span> orders
        </span>
        <span>
          <span className="font-semibold tabular-nums text-zinc-900">{totals.tickets}</span> tickets
        </span>
        <span>
          <span className="font-semibold tabular-nums text-zinc-900">{money(totals.revenue)}</span> gross
        </span>
      </div>
      <div className="border-t border-zinc-100">
        <OrdersTable
          orders={filtered}
          events={events}
          onOpen={onOpen}
          onDelete={onDelete}
          emptyTitle={search || eventId !== 'all' || status !== 'all' ? 'No matching orders' : 'No orders yet'}
          emptyDescription={search ? 'Try a different name, email or order ID.' : undefined}
        />
      </div>
    </Card>
  );
};

export default Orders;
