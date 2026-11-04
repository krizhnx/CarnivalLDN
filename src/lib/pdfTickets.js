// PDF attachments: ticket orders (one ticket stub + QR per ticket type) and group passes.
// Dark, on-brand layout drawn with jsPDF; colours follow the event's card theme.
//
// QR payloads are read by the door scanner - keep their shape exactly as is.

const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const sharp = require('sharp');
const { LOGO_WHITE_PNG, LOGO_ASPECT } = require('./brandLogo');
const { SITE_URL, paletteFor, absoluteUrl, formatDate, formatCurrency, shortRef } = require('./emailTheme');

// ---------------------------------------------------------------------------
// Text + drawing helpers
// ---------------------------------------------------------------------------

// jsPDF's built-in Helvetica only covers WinAnsi (cp1252). Emoji and anything else
// outside that set come out as garbage characters, so strip them from PDF text:
// "🎃 HOUSE OF SIN – CARNEVIL 🎃" -> "HOUSE OF SIN – CARNEVIL"
const CP1252_EXTRAS = new Set(
  '\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178'
);
const pdfText = (value, fallback = '') => {
  let out = '';
  for (const ch of String(value ?? '').normalize('NFC')) {
    const code = ch.codePointAt(0);
    const printable = (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || CP1252_EXTRAS.has(ch);
    out += printable ? ch : ' ';
  }
  out = out
    .replace(/\s+/g, ' ')
    // separators left dangling where an emoji used to be, e.g. "🎃 - TITLE"
    .replace(/^[\s\-\u2013\u2014|\u2022:,]+|[\s\-\u2013\u2014|\u2022:,]+$/g, '')
    .trim();
  return out || fallback;
};

const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const fill = (doc, hex) => doc.setFillColor(...rgb(hex));
const stroke = (doc, hex) => doc.setDrawColor(...rgb(hex));
const ink = (doc, hex) => doc.setTextColor(...rgb(hex));
const font = (doc, weight, size) => {
  doc.setFont('helvetica', weight);
  doc.setFontSize(size);
};

const withOpacity = (doc, opacity, draw) => {
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity }));
  draw();
  doc.restoreGraphicsState();
};

/** Width of text including letter spacing. */
const widthOf = (doc, text, charSpace = 0) => doc.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);

