import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock, Download, FileSpreadsheet, MapPin, Pencil, PoundSterling, ScanLine, Ticket, Users, Wallet } from 'lucide-react';
import type { Event, Order } from '../../../types';
import { cn } from '../../../lib/utils';
import { formatEventDateShort } from '../../../lib/checkout';
import { AreaChart, Donut } from '../charts';
import OrdersTable from '../OrdersTable';
import { Badge, Button, Card, CardHeader, EmptyState, KeyValue, Progress, SearchInput, Stat, sellThroughTone, td, th } from '../ui';
import {
  ageFrom,
  downloadCsv,
  eventCapacity,
  money,
  moneyCompact,
  moneyWhole,
  num,
  orderFees,
  parseLooseDate,
  pct,
  scanState,
  startOfToday,
  ticketCount,
  toDate,
} from '../format';

const AGE_COLORS = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'];
const GENDER_COLORS = ['#0ea5e9', '#ec4899', '#10b981', '#a1a1aa'];

const EventOverview = ({
  event,
  orders,
  onBack,
  onEdit,
  onGuestlists,
  onExportEventData,
  onOpenOrder,
  onDeleteOrder,
}: {
  event: Event;
  orders: Order[];
  onBack: () => void;
  onEdit: (event: Event) => void;
  onGuestlists: (event: Event) => void;
  onExportEventData: (eventId: string) => void;
  onOpenOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
}) => {
  const [search, setSearch] = useState('');

  const eventOrders = useMemo(() => orders.filter((o) => o.eventId === event.id), [orders, event.id]);

  const stats = useMemo(() => {
    const gross = eventOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const fees = eventOrders.reduce((s, o) => s + orderFees(o), 0);
    const tickets = eventOrders.reduce((s, o) => s + ticketCount(o), 0);
    const capacity = eventCapacity(event);
    const checkedIn = eventOrders.filter((o) => {
      const s = scanState(o).state;
      return s === 'in' || s === 'inout';
    }).length;

    // Tiers
    const tiers = (event.ticketTiers || [])
      .map((tier) => {
        let sold = 0;
        let revenue = 0;
        for (const o of eventOrders)
          for (const t of o.tickets || [])
            if (t.ticketTierId === tier.id) {
              sold += t.quantity || 0;
              revenue += t.totalPrice || 0;
            }
        return { tier, sold, revenue };
      })
      .sort((a, b) => a.tier.price - b.tier.price);

    // Daily series from first sale
    const byDay = new Map<string, { value: number; sub: number }>();
    for (const o of eventOrders) {
      const k = toDate(o.createdAt).toDateString();
      const cur = byDay.get(k) || { value: 0, sub: 0 };
      cur.value += o.totalAmount || 0;
      cur.sub += 1;
      byDay.set(k, cur);
    }
    let series: { label: string; value: number; sub: number }[] = [];
    if (eventOrders.length) {
      const times = eventOrders.map((o) => toDate(o.createdAt).getTime());
      const first = new Date(Math.min(...times));
      first.setHours(0, 0, 0, 0);
      const last = new Date(Math.max(...times));
      last.setHours(0, 0, 0, 0);
      const today = startOfToday();
      const evDate = parseLooseDate(event.date);
      let end = last;
      if (evDate && evDate >= today && today > end) end = today;
      const start = new Date(Math.max(first.getTime(), end.getTime() - 119 * 86400000));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const v = byDay.get(d.toDateString()) || { value: 0, sub: 0 };
        series.push({ label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), ...v });
      }
      if (series.length === 1) series = [{ ...series[0], label: '' }, series[0]];
    }

    const peak = [...byDay.entries()].sort((a, b) => b[1].value - a[1].value)[0];

    // Demographics
    const ages = { '18–24': 0, '25–34': 0, '35–44': 0, '45+': 0 };
    const genders = { male: 0, female: 0, other: 0, prefer_not_to_say: 0 };
    for (const o of eventOrders) {
      if (o.customerDateOfBirth) {
        const a = ageFrom(o.customerDateOfBirth);
        if (a >= 18 && a <= 24) ages['18–24']++;
        else if (a >= 25 && a <= 34) ages['25–34']++;
        else if (a >= 35 && a <= 44) ages['35–44']++;
        else if (a >= 45) ages['45+']++;
      }
      if (o.customerGender && o.customerGender in genders) genders[o.customerGender]++;
    }

    return {
      gross,
      net: gross - fees,
      fees,
      tickets,
      capacity,
      checkedIn,
      tiers,
      series,
      peak: peak ? { date: new Date(peak[0]), value: peak[1].value } : null,
      sellingDays: byDay.size,
      ages,
      genders,
    };
  }, [eventOrders, event]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eventOrders;
    return eventOrders.filter(
      (o) => o.customerName?.toLowerCase().includes(q) || o.customerEmail?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q)
    );
  }, [eventOrders, search]);

  const exportSales = () => {
    const rows: (string | number)[][] = [];
    for (const o of eventOrders) {
      const scan = scanState(o);
      for (const t of o.tickets || []) {
        const tier = event.ticketTiers?.find((x) => x.id === t.ticketTierId);
        rows.push([
          o.id.slice(0, 8),
          o.customerName || '',
          o.customerEmail || '',
          tier?.name || 'Unknown tier',
          t.quantity || 0,
          tier ? (tier.price / 100).toFixed(2) : '',
          ((t.totalPrice || 0) / 100).toFixed(2),
          o.status,
          scan.label,
          o.scans?.length ? toDate(o.scans[0].scannedAt).toLocaleString('en-GB') : 'Never',
          toDate(o.createdAt).toLocaleDateString('en-GB'),
          toDate(o.createdAt).toLocaleTimeString('en-GB'),
        ]);
      }
    }
    if (!rows.length) return;
    downloadCsv(
      `event-sales-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`,
      ['Order ID', 'Customer Name', 'Customer Email', 'Ticket Tier', 'Quantity', 'Unit Price (£)', 'Total Price (£)', 'Order Status', 'Scan Status', 'Last Scan Time', 'Order Date', 'Order Time'],
      rows
    );
  };

  const evDate = parseLooseDate(event.date);
  const isPast = evDate ? evDate < startOfToday() : false;
  const capPct = stats.capacity ? (stats.tickets / stats.capacity) * 100 : 0;
  const inPct = eventOrders.length ? (stats.checkedIn / eventOrders.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="h-4 w-4" />
        All events overview
      </button>

      {/* Header */}
      <Card className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
          {event.image && <img src={event.image} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold tracking-tight text-zinc-900">{event.title}</h2>
            {event.isArchived ? <Badge>Archived</Badge> : isPast ? <Badge>Past</Badge> : <Badge tone="green" dot>On sale</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatEventDateShort(event.date)}
            </span>
            {event.time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {event.time}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.venue}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={Pencil} onClick={() => onEdit(event)}>
            Edit
          </Button>
          <Button size="sm" icon={Users} onClick={() => onGuestlists(event)}>
            Guestlists
          </Button>
          <Button size="sm" icon={Download} onClick={() => onExportEventData(event.id)}>
            Export data
          </Button>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Gross revenue" icon={PoundSterling} value={moneyWhole(stats.gross)} hint={`${num(eventOrders.length)} orders`} />
        <Stat label="Net revenue" icon={Wallet} value={moneyWhole(stats.net)} hint={`after ${moneyWhole(stats.fees)} booking fees`} />
        <Stat
          label="Tickets sold"
          icon={Ticket}
          value={
            <>
              {num(stats.tickets)}
              <span className="text-base font-medium text-zinc-400"> / {num(stats.capacity)}</span>
            </>
          }
          footer={
            <div className="flex items-center gap-2">
              <Progress value={capPct} tone={sellThroughTone(capPct)} className="flex-1" />
              <span className="text-xs tabular-nums text-zinc-500">{pct(capPct)}</span>
            </div>
          }
        />
        <Stat
          label="Checked in"
          icon={ScanLine}
          value={
            <>
              {num(stats.checkedIn)}
              <span className="text-base font-medium text-zinc-400"> / {num(eventOrders.length)} orders</span>
            </>
          }
          footer={
            <div className="flex items-center gap-2">
              <Progress value={inPct} tone="zinc" className="flex-1" />
              <span className="text-xs tabular-nums text-zinc-500">{pct(inPct)}</span>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sales over time" description="Daily gross sales since tickets went on sale" />
          <div className="px-3 pb-4 pt-4">
            {stats.series.length ? (
              <AreaChart data={stats.series} height={280} formatValue={money} formatAxis={moneyCompact} subLabel={(n) => `${n} order${n === 1 ? '' : 's'}`} />
            ) : (
              <EmptyState icon={Ticket} title="No sales yet" description="Sales will chart here once orders come in." />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="At a glance" />
          <dl className="divide-y divide-zinc-100 px-5 pb-3 pt-2">
            <KeyValue label="Average order">{money(eventOrders.length ? stats.gross / eventOrders.length : 0)}</KeyValue>
            <KeyValue label="Revenue per ticket">{money(stats.tickets ? stats.gross / stats.tickets : 0)}</KeyValue>
            <KeyValue label="Peak day">
              {stats.peak ? (
                <>
                  {stats.peak.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  <span className="ml-1.5 font-normal text-zinc-500">{moneyWhole(stats.peak.value)}</span>
                </>
              ) : (
                '—'
              )}
            </KeyValue>
            <KeyValue label="Days with sales">{stats.sellingDays}</KeyValue>
            <KeyValue label="Tiers selling">
              {stats.tiers.filter((t) => t.sold > 0).length} / {stats.tiers.length}
            </KeyValue>
          </dl>
        </Card>
      </div>

      {/* Tiers */}
      <Card className="overflow-hidden">
        <CardHeader title="Ticket tiers" description="Sold counts from orders; capacity from tier settings" className="pb-4" />
        {stats.tiers.length === 0 ? (
          <EmptyState icon={Ticket} title="No tiers configured" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-y border-zinc-100 bg-zinc-50/70">
                <tr>
                  <th className={th}>Tier</th>
                  <th className={cn(th, 'text-right')}>Price</th>
                  <th className={cn(th, 'w-[32%]')}>Sold</th>
                  <th className={cn(th, 'text-right')}>Revenue</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.tiers.map(({ tier, sold, revenue }) => {
                  const p = tier.capacity ? (sold / tier.capacity) * 100 : 0;
                  const soldOut = tier.capacity - tier.soldCount <= 0;
                  return (
                    <tr key={tier.id}>
                      <td className={td}>
                        <p className="font-medium text-zinc-900">{tier.name}</p>
                        {tier.lastEntryTime && <p className="text-xs text-zinc-500">Last entry {tier.lastEntryTime}</p>}
                      </td>
                      <td className={cn(td, 'text-right tabular-nums')}>{tier.price === 0 ? 'Free' : money(tier.price)}</td>
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <Progress value={p} tone={sellThroughTone(p)} className="flex-1" />
                          <span className="w-20 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                            {num(sold)} / {num(tier.capacity)}
                          </span>
                        </div>
                      </td>
                      <td className={cn(td, 'text-right font-medium tabular-nums text-zinc-900')}>{money(revenue)}</td>
                      <td className={td}>
                        {tier.isActive === false ? (
                          <Badge tone="amber">Sales off</Badge>
                        ) : soldOut ? (
                          <Badge tone="red">Sold out</Badge>
                        ) : (
                          <Badge tone="green" dot>
                            Selling
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Age" description="Lead bookers with a date of birth" />
          <div className="p-5">
            {Object.values(stats.ages).some(Boolean) ? (
              <Donut
                centerLabel="bookers"
                segments={Object.entries(stats.ages).map(([label, value], i) => ({ label, value, color: AGE_COLORS[i] }))}
              />
            ) : (
              <EmptyState icon={Users} title="No age data yet" className="py-8" />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Gender" description="Lead bookers who shared it" />
          <div className="p-5">
            {Object.values(stats.genders).some(Boolean) ? (
              <Donut
                centerLabel="bookers"
                segments={[
                  { label: 'Male', value: stats.genders.male, color: GENDER_COLORS[0] },
                  { label: 'Female', value: stats.genders.female, color: GENDER_COLORS[1] },
                  { label: 'Other', value: stats.genders.other, color: GENDER_COLORS[2] },
                  { label: 'Prefer not to say', value: stats.genders.prefer_not_to_say, color: GENDER_COLORS[3] },
                ]}
              />
            ) : (
              <EmptyState icon={Users} title="No gender data yet" className="py-8" />
            )}
          </div>
        </Card>
      </div>

      {/* Orders */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Orders"
          description={`${num(eventOrders.length)} orders for this event`}
          className="pb-4"
          actions={
            <>
              <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, ID" className="w-64" />
              <Button size="md" icon={FileSpreadsheet} onClick={exportSales} disabled={!eventOrders.length}>
                Export sales
              </Button>
            </>
          }
        />
        <div className="border-t border-zinc-100">
          <OrdersTable
            orders={filtered}
            events={[event]}
            onOpen={onOpenOrder}
            onDelete={onDeleteOrder}
            showEvent={false}
            showTiers
            initialPageSize={10}
            emptyTitle={search ? 'No matching orders' : 'No orders for this event yet'}
          />
        </div>
      </Card>
    </div>
  );
};

export default EventOverview;
