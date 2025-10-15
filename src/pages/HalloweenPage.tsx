import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEO from '../components/SEO'
import { initGA, trackPageView, trackEvent } from '../lib/googleAnalytics'
import { Helmet } from 'react-helmet-async'
// Use local halloween background image provided at project root
// Vite will transform this import into a URL at build time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import halloweenBg from '../../halloween.jpg'
// @ts-ignore
import spookyBg from '../../spooky.jpg'

const HalloweenPage = () => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initGA()
    trackPageView('/halloween', 'Carnival LDN - Halloween')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/halloween-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, name, phone: phone || null, source: 'halloween-landing' })
      })

      // Safely parse JSON; server might return empty body on errors
      let data: any = null
      const text = await res.text()
      if (text) {
        try {
          data = JSON.parse(text)
        } catch (_) {
          // Non-JSON response, leave data as null
        }
      }
      if (!res.ok) {
        throw new Error((data && data.error) || 'Failed to join waitlist')
      }

      trackEvent('waitlist_signup', 'halloween', email)
      setSubmitted(true)
      setEmail('')
      setName('')
      setPhone('')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Creepster&family=Eater&display=swap" rel="stylesheet" />
      </Helmet>
      <SEO
        title="Halloween Waitlist"
        description="Register your interest for Carnival LDN Halloween. Drop your email to get first access to tickets."
        keywords="Carnival LDN Halloween, Halloween party London, waitlist"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden pt-20 md:pt-28 pb-16 min-h-[100vh] h-screen">
        {/* Background image */}
        <div className="absolute inset-0 overflow-hidden">
          <picture>
            <source media="(max-width: 767px)" srcSet={spookyBg} />
            <img
              src={halloweenBg}
              alt="Halloween background"
              className="w-full h-full object-cover object-center"
            />
          </picture>
          {/* Mobile dim overlay to reduce brightness */}
          <div className="absolute inset-0 bg-black/50 md:hidden pointer-events-none" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4">
          {/* Top white text logo */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 md:-top-16">
            <img
              src="/carntext-b.svg"
              alt="Carnival LDN"
              className="h-6 md:h-8 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div className="text-center mb-6">
            <h1 className="text-7xl md:text-8xl font-extrabold text-orange-400 tracking-wider drop-shadow-[0_0_25px_rgba(251,146,60,0.45)]" style={{ fontFamily: 'Creepster, Eater, ui-sans-serif' }}>HALLOWEEN</h1>
            <div className="mt-2 text-orange-300" style={{ fontFamily: 'Eater, Creepster, ui-serif' }}>
              <span className="inline-block text-3xl md:text-3xl tracking-widest">TRICK</span>
              <span className="inline-block mx-3 text-xl md:text-2xl tracking-widest">•</span>
              <span className="inline-block text-2xl md:text-2xl tracking-widest">OR</span>
              <span className="inline-block mx-3 text-xl md:text-2xl tracking-widest">•</span>
              <span className="inline-block text-3xl md:text-3xl tracking-widest">TREAT</span>
            </div>
            <p className="mt-2 text-white/90 max-w-xl mx-auto">
              Secure your spot early. Waitlisters get priority access and exclusive launch discounts.
            </p>
          </div>

          <div className="glass-card bg-white/10 md:bg-white/70 border-white/30 backdrop-blur-lg">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="p-5 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-white/80 mb-1">Name*</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-white/80 mb-1">Email*</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-white/80 mb-1">Phone</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07…"
                      maxLength={20}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-3 text-sm text-red-600">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 w-full rounded-lg px-6 py-3 font-medium text-white transition-colors border border-orange-600 bg-orange-600 hover:bg-orange-500 disabled:opacity-70"
                >
                  {isSubmitting ? 'Adding you…' : 'Join the waitlist'}
                </button>
              </form>
            ) : (
              <div className="p-8 text-center glass-card bg-white/60 md:bg-white/70 border-white/30 backdrop-blur-lg">
                <h2 className="text-2xl font-bold text-gray-900">You’re on the list 🎃</h2>
                <p className="mt-2 text-black">We’ll email you first when tickets drop! Keep an eye on your inbox.</p>
                <button
                  className="mt-6 rounded-lg px-6 py-3 font-medium text-white transition-colors border border-orange-600 bg-orange-600 hover:bg-orange-500"
                  onClick={() => setSubmitted(false)}
                >
                  Add another email
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-white text-md">
            <p>Want in early? Share this page with your group!</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HalloweenPage


