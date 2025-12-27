const { Resend } = require('resend');
const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const https = require('https');
const sharp = require('sharp');
const { generateTicketConfirmationHTML: generateTicketConfirmationHTMLTemplate } = require('./emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);

// TypeScript interface (for reference only in CommonJS)
// interface TicketConfirmationEmailData {
//   customerName: string;
//   customerEmail: string;
//   orderId: string;
//   eventName: string;
//   eventDate: string;
//   eventLocation: string;
//   tickets: Array<{
//     tierName: string;
//     quantity: number;
//     unitPrice: number;
//     totalPrice: number;
//   }>;
//   totalAmount: number;
//   currency: string;
// }

const sendTicketConfirmationEmail = async (data) => {
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

// Helper functions for formatting
const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Assuming amount is in pence/cents
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const generateTicketConfirmationHTML = (data) => {
  return generateTicketConfirmationHTMLTemplate(data, formatCurrency, formatDate);
};

const generateTicketConfirmationText = (data) => {

  return `
Ticket Confirmation - ${data.eventName}

Hello ${data.customerName}!

Your tickets for ${data.eventName} have been confirmed.

Event Details:
- Event: ${data.eventName}
- Date: ${formatDate(data.eventDate)}
- Location: ${data.eventLocation}
- Order ID: ${data.orderId}

Ticket Summary:
${data.tickets.map(ticket => `- ${ticket.tierName} × ${ticket.quantity}: ${formatCurrency(ticket.totalPrice, data.currency)}${ticket.lastEntryTime ? ` (Last Entry: ${ticket.lastEntryTime})` : ''}`).join('\n')}

Total: ${formatCurrency(data.totalAmount, data.currency)}

🎫 YOUR TICKETS ARE ATTACHED TO THIS EMAIL AS A PDF!
Please download and save them for the event.

You can also access your tickets from your account. Please keep this confirmation email for your records.

If you have any questions, please don't hesitate to contact us.

Thank you for choosing Carnival LDN!

© ${new Date().getFullYear()} Carnival LDN. All rights reserved.
  `;
};

// Helper function to fetch image from URL and convert to data URL
// Converts SVG to PNG for jsPDF compatibility
const fetchImageAsDataURL = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, async (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch image: ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const contentType = res.headers['content-type'] || '';
          
          // Check if it's an SVG file
          if (contentType.includes('svg') || url.endsWith('.svg')) {
            // Convert SVG to PNG using sharp
            const pngBuffer = await sharp(buffer)
              .png()
              .toBuffer();
            
            const base64 = pngBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;
            resolve(dataUrl);
          } else {
            // For non-SVG images, return as-is
            const base64 = buffer.toString('base64');
            const dataUrl = `data:${contentType};base64,${base64}`;
            resolve(dataUrl);
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
};

// Generate PDF tickets for email attachment
const generateTicketsPDF = async (data) => {
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // Header bar
    doc.setFillColor(17, 24, 39); // gray-900
    doc.rect(0, 0, pageWidth, 110, 'F');

    // Text right aligned
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('Carnival LDN', pageWidth - margin, 45, { align: 'right' });

    doc.setFontSize(14);
    doc.text('TICKETS', pageWidth - margin, 65, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(data.eventName, pageWidth - margin, 85, { align: 'right' });

    y = 130;

    // Order Summary Box
    const boxY = y;
    const boxHeight = 140;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.rect(margin, boxY, pageWidth - margin * 2, boxHeight, 'FD');

    y += 25;

    // Two column layout
    const leftCol = margin + 25;
    const rightCol = pageWidth / 2 + 25;

    // Left column - Order details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('ORDER DETAILS', leftCol, y);

    y += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Order #${data.orderId.slice(0, 8).toUpperCase()}`, leftCol, y); y += 18;
    doc.text(data.customerName, leftCol, y); y += 18;
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(data.customerEmail, leftCol, y); y += 20;

    // Order total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text(`Total: ${formatCurrency(data.totalAmount, data.currency)}`, leftCol, y);

    // Right column - Event details
    y = boxY + 25;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('EVENT INFORMATION', rightCol, y);

    y += 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39); // gray-900
    doc.text(data.eventName, rightCol, y); y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(formatDate(data.eventDate), rightCol, y); y += 16;
    doc.text(data.eventLocation, rightCol, y);

    y = boxY + boxHeight + 30;

    // Generate tickets
    for (let i = 0; i < data.tickets.length; i++) {
      const ticket = data.tickets[i];

      // Page break check
      if (y + 200 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      // Ticket card with gradient-like effect
      const cardX = margin;
      const cardW = pageWidth - margin * 2;
      const cardH = 170;

      // Main card background
      doc.setDrawColor(17, 24, 39); // dark border
      doc.setLineWidth(2);
      doc.setFillColor(255, 255, 255); // white bg
      doc.rect(cardX, y, cardW, cardH, 'FD');

      // Colored accent bar on left
      doc.setFillColor(17, 24, 39); // gray-900
      doc.rect(cardX, y, 8, cardH, 'F');

      // Ticket header section
      let ty = y + 25;
      const textX = cardX + 25;

      // Tier name - left aligned, no box
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(ticket.tierName, textX, ty);

      ty += 25;

      // Quantity and price info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(`Quantity: ${ticket.quantity}`, textX, ty); ty += 25;

      // Unit price
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text(`Unit Price: ${formatCurrency(ticket.unitPrice, data.currency)}`, textX, ty); ty += 18;

      // Total price - prominent
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text(`Total: ${formatCurrency(ticket.totalPrice, data.currency)}`, textX, ty); ty += 25;

      // Last entry time - highlighted
      if (ticket.lastEntryTime) {
        const badgeWidth = 120;
        doc.setFillColor(254, 243, 199); // amber-100
        doc.roundedRect(textX - 5, ty - 8, badgeWidth, 20, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(146, 64, 14); // amber-900
        doc.text(`Last Entry: ${ticket.lastEntryTime}`, textX, ty + 5);
        ty += 25;
      }

      // Order reference at bottom
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175); // gray-400
      doc.text(`Order #${data.orderId.slice(0, 8).toUpperCase()}`, textX, ty);

      // QR code with label
      const qrSize = 130;
      const qrX = pageWidth - margin - qrSize - 20;
      const qrY = y + 20;

      try {
        const qrPayload = JSON.stringify({
          orderId: data.orderId,
          ticketTierId: ticket.tierId,
          quantity: ticket.quantity,
          customer: data.customerEmail,
        });

        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 120,
          margin: 1,
          color: { dark: '#111827', light: '#FFFFFFFF' }
        });

        // QR code background
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 5, 5, 'F');

        // QR code
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      } catch (err) {
        console.error('Error generating QR code:', err);
        // Draw placeholder if QR fails
        doc.setDrawColor(200, 200, 200);
        doc.rect(qrX, qrY, qrSize, qrSize);
      }

      y += cardH + 20;
    }

    // Add footer with copyright
    const footerY = pageHeight - 50;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // gray-500
    const currentYear = new Date().getFullYear();
    doc.text(`© ${currentYear} Carnival LDN. All Rights Reserved.`, pageWidth / 2, footerY, { align: 'center' });

    // Convert to buffer for email attachment
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate tickets PDF');
  }
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

const generateGuestlistEmailHTML = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Group Pass - ${data.eventName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
        .guestlist-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #000000; text-align: left; }
        .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 16px; }
        .button { display: inline-block; background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Group Pass Confirmation</h1>
          <p>Your group tickets are ready!</p>
        </div>
        
        <div class="content">
          <h2 style="font-size: 24px; margin-bottom: 20px;">Hello ${data.leadName}!</h2>
          <p style="font-size: 18px; margin-bottom: 30px;">Your group pass for <strong>${data.eventName}</strong> has been confirmed.</p>
          
          <div class="guestlist-details">
            <h3 style="font-size: 20px; margin-bottom: 20px; color: #000000;">Group Details</h3>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Event:</strong> ${data.eventName}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Date:</strong> ${formatDate(data.eventDate)}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Location:</strong> ${data.eventLocation}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Group Pass ID:</strong> ${data.guestlistId}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Total Tickets:</strong> ${data.totalTickets}</p>
            ${data.notes ? `<p style="font-size: 16px; margin-bottom: 10px;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
          </div>
          
          <div class="important">
            <h3 style="font-size: 18px; margin-bottom: 15px; color: #856404;">📱 Important Instructions</h3>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>This QR code can be scanned ${data.totalTickets} times for entry.</strong></p>
            <p style="font-size: 16px; margin-bottom: 10px;">Share this QR code with your group members.</p>
            <p style="font-size: 16px; margin-bottom: 10px;">Each person scans the same QR code when they arrive.</p>
            <p style="font-size: 16px; margin-bottom: 10px;">The QR code will stop working after ${data.totalTickets} scans.</p>
          </div>
          
          <p><strong>🎫 Your group pass is attached to this email as a PDF!</strong></p>
          <p>Please download and share it with your group members.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <div class="footer">
            <p>Thank you for choosing Carnival LDN!</p>
            <p>© ${new Date().getFullYear()} Carnival LDN. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateGuestlistEmailText = (data) => {
  return `
Group Pass - ${data.eventName}

Hello ${data.leadName}!

Your group pass for ${data.eventName} has been confirmed.

Group Details:
- Event: ${data.eventName}
- Date: ${formatDate(data.eventDate)}
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

const generateGuestlistPDF = async (data) => {
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // Header bar
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 90, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Carnival LDN - Group Pass', pageWidth / 2, 40, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.text(data.eventName, pageWidth / 2, 62, { align: 'center' });

    y = 110;
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(12);
    doc.text(`Group Pass ID: ${data.guestlistId}`, margin, y); y += 16;
    doc.text(`Lead: ${data.leadName}`, margin, y); y += 16;
    doc.text(`Email: ${data.leadEmail}`, margin, y); y += 16;
    doc.text(`Total Tickets: ${data.totalTickets}`, margin, y); y += 20;

    // Add event details
    doc.text(`Event: ${data.eventName}`, margin, y); y += 16;
    doc.text(`Date: ${formatDate(data.eventDate)}`, margin, y); y += 16;
    doc.text(`Location: ${data.eventLocation}`, margin, y); y += 20;

    // Important instructions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(133, 100, 4);
    doc.text('IMPORTANT INSTRUCTIONS:', margin, y); y += 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text(`• This QR code can be scanned ${data.totalTickets} times for entry`, margin, y); y += 16;
    doc.text(`• Share this QR code with your group members`, margin, y); y += 16;
    doc.text(`• Each person scans the same QR code when they arrive`, margin, y); y += 16;
    doc.text(`• The QR code will stop working after ${data.totalTickets} scans`, margin, y); y += 30;

    // Generate QR code for the group pass
    const qrPayload = JSON.stringify({
      type: 'guestlist',
      guestlistId: data.guestlistId,
      eventId: data.eventId,
      totalTickets: data.totalTickets,
      leadEmail: data.leadEmail,
      leadName: data.leadName
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload, { 
        width: 200, 
        margin: 1, 
        color: { dark: '#111827', light: '#FFFFFFFF' } 
      });
      
      // Center the QR code
      const qrSize = 200;
      const qrX = (pageWidth - qrSize) / 2;
      doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
      
      // Add text below QR code
      y += qrSize + 20;
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('SCAN THIS QR CODE FOR ENTRY', pageWidth / 2, y, { align: 'center' });
      
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
    }

    // Convert to buffer for email attachment
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating guestlist PDF:', error);
    throw new Error('Failed to generate guestlist PDF');
  }
};

// Export for CommonJS
module.exports = {
  sendTicketConfirmationEmail,
  sendGuestlistEmail
};