/** Shorten text with "..." so it fits in maxWidth. */
const fit = (doc, text, maxWidth, charSpace = 0) => {
  if (widthOf(doc, text, charSpace) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && widthOf(doc, `${t}...`, charSpace) > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}...`;
};

/** Text with optional letter spacing; align 'left' | 'center' | 'right' (handles spacing correctly). */
const write = (doc, text, x, y, { charSpace = 0, align = 'left' } = {}) => {
  const w = widthOf(doc, text, charSpace);
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  doc.text(text, left, y, charSpace ? { charSpace } : undefined);
  return w;
};

/** Draws coloured text runs on one line, e.g. [{ text, color, strike, bold }]. Returns the end x. */
const runs = (doc, parts, x, y, size) => {
  let cx = x;
  for (const part of parts) {
    font(doc, part.bold ? 'bold' : 'normal', size);
    ink(doc, part.color);
    doc.text(part.text, cx, y);
    const w = doc.getTextWidth(part.text);
    if (part.strike) {
      stroke(doc, part.color);
      doc.setLineWidth(0.7);
      doc.line(cx, y - size * 0.3, cx + w, y - size * 0.3);
    }
    cx += w + (part.gap ?? 4);
  }
  return cx;
};

/** Small rounded label, e.g. "ADMIT 2". Returns its width. */
const tag = (doc, text, x, y, { bg, color, border, size = 7.5, charSpace = 1.2, opacity } = {}) => {
  font(doc, 'bold', size);
  const w = widthOf(doc, text, charSpace) + 16;
  const h = size + 10;
  const box = () => {
    if (bg) {
      fill(doc, bg);
      doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
    }
  };
  if (opacity !== undefined) withOpacity(doc, opacity, box);
  else box();
  if (border) {
    stroke(doc, border);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, w, h, h / 2, h / 2, 'S');
  }
  ink(doc, color);
  write(doc, text, x + 8, y + h / 2 + size * 0.35, { charSpace });
  return w;
};

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/** Event poster bytes, or null if there isn't one / it can't be fetched quickly. */
const fetchPoster = async (image) => {
  const url = absoluteUrl(image);
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn('PDF poster unavailable:', url, err.message);
    return null;
  }
};

const qrImage = (payload) =>
  QRCode.toDataURL(JSON.stringify(payload), { width: 480, margin: 1, color: { dark: '#0a0a0a', light: '#FFFFFFFF' } });

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 40; // page margin
const HERO_H = 236;
const SCALE = 2; // hero image pixels per pt
const THUMB = { top: 64, maxW: 130, maxH: 150, radius: 10 };

const paintPage = (doc, p) => {
  fill(doc, p.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
};

/**
 * Hero background rendered as one JPEG: the poster blurred and darkened as a backdrop with the whole poster
 * as a framed thumbnail on the right (or soft accent glows when there's no poster), fading into the page.
 * Returns { dataUrl, thumbW } with thumbW in pt (0 without a poster).
 */
const buildHero = async (posterBytes, p) => {
  const W = Math.round(PAGE_W * SCALE);
  const H = Math.round(HERO_H * SCALE);
  const fade = `
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="${p.bg}" stop-opacity="0"/>
      <stop offset="1" stop-color="${p.bg}" stop-opacity="1"/>
    </linearGradient>`;
  const svg = (inner, defs = '') =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${defs}</defs>${inner}</svg>`);

  if (posterBytes) {
    try {
      const backdrop = await sharp(posterBytes)
        .resize(W, H, { fit: 'cover' })
        .blur(30)
        .modulate({ brightness: 0.85, saturation: 1.2 })
        .toBuffer();

      const thumb = await sharp(posterBytes)
        .resize(THUMB.maxW * SCALE, THUMB.maxH * SCALE, { fit: 'inside' })
        .toBuffer({ resolveWithObject: true });
      const tw = thumb.info.width;
      const th = thumb.info.height;
      const r = THUMB.radius * SCALE;
      const left = Math.round((PAGE_W - M) * SCALE - tw);
      const top = THUMB.top * SCALE;
      const rounded = await sharp(thumb.data)
        .ensureAlpha()
        .composite([{ input: Buffer.from(`<svg width="${tw}" height="${th}"><rect width="${tw}" height="${th}" rx="${r}" ry="${r}" fill="#fff"/></svg>`), blend: 'dest-in' }])
        .png()
        .toBuffer();

      const shade = svg(
        `<rect width="100%" height="100%" fill="url(#h)"/><rect width="100%" height="100%" fill="url(#v)"/>`,
        `<linearGradient id="h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${p.bg}" stop-opacity="0.9"/>
          <stop offset="0.6" stop-color="${p.bg}" stop-opacity="0.62"/>
          <stop offset="1" stop-color="${p.bg}" stop-opacity="0.45"/>
        </linearGradient>${fade}`
      );
      const shadow = svg(
        `<rect x="${left}" y="${top + 14}" width="${tw}" height="${th}" rx="${r}" fill="#000" fill-opacity="0.6" filter="url(#s)"/>`,
        `<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${12 * SCALE}"/></filter>`
      );
      const frame = svg(
        `<rect x="${left + 1}" y="${top + 1}" width="${tw - 2}" height="${th - 2}" rx="${r}" fill="none" stroke="#fff" stroke-opacity="0.2" stroke-width="2"/>`
      );

      const jpeg = await sharp(backdrop)
        .composite([{ input: shade }, { input: shadow }, { input: rounded, left, top }, { input: frame }])
        .jpeg({ quality: 85 })
        .toBuffer();
      return { dataUrl: `data:image/jpeg;base64,${jpeg.toString('base64')}`, thumbW: tw / SCALE };
    } catch (err) {
      console.warn('PDF poster could not be processed:', err.message);
    }
  }

  const glow = svg(
    `<rect width="100%" height="100%" fill="${p.card}"/>
     <rect width="100%" height="100%" fill="url(#a)"/>
     <rect width="100%" height="100%" fill="url(#b)"/>
     <rect width="100%" height="100%" fill="url(#v)"/>`,
    `<radialGradient id="a" cx="0.88" cy="0.05" r="0.6"><stop offset="0" stop-color="${p.accent}" stop-opacity="0.3"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>
     <radialGradient id="b" cx="0.5" cy="1.05" r="0.5"><stop offset="0" stop-color="${p.accent2}" stop-opacity="0.22"/><stop offset="1" stop-color="${p.accent2}" stop-opacity="0"/></radialGradient>
     ${fade}`
  );
  const jpeg = await sharp(glow).jpeg({ quality: 88 }).toBuffer();
  return { dataUrl: `data:image/jpeg;base64,${jpeg.toString('base64')}`, thumbW: 0 };
};

