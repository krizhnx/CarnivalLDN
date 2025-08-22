import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/supabaseStore'
import { useNavigate } from 'react-router-dom'
import { Event } from '../types'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import { trackPageView, trackTicketView, trackButtonClick } from '../lib/googleAnalytics'

const Events = () => {
  const { events } = useAppStore();
  const navigate = useNavigate();

  // Glitch effect for title
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect();

  // Track page view when component mounts
  useEffect(() => {
    trackPageView('/events', 'Carnival LDN - Events');
  }, []);

  const handleEventClick = (event: Event) => {
    // Track event view for analytics
    trackTicketView(event.id, event.title);
    // Navigate to events page with event ID to open modal
    navigate(`/events?event=${event.id}`);
  };

  return (
    <section id="events" className="py-16 md:py-20 relative px-4 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-150"
        >
          <source src="/vid-ev.mp4" type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gray-900/70"></div>
      </div>

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
            className="text-base sm:text-lg md:text-lg text-white max-w-fit mx-auto leading-relaxed px-6 py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20"
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
            <span className="block sm:hidden">⚡ Events that hit different ⚡</span>
            <span className="hidden sm:block">⚡ From rooftop raves to underground vibes - events that hit different ⚡</span>
          </motion.p>
        </motion.div>

        {/* Events Grid - Better mobile layout */}
        <div className={`grid gap-6 md:gap-8 ${
          events.filter(e => !e.isArchived).slice(0, 3).length === 1
            ? 'grid-cols-1 max-w-md mx-auto'
            : events.filter(e => !e.isArchived).slice(0, 3).length === 2
            ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {events.filter(e => !e.isArchived).slice(0, 3).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1
              }}
              whileHover={{ y: -4 }}
              className="group relative bg-gradient-to-br from-white via-gray-50 to-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer backdrop-blur-sm"
            >
              {/* Event Image with Overlay */}
              <div className="relative h-48 md:h-56 overflow-hidden" onClick={() => handleEventClick(event)}>
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/400x300/6B7280/FFFFFF?text=${encodeURIComponent(event.title)}`;
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {event.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-800 shadow-sm border border-white/20">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Event Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-5 md:p-6 space-y-4" onClick={() => handleEventClick(event)}>
                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {event.description}
                </p>

                {/* Event Details Grid */}
                <div className="space-y-2">
                  {/* Date */}
                  <div className="flex items-center justify-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{event.date}</span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{event.time}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center justify-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{event.venue}</span>
                  </div>
                </div>

                {/* Info Only CTA Button */}
                                 <motion.button
                   onClick={(e) => {
                     e.stopPropagation();
                     // Track button click for analytics
                     trackButtonClick('Get Tickets', `Events Section - ${event.title}`);
                     handleEventClick(event);
                   }}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group-hover:shadow-2xl"
                 >
                   <span>Get Tickets</span>
                   <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                 </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Events
