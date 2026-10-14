import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Calendar, ChevronLeft, Lock, MapPin, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  loadStripe,
  type PaymentRequest,
  type PaymentRequestPaymentMethodEvent,
  type StripeElementsOptions,
} from '@stripe/stripe-js';
import { CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Event, Order } from '../../types';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { trackBeginCheckout, trackPurchase, trackTicketView } from '../../lib/googleAnalytics';
import {
  analyticsItems,
  computeTotals,
  EMPTY_CUSTOMER,
  formatEventDateShort,
  isTierSoldOut,
  isValidDiscountCode,
  normaliseCode,
  sortTiers,
  validateCustomer,
  validateField,
  type CustomerField,
  type CustomerInfo,
  type FieldErrors,
  type TicketSelection,
} from '../../lib/checkout';
import { Drawer, DrawerContent, DrawerDescription, DrawerHandle, DrawerTitle } from '../ui/drawer';
import { AnimatedAmount, ProcessingOverlay, StepIndicator } from './primitives';
import { useThemeCopy } from '../../theme/copy';
import TicketStep from './TicketStep';
import DetailsStep from './DetailsStep';
import PaymentStep from './PaymentStep';
import SuccessStep from './SuccessStep';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51OyBk9IgkIAGwv6wTnbqfLaivBQ0wYCltGf0gS4yeEZpxkD1f5jKEwarmr294R0LXNEzEMNxHuCKLRpMH8DYgaWD00g8BPRDAG'
);

const ELEMENTS_OPTIONS: StripeElementsOptions = {
  locale: 'en-GB',
  fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap' }],
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

type Step = 'tickets' | 'details' | 'payment' | 'success';
type FlowStep = Exclude<Step, 'success'>;
type WalletCustomer = CustomerInfo & { applePayEmail?: string | null };

const STEP_LABELS: Record<FlowStep, string> = { tickets: 'Tickets', details: 'Details', payment: 'Payment' };

const getAffiliateLinkId = () => sessionStorage.getItem('affiliate_link_id');
const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');
const readError = async (res: Response, fallback: string) => {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || fallback;
};

/**
 * Stripe's 3-D Secure challenge renders in an iframe appended to <body>, i.e.
 * *outside* the drawer. Radix's modal focus trap would steal focus back from
 * it (breaking OTP entry), so we swallow focus events that target Stripe
 * frames living outside the drawer before Radix sees them.
 */
const useAllowExternalStripeFrames = () => {
  useEffect(() => {
    const isExternalStripeFrame = (node: EventTarget | null) =>
      node instanceof HTMLIFrameElement &&
      (node.name.startsWith('__privateStripe') || node.src.startsWith('https://js.stripe.com')) &&
      !node.closest('[data-vaul-drawer]');

    const onFocusIn = (e: FocusEvent) => {
      if (isExternalStripeFrame(e.target)) e.stopImmediatePropagation();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isExternalStripeFrame(e.relatedTarget)) e.stopImmediatePropagation();
    };

    window.addEventListener('focusin', onFocusIn, true);
    window.addEventListener('focusout', onFocusOut, true);
    return () => {
      window.removeEventListener('focusin', onFocusIn, true);
      window.removeEventListener('focusout', onFocusOut, true);
    };
  }, []);
};

// ---------------------------------------------------------------------------

interface CheckoutFlowProps {
  event: Event;
  onClose: () => void;
  onLockChange: (locked: boolean) => void;
  onOrderComplete?: (order: Order) => void;
}