/** Largest title size that fits in two lines; very long titles are cut with "...". */
const titleLines = (doc, title, width) => {
  for (const size of [26, 22, 19]) {
    font(doc, 'bold', size);
    const lines = doc.splitTextToSize(title, width);
    if (lines.length <= 2) return { size, lines };
  }
  const lines = doc.splitTextToSize(title, width);
  return { size: 19, lines: [lines[0], fit(doc, lines.slice(1).join(' '), width)] };
};

/** Hero band with logo, label and event title / date / venue. */
const drawHero = (doc, p, { hero, label, title, date, time, venue }) => {
  doc.addImage(hero.dataUrl, 'JPEG', 0, 0, PAGE_W, HERO_H);
  const textW = PAGE_W - M * 2 - (hero.thumbW ? hero.thumbW + 28 : 0);

  // Brand
  const logoH = 18;
  doc.addImage(LOGO_WHITE_PNG, 'PNG', M, 34, logoH * LOGO_ASPECT, logoH);
  font(doc, 'bold', 9.5);
  ink(doc, '#ffffff');
  write(doc, 'CARNIVAL LDN', M + logoH * LOGO_ASPECT + 10, 47, { charSpace: 2.4 });

  // Label (top right)
  font(doc, 'bold', 7.5);
  const labelW = widthOf(doc, label, 1.4) + 16;
  tag(doc, label, PAGE_W - M - labelW, 33, { border: p.accent, color: p.accent, charSpace: 1.4 });

  // Title block, anchored to the bottom
  const { size, lines } = titleLines(doc, pdfText(title, 'Carnival LDN').toUpperCase(), textW);
  const lineH = size * 1.12;
  const venueY = HERO_H - 26;
  const lastTitleY = venueY - 21;
  const firstTitleY = lastTitleY - (lines.length - 1) * lineH;

  font(doc, 'bold', 9.5);
  ink(doc, p.accent);
  const when = [formatDate(date), time].filter(Boolean).map((t) => pdfText(t)).join('  |  ');
  if (when) write(doc, fit(doc, when.toUpperCase(), textW, 1.2), M, firstTitleY - size - 3, { charSpace: 1.2 });

  font(doc, 'bold', size);
  ink(doc, '#ffffff');
  lines.forEach((line, i) => doc.text(line, M, firstTitleY + i * lineH));

  if (venue) {
    font(doc, 'normal', 11);
    ink(doc, p.muted);
    doc.text(fit(doc, pdfText(venue), textW), M, venueY);
  }
};

const card = (doc, p, x, y, w, h, r = 16) => {
  fill(doc, p.card);
  stroke(doc, p.cardBorder);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, w, h, r, r, 'FD');
};

const smallLabel = (doc, p, text, x, y, align = 'left') => {
  font(doc, 'bold', 7);
  ink(doc, p.faint);
  write(doc, text, x, y, { charSpace: 1.3, align });
};

const value = (doc, p, text, x, y, maxWidth, size = 11) => {
  font(doc, 'bold', size);
  ink(doc, p.text);
  doc.text(fit(doc, text, maxWidth), x, y);
};

