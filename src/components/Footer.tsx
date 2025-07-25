import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, ArrowRight, Instagram, Twitter, Linkedin } from 'lucide-react'

const Footer = () => {
  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Events', href: '#events' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ]

  const services = [
    { name: 'Corporate Events', href: '#' },
    { name: 'Cultural Celebrations', href: '#' },
    { name: 'Private Parties', href: '#' },
    { name: 'Special Occasions', href: '#' },
  ]

  return (
    <footer className="bg-gray-900 text-white py-12 md:py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {/* Brand */}
          <div className="text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center md:justify-start space-x-3 mb-4"
            >
              <img
                src="/carnival-logo.svg"
                alt="Carnival LDN Logo"
                className="w-8 h-8 md:w-10 md:h-10 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <span className="text-lg md:text-xl font-bold">
                Carnival LDN
              </span>
            </motion.div>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-4 max-w-xs mx-auto md:mx-0">
              London's premier professional events company, creating exceptional experiences that elevate your brand and strengthen business relationships.
            </p>
            <p className="text-gray-500 text-xs md:text-sm">
              Established in London, 2014
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg font-semibold mb-4 md:mb-6"
            >
              Quick Links
            </motion.h3>
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2 md:space-y-3"
            >
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                  >
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Services */}
          <div className="text-center md:text-left">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg font-semibold mb-4 md:mb-6"
            >
              Services
            </motion.h3>
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-2 md:space-y-3"
            >
              {services.map((service, index) => (
                <motion.li
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <a
                    href={service.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                  >
                    {service.name}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Newsletter */}
          <div className="text-center md:text-left">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg font-semibold mb-4 md:mb-6"
            >
              Newsletter
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-400 text-sm md:text-base mb-4 leading-relaxed max-w-xs mx-auto md:mx-0"
            >
              Stay updated with our latest events and professional insights
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex max-w-xs mx-auto md:mx-0"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-sm"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-r-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="border-t border-gray-800 mt-8 md:mt-12 pt-6 md:pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 Carnival LDN. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Cookie Policy
              </a>
            </div>
          </div>
          <p className="text-gray-500 text-xs text-center mt-4 md:mt-6">
            Professional event management services across London and the UK
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
