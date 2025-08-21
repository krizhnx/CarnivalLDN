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
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Confirmation - ${data.eventName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
        .ticket-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #000000; text-align: left; }
        .ticket-item { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee; font-size: 16px; }
        .ticket-item:last-child { border-bottom: none; }
        .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #000000; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 16px; }
        .button { display: inline-block; background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ticket Confirmation</h1>
          <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
          <h2 style="font-size: 24px; margin-bottom: 20px;">Hello ${data.customerName}!</h2>
          <p style="font-size: 18px; margin-bottom: 30px;">Your tickets for <strong>${data.eventName}</strong> have been confirmed.</p>
          
          <div class="ticket-details">
            <h3 style="font-size: 20px; margin-bottom: 20px; color: #000000;">Event Details</h3>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Event:</strong> ${data.eventName}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Date:</strong> ${formatDate(data.eventDate)}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Location:</strong> ${data.eventLocation}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Order ID:</strong> ${data.orderId}</p>
          </div>
          
          <div class="ticket-details">
            <h3 style="font-size: 20px; margin-bottom: 20px; color: #000000;">Ticket Summary</h3>
            ${data.tickets.map(ticket => `
              <div class="ticket-item">
                <span style="font-size: 18px; font-weight: 600;">${ticket.tierName} × ${ticket.quantity}</span>
                <span style="font-size: 18px; font-weight: 600;">${formatCurrency(ticket.totalPrice, data.currency)}</span>
              </div>
            `).join('')}
            <div class="total">
              Total: ${formatCurrency(data.totalAmount, data.currency)}
            </div>
          </div>
          
          <p><strong>🎫 Your tickets are attached to this email as a PDF!</strong> Please download and save them for the event.</p>
          <p>Please keep this confirmation email for your records.</p>
          
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
${data.tickets.map(ticket => `- ${ticket.tierName} × ${ticket.quantity}: ${formatCurrency(ticket.totalPrice, data.currency)}`).join('\n')}

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
      doc.text(`Unit: ${formatCurrency(ticket.unitPrice, data.currency)}   Total: ${formatCurrency(ticket.totalPrice, data.currency)}`, cardX + 16, ty); ty += 18;
      doc.setTextColor(75, 85, 99); // gray-600
      doc.text(`Order Ref: ${data.orderId.slice(0, 8)}...`, cardX + 16, ty);

      // Generate QR code for each ticket
      const qrPayload = JSON.stringify({
        orderId: data.orderId,
        ticketTierId: ticket.tierId, // Use tierId instead of tierName
        quantity: ticket.quantity,
        customer: data.customerEmail,
      });

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

// Export for CommonJS
module.exports = {
  sendTicketConfirmationEmail
};
