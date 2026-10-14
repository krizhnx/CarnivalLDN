import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentType,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, X, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { initials } from './format';

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
      className
    )}
    {...props}
  />
);

export const CardHeader = ({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) => (
  <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
    <div className="min-w-0">
      <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">{title}</h3>
      {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export const PageSection = ({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn('space-y-4', className)}>
    {(title || actions) && (
      <div className="flex items-end justify-between gap-4">
        <div>
          {title && <h2 className="text-base font-semibold tracking-tight text-zinc-900">{title}</h2>}
          {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'danger-subtle' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 active:bg-zinc-950',
  accent: 'bg-violet-600 text-white shadow-sm hover:bg-violet-700',
  secondary: 'border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 hover:border-zinc-300',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  'danger-ghost': 'text-red-600 hover:bg-red-50 hover:text-red-700',
  'danger-subtle': 'text-zinc-500 hover:bg-red-50 hover:text-red-600',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-2.5 text-[13px]',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, loading, className, children, disabled, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
      {IconRight && <IconRight className="h-4 w-4" />}
    </button>
  )
);
Button.displayName = 'Button';

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; variant?: ButtonVariant; size?: 'sm' | 'md' }
>(({ icon: Icon, label, variant = 'ghost', size = 'md', className, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 disabled:pointer-events-none disabled:opacity-40',
      buttonVariants[variant],
      size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
      className
    )}
    {...props}
  >
    <Icon className="h-4 w-4" />
  </button>
));
IconButton.displayName = 'IconButton';

/* ------------------------------------------------------------------ */
/* Badges, avatars, progress                                           */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'orange';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-500/15',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/15',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
};

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-zinc-400',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-sky-500',
  violet: 'bg-violet-500',
  orange: 'bg-orange-500',
};

export const Badge = ({
  tone = 'neutral',
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
      toneClasses[tone],
      className
    )}
  >
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])} />}
    {children}
  </span>
);

export const orderStatusTone = (status?: string): Tone =>
  status === 'completed' ? 'green' : status === 'pending' ? 'amber' : status === 'refunded' ? 'neutral' : 'red';

const avatarPalette = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const Avatar = ({ name, size = 'md', className }: { name?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) => (
  <span
    className={cn(
      'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold',
      avatarPalette[hash(name || '') % avatarPalette.length],
      size === 'sm' && 'h-7 w-7 text-[11px]',
      size === 'md' && 'h-9 w-9 text-xs',
      size === 'lg' && 'h-12 w-12 text-sm',
      className
    )}
  >
    {initials(name)}
  </span>
);

export const Progress = ({
  value,
  className,
  tone = 'violet',
}: {
  value: number;
  className?: string;
  tone?: 'violet' | 'green' | 'amber' | 'red' | 'zinc';
}) => {
  const bar = {
    violet: 'bg-violet-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    zinc: 'bg-zinc-800',
  }[tone];
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-zinc-100', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', bar)}
        style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
      />
    </div>
  );
};

