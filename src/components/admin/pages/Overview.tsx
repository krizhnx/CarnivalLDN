import { useMemo } from 'react';
import { ArrowRight, CalendarDays, Download, PoundSterling, Plus, Receipt, Ticket, Wallet } from 'lucide-react';
import type { Event, Order } from '../../../types';
import { AreaChart, BarList } from '../charts';
import { Avatar, Button, Card, CardHeader, EmptyState, Progress, Skeleton, Stat, sellThroughTone } from '../ui';
import {
  eventCapacity,
  eventSold,
  money,
  moneyCompact,
  moneyWhole,
  num,
  orderFees,
  parseLooseDate,
  relativeTime,
  startOfToday,
  ticketCount,
  toDate,
} from '../format';

export type Timeframe = '7d' | '30d' | '90d';
export const TIMEFRAME_DAYS: Record<Timeframe, number> = { '7d': 7, '30d': 30, '90d': 90 };

const change = (cur: number, prev: number): number | null => (prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? null : 0);

const sum = (orders: Order[], f: (o: Order) => number) => orders.reduce((s, o) => s + f(o), 0);

const Overview = ({
  events,
  orders,
  timeframe,
  loading,
  onOpenOrder,
  onSelectEvent,
  onViewOrders,
  onCreateEvent,
  onExportCustomers,
}: {
  events: Event[];
  orders: Order[];
  timeframe: Timeframe;
  loading: boolean;
  onOpenOrder: (order: Order) => void;
  onSelectEvent: (eventId: string) => void;
  onViewOrders: () => void;
  onCreateEvent: () => void;
  onExportCustomers: () => void;
}) => {
  const days = TIMEFRAME_DAYS[timeframe];

  const data = useMemo(() => {
    const start = startOfToday();
    start.setDate(start.getDate() - (days - 1));
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - days);

    const current: Order[] = [];
    const previous: Order[] = [];
    for (const o of orders) {
      const t = toDate(o.createdAt).getTime();
      if (t >= start.getTime()) current.push(o);
      else if (t >= prevStart.getTime()) previous.push(o);
    }

    const gross = sum(current, (o) => o.totalAmount || 0);
    const fees = sum(current, orderFees);
    const tickets = sum(current, ticketCount);
    const prevGross = sum(previous, (o) => o.totalAmount || 0);
    const prevNet = prevGross - sum(previous, orderFees);
    const prevTickets = sum(previous, ticketCount);

    // Daily series
    const buckets = new Map<string, { value: number; sub: number }>();
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toDateString();
      const entry = { value: 0, sub: 0 };
      buckets.set(key, entry);
      return { d, entry };
    });
    for (const o of current) {
      const b = buckets.get(toDate(o.createdAt).toDateString());
      if (b) {
        b.value += o.totalAmount || 0;
        b.sub += 1;
      }
    }

    // Revenue by event + tiers
    const byEvent = new Map<string, number>();
    const byTier = new Map<string, { sold: number; revenue: number }>();
    for (const o of current) {
      byEvent.set(o.eventId, (byEvent.get(o.eventId) || 0) + (o.totalAmount || 0));
      for (const t of o.tickets || []) {
        const cur = byTier.get(t.ticketTierId) || { sold: 0, revenue: 0 };
        cur.sold += t.quantity || 0;
        cur.revenue += t.totalPrice || 0;
        byTier.set(t.ticketTierId, cur);
      }
    }
    const eventTitle = new Map(events.map((e) => [e.id, e.title]));
    const tierInfo = new Map<string, { name: string; event: string }>();
    events.forEach((e) => e.ticketTiers?.forEach((t) => tierInfo.set(t.id, { name: t.name, event: e.title })));

    const revenueByEvent = [...byEvent.entries()]
      .map(([id, value]) => ({ key: id, id, label: eventTitle.get(id) || 'Unknown event', value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const topTiers = [...byTier.entries()]
      .map(([id, v]) => ({ key: id, label: tierInfo.get(id)?.name || 'Unknown tier', meta: tierInfo.get(id)?.event, value: v.sold }))
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Upcoming events
    const today = startOfToday();
    const upcoming = events
      .filter((e) => !e.isArchived)
      .map((e) => ({ event: e, date: parseLooseDate(e.date) }))
      .filter((x): x is { event: Event; date: Date } => !!x.date && x.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);

    return {
      gross,
      net: gross - fees,
      fees,
      tickets,
      count: current.length,
      aov: current.length ? gross / current.length : 0,
      deltas: {
        gross: change(gross, prevGross),
        net: change(gross - fees, prevNet),
        tickets: change(tickets, prevTickets),
        orders: change(current.length, previous.length),
      },
      series: series.map(({ d, entry }) => ({
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        value: entry.value,
        sub: entry.sub,
      })),
      revenueByEvent,
      topTiers,
      upcoming,
      recent: orders.slice(0, 7),
    };
  }, [orders, events, days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="p-5 xl:col-span-2">
            <Skeleton className="h-[300px] w-full" />
          </Card>
          <Card className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </Card>
        </div>
      </div>
    );
  }

  const vs = (delta: number | null, noun: string) => (delta === null ? `no ${noun} in previous ${days} days` : `vs previous ${days} days`);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Gross revenue" icon={PoundSterling} value={moneyWhole(data.gross)} delta={data.deltas.gross} hint={vs(data.deltas.gross, 'sales')} />
        <Stat label="Net revenue" icon={Wallet} value={moneyWhole(data.net)} delta={data.deltas.net} hint={`after ${moneyWhole(data.fees)} booking fees`} />
        <Stat label="Tickets sold" icon={Ticket} value={num(data.tickets)} delta={data.deltas.tickets} hint={vs(data.deltas.tickets, 'tickets')} />
        <Stat label="Orders" icon={Receipt} value={num(data.count)} delta={data.deltas.orders} hint={`${money(data.aov)} average order`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue"
            description={`Daily gross sales · last ${days} days`}
            actions={
              <Button size="sm" icon={Download} onClick={onExportCustomers}>
                Export customers
              </Button>
            }
          />
          <div className="px-3 pb-4 pt-4">
            <AreaChart
              data={data.series}
              height={300}
              formatValue={money}
              formatAxis={moneyCompact}
              subLabel={(n) => `${n} order${n === 1 ? '' : 's'}`}
            />
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Upcoming events" description="All-time sell-through" />
          <div className="flex-1 px-2 pb-3 pt-3">
            {data.upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing scheduled"
                description="Create an event to start selling."
                action={
                  <Button size="sm" variant="primary" icon={Plus} onClick={onCreateEvent}>
                    New event
                  </Button>
                }
                className="py-10"
              />
            ) : (
              <ul>
                {data.upcoming.map(({ event, date }) => {
                  const cap = eventCapacity(event);
                  const sold = eventSold(event);
                  const p = cap ? (sold / cap) * 100 : 0;
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onSelectEvent(event.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-50"
                      >
                        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-zinc-50 ring-1 ring-inset ring-zinc-200">
                          <span className="text-[10px] font-semibold uppercase leading-none text-violet-600">
                            {date.toLocaleDateString('en-GB', { month: 'short' })}
                          </span>
                          <span className="mt-0.5 text-base font-semibold leading-none text-zinc-900">{date.getDate()}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-zinc-900">{event.title}</span>
                          <span className="mt-1.5 flex items-center gap-2">
                            <Progress value={p} tone={sellThroughTone(p)} className="flex-1" />
                            <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                              {num(sold)}/{num(cap)}
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Revenue by event" description={`Last ${days} days`} />
          <div className="p-5">
            <BarList
              items={data.revenueByEvent.map((e) => ({ key: e.key, label: e.label, value: e.value }))}
              formatValue={moneyWhole}
              empty={<p className="py-8 text-center text-sm text-zinc-400">No sales in this period</p>}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Best-selling tiers" description="Tickets sold" />
          <div className="p-5">
            <BarList
              items={data.topTiers}
              formatValue={num}
              empty={<p className="py-8 text-center text-sm text-zinc-400">No tickets sold in this period</p>}
            />
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title="Latest orders"
            actions={
              <Button size="sm" variant="ghost" iconRight={ArrowRight} onClick={onViewOrders}>
                All orders
              </Button>
            }
          />
          <ul className="flex-1 px-2 pb-3 pt-2">
            {data.recent.length === 0 && <li className="py-8 text-center text-sm text-zinc-400">No orders yet</li>}
            {data.recent.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpenOrder(o)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-zinc-50"
                >
                  <Avatar name={o.customerName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-zinc-900">{o.customerName || o.customerEmail}</span>
                    <span className="block truncate text-xs text-zinc-500">
                      {ticketCount(o)} × {events.find((e) => e.id === o.eventId)?.title || 'Unknown event'}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[13px] font-semibold tabular-nums text-zinc-900">{money(o.totalAmount)}</span>
                    <span className="block text-[11px] text-zinc-400">{relativeTime(o.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
