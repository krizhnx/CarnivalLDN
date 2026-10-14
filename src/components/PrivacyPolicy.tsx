import { motion } from 'framer-motion'
import { Eye, Lock, Database, Users, Globe } from 'lucide-react'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import SEO from './SEO'
import Navbar from './Navbar'
import Footer from './Footer'

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
    <div className="min-h-screen bg-surface text-white">
      <Navbar />
      <SEO 
        title="Privacy Policy"
        description="Carnival LDN Privacy Policy - Learn how we collect, use, and protect your personal information. Your privacy is important to us."
        keywords="Carnival LDN privacy policy, data protection, GDPR compliance, London events privacy, personal data security"
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
            className="mx-auto max-w-xl text-base text-white/65 md:text-lg"
          >
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Introduction</h2>
          <p className="text-white/70 leading-relaxed">
            Carnival LDN ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or attend our events. By using our services, you consent to the data practices described in this policy.
          </p>
        </motion.div>

        {/* Main Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
            >
              <div className="flex items-center mb-6">
                <div className="mr-4 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                  <section.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">{section.title}</h3>
              </div>
              
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span className="mr-3 mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
                    <span className="text-white/70 leading-relaxed">{item}</span>
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
          className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Contact Us</h2>
          <p className="text-white/70 mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
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
          transition={{ delay: 1.4 }}
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

export default PrivacyPolicy
