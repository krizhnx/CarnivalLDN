import { motion } from 'framer-motion'
import { Award, Heart, Users, Building, Calendar } from 'lucide-react'
import { useGlitchEffect } from '../hooks/useGlitchEffect'

const About = () => {
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect()

  const stats = [
    { icon: Calendar, number: '500+', label: 'Epic Nights Created' },
    { icon: Users, number: '50K+', label: 'Happy Party People' },
    { icon: Award, number: '25+', label: 'Industry Awards' },
    { icon: Building, number: '10+', label: 'Years of Experience' },
  ]

  return (
    <section id="about" className="py-16 md:py-20 relative bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
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
            data-text="ABOUT US"
            className={`text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 glitch-text text-white ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            ABOUT US
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
            We make London's most unforgettable nights happen
          </motion.p>
        </motion.div>

        {/* Essential Content - Story and Stats Side by Side */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-stretch mb-16 md:mb-20">
          {/* Our Story - Essential Version */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/5 border border-white/20 rounded-2xl p-8 md:p-12 backdrop-blur-sm shadow-2xl hover:shadow-white/10 transition-all duration-500 flex flex-col justify-center"
          >
            <motion.h3
              className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-white"
            >
              Our Story
            </motion.h3>
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <p className="text-lg md:text-xl">
                Born from the underground scene, Carnival LDN started as a passion project for people who believed London deserved better parties.
              </p>
              <p className="text-lg md:text-xl">
                We've grown from throwing warehouse raves to becoming the city's most trusted name in unforgettable experiences.
              </p>
            </div>
          </motion.div>

          {/* Stats Section - Side by Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 md:gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/5 border border-white/20 rounded-xl p-6 md:p-8 text-center group cursor-default hover:bg-white/10 transition-all duration-300 backdrop-blur-sm shadow-xl hover:shadow-white/10"
              >
                <stat.icon className="w-10 h-10 md:w-12 md:h-12 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-300 text-sm md:text-base leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Why Choose Us - Streamlined */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8 md:p-12 backdrop-blur-sm shadow-2xl hover:shadow-white/10 transition-all duration-500 mb-12"
        >
          <motion.h4
            className="text-2xl md:text-3xl font-bold text-center mb-8 text-white"
          >
            Why Choose Us?
          </motion.h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-black" />
              </div>
              <span className="text-gray-300 font-medium">Unmatched energy and atmosphere</span>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-black" />
              </div>
              <span className="text-gray-300 font-medium">Premium venue and artist partnerships</span>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-black" />
              </div>
              <span className="text-gray-300 font-medium">Authentic scene knowledge</span>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-black" />
              </div>
              <span className="text-gray-300 font-medium">Community-focused approach</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
