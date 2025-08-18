import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGlitchEffect } from '../hooks/useGlitchEffect'

// Simple subtitle component
const SubtitleText = () => {
  return (
    <motion.span
      className="inline-block px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 text-sm sm:text-base md:text-lg"
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
      London's Most Professional Events Experience
    </motion.span>
  )
}

const Hero = () => {
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect()
  const navigate = useNavigate()

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



  const handleExploreEvents = () => {
    navigate('/events')
  }

  const handleBookPrivateEvent = () => {
    const contactSection = document.getElementById('contact')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
    }
  }



  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20 md:pt-32 pb-12 sm:pb-16 md:pb-24 px-2 sm:px-4">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/vid.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>



      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 md:space-y-8"
        >
          {/* Main Heading with Glitch Effect */}
          <motion.div variants={itemVariants}>
                         <h1
               ref={glitchRef}
               className={`text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl glitch-text ${
                 isGlitching ? `glitch-active glitch-${glitchType}` : ''
               }`}
               data-text="CARNIVAL LDN"
               style={{
                 textTransform: 'uppercase',
                 letterSpacing: '0.1em'
               }}
             >
              CARNIVAL LDN
            </h1>
          </motion.div>

          {/* Subtitle - Better mobile spacing */}
          <motion.div variants={itemVariants} className="space-y-4 md:space-y-6 lg:space-y-7">
            <motion.h2
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-light max-w-4xl mx-auto leading-relaxed px-2 text-white drop-shadow-lg"
            >
              <SubtitleText />
            </motion.h2>
            <motion.p
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="text-s sm:text-sm md:text-base lg:text-lg xl:text-xl max-w-3xl mx-auto leading-relaxed px-2 bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-[length:200%_200%] bg-clip-text text-transparent drop-shadow-lg"
            >
              From corporate events to cultural celebrations,
              from exclusive parties to memorable occasions
            </motion.p>
          </motion.div>

          {/* CTA Buttons - Mobile-first design */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4">
            <motion.button
              onClick={handleExploreEvents}
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/90 hover:bg-white text-gray-900 font-bold text-base sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg group w-3/4 sm:w-auto flex items-center justify-center space-x-2 transition-all shadow-lg backdrop-blur-sm border border-white/30"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              onClick={handleBookPrivateEvent}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-transparent hover:bg-white/90 text-white hover:text-gray-900 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-base sm:text-base md:text-lg font-semibold rounded-lg border-2 border-white/70 w-3/4 sm:w-auto transition-all backdrop-blur-sm"
            >
              Book Private Event
            </motion.button>
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
