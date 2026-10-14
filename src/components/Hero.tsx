import { motion } from 'framer-motion'
import { ArrowRight, PartyPopper } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import { useSiteTheme } from '../theme/siteTheme'
import { useThemeCopy } from '../theme/copy'
import { Bat, DanglingSpider, JackOLantern, Moon } from './halloween/decorations'

/** Full-bleed Halloween artwork + atmosphere, shared by the home and /events heroes. */
export const HalloweenHeroBackdrop = () => (
  <div className="absolute inset-0 h-full w-full">
    <picture>
      <source media="(orientation: portrait) and (max-width: 900px)" srcSet="/halloween/hero-tall-1080.webp" />
      <source srcSet="/halloween/hero-wide-1280.webp 1280w, /halloween/hero-wide-2400.webp 2400w" sizes="100vw" type="image/webp" />
      <img
        src="/halloween/hero-wide-1280.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    </picture>
    {/* Purple night wash + floor glow for legibility */}
    <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-[#1c0a30]/55 to-surface" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_100%,rgb(255_122_26/0.22),transparent_70%)]" />

    <Moon className="absolute right-[6%] top-[13%] h-20 w-20 opacity-90 sm:h-28 sm:w-28 md:right-[10%] md:top-[16%] md:h-36 md:w-36" />
    <div className="hw-anim absolute right-[18%] top-[12%] w-8 md:right-[19%] md:top-[14%] md:w-12" style={{ animation: 'hw-hover-loop 7s ease-in-out infinite' }}>
      <Bat className="w-full text-black" />
    </div>
    <div className="hw-anim absolute right-[4%] top-[24%] w-6 md:right-[7%] md:top-[30%] md:w-9" style={{ animation: 'hw-hover-loop 9s ease-in-out -3s infinite' }}>
      <Bat className="w-full text-black" />
    </div>
    <DanglingSpider className="left-[8%] md:left-[12%]" thread={150} />
  </div>
)

// Simple subtitle component
const SubtitleText = () => {
  const { isHalloween } = useSiteTheme()
  const copy = useThemeCopy()
  return (
    <motion.span
      className="theme-pill inline-block px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 text-sm sm:text-base md:text-lg"
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
      {isHalloween ? (
        <JackOLantern className="hidden md:inline-block mr-2 -mt-1 w-5 h-5 md:w-6 md:h-6 align-middle" />
      ) : (
        <PartyPopper className="hidden md:inline-block mr-2 w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
      )}
      {copy.heroKicker}
      {isHalloween ? (
        <JackOLantern className="hidden md:inline-block ml-2 -mt-1 w-5 h-5 md:w-6 md:h-6 align-middle" />
      ) : (
        <PartyPopper className="hidden md:inline-block ml-2 w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
      )}
    </motion.span>
  )
}

const Hero = () => {
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect()
  const navigate = useNavigate()
  const { isHalloween } = useSiteTheme()
  const copy = useThemeCopy()

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
      {/* Image Background */}
      {isHalloween ? (
        <HalloweenHeroBackdrop />
      ) : (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/main-hero.jpg"
            alt="Carnival LDN Hero Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}



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
              {copy.heroTagline}
            </motion.p>
          </motion.div>

          {/* CTA Buttons - Mobile-first design */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4">
            <motion.button
              onClick={handleExploreEvents}
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              whileTap={{ scale: 0.95 }}
              className={isHalloween
                ? "bg-cta hover:bg-cta/90 text-cta-fg font-bold text-base sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg group w-full max-w-xs whitespace-nowrap sm:w-auto sm:max-w-none flex items-center justify-center space-x-2 transition-all shadow-[0_0_40px_-6px_rgb(var(--cta-glow)/0.75)] border border-white/20"
                : "bg-white/90 hover:bg-white text-gray-900 font-bold text-base sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg group w-full max-w-xs whitespace-nowrap sm:w-auto sm:max-w-none flex items-center justify-center space-x-2 transition-all shadow-lg backdrop-blur-sm border border-white/30"}
            >
              <span>{copy.heroCta}</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              onClick={handleBookPrivateEvent}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={isHalloween
                ? "bg-black/20 hover:bg-accent2/20 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-base sm:text-base md:text-lg font-semibold rounded-lg border-2 border-accent2/70 w-full max-w-xs whitespace-nowrap sm:w-auto sm:max-w-none transition-all backdrop-blur-sm"
                : "bg-transparent hover:bg-white/90 text-white hover:text-gray-900 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-base sm:text-base md:text-lg font-semibold rounded-lg border-2 border-white/70 w-full max-w-xs whitespace-nowrap sm:w-auto sm:max-w-none transition-all backdrop-blur-sm"}
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
