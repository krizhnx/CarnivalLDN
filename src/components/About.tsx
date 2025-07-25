import { motion } from 'framer-motion'
import { Award, Heart, Users, Sparkles, Building, Calendar } from 'lucide-react'

const About = () => {
  const stats = [
    { icon: Calendar, number: '500+', label: 'Events Delivered', color: 'text-gray-600' },
    { icon: Users, number: '50K+', label: 'Professional Clients', color: 'text-gray-700' },
    { icon: Award, number: '25+', label: 'Industry Awards', color: 'text-gray-800' },
    { icon: Building, number: '10+', label: 'Years Experience', color: 'text-gray-600' },
  ]

  const values = [
    {
      icon: Heart,
      title: 'Excellence',
      description: 'We deliver exceptional quality in every detail, ensuring your event exceeds expectations.',
      color: 'from-gray-600 to-gray-800'
    },
    {
      icon: Sparkles,
      title: 'Innovation',
      description: 'Cutting-edge event technology and creative solutions bring your vision to life.',
      color: 'from-gray-700 to-gray-900'
    },
    {
      icon: Users,
      title: 'Partnership',
      description: 'Building lasting relationships through collaborative planning and flawless execution.',
      color: 'from-gray-800 to-black'
    },
  ]

  return (
    <section id="about" className="py-16 md:py-20 relative bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.h2
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-gray-900 via-gray-400 to-gray-900 bg-[length:200%_200%] bg-clip-text text-transparent"
          >
            About Carnival LDN
          </motion.h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            London's premier professional events company, specializing in creating exceptional experiences that elevate your brand and strengthen business relationships
          </p>
        </motion.div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6 text-center lg:text-left"
          >
            <motion.h3
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 bg-[length:200%_200%] bg-clip-text text-transparent"
            >
              Our Story
            </motion.h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Founded with a vision to transform the events industry, Carnival LDN has grown from a boutique planning service to London's most trusted name in professional event management.
              </p>
              <p>
                Our team of experienced professionals brings together decades of expertise in corporate events, cultural celebrations, and premium hospitality to deliver experiences that exceed expectations.
              </p>
              <p>
                From intimate board meetings to large-scale conferences, every event we create reflects our commitment to excellence, innovation, and the highest standards of professional service.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 md:p-8 space-y-6">
              <motion.h4
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="text-xl md:text-2xl font-bold text-center md:text-left bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 bg-[length:200%_200%] bg-clip-text text-transparent"
              >
                Why Choose Us?
              </motion.h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">Professional event management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">Premium venue partnerships</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">Dedicated client service</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">Corporate-focused approach</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16 md:mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-6 text-center group cursor-default hover:shadow-md transition-shadow"
            >
              <stat.icon className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform`} />
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
              <div className="text-gray-600 text-xs md:text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 md:mb-16"
        >
          <motion.h3
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 bg-[length:200%_200%] bg-clip-text text-transparent"
          >
            Our Values
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8 text-center group hover:shadow-md transition-shadow"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r ${value.color} rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                  <value.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">{value.title}</h4>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
            <motion.h3
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-xl md:text-2xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 bg-[length:200%_200%] bg-clip-text text-transparent"
            >
              Ready to Create Excellence Together?
            </motion.h3>
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base leading-relaxed">
              Join the hundreds of satisfied clients who trust Carnival LDN for their most important events. Let's make your next occasion truly exceptional.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 md:px-8 py-3 rounded-lg font-medium transition-colors text-sm md:text-base"
            >
              Start Planning
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
