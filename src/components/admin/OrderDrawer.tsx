import { Calendar, Copy, CreditCard, MapPin, ScanLine, Ticket, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Event, Order } from '../../types';
import { formatEventDateShort } from '../../lib/checkout';
import { AdminDrawer } from './Modal';
import { Avatar, Badge, Button, IconButton, KeyValue, orderStatusTone } from './ui';
import { ageFrom, genderLabel, longDate, money, orderFees, scanState, shortDateTime, ticketCount, timeOnly } from './format';

const Section = ({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) => (
  <section className="space-y-1">
    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </h4>
    <dl className="divide-y divide-zinc-100">{children}</dl>
  </section>
);

const OrderDrawer = ({
  order,
  event,
  open,
  onClose,
  onDelete,
}: {
  order: Order | null;
  event?: Event | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (order: Order) => void;
}) => {
  const scan = order ? scanState(order) : null;
  const scanTone = scan?.state === 'in' ? 'green' : scan?.state === 'inout' ? 'blue' : scan?.state === 'out' ? 'orange' : 'neutral';

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  return (
    <AdminDrawer
      open={open && !!order}
      onClose={onClose}
      title="Order details"
      description={
        order && (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
            {order.id}
            <button type="button" onClick={() => copy(order.id)} className="text-zinc-400 hover:text-zinc-700" aria-label="Copy order ID">
              <Copy className="h-3 w-3" />
            </button>
          </span>
        )
      }
      footer={
        order && (
          <>
            {onDelete && (
              <Button variant="danger-ghost" icon={Trash2} onClick={() => onDelete(order)} className="mr-auto">
                Delete order
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </>
        )
      }
    >
      {order && (
        <div className="space-y-7">
          {/* Summary */}
          <div className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200/70">
            <Avatar name={order.customerName} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-900">{order.customerName || 'Unknown customer'}</p>
              <p className="truncate text-sm text-zinc-500">{order.customerEmail}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={orderStatusTone(order.status)} dot className="capitalize">
                  {order.status}
                </Badge>
                {scan && (
                  <Badge tone={scanTone}>
                    {scan.label}
                    {scan.at ? ` · ${timeOnly(scan.at)}` : ''}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold tracking-tight tabular-nums text-zinc-900">{money(order.totalAmount)}</p>
              <p className="text-xs text-zinc-500">
                {ticketCount(order)} ticket{ticketCount(order) === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Tickets */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Ticket className="h-3.5 w-3.5" />
              Tickets
            </h4>
            {order.tickets?.length ? (
              <div className="overflow-hidden rounded-xl ring-1 ring-zinc-200">
                {order.tickets.map((t, i) => {
                  const tier = event?.ticketTiers?.find((x) => x.id === t.ticketTierId);
                  return (
                    <div key={t.id || i} className="flex items-center justify-between gap-4 border-b border-zinc-100 px-4 py-3 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">{tier?.name || 'Unknown tier'}</p>
                        <p className="text-xs text-zinc-500">
                          {t.quantity} × {money(t.unitPrice ?? tier?.price ?? 0)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-zinc-900">{money(t.totalPrice || 0)}</p>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between bg-zinc-50/80 px-4 py-2.5 text-xs text-zinc-500">
                  <span>Booking fees included (est.)</span>
                  <span className="tabular-nums">{money(orderFees(order))}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No ticket lines on this order.</p>
            )}
          </section>

          <Section icon={User} title="Customer">
            <KeyValue label="Name">{order.customerName || '—'}</KeyValue>
            <KeyValue label="Email">{order.customerEmail || '—'}</KeyValue>
            {order.customerPhone && <KeyValue label="Phone">{order.customerPhone}</KeyValue>}
            {order.customerDateOfBirth && (
              <KeyValue label="Date of birth">
                {longDate(order.customerDateOfBirth)} · {ageFrom(order.customerDateOfBirth)} yrs
              </KeyValue>
            )}
            {order.customerGender && <KeyValue label="Gender">{genderLabel(order.customerGender)}</KeyValue>}
          </Section>

          <Section icon={CreditCard} title="Payment">
            <KeyValue label="Placed">{shortDateTime(order.createdAt)}</KeyValue>
            <KeyValue label="Total">
              {money(order.totalAmount)} {order.currency?.toUpperCase() || 'GBP'}
            </KeyValue>
            {order.stripePaymentIntentId && (
              <KeyValue label="Stripe" mono>
                <span className="inline-flex items-center gap-1.5">
                  {order.stripePaymentIntentId}
                  <IconButton icon={Copy} label="Copy payment ID" size="sm" className="h-6 w-6" onClick={() => copy(order.stripePaymentIntentId!)} />
                </span>
              </KeyValue>
            )}
          </Section>

          {event && (
            <Section icon={Calendar} title="Event">
              <KeyValue label="Event">{event.title}</KeyValue>
              <KeyValue label="When">
                {formatEventDateShort(event.date)}
                {event.time ? ` · ${event.time}` : ''}
              </KeyValue>
              <KeyValue label="Venue">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  {event.venue}
                </span>
              </KeyValue>
            </Section>
          )}

          <Section icon={ScanLine} title="Entry">
            <KeyValue label="Status">{scan?.label}</KeyValue>
            {order.scans && order.scans.length > 0 && (
              <>
                <KeyValue label="Total scans">{order.scans.length}</KeyValue>
                <KeyValue label="Last scan">{shortDateTime(order.scans[0].scannedAt)}</KeyValue>
                {order.scans[0].scannedBy && <KeyValue label="Scanned by">{order.scans[0].scannedBy}</KeyValue>}
                {order.scans[0].location && <KeyValue label="Location">{order.scans[0].location}</KeyValue>}
              </>
            )}
          </Section>
        </div>
      )}
    </AdminDrawer>
  );
};

export default OrderDrawer;
