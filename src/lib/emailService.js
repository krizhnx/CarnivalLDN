const { Resend } = require('resend');
const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');

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
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your tickets are here</title>
  <style>
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse !important;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
    }
    .content {
      padding: 32px 28px;
    }
    .logo-container {
      text-align: center;
      padding: 32px 28px 0;
    }
    .logo-container img {
      max-width: 100px;
      height: auto;
      padding-right: 25px;
    }
    h1 {
      font-size: 30px;
      margin: 0 0 10px;
      font-weight: 700;
    }
    .subtext {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 28px;
    }
    .card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .card h2 {
      font-size: 20px;
      margin: 0 0 16px;
      font-weight: 600;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 15px;
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      color: #6b7280;
    }
    .value {
      font-weight: 500;
      text-align: right;
    }
    .plan {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border-radius: 10px;
      padding: 16px;
      margin-top: 12px;
    }
    .plan-name {
      font-weight: 600;
    }
    .price {
      font-size: 22px;
      font-weight: 700;
    }
    .footer {
      text-align: center;
      font-size: 13px;
      color: #9ca3af;
      padding: 24px;
      background: #f3f4f6;
    }
    @media (max-width: 600px) {
      .row {
        flex-direction: column;
        gap: 6px;
      }
      .value {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 24px">
    <div class="container">
      <!-- Logo -->
      <div class="logo-container">
        <img src="https://carnivalldn.com/carnival-logo.svg" alt="Carnival LDN Logo" style="max-width: 80px; height: auto;" />
      </div>

      <div class="content">
        <h1>${data.customerName}, your tickets are here!</h1>
        <p class="subtext">
          Hi ${data.customerName}, please take a moment to review your order.
        </p>

        <!-- Event summary -->
        <div class="card">
          <h2>Event summary</h2>

          <div class="row">
            <span class="label">Event</span>
            <span class="value">${data.eventName}</span>
          </div>

          <div class="row">
            <span class="label">Date</span>
            <span class="value">${formatDate(data.eventDate)}</span>
          </div>

          <div class="row">
            <span class="label">Location</span>
            <span class="value">${data.eventLocation}</span>
          </div>

          ${data.tickets.some(t => t.lastEntryTime) ? `
          <div class="row">
            <span class="label" style="font-weight: bold;">Last Entry Time</span>
            <span class="value" style="font-weight: bold;">${data.tickets.find(t => t.lastEntryTime)?.lastEntryTime || 'N/A'}</span>
          </div>
          ` : ''}

          <div class="row">
            <span class="label">Order ID</span>
            <span class="value">${data.orderId}</span>
          </div>

          <div style="margin-top: 16px">
            <span class="label" style="display:block;margin-bottom:8px;">
              Purchased Tickets
            </span>

            ${data.tickets.map(ticket => `
              <div class="plan">
                <div>
                  <div class="plan-name">${ticket.tierName}</div>
                  <div style="color:#6b7280;font-size:14px;">
                    ${ticket.quantity} ticket(s)
                  </div>
                  ${ticket.lastEntryTime ? `
                  <div style="color:#111827;font-size:14px;font-weight:bold;margin-top:4px;">
                    Last Entry: ${ticket.lastEntryTime}
                  </div>
                  ` : ''}
                </div>
                <div class="price">
                  ${formatCurrency(ticket.totalPrice, data.currency)}
                </div>
              </div>
            `).join('')}
            
            ${data.tickets.length > 1 ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; font-size: 16px;">Total</span>
                <span class="price">${formatCurrency(data.totalAmount, data.currency)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <p style="font-size:14px;color:#6b7280; text-align:center; font-weight:bold">
          Your tickets are attached as a PDF. Please keep them safe for event
          entry.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#ffffff;border-top:1px solid #e5e7eb;">
        <div style="max-width:600px;margin:0 auto;padding:28px 20px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

          <!-- Social icons -->
          <div style="margin-bottom:18px;">
            <a href="https://www.instagram.com/carnivalldn/" style="margin:0 6px;text-decoration:none;">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733558.png" width="36" alt="Instagram" />
            </a>
            <a href="https://wa.me/1234567890" style="margin:0 6px;text-decoration:none;">
              <img
                src="https://cdn-icons-png.flaticon.com/512/733/733585.png"
                width="36"
                alt="WhatsApp"
                style="display:inline-block;border-radius:50%;"
              />
            </a>
          </div>

          <!-- Brand -->
          <div style="margin-bottom:18px;">
            <strong style="font-size:20px;color:#111827;">Carnival LDN</strong>
          </div>

          <!-- Bottom legal -->
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#9ca3af;">
            © ${new Date().getFullYear()} Carnival LDN. All rights reserved
            <br /><br />
            <a href="https://www.carnivalldn.com/terms-of-service" style="color:#84cc16;text-decoration:none;font-weight:500;">Terms of Service</a>
            &nbsp;•&nbsp;
            <a href="https://www.carnivalldn.com/privacy-policy" style="color:#84cc16;text-decoration:none;font-weight:500;">Privacy policy</a>
          </div>

        </div>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} Carnival LDN. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
  `;
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
    doc.rect(0, 0, pageWidth, 90, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Carnival LDN - Tickets', pageWidth / 2, 40, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.text(data.eventName, pageWidth / 2, 62, { align: 'center' });

    y = 110;
    doc.setTextColor(55, 65, 81); // gray-700
    doc.setFontSize(12);
    doc.text(`Order: ${data.orderId}`, margin, y); y += 16;
    doc.text(`Name: ${data.customerName}`, margin, y); y += 16;
    doc.text(`Email: ${data.customerEmail}`, margin, y); y += 16;
    doc.text(`Status: Completed`, margin, y); y += 16;
    doc.text(`Total: ${formatCurrency(data.totalAmount, data.currency)}`, margin, y); y += 20;

    // Add event details
    doc.text(`Event: ${data.eventName}`, margin, y); y += 16;
    doc.text(`Date: ${formatDate(data.eventDate)}`, margin, y); y += 16;
    doc.text(`Location: ${data.eventLocation}`, margin, y); y += 20;

    // Generate tickets
    for (let i = 0; i < data.tickets.length; i++) {
      const ticket = data.tickets[i];
      
      // Page break check
      if (y + 180 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      // Ticket card
      const cardX = margin;
      const cardW = pageWidth - margin * 2;
      const cardH = 150;
      doc.setDrawColor(229, 231, 235); // gray-200 border
      doc.setFillColor(249, 250, 251); // gray-50 bg
      doc.rect(cardX, y, cardW, cardH, 'FD');

      // Left column text
      let ty = y + 24;
      doc.setTextColor(31, 41, 55); // gray-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Ticket ${i + 1}`, cardX + 16, ty); ty += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Tier: ${ticket.tierName}`, cardX + 16, ty); ty += 14;
      doc.text(`Quantity: ${ticket.quantity}`, cardX + 16, ty); ty += 14;
      doc.text(`Unit: ${formatCurrency(ticket.unitPrice, data.currency)}   Total: ${formatCurrency(ticket.totalPrice, data.currency)}`, cardX + 16, ty); ty += 14;
      // Add last entry time in bold if available
      if (ticket.lastEntryTime) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39); // gray-900 for bold text
        doc.text(`Last Entry: ${ticket.lastEntryTime}`, cardX + 16, ty); ty += 18;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55); // Reset to gray-800
      } else {
        ty += 4; // Add spacing if no last entry time
      }
      doc.setTextColor(75, 85, 99); // gray-600
      doc.text(`Order Ref: ${data.orderId.slice(0, 8)}...`, cardX + 16, ty);

      // Generate QR code for each ticket
      const qrPayload = JSON.stringify({
        orderId: data.orderId,
        ticketTierId: ticket.tierId, // Use tierId instead of tierName
        quantity: ticket.quantity,
        customer: data.customerEmail,
      });
      
      // Debug: Log the QR payload to help troubleshoot
      console.log('🔍 Email Service QR Payload:', qrPayload);
      console.log('🔍 Email ticket data:', ticket);
      console.log('🔍 Email order data:', data);

      try {
        const qrDataUrl = await QRCode.toDataURL(qrPayload, { 
          width: 120, 
          margin: 1, 
          color: { dark: '#111827', light: '#FFFFFFFF' } 
        });
        doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 136, y + 15, 120, 120);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Continue without QR code if it fails
      }

      y += cardH + 14;
    }

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

    if (data.notes) {
      doc.text(`Notes: ${data.notes}`, margin, y); y += 20;
    }

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
