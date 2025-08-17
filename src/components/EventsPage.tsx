import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight, X } from 'lucide-react';
import { useAppStore } from '../store/supabaseStore';
import { useState, useEffect, useRef } from 'react';
import { Event, Order } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSearchParams } from 'react-router-dom';
import Checkout from './Checkout';

const EventsPage = () => {
  const { events, getEvents, isLoading } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [showCheckout, setShowCheckout] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Glitch effect for title
  const glitchRef = useRef<HTMLHeadingElement>(null);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const triggerRandomGlitch = () => {
      setIsGlitching(true);
      setTimeout(() => {
        setIsGlitching(false);
      }, 200);

      // Schedule next glitch at random interval (0-1000ms)
      const nextGlitch = Math.random() * 1500;
      setTimeout(triggerRandomGlitch, nextGlitch);
    };

    // Start the glitch cycle
    triggerRandomGlitch();

    return () => {
      // Cleanup timeouts if component unmounts
    };
  }, []);

  // Load events when component mounts
  useEffect(() => {
    const loadEvents = async () => {
      try {
        await getEvents();
        console.log('Events loaded in EventsPage:', events);
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };

    loadEvents();
  }, [getEvents]);

  // Check for event ID in URL and highlight event automatically
  useEffect(() => {
    if (events.length > 0) {
      const eventId = searchParams.get('event');
      if (eventId) {
        const event = events.find(e => e.id === eventId);
        if (event) {
          // Highlight the event instead of opening modal
          setHighlightedEvent(eventId);
          
          // Scroll to events section
          setTimeout(() => {
            document.getElementById('events-grid')?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }, 500);
        }
      }
    }
  }, [events, searchParams]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-32 pb-16 md:pb-24">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-150"
          >
            <source src="/vid.mp4" type="video/mp4" />
          </video>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6 md:space-y-8"
          >
            {/* Main Heading with Glitch Effect */}
            <motion.h1
              ref={glitchRef}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl glitch-text ${
                isGlitching ? 'glitch-active' : ''
              }`}
              data-text="EVENTS"
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              EVENTS
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl lg:text-xl font-light max-w-4xl mx-auto leading-relaxed px-2 text-white drop-shadow-lg"
            >
              <span className="inline-block px-6 py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20">
                ⚡From rooftop raves to underground vibes - events that hit different⚡
              </span>
            </motion.p>

            {/* Events Count */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-white/80 text-lg md:text-xl"
            >
              {isLoading ? (
                <span>Loading events...</span>
              ) : (
                <span>{events?.filter(e => !e.isArchived)?.length || 0} upcoming events</span>
              )}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="pt-6 md:pt-8"
            >
              <motion.button
                onClick={() => {
                  document.getElementById('events-grid')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-transparent mx-auto hover:bg-white/90 text-white hover:text-gray-900 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-lg border-2 border-white/70 w-full sm:w-auto transition-all backdrop-blur-sm group flex items-center justify-center gap-3"
              >
                <span>Get Tickets</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Events Grid Section */}
      <section id="events-grid" className="py-16 md:py-20 relative px-4 overflow-hidden">
        {/* Video Background for Events Section */}
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
          <div className="absolute inset-0 bg-gray-800/90"></div>
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
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white glitch-text ${isGlitching ? 'glitch-active' : ''}`}
              data-text="WHAT'S ON"
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              WHAT'S ON
            </motion.h2>
            <p className="text-base sm:text-lg md:text-lg text-white/80 max-w-fit mx-auto leading-relaxed px-6 py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20">
              Check out our upcoming events
            </p>
          </motion.div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-white text-lg mb-4">Loading events...</div>
              <div className="text-white/70 text-sm">Please wait while we fetch the latest events</div>
            </div>
          ) : !events || events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white text-lg mb-4">No events available</div>
              <div className="text-white/70 text-sm">Check back later for upcoming events</div>
            </div>
          ) : events.filter(e => !e.isArchived).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white text-lg mb-4">No upcoming events</div>
              <div className="text-white/70 text-sm">All events are currently archived</div>
            </div>
          ) : (
            /* Events Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {events.filter(e => !e.isArchived).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: highlightedEvent === event.id ? 0.2 : index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`group relative bg-gradient-to-br from-white via-gray-50 to-white border rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer backdrop-blur-sm ${
                    highlightedEvent === event.id 
                      ? 'border-blue-500 shadow-blue-500/25 scale-105 ring-2 ring-blue-500/20' 
                      : 'border-gray-100'
                  }`}
                >
                  {/* Event Image with Overlay */}
                  <div className="relative h-48 md:h-56 overflow-hidden" onClick={() => { setSelectedEvent(event); setShowDetails(true); }}>
                    {/* Featured Event Badge */}
                    {highlightedEvent === event.id && (
                      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                        ⭐ Featured Event
                      </div>
                    )}
                    
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
                    
                    {/* Sold-out Badge */}
                    {event.ticketTiers && event.ticketTiers.length > 0 && event.ticketTiers.every(t => (t.capacity - t.soldCount) <= 0 || t.isActive === false) && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Sold Out
                      </div>
                    )}
                    
                    {/* Event Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-5 md:p-6 space-y-4" onClick={() => { setSelectedEvent(event); setShowDetails(true); }}>
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

                    {/* Ticket Tiers */}
                    {event.ticketTiers && event.ticketTiers.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-700">Ticket Options</h4>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            From £{(Math.min(...event.ticketTiers.map(t => t.price)) / 100).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5">
                          {event.ticketTiers.slice(0, 2).map((tier) => (
                            <div key={tier.id} className="flex items-center justify-between p-2.5 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-800">{tier.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {tier.originalPrice && tier.originalPrice > tier.price && (
                                  <span className="text-xs text-gray-400 line-through">
                                    £{(tier.originalPrice / 100).toFixed(2)}
                                  </span>
                                )}
                                <span className="text-lg font-bold text-gray-900">
                                  £{(tier.price / 100).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {event.ticketTiers.length > 2 && (
                            <div className="text-center">
                              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                +{event.ticketTiers.length - 2} more options
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Book Now Button */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                        setShowCheckout(true);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-800 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group-hover:shadow-2xl"
                    >
                      {event.ticketTiers && event.ticketTiers.length > 0 ? 'Get Tickets' : 'Book Now'}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Event Details Modal */}
      {showDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-48 overflow-hidden">
              <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
              <button className="absolute top-3 right-3 bg-white/90 rounded-full p-1" onClick={() => setShowDetails(false)}>
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
              <p className="text-gray-600 text-sm">{selectedEvent.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{selectedEvent.date}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{selectedEvent.time}</span></div>
                <div className="flex items-center gap-2 sm:col-span-2"><MapPin className="w-4 h-4" /><span>{selectedEvent.venue}</span></div>
              </div>
              {selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Ticket Tiers</h4>
                  <div className="space-y-2">
                    {selectedEvent.ticketTiers.map(tier => {
                      const remaining = tier.capacity - tier.soldCount;
                      const isSoldOut = remaining <= 0 || tier.isActive === false;
                      return (
                        <div key={tier.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{tier.name}</span>
                          {isSoldOut ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Sold out</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {tier.originalPrice && tier.originalPrice > tier.price && (
                                <span className="text-gray-400 line-through">£{(tier.originalPrice / 100).toFixed(2)}</span>
                              )}
                              <span className="font-semibold text-gray-900">£{(tier.price / 100).toFixed(2)}</span>
                              <span className="text-xs text-gray-500">({remaining} left)</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <button
                onClick={() => { 
                  setShowDetails(false); 
                  setSelectedEvent(selectedEvent);
                  setShowCheckout(true);
                }}
                disabled={selectedEvent.ticketTiers?.every(t => (t.capacity - t.soldCount) <= 0 || t.isActive === false)}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm"
              >
                Buy Tickets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedEvent && (
        <Checkout
          event={selectedEvent}
          onClose={() => setShowCheckout(false)}
          onSuccess={(order) => {
            setCompletedOrder(order);
            setShowCheckout(false);
          }}
        />
      )}

      {/* Payment Success Modal */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">Your tickets have been purchased successfully.</p>
            <p className="text-sm text-gray-500 mb-6">Order ID: {completedOrder.id}</p>
            <button
              onClick={() => setCompletedOrder(null)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default EventsPage;
