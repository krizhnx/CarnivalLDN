import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/supabaseStore';
import { useState, useEffect, useRef } from 'react';
import { Event } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSearchParams } from 'react-router-dom';
import EventCard from './EventCard';
import CheckoutSheet from './checkout';
import { useGlitchEffect } from '../hooks/useGlitchEffect';
import { useSiteTheme } from '../theme/siteTheme';
import { useThemeCopy } from '../theme/copy';
import { HalloweenHeroBackdrop } from './Hero';
import { HauntedCorners, SectionDrip, SectionFog } from './halloween/decorations';

const EventsPage = () => {
  const { events, getEvents, isLoading, trackAffiliateClick, affiliateLinks, getAffiliateLinks, affiliateSocieties, getAffiliateSocieties } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const { isHalloween } = useSiteTheme();
  const copy = useThemeCopy();

  const openEvent = (event: Event) => {
    setSelectedEvent(event);
    setSheetOpen(true);
  };

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
        {isHalloween ? (
          <HalloweenHeroBackdrop />
        ) : (
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/main-hero.jpg"
              alt="Carnival LDN Hero Background"
              className="w-full h-full object-cover"
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
        )}

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
                className="theme-pill inline-block px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 text-sm sm:text-base md:text-lg"
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
                className={isHalloween
                  ? "bg-cta hover:bg-cta/90 text-cta-fg px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-base sm:text-base md:text-lg font-bold rounded-lg border border-white/20 w-full max-w-xs whitespace-nowrap sm:w-auto sm:max-w-none transition-all shadow-[0_0_40px_-6px_rgb(var(--cta-glow)/0.75)] group flex items-center justify-center gap-3"
                  : "bg-transparent hover:bg-white/90 text-white hover:text-gray-900 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-base sm:text-base md:text-lg font-semibold rounded-lg border-2 border-white/70 w-full max-w-xs whitespace-nowrap sm:w-auto sm:max-w-none transition-all backdrop-blur-sm group flex items-center justify-center gap-3"}
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
               className={`text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white glitch-text ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
               data-text={copy.whatsOn}
               style={{
                 textTransform: 'uppercase',
                 letterSpacing: '0.1em'
               }}
             >
              {copy.whatsOn}
            </motion.h2>
            <div className="flex justify-center">
              <motion.span
                className="theme-pill inline-block px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 text-sm sm:text-base md:text-lg text-white/80"
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
                {copy.whatsOnPill}
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
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  featured={highlightedEvent === event.id}
                  onSelect={openEvent}
                  glitchClassName={`glitch-text ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Checkout sheet */}
      <CheckoutSheet event={selectedEvent} open={sheetOpen} onOpenChange={setSheetOpen} />

      <Footer />
    </div>
  );
};

export default EventsPage;
