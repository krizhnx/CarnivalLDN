import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/supabaseStore'
import { Event } from '../types'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import { trackPageView, trackButtonClick } from '../lib/googleAnalytics'
import EventCard from './EventCard'
import CheckoutSheet from './checkout'
import { useThemeCopy } from '../theme/copy'
import { HauntedCorners, SectionDrip, SectionFog } from './halloween/decorations'

const Events = () => {
  const { events } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const copy = useThemeCopy();

  // Glitch effect for title
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect();

  // Track page view when component mounts
  useEffect(() => {
    trackPageView('/events', 'Carnival LDN - Events');
  }, []);

  const upcoming = events.filter(e => !e.isArchived);
  const featured = upcoming.slice(0, 3);

  // Open checkout straight from the card (ticket view is tracked by the sheet)
  const handleEventClick = (event: Event) => {
    trackButtonClick('Get Tickets', `Events Section - ${event.title}`);
    setSelectedEvent(event);
    setSheetOpen(true);
  };

  return (
    <section id="events" className="py-16 md:py-20 relative px-4 overflow-hidden">
      {/* Image Background */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/events-bg-f.jpg"
          alt="Events Background"
          className="w-full h-full object-cover scale-150"
        />
        {/* Overlay for better text readability */}
        <div className="theme-overlay absolute inset-0 bg-gray-900/70"></div>
      </div>
      <SectionDrip />
      <HauntedCorners />
      <SectionFog />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.h2
            ref={glitchRef}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className={`text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 pb-1 glitch-text ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
            data-text="EVENTS"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            EVENTS
          </motion.h2>
          <motion.p
            className="theme-pill text-base sm:text-lg md:text-lg text-white max-w-fit mx-auto leading-relaxed px-6 py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
              borderColor: "rgba(255, 255, 255, 0.5)"
            }}
            animate={{
              boxShadow: [
                "0 0 10px rgba(255, 255, 255, 0.1)",
                "0 0 20px rgba(255, 255, 255, 0.2)",
                "0 0 10px rgba(255, 255, 255, 0.1)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="block sm:hidden">{copy.eventsPillShort}</span>
            <span className="hidden sm:block">{copy.eventsPillLong}</span>
          </motion.p>
        </motion.div>

        {/* Events Grid */}
        <div className={`grid gap-6 md:gap-8 ${
          featured.length === 1
            ? 'grid-cols-1 max-w-md mx-auto'
            : featured.length === 2
            ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {featured.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} onSelect={handleEventClick} />
          ))}
        </div>

        {upcoming.length > featured.length && (
          <div className="mt-10 flex justify-center">
            <Link
              to="/events"
              className="group inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:border-cta hover:bg-cta hover:text-cta-fg"
            >
              See all {upcoming.length} events
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      <CheckoutSheet event={selectedEvent} open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  )
}

export default Events
