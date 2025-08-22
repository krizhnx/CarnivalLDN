import { motion } from 'framer-motion'
import { Eye, Lock, Database, Users, Globe } from 'lucide-react'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import SEO from './SEO'

const PrivacyPolicy = () => {
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect()

  const sections = [
    {
      icon: Eye,
      title: "Information We Collect",
      content: [
        "Personal information (name, email, phone number) when you contact us or book events",
        "Event preferences and attendance history",
        "Payment information processed securely through Stripe",
        "Website usage data and analytics",
        "Communication preferences and marketing consent"
      ]
    },
    {
      icon: Lock,
      title: "How We Use Your Information",
      content: [
        "Process event bookings and payments",
        "Send event confirmations and updates",
        "Provide customer support and respond to inquiries",
        "Improve our services and website experience",
        "Send marketing communications (with your consent)",
        "Comply with legal obligations"
      ]
    },
    {
      icon: Database,
      title: "Data Storage & Security",
      content: [
        "Data stored securely on Supabase cloud infrastructure",
        "Encrypted transmission using HTTPS protocols",
        "Regular security audits and updates",
        "Limited access to authorized personnel only",
        "Data retention policies in compliance with GDPR"
      ]
    },
    {
      icon: Users,
      title: "Sharing Your Information",
      content: [
        "We do not sell your personal information",
        "Share with event venues and partners as necessary",
        "Legal requirements and law enforcement",
        "Business transfers (with privacy protection)",
        "Aggregated, anonymized data for analytics"
      ]
    },
    {
      icon: Globe,
      title: "Your Rights & Choices",
      content: [
        "Access and review your personal data",
        "Request corrections or updates",
        "Opt-out of marketing communications",
        "Request data deletion (subject to legal requirements)",
        "Data portability and transfer rights",
        "Withdraw consent at any time"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 px-4">
      <SEO 
        title="Privacy Policy"
        description="Carnival LDN Privacy Policy - Learn how we collect, use, and protect your personal information. Your privacy is important to us."
        keywords="Carnival LDN privacy policy, data protection, GDPR compliance, London events privacy, personal data security"
      />
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
            data-text="PRIVACY POLICY"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            PRIVACY POLICY
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
          <h2 className="text-2xl font-bold mb-4 text-white">Introduction</h2>
          <p className="text-gray-300 leading-relaxed">
            Carnival LDN ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or attend our events. By using our services, you consent to the data practices described in this policy.
          </p>
        </motion.div>

        {/* Main Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-white/5 border border-white/20 rounded-2xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mr-4">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{section.title}</h3>
              </div>
              
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-300 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8 mt-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Contact Us</h2>
          <p className="text-gray-300 mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
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
          transition={{ delay: 1.4 }}
          className="text-center mt-12"
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

export default PrivacyPolicy
