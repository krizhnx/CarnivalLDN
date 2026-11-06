import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Hash, Minus, Plus, Ticket, User, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Door } from './useDoor';
import type { DoorResult } from './doorLogic';

type Props = {
  result: DoorResult;
  door: Door;
  onClose: () => void;
  /** replace the result after a follow-up action (let in another, group pass count) */
  onResult: (next: DoorResult) => void;
  /** opened from Look up rather than a scan */
  manual: boolean;
};

/** Big coloured result after a scan or manual check-in. Valid ones close on their own. */
const ResultSheet: React.FC<Props> = ({ result, door, onClose, onResult, manual }) => {
  const [count, setCount] = useState(1);
  const touched = useRef(false);

  const order = result.ticket ? door.findOrder(result.ticket.orderId) : null;
  const line = order?.lines.find((l) => l.tierId === result.ticket?.tierId) ?? null;
  const ticketUsage = result.ticket ? door.ticketUsage(result.ticket.orderId, result.ticket.tierId) : null;
  const ticketLeft = line && ticketUsage ? Math.max(0, line.quantity - ticketUsage.used) : 0;

  const pass = result.pass ? door.findPass(result.pass.passId) : null;
  const passUsage = pass ? door.passUsage(pass) : null;
  const choosing = result.tone === 'valid' && !!pass && !!passUsage && passUsage.remaining > 0;
  const canAddMore = result.tone === 'valid' && !!result.ticket && ticketLeft > 0;

  // Valid results close by themselves (longer when more people can be let in); others wait for a tap.
  useEffect(() => {
    touched.current = false;
    setCount(1);
    if (result.tone !== 'valid' || result.pass) return;
    const t = setTimeout(() => {
      if (!touched.current) onClose();
    }, canAddMore ? 6000 : 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const tone = result.tone;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 backdrop-blur-[2px] sm:items-center sm:p-4', !choosing && 'cursor-pointer')}
      onClick={choosing ? undefined : onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={() => (touched.current = true)}
      >
        <div
          className={cn(
            'flex flex-col items-center px-6 pb-6 pt-8 text-center text-white',
            tone === 'valid' && 'bg-emerald-500',
            tone === 'warn' && 'bg-amber-500',
            tone === 'invalid' && 'bg-red-500'
          )}
        >
          {tone === 'valid' ? (
            <CheckCircle2 className="h-16 w-16" strokeWidth={1.75} />
          ) : tone === 'warn' ? (
            <AlertTriangle className="h-16 w-16" strokeWidth={1.75} />
          ) : (
            <XCircle className="h-16 w-16" strokeWidth={1.75} />
          )}
          <h3 className="mt-3 text-2xl font-bold tracking-tight">{result.title}</h3>
          <p className="mt-1 text-[15px] text-white/90">{result.message}</p>
        </div>

        <div className="space-y-5 p-5">
          {(result.name || result.detail || result.ref) && (
            <dl className="divide-y divide-zinc-100 rounded-2xl bg-zinc-50 px-4 ring-1 ring-inset ring-zinc-200/80">
              {result.name && (
                <div className="flex items-center gap-3 py-3">
                  <User className="h-4 w-4 shrink-0 text-zinc-400" />
                  <dd className="text-[17px] font-semibold text-zinc-900">{result.name}</dd>
                </div>
              )}
              {result.detail && (
                <div className="flex items-center gap-3 py-3">
                  <Ticket className="h-4 w-4 shrink-0 text-zinc-400" />
                  <dd className="text-sm text-zinc-700">{result.detail}</dd>
                  {line && ticketUsage && (
                    <dd className="ml-auto text-sm font-semibold tabular-nums text-zinc-900">
                      {Math.min(ticketUsage.used, line.quantity)}/{line.quantity} in
                    </dd>
                  )}
                </div>
              )}
              {result.ref && (
                <div className="flex items-center gap-3 py-3">
                  <Hash className="h-4 w-4 shrink-0 text-zinc-400" />
                  <dd className="font-mono text-sm tracking-wide text-zinc-700">{result.ref.replace(/^#/, '')}</dd>
                </div>
              )}
            </dl>
          )}

          {canAddMore && line && (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => onResult(door.admitTicket(result.ticket!.orderId, line.tierId, 1, true))}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
              >
                Let in another ({ticketLeft} left)
              </button>
              {ticketLeft > 1 && (
                <button
                  type="button"
                  onClick={() => onResult(door.admitTicket(result.ticket!.orderId, line.tierId, ticketLeft, true))}
                  className="h-11 w-full rounded-2xl text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/30 hover:bg-emerald-50"
                >
                  Let in all {ticketLeft}
                </button>
              )}
            </div>
          )}

          {choosing && pass && passUsage && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-[13px] font-medium text-zinc-500">How many people are entering?</p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCount(Math.max(1, count - 1))}
                    disabled={count <= 1}
                    className="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-800 hover:bg-zinc-200 disabled:opacity-40"
                    aria-label="Fewer people"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={passUsage.remaining}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, passUsage.remaining)))}
                    className="h-14 w-24 rounded-2xl border border-zinc-200 text-center text-3xl font-bold tabular-nums text-zinc-900 outline-none [appearance:textfield] focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCount(Math.min(passUsage.remaining, count + 1))}
                    disabled={count >= passUsage.remaining}
                    className="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-800 hover:bg-zinc-200 disabled:opacity-40"
                    aria-label="More people"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {passUsage.remaining} of {pass.total} left on this pass
                </p>
                {pass.notes && (
                  <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-left ring-1 ring-inset ring-zinc-200/80">
                    <p className="line-clamp-2 text-[13px] leading-5 text-zinc-600">{pass.notes}</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onResult(door.admitPass(pass.id, count, manual))}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
              >
                Let in {count} {count === 1 ? 'person' : 'people'}
              </button>
              <button type="button" onClick={onClose} className="h-11 w-full rounded-2xl text-sm font-medium text-zinc-600 hover:bg-zinc-100">
                Cancel
              </button>
            </div>
          )}

          {!choosing && <p className="text-center text-xs text-zinc-400">Tap anywhere to continue</p>}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultSheet;
