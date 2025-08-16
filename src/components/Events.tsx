import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Clock, Star, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/supabaseStore'
import { Link } from 'react-router-dom'

const Events = () => {
  const { events } = useAppStore();

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
          {events.slice(0, 3).map((event, index) => (
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
              <div className="relative h-40 md:h-48 overflow-hidden">
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
                  {event.tags.map((tag) => (
                    <span key={tag} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="absolute top-3 md:top-4 right-3 md:right-4 flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-current" />
                  <span className="text-xs md:text-sm font-medium text-gray-800">{event.rating}</span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">
                  {event.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                    <span className="truncate">{event.date}</span>
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-600 ml-2 flex-shrink-0" />
                    <span>{event.time}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                    <span>Capacity: {event.capacity}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 md:pt-4">
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {event.price}
                  </div>
                  <motion.a
                    href={event.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-4 md:px-6 py-2 rounded-lg font-medium transition-colors text-sm md:text-base inline-block"
                  >
                    Book Now
                  </motion.a>
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
    </section>
  )
}

export default Events
