import { useSiteTheme, type SiteTheme } from './siteTheme';

const COPY = {
  default: {
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
  },
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
} satisfies Record<SiteTheme, Record<string, string | null>>;

export type ThemeCopy = (typeof COPY)['default'];

export const useThemeCopy = (): ThemeCopy => COPY[useSiteTheme().theme];
