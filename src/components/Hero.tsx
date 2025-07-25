import { motion } from 'framer-motion'
import { ArrowRight, Star, Zap, Heart } from 'lucide-react'

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
      },
    },
  }

  const floatingIcons = [
    { Icon: Star, delay: 0, color: 'text-gray-400' },
    { Icon: Zap, delay: 2, color: 'text-gray-500' },
    { Icon: Heart, delay: 4, color: 'text-gray-600' },
  ]

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-48 pb-16 md:pb-24 px-4">
      {/* Floating Icons - Hidden on small mobile */}
      {floatingIcons.map(({ Icon, delay, color }, index) => (
        <motion.div
          key={index}
          className={`absolute ${color} opacity-10 md:opacity-20 hidden sm:block`}
          style={{
            left: `${20 + index * 30}%`,
            top: `${30 + index * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut",
          }}
        >
          <Icon size={40} className="md:w-15 md:h-15" />
        </motion.div>
      ))}

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 md:space-y-8"
        >
          {/* Main Heading - Better mobile sizing */}
          <motion.div variants={itemVariants}>
            <motion.div
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-gray-900 via-gray-400 to-gray-900 bg-[length:200%_200%] bg-clip-text text-transparent leading-none"
            >
              CARNIVAL LDN
            </motion.div>
          </motion.div>

          {/* Subtitle - Better mobile spacing */}
          <motion.div variants={itemVariants} className="space-y-3 md:space-y-4">
            <motion.h2
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light max-w-4xl mx-auto leading-relaxed px-2 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 bg-[length:200%_200%] bg-clip-text text-transparent"
            >
              London's Most Professional Events Experience
            </motion.h2>
            <motion.p
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-2 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-[length:200%_200%] bg-clip-text text-transparent"
            >
              From corporate events to cultural celebrations,
              from exclusive parties to memorable occasions
            </motion.p>
          </motion.div>

          {/* Feature Tags - Better mobile layout */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 md:gap-4 py-6 md:py-8 px-2">
            {['Corporate Events', 'Cultural Celebrations', 'Private Parties', 'Special Occasions'].map((tag, index) => (
              <motion.span
                key={tag}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1 + index * 0.2, type: "spring" }}
                className="bg-white border border-gray-200 shadow-sm px-3 py-2 md:px-6 md:py-3 text-xs sm:text-sm md:text-base font-medium text-gray-700 hover:text-gray-900 hover:shadow-md transition-all cursor-default rounded-full"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>

          {/* CTA Buttons - Mobile-first design */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center pt-6 md:pt-8 px-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-lg group w-full sm:w-auto flex items-center justify-center space-x-2 transition-all"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-transparent hover:bg-gray-900 text-gray-900 hover:text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-lg border-2 border-gray-900 w-full sm:w-auto transition-all"
            >
              Book Private Event
            </motion.button>
          </motion.div>

          {/* Stats - Better mobile grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 md:gap-6 pt-12 md:pt-16 max-w-3xl mx-auto px-4">
            {[
              { number: '500+', label: 'Events Hosted' },
              { number: '50K+', label: 'Happy Clients' },
              { number: '5★', label: 'Average Rating' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2 + index * 0.2, type: "spring" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4 md:p-6 text-center group hover:shadow-xl transition-all"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
      >
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-gray-600 rounded-full mt-2"
          />
        </div>
      </motion.div> */}
    </section>
  )
}

export default Hero
