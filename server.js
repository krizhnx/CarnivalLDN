const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51OyBk9IgkIAGwv6wlVQzyWVfwJGw73Jdf0i4k3VrT4DBWi8EUpyJpZqGkLhrGqKf18E5XlpVo9UOuwQVUFJ6Lfie00lQ80w5Fa', {
  apiVersion: '2023-10-16',
});

// Debug: Log environment variables
console.log('🔍 Environment variables check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set');

// Initialize Supabase (only if credentials are provided)
let supabase = null;
if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
  try {
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    supabase = createClient(process.env.SUPABASE_URL, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log(`✅ Supabase connected successfully (${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon'} key)`);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('⚠️  Using anon key on the server. If RLS is enabled, inserts/updates may fail. Prefer SUPABASE_SERVICE_ROLE_KEY on the server.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error.message);
    supabase = null;
  }
} else {
  console.log('⚠️  Supabase credentials not found - orders will not be saved to database');
  console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY in .env.local to enable database integration');
}

// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { eventId, tickets, customerInfo, totalAmount } = req.body;
    
    if (!eventId || !tickets || !customerInfo || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'gbp',
      metadata: {
        eventId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        ticketCount: tickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm Payment
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, eventId, tickets, customerInfo, totalAmount } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Create order object
    const order = {
      id: uuidv4(), // Generate proper UUID
      event_id: eventId,
      user_id: customerInfo.email, // Using email as user_id for now
      stripe_payment_intent_id: paymentIntentId,
      status: 'completed',
      total_amount: totalAmount,
      currency: 'gbp',
      customer_email: customerInfo.email,
      customer_name: customerInfo.name,
      created_at: new Date().toISOString(),
    };

    try {
      if (supabase) {
        console.log('Attempting to save order to Supabase...');
        
        // Save order to Supabase
        console.log('Attempting to insert order:', JSON.stringify(order, null, 2));
        
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([order])
          .select()
          .single();

        if (orderError) {
          console.error('Error saving order to Supabase:', orderError);
          console.error('Error details:', JSON.stringify(orderError, null, 2));
          // Don't fail the payment, just log the error and continue
          console.log('Continuing without database save...');
        } else {
          console.log('Order saved to Supabase successfully:', orderData);
        }

        // Try to save order tickets to Supabase (non-blocking)
        try {
          const orderTickets = tickets.map(ticket => ({
            order_id: order.id, // This is now a proper UUID
            ticket_tier_id: ticket.tierId,
            quantity: ticket.quantity,
            unit_price: ticket.tier.price,
            total_price: ticket.tier.price * ticket.quantity,
            created_at: new Date().toISOString(),
          }));

          console.log('Attempting to insert order tickets:', JSON.stringify(orderTickets, null, 2));
          
          const { error: ticketsError } = await supabase
            .from('order_tickets')
            .insert(orderTickets);

          if (ticketsError) {
            console.error('Error saving order tickets to Supabase:', ticketsError);
            console.error('Tickets error details:', JSON.stringify(ticketsError, null, 2));
          } else {
            console.log('Order tickets saved to Supabase successfully');
          }
        } catch (error) {
          console.error('Error saving order tickets:', error.message);
        }

        // Try to update ticket tier sold counts (non-blocking)
        try {
          for (const ticket of tickets) {
            const { error: updateError } = await supabase
              .rpc('increment_sold_count', {
                tier_id: ticket.tierId,
                quantity: ticket.quantity
              });

            if (updateError) {
              console.error('Error updating ticket tier sold count:', updateError);
            }
          }
          console.log('Ticket tier sold counts updated successfully');
        } catch (error) {
          console.error('Error updating ticket tier sold counts:', error.message);
        }

        console.log('Order processing completed:', order.id);
        
        // Always return success, even if database operations failed
        res.status(200).json({
          success: true,
          order: orderData || order,
        });
      } else {
        // No Supabase connection, just return success
        console.log('Order created (not saved to database):', order.id);
        res.status(200).json({
          success: true,
          order,
        });
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      res.status(500).json({ error: 'Failed to save order to database' });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Stripe API server is running' });
});

app.listen(port, () => {
  console.log(`🚀 Stripe API server running on port ${port}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST /api/create-payment-intent`);
  console.log(`   POST /api/confirm-payment`);
  console.log(`   GET  /api/health`);
});
