# Stripe Integration Setup Guide

This guide will help you set up the complete Stripe integration for your Carnival LDN website.

## 🚀 What's Been Implemented

### Frontend Components
- **TicketTierForm**: Admin interface for creating and managing ticket tiers
- **Checkout**: User interface for purchasing tickets with Stripe
- **PaymentSuccess**: Success confirmation after payment
- **Updated EventForm**: Now includes ticket tier management
- **Updated Events**: Shows ticket tiers and integrates with checkout
- **Updated Dashboard**: Displays ticket sales statistics

### Backend API Routes
- **`/api/create-payment-intent`**: Creates Stripe payment intents
- **`/api/confirm-payment`**: Confirms payments and creates orders

### Features
- ✅ Tiered ticket pricing (Early Bird, VIP, Student, etc.)
- ✅ Multiple ticket quantities
- ✅ Real-time availability tracking
- ✅ Secure Stripe payment processing
- ✅ Order management and tracking
- ✅ Admin ticket tier management

## 🔧 Setup Steps

### 1. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51OyBk9IgkIAGwv6wTnbqfLaivBQ0wYCltGf0gS4yeEZpxkD1f5jKEwarmr294R0LXNEzEMNxHuCKLRpMH8DYgaWD00g8BPRDAG

# Supabase (if using separate backend)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Schema

You'll need to create these tables in your database (Supabase or other):

#### Orders Table
```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id TEXT,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  total_amount INTEGER,
  currency TEXT DEFAULT 'gbp',
  customer_email TEXT,
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Order Tickets Table
```sql
CREATE TABLE order_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  ticket_tier_id TEXT,
  quantity INTEGER,
  unit_price INTEGER,
  total_price INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Ticket Tiers Table
```sql
CREATE TABLE ticket_tiers (
  id TEXT PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  capacity INTEGER NOT NULL,
  sold_count INTEGER DEFAULT 0,
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  description TEXT,
  benefits TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Vercel Deployment

If deploying to Vercel:

1. Set environment variables in Vercel dashboard
2. The API routes will automatically be deployed as serverless functions

### 4. Local Development

For local development, you'll need to set up a local API server or use Vercel dev:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

## 🎫 How to Use

### For Admins

1. **Create Events with Ticket Tiers**:
   - Go to Dashboard → Add Event
   - Click "Manage Tiers" to set up pricing
   - Create tiers like "Early Bird (£25)", "VIP (£50)", "Student (£15)"
   - Set capacity and availability dates

2. **Monitor Sales**:
   - Dashboard shows total ticket sales
   - Track availability per tier
   - View order details

### For Users

1. **Browse Events**:
   - See available ticket tiers and prices
   - View real-time availability

2. **Purchase Tickets**:
   - Click "Buy Tickets" on any event
   - Select tier and quantity
   - Enter payment details
   - Receive confirmation

## 🔒 Security Features

- Stripe handles all payment data securely
- No credit card information stored on your servers
- Webhook verification for payment confirmations
- Environment variable protection for API keys

## 📱 Testing

### Test Card Numbers
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### Test Mode
- Currently configured for Stripe test mode
- Switch to live mode by updating environment variables
- Test webhooks using Stripe CLI

## 🚀 Next Steps

### Immediate
- [ ] Set up environment variables
- [ ] Create database tables
- [ ] Test payment flow
- [ ] Deploy to staging

### Future Enhancements
- [ ] Email confirmations
- [ ] Ticket PDF generation
- [ ] Refund processing
- [ ] Analytics dashboard
- [ ] Bulk ticket operations
- [ ] Discount codes
- [ ] Waitlist functionality

## 🆘 Troubleshooting

### Common Issues

1. **Payment Intent Creation Fails**:
   - Check Stripe secret key
   - Verify API route is accessible
   - Check request payload format

2. **Checkout Not Loading**:
   - Verify Stripe publishable key
   - Check browser console for errors
   - Ensure Stripe.js is loading

3. **Database Errors**:
   - Verify table schema
   - Check Supabase connection
   - Review API route logs

### Support

- Check Stripe documentation: https://stripe.com/docs
- Review Vercel function logs
- Check browser console for frontend errors

## 💰 Pricing

- **Stripe**: 1.4% + 20p per successful card charge (UK)
- **No setup fees**
- **No monthly fees**
- **Only pay for successful transactions**

---

**Note**: This integration is currently in test mode. Switch to live mode only after thorough testing and when ready for production use.
