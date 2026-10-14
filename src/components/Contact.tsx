import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { useThemeCopy } from '../theme/copy'
import { trackButtonClick } from '../lib/googleAnalytics'
import { cn } from '../lib/utils'
import { FloatingField, FloatingTextarea } from './checkout/primitives'
import { HauntedCorners } from './halloween/decorations'
import { buttonPrimary, card, Eyebrow, IconChip, SectionGlow, SectionHeading, sectionBg } from './ui/section'

const CONTACT_EMAIL = 'partnerships@carnivalldn.com'

const CONTACT_ROWS = [
  { icon: Mail, label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: Phone, label: 'Phone', value: '+44 20 1234 5678' },
  { icon: MapPin, label: 'Address', value: '123 Event Street, London, UK' },
  { icon: Clock, label: 'Business hours', value: 'Mon-Fri: 9AM-6PM' },
]

const SOCIALS = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: MessageCircle, label: 'WhatsApp', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
]

type FormValues = { name: string; email: string; phone: string; message: string }
type FormErrors = Partial<Record<keyof FormValues, string>>

const EMPTY: FormValues = { name: '', email: '', phone: '', message: '' }

const validate = (v: FormValues): FormErrors => {
  const errors: FormErrors = {}
  if (!v.name.trim()) errors.name = 'Enter your name'
  if (!v.email.trim()) errors.email = 'Enter your email address'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) errors.email = 'Enter a valid email address'
  if (v.message.trim().length < 10) errors.message = 'Tell us a little more (at least 10 characters)'
  return errors
}

const Contact = () => {
  const copy = useThemeCopy()
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [sent, setSent] = useState(false)
  const errors = validate(values)
  const visibleError = (field: keyof FormValues) => (touched[field] ? errors[field] : undefined)

  const set = (field: keyof FormValues) => (value: string) => setValues((prev) => ({ ...prev, [field]: value }))
  const touch = (field: keyof FormValues) => () => setTouched((prev) => ({ ...prev, [field]: true }))

  // No backend for enquiries yet: hand the message to the visitor's email app, ready to send
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true, message: true })
    if (Object.keys(errors).length) return

    trackButtonClick('Send Message', 'Contact Section')
    const subject = `Enquiry from ${values.name.trim()}`
    const lines = [values.message.trim(), '', '---', `Name: ${values.name.trim()}`, `Email: ${values.email.trim()}`]
    if (values.phone.trim()) lines.push(`Phone: ${values.phone.trim()}`)
    const body = lines.join('\n')
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <section id="contact" className={cn(sectionBg, 'py-16 md:py-24')}>
      <SectionGlow />
      <HauntedCorners />

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <SectionHeading title="GET IN TOUCH" pill={copy.contactPill} />

        <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-5">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(card, 'p-5 md:p-8 lg:col-span-3')}
          >
            <h3 className="text-xl font-semibold tracking-tight text-white md:text-2xl">Send us a message</h3>
            <p className="mt-1 text-sm text-white/55">Private parties, corporate nights, partnerships - we reply within a day.</p>

            <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FloatingField
                label="Full name"
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
                value={values.name}
                onChange={set('name')}
                onBlur={touch('name')}
                error={visibleError('name')}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FloatingField
                  label="Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={values.email}
                  onChange={set('email')}
                  onBlur={touch('email')}
                  error={visibleError('email')}
                />
                <FloatingField
                  label="Phone (optional)"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  value={values.phone}
                  onChange={set('phone')}
                />
              </div>
              <FloatingTextarea
                label="How can we help?"
                rows={5}
                value={values.message}
                onChange={set('message')}
                onBlur={touch('message')}
                error={visibleError('message')}
              />

              <button type="submit" className={cn(buttonPrimary, 'w-full')}>
                <Send className="h-4 w-4" />
                Send message
              </button>

              <AnimatePresence>
                {sent && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="status"
                    className="flex items-start gap-2 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 ring-1 ring-emerald-400/25"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>
                      Your email app should open with the message ready to send. Nothing opened? Email us at{' '}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-white underline underline-offset-2">
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Details + socials */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-4 md:gap-6 lg:col-span-2"
          >
            <div className={cn(card, 'p-5 md:p-6')}>
              <Eyebrow>Contact details</Eyebrow>
              <ul className="mt-4 space-y-4">
                {CONTACT_ROWS.map(({ icon, label, value, href }) => (
                  <li key={label} className="flex items-center gap-3">
                    <IconChip icon={icon} />
                    <div className="min-w-0">
                      <p className="text-xs text-white/45">{label}</p>
                      {href ? (
                        <a href={href} className="block truncate text-[15px] text-white underline-offset-4 hover:underline">
                          {value}
                        </a>
                      ) : (
                        <p className="truncate text-[15px] text-white">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(card, 'p-5 md:p-6')}>
              <Eyebrow>Follow along</Eyebrow>
              <p className="mt-2 text-sm text-white/55">Line-ups, drops and behind-the-scenes - first.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {SOCIALS.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white/[0.04] px-2 py-4 text-xs font-medium text-white/70 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    <Icon className="h-5 w-5 text-accent" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Contact
