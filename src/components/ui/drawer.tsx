/**
 * shadcn/ui Drawer (built on vaul), adapted for the Carnival dark theme.
 * Supports `direction="bottom"` (mobile bottom sheet) and `direction="right"`
 * (desktop side sheet) via vaul's `data-vaul-drawer-direction` attribute.
 */
import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '../../lib/utils';

/*
 * vaul's built-in keyboard handling (`repositionInputs`) lifts the sheet by
 * `innerHeight - visualViewport.height`, which ignores iOS panning the visual
 * viewport (`visualViewport.offsetTop`) - so the sheet ends up floating far above
 * the keyboard. We switch it off and use `useKeyboardInset` below instead.
 */
const Drawer = ({ shouldScaleBackground = false, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} repositionInputs={false} {...props} />
);
Drawer.displayName = 'Drawer';

/** Keeps a bottom sheet sitting exactly on top of the on-screen keyboard. */
const useKeyboardInset = (ref: React.RefObject<HTMLDivElement>) => {
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let frame = 0;
    let lastOverlap = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el || el.getAttribute('data-vaul-drawer-direction') !== 'bottom') return;
        // Part of the layout viewport hidden below the visible area (= keyboard)
        const overlap = Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)));
        if (overlap < 80) {
          lastOverlap = 0;
          el.style.removeProperty('bottom');
          el.style.removeProperty('height');
          return;
        }
        el.style.bottom = `${overlap}px`;
        el.style.height = `${Math.round(Math.min(window.innerHeight * 0.92, vv.height - 8))}px`;

        // Keyboard just opened/changed size: keep the focused field visible inside the shorter sheet
        if (Math.abs(overlap - lastOverlap) > 40) {
          const active = document.activeElement;
          const scroller = active instanceof HTMLElement && el.contains(active) ? active.closest<HTMLElement>('.overflow-y-auto') : null;
          if (scroller && active) {
            const r = active.getBoundingClientRect();
            const s = scroller.getBoundingClientRect();
            if (r.top < s.top + 16 || r.bottom > s.bottom - 16) scroller.scrollTop += r.top - s.top - (s.height - r.height) / 2;
          }
        }
        lastOverlap = overlap;
      });
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [ref]);
};

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-[100] bg-surface/75 backdrop-blur-[2px]', className)}
    {...props}
  />
));
DrawerOverlay.displayName = 'DrawerOverlay';

/*
 * Note: the outer Content must stay `overflow: visible`. vaul renders a
 * `::after` that extends 200% past the drawer edge (so drag-overshoot never
 * shows a gap); with `overflow: hidden` that pseudo-element turns the drawer
 * into a scroll container and focusing an input can scroll the whole sheet.
 * Clipping/rounding therefore lives on the inner panel.
 */
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    overlayClassName?: string;
    panelClassName?: string;
  }
>(({ className, children, overlayClassName, panelClassName, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);
  useKeyboardInset(innerRef);

  return (
  <DrawerPortal>
    <DrawerOverlay className={overlayClassName} />
    <DrawerPrimitive.Content
      ref={innerRef}
      className={cn(
        'group/drawer fixed z-[100] flex outline-none',
        // Bottom sheet (mobile) - background feeds vaul's overshoot ::after
        'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0',
        'data-[vaul-drawer-direction=bottom]:h-[92dvh] data-[vaul-drawer-direction=bottom]:rounded-t-[28px] data-[vaul-drawer-direction=bottom]:bg-surface',
        // Floating side sheet (desktop) - transparent so the gutter stays clear
        'data-[vaul-drawer-direction=right]:bottom-3 data-[vaul-drawer-direction=right]:right-3 data-[vaul-drawer-direction=right]:top-3',
        'data-[vaul-drawer-direction=right]:w-[calc(100%-1.5rem)] data-[vaul-drawer-direction=right]:max-w-[500px]',
        'data-[vaul-drawer-direction=right]:[--initial-transform:calc(100%+12px)]',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface text-white ring-1 ring-white/10',
          'shadow-[0_-20px_80px_-20px_rgb(var(--glow)/0.25)]',
          'group-data-[vaul-drawer-direction=bottom]/drawer:rounded-t-[28px] group-data-[vaul-drawer-direction=right]/drawer:rounded-[28px]',
          panelClassName
        )}
      >
        {children}
      </div>
    </DrawerPrimitive.Content>
  </DrawerPortal>
  );
});
DrawerContent.displayName = 'DrawerContent';

const DrawerHandle = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    aria-hidden
    className={cn(
      'pointer-events-none absolute left-1/2 top-2.5 z-30 hidden h-1.5 w-11 -translate-x-1/2 rounded-full bg-white/50 shadow',
      'group-data-[vaul-drawer-direction=bottom]/drawer:block',
      className
    )}
    {...props}
  />
);

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1.5 p-4 text-left', className)} {...props} />
);

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
));
DrawerTitle.displayName = 'DrawerTitle';

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn('text-sm text-white/60', className)} {...props} />
));
DrawerDescription.displayName = 'DrawerDescription';

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
