import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useThemeCopy } from '../theme/copy'
import { cn } from '../lib/utils'
import { HauntedCorners, JackOLantern } from './halloween/decorations'
import { Eyebrow } from './ui/section'

const EXPLORE = [
  { name: 'Events', to: '/events' },
  { name: 'Gallery', to: '/gallery' },
  { name: 'About', href: '/#about' },
  { name: 'Contact', href: '/#contact' },
]

const LEGAL = [
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms of Service', href: '/terms-of-service' },
  { name: 'Cookie Policy', href: '/cookie-policy' },
]

const DESCRIPTION =
  "London's premier professional events company, creating exceptional experiences that elevate your brand and strengthen business relationships."

const linkClass = 'text-[15px] text-white/65 transition-colors hover:text-white'

/** Seasonal tagline (Halloween only) */
const Tagline = ({ text }: { text: string }) => (
  <p className="mt-5 inline-flex items-center gap-2 font-display text-xl tracking-wide text-accent">
    <JackOLantern className="h-6 w-6" />
    {text}
    <JackOLantern className="h-6 w-6" />
  </p>
)

/*
 * Phones keep the original centred footer; md+ gets the column layout.
 */
const Footer = () => {
  const copy = useThemeCopy()
  const year = new Date().getFullYear()

  return (
    <footer
      className={cn(
        'theme-haunted-bg relative overflow-hidden border-t border-white/10 text-white',
        'bg-gradient-to-br from-black via-gray-900 to-black py-12',
        'md:bg-surface md:bg-none md:pb-[max(2rem,env(safe-area-inset-bottom))] md:pt-16'
      )}
    >
      <HauntedCorners size="h-24 w-24 md:h-32 md:w-32" />

      {/* ---------- Phones: original footer ---------- */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:hidden">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-4 flex items-center justify-center"
          >
            <img
              src="/carnival-logo.svg"
              alt="Carnival LDN Logo"
              className="h-16 w-16 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </motion.div>
          <p className="mx-auto mb-4 max-w-md px-4 text-sm leading-relaxed text-gray-400">{DESCRIPTION}</p>
          <p className="text-center text-xs text-gray-500">Established in London, 2014</p>
          {copy.footerTagline && <Tagline text={copy.footerTagline} />}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 border-t border-gray-800 pt-6"
        >
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-400">© {year} Carnival LDN. All rights reserved.</p>
            <div className="flex space-x-4">
              {LEGAL.map((item) => (
                <a key={item.name} href={item.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---------- md+: column layout ---------- */}
      <div className="relative z-10 mx-auto hidden max-w-6xl px-6 md:block lg:px-8">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-10">
          <div>
            <img
              src="/carnival-logo.svg"
              alt="Carnival LDN"
              className="h-14 w-14 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">{DESCRIPTION}</p>
            <p className="mt-2 text-xs text-white/35">Established in London, 2014</p>
            {copy.footerTagline && <Tagline text={copy.footerTagline} />}
          </div>

          <nav aria-label="Explore">
            <Eyebrow>Explore</Eyebrow>
            <ul className="mt-4 space-y-3">
              {EXPLORE.map((item) => (
                <li key={item.name}>
                  {item.to ? (
                    <Link to={item.to} className={linkClass}>
                      {item.name}
                    </Link>
                  ) : (
                    <a href={item.href} className={linkClass}>
                      {item.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <Eyebrow>Legal</Eyebrow>
            <ul className="mt-4 space-y-3">
              {LEGAL.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className={linkClass}>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs text-white/40">© {year} Carnival LDN. All rights reserved.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 text-xs font-medium text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
