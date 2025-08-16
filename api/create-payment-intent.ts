const StripePaymentSDK = require('stripe');

module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body);
    const { eventId, ticketTierId, quantity } = req.body;

    if (!eventId || !ticketTierId || !quantity) {
      console.log('Missing fields:', { eventId, ticketTierId, quantity });
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { eventId, ticketTierId, quantity }
      });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return res.status(500).json({ error: 'Stripe configuration error' });
    }

    const stripe = new StripePaymentSDK(stripeSecretKey);

    // Get ticket tier details from Supabase
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: ticketTier, error: tierError } = await supabase
      .from('ticket_tiers')
      .select('*')
      .eq('id', ticketTierId)
      .single();

    if (tierError || !ticketTier) {
      console.log('Ticket tier error:', tierError);
      return res.status(400).json({ error: 'Invalid ticket tier' });
    }

    if (ticketTier.sold_count + quantity > ticketTier.capacity) {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }

    const amount = ticketTier.price * quantity;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      metadata: {
        eventId,
        ticketTierId,
        quantity: quantity.toString(),
        ticketTierName: ticketTier.name
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}
