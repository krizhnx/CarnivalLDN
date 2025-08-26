import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'

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
    { name: 'Gallery', href: '/gallery' },
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
                 <div className="flex items-center justify-between h-14 md:h-16 relative">
          {/* Text - Left (Desktop only) */}
          <div className="hidden md:flex items-center z-10">
                         <img
               src="/carntext-b.svg"
               alt="Carnival LDN"
               className="h-6 md:h-8 w-auto max-w-[120px] md:max-w-[220px] object-contain transition-all duration-300"
               style={{ filter: isScrolled ? 'none' : 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}
             />
          </div>

          {/* Logo - Left on mobile, centered on desktop */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="pl-2 md:pl-0 md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10"
          >
            <div className="relative">
              <img
                src={isScrolled ? "/carnival-logo.svg" : "/carnival-logo-w.svg"}
                alt="Carnival LDN Logo"
                className="w-10 h-10 md:w-12 md:h-12 object-contain transition-all duration-300"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </motion.div>

          {/* Menu button - Right */}
          <div className="flex justify-end z-10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`p-4 transition-colors rounded-lg ${
                isScrolled
                  ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-white hover:text-gray-200 hover:bg-white/10'
              }`}
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
              className={`md:hidden border-t mt-2 overflow-hidden ${
                isScrolled ? 'border-gray-200/50' : 'border-white/30'
              }`}
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
                      className={`block text-center text-lg font-medium transition-colors py-3 rounded-lg ${
                        isScrolled
                          ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          : 'text-white hover:text-gray-200 hover:bg-white/10'
                      }`}
                    >
                      {item.name}
                    </motion.a>
                    {index < navItems.length - 1 && (
                      <div className={`border-b mx-4 ${
                        isScrolled ? 'border-gray-200' : 'border-white/30'
                      }`}></div>
                    )}
                  </div>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                  className={`w-full py-3 rounded-lg font-medium transition-colors text-base mt-4 ${
                    isScrolled
                      ? 'bg-gray-900 hover:bg-gray-800 text-white'
                      : 'bg-white/90 hover:bg-white text-gray-900'
                  }`}
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

