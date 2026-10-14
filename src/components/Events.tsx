import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/supabaseStore'
import { Event } from '../types'
import { trackPageView, trackButtonClick } from '../lib/googleAnalytics'
import { cn } from '../lib/utils'
import EventCard from './EventCard'
import CheckoutSheet from './checkout'
import { useThemeCopy } from '../theme/copy'
import { HauntedCorners, SectionDrip, SectionFog } from './halloween/decorations'
import { buttonSecondary, SectionHeading } from './ui/section'

const Events = () => {
  const { events } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const copy = useThemeCopy();

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
    <section id="events" className="py-16 md:py-24 relative px-4 overflow-hidden">
      {/* Image Background */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/events-bg-f.jpg"
          alt="Events Background"
          className="w-full h-full object-cover scale-150"
        />
        {/* Overlay for better text readability */}
        <div className="theme-overlay absolute inset-0 bg-surface/80"></div>
      </div>
      <SectionDrip />
      <HauntedCorners />
      <SectionFog />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <SectionHeading
          title="EVENTS"
          pill={
            <>
              <span className="sm:hidden">{copy.eventsPillShort}</span>
              <span className="hidden sm:inline">{copy.eventsPillLong}</span>
            </>
          }
        />

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
            <Link to="/events" className={cn(buttonSecondary, 'group backdrop-blur-md')}>
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
