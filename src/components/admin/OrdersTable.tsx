import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Receipt, Trash2 } from 'lucide-react';
import type { Event, Order } from '../../types';
import { cn } from '../../lib/utils';
import { Avatar, Badge, EmptyState, IconButton, Pagination, orderStatusTone, td, th } from './ui';
import { money, scanState, shortDate, ticketCount, timeOnly } from './format';

const scanTone = { none: 'neutral', in: 'green', out: 'orange', inout: 'blue' } as const;

const OrdersTable = ({
  orders,
  events,
  onOpen,
  onDelete,
  showEvent = true,
  showTiers = false,
  initialPageSize = 25,
  emptyTitle = 'No orders found',
  emptyDescription,
}: {
  orders: Order[];
  events: Event[];
  onOpen: (order: Order) => void;
  onDelete?: (order: Order) => void;
  showEvent?: boolean;
  showTiers?: boolean;
  initialPageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => setPage(1), [orders.length]);

  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const rows = orders.slice((page - 1) * pageSize, page * pageSize);

  if (orders.length === 0) {
    return <EmptyState icon={Receipt} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-zinc-100 bg-zinc-50/70">
            <tr>
              <th className={th}>Customer</th>
              {showEvent && <th className={th}>Event</th>}
              {showTiers && <th className={th}>Tickets</th>}
              {!showTiers && <th className={cn(th, 'text-right')}>Qty</th>}
              <th className={cn(th, 'text-right')}>Amount</th>
              <th className={th}>Status</th>
              <th className={th}>Entry</th>
              <th className={th}>Placed</th>
              <th className={cn(th, 'w-0')} />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((order) => {
              const scan = scanState(order);
              const event = eventsById.get(order.eventId);
              return (
                <tr key={order.id} onClick={() => onOpen(order)} className="group cursor-pointer transition-colors hover:bg-zinc-50/80">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={order.customerName} size="sm" />
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-medium text-zinc-900">{order.customerName || '—'}</p>
                        <p className="max-w-[220px] truncate text-xs text-zinc-500">{order.customerEmail}</p>
                      </div>
                    </div>
                  </td>
                  {showEvent && (
                    <td className={td}>
                      <span className="block max-w-[220px] truncate">{event?.title || 'Unknown event'}</span>
                    </td>
                  )}
                  {showTiers && (
                    <td className={td}>
                      <div className="space-y-0.5">
                        {(order.tickets || []).map((t, i) => (
                          <p key={t.id || i} className="text-[13px]">
                            <span className="text-zinc-800">{event?.ticketTiers?.find((x) => x.id === t.ticketTierId)?.name || 'Unknown tier'}</span>
                            <span className="text-zinc-400"> × {t.quantity}</span>
                          </p>
                        ))}
                      </div>
                    </td>
                  )}
                  {!showTiers && <td className={cn(td, 'text-right tabular-nums')}>{ticketCount(order)}</td>}
                  <td className={cn(td, 'text-right font-medium tabular-nums text-zinc-900')}>{money(order.totalAmount)}</td>
                  <td className={td}>
                    <Badge tone={orderStatusTone(order.status)} dot className="capitalize">
                      {order.status}
                    </Badge>
                  </td>
                  <td className={td}>
                    <Badge tone={scanTone[scan.state]}>
                      {scan.label}
                      {scan.at && <span className="opacity-70">· {timeOnly(scan.at)}</span>}
                    </Badge>
                  </td>
                  <td className={td}>
                    <p className="text-zinc-700">{shortDate(order.createdAt)}</p>
                    <p className="text-xs text-zinc-400">{timeOnly(order.createdAt)}</p>
                  </td>
                  <td className={cn(td, 'w-0')}>
                    <div className="flex items-center justify-end gap-1">
                      {onDelete && (
                        <IconButton
                          icon={Trash2}
                          label="Delete order"
                          size="sm"
                          variant="danger-subtle"
                          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(order);
                          }}
                        />
                      )}
                      <ChevronRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={orders.length}
        onPage={setPage}
        onPageSize={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />
    </>
  );
};

export default OrdersTable;