const CheckoutFlow = ({ event, onClose, onLockChange, onOrderComplete }: CheckoutFlowProps) => {
  const stripe = useStripe();
  const elements = useElements();
  useAllowExternalStripeFrames();
  const copy = useThemeCopy();

  const tiers = useMemo(() => sortTiers(event.ticketTiers), [event.ticketTiers]);
  const allSoldOut = tiers.length > 0 && tiers.every(isTierSoldOut);

  const [step, setStep] = useState<Step>('tickets');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY_CUSTOMER);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<CustomerField, boolean>>>({});
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [postcode, setPostcode] = useState('');
  const [cardReady, setCardReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [wallet, setWallet] = useState<PaymentRequest | null>(null);
  const [walletKey, setWalletKey] = useState(0);
  const [heroCollapsed, setHeroCollapsed] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const beganCheckout = useRef(false);

  const selections = useMemo<TicketSelection[]>(
    () =>
      tiers
        .filter((t) => (quantities[t.id] ?? 0) > 0)
        .map((t) => ({ tierId: t.id, tier: t, quantity: quantities[t.id] })),
    [tiers, quantities]
  );
  const totals = useMemo(() => computeTotals(selections, appliedCode), [selections, appliedCode]);
  const isFree = totals.quantity > 0 && totals.total === 0;
  const isPaid = totals.total > 0;
  const flowSteps: FlowStep[] = isFree ? ['tickets', 'details'] : ['tickets', 'details', 'payment'];
  const stepIndex = step === 'success' ? flowSteps.length : flowSteps.indexOf(step);

  // --- lifecycle -----------------------------------------------------------

  useEffect(() => {
    trackTicketView(event.id, event.title);
  }, [event.id, event.title]);

  useEffect(() => onLockChange(processing), [processing, onLockChange]);
  useEffect(() => () => onLockChange(false), [onLockChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const goTo = (next: Step, dir: 1 | -1 = 1) => {
    setDirection(dir);
    setError(null);
    setHeroCollapsed(false);
    setStep(next);
  };

  const goBack = () => {
    if (processing) return;
    if (step === 'payment') goTo('details', -1);
    else if (step === 'details') goTo('tickets', -1);
  };

  // --- customer details ----------------------------------------------------

  const updateCustomer = <K extends CustomerField>(field: K, value: CustomerInfo[K]) => {
    const next = { ...customer, [field]: value };
    setCustomer(next);
    if (fieldErrors[field] || touched[field]) {
      setFieldErrors((errs) => ({ ...errs, [field]: validateField(field, next) }));
    }
  };

  const blurField = (field: CustomerField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setFieldErrors((errs) => ({ ...errs, [field]: validateField(field, customer) }));
  };

  const cleanCustomer = (): CustomerInfo => ({
    ...customer,
    name: customer.name.trim(),
    email: customer.email.trim(),
    phone: customer.phone.trim(),
  });

  // --- orders --------------------------------------------------------------

  const buildOrder = (opts: {
    orderId?: string;
    paymentIntentId: string | null;
    info: CustomerInfo;
    totalAmount: number;
    free: boolean;
  }): Order => {
    const id = opts.orderId || `order_${Date.now()}`;
    const now = new Date();
    return {
      id,
      eventId: event.id,
      userId: opts.info.email,
      stripePaymentIntentId: opts.paymentIntentId,
      status: 'completed',
      totalAmount: opts.totalAmount,
      currency: 'gbp',
      tickets: selections.map((s) => ({
        id: `ticket_${Date.now()}_${s.tierId}`,
        orderId: id,
        ticketTierId: s.tierId,
        quantity: s.quantity,
        unitPrice: opts.free ? 0 : s.tier.price,
        totalPrice: opts.free ? 0 : s.tier.price * s.quantity,
      })),
      customerEmail: opts.info.email,
      customerName: opts.info.name,
      customerPhone: opts.info.phone,
      customerDateOfBirth: opts.info.dateOfBirth,
      customerGender: opts.info.gender || undefined,
      createdAt: now,
      updatedAt: now,
    };
  };

  const completeOrder = (completed: Order, free = false) => {
    trackPurchase(completed.id, event.id, event.title, completed.totalAmount, analyticsItems(selections, free));
    setOrder(completed);
    goTo('success');
    onOrderComplete?.(completed);
  };

  const finalisePaidOrder = async (paymentIntentId: string, info: WalletCustomer) => {
    const res = await fetch('/api/confirm-payment', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        paymentIntentId,
        eventId: event.id,
        tickets: selections,
        customerInfo: info,
        totalAmount: totals.total,
        affiliateLinkId: getAffiliateLinkId(),
      }),
    });

    if (!res.ok) {
      const reason = await readError(res, "We couldn't confirm your order");
      throw new Error(`${reason}. Your payment went through - please contact us quoting ${paymentIntentId}.`);
    }

    const data = await res.json();
    completeOrder(
      buildOrder({
        orderId: data.order?.id,
        paymentIntentId: data.paymentIntentId ?? paymentIntentId,
        info,
        totalAmount: totals.total,
        free: false,
      })
    );
  };

  const submitFreeOrder = async () => {
    const info = cleanCustomer();
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/create-free-order', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ eventId: event.id, tickets: selections, customerInfo: info, totalAmount: 0 }),
      });
      if (!res.ok) throw new Error(await readError(res, 'Failed to create free order'));
      const data = await res.json();
      completeOrder(buildOrder({ orderId: data.order?.id, paymentIntentId: null, info, totalAmount: 0, free: true }), true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const payByCard = async () => {
    if (!stripe || !elements) {
      setError('Payments are still loading - try again in a second.');
      return;
    }
    if (!cardReady) {
      setError('Please complete your card details.');
      return;
    }
    if (postcode.trim().length < 3) {
      setError('Please enter your billing postcode.');
      return;
    }
    const card = elements.getElement(CardNumberElement);
    if (!card) return;

    const info = cleanCustomer();
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          eventId: event.id,
          tickets: selections,
          customerInfo: info,
          totalAmount: totals.total,
          affiliateLinkId: getAffiliateLinkId(),
        }),
      });
      if (!res.ok) throw new Error(await readError(res, 'Failed to create payment intent'));
      const { clientSecret } = await res.json();

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { name: info.name, email: info.email, address: { postal_code: postcode.trim() } },
        },
      });
      if (paymentError) throw new Error(paymentError.message || 'Payment failed');
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment could not be completed. Please try again.');

      await finalisePaidOrder(paymentIntent.id, info);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  // --- Apple Pay (Payment Request) ----------------------------------------

  const totalRef = useRef(totals.total);
  totalRef.current = totals.total;
  const walletHandlerRef = useRef<(ev: PaymentRequestPaymentMethodEvent) => void>();

  // Re-assigned every render so the Stripe listener always sees fresh state.
  walletHandlerRef.current = async (ev) => {
    if (!stripe) {
      ev.complete('fail');
      return;
    }
    const base = cleanCustomer();
    const info: WalletCustomer = {
      ...base,
      name: base.name || ev.payerName || '',
      email: base.email, // always the form email (avoids Apple "Hide My Email" relays)
      applePayEmail: ev.payerEmail || null,
      phone: base.phone || ev.payerPhone || '',
    };

    let settled = false;
    const settle = (status: 'success' | 'fail') => {
      if (!settled) {
        settled = true;
        ev.complete(status);
      }
    };

    setError(null);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          eventId: event.id,
          tickets: selections,
          customerInfo: info,
          totalAmount: totals.total,
          affiliateLinkId: getAffiliateLinkId(),
          isApplePay: true,
        }),
      });
      if (!res.ok) {
        settle('fail');
        setError(await readError(res, 'Failed to create payment intent'));
        return;
      }
      const { clientSecret } = await res.json();

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      );
      if (confirmError) {
        settle('fail');
        setError(confirmError.message || 'Payment failed');
        return;
      }

      settle('success');
      setProcessing(true);

      let intent = paymentIntent;
      if (intent.status === 'requires_action') {
        const next = await stripe.confirmCardPayment(clientSecret);
        if (next.error || !next.paymentIntent) throw new Error(next.error?.message || 'Payment authentication failed');
        intent = next.paymentIntent;
      }
      if (intent.status !== 'succeeded') throw new Error('Payment could not be completed. Please try again.');

      await finalisePaidOrder(intent.id, info);
    } catch (err) {
      settle('fail');
      setError(errorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!stripe || step !== 'payment' || !isPaid) return;

    const request = stripe.paymentRequest({
      country: 'GB',
      currency: 'gbp',
      total: { label: `${event.title} Tickets`, amount: totalRef.current },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });
    let active = true;
    request.on('paymentmethod', (ev) => walletHandlerRef.current?.(ev));
    request
      .canMakePayment()
      .then((result) => {
        // Apple Pay only (matches previous behaviour)
        if (active && result?.applePay) {
          setWallet(request);
          setWalletKey((k) => k + 1);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
      request.off('paymentmethod');
      setWallet(null);
    };
  }, [stripe, step, isPaid, event.title]);

  useEffect(() => {
    wallet?.update({ total: { label: `${event.title} Tickets`, amount: totals.total } });
  }, [wallet, totals.total, event.title]);

  // --- step actions --------------------------------------------------------

  const continueFromTickets = () => {
    if (totals.quantity === 0) return;
    if (!beganCheckout.current) {
      beganCheckout.current = true;
      trackBeginCheckout(event.id, event.title, totals.total, analyticsItems(selections));
    }
    goTo('details');
  };

  const continueFromDetails = () => {
    const errs = validateCustomer(customer);
    setFieldErrors(errs);
    setTouched({ name: true, email: true, phone: true, dateOfBirth: true, gender: true });
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() =>
        scrollRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      );
      return;
    }
    if (isFree) void submitFreeOrder();
    else goTo('payment');
  };

  const applyCode = (code: string) => {
    if (!isValidDiscountCode(code)) return false;
    setAppliedCode(normaliseCode(code));
    setError(null);
    return true;
  };

  // --- render --------------------------------------------------------------

  const cta: { label: ReactNode; onClick: () => void; disabled: boolean; icon?: typeof ArrowRight; shimmer?: boolean } =
    step === 'tickets'
      ? {
          label: allSoldOut ? 'Sold out' : totals.quantity ? 'Continue' : 'Select tickets',
          onClick: continueFromTickets,
          disabled: totals.quantity === 0,
          icon: totals.quantity ? ArrowRight : undefined,
        }
      : step === 'details'
        ? {
            label: isFree ? 'Get free tickets' : 'Checkout',
            onClick: continueFromDetails,
            disabled: processing,
            icon: ArrowRight,
          }
        : step === 'payment'
          ? {
              label: (
                <>
                  Pay <AnimatedAmount value={totals.total} />
                </>
              ),
              onClick: () => void payByCard(),
              disabled: processing || !stripe,
              icon: Lock,
              shimmer: true,
            }
          : { label: 'Done', onClick: onClose, disabled: false };

  const CtaIcon = cta.icon;
  const showFooterSummary = (step === 'tickets' || step === 'details') && totals.quantity > 0;
  const floatingClose = step === 'tickets' || step === 'success';
  const hideFooter = step === 'tickets' && tiers.length === 0;

  const closeButton = (className?: string) => (
    <button
      type="button"
      onClick={onClose}
      disabled={processing}
      aria-label="Close"
      className={cn(
        'grid h-10 min-h-0 w-10 min-w-0 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-40',
        className
      )}
    >
      <X className="h-5 w-5" />
    </button>
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <DrawerTitle className="sr-only">Tickets for {event.title}</DrawerTitle>
      <DrawerDescription className="sr-only">
        Choose tickets, enter your details and pay securely for {event.title}.
      </DrawerDescription>

      {floatingClose &&
        closeButton('absolute right-4 top-[30px] z-30 md:top-4 bg-black/45 ring-1 ring-white/15 backdrop-blur-md hover:bg-black/60')}

      {/* Collapsed title bar once the hero scrolls away */}
      <AnimatePresence>
        {step === 'tickets' && heroCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[88px] items-center border-b border-white/5 bg-surface/85 pl-5 pr-16 pt-5 backdrop-blur-xl md:h-[72px] md:pt-0"
          >
            <p className="truncate font-display text-lg font-semibold uppercase tracking-tight text-white">{event.title}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact header for details / payment */}
      {(step === 'details' || step === 'payment') && (
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 shrink-0 border-b border-white/5 px-5 pb-4 pt-9 md:pt-5"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={processing}
              aria-label="Back"
              className="grid h-10 min-h-0 w-10 min-w-0 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white transition hover:bg-white/10 disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-white">{event.title}</p>
              <p className="mt-0.5 flex min-w-0 items-center gap-3 text-xs text-white/55">
                {event.date && (
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <Calendar className="h-3 w-3 text-accent" />
                    {formatEventDateShort(event.date)}
                  </span>
                )}
                {event.venue && (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-accent2" />
                    <span className="truncate">{event.venue}</span>
                  </span>
                )}
              </p>
            </div>
            {closeButton('bg-white/[0.06] hover:bg-white/10')}
          </div>
          <div className="mt-4">
            <StepIndicator steps={flowSteps.map((s) => STEP_LABELS[s])} current={stepIndex} />
          </div>
        </motion.header>
      )}

      {/* Scrollable step body */}
      <div
        ref={scrollRef}
        onScroll={(e) => step === 'tickets' && setHeroCollapsed(e.currentTarget.scrollTop > 210)}
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d * 32, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -32, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 'tickets' && (
              <TicketStep
                event={event}
                tiers={tiers}
                quantities={quantities}
                onQuantityChange={(tierId, q) => setQuantities((prev) => ({ ...prev, [tierId]: q }))}
              />
            )}
            {step === 'details' && (
              <DetailsStep customer={customer} errors={fieldErrors} onChange={updateCustomer} onBlur={blurField} />
            )}
            {step === 'payment' && (
              <PaymentStep
                event={event}
                selections={selections}
                totals={totals}
                appliedCode={appliedCode}
                onApplyCode={applyCode}
                onRemoveCode={() => setAppliedCode(null)}
                wallet={wallet}
                walletKey={walletKey}
                postcode={postcode}
                onPostcodeChange={setPostcode}
                onCardReadyChange={setCardReady}
                email={customer.email.trim()}
                onEditDetails={() => goTo('details', -1)}
              />
            )}
            {step === 'success' && order && <SuccessStep event={event} order={order} selections={selections} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky footer */}
      {!hideFooter && (
        <div className="relative z-20 shrink-0 border-t border-white/10 bg-surface/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  role="alert"
                  className="mb-3 flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  <span className="flex-1">{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    aria-label="Dismiss error"
                    className="-m-1 grid h-7 min-h-0 w-7 min-w-0 place-items-center rounded-full text-rose-200 hover:bg-rose-500/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* One full-width bar: order summary on the left, action on the right */}
          <motion.button
            type="button"
            onClick={cta.onClick}
            disabled={cta.disabled}
            whileTap={cta.disabled ? undefined : { scale: 0.98 }}
            className={cn(
              'group relative flex h-14 w-full items-center gap-2 overflow-hidden rounded-2xl text-base font-semibold transition-[background-color,color,box-shadow] duration-300',
              'bg-cta text-cta-fg shadow-[0_0_40px_-12px_rgb(var(--cta-glow)/0.55)] hover:shadow-[0_0_50px_-8px_rgb(var(--glow)/0.6)]',
              'disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none',
              showFooterSummary ? 'justify-between pl-5 pr-4 text-left' : 'justify-center px-6'
            )}
          >
            {cta.shimmer && !cta.disabled && (
              <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-cta-shimmer/50 to-transparent" />
            )}

            {showFooterSummary && (
              <span className="relative flex min-w-0 items-center">
                <span className="sr-only">
                  {totals.quantity} ticket{totals.quantity === 1 ? '' : 's'}, total{totals.fee > 0 ? ' including fees' : ''}
                </span>
                <span className="flex min-w-0 items-baseline gap-1">
                  <AnimatedAmount value={totals.total} className="shrink-0 text-[22px] font-bold leading-tight tracking-tight" />
                  {totals.fee > 0 && (
                    <span className="truncate text-[11px] font-normal opacity-60" aria-hidden>
                      incl. fees
                    </span>
                  )}
                </span>
              </span>
            )}

            <span className="relative inline-flex shrink-0 items-center gap-1.5">
              {CtaIcon === Lock && <Lock className="h-4 w-4" />}
              <span className="inline-flex items-center gap-1">{cta.label}</span>
              {CtaIcon && CtaIcon !== Lock && (
                <CtaIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              )}
            </span>
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {processing && <ProcessingOverlay title={isFree ? copy.processingFree : copy.processingPaid} />}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------

export interface CheckoutSheetProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderComplete?: (order: Order) => void;
}

/**
 * Event checkout as a sheet: bottom drawer on mobile, floating side panel on
 * desktop. Steps: tickets -> details -> payment -> success.
 */
const CheckoutSheet = ({ event, open, onOpenChange, onOrderComplete }: CheckoutSheetProps) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [locked, setLocked] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && locked) return;
    onOpenChange(next);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction={isDesktop ? 'right' : 'bottom'} dismissible={!locked}>
      <DrawerContent>
        <DrawerHandle />
        {event && (
          <Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
            <CheckoutFlow
              key={event.id}
              event={event}
              onClose={() => handleOpenChange(false)}
              onLockChange={setLocked}
              onOrderComplete={onOrderComplete}
            />
          </Elements>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CheckoutSheet;
