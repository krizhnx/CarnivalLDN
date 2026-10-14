import { lazy, Suspense, useEffect, useState } from 'react';
import type { CheckoutSheetProps } from './CheckoutSheet';

/**
 * Code-split entry point for the checkout sheet. Keeps vaul/Radix/Stripe out of
 * the initial bundle, prefetches when the browser is idle, and mounts the
 * sheet on first open.
 */
const loadCheckoutSheet = () => import('./CheckoutSheet');
const CheckoutSheet = lazy(loadCheckoutSheet);

export const preloadCheckout = () => {
  void loadCheckoutSheet();
};

const LazyCheckoutSheet = (props: CheckoutSheetProps) => {
  const [mounted, setMounted] = useState(props.open);

  useEffect(() => {
    if (props.open) setMounted(true);
  }, [props.open]);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(preloadCheckout);
    return () => cancel(handle);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <CheckoutSheet {...props} />
    </Suspense>
  );
};

export default LazyCheckoutSheet;
