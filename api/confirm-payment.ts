const Stripe = require('stripe');

module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, customerInfo } = req.body;

    if (!paymentIntentId || !customerInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return res.status(500).json({ error: 'Stripe configuration error' });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Get Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract metadata from payment intent
    const { eventId, ticketTierId, quantity } = paymentIntent.metadata;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        event_id: eventId,
        stripe_payment_intent_id: paymentIntentId,
        status: 'completed',
        total_amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customer_email: customerInfo.email,
        customer_name: customerInfo.name
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Create order ticket
    const { error: ticketError } = await supabase
      .from('order_tickets')
      .insert({
        order_id: order.id,
        ticket_tier_id: ticketTierId,
        quantity: parseInt(quantity),
        unit_price: paymentIntent.amount / parseInt(quantity),
        total_price: paymentIntent.amount
      });

    if (ticketError) {
      console.error('Error creating order ticket:', ticketError);
      return res.status(500).json({ error: 'Failed to create order ticket' });
    }

    // Update ticket tier sold count
    const { error: updateError } = await supabase
      .from('ticket_tiers')
      .update({ sold_count: supabase.rpc('increment_sold_count', { tier_id: ticketTierId, increment: parseInt(quantity) }) })
      .eq('id', ticketTierId);

    if (updateError) {
      console.error('Error updating ticket tier:', updateError);
      // Don't fail the whole request if this fails
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      message: 'Payment confirmed and order created successfully'
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
}
