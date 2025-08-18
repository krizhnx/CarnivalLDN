import { motion } from 'framer-motion'

const Footer = () => {


  return (
    <footer className="bg-gray-900 text-white py-12 md:py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-8 md:gap-10">
          {/* Brand */}
          <div className="text-center">
                                        <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-center mb-4"
              >
                <img
                  src="/carnival-logo.svg"
                  alt="Carnival LDN Logo"
                  className="w-12 h-12 md:w-16 md:h-16 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </motion.div>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-4 max-w-md mx-auto">
              London's premier professional events company, creating exceptional experiences that elevate your brand and strengthen business relationships.
            </p>
            <p className="text-gray-500 text-xs md:text-sm text-center">
              Established in London, 2014
            </p>
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
              © 2025 Carnival LDN. All rights reserved.
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
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
