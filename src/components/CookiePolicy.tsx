import { motion } from 'framer-motion'
import { Settings, BarChart3, Eye, Database } from 'lucide-react'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import SEO from './SEO'
import Navbar from './Navbar'
import Footer from './Footer'

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
    <div className="min-h-screen bg-surface text-white">
      <Navbar />
      <SEO 
        title="Cookie Policy"
        description="Carnival LDN Cookie Policy - Learn about how we use cookies to enhance your browsing experience and provide personalized content."
        keywords="Carnival LDN cookie policy, website cookies, London events cookies, privacy cookies, cookie management"
      />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-28 md:pt-36">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-10 text-center md:mb-14"
        >

          
          <motion.h1
            ref={glitchRef}
            className={`text-4xl md:text-6xl mb-5 glitch-text ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
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
            className="mx-auto max-w-xl text-base text-white/65 md:text-lg"
          >
            We use cookies to enhance your browsing experience and provide personalized content.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-xs text-white/40"
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
          className="mb-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">What Are Cookies?</h2>
          <p className="text-white/70 leading-relaxed mb-4">
            Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analyzing how you use our site, and personalizing content.
          </p>
          <p className="text-white/70 leading-relaxed">
            By continuing to use our website, you consent to our use of cookies as described in this policy. You can manage your cookie preferences at any time through your browser settings or our cookie consent tool.
          </p>
        </motion.div>

        {/* Cookie Types */}
        <div className="space-y-4 mb-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pb-1 pt-6 text-center text-xs font-medium uppercase tracking-[0.16em] text-white/50"
          >
            Types of Cookies We Use
          </motion.h2>
          
          {cookieTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
            >
              <div className="flex items-center mb-6">
                <div className="mr-4 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                  <type.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">{type.title}</h3>
                  <p className="text-white/45 text-sm">{type.duration}</p>
                </div>
              </div>
              
              <p className="text-white/70 mb-4 leading-relaxed">{type.description}</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-white mb-2">Examples:</p>
                <ul className="space-y-2">
                  {type.examples.map((example, exampleIndex) => (
                    <li key={exampleIndex} className="flex items-start">
                      <span className="mr-3 mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
                      <span className="text-white/70 text-sm">{example}</span>
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
          className="mb-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Third-Party Cookies</h2>
          <p className="text-white/70 mb-4 leading-relaxed">
            We work with trusted third-party services that may also place cookies on your device:
          </p>
          <div className="space-y-3 text-white/70">
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
          className="mb-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Managing Your Cookie Preferences</h2>
          <div className="space-y-4 text-white/70">
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
          className="mb-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Impact of Disabling Cookies</h2>
          <p className="text-white/70 leading-relaxed">
            While you can disable cookies, please note that some features of our website may not function properly without them. Essential cookies are required for basic functionality, and disabling others may affect your user experience.
          </p>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mb-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Questions About Cookies?</h2>
          <p className="text-white/70 mb-4">
            If you have any questions about our use of cookies, please contact us:
          </p>
          <div className="space-y-2 text-white/70">
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
          className="mt-10 text-center"
        >
          <a
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-6 text-[15px] font-medium text-white ring-1 ring-white/10 transition hover:bg-white/10"
          >
            ← Back to home
          </a>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default CookiePolicy
