const { Resend } = require('resend');
const { generateTicketConfirmationHTML, generateGuestlistEmailHTML } = require('./emailTemplates');
const { generateTicketsPDF, generateGuestlistPDF } = require('./pdfTickets');
const { formatDate, formatCurrency } = require('./emailTheme');

const resend = new Resend(process.env.RESEND_API_KEY);

// TypeScript interface (for reference only in CommonJS)
// interface TicketConfirmationEmailData {
//   customerName: string;
//   customerEmail: string;
//   orderId: string;
//   eventName: string;
//   eventDate: string;
//   eventTime?: string; // free text, e.g. "22:00 - 03:00" or "19:00 - TBC"
//   eventLocation: string;
//   eventImage?: string; // poster, "/palace.png" or a full URL
//   eventTheme?: string; // card theme: 'default' | 'diwali' | 'halloween'
//   tickets: Array<{
//     tierId: string;
//     tierName: string;
//     quantity: number;
//     unitPrice: number;
//     totalPrice: number;
//     lastEntryTime?: string;
//   }>;
//   totalAmount: number;
//   currency: string;
//   pricing?: object; // promo breakdown, see pricingMeta.js
// }

// Per-ticket discount for each ticket line when the order used a per-ticket promo code
// (data.pricing comes from the Stripe PaymentIntent, see pricingMeta.js)
const withPromo = (data) => {
  const off = data.pricing?.perTicketOff;
  if (!off) return data;
  return {
    ...data,
    tickets: data.tickets.map((t) =>
      t.unitPrice > 0 ? { ...t, perTicketOff: Math.min(off, t.unitPrice) } : t
    ),
  };
};

const sendTicketConfirmationEmail = async (input) => {
  const data = withPromo(input);
  try {
    // Generate PDF tickets
    const pdfBuffer = await generateTicketsPDF(data);
    
    const response = await resend.emails.send({
      from: 'Carnival LDN <tickets@carnivalldn.com>', // Using carnivalldn.com domain
      to: [data.customerEmail],
      subject: `🎫 Ticket Confirmation - ${data.eventName}`,
      html: generateTicketConfirmationHTML(data),
      text: generateTicketConfirmationText(data),
      attachments: [
        {
          filename: `tickets_${data.orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (response.error) {
      console.error('Error sending email:', response.error);
      throw new Error(`Failed to send email: ${response.error.message}`);
    }

    console.log('Ticket confirmation email with PDF sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in sendTicketConfirmationEmail:', error);
    throw error;
  }
};

const promoBreakdownText = (data) => {
  const p = data.pricing;
  if (!p) return '';
  const money = (v) => formatCurrency(v, data.currency);
  const perTicket = p.perTicketOff && p.discountedTickets > 0
    ? ` (${money(p.perTicketOff)} off × ${p.discountedTickets} ticket${p.discountedTickets === 1 ? '' : 's'})`
    : '';
  const fee = p.fee < p.standardFee
    ? `${money(p.fee)} (was ${money(p.standardFee)}${p.feePerTicket !== undefined ? ` - ${money(p.feePerTicket)} per ticket with ${p.code}` : ''})`
    : money(p.fee);
  return `
Subtotal: ${money(p.subtotal)}
Promo code ${p.code}: -${money(p.discount)}${perTicket}
Booking fee: ${fee}`;
};

const generateTicketConfirmationText = (data) => {

  return `
Ticket Confirmation - ${data.eventName}

Hello ${data.customerName}!

Your tickets for ${data.eventName} have been confirmed.

Event Details:
- Event: ${data.eventName}
- Date: ${formatDate(data.eventDate)}${data.eventTime ? `\n- Time: ${data.eventTime}` : ''}
- Location: ${data.eventLocation}
- Order ID: ${data.orderId}

Ticket Summary:
${data.tickets.map(ticket => `- ${ticket.tierName} × ${ticket.quantity}: ${formatCurrency(ticket.totalPrice, data.currency)}${ticket.perTicketOff ? ` (${formatCurrency(ticket.perTicketOff, data.currency)} off each with ${data.pricing.code})` : ''}${ticket.lastEntryTime ? ` (Last Entry: ${ticket.lastEntryTime})` : ''}`).join('\n')}
${promoBreakdownText(data)}
Total: ${formatCurrency(data.totalAmount, data.currency)}

🎫 YOUR TICKETS ARE ATTACHED TO THIS EMAIL AS A PDF!
Please download and save them for the event.

You can also access your tickets from your account. Please keep this confirmation email for your records.

If you have any questions, please don't hesitate to contact us.

Thank you for choosing Carnival LDN!

© ${new Date().getFullYear()} Carnival LDN. All rights reserved.
  `;
};

const sendGuestlistEmail = async (data) => {
  try {
    // Generate PDF for guestlist
    const pdfBuffer = await generateGuestlistPDF(data);
    
    const response = await resend.emails.send({
      from: 'Carnival LDN <tickets@carnivalldn.com>',
      to: [data.leadEmail],
      subject: `🎫 Group Pass - ${data.eventName} - ${data.totalTickets} Tickets`,
      html: generateGuestlistEmailHTML(data),
      text: generateGuestlistEmailText(data),
      attachments: [
        {
          filename: `group_pass_${data.guestlistId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (response.error) {
      console.error('Error sending guestlist email:', response.error);
      throw new Error(`Failed to send email: ${response.error.message}`);
    }

    console.log('Guestlist email with PDF sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in sendGuestlistEmail:', error);
    throw error;
  }
};

const generateGuestlistEmailText = (data) => {
  return `
Group Pass - ${data.eventName}

Hello ${data.leadName}!

Your group pass for ${data.eventName} has been confirmed.

Group Details:
- Event: ${data.eventName}
- Date: ${formatDate(data.eventDate)}${data.eventTime ? `\n- Time: ${data.eventTime}` : ''}
- Location: ${data.eventLocation}
- Group Pass ID: ${data.guestlistId}
- Total Tickets: ${data.totalTickets}
${data.notes ? `- Notes: ${data.notes}` : ''}

📱 IMPORTANT INSTRUCTIONS:
This QR code can be scanned ${data.totalTickets} times for entry.

Share this QR code with your group members. Each person scans the same QR code when they arrive. The QR code will stop working after ${data.totalTickets} scans.

🎫 YOUR GROUP PASS IS ATTACHED TO THIS EMAIL AS A PDF!
Please download and share it with your group members.

If you have any questions, please don't hesitate to contact us.

Thank you for choosing Carnival LDN!

© ${new Date().getFullYear()} Carnival LDN. All rights reserved.
  `;
};

// Export for CommonJS
module.exports = {
  sendTicketConfirmationEmail,
  sendGuestlistEmail
};
