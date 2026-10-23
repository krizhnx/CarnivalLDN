import { useSiteTheme, type SiteTheme } from './siteTheme';

const DEFAULT = {
  heroKicker: "London's Most Professional Events Experience",
  heroTagline: 'From corporate events to cultural celebrations, from exclusive parties to memorable occasions',
  heroCta: 'Explore Events',
  eventsPillShort: '⚡ Events that hit different ⚡',
  eventsPillLong: '⚡ From rooftop raves to underground vibes - events that hit different ⚡',
  whatsOn: "WHAT'S ON",
  whatsOnPill: '🎭  Check out our upcoming events  🎭',
  aboutPillShort: 'Creating epic nights since 2018',
  aboutPillLong: "We make London's most unforgettable nights happen",
  contactPill: 'Ready to create an exceptional event?',
  footerTagline: null as string | null,
  detailsTitle: "Who's going?",
  paymentTitle: 'Checkout',
  paymentSubtitle: 'Review your order and pay securely.',
  processingPaid: 'Securing your tickets…',
  processingFree: 'Reserving your tickets…',
  successTitle: "You're in!",
  successLead: 'on the way to',
  successNote:
    "Your QR tickets are attached to the confirmation email. Can't see it? Check your spam folder. Show the QR code at the door.",
};

const COPY = {
  default: DEFAULT,
  halloween: {
    heroKicker: 'Halloween Season Has Risen',
    heroTagline: "Costumes on. Lights off. London's most haunted nights are back - if you dare.",
    heroCta: 'Get Halloween Tickets',
    eventsPillShort: '🎃 Enter if you dare 🎃',
    eventsPillLong: '🎃 Frights, bites & the best nights in London 🎃',
    whatsOn: "WHAT'S LURKING",
    whatsOnPill: '🦇  Pick your poison  🦇',
    aboutPillShort: 'Haunting London since 2018',
    aboutPillLong: "We make London's most unforgettable (and haunted) nights happen",
    contactPill: "Planning something spooky? Let's talk.",
    footerTagline: 'Stay spooky',
    detailsTitle: 'Who dares to enter?',
    paymentTitle: 'Seal your fate',
    paymentSubtitle: 'Review your order and pay securely.',
    processingPaid: 'Summoning your tickets…',
    processingFree: 'Conjuring your tickets…',
    successTitle: "You're in…",
    successLead: 'summoned and on the way to',
    successNote:
      'Your QR tickets are in your inbox (check the spam crypt too). Show the QR code at the door. Costumes strongly encouraged.',
  },
  /* Diwali only restyles the hero + What's On areas; checkout, About, Contact and
     the footer keep the standard wording. */
  diwali: {
    ...DEFAULT,
    heroKicker: 'Diwali 2026 · The Festival of Lights',
    heroTagline: "Diyas lit, dhol loud, outfits on point. London's brightest Diwali nights are here - come celebrate with us.",
    heroCta: 'Get Diwali Tickets',
    eventsPillShort: '✨ Light up your Diwali ✨',
    eventsPillLong: "✨ Dhol, Bollywood bangers & London's brightest Diwali nights ✨",
    whatsOnPill: '🪔  Find your Diwali night  🪔',
  },
} satisfies Record<SiteTheme, Record<string, string | null>>;

export type ThemeCopy = typeof DEFAULT;

export const useThemeCopy = (): ThemeCopy => COPY[useSiteTheme().theme];
