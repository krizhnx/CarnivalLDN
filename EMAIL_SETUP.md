# Email Service Setup Guide

## Overview
This project now uses **Resend** as the email service provider instead of SendGrid. Resend is a modern, developer-friendly email API with excellent deliverability.

## Setup Steps

### 1. Sign up for Resend
- Go to [resend.com](https://resend.com)
- Create a free account (100 emails/day free tier)
- Verify your domain or use the provided sandbox domain for testing

### 2. Get Your API Key
- In your Resend dashboard, go to API Keys
- Create a new API key
- Copy the API key (starts with `re_`)

### 3. Environment Variables
Add the following to your `.env.local` file:

```bash
# Resend Email Service
RESEND_API_KEY=re_your_actual_api_key_here
```

### 4. Update Sender Email
In `src/lib/emailService.ts`, update the `from` field:

```typescript
from: 'Carnival LDN <tickets@yourdomain.com>', // Replace with your verified domain
```

**Note:** For testing, you can use the sandbox domain provided by Resend (e.g., `onboarding@resend.dev`)

### 5. Test the Setup
- Make a test ticket purchase
- Check your email inbox for the confirmation email with attached PDF tickets
- Check the server logs for email success/error messages

## 🎫 PDF Ticket Features

The email service now automatically generates and attaches professional PDF tickets to confirmation emails:

- **Professional Design**: Carnival LDN branded ticket layout
- **Complete Information**: Event details, customer info, and ticket breakdown
- **QR Codes**: Each ticket includes a QR code for easy validation
- **Multiple Tickets**: Handles orders with multiple ticket types and quantities
- **Auto-attachment**: PDFs are automatically generated and attached to emails
- **No Manual Download**: Customers get their tickets immediately via email

### PDF Contents
- Event name, date, and location
- Customer information and order details
- Individual ticket cards with tier information
- QR codes for each ticket
- Professional styling and layout

## Alternative Email Services

If you prefer to use a different email service, here are some alternatives:

### Mailgun
```bash
npm install mailgun.js
```
- Good deliverability
- 5,000 emails/month free tier
- Requires domain verification

### Postmark
```bash
npm install postmark
```
- Specialized in transactional emails
- 100 emails/month free tier
- Excellent deliverability

### AWS SES
```bash
npm install @aws-sdk/client-ses
```
- Very cost-effective
- 62,000 emails/month free tier
- Requires AWS account setup

### Nodemailer (Free Option)
```bash
npm install nodemailer
```
- Use your own Gmail/SMTP
- Completely free
- Limited to personal email quotas

## Troubleshooting

### Common Issues

1. **"API key not found" error**
   - Check that `RESEND_API_KEY` is set in your `.env.local`
   - Restart your server after adding the environment variable

2. **"Domain not verified" error**
   - Verify your domain in Resend dashboard
   - Or use the sandbox domain for testing

3. **Emails not sending**
   - Check server logs for error messages
   - Verify your Resend account has available credits
   - Check spam folder

4. **Email formatting issues**
   - The service generates both HTML and plain text versions
   - Test with different email clients

### Testing

To test the email service without making a purchase:

```typescript
// Add this to your server.js for testing
app.post('/api/test-email', async (req, res) => {
  try {
    const testData = {
      customerName: 'Test User',
      customerEmail: 'your-email@example.com',
      orderId: 'test-order-123',
      eventName: 'Test Event',
      eventDate: '2024-12-25',
      eventLocation: 'Test Venue',
      tickets: [{
        tierName: 'General Admission',
        quantity: 2,
        unitPrice: 2500,
        totalPrice: 5000
      }],
      totalAmount: 5000,
      currency: 'gbp'
    };

    await sendTicketConfirmationEmail(testData);
    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Resend** | 100 emails/day | $0.80/1000 emails |
| Mailgun | 5,000 emails/month | $35/month + $0.80/1000 |
| Postmark | 100 emails/month | $15/month + $0.10/email |
| AWS SES | 62,000 emails/month | $0.10/1000 emails |
| SendGrid | 100 emails/day | $14/month + $0.80/1000 |

## Support

- **Resend Documentation**: [docs.resend.com](https://docs.resend.com)
- **Resend Support**: [resend.com/support](https://resend.com/support)
- **Project Issues**: Check your project's issue tracker