/** Footer on every page: site, copyright, page numbers. */
const drawFooters = (doc, p, note) => {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    stroke(doc, p.cardBorder);
    doc.setLineWidth(0.6);
    doc.line(M, PAGE_H - 46, PAGE_W - M, PAGE_H - 46);
    font(doc, 'normal', 7.5);
    ink(doc, p.faint);
    doc.text(SITE_URL.replace(/^https?:\/\//, ''), M, PAGE_H - 30);
    write(doc, note, PAGE_W / 2, PAGE_H - 30, { align: 'center' });
    write(doc, `Page ${i} of ${pages}`, PAGE_W - M, PAGE_H - 30, { align: 'right' });
  }
};

/** Bullet list in a card ("Good to know"). Returns the bottom y. */
const drawNotes = (doc, p, y, title, items) => {
  const lineH = 13;
  font(doc, 'normal', 9);
  const wrapped = items.map((t) => doc.splitTextToSize(t, PAGE_W - M * 2 - 56));
  const h = 46 + wrapped.reduce((s, l) => s + l.length * lineH + 6, 0);
  card(doc, p, M, y, PAGE_W - M * 2, h, 14);
  smallLabel(doc, p, title, M + 20, y + 24);
  let cy = y + 42;
  for (const lines of wrapped) {
    fill(doc, p.accent);
    doc.circle(M + 24, cy - 3, 2, 'F');
    font(doc, 'normal', 9);
    ink(doc, p.muted);
    lines.forEach((l, i) => doc.text(l, M + 34, cy + i * lineH));
    cy += lines.length * lineH + 6;
  }
  return y + h;
};

const newDoc = () => new jsPDF({ unit: 'pt', format: 'a4', compress: true });

// ---------------------------------------------------------------------------
// Ticket orders
// ---------------------------------------------------------------------------

const TICKET_H = 196;
const STUB_W = 170;

const drawTicket = async (doc, p, data, ticket, y) => {
  const x = M;
  const w = PAGE_W - M * 2;
  const perfX = x + w - STUB_W;
  const money = (v) => formatCurrency(v, data.currency);

  card(doc, p, x, y, w, TICKET_H, 18);

  // Accent edge
  fill(doc, p.accent);
  doc.roundedRect(x, y + 22, 4, TICKET_H - 44, 2, 2, 'F');

  // Perforation + notches
  stroke(doc, p.cardBorder);
  doc.setLineWidth(1);
  doc.setLineDashPattern([4, 4], 0);
  doc.line(perfX, y + 16, perfX, y + TICKET_H - 16);
  doc.setLineDashPattern([], 0);
  fill(doc, p.bg);
  doc.circle(perfX, y, 11, 'F');
  doc.circle(perfX, y + TICKET_H, 11, 'F');

  // Left: admit / last entry
  const lx = x + 26;
  const leftW = perfX - lx - 22;
  let tx = lx;
  tx += tag(doc, `ADMIT ${ticket.quantity}`, tx, y + 22, { bg: p.accent, color: p.ctaText, size: 8 }) + 6;
  if (ticket.lastEntryTime) {
    // tinted pill; tag() draws the text fully opaque on top
    tag(doc, `LAST ENTRY ${pdfText(ticket.lastEntryTime).toUpperCase()}`, tx, y + 22, { bg: '#fbbf24', color: '#fcd34d', size: 8, opacity: 0.18 });
  }

  font(doc, 'bold', 20);
  ink(doc, p.text);
  doc.text(fit(doc, pdfText(ticket.tierName, 'Ticket'), leftW), lx, y + 70);
  font(doc, 'normal', 9.5);
  ink(doc, p.muted);
  doc.text(fit(doc, pdfText(data.eventName, 'Carnival LDN'), leftW), lx, y + 87);

  // Details grid: date + venue get the wide column
  const wideW = Math.round(leftW * 0.6);
  const rx = lx + wideW;
  const narrowW = leftW - wideW;
  smallLabel(doc, p, 'DATE', lx, y + 116);
  value(doc, p, pdfText(formatDate(data.eventDate), 'TBC'), lx, y + 131, wideW - 12, 10.5);
  smallLabel(doc, p, 'TIME', rx, y + 116);
  value(doc, p, pdfText(data.eventTime, 'TBC'), rx, y + 131, narrowW, 10.5);
  smallLabel(doc, p, 'VENUE', lx, y + 153);
  value(doc, p, pdfText(data.eventLocation, 'TBC'), lx, y + 168, wideW - 12, 10.5);
  smallLabel(doc, p, 'PRICE', rx, y + 153);
  if (!ticket.unitPrice) {
    value(doc, p, 'Free', rx, y + 168, narrowW, 10.5);
  } else if (ticket.perTicketOff) {
    runs(
      doc,
      [
        { text: `${ticket.quantity} x`, color: p.text, bold: true, gap: 4 },
        { text: money(ticket.unitPrice), color: p.faint, strike: true, gap: 4 },
        { text: money(ticket.unitPrice - ticket.perTicketOff), color: p.good, bold: true },
      ],
      rx,
      y + 168,
      10.5
    );
  } else {
    value(doc, p, `${ticket.quantity} x ${money(ticket.unitPrice)}`, rx, y + 168, narrowW, 10.5);
  }

  // Stub: QR + scan label
  const cx = perfX + STUB_W / 2;
  const tile = 128;
  fill(doc, '#ffffff');
  doc.roundedRect(cx - tile / 2, y + 20, tile, tile, 12, 12, 'F');
  try {
    // Payload read by the door scanner - do not change its shape
    const qr = await qrImage({
      orderId: data.orderId,
      ticketTierId: ticket.tierId,
      quantity: ticket.quantity,
      customer: data.customerEmail,
    });
    doc.addImage(qr, 'PNG', cx - tile / 2 + 8, y + 28, tile - 16, tile - 16);
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
  font(doc, 'bold', 7.5);
  ink(doc, p.text);
  write(doc, 'SCAN AT ENTRY', cx, y + 166, { charSpace: 1.6, align: 'center' });
  font(doc, 'normal', 8);
  ink(doc, p.faint);
  write(doc, `#${shortRef(data.orderId)}`, cx, y + 180, { align: 'center', charSpace: 0.8 });
};

const generateTicketsPDF = async (data) => {
  try {
    const p = paletteFor(data.eventTheme);
    const doc = newDoc();
    const money = (v) => formatCurrency(v, data.currency);
    const hero = await buildHero(await fetchPoster(data.eventImage), p);
    const count = data.tickets.reduce((s, t) => s + (t.quantity || 0), 0);
    const pricing = data.pricing || null;

    paintPage(doc, p);
    drawHero(doc, p, {
      hero,
      label: 'E-TICKET',
      title: data.eventName,
      date: data.eventDate,
      time: data.eventTime,
      venue: data.eventLocation,
    });

    // Order summary strip
    let y = HERO_H + 20;
    const stripH = 62;
    card(doc, p, M, y, PAGE_W - M * 2, stripH, 14);
    const cols = [
      ['ORDER', `#${shortRef(data.orderId)}`],
      ['NAME', pdfText(data.customerName, '-')],
      ['TICKETS', String(count)],
      [data.totalAmount ? 'TOTAL PAID' : 'TOTAL', data.totalAmount ? money(data.totalAmount) : 'Free'],
    ];
    const colW = (PAGE_W - M * 2 - 40) / cols.length;
    cols.forEach(([k, v], i) => {
      const cx = M + 20 + colW * i;
      smallLabel(doc, p, k, cx, y + 25);
      value(doc, p, v, cx, y + 43, colW - 12, 12);
    });
    y += stripH;

    // Promo code line
    if (pricing) {
      const parts = [
        { text: `${pdfText(pricing.code)} applied:`, color: p.good, bold: true },
        {
          text:
            pricing.perTicketOff && pricing.discountedTickets > 0
              ? `${money(pricing.perTicketOff)} off x ${pricing.discountedTickets} (-${money(pricing.discount)})`
              : `-${money(pricing.discount)}`,
          color: p.good,
          gap: 10,
        },
        { text: 'Booking fee', color: p.muted },
      ];
      if (pricing.fee < pricing.standardFee) parts.push({ text: money(pricing.standardFee), color: p.faint, strike: true });
      parts.push({ text: money(pricing.fee), color: pricing.fee < pricing.standardFee ? p.good : p.muted, bold: pricing.fee < pricing.standardFee });
      runs(doc, parts, M + 20, y + 20, 9);
      y += 30;
    } else {
      y += 4;
    }

    // Ticket stubs
    y += 16;
    for (const ticket of data.tickets) {
      if (y + TICKET_H > PAGE_H - 70) {
        doc.addPage();
        paintPage(doc, p);
        y = M + 8;
      }
      await drawTicket(doc, p, data, ticket, y);
      y += TICKET_H + 18;
    }

    // Good to know
    const notes = [
      'Show the QR code at the door. Each QR admits the number of people shown on it - it is scanned once per person.',
      'Turn your screen brightness up when you get to the front of the queue.',
      'Anyone with your QR code can use it, so please do not post it online.',
    ];
    if (y + 110 > PAGE_H - 60) {
      doc.addPage();
      paintPage(doc, p);
      y = M + 8;
    }
    drawNotes(doc, p, y, 'GOOD TO KNOW', notes);

    drawFooters(doc, p, `Order #${shortRef(data.orderId)}  |  \u00A9 ${new Date().getFullYear()} Carnival LDN`);
    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate tickets PDF');
  }
};

// ---------------------------------------------------------------------------
// Group passes
// ---------------------------------------------------------------------------

const generateGuestlistPDF = async (data) => {
  try {
    const p = paletteFor(data.eventTheme);
    const doc = newDoc();
    const hero = await buildHero(await fetchPoster(data.eventImage), p);
    const n = data.totalTickets || 0;

    paintPage(doc, p);
    drawHero(doc, p, {
      hero,
      label: 'GROUP PASS',
      title: data.eventName,
      date: data.eventDate,
      time: data.eventTime,
      venue: data.eventLocation,
    });

    // Pass card: details left, QR right
    let y = HERO_H + 20;
    const h = 262;
    const w = PAGE_W - M * 2;
    card(doc, p, M, y, w, h, 18);
    fill(doc, p.accent);
    doc.roundedRect(M, y + 24, 4, h - 48, 2, 2, 'F');

    const lx = M + 28;
    const tile = 196;
    const qrX = M + w - 26 - tile;
    const leftW = qrX - lx - 20;

    smallLabel(doc, p, 'ADMITS', lx, y + 34);
    font(doc, 'bold', 34);
    ink(doc, p.accent);
    doc.text(String(n), lx, y + 72);
    const numW = doc.getTextWidth(String(n));
    font(doc, 'bold', 14);
    ink(doc, p.text);
    doc.text(n === 1 ? 'person' : 'people', lx + numW + 8, y + 72);

    smallLabel(doc, p, 'LEAD GUEST', lx, y + 106);
    value(doc, p, pdfText(data.leadName, '-'), lx, y + 122, leftW, 12);
    smallLabel(doc, p, 'PASS', lx, y + 150);
    value(doc, p, `#${shortRef(data.guestlistId)}`, lx, y + 166, leftW, 12);
    smallLabel(doc, p, 'DATE', lx, y + 194);
    value(doc, p, pdfText(formatDate(data.eventDate), 'TBC'), lx, y + 210, leftW, 11);
    smallLabel(doc, p, 'TIME', lx, y + 232);
    value(doc, p, pdfText(data.eventTime, 'TBC'), lx, y + 247, leftW, 11);

    fill(doc, '#ffffff');
    doc.roundedRect(qrX, y + 22, tile, tile, 14, 14, 'F');
    try {
      // Payload read by the door scanner - do not change its shape
      const qr = await qrImage({
        type: 'guestlist',
        guestlistId: data.guestlistId,
        eventId: data.eventId,
        totalTickets: data.totalTickets,
        leadEmail: data.leadEmail,
        leadName: data.leadName,
      });
      doc.addImage(qr, 'PNG', qrX + 10, y + 32, tile - 20, tile - 20);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
    font(doc, 'bold', 8);
    ink(doc, p.text);
    write(doc, 'SCAN AT ENTRY', qrX + tile / 2, y + tile + 40, { charSpace: 1.8, align: 'center' });

    y += h + 18;

    // Notes from the organiser
    const note = pdfText(data.notes);
    if (note) {
      font(doc, 'normal', 9.5);
      const lines = doc.splitTextToSize(note, w - 48).slice(0, 4);
      const nh = 40 + lines.length * 13;
      card(doc, p, M, y, w, nh, 14);
      smallLabel(doc, p, 'NOTE', M + 22, y + 22);
      font(doc, 'normal', 9.5);
      ink(doc, p.muted);
      lines.forEach((l, i) => doc.text(l, M + 22, y + 38 + i * 13));
      y += nh + 18;
    }

    // How it works
    const steps = [
      'Share this PDF (or a screenshot of the QR code) with your group.',
      'Everyone scans the same QR code when they arrive.',
      `The QR code stops working after ${n} ${n === 1 ? 'entry' : 'entries'}.`,
    ];
    if (y + 130 > PAGE_H - 60) {
      doc.addPage();
      paintPage(doc, p);
      y = M + 8;
    }
    const sh = 44 + steps.length * 26;
    card(doc, p, M, y, w, sh, 14);
    smallLabel(doc, p, 'HOW IT WORKS', M + 22, y + 24);
    steps.forEach((s, i) => {
      const sy = y + 50 + i * 26;
      fill(doc, p.accent);
      doc.circle(M + 31, sy - 3.5, 9, 'F');
      font(doc, 'bold', 9);
      ink(doc, p.ctaText);
      write(doc, String(i + 1), M + 31, sy, { align: 'center' });
      font(doc, 'normal', 10);
      ink(doc, p.muted);
      doc.text(fit(doc, s, w - 80), M + 50, sy);
    });

    drawFooters(doc, p, `Group pass #${shortRef(data.guestlistId)}  |  \u00A9 ${new Date().getFullYear()} Carnival LDN`);
    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error generating guestlist PDF:', error);
    throw new Error('Failed to generate guestlist PDF');
  }
};

module.exports = { generateTicketsPDF, generateGuestlistPDF, pdfText };
