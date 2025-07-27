import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, Star, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';
import Navbar from './Navbar';
import Footer from './Footer';

const EventsPage = () => {
  const { events } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white text-gray-900 py-20 mt-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            All Events
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Discover our complete collection of professional events, from networking opportunities to cultural celebrations
          </motion.p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
              >
                                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
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
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span key={tag} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-800">{event.rating}</span>
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {event.title}
                  </h3>

                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <span>{event.date}</span>
                      <Clock className="w-4 h-4 text-gray-600 ml-2 flex-shrink-0" />
                      <span>{event.time}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Users className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <span>Capacity: {event.capacity}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {event.price}
                    </div>
                    <motion.a
                      href={event.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 inline-block"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-16"
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Can't find what you're looking for?
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We specialize in creating bespoke events tailored to your exact requirements. Let us bring your vision to life with professional excellence and attention to detail.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
              >
                <span>Plan Custom Event</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventsPage;
