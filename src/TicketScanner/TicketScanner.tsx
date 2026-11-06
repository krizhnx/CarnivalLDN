import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ChevronDown, Loader2, RefreshCw, ScanLine, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { eventDayStart, eventHasPassed, scanWindowEnd } from '../lib/eventDates';
import QrCamera from './QrCamera';
import LookupPanel from './LookupPanel';
import ResultSheet from './ResultSheet';
import { useDoor } from './useDoor';
import type { DoorResult } from './doorLogic';

type Tab = 'scan' | 'lookup';

const dayLabel = (date: string) =>
  eventDayStart(date)?.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) ?? date;
const timeLabel = (ms: number | null) => (ms ? new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null);

const TicketScanner: React.FC = () => {
  const navigate = useNavigate();
  const door = useDoor();
  const [tab, setTab] = useState<Tab>('scan');
  const [result, setResult] = useState<{ value: DoorResult; manual: boolean } | null>(null);
  const [checking, setChecking] = useState(false);

  const busyRef = useRef(false);
  const resultRef = useRef(result);
  resultRef.current = result;
  const lastScan = useRef({ text: '', until: 0, current: '' });

  const { scan } = door;
  const handleCode = useCallback(
    async (text: string) => {
      if (busyRef.current || resultRef.current) return;
      // the same code still in front of the camera after a result was dismissed
      if (text === lastScan.current.text && Date.now() < lastScan.current.until) return;
      busyRef.current = true;
      setChecking(true);
      try {
        lastScan.current.current = text;
        setResult({ value: await scan(text), manual: false });
      } finally {
        busyRef.current = false;
        setChecking(false);
      }
    },
    [scan]
  );

  const closeResult = useCallback(() => {
    const r = resultRef.current;
    if (r && !r.manual) {
      // Don't re-read the same QR straight away: long pause after letting someone in, short after a problem.
      lastScan.current = { ...lastScan.current, text: lastScan.current.current, until: Date.now() + (r.value.tone === 'valid' ? 8000 : 1500) };
    }
    setResult(null);
  }, []);

  const event = door.event;
  const closed = event ? eventHasPassed(event.date) : false;
  const sortedEvents = useMemo(
    () => [...door.events].sort((a, b) => (eventDayStart(b.date)?.getTime() ?? 0) - (eventDayStart(a.date)?.getTime() ?? 0)),
    [door.events]
  );

  const pill = {
    loading: { text: 'Loading list', cls: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20', dot: 'animate-pulse bg-zinc-400' },
    live: { text: 'Live', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
    saving: { text: `Saving ${door.pendingCount}`, cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'animate-pulse bg-amber-500' },
    offline: {
      text: door.pendingCount ? `Offline · ${door.pendingCount} to save` : 'Offline',
      cls: 'bg-red-50 text-red-700 ring-red-600/20',
      dot: 'bg-red-500',
    },
  }[door.connection];

  return (
    <div className="min-h-screen bg-[#f6f6f7] font-sans text-zinc-900 antialiased">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-[#f6f6f7]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Event picker */}
          <label className="relative min-w-0 flex-1 cursor-pointer rounded-lg px-1.5 py-1 hover:bg-zinc-200/50">
            <span className="flex items-center gap-1">
              <span className="truncate text-[15px] font-semibold tracking-tight">{event ? event.title : 'Door check-in'}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
            </span>
            <span className="block truncate text-xs text-zinc-500">{event ? [dayLabel(event.date), event.time].filter(Boolean).join(' · ') : 'Pick an event'}</span>
            <select
              value={event?.id ?? ''}
              onChange={(e) => door.selectEvent(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Event"
            >
              {!event && <option value="">Pick an event</option>}
              {sortedEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} · {dayLabel(e.date)}
                </option>
              ))}
            </select>
          </label>

          <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', pill.cls)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', pill.dot)} />
            {pill.text}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-10 pt-4">
        {/* Checked-in count */}
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="text-[13px] font-medium text-zinc-500">Checked in</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {door.totals.inside}
              <span className="text-base font-medium text-zinc-400"> / {door.totals.expected}</span>
            </p>
          </div>
          <div className="text-right text-xs text-zinc-500">
            {door.ready ? (
              <>
                <p>
                  {door.orderCount} orders · {door.passCount} passes
                </p>
                <p>List updated {timeLabel(door.lastUpdated)}</p>
              </>
            ) : door.loadError ? null : (
              <p className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Downloading list…
              </p>
            )}
          </div>
        </div>

        {door.loadError && !door.ready && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-red-800 ring-1 ring-inset ring-red-600/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p>{door.loadError}</p>
              <button type="button" onClick={() => door.reload()} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline">
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          </div>
        )}

        {closed && event && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-inset ring-amber-600/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Check-in for this event closed{' '}
              {scanWindowEnd(event.date)?.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', weekday: 'short', day: 'numeric', month: 'short' })}. Pick
              another event at the top.
            </p>
          </div>
        )}

        {door.failing.length > 0 && (
          <button
            type="button"
            onClick={() => door.retrySaving()}
            className="mt-4 flex w-full items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-left text-[13px] text-red-800 ring-1 ring-inset ring-red-600/20"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {door.failing.length} check-in{door.failing.length === 1 ? '' : 's'} couldn’t be saved to the system (order #{door.failing[0].ref}). They still count on
              this phone and keep retrying. Tap to retry now; if this stays, tell the admin.
            </span>
          </button>
        )}

        {/* Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-200/60 p-1">
          {(
            [
              ['scan', 'Scan', ScanLine],
              ['lookup', 'Look up', Search],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors',
                tab === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className={cn('mt-4', tab !== 'scan' && 'hidden')}>
          <div className="relative rounded-3xl border border-zinc-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            {/* codes are only read once the event is known */}
            <QrCamera enabled={tab === 'scan'} reading={tab === 'scan' && !result && !checking && !!event} onCode={handleCode} />
            {!event && !door.loadError && (
              <div className="absolute left-1/2 top-6 -translate-x-1/2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-lg">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading events…
                </span>
              </div>
            )}
            {checking && (
              <div className="absolute left-1/2 top-6 -translate-x-1/2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-lg">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking…
                </span>
              </div>
            )}
          </div>
          <p className="mt-4 flex items-start gap-3 rounded-2xl bg-white/60 px-4 py-3 text-[13px] text-zinc-600 ring-1 ring-inset ring-zinc-200/80">
            <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            Hold the QR code inside the frame. Tickets check in one person per scan; group passes ask how many people are entering. QR won’t read? Use Look up.
          </p>
        </div>

        <div className={cn('mt-4', tab !== 'lookup' && 'hidden')}>
          <LookupPanel door={door} active={tab === 'lookup'} onResult={(value) => setResult({ value, manual: true })} />
        </div>
      </main>

      <AnimatePresence>
        {result && (
          <ResultSheet
            key="result"
            result={result.value}
            manual={result.manual}
            door={door}
            onClose={closeResult}
            onResult={(value) => setResult({ value, manual: result.manual })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketScanner;
