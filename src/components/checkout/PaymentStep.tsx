import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, CreditCard, Mail, MapPin, ShieldCheck, Tag, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  PaymentRequestButtonElement,
  useElements,
} from '@stripe/react-stripe-js';
import type { PaymentRequest, StripeElementChangeEvent, StripeElementStyle } from '@stripe/stripe-js';
import type { Event } from '../../types';
import { cn } from '../../lib/utils';
import { formatEventDateShort, formatGBP, type CheckoutTotals, type TicketSelection } from '../../lib/checkout';
import { AnimatedAmount, FloatingField, NotchedOutline, outlinedField } from './primitives';
import { useThemeCopy } from '../../theme/copy';

const ELEMENT_STYLE: StripeElementStyle = {
  base: {
    color: '#fafafa',
    fontFamily: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    fontSize: '16px',
    fontWeight: '500',
    fontSmoothing: 'antialiased',
    iconColor: 'rgba(255,255,255,0.75)',
    '::placeholder': { color: 'rgba(255,255,255,0.28)' },
    ':-webkit-autofill': { color: '#fafafa' },
  },
  invalid: { color: '#fda4af', iconColor: '#fda4af' },
};

type CardKey = 'number' | 'expiry' | 'cvc';
type CardState = Record<CardKey, { complete: boolean; empty: boolean; error?: string }>;

const INITIAL_CARD: CardState = {
  number: { complete: false, empty: true },
  expiry: { complete: false, empty: true },
  cvc: { complete: false, empty: true },
};

// ---------------------------------------------------------------------------

const SummaryRow = ({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) => (
  <div className={cn('flex items-baseline justify-between gap-4', className)}>
    <dt className="min-w-0">{label}</dt>
    <dd className="shrink-0 tabular-nums">{value}</dd>
  </div>
);

const OrderSummary = ({
  event,
  selections,
  totals,
}: {
  event: Event;
  selections: TicketSelection[];
  totals: CheckoutTotals;
}) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
    <div className="flex items-center gap-3 p-4">
      <img src={event.image} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-medium text-white">{event.title}</p>
        {(event.date || event.time) && (
          <p className="flex items-center gap-3 text-xs text-white/60">
            {event.date && (
              <span className="inline-flex shrink-0 items-center gap-1">
                <Calendar className="h-3 w-3 text-accent" />
                {formatEventDateShort(event.date)}
              </span>
            )}
            {event.time && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Clock className="h-3 w-3 shrink-0 text-accent" />
                <span className="truncate">{event.time}</span>
              </span>
            )}
          </p>
        )}
        {event.venue && (
          <p className="flex min-w-0 items-center gap-1 text-xs text-white/50">
            <MapPin className="h-3 w-3 shrink-0 text-accent2" />
            <span className="truncate">{event.venue}</span>
          </p>
        )}
      </div>
    </div>

    {/* Ticket perforation */}
    <div className="relative h-px" aria-hidden>
      <div className="absolute inset-x-5 top-0 border-t border-dashed border-white/15" />
      <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-surface ring-1 ring-white/10" />
      <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-surface ring-1 ring-white/10" />
    </div>

    <dl className="space-y-2 p-4 text-sm text-white/70">
      {selections.map((s) => (
        <SummaryRow
          key={s.tierId}
          className="text-white"
          label={
            <span>
              {s.quantity} × {s.tier.name}
              {s.tier.lastEntryTime && (
                <span className="block text-[11px] text-white/45">Last entry {s.tier.lastEntryTime}</span>
              )}
            </span>
          }
          value={s.tier.price === 0 ? 'Free' : formatGBP(s.tier.price * s.quantity)}
        />
      ))}
      <div className="!my-3 h-px bg-white/10" />
      <SummaryRow label="Subtotal" value={formatGBP(totals.subtotal)} />
      <AnimatePresence initial={false}>
        {totals.discount > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <SummaryRow className="text-emerald-300" label="Promo code" value={`−${formatGBP(totals.discount)}`} />
          </motion.div>
        )}
      </AnimatePresence>
      <SummaryRow label="Booking fee" value={formatGBP(totals.fee)} />
      <SummaryRow
        className="pt-1 text-base font-semibold text-white"
        label="Total"
        value={<AnimatedAmount value={totals.total} />}
      />
    </dl>
  </div>
);

