import { motion } from 'framer-motion'
import { FileText, CheckCircle, AlertTriangle, Users, Calendar, CreditCard } from 'lucide-react'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import SEO from './SEO'
import Navbar from './Navbar'
import Footer from './Footer'

const TermsOfService = () => {
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect()

  const sections = [
    {
      icon: Users,
      title: "Acceptance of Terms",
      content: [
        "By accessing and using Carnival LDN's website and services, you accept and agree to be bound by these terms",
        "If you disagree with any part of these terms, you may not access our services",
        "We reserve the right to modify these terms at any time with notice",
        "Continued use after changes constitutes acceptance of new terms"
      ]
    },
    {
      icon: Calendar,
      title: "Event Bookings & Services",
      content: [
        "Event bookings are confirmed upon receipt of full payment",
        "Cancellation policies vary by event and are clearly stated at booking",
        "We reserve the right to modify or cancel events due to circumstances beyond our control",
        "Refunds are processed according to our cancellation policy",
        "Event details, times, and venues are subject to change with notice"
      ]
    },
    {
      icon: CreditCard,
      title: "Payment & Refunds",
      content: [
        "All payments are processed securely through Stripe",
        "Prices are quoted in British Pounds (GBP) and include applicable taxes",
        "Payment is required in full at the time of booking for paid events",
        "Refund requests must be submitted in writing within specified timeframes",
        "Processing fees may apply to refunds and are non-refundable"
      ]
    },
    {
      icon: CheckCircle,
      title: "User Conduct & Responsibilities",
      content: [
        "Attendees must be 18+ years old or accompanied by a legal guardian",
        "Respect venue rules and other attendees",
        "No illegal substances or weapons permitted at events",
        "Photography and recording policies vary by event",
        "Violation of conduct policies may result in removal without refund"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Limitation of Liability",
      content: [
        "Carnival LDN is not liable for personal injury or property damage",
        "We are not responsible for lost or stolen personal items",
        "Maximum liability is limited to the amount paid for the event",
        "Force majeure events may result in event cancellation without liability",
        "Venue-specific risks and requirements are the responsibility of attendees"
      ]
    },
    {
      icon: FileText,
      title: "Intellectual Property",
      content: [
        "All content on our website is owned by Carnival LDN",
        "Event photography and branding are protected by copyright",
        "Unauthorized use of our intellectual property is prohibited",
        "Attendees may be photographed for promotional purposes",
        "Opt-out requests for photography must be submitted in advance"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-surface text-white">
      <Navbar />
      <SEO 
        title="Terms of Service"
        description="Carnival LDN Terms of Service - Read our terms and conditions for using our event services and website."
        keywords="Carnival LDN terms of service, event booking terms, London events terms, party planning terms, event company terms"
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
            data-text="TERMS OF SERVICE"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            TERMS OF SERVICE
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-xl text-base text-white/65 md:text-lg"
          >
            Please read these terms carefully before using our services. They govern your relationship with Carnival LDN.
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
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Agreement to Terms</h2>
          <p className="text-white/70 leading-relaxed">
            These Terms of Service ("Terms") govern your use of Carnival LDN's website, services, and events. By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access our services.
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

        {/* Additional Terms */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Additional Terms</h2>
          <div className="space-y-4 text-white/70">
            <p><strong>Governing Law:</strong> These terms are governed by the laws of England and Wales.</p>
            <p><strong>Dispute Resolution:</strong> Any disputes will be resolved through mediation or in the courts of England and Wales.</p>
            <p><strong>Severability:</strong> If any provision is found to be unenforceable, the remaining provisions remain in effect.</p>
            <p><strong>Entire Agreement:</strong> These terms constitute the entire agreement between you and Carnival LDN.</p>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-white md:text-xl">Questions About These Terms?</h2>
          <p className="text-white/70 mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="space-y-2 text-white/70">
            <p><strong>Email:</strong> legal@carnivalldn.com</p>
            <p><strong>Phone:</strong> +44 20 1234 5678</p>
            <p><strong>Address:</strong> 123 Event Street, London, UK</p>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
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

export default TermsOfService
