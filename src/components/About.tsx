import { motion } from 'framer-motion'
import { Award, Building, Calendar, Gem, Heart, Sparkles, Users } from 'lucide-react'
import { useThemeCopy } from '../theme/copy'
import { cn } from '../lib/utils'
import { HauntedCorners } from './halloween/decorations'
import { card, Eyebrow, IconChip, SectionGlow, SectionHeading, sectionBg } from './ui/section'

const STATS = [
  { icon: Calendar, number: '500+', label: 'Epic nights created' },
  { icon: Users, number: '50K+', label: 'Happy party people' },
  { icon: Award, number: '25+', label: 'Industry awards' },
  { icon: Building, number: '10+', label: 'Years of experience' },
]

const REASONS = [
  { icon: Sparkles, text: 'Unmatched energy and atmosphere' },
  { icon: Gem, text: 'Premium venue and artist partnerships' },
  { icon: Heart, text: 'Authentic scene knowledge' },
  { icon: Users, text: 'Community-focused approach' },
]

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

const About = () => {
  const copy = useThemeCopy()

  return (
    <section id="about" className={cn(sectionBg, 'py-16 md:py-24')}>
      <SectionGlow />
      <HauntedCorners />

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          title="ABOUT US"
          pill={
            <>
              <span className="sm:hidden">{copy.aboutPillShort}</span>
              <span className="hidden sm:inline">{copy.aboutPillLong}</span>
            </>
          }
        />

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Story */}
          <motion.div {...reveal()} className={cn(card, 'flex flex-col justify-center p-6 md:p-10')}>
            <Eyebrow>Our story</Eyebrow>
            <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl">
              Born from the underground. Built for London.
            </h3>
            <div className="mt-4 space-y-3 text-base leading-relaxed text-white/65 md:text-lg">
              <p>
                Carnival LDN started as a passion project for people who believed London deserved better parties.
              </p>
              <p>
                We&apos;ve grown from throwing warehouse raves to becoming the city&apos;s most trusted name in unforgettable
                experiences.
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {STATS.map(({ icon, number, label }, i) => (
              <motion.div key={label} {...reveal(0.05 + i * 0.05)} className={cn(card, 'p-5 md:p-6')}>
                <IconChip icon={icon} />
                <p className="mt-4 text-3xl font-semibold tracking-tight text-white tabular-nums md:text-4xl">{number}</p>
                <p className="mt-1 text-sm leading-snug text-white/55">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Why us */}
        <motion.div {...reveal(0.1)} className={cn(card, 'mt-4 p-6 md:mt-6 md:p-8')}>
          <Eyebrow className="text-center md:text-left">Why choose us</Eyebrow>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                <IconChip icon={icon} />
                <span className="text-[15px] leading-snug text-white/80">{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}

export default About