// ---------------------------------------------------------------------------

const PromoCode = ({
  appliedCode,
  discount,
  onApply,
  onRemove,
}: {
  appliedCode: string | null;
  discount: number;
  onApply: (code: string) => boolean;
  onRemove: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();

  const apply = () => {
    if (!code.trim()) return;
    if (onApply(code)) {
      setCode('');
      setError(undefined);
      setOpen(false);
    } else {
      setError("That code isn't valid");
    }
  };

  if (appliedCode) {
    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 py-2 pl-4 pr-2"
      >
        <Tag className="h-4 w-4 text-emerald-300" />
        <span className="text-sm font-semibold tracking-wider text-emerald-200">{appliedCode}</span>
        <span className="ml-auto text-sm font-medium text-emerald-200">−{formatGBP(discount)}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove promo code"
          className="grid h-9 min-h-0 w-9 min-w-0 place-items-center rounded-full text-emerald-200 transition hover:bg-emerald-400/15"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-0 items-center gap-2 text-sm font-medium text-white/65 transition hover:text-white"
      >
        <Tag className="h-4 w-4" /> Have a promo code?
      </button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2" data-vaul-no-drag>
      <FloatingField
        className="flex-1"
        label="Promo code"
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="done"
        value={code}
        onChange={(v) => {
          setCode(v.toUpperCase());
          setError(undefined);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            apply();
          }
        }}
        error={error}
      />
      <button
        type="button"
        onClick={apply}
        disabled={!code.trim()}
        className="h-14 shrink-0 rounded-2xl bg-white/10 px-5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-40"
      >
        Apply
      </button>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------

const StripeField = ({
  label,
  focused,
  empty,
  error,
  onRequestFocus,
  children,
}: {
  label: string;
  focused: boolean;
  empty: boolean;
  error?: string;
  onRequestFocus: () => void;
  children: ReactNode;
}) => {
  const floated = focused || !empty;
  return (
    // Tapping anywhere in the box focuses the Stripe iframe (it's only one line tall)
    <div className={cn(outlinedField, 'flex cursor-text items-center px-4')} onClick={onRequestFocus}>
      <NotchedOutline label={label} floated={floated} focused={focused} error={!!error} />
      {/* Stripe's placeholder/card icon fade in once the label floats, so they never clash with it */}
      <div className={cn('w-full transition-opacity duration-150', floated ? 'opacity-100' : 'opacity-0')}>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------

interface PaymentStepProps {
  event: Event;
  selections: TicketSelection[];
  totals: CheckoutTotals;
  appliedCode: string | null;
  onApplyCode: (code: string) => boolean;
  onRemoveCode: () => void;
  wallet: PaymentRequest | null;
  walletKey: number;
  postcode: string;
  onPostcodeChange: (value: string) => void;
  onCardReadyChange: (ready: boolean) => void;
  email: string;
  onEditDetails: () => void;
}

const PaymentStep = ({
  event,
  selections,
  totals,
  appliedCode,
  onApplyCode,
  onRemoveCode,
  wallet,
  walletKey,
  postcode,
  onPostcodeChange,
  onCardReadyChange,
  email,
  onEditDetails,
}: PaymentStepProps) => {
  const [card, setCard] = useState<CardState>(INITIAL_CARD);
  const [focused, setFocused] = useState<CardKey | null>(null);

  const handleChange = (key: CardKey) => (e: StripeElementChangeEvent) =>
    setCard((prev) => ({ ...prev, [key]: { complete: e.complete, empty: e.empty, error: e.error?.message } }));
  const elements = useElements();
  const focusElement = (key: CardKey) => () => {
    const el =
      key === 'number'
        ? elements?.getElement(CardNumberElement)
        : key === 'expiry'
          ? elements?.getElement(CardExpiryElement)
          : elements?.getElement(CardCvcElement);
    el?.focus();
  };

  const ready = card.number.complete && card.expiry.complete && card.cvc.complete;
  useEffect(() => onCardReadyChange(ready), [ready, onCardReadyChange]);
  useEffect(() => () => onCardReadyChange(false), [onCardReadyChange]);

  const cardError = card.number.error || card.expiry.error || card.cvc.error;
  const copy = useThemeCopy();
  const elementEvents = (key: CardKey) => ({
    onChange: handleChange(key),
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((f) => (f === key ? null : f)),
  });

  return (
    <div className="space-y-6 px-5 pb-6 pt-5">
      <div>
        <h3 className="font-display text-2xl font-semibold tracking-tight text-white">{copy.paymentTitle}</h3>
        <p className="mt-1 text-sm text-white/55">{copy.paymentSubtitle}</p>
      </div>

      <OrderSummary event={event} selections={selections} totals={totals} />

      <PromoCode appliedCode={appliedCode} discount={totals.discount} onApply={onApplyCode} onRemove={onRemoveCode} />

      <section className="space-y-4">
        {wallet && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="overflow-hidden rounded-2xl">
              <PaymentRequestButtonElement
                key={walletKey}
                options={{
                  paymentRequest: wallet,
                  style: { paymentRequestButton: { theme: 'light', height: '52px', type: 'buy' } },
                }}
              />
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">
              <span className="h-px flex-1 bg-white/10" /> or pay by card <span className="h-px flex-1 bg-white/10" />
            </div>
          </motion.div>
        )}

        <div className="space-y-4" data-vaul-no-drag>
          <div className="flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
            <CreditCard className="h-3.5 w-3.5" /> Card details
          </div>
          <StripeField
            label="Card number"
            focused={focused === 'number'}
            empty={card.number.empty}
            error={card.number.error}
            onRequestFocus={focusElement('number')}
          >
            <CardNumberElement
              options={{ style: ELEMENT_STYLE, showIcon: true, placeholder: '1234 1234 1234 1234' }}
              {...elementEvents('number')}
            />
          </StripeField>
          <div className="grid grid-cols-2 gap-3">
            <StripeField
              label="Expiry"
              focused={focused === 'expiry'}
              empty={card.expiry.empty}
              error={card.expiry.error}
              onRequestFocus={focusElement('expiry')}
            >
              <CardExpiryElement options={{ style: ELEMENT_STYLE }} {...elementEvents('expiry')} />
            </StripeField>
            <StripeField
              label="CVC"
              focused={focused === 'cvc'}
              empty={card.cvc.empty}
              error={card.cvc.error}
              onRequestFocus={focusElement('cvc')}
            >
              <CardCvcElement options={{ style: ELEMENT_STYLE }} {...elementEvents('cvc')} />
            </StripeField>
          </div>
          <FloatingField
            label="Billing postcode"
            autoComplete="postal-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={10}
            value={postcode}
            onChange={(v) => onPostcodeChange(v.toUpperCase())}
          />
          <AnimatePresence>
            {cardError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="px-1 text-xs font-medium text-rose-300"
              >
                {cardError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </section>

      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm">
        <Mail className="h-4 w-4 shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-white/70">
          Tickets to <span className="font-medium text-white">{email}</span>
        </span>
        <button
          type="button"
          onClick={onEditDetails}
          className="min-h-0 shrink-0 text-xs font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          Edit
        </button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-white/40">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Encrypted &amp; processed securely by Stripe
      </p>
    </div>
  );
};

export default PaymentStep;
