const Stripe = require('stripe');
const { sendTicketConfirmationEmail: sendEmail } = require('../src/lib/emailService.js');

// Type definitions for the ticket metadata structure
interface TicketMetadata {
  tierId: string;
  quantity: number;
}

interface CustomerInfo {
  email: string;
  name: string;
}

interface TicketTier {
  id: string;
  name: string;
  price: number;
}

interface Event {
  title: string;
  date: string;
  venue: string;
}

module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, customerInfo }: { paymentIntentId: string; customerInfo: CustomerInfo } = req.body;

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
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing. SUPABASE_URL:', !!process.env.SUPABASE_URL, 'SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract metadata from payment intent
    const { eventId, tickets: ticketsMetadata } = paymentIntent.metadata;
    const tickets: TicketMetadata[] = JSON.parse(ticketsMetadata);

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

    // Create order tickets for each ticket tier
    for (const ticket of tickets) {
      const { error: ticketError } = await supabase
        .from('order_tickets')
        .insert({
          order_id: order.id,
          ticket_tier_id: ticket.tierId,
          quantity: parseInt(ticket.quantity.toString()),
          unit_price: paymentIntent.amount / tickets.reduce((sum: number, t: TicketMetadata) => sum + parseInt(t.quantity.toString()), 0),
          total_price: (paymentIntent.amount / tickets.reduce((sum: number, t: TicketMetadata) => sum + parseInt(t.quantity.toString()), 0)) * parseInt(ticket.quantity.toString())
        });

      if (ticketError) {
        console.error('Error creating order ticket:', ticketError);
        return res.status(500).json({ error: 'Failed to create order ticket' });
      }

      // Update ticket tier sold count
      const { error: updateError } = await supabase
        .rpc('increment_sold_count', { 
          tier_id: ticket.tierId, 
          quantity: parseInt(ticket.quantity.toString()) 
        });

      if (updateError) {
        console.error('Error updating ticket tier sold count:', updateError);
        // Don't fail the whole request if this fails
      }
    }

    // Get event details for email
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, date, venue')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event details:', eventError);
      // Don't fail the whole request if this fails
    }

    // Get ticket tier details for email
    const ticketTierIds = tickets.map((t: TicketMetadata) => t.tierId);
    const { data: ticketTiers, error: tiersError } = await supabase
      .from('ticket_tiers')
      .select('id, name, price')
      .in('id', ticketTierIds);

    if (tiersError) {
      console.error('Error fetching ticket tier details:', tiersError);
      // Don't fail the whole request if this fails
    }

    // Send confirmation email
    try {
      if (event && ticketTiers) {
        const emailData = {
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          orderId: order.id,
          eventName: event.title,
          eventDate: event.date,
          eventLocation: event.venue,
          tickets: tickets.map((ticket: TicketMetadata) => {
            const tier: TicketTier | undefined = ticketTiers.find((tt: TicketTier) => tt.id === ticket.tierId);
            return {
              tierName: tier?.name || 'Unknown Tier',
              quantity: parseInt(ticket.quantity.toString()),
              unitPrice: tier?.price || 0,
              totalPrice: (tier?.price || 0) * parseInt(ticket.quantity.toString())
            };
          }),
          totalAmount: paymentIntent.amount,
          currency: paymentIntent.currency
        };

        await sendEmail(emailData);
        console.log('Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the whole request if email fails
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
