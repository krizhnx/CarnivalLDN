import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send, Instagram, Twitter, Linkedin } from 'lucide-react'

const Contact = () => {
  return (
    <section id="contact" className="py-16 md:py-20 relative bg-gray-100">
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 bg-[length:200%_200%] bg-clip-text text-transparent"
          >
            Get In Touch
          </motion.h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            Ready to create an exceptional event? Contact our professional team for personalized consultation and expert planning
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm"
          >
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Send us a message</h3>
            <form className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                  placeholder="+44 20 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors">
                  <option>Select an event type</option>
                  <option>Corporate Event</option>
                  <option>Cultural Celebration</option>
                  <option>Private Party</option>
                  <option>Conference</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors resize-none"
                  placeholder="Tell us about your event requirements..."
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 md:px-8 py-3 rounded-lg font-medium transition-colors text-sm md:text-base flex items-center justify-center space-x-2 w-full"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
                <span>Send Message</span>
              </motion.button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 md:space-y-8"
          >
            {/* Contact Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
                            <motion.h3
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center lg:text-left bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_200%] bg-clip-text text-transparent"
              >
                Contact Information
              </motion.h3>
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">hello@carnivalldn.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-gray-600">+44 20 1234 5678</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-gray-600">123 Event Street, London, UK</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Business Hours</p>
                    <p className="text-gray-600">Mon-Fri: 9AM-6PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
                            <motion.h3
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center lg:text-left bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_200%] bg-clip-text text-transparent"
              >
                Follow Us
              </motion.h3>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed text-center lg:text-left">
                Stay updated with our latest events and professional insights
              </p>
              <div className="flex space-x-3 md:space-x-4 justify-center lg:justify-start">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center hover:from-gray-700 hover:to-gray-900 transition-all"
                >
                  <Instagram className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center hover:from-gray-700 hover:to-gray-900 transition-all"
                >
                  <Twitter className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center hover:from-gray-700 hover:to-gray-900 transition-all"
                >
                  <Linkedin className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </motion.a>
              </div>
            </div>

            {/* Response Guarantee */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 text-center lg:text-left">Response Guarantee</h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed text-center lg:text-left">
                We guarantee a response within 24 hours during business days. Your event planning journey starts with a prompt, professional reply.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Contact
