import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51OyBk9IgkIAGwv6wlVQzyWVfwJGw73Jdf0i4k3VrT4DBWi8EUpyJpZqGkLhrGqKf18E5XlpVo9UOuwQVUFJ6Lfie00lQ80w5Fa', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, eventId, tickets, customerInfo, totalAmount } = req.body;

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        event_id: eventId,
        user_id: customerInfo.email, // Using email as user identifier for now
        stripe_payment_intent_id: paymentIntentId,
        status: 'completed',
        total_amount: totalAmount,
        currency: 'gbp',
        customer_email: customerInfo.email,
        customer_name: customerInfo.name,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Create order tickets
    const orderTickets = tickets.map((ticket: any) => ({
      order_id: order.id,
      ticket_tier_id: ticket.tierId,
      quantity: ticket.quantity,
      unit_price: ticket.tier.price,
      total_price: ticket.tier.price * ticket.quantity,
    }));

    const { error: ticketsError } = await supabase
      .from('order_tickets')
      .insert(orderTickets);

    if (ticketsError) {
      console.error('Error creating order tickets:', ticketsError);
      return res.status(500).json({ error: 'Failed to create order tickets' });
    }

    // Update ticket tier sold counts
    for (const ticket of tickets) {
      const { error: updateError } = await supabase
        .from('ticket_tiers')
        .update({ 
          sold_count: supabase.rpc('increment', { 
            row_id: ticket.tierId, 
            x: ticket.quantity 
          })
        })
        .eq('id', ticket.tierId);

      if (updateError) {
        console.error('Error updating ticket tier:', updateError);
      }
    }

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        eventId,
        status: 'completed',
        totalAmount,
        currency: 'gbp',
        tickets: orderTickets,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
}
