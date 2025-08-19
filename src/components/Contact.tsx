import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send, Instagram, MessageCircle, Linkedin } from 'lucide-react'
import { useGlitchEffect } from '../hooks/useGlitchEffect'

const Contact = () => {
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect()

  return (
    <section id="contact" className="py-16 md:py-20 relative bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Fancy background elements */}
      <div className="absolute inset-0">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80"></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Subtle light rays */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
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
            data-text="GET IN TOUCH"
            className={`text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 glitch-text text-white ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            GET IN TOUCH
          </motion.h2>
          
          {/* Pill effect subtitle */}
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
            Ready to create an exceptional event?
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 md:gap-12 items-stretch">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3 bg-white/5 border border-white/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl hover:shadow-white/10 transition-all duration-500 flex flex-col"
          >
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Send us a message</h3>
            <form className="space-y-4 md:space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:border-white/40 transition-all text-white placeholder-gray-400"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:border-white/40 transition-all text-white placeholder-gray-400"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:border-white/40 transition-all text-white placeholder-gray-400"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:border-white/40 transition-all text-white placeholder-gray-400"
                  placeholder="+44 20 1234 5678"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:border-white/40 transition-all text-white placeholder-gray-400 resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <div className="pt-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white hover:bg-gray-100 text-black px-6 md:px-8 py-3 rounded-lg font-medium transition-all duration-300 text-sm md:text-base flex items-center justify-center space-x-2 w-full shadow-lg"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Send Message</span>
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-2 space-y-6 md:space-y-8 flex flex-col"
          >
            {/* Contact Details */}
            <div className="bg-white/5 border border-white/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl hover:shadow-white/10 transition-all duration-500 flex-1">
              <motion.h3
                className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center lg:text-left text-white"
              >
                Contact Information
              </motion.h3>
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <p className="text-gray-300">parternships@carnivalldn.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Phone</p>
                    <p className="text-gray-300">+44 20 1234 5678</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Address</p>
                    <p className="text-gray-300">123 Event Street, London, UK</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Business Hours</p>
                    <p className="text-gray-300">Mon-Fri: 9AM-6PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect With Us Card */}
            <div className="bg-white/5 border border-white/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl hover:shadow-white/10 transition-all duration-500">
              <motion.h3
                className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center lg:text-left text-white"
              >
                Connect With Us
              </motion.h3>
              <p className="text-sm md:text-base text-gray-300 mb-4 md:mb-6 leading-relaxed text-center lg:text-left">
                Follow our journey and stay updated with the latest events, behind-the-scenes content, and exclusive offers.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <motion.a
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 text-center transition-all duration-300 group"
                >
                  <Instagram className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Instagram</span>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 text-center transition-all duration-300 group"
                >
                  <MessageCircle className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">WhatsApp</span>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 text-center transition-all duration-300 group"
                >
                  <Linkedin className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">LinkedIn</span>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Contact
