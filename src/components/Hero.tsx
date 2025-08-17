import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Simple subtitle component
const SubtitleText = () => {
  return (
    <span className="inline-block px-6 py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20">
      London's Most Professional Events Experience
    </span>
  )
}

const Hero = () => {
  const glitchRef = useRef<HTMLHeadingElement>(null)
  const [isGlitching, setIsGlitching] = useState(false)

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

  // Random glitch effect
  useEffect(() => {
    const triggerRandomGlitch = () => {
      if (glitchRef.current) {
        setIsGlitching(true)
        
        // Remove the glitch class after the animation duration (0.2s)
        setTimeout(() => {
          setIsGlitching(false)
        }, 200)
        
        // Schedule next glitch at random interval between 0-1 seconds
        const nextGlitchDelay = Math.random() * 1000
        setTimeout(triggerRandomGlitch, nextGlitchDelay)
      }
    }

    // Start the first glitch after a short delay
    const initialDelay = setTimeout(() => {
      triggerRandomGlitch()
    }, 100) // 2 second initial delay to let the page load

    return () => {
      clearTimeout(initialDelay)
    }
  }, [])



  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-32 pb-16 md:pb-24 px-4">
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
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl glitch-text ${
                isGlitching ? 'glitch-active' : ''
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
          <motion.div variants={itemVariants} className="space-y-3 md:space-y-7">
            <motion.h2
              className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-light max-w-4xl mx-auto leading-relaxed px-2 text-white drop-shadow-lg"
            >
                             <SubtitleText />
            </motion.h2>
            <motion.p
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                             className="text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-2 bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-[length:200%_200%] bg-clip-text text-transparent drop-shadow-lg"
            >
              From corporate events to cultural celebrations,
              from exclusive parties to memorable occasions
            </motion.p>
          </motion.div>

          {/* CTA Buttons - Mobile-first design */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center pt-6 md:pt-8 px-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              whileTap={{ scale: 0.95 }}
                             className="bg-white/90 hover:bg-white text-gray-900 font-bold text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-lg group w-full sm:w-auto flex items-center justify-center space-x-2 transition-all shadow-lg backdrop-blur-sm border border-white/30"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                             className="bg-transparent hover:bg-white/90 text-white hover:text-gray-900 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-lg border-2 border-white/70 w-full sm:w-auto transition-all backdrop-blur-sm"
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
