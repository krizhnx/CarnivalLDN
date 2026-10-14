import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useMediaQuery } from '../hooks/useMediaQuery'

/*
 * Site navigation. Theme-neutral (no seasonal styling).
 *  - Phones: logo + "Get tickets" + menu button; menu opens a full-screen sheet.
 *    Transparent over the hero, frosted dark glass once scrolled.
 *  - md+:    the original layout - wordmark left, logo centred, menu button right,
 *    white glass bar once scrolled - with a working dropdown menu.
 */

interface NavItem {
  name: string
  href: string
  /** Client-side route (react-router Link) rather than an in-page/hash link */
  route?: boolean
  active?: boolean
}

const EASE = [0.22, 1, 0.36, 1] as const

const NavLink = ({
  item,
  className,
  onNavigate,
  children,
}: {
  item: NavItem
  className?: string
  onNavigate?: () => void
  children: ReactNode
}) =>
  item.route ? (
    <Link to={item.href} onClick={onNavigate} className={className} aria-current={item.active ? 'page' : undefined}>
      {children}
    </Link>
  ) : (
    <a href={item.href} onClick={onNavigate} className={className} aria-current={item.active ? 'page' : undefined}>
      {children}
    </a>
  )

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname, hash } = useLocation()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const onHome = pathname === '/'
  const onEvents = pathname.startsWith('/events')
  const homeHref = onHome ? '#home' : '/'
  // Desktop bar turns into the white glass bar once scrolled (or while its dropdown is open)
  const light = scrolled || open

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the menu whenever the route/hash changes or we cross the phone/desktop breakpoint
  useEffect(() => setOpen(false), [pathname, hash, isDesktop])

  // While the menu is open: close on Escape; lock page scroll behind the full-screen phone menu
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    if (!isDesktop) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, isDesktop])

  const items: NavItem[] = [
    { name: 'Home', href: onHome ? '#home' : '/', route: !onHome, active: onHome },
    { name: 'Events', href: '/events', route: true, active: onEvents },
    { name: 'Gallery', href: '/gallery', route: true, active: pathname.startsWith('/gallery') },
    { name: 'About', href: onHome ? '#about' : '/#about' },
    { name: 'Contact', href: onHome ? '#contact' : '/#contact' },
  ]
  const contactHref = onHome ? '#contact' : '/#contact'
  const close = () => setOpen(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-4 md:pt-4">
      {/* ---------- Desktop (md+): original layout ---------- */}
      <motion.nav
        aria-label="Main"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'mx-auto hidden max-w-7xl transition-all duration-500 ease-out md:block',
          light ? 'rounded-2xl border-2 border-slate-200/80 bg-white/80 shadow-2xl backdrop-blur-xl' : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative flex h-16 items-center justify-between">
            {/* Wordmark - left */}
            <a href={homeHref} className="z-10 flex items-center">
              <img
                src="/carntext-b.svg"
                alt="Carnival LDN"
                className="h-8 w-auto max-w-[220px] object-contain transition-all duration-300"
                style={{ filter: light ? 'none' : 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}
              />
            </a>

            {/* Logo - centred (wrapper owns the translate so the hover scale doesn't wipe it) */}
            <div className="absolute left-1/2 z-10 -translate-x-1/2">
              <motion.a href={homeHref} whileHover={{ scale: 1.05 }} className="block" aria-label="Carnival LDN - home">
                <img
                  src={light ? '/carnival-logo.svg' : '/carnival-logo-w.svg'}
                  alt=""
                  className="h-12 w-12 object-contain transition-all duration-300"
                />
              </motion.a>
            </div>

            {/* Menu button - right */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="desktop-menu"
              className={cn(
                'z-10 rounded-lg p-4 transition-colors',
                light ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' : 'text-white hover:bg-white/10 hover:text-gray-200'
              )}
            >
              {open ? <X size={28} strokeWidth={2.5} /> : <Menu size={28} strokeWidth={2.5} />}
            </motion.button>
          </div>

          {/* Dropdown (previously phone-only, so desktop's menu button opened nothing) */}
          <AnimatePresence>
            {open && (
              <motion.div
                id="desktop-menu"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden border-t border-gray-200/50"
              >
                <div className="mx-auto max-w-md px-2 py-6">
                  {items.map((item, index) => (
                    <div key={item.name}>
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                        <NavLink
                          item={item}
                          onNavigate={close}
                          className="block rounded-lg py-3 text-center text-lg font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                        >
                          {item.name}
                        </NavLink>
                      </motion.div>
                      {index < items.length - 1 && <div className="mx-4 border-b border-gray-200" />}
                    </div>
                  ))}
                  <motion.a
                    href={contactHref}
                    onClick={close}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: items.length * 0.1 }}
                    className="mt-4 block w-full rounded-lg bg-gray-900 py-3 text-center text-base font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    Book Event
                  </motion.a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* ---------- Phones ---------- */}
      <motion.nav
        aria-label="Main"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={cn(
          'relative mx-auto flex h-14 items-center justify-between rounded-2xl pl-5 pr-1.5 transition-[background-color,box-shadow] duration-300 md:hidden',
          scrolled || open
            ? 'bg-zinc-950/70 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.75)] ring-1 ring-white/10 backdrop-blur-xl'
            : 'bg-transparent'
        )}
      >
        <a href={homeHref} onClick={close} className="flex items-center" aria-label="Carnival LDN - home">
          <img src="/carnival-logo-w.svg" alt="" className="h-9 w-9 object-contain" />
        </a>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-menu"
            className="grid h-11 w-11 place-items-center text-white [-webkit-tap-highlight-color:transparent]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu: full-screen sheet behind the bar */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 -z-10 bg-zinc-950/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex h-full flex-col overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24">
              <ul>
                {items.map((item, i) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + i * 0.04, duration: 0.35, ease: EASE }}
                  >
                    <NavLink
                      item={item}
                      onNavigate={close}
                      className="group flex items-center justify-between border-b border-white/[0.08] py-4"
                    >
                      <span
                        className={cn(
                          'text-[30px] font-semibold leading-tight tracking-tight transition-colors',
                          item.active ? 'text-white' : 'text-white/55 group-hover:text-white'
                        )}
                      >
                        {item.name}
                      </span>
                      <ArrowUpRight
                        className={cn(
                          'h-5 w-5 transition',
                          item.active ? 'text-white' : 'text-white/25 group-hover:text-white'
                        )}
                      />
                    </NavLink>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.35, ease: EASE }}
                className="mt-auto space-y-3 pt-10"
              >
                <Link
                  to="/events"
                  onClick={close}
                  className="flex h-14 items-center justify-center gap-1.5 rounded-2xl bg-white text-base font-semibold text-zinc-950"
                >
                  Get tickets <ArrowUpRight className="h-5 w-5" />
                </Link>
                <a
                  href={contactHref}
                  onClick={close}
                  className="flex h-14 items-center justify-center rounded-2xl bg-white/[0.06] text-base font-medium text-white ring-1 ring-white/10"
                >
                  Book a private event
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
