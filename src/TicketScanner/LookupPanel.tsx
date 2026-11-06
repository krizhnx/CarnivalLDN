import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Search, Users, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Door } from './useDoor';
import { DoorOrder, DoorPass, DoorResult, SearchHit, passLabel, refQuery, shortRef } from './doorLogic';

type Props = {
  door: Door;
  active: boolean;
  onResult: (result: DoorResult) => void;
};

/** Manual check-in: find an order or group pass by reference, name, email or phone. */
const LookupPanel: React.FC<Props> = ({ door, active, onResult }) => {
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState<{ q: string; hits: SearchHit[]; offline: boolean } | null>(null);
  const [searchingRemote, setSearchingRemote] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) setTimeout(() => inputRef.current?.focus(), 50);
  }, [active]);

  const q = query.trim();
  // `door` is a new object on every render, so results follow check-ins and list refreshes
  const local = useMemo(() => (q.length >= 2 ? door.search(q) : []), [q, door]);

  // A reference that isn't on tonight's list: look it up across all events.
  const ref = refQuery(q);
  const wantRemote = !!ref && ref.length >= 6 && local.length === 0;
  useEffect(() => {
    if (!wantRemote) return;
    if (remote?.q === q) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearchingRemote(true);
      const res = await door.searchServer(q);
      if (!cancelled) {
        setRemote({ q, ...res });
        setSearchingRemote(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, wantRemote]);

  const hits = local.length ? local : remote?.q === q ? remote.hits : [];

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Order number, name, email or phone"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="h-14 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-12 text-[17px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Clear"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {q.length < 2 && (
          <p className="rounded-2xl bg-white/60 px-4 py-3 text-[13px] leading-relaxed text-zinc-600 ring-1 ring-inset ring-zinc-200/80">
            The order number is on the ticket PDF and confirmation email, e.g. <span className="font-mono font-semibold text-zinc-800">#3F9C2A71</span>. Group
            passes have a pass number too. Searches tonight’s list on this phone, so it works without signal.
          </p>
        )}

        {q.length >= 2 && hits.length === 0 && (
          <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-zinc-500 ring-1 ring-inset ring-zinc-200/80">
            {searchingRemote ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking all events…
              </span>
            ) : remote?.q === q && remote.offline ? (
              'Not on tonight’s list, and the server can’t be reached to check other events.'
            ) : (
              'No matches on tonight’s list.'
            )}
          </div>
        )}

        {hits.map((hit) =>
          hit.kind === 'order' ? (
            <OrderCard key={hit.order.id} order={hit.order} door={door} onResult={onResult} />
          ) : (
            <PassCard key={hit.pass.id} pass={hit.pass} door={door} onResult={onResult} />
          )
        )}
      </div>
    </div>
  );
};

const OtherEvent: React.FC<{ title?: string }> = ({ title }) => (
  <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">For another event{title ? `: ${title}` : ''}</p>
);

const OrderCard: React.FC<{ order: DoorOrder; door: Door; onResult: (r: DoorResult) => void }> = ({ order, door, onResult }) => {
  const otherEvent = order.eventId !== door.event?.id;
  const paid = order.status === 'completed';
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-inset ring-zinc-200/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold text-zinc-900">{order.name}</p>
          <p className="mt-0.5 truncate text-[13px] text-zinc-500">
            <span className="font-mono font-medium text-zinc-700">#{shortRef(order.id)}</span>
            {order.email && <> · {order.email}</>}
          </p>
        </div>
        {!paid && <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">Not paid</span>}
      </div>

      {otherEvent ? (
        <OtherEvent title={door.titleOf(order.eventId)} />
      ) : (
        <div className="mt-3 divide-y divide-zinc-100 rounded-xl bg-zinc-50 ring-1 ring-inset ring-zinc-200/80">
          {order.lines.map((line) => {
            const used = Math.min(line.quantity, door.ticketUsage(order.id, line.tierId).used);
            const left = line.quantity - used;
            return (
              <div key={line.tierId} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800">{line.tierName}</p>
                  <p className="text-xs tabular-nums text-zinc-500">
                    {used} of {line.quantity} in
                  </p>
                </div>
                {!paid ? null : left === 0 ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400">
                    <Check className="h-4 w-4" /> All in
                  </span>
                ) : (
                  <div className="flex shrink-0 gap-2">
                    {left > 1 && (
                      <button
                        type="button"
                        onClick={() => onResult(door.admitTicket(order.id, line.tierId, left, true))}
                        className="h-10 rounded-xl px-3 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/30 hover:bg-emerald-50"
                      >
                        All {left}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onResult(door.admitTicket(order.id, line.tierId, 1, true))}
                      className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Admit 1
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {order.lines.length === 0 && <p className="px-3 py-2.5 text-sm text-zinc-500">No tickets on this order.</p>}
        </div>
      )}
    </div>
  );
};

const PassCard: React.FC<{ pass: DoorPass; door: Door; onResult: (r: DoorResult) => void }> = ({ pass, door, onResult }) => {
  const otherEvent = pass.eventId !== door.event?.id;
  const usage = door.passUsage(pass);
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-inset ring-zinc-200/80">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-600/10">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-zinc-900">{pass.name}</p>
          <p className="mt-0.5 truncate text-[13px] text-zinc-500">
            <span className="font-mono font-medium text-zinc-700">#{shortRef(pass.id)}</span> · {passLabel(pass)}
          </p>
        </div>
      </div>
      {otherEvent ? (
        <OtherEvent title={door.titleOf(pass.eventId)} />
      ) : (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-inset ring-zinc-200/80">
          <p className="flex-1 text-sm tabular-nums text-zinc-700">
            <span className="font-semibold text-zinc-900">{usage.used}</span> of {pass.total} in
          </p>
          {usage.remaining === 0 ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400">
              <Check className="h-4 w-4" /> All in
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onResult(door.openPass(pass.id))}
              className={cn('h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700')}
            >
              Check in…
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LookupPanel;
