// Shared look for the confirmation emails and PDF tickets (ticket orders + group passes).
// Colours follow the event's card theme (admin "Card theme", stored in events.gradient).

const SITE_URL = (process.env.SITE_URL || 'https://www.carnivalldn.com').replace(/\/+$/, '');

const PALETTES = {
  default: {
    bg: '#09090b',
    card: '#141417',
    cardBorder: '#27272a',
    raised: '#1c1c20',
    text: '#fafafa',
    muted: '#a1a1aa',
    faint: '#71717a',
    accent: '#67e8f9', // cyan
    accent2: '#e879f9', // fuchsia
    cta: '#ffffff',
    ctaText: '#09090b',
    good: '#6ee7b7',
  },
  diwali: {
    bg: '#16060e',
    card: '#240b17',
    cardBorder: '#4a1d2e',
    raised: '#2e0f1e',
    text: '#fff7e6',
    muted: '#e5c9a8',
    faint: '#b08a6e',
    accent: '#ffc44d', // gold
    accent2: '#f472b6', // rani pink
    cta: '#ffc442',
    ctaText: '#3a0816',
    good: '#86efac',
  },
  halloween: {
    bg: '#0d0714',
    card: '#170d22',
    cardBorder: '#33204a',
    raised: '#1f1230',
    text: '#fbf5ff',
    muted: '#c4b5d6',
    faint: '#8b7aa3',
    accent: '#ff922b', // pumpkin
    accent2: '#b784ff', // violet
    cta: '#ff7a1a',
    ctaText: '#1a0800',
    good: '#a3e635',
  },
};

/** Palette for an event's card theme ('default' | 'diwali' | 'halloween'; anything else = default). */
const paletteFor = (theme) => PALETTES[theme] || PALETTES.default;

/** Escape text for HTML. */
const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Absolute URL for an image/link stored as a site path ("/palace.png") or a full URL. */
const absoluteUrl = (path) => {
  if (!path || typeof path !== 'string') return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${SITE_URL}${path}`;
  return null;
};

/**
 * Event dates are stored as entered in admin ("Saturday, 7 November 2026") - show those as is.
 * Only ISO dates ("2026-11-07") are reformatted, read as calendar dates so the day can't shift by time zone.
 */
const formatDate = (value) => {
  if (!value) return '';
  const s = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!iso) return s;
  const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

const formatCurrency = (amount, currency = 'gbp') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: String(currency || 'gbp').toUpperCase() }).format(
    (amount || 0) / 100
  );

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';

const mapsUrl = (venue) => (venue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}` : null);

const shortRef = (id) => String(id || '').slice(0, 8).toUpperCase();

module.exports = { SITE_URL, paletteFor, esc, absoluteUrl, formatDate, formatCurrency, firstName, mapsUrl, shortRef };