export const sellThroughTone = (p: number): 'green' | 'violet' | 'amber' => (p >= 90 ? 'green' : p >= 50 ? 'violet' : 'amber');

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const controlBase =
  'w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 shadow-[0_1px_1px_rgba(16,24,40,0.03)] outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/[0.06] disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; leading?: ReactNode }>(
  ({ className, invalid, leading, ...props }, ref) =>
    leading ? (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">{leading}</span>
        <input
          ref={ref}
          className={cn(controlBase, 'h-10 pl-9 pr-3', invalid && 'border-red-300 focus:border-red-400 focus:ring-red-500/10', className)}
          {...props}
        />
      </div>
    ) : (
      <input
        ref={ref}
        className={cn(controlBase, 'h-10 px-3', invalid && 'border-red-300 focus:border-red-400 focus:ring-red-500/10', className)}
        {...props}
      />
    )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(controlBase, 'min-h-[88px] px-3 py-2.5 leading-relaxed', invalid && 'border-red-300', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { invalid?: boolean; size?: 'sm' | 'md' }
>(
  ({ className, invalid, children, size = 'md', ...props }, ref) => (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        className={cn(
          controlBase,
          'appearance-none pl-3 pr-9',
          size === 'sm' ? 'h-9' : 'h-10',
          invalid && 'border-red-300'
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  )
);
Select.displayName = 'Select';

export const Field = ({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-700">
        {label}
        {optional && <span className="font-normal text-zinc-400">Optional</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-red-600">{error}</p>
    ) : hint ? (
      <p className="text-xs text-zinc-500">{hint}</p>
    ) : null}
  </div>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <div className={cn('relative', className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(controlBase, 'h-9 pl-9 pr-8')}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        aria-label="Clear search"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

export const Switch = ({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  description?: ReactNode;
}) => (
  <label className={cn('flex items-start gap-3', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10',
        checked ? 'bg-zinc-900' : 'bg-zinc-200'
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          checked && 'translate-x-4'
        )}
      />
    </button>
    {(label || description) && (
      <span className="min-w-0">
        {label && <span className="block text-sm font-medium text-zinc-800">{label}</span>}
        {description && <span className="block text-xs text-zinc-500">{description}</span>}
      </span>
    )}
  </label>
);

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-all',
            value === o.value
              ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)] ring-1 ring-zinc-900/5'
              : 'text-zinc-500 hover:text-zinc-800'
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 text-[11px] tabular-nums',
                value === o.value ? 'bg-zinc-100 text-zinc-700' : 'text-zinc-400'
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data display                                                        */
/* ------------------------------------------------------------------ */

export const Delta = ({ value, className }: { value: number | null; className?: string }) => {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value > 0.05;
  const down = value < -0.05;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        up ? 'bg-emerald-50 text-emerald-700' : down ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500',
        className
      )}
    >
      {up ? '▲' : down ? '▼' : '•'} {Math.abs(value).toFixed(value !== 0 && Math.abs(value) < 10 ? 1 : 0)}%
    </span>
  );
};

export const Stat = ({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  footer,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  delta?: number | null;
  hint?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) => (
  <Card className={cn('p-5', className)}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-[13px] font-medium text-zinc-500">{label}</p>
      {Icon && (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-50 text-zinc-500 ring-1 ring-inset ring-zinc-200/70">
          <Icon className="h-4 w-4" />
        </span>
      )}
    </div>
    <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-zinc-900 tabular-nums">{value}</p>
    {(delta !== undefined || hint) && (
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        {delta !== undefined && <Delta value={delta} />}
        {hint && <span className="truncate">{hint}</span>}
      </div>
    )}
    {footer && <div className="mt-4">{footer}</div>}
  </Card>
);

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
    {Icon && (
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-zinc-50 text-zinc-400 ring-1 ring-inset ring-zinc-200">
        <Icon className="h-5 w-5" />
      </span>
    )}
    <p className="text-sm font-semibold text-zinc-900">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-zinc-100', className)} />
);

export const KeyValue = ({ label, children, mono }: { label: ReactNode; children: ReactNode; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-6 py-2.5 text-sm">
    <dt className="shrink-0 text-zinc-500">{label}</dt>
    <dd className={cn('min-w-0 break-words text-right font-medium text-zinc-900', mono && 'font-mono text-[13px]')}>{children}</dd>
  </div>
);

/* Table class helpers (plain classes keep the markup flexible). */
export const th = 'whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-zinc-500 first:pl-5 last:pr-5';
export const td = 'whitespace-nowrap px-4 py-3 align-middle text-sm text-zinc-700 first:pl-5 last:pr-5';

export const Pagination = ({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  sizes = [10, 25, 50, 100],
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize?: (n: number) => void;
  sizes?: number[];
}) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-4 border-t border-zinc-100 px-5 py-3 text-[13px] text-zinc-500">
      <div className="flex items-center gap-2">
        {onPageSize && (
          <>
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[13px] text-zinc-700 outline-none focus:border-zinc-400"
            >
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">
          {from}–{to} of {total}
        </span>
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} label="Previous page" size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} />
          <span className="min-w-[56px] text-center tabular-nums text-zinc-700">
            {page} / {pages}
          </span>
          <IconButton icon={ChevronRight} label="Next page" size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)} />
        </div>
      </div>
    </div>
  );
};
