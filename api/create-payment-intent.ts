const StripePaymentSDK = require('stripe');

module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body);
    const { eventId, tickets, customerInfo, totalAmount, affiliateLinkId, isApplePay } = req.body;

    // Helper to detect Apple relay emails
    const isAppleRelayEmail = (email?: string) => {
      return email?.endsWith('@inbox.appleid.apple.com');
    };

    // Always prioritize form email over Apple Pay email
    const finalEmail = customerInfo.email;
    const applePayEmail = customerInfo.applePayEmail || null;

    // Log if we detect a relay email
    if (isApplePay && applePayEmail && isAppleRelayEmail(applePayEmail)) {
      console.log('🍎 Apple Pay relay email detected:', applePayEmail);
      console.log('✅ Using form email instead:', finalEmail);
    }

    console.log('🔍 Affiliate tracking in create-payment-intent:', {
      affiliateLinkId,
      hasAffiliateLinkId: !!affiliateLinkId,
      sessionStorageAffiliateLinkId: req.body.affiliateLinkId
    });

    if (!eventId || !tickets || !customerInfo || !totalAmount) {
      console.log('Missing fields:', { eventId, tickets, customerInfo, totalAmount });
      return res.status(400).json({
        error: 'Missing required fields',
        received: { eventId, tickets, customerInfo, totalAmount }
      });
    }

    // Validate customer info - email is always required, name/phone optional for Apple Pay
    if (!finalEmail || finalEmail.trim() === '') {
      return res.status(400).json({
        error: 'Email is required',
        missing: { email: true }
      });
    }

    // For non-Apple Pay, require name and phone
    if (!isApplePay) {
      if (!customerInfo.name || !customerInfo.phone) {
        return res.status(400).json({
          error: 'Missing required customer information',
          missing: {
            name: !customerInfo.name,
            phone: !customerInfo.phone
          }
        });
      }
    }

    // Date of birth validation - required for regular payments, optional for Apple Pay
    if (!isApplePay) {
      if (!customerInfo.dateOfBirth || customerInfo.dateOfBirth.trim() === '') {
        return res.status(400).json({
          error: 'Date of birth is required for this payment method',
          received: customerInfo.dateOfBirth
        });
      }
    } else {
      console.log('🍎 Apple Pay transaction - DOB validation skipped');
    }

    // Age validation - must be 18 or older (only if DOB is provided)
    if (customerInfo.dateOfBirth && customerInfo.dateOfBirth.trim() !== '') {
      const today = new Date();
      const birthDate = new Date(customerInfo.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        return res.status(400).json({
          error: 'You must be 18 years or older to purchase tickets',
          age: age
        });
      }
    }

    // Validate tickets array
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ error: 'Invalid tickets array' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return res.status(500).json({ error: 'Stripe configuration error' });
    }

    const stripe = new StripePaymentSDK(stripeSecretKey);

    // Get ticket tier details from Supabase
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing. SUPABASE_URL:', !!process.env.SUPABASE_URL, 'SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate all ticket tiers and check availability
    for (const ticket of tickets) {
      const { data: ticketTier, error: tierError } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('id', ticket.tierId)
        .single();

      if (tierError || !ticketTier) {
        console.log('Ticket tier error:', tierError);
        return res.status(400).json({ error: `Invalid ticket tier: ${ticket.tierId}` });
      }

      if (ticketTier.sold_count + ticket.quantity > ticketTier.capacity) {
        return res.status(400).json({ error: `Not enough tickets available for ${ticketTier.name}` });
      }
    }

    // Create payment intent with the total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'gbp',
      metadata: {
        eventId,
        customerName: customerInfo.name || '',
        customerEmail: finalEmail, // Always use form email (primary)
        applePayRelayEmail: applePayEmail || null, // Store Apple Pay email separately (secondary)
        customerPhone: customerInfo.phone || '',
        customerDateOfBirth: customerInfo.dateOfBirth || null,
        customerGender: customerInfo.gender || null,
        affiliateLinkId: affiliateLinkId || null, // Include affiliate link ID
        isApplePay: isApplePay ? 'true' : 'false', // Include Apple Pay flag
        ticketCount: tickets.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0),
        tickets: JSON.stringify(tickets.map(t => ({ tierId: t.tierId, quantity: t.quantity })))
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}
