// Promo code price breakdown: checkout -> Stripe PaymentIntent metadata -> confirmation email.
// The checkout computes it (see pricingSummary in checkout.ts); here we only carry and sanity-check it.

const NUMBER_FIELDS = ['subtotal', 'discount', 'fee', 'standardFee', 'discountedTickets'];
const OPTIONAL_NUMBER_FIELDS = ['perTicketOff', 'feePerTicket', 'standardFeePerTicket'];

const isCount = (v) => Number.isInteger(v) && v >= 0;

/** Normalise a breakdown from the client; returns null if it isn't a usable promo breakdown. */
const cleanPricing = (pricing) => {
  if (!pricing || typeof pricing !== 'object' || typeof pricing.code !== 'string' || !pricing.code.trim()) return null;
  const out = { code: pricing.code.trim().toUpperCase().slice(0, 40) };
  for (const key of NUMBER_FIELDS) {
    if (!isCount(pricing[key])) return null;
    out[key] = pricing[key];
  }
  for (const key of OPTIONAL_NUMBER_FIELDS) {
    if (isCount(pricing[key])) out[key] = pricing[key];
  }
  return out;
};

/** Stripe metadata fields for a breakdown (values must be strings, max 500 chars). */
const pricingToMetadata = (pricing) => {
  const clean = cleanPricing(pricing);
  if (!clean) return {};
  const json = JSON.stringify(clean);
  return json.length <= 500 ? { promoCode: clean.code, pricing: json } : { promoCode: clean.code };
};

/** Breakdown for the email, only if it adds up to what was actually charged. */
const pricingForEmail = (pricing, amountPaid) => {
  let value = pricing;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const clean = cleanPricing(value);
  if (!clean) return null;
  return clean.subtotal - clean.discount + clean.fee === amountPaid ? clean : null;
};

module.exports = { pricingToMetadata, pricingForEmail };
