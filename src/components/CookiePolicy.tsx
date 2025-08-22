import { motion } from 'framer-motion'
import { Settings, BarChart3, Eye, Database } from 'lucide-react'
import { useGlitchEffect } from '../hooks/useGlitchEffect'

const CookiePolicy = () => {
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect()

  const cookieTypes = [
    {
      icon: Settings,
      title: "Essential Cookies",
      description: "These cookies are necessary for the website to function properly and cannot be disabled.",
      examples: [
        "Authentication and security cookies",
        "Shopping cart functionality",
        "Basic website navigation",
        "Payment processing cookies"
      ],
      duration: "Session or up to 1 year"
    },
    {
      icon: BarChart3,
      title: "Analytics Cookies",
      description: "These cookies help us understand how visitors interact with our website.",
      examples: [
        "Google Analytics tracking",
        "Page view and user behavior data",
        "Performance monitoring",
        "Traffic source analysis"
      ],
      duration: "Up to 2 years"
    },
    {
      icon: Eye,
      title: "Marketing Cookies",
      description: "These cookies are used to deliver relevant advertisements and track marketing campaigns.",
      examples: [
        "Social media tracking pixels",
        "Advertising network cookies",
        "Retargeting campaigns",
        "Conversion tracking"
      ],
      duration: "Up to 1 year"
    },
    {
      icon: Database,
      title: "Preference Cookies",
      description: "These cookies remember your choices and preferences for a better user experience.",
      examples: [
        "Language preferences",
        "Theme and layout choices",
        "Event preferences",
        "Newsletter subscription status"
      ],
      duration: "Up to 1 year"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >

          
          <motion.h1
            ref={glitchRef}
            className={`text-5xl md:text-6xl font-bold mb-6 glitch-text ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
            data-text="COOKIE POLICY"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            COOKIE POLICY
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            We use cookies to enhance your browsing experience and provide personalized content.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-400 mt-4"
          >
            Last updated: {new Date().toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </motion.div>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">What Are Cookies?</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analyzing how you use our site, and personalizing content.
          </p>
          <p className="text-gray-300 leading-relaxed">
            By continuing to use our website, you consent to our use of cookies as described in this policy. You can manage your cookie preferences at any time through your browser settings or our cookie consent tool.
          </p>
        </motion.div>

        {/* Cookie Types */}
        <div className="space-y-8 mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-3xl font-bold text-white text-center mb-8"
          >
            Types of Cookies We Use
          </motion.h2>
          
          {cookieTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="bg-white/5 border border-white/20 rounded-2xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mr-4">
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{type.title}</h3>
                  <p className="text-gray-400 text-sm">{type.duration}</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">{type.description}</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-white mb-2">Examples:</p>
                <ul className="space-y-2">
                  {type.examples.map((example, exampleIndex) => (
                    <li key={exampleIndex} className="flex items-start">
                      <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-300 text-sm">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Third-Party Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Third-Party Cookies</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We work with trusted third-party services that may also place cookies on your device:
          </p>
          <div className="space-y-3 text-gray-300">
            <p><strong>Google Analytics:</strong> Website analytics and performance tracking</p>
            <p><strong>Stripe:</strong> Secure payment processing</p>
            <p><strong>Social Media:</strong> Social sharing and engagement tracking</p>
            <p><strong>Marketing Tools:</strong> Campaign performance and conversion tracking</p>
          </div>
        </motion.div>

        {/* Managing Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Managing Your Cookie Preferences</h2>
          <div className="space-y-4 text-gray-300">
            <p><strong>Browser Settings:</strong> You can control cookies through your browser settings. Most browsers allow you to block or delete cookies.</p>
            <p><strong>Cookie Consent Tool:</strong> Use our cookie consent tool to manage your preferences for non-essential cookies.</p>
            <p><strong>Opt-Out Links:</strong> Some third-party services provide opt-out mechanisms for their cookies.</p>
            <p><strong>Mobile Devices:</strong> Cookie settings may vary on mobile devices and apps.</p>
          </div>
        </motion.div>

        {/* Impact of Disabling */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Impact of Disabling Cookies</h2>
          <p className="text-gray-300 leading-relaxed">
            While you can disable cookies, please note that some features of our website may not function properly without them. Essential cookies are required for basic functionality, and disabling others may affect your user experience.
          </p>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Questions About Cookies?</h2>
          <p className="text-gray-300 mb-4">
            If you have any questions about our use of cookies, please contact us:
          </p>
          <div className="space-y-2 text-gray-300">
            <p><strong>Email:</strong> privacy@carnivalldn.com</p>
            <p><strong>Phone:</strong> +44 20 1234 5678</p>
            <p><strong>Address:</strong> 123 Event Street, London, UK</p>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
          className="text-center"
        >
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-300 hover:scale-105"
          >
            ← Back to Home
          </a>
        </motion.div>
      </div>
    </div>
  )
}

export default CookiePolicy
