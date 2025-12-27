import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight, X } from 'lucide-react';
import { useAppStore } from '../store/supabaseStore';
import { useState, useEffect, useRef } from 'react';
import { Event, Order } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSearchParams } from 'react-router-dom';
import Checkout from './Checkout';
import PaymentSuccess from './PaymentSuccess';
import { useGlitchEffect } from '../hooks/useGlitchEffect';

const EventsPage = () => {
  const { events, getEvents, isLoading, trackAffiliateClick, affiliateLinks, getAffiliateLinks, affiliateSocieties, getAffiliateSocieties } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [showCheckout, setShowCheckout] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Ref to track processed affiliate clicks to prevent duplicates
  const processedClicksRef = useRef<Set<string>>(new Set());

  // Glitch effect for title
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect();

  // Load events when component mounts
  useEffect(() => {
    const loadEvents = async () => {
      try {
        console.log('🚀 Starting to load events, affiliate links, and societies...');
        await Promise.all([
          getEvents(),
          getAffiliateLinks(),
          getAffiliateSocieties()
        ]);
        console.log('✅ All data loaded successfully');
        console.log('Events, affiliate links, and societies loaded in EventsPage:', events, affiliateLinks, affiliateSocieties);
      } catch (error) {
        console.error('❌ Failed to load events:', error);
      }
    };

    loadEvents();
  }, [getEvents, getAffiliateLinks, getAffiliateSocieties]);

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

  // Track affiliate clicks when ref parameter is present
  useEffect(() => {
    const refCode = searchParams.get('ref');
    const eventId = searchParams.get('event');
    
    // Create a unique key for this click combination
    const clickKey = `${refCode}-${eventId}`;
    
    console.log('🔍 Affiliate tracking check:', {
      refCode,
      eventId,
      clickKey,
      alreadyProcessed: processedClicksRef.current.has(clickKey),
      affiliateLinksLength: affiliateLinks.length,
      affiliateSocietiesLength: affiliateSocieties.length
    });
    
    if (refCode && eventId && affiliateLinks.length > 0 && affiliateSocieties.length > 0) {
      // Check if we've already processed this click combination
      if (processedClicksRef.current.has(clickKey)) {
        console.log('⏭️ Click already processed, skipping:', clickKey);
        return;
      }
      
      // Find the affiliate link that matches this ref code and event
      const matchingLink = affiliateLinks.find(link => {
        // Extract society ID from link code
        // Link code format: ${societyId}-${eventId}-${timestamp}
        // We need to extract the society ID (first UUID before the event ID)
        const linkCodeParts = link.linkCode.split('-');
        // Society ID is the first 5 parts (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        const societyIdFromLink = linkCodeParts.slice(0, 5).join('-');
        
        // Find the society that matches this ref code
        const matchingSociety = affiliateSocieties.find(society => 
          society.code === refCode && society.id === societyIdFromLink
        );
        
        console.log('🔍 Link matching check:', {
          linkId: link.id,
          linkCode: link.linkCode,
          societyIdFromLink,
          matchingSociety,
          refCode,
          eventId: link.eventId
        });
        
        return matchingSociety && link.eventId === eventId;
      });
      
      if (matchingLink) {
        console.log('✅ Tracking affiliate click:', { refCode, eventId, linkId: matchingLink.id });
        
        // Mark this click as processed
        processedClicksRef.current.add(clickKey);
        
        // Track the click in the database
        trackAffiliateClick(matchingLink.id);
        
        // Store the affiliate link ID in sessionStorage for checkout attribution
        sessionStorage.setItem('affiliate_link_id', matchingLink.id);
        sessionStorage.setItem('affiliate_ref_code', refCode);
        
        console.log('Stored affiliate link ID for checkout attribution:', matchingLink.id);
      } else {
        console.log('No matching affiliate link found for:', { refCode, eventId });
      }
    }
  }, [searchParams, affiliateLinks, trackAffiliateClick, affiliateSocieties]);

  // Hide scroll indicator when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20 md:pt-32 pb-12 sm:pb-16 md:pb-24 px-2 sm:px-4">
        {/* Image Background */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/main-hero.jpg"
            alt="Carnival LDN Hero Background"
            className="w-full h-full object-cover"
          />
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
            className="space-y-4 md:space-y-6 lg:space-y-8"
          >
            {/* Main Heading with Glitch Effect */}
                         <motion.h1
               ref={glitchRef}
               animate={{
                 backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
               }}
               transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
               className={`text-6xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl 2xl:text-8xl glitch-text ${
                 isGlitching ? `glitch-active glitch-${glitchType}` : ''
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl lg:text-xl font-light max-w-4xl mx-auto leading-relaxed px-2 text-white drop-shadow-lg"
            >
              <motion.span
                className="inline-block px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 text-sm sm:text-base md:text-lg"
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
              </motion.span>
            </motion.div>

            {/* Events Count */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-white/80 text-base sm:text-lg md:text-xl"
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
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4"
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
                className="bg-transparent hover:bg-white/90 text-white hover:text-gray-900 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-base sm:text-base md:text-lg font-semibold rounded-lg border-2 border-white/70 w-3/4 sm:w-auto transition-all backdrop-blur-sm group flex items-center justify-center gap-3"
              >
                <span>Get Tickets</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center space-y-2 cursor-pointer"
              onClick={() => {
                document.getElementById('events-grid')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
              >
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1 h-3 bg-white/70 rounded-full mt-2"
                />
              </motion.div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-white/70 text-xs font-medium"
              >
                Scroll to explore
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* Events Grid Section */}
      <section id="events-grid" className="py-16 md:py-20 relative px-4 overflow-hidden">
        {/* Image Background for Events Section */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/events-bg-f.jpg"
            alt="Events Background"
            className="w-full h-full object-cover scale-150"
          />
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
               className={`text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white glitch-text ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
               data-text="WHAT'S ON"
               style={{
                 textTransform: 'uppercase',
                 letterSpacing: '0.1em'
               }}
             >
              WHAT'S ON
            </motion.h2>
            <div className="flex justify-center">
              <motion.span
                className="inline-block px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 text-sm sm:text-base md:text-lg text-white/80"
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
                🎭  Check out our upcoming events  🎭
              </motion.span>
            </div>
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
            <div className={`grid gap-6 md:gap-8 ${
              events.filter(e => !e.isArchived).length === 1
                ? 'grid-cols-1 max-w-md mx-auto'
                : events.filter(e => !e.isArchived).length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {events.filter(e => !e.isArchived).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: highlightedEvent === event.id ? 0.2 : index * 0.1
                  }}
                  whileHover={{ y: -4 }}
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
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
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
                            {Math.min(...event.ticketTiers.map(t => t.price)) === 0 ? 'Free' : `From £${(Math.min(...event.ticketTiers.map(t => t.price)) / 100).toFixed(2)}`}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {event.ticketTiers
                            .sort((a, b) => a.price - b.price)
                            .slice(-3)
                            .map((tier) => {
                            const remaining = tier.capacity - tier.soldCount;
                            const isSoldOut = remaining <= 0 || tier.isActive === false;
                            
                            return (
                              <div key={tier.id} className={`flex items-center justify-between p-2.5 rounded-lg border ${
                                isSoldOut 
                                  ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' 
                                  : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'
                              }`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isSoldOut ? 'bg-red-500' : 'bg-blue-500'
                                  }`}></div>
                                  <span className={`text-sm font-medium ${
                                    isSoldOut ? 'text-red-800' : 'text-gray-800'
                                  }`}>{tier.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isSoldOut ? (
                                    <span className="text-sm font-bold text-red-700">Sold out</span>
                                  ) : (
                                    <>
                                      {tier.originalPrice && tier.originalPrice > tier.price && (
                                        <span className="text-xs text-gray-400 line-through">
                                          £{(tier.originalPrice / 100).toFixed(2)}
                                        </span>
                                      )}
                                      <span className="text-lg font-bold text-gray-900">
                                        {tier.price === 0 ? 'Free' : `£${(tier.price / 100).toFixed(2)}`}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {event.ticketTiers.length > 3 && (
                            <div className="text-center">
                              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                +{event.ticketTiers.length - 3} more options
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
                     <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-48 overflow-hidden">
              <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
              <button className="absolute top-3 right-3 bg-white/90 rounded-full p-1" onClick={() => setShowDetails(false)}>
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
              <p className="text-gray-600 text-sm">{selectedEvent.description}</p>
                             <div className="space-y-3 text-sm text-black">
                 <div className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /><span className="font-semibold">{selectedEvent.date}</span></div>
                 <div className="flex items-center justify-center gap-2"><Clock className="w-4 h-4" /><span className="font-semibold">{selectedEvent.time}</span></div>
                 <div className="flex items-center justify-center gap-2"><MapPin className="w-4 h-4" /><span className="font-semibold">{selectedEvent.venue}</span></div>
               </div>
                             {selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0 && (
                 <div className="text-left">
                   <h4 className="text-sm font-semibold text-gray-800 mb-2">Ticket Tiers</h4>
                   <div className="space-y-2">
                    {selectedEvent.ticketTiers.sort((a, b) => a.price - b.price).map(tier => {
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
                              <span className="font-semibold text-gray-900">{tier.price === 0 ? 'Free' : `£${(tier.price / 100).toFixed(2)}`}</span>
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
        <PaymentSuccess
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      <Footer />
    </div>
  );
};

export default EventsPage;
