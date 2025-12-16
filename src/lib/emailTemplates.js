// Email templates for ticket confirmations

/**
 * Generate HTML email template for ticket confirmation
 * @param {Object} data - Order and ticket data
 * @param {Function} formatCurrency - Currency formatting function
 * @param {Function} formatDate - Date formatting function
 * @returns {string} HTML email template
 */
const generateTicketConfirmationHTML = (data, formatCurrency, formatDate) => {
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
      line-height: 1.5;
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
    h1 {
      font-size: 30px;
      margin: 0 0 10px;
      font-weight: 700;
      line-height: 1.2;
      word-wrap: break-word;
    }
    .subtext {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 28px;
      line-height: 1.5;
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
      line-height: 1.3;
    }
    .row {
      display: block;
      text-align: center;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 15px;
      line-height: 1.5;
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      color: #6b7280;
      display: block;
      text-align: center;
      margin-bottom: 4px;
      width: 100%;
    }
    .value {
      font-weight: 500;
      text-align: center;
      word-wrap: break-word;
      display: block;
      width: 100%;
    }
    .plan {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #ffffff;
      border-radius: 10px;
      padding: 16px;
      margin-top: 12px;
      gap: 12px;
    }
    .plan > div:first-child {
      flex: 1;
      min-width: 0;
    }
    .plan-name {
      font-weight: 600;
      word-wrap: break-word;
      line-height: 1.4;
    }
    .price {
      font-size: 22px;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .footer {
      text-align: center;
      font-size: 13px;
      color: #9ca3af;
      padding: 24px;
      background: #f3f4f6;
      line-height: 1.5;
    }
    .footer-links {
      display: inline-block;
    }
    .footer-links a {
      display: inline-block;
      padding: 4px 0;
      min-height: 44px;
      line-height: 44px;
    }
    @media only screen and (max-width: 600px) {
      body {
        font-size: 16px;
      }
      .container {
        border-radius: 0;
      }
      .content {
        padding: 24px 20px;
      }
      h1 {
        font-size: 24px;
        line-height: 1.3;
      }
      .subtext {
        font-size: 15px;
        margin-bottom: 24px;
      }
      .card {
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 10px;
      }
      .card h2 {
        font-size: 18px;
        margin-bottom: 14px;
      }
      .row {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 6px;
        padding: 10px 0;
        font-size: 14px;
      }
      .label {
        text-align: center;
        margin-right: 0;
        width: 100%;
      }
      .value {
        text-align: center;
        margin-left: 0;
        font-size: 15px;
        width: 100%;
      }
      .plan {
        flex-direction: column;
        align-items: stretch;
        padding: 14px;
        gap: 8px;
      }
      .plan > div:first-child {
        width: 100%;
      }
      .price {
        font-size: 20px;
        align-self: flex-end;
      }
      .footer {
        padding: 20px 16px;
        font-size: 12px;
      }
      .footer-content {
        padding: 20px 16px !important;
      }
      .footer-brand {
        font-size: 18px !important;
        margin-bottom: 14px !important;
      }
      .footer-social {
        margin-bottom: 14px !important;
      }
      .footer-social img {
        width: 32px !important;
        height: 32px !important;
      }
      .footer-legal {
        font-size: 11px !important;
        padding-top: 14px !important;
      }
      .footer-links {
        display: block;
      }
      .footer-links a {
        display: block;
        padding: 8px 0;
        min-height: 44px;
        line-height: 1.5;
      }
      .footer-links a:not(:last-child)::after {
        content: '';
        display: block;
        margin: 8px 0;
      }
    }
    @media only screen and (max-width: 480px) {
      .content {
        padding: 20px 16px;
      }
      h1 {
        font-size: 22px;
      }
      .subtext {
        font-size: 14px;
      }
      .card {
        padding: 14px;
      }
      .card h2 {
        font-size: 16px;
      }
      .row {
        font-size: 13px;
      }
      .value {
        font-size: 14px;
      }
      .price {
        font-size: 18px;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 24px 12px;">
    <div class="container">
      <div class="content">
        <h1>${data.customerName}, your tickets are here!</h1>
        <p class="subtext">
          Hi ${data.customerName}, please take a moment to review your order.
        </p>

        <!-- Event summary -->
        <div class="card">
          <h2>Event summary</h2>

          <div class="row">
            <span class="label">Event:</span> <span class="value">${data.eventName}</span>
          </div>

          <div class="row">
            <span class="label">Date:</span> <span class="value">${formatDate(data.eventDate)}</span>
          </div>

          <div class="row">
            <span class="label">Location:</span> <span class="value">${data.eventLocation}</span>
          </div>

          ${data.tickets.some(t => t.lastEntryTime) ? `
          <div class="row">
            <span class="label" style="font-weight: bold;">Last Entry Time:</span> <span class="value" style="font-weight: bold;">${data.tickets.find(t => t.lastEntryTime)?.lastEntryTime || 'N/A'}</span>
          </div>
          ` : ''}

          <div class="row">
            <span class="label">Order ID:</span> <span class="value">${data.orderId}</span>
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
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <span style="font-weight: 600; font-size: 16px;">Total</span>
                <span class="price" style="font-size: 22px;">${formatCurrency(data.totalAmount, data.currency)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <p style="font-size:14px;color:#6b7280; text-align:center; font-weight:bold; line-height:1.5; padding: 0 8px;">
          Your tickets are attached as a PDF. Please keep them safe for event
          entry.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#ffffff;border-top:1px solid #e5e7eb;">
        <div class="footer-content" style="max-width:600px;margin:0 auto;padding:28px 20px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

          <!-- Social icons -->
          <div class="footer-social" style="margin-bottom:18px;">
            <a href="https://www.instagram.com/carnivalldn/" style="margin:0 6px;text-decoration:none;display:inline-block;min-width:44px;min-height:44px;vertical-align:middle;">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733558.png" width="36" height="36" alt="Instagram" style="display:block;" />
            </a>
            <a href="https://wa.me/1234567890" style="margin:0 6px;text-decoration:none;display:inline-block;min-width:44px;min-height:44px;vertical-align:middle;">
              <img
                src="https://cdn-icons-png.flaticon.com/512/733/733585.png"
                width="36"
                height="36"
                alt="WhatsApp"
                style="display:block;border-radius:50%;"
              />
            </a>
          </div>

          <!-- Brand -->
          <div class="footer-brand" style="margin-bottom:18px;">
            <strong style="font-size:20px;color:#111827;">Carnival LDN</strong>
          </div>

          <!-- Bottom legal -->
          <div class="footer-legal" style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#9ca3af;line-height:1.6;">
            © ${new Date().getFullYear()} Carnival LDN. All rights reserved
            <br /><br />
            <div class="footer-links">
              <a href="https://www.carnivalldn.com/terms-of-service" style="color:#84cc16;text-decoration:none;font-weight:500;min-height:44px;display:inline-block;line-height:1.5;">Terms of Service</a>
              <span style="color:#9ca3af;">&nbsp;•&nbsp;</span>
              <a href="https://www.carnivalldn.com/privacy-policy" style="color:#84cc16;text-decoration:none;font-weight:500;min-height:44px;display:inline-block;line-height:1.5;">Privacy policy</a>
            </div>
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

module.exports = {
  generateTicketConfirmationHTML
};

