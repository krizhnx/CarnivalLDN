import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button, IconButton } from './ui';

/* Only the top-most open layer reacts to Escape; body scroll is locked while any layer is open. */
const layerStack: string[] = [];

const useLayer = (open: boolean, onClose: () => void, dismissable: boolean) => {
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    layerStack.push(id);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable && layerStack[layerStack.length - 1] === id) {
        e.stopPropagation();
        closeRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const i = layerStack.lastIndexOf(id);
      if (i >= 0) layerStack.splice(i, 1);
      if (layerStack.length === 0) document.body.style.overflow = prevOverflow === 'hidden' ? '' : prevOverflow;
    };
  }, [open, id, dismissable]);
};

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  size?: keyof typeof sizes;
  footer?: ReactNode;
  headerActions?: ReactNode;
  dismissable?: boolean;
  /** Set false for forms so a stray click outside doesn't discard input. */
  closeOnBackdrop?: boolean;
  bodyClassName?: string;
  children: ReactNode;
}

export const AdminModal = ({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  size = 'md',
  footer,
  headerActions,
  dismissable = true,
  closeOnBackdrop = true,
  bodyClassName,
  children,
}: AdminModalProps) => {
  useLayer(open, onClose, dismissable);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={dismissable && closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_64px_-12px_rgba(16,24,40,0.28)] ring-1 ring-zinc-900/5 sm:rounded-2xl',
              sizes[size]
            )}
          >
            <div className="flex items-start gap-3 border-b border-zinc-100 px-6 py-4">
              {Icon && (
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-50 text-zinc-600 ring-1 ring-inset ring-zinc-200">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">{title}</h2>
                {description && <p className="mt-0.5 truncate text-[13px] text-zinc-500">{description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {headerActions}
                {dismissable && <IconButton icon={X} label="Close" size="sm" onClick={onClose} className="-mr-2" />}
              </div>
            </div>
            <div className={cn('flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-3.5">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const AdminDrawer = ({
  open,
  onClose,
  title,
  description,
  footer,
  headerActions,
  children,
  width = 'max-w-[520px]',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  width?: string;
}) => {
  useLayer(open, onClose, true);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <motion.div
            className="absolute inset-0 bg-zinc-950/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 340 }}
            className={cn('relative flex h-full w-full flex-col bg-white shadow-2xl ring-1 ring-zinc-900/5', width)}
          >
            <div className="flex items-start gap-3 border-b border-zinc-100 px-6 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">{title}</h2>
                {description && <div className="mt-0.5 text-[13px] text-zinc-500">{description}</div>}
              </div>
              <div className="flex items-center gap-1">
                {headerActions}
                <IconButton icon={X} label="Close" size="sm" onClick={onClose} className="-mr-2" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-3.5">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'default',
  loading,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
  children?: ReactNode;
}) => {
  useLayer(open, onClose, !loading);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
          <motion.div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_64px_-12px_rgba(16,24,40,0.3)] ring-1 ring-zinc-900/5"
          >
            <div className="flex gap-4">
              <span
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                  tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-700'
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
                {description && <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>}
                {children && <div className="mt-3">{children}</div>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => void onConfirm()} loading={loading}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
