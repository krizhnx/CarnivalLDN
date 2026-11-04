// HTML emails: ticket confirmation (website orders) and group pass (guestlists).
// Dark, on-brand design built with tables + inline styles so it holds up in Gmail,
// Apple Mail and Outlook. Colours follow the event's card theme (see emailTheme.js).

const { SITE_URL, paletteFor, esc, absoluteUrl, formatDate, formatCurrency, firstName, mapsUrl, shortRef } = require('./emailTheme');

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const LOGO_URL = `${SITE_URL}/email/logo-w.png`;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const layout = ({ p, title, preheader, body }) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${esc(title)}</title>
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    body { margin: 0; padding: 0; width: 100% !important; background: ${p.bg}; -webkit-text-size-adjust: 100%; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .wrap { padding: 16px 10px !important; }
      .container { width: 100% !important; }
      .brand { letter-spacing: 2px !important; font-size: 12px !important; }
      .badge { letter-spacing: 1px !important; padding: 5px 10px !important; font-size: 9px !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      .hero { padding: 24px 16px !important; }
      .hero img { width: 210px !important; }
      .h1 { font-size: 26px !important; line-height: 32px !important; }
      .title { font-size: 22px !important; line-height: 28px !important; }
      .stack { display: block !important; width: 100% !important; padding: 0 0 14px 0 !important; }
      .total { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${p.bg};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${p.bg};opacity:0;">
    ${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${p.bg}" style="background:${p.bg};">
    <tr>
      <td align="center" class="wrap" style="padding:28px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;font-family:${FONT};color:${p.text};">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const header = (p, label) => `
          <tr>
            <td style="padding:0 4px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle">
                    <a href="${SITE_URL}" style="text-decoration:none;color:${p.text};">
                      <img src="${LOGO_URL}" width="36" height="24" alt="" style="display:inline-block;vertical-align:middle;width:36px;height:24px;" />
                      <span class="brand" style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:13px;font-weight:800;letter-spacing:4px;white-space:nowrap;color:${p.text};">CARNIVAL LDN</span>
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span class="badge" style="display:inline-block;padding:6px 12px;border:1px solid ${p.accent};border-radius:999px;font-size:10px;font-weight:700;letter-spacing:2px;color:${p.accent};white-space:nowrap;">${esc(label)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

const rgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${alpha})`;
};

/**
 * Event poster, shown whole as a framed flyer (posters are text-heavy, so cropping them to a band cuts words).
 * The glow is a progressive enhancement; clients without gradients get the solid colour.
 */
const hero = (p, image, alt) => {
  const url = absoluteUrl(image);
  if (!url) {
    return `
                <tr>
                  <td height="6" bgcolor="${p.accent}" style="height:6px;line-height:6px;font-size:0;background:${p.accent};border-radius:24px 24px 0 0;">&nbsp;</td>
                </tr>`;
  }
  return `
                <tr>
                  <td align="center" bgcolor="${p.raised}" class="hero"
                    style="padding:32px 24px;background-color:${p.raised};background-image:radial-gradient(ellipse at 50% 0%, ${rgba(p.accent, 0.22)} 0%, ${rgba(p.accent2, 0.08)} 45%, ${rgba(p.raised, 0)} 75%);border-radius:24px 24px 0 0;">
                    <img src="${esc(url)}" width="240" alt="${esc(alt)}"
                      style="display:block;width:240px;max-width:100%;height:auto;border:1px solid rgba(255,255,255,0.14);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,0.55);" />
                  </td>
                </tr>`;
};

const label = (p, text) =>
  `<div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${p.faint};margin:0 0 5px;">${esc(text)}</div>`;

const detailCell = (p, title, value, extra = '') => `
                        <td class="stack" width="50%" valign="top" style="padding:0 10px 16px 0;">
                          ${label(p, title)}
                          <div style="font-size:15px;line-height:21px;font-weight:600;color:${p.text};">${value}</div>
                          ${extra}
                        </td>`;

/** Date / Time / Venue / Reference grid. */
const detailsGrid = (p, { date, time, venue, refLabel, ref }) => {
  const directions = mapsUrl(venue);
  const venueExtra = directions
    ? `<a href="${esc(directions)}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:${p.accent};text-decoration:none;">Get directions &rarr;</a>`
    : '';
  return `
                <tr>
                  <td class="pad" style="padding:22px 32px 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        ${detailCell(p, 'Date', esc(formatDate(date)) || 'TBC')}
                        ${detailCell(p, 'Time', esc(time || 'TBC'))}
                      </tr>
                      <tr>
                        ${detailCell(p, 'Venue', esc(venue || 'TBC'), venueExtra)}
                        ${detailCell(p, refLabel, `<span style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;letter-spacing:1px;">${esc(ref)}</span>`)}
                      </tr>
                    </table>
                  </td>
                </tr>`;
};

/** Ticket-style perforation: dashed rule with notches cut into both card edges. */
const perforation = (p) => `
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="12" style="width:12px;"><div style="width:24px;height:24px;margin-left:-12px;border-radius:50%;background:${p.bg};"></div></td>
                        <td style="border-top:2px dashed ${p.cardBorder};font-size:0;line-height:0;">&nbsp;</td>
                        <td width="12" style="width:12px;"><div style="width:24px;height:24px;margin-right:-12px;border-radius:50%;background:${p.bg};"></div></td>
                      </tr>
                    </table>
                  </td>
                </tr>`;

const pill = (bg, color, text) =>
  `<span style="display:inline-block;margin:8px 6px 0 0;padding:4px 10px;border-radius:999px;background:${bg};font-size:11px;font-weight:700;letter-spacing:0.3px;color:${color};">${text}</span>`;

const summaryRow = (left, right, { color, size = 15, weight = 400, top = false, note = '' } = {}) => `
                      <tr>
                        <td style="padding:${top ? '14px' : '7px'} 0 7px;${top ? 'border-top:1px solid rgba(255,255,255,0.08);' : ''}font-size:${size}px;font-weight:${weight};color:${color};">${left}${note}</td>
                        <td align="right" valign="top" style="padding:${top ? '14px' : '7px'} 0 7px;${top ? 'border-top:1px solid rgba(255,255,255,0.08);' : ''}font-size:${size}px;font-weight:${weight};color:${color};white-space:nowrap;">${right}</td>
                      </tr>`;

const callout = (p, icon, heading, text) => `
          <tr>
            <td style="padding:16px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${p.card}" style="background:${p.card};border:1px solid ${p.cardBorder};border-radius:20px;">
                <tr>
                  <td class="pad" style="padding:20px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" style="padding-right:14px;">
                          <div style="width:40px;height:40px;line-height:40px;border-radius:12px;background:${p.raised};text-align:center;font-size:19px;">${icon}</div>
                        </td>
                        <td valign="top">
                          <div style="font-size:15px;font-weight:700;color:${p.text};margin:2px 0 4px;">${heading}</div>
                          <div style="font-size:13px;line-height:20px;color:${p.muted};">${text}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

const footer = (p) => `
          <tr>
            <td align="center" style="padding:30px 12px 8px;font-size:12px;line-height:19px;color:${p.faint};">
              <a href="https://www.instagram.com/carnivalldn/" style="display:inline-block;padding:9px 16px;border:1px solid ${p.cardBorder};border-radius:999px;font-size:12px;font-weight:600;color:${p.text};text-decoration:none;">Follow @carnivalldn on Instagram</a>
              <div style="margin-top:20px;">
                <a href="${SITE_URL}/events" style="color:${p.muted};text-decoration:none;">Events</a>
                &nbsp;&middot;&nbsp;
                <a href="${SITE_URL}/terms-of-service" style="color:${p.muted};text-decoration:none;">Terms</a>
                &nbsp;&middot;&nbsp;
                <a href="${SITE_URL}/privacy-policy" style="color:${p.muted};text-decoration:none;">Privacy</a>
              </div>
              <div style="margin-top:10px;">&copy; ${new Date().getFullYear()} Carnival LDN &middot; London</div>
            </td>
          </tr>`;

/** Main card wrapper. */
const card = (p, rows) => `
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${p.card}" style="background:${p.card};border:1px solid ${p.cardBorder};border-radius:24px;">
                ${rows}
              </table>
            </td>
          </tr>`;

const intro = (p, eyebrow, heading, text) => `
                <tr>
                  <td class="pad" style="padding:28px 32px 0;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${p.accent};">${eyebrow}</div>
                    <div class="h1" style="margin:10px 0 0;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-0.5px;color:${p.text};">${heading}</div>
                    <div style="margin:10px 0 0;font-size:15px;line-height:23px;color:${p.muted};">${text}</div>
                  </td>
                </tr>`;

const eventTitle = (p, title) => `
                <tr>
                  <td class="pad" style="padding:24px 32px 0;">
                    ${label(p, 'Event')}
                    <div class="title" style="font-size:24px;line-height:30px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px;color:${p.text};">${esc(title)}</div>
                  </td>
                </tr>`;

// ---------------------------------------------------------------------------
// Ticket confirmation (website orders)
// ---------------------------------------------------------------------------

/**
 * @param {Object} data - order + ticket data (see emailService.js)
 */
const generateTicketConfirmationHTML = (data) => {
  const p = paletteFor(data.eventTheme);
  const money = (v) => formatCurrency(v, data.currency);
  const pricing = data.pricing || null;
  const count = data.tickets.reduce((s, t) => s + (t.quantity || 0), 0);
  const free = !data.totalAmount;

  const ticketRows = data.tickets
    .map((t) => {
      const pills = [
        t.lastEntryTime && pill('rgba(251,191,36,0.14)', '#fcd34d', `Last entry ${esc(t.lastEntryTime)}`),
        t.perTicketOff && pricing && pill('rgba(110,231,183,0.12)', p.good, `${money(t.perTicketOff)} off each with ${esc(pricing.code)}`),
      ]
        .filter(Boolean)
        .join('');
      return `
                      <tr>
                        <td valign="top" style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td valign="top" style="padding-right:14px;">
                                <div style="min-width:44px;height:44px;line-height:44px;padding:0 6px;border-radius:12px;background:${p.raised};border:1px solid ${p.cardBorder};text-align:center;font-size:15px;font-weight:800;color:${p.accent};">&times;${t.quantity}</div>
                              </td>
                              <td valign="top">
                                <div style="font-size:16px;font-weight:700;color:${p.text};margin-top:2px;">${esc(t.tierName)}</div>
                                <div style="font-size:13px;color:${p.muted};margin-top:2px;">${t.unitPrice ? `${t.quantity} &times; ${money(t.unitPrice)}` : `${t.quantity} &times; Free`}</div>
                                ${pills}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td align="right" valign="top" style="padding:16px 0 14px 12px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:16px;font-weight:700;color:${p.text};white-space:nowrap;">${t.totalPrice ? money(t.totalPrice) : 'Free'}</td>
                      </tr>`;
    })
    .join('');

  let breakdown = '';
  if (pricing) {
    const perTicket =
      pricing.perTicketOff && pricing.discountedTickets > 0
        ? `<div style="font-size:12px;color:${p.good};opacity:0.8;margin-top:2px;">${money(pricing.perTicketOff)} off &times; ${pricing.discountedTickets} ticket${pricing.discountedTickets === 1 ? '' : 's'}</div>`
        : '';
    const feeReduced = pricing.fee < pricing.standardFee;
    const feeNote =
      feeReduced && pricing.feePerTicket !== undefined
        ? `<div style="font-size:12px;color:${p.good};margin-top:2px;">${pricing.standardFeePerTicket != null ? `<span style="text-decoration:line-through;color:${p.faint};">${money(pricing.standardFeePerTicket)}</span> ` : ''}${money(pricing.feePerTicket)} per ticket with ${esc(pricing.code)}</div>`
        : '';
    breakdown =
      summaryRow('Subtotal', money(pricing.subtotal), { color: p.muted }) +
      summaryRow(`Promo code <strong>${esc(pricing.code)}</strong>`, `&minus;${money(pricing.discount)}`, { color: p.good, weight: 600, note: perTicket }) +
      summaryRow(
        'Booking fee',
        feeReduced
          ? `<span style="text-decoration:line-through;color:${p.faint};margin-right:6px;">${money(pricing.standardFee)}</span><span style="color:${p.good};font-weight:700;">${money(pricing.fee)}</span>`
          : money(pricing.fee),
        { color: p.muted, note: feeNote }
      );
  }

  const body = `
          ${header(p, free ? 'BOOKING CONFIRMED' : 'TICKETS CONFIRMED')}
          ${card(
            p,
            `
                ${hero(p, data.eventImage, data.eventName)}
                ${intro(p, '&#10003;&nbsp; You&rsquo;re in', `See you there, ${esc(firstName(data.customerName))}!`, `Your order is confirmed. Your QR ${count === 1 ? 'ticket is' : 'tickets are'} attached to this email as a PDF.`)}
                ${eventTitle(p, data.eventName)}
                ${detailsGrid(p, { date: data.eventDate, time: data.eventTime, venue: data.eventLocation, refLabel: 'Order', ref: `#${shortRef(data.orderId)}` })}
                ${perforation(p)}
                <tr>
                  <td class="pad" style="padding:20px 32px 26px;">
                    ${label(p, `Your tickets (${count})`)}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${ticketRows}
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                      ${breakdown}
                      ${summaryRow(free ? 'Total' : 'Total paid', `<span class="total">${free ? 'Free' : money(data.totalAmount)}</span>`, { color: p.text, size: free ? 18 : 22, weight: 800, top: true })}
                    </table>
                  </td>
                </tr>`
          )}
          ${callout(
            p,
            '&#127915;',
            'Your QR tickets are in the PDF',
            `Open the attached PDF on your phone and show the QR code at the door. Each QR admits the number of people shown on it. Can&rsquo;t see the attachment? Check your spam or promotions folder.`
          )}
          ${footer(p)}`;

  return layout({
    p,
    title: `Your tickets for ${data.eventName}`,
    preheader: `You're in! ${data.eventName} · ${[formatDate(data.eventDate), data.eventTime].filter(Boolean).join(' · ')}. Your QR tickets are attached.`,
    body,
  });
};

// ---------------------------------------------------------------------------
// Group pass (guestlists)
// ---------------------------------------------------------------------------

const step = (p, n, text) => `
                      <tr>
                        <td valign="top" width="40" style="width:40px;padding:0 0 14px;">
                          <div style="width:28px;height:28px;line-height:28px;border-radius:50%;background:${p.accent};text-align:center;font-size:13px;font-weight:800;color:${p.ctaText};">${n}</div>
                        </td>
                        <td valign="top" style="padding:4px 0 14px;font-size:14px;line-height:21px;color:${p.muted};">${text}</td>
                      </tr>`;

const generateGuestlistEmailHTML = (data) => {
  const p = paletteFor(data.eventTheme);
  const n = data.totalTickets || 0;
  const people = `${n} ${n === 1 ? 'person' : 'people'}`;

  const body = `
          ${header(p, 'GROUP PASS')}
          ${card(
            p,
            `
                ${hero(p, data.eventImage, data.eventName)}
                ${intro(p, '&#10003;&nbsp; Group pass confirmed', `You&rsquo;re on the list, ${esc(firstName(data.leadName))}!`, `One QR code gets your whole group in. It&rsquo;s attached to this email as a PDF.`)}
                ${eventTitle(p, data.eventName)}
                ${detailsGrid(p, { date: data.eventDate, time: data.eventTime, venue: data.eventLocation, refLabel: 'Pass', ref: `#${shortRef(data.guestlistId)}` })}
                ${perforation(p)}
                <tr>
                  <td class="pad" style="padding:22px 32px 8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${p.raised}" style="background:${p.raised};border:1px solid ${p.cardBorder};border-radius:18px;">
                      <tr>
                        <td style="padding:18px 22px;">
                          ${label(p, 'Admits')}
                          <div style="font-size:34px;line-height:38px;font-weight:800;color:${p.accent};">${people}</div>
                          <div style="font-size:13px;color:${p.muted};margin-top:4px;">Lead guest: <strong style="color:${p.text};">${esc(data.leadName)}</strong></div>
                        </td>
                      </tr>
                    </table>
                    ${
                      data.notes
                        ? `<div style="margin-top:14px;padding:14px 18px;border-left:3px solid ${p.accent2};background:rgba(255,255,255,0.03);border-radius:0 12px 12px 0;font-size:13px;line-height:20px;color:${p.muted};"><strong style="color:${p.text};">Note:</strong> ${esc(data.notes)}</div>`
                        : ''
                    }
                  </td>
                </tr>
                <tr>
                  <td class="pad" style="padding:18px 32px 16px;">
                    ${label(p, 'How it works')}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                      ${step(p, 1, 'Share the attached PDF (or a screenshot of the QR code) with your group.')}
                      ${step(p, 2, 'Everyone scans the <strong style="color:' + p.text + ';">same QR code</strong> when they arrive.')}
                      ${step(p, 3, `The QR code stops working after <strong style="color:${p.text};">${n} ${n === 1 ? 'entry' : 'entries'}</strong>.`)}
                    </table>
                  </td>
                </tr>`
          )}
          ${callout(p, '&#127915;', 'Your group QR is in the PDF', `Keep it handy on the night. Can&rsquo;t see the attachment? Check your spam or promotions folder.`)}
          ${footer(p)}`;

  return layout({
    p,
    title: `Group pass for ${data.eventName}`,
    preheader: `Your group pass for ${data.eventName} admits ${people}. QR code attached.`,
    body,
  });
};

module.exports = {
  generateTicketConfirmationHTML,
  generateGuestlistEmailHTML,
};
