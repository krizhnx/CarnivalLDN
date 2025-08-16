import { motion } from 'framer-motion'
import { useState } from 'react'
import { Calendar, MapPin, Users, Clock, ArrowRight, Ticket, X } from 'lucide-react'
import { useAppStore } from '../store/supabaseStore'
import { Link } from 'react-router-dom'
import { Event, Order } from '../types'
import Checkout from './Checkout'
import PaymentSuccess from './PaymentSuccess'

const Events = () => {
  const { events, getEvents } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <section id="events" className="py-16 md:py-20 relative px-4 bg-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.h2
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 bg-[length:200%_200%] bg-clip-text text-transparent pb-1"
          >
            Upcoming Events
          </motion.h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            From professional networking to cultural celebrations, discover events that create lasting business relationships and memorable experiences
          </p>
        </motion.div>

        {/* Events Grid - Better mobile layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {events.filter(e => !e.isArchived).slice(0, 3).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
            >
                            {/* Event Image */}
              <div className="relative h-40 md:h-48 overflow-hidden" onClick={() => { setSelectedEvent(event); setShowCheckout(false); setShowDetails(true); }}>
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/400x300/6B7280/FFFFFF?text=${encodeURIComponent(event.title)}`;
                  }}
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-3 md:top-4 left-3 md:left-4 flex flex-wrap gap-1 md:gap-2">
                  {event.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Sold-out pill if all tiers are sold or disabled */}
                {event.ticketTiers && event.ticketTiers.length > 0 && event.ticketTiers.every(t => (t.capacity - t.soldCount) <= 0 || t.isActive === false) && (
                  <div className="absolute bottom-3 right-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                    Sold out
                  </div>
                )}
              </div>

              {/* Event Content */}
              <div className="p-4 md:p-6 space-y-3 md:space-y-4" onClick={() => { setSelectedEvent(event); setShowCheckout(false); setShowDetails(true); }}>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">
                  {event.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 md:space-y-3">
                  {/* Date and Time in two equal columns */}
                  <div className="grid grid-cols-2 gap-3 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                      <span className="truncate">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end sm:justify-start">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                      <span className="whitespace-nowrap">{event.time}</span>
                    </div>
                  </div>

                  {/* Location and Capacity in two equal columns */}
                  <div className="grid grid-cols-2 gap-3 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end sm:justify-start">
                      <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                      <span className="whitespace-nowrap">Capacity: {event.capacity}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 md:pt-4">
                  {/* Ticket Tiers Display */}
                  {event.ticketTiers && event.ticketTiers.length > 0 ? (
                    <div className="space-y-2">
                      {event.ticketTiers.slice(0, 2).map((tier) => {
                        console.log(`Displaying tier: ${tier.name}, capacity: ${tier.capacity}, sold: ${tier.soldCount}`);
                        return (
                          <div key={tier.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{tier.name}</span>
                            <div className="flex items-center gap-2">
                              {tier.originalPrice && tier.originalPrice > tier.price && (
                                <span className="text-gray-400 line-through">
                                  £{(tier.originalPrice / 100).toFixed(2)}
                                </span>
                              )}
                              <span className="font-semibold text-gray-900">
                                £{(tier.price / 100).toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({tier.capacity - tier.soldCount} left)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {event.ticketTiers.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{event.ticketTiers.length - 2} more tiers
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xl md:text-2xl font-bold text-gray-900">
                      {event.price}
                    </div>
                  )}

                  {/* Book Now Button */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setShowDetails(false);
                      setShowCheckout(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 md:px-6 py-2 rounded-lg font-medium transition-colors text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    {event.ticketTiers && event.ticketTiers.length > 0 ? 'Buy Tickets' : 'Book Now'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-12 md:mt-16"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              View All Events
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
              Discover our complete collection of professional events, from networking opportunities to cultural celebrations.
            </p>
            <Link to="/events">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 md:px-8 py-3 rounded-lg font-medium transition-colors text-sm md:text-base flex items-center space-x-2 mx-auto"
              >
                <span>View All Events</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedEvent && (
        <Checkout
          event={selectedEvent}
          onClose={() => {
            setShowCheckout(false);
            setSelectedEvent(null);
          }}
          onSuccess={async (order: Order) => {
            setShowCheckout(false);
            setSelectedEvent(null);
            setCompletedOrder(order);
            
            // Refresh events to update ticket counts
            try {
              await getEvents();
              console.log('Events refreshed after payment');
            } catch (error) {
              console.error('Failed to refresh events:', error);
            }
            
            console.log('Payment successful, order:', order);
          }}
        />
      )}

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
                onClick={() => { setShowDetails(false); setShowCheckout(true); }}
                disabled={selectedEvent.ticketTiers?.every(t => (t.capacity - t.soldCount) <= 0 || t.isActive === false)}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm"
              >
                Buy Tickets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {completedOrder && (
        <PaymentSuccess
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </section>
  )
}

export default Events
