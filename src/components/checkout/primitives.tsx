import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Ticket } from 'lucide-react';
import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';
import { formatGBP, GENDER_OPTIONS, type Gender } from '../../lib/checkout';
import { useSiteTheme } from '../../theme/siteTheme';
import { JackOLantern } from '../halloween/decorations';

const haptic = () => {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* unsupported */
  }
};

// ---------------------------------------------------------------------------
// Animated money - rolls digits when the value changes
// ---------------------------------------------------------------------------

export const AnimatedAmount = ({ value, className }: { value: number; className?: string }) => {
  const text = formatGBP(value);
  return (
    <span className={cn('relative inline-flex overflow-hidden tabular-nums', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 38 }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// ---------------------------------------------------------------------------
// Step progress
// ---------------------------------------------------------------------------

export const StepIndicator = ({ steps, current }: { steps: string[]; current: number }) => (
  <ol className="flex items-start gap-2" aria-label="Checkout progress">
    {steps.map((label, i) => {
      const active = i <= current;
      return (
        <li key={label} className="flex-1" aria-current={i === current ? 'step' : undefined}>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
              initial={false}
              animate={{ width: active ? '100%' : '0%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span
            className={cn(
              'mt-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] transition-colors',
              active ? 'text-white' : 'text-white/35'
            )}
          >
            {label}
          </span>
        </li>
      );
    })}
  </ol>
);

// ---------------------------------------------------------------------------
// Quantity stepper
// ---------------------------------------------------------------------------

interface QuantityStepperProps {
  value: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
}

export const QuantityStepper = ({ value, max, label, onChange }: QuantityStepperProps) => {
  const set = (next: number) => {
    haptic();
    onChange(Math.max(0, Math.min(max, next)));
  };

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {value === 0 ? (
        <motion.button
          key="add"
          type="button"
          onClick={() => set(1)}
          disabled={max <= 0}
          aria-label={`Add ${label} ticket`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileTap={{ scale: 0.94 }}
          className="inline-flex h-12 min-h-0 items-center gap-1.5 rounded-full bg-cta px-6 text-[15px] font-medium text-cta-fg transition hover:shadow-[0_0_24px_-4px_rgb(var(--cta-glow)/0.6)] disabled:opacity-40"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Add
        </motion.button>
      ) : (
        <motion.div
          key="stepper"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="inline-flex h-12 items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/15"
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => set(value - 1)}
            aria-label={`Remove one ${label} ticket`}
            className="grid h-10 min-h-0 w-10 min-w-0 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
          <span className="relative w-8 overflow-hidden text-center text-base font-semibold tabular-nums" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={value}
                className="block"
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 35 }}
              >
                {value}
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => set(value + 1)}
            disabled={value >= max}
            aria-label={`Add one ${label} ticket`}
            className="grid h-10 min-h-0 w-10 min-w-0 place-items-center rounded-full bg-cta text-cta-fg transition disabled:bg-white/20 disabled:text-white/40"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

/** Wrapper classes for an outlined field (pair with <NotchedOutline/>). */
export const outlinedField = 'group/field relative h-14 w-full rounded-2xl';

/**
 * Material-style outline. When `floated`, the label sits on the top border and a
 * real gap is cut into the border behind it (fieldset + legend), so it works on
 * any background. Render inside a `relative` element with the `outlinedField` classes.
 */
export const NotchedOutline = ({
  label,
  floated,
  focused,
  error,
  htmlFor,
  labelId,
}: {
  label: string;
  floated: boolean;
  focused: boolean;
  error?: boolean;
  htmlFor?: string;
  labelId?: string;
}) => (
  <>
    <fieldset
      aria-hidden
      className={cn(
        // top is pulled up by half the legend height so the border line sits on the field's top edge
        'pointer-events-none absolute inset-x-0 -top-1.5 bottom-0 m-0 min-w-0 rounded-2xl border px-[11px] text-left transition-colors duration-200',
        error ? 'border-rose-400/70' : focused ? 'border-accent' : 'border-white/15 group-hover/field:border-white/30'
      )}
    >
      <legend
        className={cn(
          'invisible block h-3 w-auto overflow-hidden whitespace-nowrap p-0 text-xs font-medium leading-3 transition-[max-width] ease-out',
          floated ? 'max-w-full delay-[40ms] duration-150' : 'max-w-[0.01px] duration-75'
        )}
      >
        <span className="inline-block px-1">{label}</span>
      </legend>
    </fieldset>
    <label
      id={labelId}
      htmlFor={htmlFor}
      className={cn(
        'pointer-events-none absolute left-4 max-w-[calc(100%-2rem)] -translate-y-1/2 truncate transition-all duration-150 ease-out',
        floated ? 'top-0 text-xs font-medium' : 'top-1/2 text-base font-normal',
        error ? 'text-rose-300' : focused ? 'text-accent' : floated ? 'text-white/60' : 'text-white/45'
      )}
    >
      {label}
    </label>
  </>
);

export const FieldMessage = ({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) => (
  <AnimatePresence initial={false} mode="wait">
    {error ? (
      <motion.p
        key="error"
        id={id}
        role="alert"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="mt-1.5 px-1 text-xs font-medium text-rose-300"
      >
        {error}
      </motion.p>
    ) : hint ? (
      <motion.p key="hint" id={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 px-1 text-xs text-white/45">
        {hint}
      </motion.p>
    ) : null}
  </AnimatePresence>
);

interface FloatingFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
}

export const FloatingField = forwardRef<HTMLInputElement, FloatingFieldProps>(
  ({ label, value, onChange, error, hint, id, className, onFocus, onBlur, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = `${inputId}-msg`;
    const [focused, setFocused] = useState(false);
    const floated = focused || value !== '';

    return (
      <div className={className}>
        <div className={outlinedField}>
          <input
            ref={ref}
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            aria-invalid={!!error}
            aria-describedby={error || hint ? messageId : undefined}
            className="checkout-input h-full w-full rounded-2xl bg-transparent px-4 text-base text-white outline-none"
            {...props}
          />
          <NotchedOutline label={label} htmlFor={inputId} floated={floated} focused={focused} error={!!error} />
        </div>
        <FieldMessage id={messageId} error={error} hint={hint} />
      </div>
    );
  }
);
FloatingField.displayName = 'FloatingField';

// ---------------------------------------------------------------------------
// Date of birth: DD / MM / YYYY with auto-advance (emits ISO YYYY-MM-DD)
// ---------------------------------------------------------------------------

type DobParts = { d: string; m: string; y: string };

const partsFromIso = (iso: string): DobParts => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? { d: m[3], m: m[2], y: m[1] } : { d: '', m: '', y: '' };
};

const isoFromParts = ({ d, m, y }: DobParts) =>
  d && m && y.length === 4 ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : '';

interface DobFieldProps {
  value: string;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  error?: string;
}

export const DobField = ({ value, onChange, onBlur, error }: DobFieldProps) => {
  const [parts, setParts] = useState<DobParts>(() => partsFromIso(value));
  const [focused, setFocused] = useState(false);
  const dRef = useRef<HTMLInputElement>(null);
  const mRef = useRef<HTMLInputElement>(null);
  const yRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const messageId = `${labelId}-msg`;

  const commit = (next: DobParts) => {
    setParts(next);
    onChange(isoFromParts(next));
  };

  const handleChange = (key: keyof DobParts, raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, key === 'y' ? 4 : 2);
    commit({ ...parts, [key]: digits });
    if (key === 'd' && (digits.length === 2 || (digits.length === 1 && Number(digits) > 3))) mRef.current?.focus();
    if (key === 'm' && (digits.length === 2 || (digits.length === 1 && Number(digits) > 1))) yRef.current?.focus();
  };

  const handleKeyDown = (key: keyof DobParts) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Backspace' || parts[key] !== '') return;
    if (key === 'm') dRef.current?.focus();
    if (key === 'y') mRef.current?.focus();
  };

  // Allow pasting a whole date like 01/02/1999 or 01-02-1999 into any box
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const match = /^(\d{1,2})\D(\d{1,2})\D(\d{4})$/.exec(e.clipboardData.getData('text').trim());
    if (!match) return;
    e.preventDefault();
    commit({ d: match[1].padStart(2, '0'), m: match[2].padStart(2, '0'), y: match[3] });
    yRef.current?.focus();
  };

  const floated = focused || !!(parts.d || parts.m || parts.y);

  const focusFirstEmpty = () => {
    const target = !parts.d ? dRef : !parts.m ? mRef : yRef;
    target.current?.focus();
  };

  const segment = 'min-h-0 bg-transparent p-0 text-base text-white outline-none placeholder:text-white/25';

  return (
    <div>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={messageId}
        onClick={(e) => !(e.target instanceof HTMLInputElement) && focusFirstEmpty()}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setFocused(false);
            onBlur?.();
          }
        }}
        className={cn(outlinedField, 'flex cursor-text items-center px-4')}
      >
        <NotchedOutline label="Date of birth" labelId={labelId} floated={floated} focused={focused} error={!!error} />
        {/* Segments fade in once the label floats (DD / MM / YYYY placeholders would clash with it) */}
        <div className={cn('flex items-center gap-1.5 transition-opacity duration-150', floated ? 'opacity-100' : 'opacity-0')}>
          <input
            ref={dRef}
            inputMode="numeric"
            autoComplete="bday-day"
            placeholder="DD"
            aria-label="Day of birth"
            value={parts.d}
            onChange={(e) => handleChange('d', e.target.value)}
            onKeyDown={handleKeyDown('d')}
            onPaste={handlePaste}
            className={cn(segment, 'w-7')}
          />
          <span className="text-white/25">/</span>
          <input
            ref={mRef}
            inputMode="numeric"
            autoComplete="bday-month"
            placeholder="MM"
            aria-label="Month of birth"
            value={parts.m}
            onChange={(e) => handleChange('m', e.target.value)}
            onKeyDown={handleKeyDown('m')}
            onPaste={handlePaste}
            className={cn(segment, 'w-8')}
          />
          <span className="text-white/25">/</span>
          <input
            ref={yRef}
            inputMode="numeric"
            autoComplete="bday-year"
            placeholder="YYYY"
            aria-label="Year of birth"
            value={parts.y}
            onChange={(e) => handleChange('y', e.target.value)}
            onKeyDown={handleKeyDown('y')}
            onPaste={handlePaste}
            className={cn(segment, 'w-14')}
          />
        </div>
      </div>
      <FieldMessage id={messageId} error={error} hint="You must be 18+ to attend" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Gender segmented control
// ---------------------------------------------------------------------------

export const GenderPicker = ({
  value,
  onChange,
  error,
}: {
  value: Gender | '';
  onChange: (value: Gender) => void;
  error?: string;
}) => {
  const labelId = useId();
  return (
    <div>
      <span id={labelId} className="mb-2 block px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
        Gender
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-2">
        {GENDER_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                haptic();
                onChange(option.value);
              }}
              className={cn(
                'h-12 rounded-2xl border px-3 text-sm font-medium transition-colors',
                selected
                  ? 'border-cta bg-cta text-cta-fg'
                  : error
                    ? 'border-rose-400/50 bg-white/[0.04] text-white/80'
                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:border-white/25'
              )}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
      <FieldMessage id={`${labelId}-msg`} error={error} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Celebration + processing
// ---------------------------------------------------------------------------

const BURST_COLOURS = ['bg-accent', 'bg-accent2', 'bg-slime', 'bg-white'];

export const Burst = () => (
  <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
    {Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const distance = 64 + (i % 3) * 20;
      return (
        <motion.span
          key={i}
          className={cn('absolute -ml-1 -mt-1 h-2 w-2 rounded-full', BURST_COLOURS[i % BURST_COLOURS.length])}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, scale: [0, 1.2, 0.6], opacity: [1, 1, 0] }}
          transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
        />
      );
    })}
  </div>
);

export const ProcessingOverlay = ({ title }: { title: string }) => {
  const { isHalloween } = useSiteTheme();
  return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-surface/85 px-8 text-center backdrop-blur-md"
    role="status"
    aria-live="assertive"
  >
    <div className="relative h-20 w-20">
      <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-r-accent2 border-t-accent" />
      <motion.div
        className="absolute inset-0 grid place-items-center"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {isHalloween ? <JackOLantern className="h-10 w-10" /> : <Ticket className="h-7 w-7 text-white" />}
      </motion.div>
    </div>
    <div>
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-white/60">Please don&apos;t close this window</p>
    </div>
  </motion.div>
  );
};
