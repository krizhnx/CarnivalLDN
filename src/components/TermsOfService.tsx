import { motion } from 'framer-motion'
import { FileText, CheckCircle, AlertTriangle, Users, Calendar, CreditCard } from 'lucide-react'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import SEO from './SEO'

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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 px-4">
      <SEO 
        title="Terms of Service"
        description="Carnival LDN Terms of Service - Read our terms and conditions for using our event services and website."
        keywords="Carnival LDN terms of service, event booking terms, London events terms, party planning terms, event company terms"
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
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Please read these terms carefully before using our services. They govern your relationship with Carnival LDN.
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
          <h2 className="text-2xl font-bold mb-4 text-white">Agreement to Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            These Terms of Service ("Terms") govern your use of Carnival LDN's website, services, and events. By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access our services.
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

        {/* Additional Terms */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="bg-white/5 border border-white/20 rounded-2xl p-8 mt-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Additional Terms</h2>
          <div className="space-y-4 text-gray-300">
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
          className="bg-white/5 border border-white/20 rounded-2xl p-8 mt-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Questions About These Terms?</h2>
          <p className="text-gray-300 mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="space-y-2 text-gray-300">
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

export default TermsOfService
