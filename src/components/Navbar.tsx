import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Home', href: location.pathname === '/' ? '#home' : '/#home' },
    { name: 'Events', href: location.pathname === '/' ? '#events' : '/events' },
    { name: 'About', href: location.pathname === '/' ? '#about' : '/#about' },
    { name: 'Contact', href: location.pathname === '/' ? '#contact' : '/#contact' },
  ]

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-2 md:px-4 pt-2 md:pt-4">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`transition-all duration-500 ease-out ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-2xl border-2 border-slate-200/80 rounded-2xl max-w-4xl md:max-w-7xl mx-auto'
            : 'bg-transparent max-w-4xl md:max-w-7xl mx-auto'
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-18 md:h-20 relative">
          {/* Text - Left (Desktop only) */}
          <div className="hidden md:flex items-center z-10">
            <span className="text-xl md:text-2xl font-bold text-gray-900">
              Carnival LDN
            </span>
          </div>

          {/* Logo - Left on mobile, centered on desktop */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10"
          >
            <div className="relative">
              <img
                src="/carnival-logo.svg"
                alt="Carnival LDN Logo"
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </motion.div>

          {/* Menu button - Right */}
          <div className="flex justify-end z-10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="p-4 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            >
              {isOpen ? <X size={28} strokeWidth={2.5} /> : <Menu size={28} strokeWidth={2.5} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200/50 mt-2 overflow-hidden"
            >
              <div className="px-2 py-6 space-y-0">
                {navItems.map((item, index) => (
                  <div key={item.name}>
                    <motion.a
                      href={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setIsOpen(false)}
                      className="block text-center text-lg font-medium text-gray-700 hover:text-gray-900 transition-colors py-3 rounded-lg hover:bg-gray-50"
                    >
                      {item.name}
                    </motion.a>
                    {index < navItems.length - 1 && (
                      <div className="border-b border-gray-200 mx-4"></div>
                    )}
                  </div>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                  className="bg-gray-900 hover:bg-gray-800 text-white w-full py-3 rounded-lg font-medium transition-colors text-base mt-4"
                >
                  Book Event
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
    </div>
  )
}

export default Navbar

