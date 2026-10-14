import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { trackPageView } from '../lib/googleAnalytics'
import { cn } from '../lib/utils'
import { buttonPrimary, buttonSecondary, SectionGlow } from './ui/section'

const NotFound = () => {
  useEffect(() => {
    // Track 404 page view
    trackPageView('/404', 'Carnival LDN - Page Not Found')
  }, [])

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-surface px-5">
      <SectionGlow />

      <div className="relative z-10 mx-auto w-full max-w-md text-center">
        <img src="/carnival-logo-w.svg" alt="Carnival LDN" className="mx-auto h-14 w-14 object-contain md:h-16 md:w-16" />

        <p className="mt-10 font-mono text-7xl font-semibold tracking-tight text-white/15 md:text-8xl">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-4xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-white/55">
          The page you&apos;re looking for seems to have wandered off to join the carnival elsewhere.
        </p>

        <div className="mt-8 grid gap-3">
          <Link to="/events" className={cn(buttonPrimary, 'w-full')}>
            Browse events <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/" className={cn(buttonSecondary, 'w-full')}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
