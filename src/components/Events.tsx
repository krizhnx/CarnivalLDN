import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Clock, Star } from 'lucide-react'

const Events = () => {
  const events = [
    {
      id: 1,
      title: 'Corporate Gala Evening',
      date: 'Dec 15, 2024',
      time: '7:00 PM',
      venue: 'The Shard, London',
      price: '£85',
      image: '/api/placeholder/400/300',
      description: 'An elegant corporate networking event with fine dining and professional entertainment.',
      capacity: '200',
      rating: '4.9',
      tags: ['Corporate', 'Networking', 'Formal'],
      gradient: 'from-gray-600 to-gray-800'
    },
    {
      id: 2,
      title: 'Cultural Heritage Festival',
      date: 'Nov 12, 2024',
      time: '6:00 PM',
      venue: 'Royal Festival Hall',
      price: '£45',
      image: '/api/placeholder/400/300',
      description: 'Celebrate diverse cultural heritage with traditional performances and exhibitions.',
      capacity: '1500',
      rating: '5.0',
      tags: ['Cultural', 'Festival', 'Heritage'],
      gradient: 'from-gray-700 to-gray-900'
    },
    {
      id: 3,
      title: 'New Year Business Reception',
      date: 'Dec 31, 2024',
      time: '8:00 PM',
      venue: 'One Canada Square',
      price: '£125',
      image: '/api/placeholder/400/300',
      description: 'Professional New Year celebration with networking and premium hospitality.',
      capacity: '300',
      rating: '4.8',
      tags: ['New Year', 'Corporate', 'Premium'],
      gradient: 'from-gray-800 to-black'
    },
    {
      id: 4,
      title: 'Executive Networking Event',
      date: 'Every Thursday',
      time: '6:30 PM',
      venue: 'The Gherkin',
      price: '£65',
      image: '/api/placeholder/400/300',
      description: 'Weekly executive networking with industry leaders and decision makers.',
      capacity: '150',
      rating: '4.7',
      tags: ['Executive', 'Networking', 'Weekly'],
      gradient: 'from-gray-600 to-gray-700'
    },
    {
      id: 5,
      title: 'Annual Awards Ceremony',
      date: 'Jan 20, 2025',
      time: '7:30 PM',
      venue: 'Lancaster House',
      price: '£95',
      image: '/api/placeholder/400/300',
      description: 'Prestigious awards ceremony celebrating excellence and achievement.',
      capacity: '400',
      rating: '4.9',
      tags: ['Awards', 'Ceremony', 'Prestigious'],
      gradient: 'from-gray-700 to-gray-800'
    },
    {
      id: 6,
      title: 'Summer Business Summit',
      date: 'Jun 21, 2025',
      time: '9:00 AM',
      venue: 'ExCeL London',
      price: '£150',
      image: '/api/placeholder/400/300',
      description: 'Full-day business summit with keynote speakers and strategic sessions.',
      capacity: '800',
      rating: '5.0',
      tags: ['Summit', 'Business', 'Conference'],
      gradient: 'from-gray-500 to-gray-700'
    },
  ]

  return (
    <section id="events" className="py-16 md:py-20 relative px-4 bg-gray-50">
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-gray-900 via-gray-400 to-gray-900 bg-[length:200%_200%] bg-clip-text text-transparent pb-1"
          >
            Upcoming Events
          </motion.h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            From professional networking to cultural celebrations, discover events that create lasting business relationships and memorable experiences
          </p>
        </motion.div>

        {/* Events Grid - Better mobile layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {events.map((event, index) => (
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
              className={`bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow ${index >= 3 ? 'hidden md:block' : ''}`}
            >
              {/* Event Image */}
              <div className="relative h-40 md:h-48 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient} opacity-90`} />
                <div className="absolute inset-0 bg-black/10" />
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-4 md:px-6 py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
                  >
                    Book Now
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
              Looking for something specific?
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
              We create bespoke events tailored to your exact requirements. Let us bring your vision to life with professional excellence.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 md:px-8 py-3 rounded-lg font-medium transition-colors text-sm md:text-base"
            >
              Plan Custom Event
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Events
