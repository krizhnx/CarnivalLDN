/**
 * Shared building blocks for the public site sections, matching the checkout /
 * event-card design system (dark surfaces, rounded-3xl cards, accent icon chips,
 * rounded-xl buttons). Colours come from theme tokens, so seasonal themes still
 * apply without any section-specific styling.
 */
import { motion } from 'framer-motion'
import type { ComponentType, ReactNode } from 'react'
import { useGlitchEffect } from '../../hooks/useGlitchEffect'
import { cn } from '../../lib/utils'

/** Content card surface (same as the ticket tier cards). */
export const card = 'rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-sm'

/** Buttons */
export const buttonPrimary =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-cta px-6 text-[15px] font-medium text-cta-fg transition hover:opacity-90 disabled:opacity-50'
export const buttonSecondary =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white/[0.06] px-6 text-[15px] font-medium text-white ring-1 ring-white/10 transition hover:bg-white/10'

/** Section wrapper background: plain surface with a faint glow (Halloween swaps it via theme-haunted-bg). */
export const sectionBg = 'theme-haunted-bg relative overflow-hidden bg-surface'
export const SectionGlow = () => (
  <div
    aria-hidden
    className="theme-default-only pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgb(var(--glow)/0.07),transparent_70%)]"
  />
)

/** Rounded square holding an icon in the theme accent colour. */
export const IconChip = ({
  icon: Icon,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  className?: string
}) => (
  <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10', className)}>
    <Icon className="h-5 w-5 text-accent" />
  </span>
)

/** Small uppercase label used above groups of content. */
export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn('text-xs font-medium uppercase tracking-[0.16em] text-white/50', className)}>{children}</p>
)

/**
 * Brand section heading: the glitch title (Halloween restyles h1/h2.glitch-text)
 * with a calm pill subtitle underneath.
 */
export const SectionHeading = ({
  title,
  pill,
  as = 'h2',
  className,
}: {
  title: string
  pill?: ReactNode
  as?: 'h1' | 'h2'
  className?: string
}) => {
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect()
  const Heading = as === 'h1' ? motion.h1 : motion.h2

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn('mb-10 text-center md:mb-14', className)}
    >
      <Heading
        ref={glitchRef}
        data-text={title}
        className={cn(
          'glitch-text pb-1 text-4xl uppercase tracking-[0.1em] md:text-5xl lg:text-6xl',
          isGlitching && `glitch-active glitch-${glitchType}`
        )}
      >
        {title}
      </Heading>
      {pill && (
        <p className="theme-pill mx-auto mt-4 w-fit max-w-full rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm text-white/80 backdrop-blur-md md:mt-5 md:text-base">
          {pill}
        </p>
      )}
    </motion.div>
  )
}
