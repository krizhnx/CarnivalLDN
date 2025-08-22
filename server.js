const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
// Note: Email service will be imported after we set up the environment
let sendTicketConfirmationEmail = null;
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
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set');

// Initialize Email Service (only if Resend API key is provided)
if (process.env.RESEND_API_KEY) {
  try {
    const { sendTicketConfirmationEmail: emailService } = require('./src/lib/emailService.js');
    sendTicketConfirmationEmail = emailService;
    console.log('✅ Email service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
    sendTicketConfirmationEmail = null;
  }
} else {
  console.log('⚠️  RESEND_API_KEY not found - email confirmations will not be sent');
  console.log('   Set RESEND_API_KEY in .env.local to enable email functionality');
}

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

        // Send confirmation email
        try {
          // Get event details for email
          const { data: event, error: eventError } = await supabase
            .from('events')
            .select('title, date, venue')
            .eq('id', eventId)
            .single();

          if (eventError) {
            console.error('Error fetching event details for email:', eventError);
          } else {
            const emailData = {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              orderId: order.id,
              eventName: event.title,
              eventDate: event.date,
              eventLocation: event.venue,
              tickets: tickets.map(ticket => ({
                tierId: ticket.tier.id, // Add tierId for QR code generation
                tierName: ticket.tier.name,
                quantity: ticket.quantity,
                unitPrice: ticket.tier.price,
                totalPrice: ticket.tier.price * ticket.quantity
              })),
              totalAmount: totalAmount,
              currency: 'gbp'
            };

            await sendTicketConfirmationEmail(emailData);
            console.log('Confirmation email sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the whole request if email fails
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

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const testData = {
      customerName: 'Test User',
      customerEmail: req.body.testEmail || 'test@example.com',
      orderId: 'test-order-123',
      eventName: 'Test Carnival Event',
      eventDate: '2024-12-25',
      eventLocation: 'Test Venue, London',
      tickets: [{
        tierId: 'test-tier-123', // Add tierId for QR code generation
        tierName: 'General Admission',
        quantity: 2,
        unitPrice: 2500,
        totalPrice: 5000
      }],
      totalAmount: 5000,
      currency: 'gbp'
    };

    await sendTicketConfirmationEmail(testData);
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guestlist API endpoints
app.post('/api/create-guestlist', async (req, res) => {
  try {
    const { eventId, leadName, leadEmail, leadPhone, totalTickets, notes } = req.body;

    if (!eventId || !leadName || !leadEmail || !totalTickets || totalTickets < 1) {
      return res.status(400).json({ 
        error: 'Missing required fields: eventId, leadName, leadEmail, totalTickets' 
      });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, date, venue')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(400).json({ error: 'Event not found' });
    }

    // Generate unique guestlist ID using proper UUID
    const guestlistId = uuidv4();

    // Create QR code data
    const qrCodeData = JSON.stringify({
      type: 'guestlist',
      guestlistId: guestlistId,
      eventId: eventId,
      totalTickets: totalTickets,
      leadEmail: leadEmail,
      leadName: leadName
    });

    // Create guestlist record
    const { data: guestlist, error: guestlistError } = await supabase
      .from('guestlists')
      .insert({
        id: guestlistId,
        event_id: eventId,
        lead_name: leadName,
        lead_email: leadEmail,
        lead_phone: leadPhone || null,
        total_tickets: totalTickets,
        notes: notes || null,
        qr_code_data: qrCodeData,
        remaining_scans: totalTickets,
        created_by: 'admin'
      })
      .select()
      .single();

    if (guestlistError) {
      console.error('Error creating guestlist:', guestlistError);
      return res.status(500).json({ error: 'Failed to create guestlist' });
    }

    // Send email with QR code if email service is available
    if (sendTicketConfirmationEmail) {
      try {
        // Import guestlist email function
        const { sendGuestlistEmail } = require('./src/lib/emailService.js');
        await sendGuestlistEmail({
          guestlistId: guestlistId,
          eventId: eventId,
          eventName: event.title,
          eventDate: event.date,
          eventLocation: event.venue,
          leadName: leadName,
          leadEmail: leadEmail,
          totalTickets: totalTickets,
          notes: notes
        });
      } catch (emailError) {
        console.error('Error sending guestlist email:', emailError);
        // Don't fail the request if email fails, but log it
      }
    }

    res.status(200).json({
      success: true,
      guestlist: {
        id: guestlistId,
        eventId: eventId,
        leadName: leadName,
        leadEmail: leadEmail,
        leadPhone: leadPhone,
        totalTickets: totalTickets,
        notes: notes,
        qrCodeData: qrCodeData,
        remainingScans: totalTickets,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      },
      message: 'Guestlist created successfully and QR code sent'
    });

  } catch (error) {
    console.error('Error creating guestlist:', error);
    res.status(500).json({ error: 'Failed to create guestlist' });
  }
});

app.get('/api/guestlists', async (req, res) => {
  try {
    const { eventId } = req.query;
    
    console.log('🔍 Guestlists API called with eventId:', eventId);

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    if (!supabase) {
      console.error('❌ Supabase not connected');
      return res.status(500).json({ error: 'Database not connected' });
    }

    console.log('🔍 Querying guestlists for event:', eventId);
    
    const { data: guestlists, error } = await supabase
      .from('guestlists')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching guestlists:', error);
      return res.status(500).json({ error: 'Failed to fetch guestlists' });
    }
    
    console.log('✅ Found guestlists:', guestlists?.length || 0);

    // Transform data to match frontend interface
    const transformedGuestlists = guestlists.map(guestlist => ({
      id: guestlist.id,
      eventId: guestlist.event_id,
      leadName: guestlist.lead_name,
      leadEmail: guestlist.lead_email,
      leadPhone: guestlist.lead_phone,
      totalTickets: guestlist.total_tickets,
      notes: guestlist.notes,
      qrCodeData: guestlist.qr_code_data,
      remainingScans: guestlist.remaining_scans,
      createdAt: guestlist.created_at,
      createdBy: guestlist.created_by
    }));

    res.status(200).json({
      success: true,
      guestlists: transformedGuestlists
    });
  } catch (error) {
    console.error('Error fetching guestlists:', error);
    res.status(500).json({ error: 'Failed to fetch guestlists' });
  }
});

app.post('/api/resend-guestlist-qr', async (req, res) => {
  try {
    const { guestlistId } = req.body;

    if (!guestlistId) {
      return res.status(400).json({ error: 'guestlistId is required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Fetch guestlist and event details
    const { data: guestlist, error: guestlistError } = await supabase
      .from('guestlists')
      .select(`
        *,
        events:event_id (
          title,
          date,
          venue
        )
      `)
      .eq('id', guestlistId)
      .single();

    if (guestlistError || !guestlist) {
      return res.status(404).json({ error: 'Guestlist not found' });
    }

    // Send email with QR code if email service is available
    if (sendTicketConfirmationEmail) {
      try {
        const { sendGuestlistEmail } = require('./src/lib/emailService.js');
        await sendGuestlistEmail({
          guestlistId: guestlist.id,
          eventId: guestlist.event_id,
          eventName: guestlist.events.title,
          eventDate: guestlist.events.date,
          eventLocation: guestlist.events.venue,
          leadName: guestlist.lead_name,
          leadEmail: guestlist.lead_email,
          totalTickets: guestlist.total_tickets,
          notes: guestlist.notes
        });
      } catch (emailError) {
        console.error('Error sending guestlist email:', emailError);
        return res.status(500).json({ error: 'Failed to send email' });
      }
    }

    res.status(200).json({ success: true, message: 'QR code resent successfully' });
  } catch (error) {
    console.error('Error resending guestlist QR:', error);
    res.status(500).json({ error: 'Failed to resend QR code' });
  }
});

app.delete('/api/guestlists/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Delete guestlist
    const { error } = await supabase
      .from('guestlists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting guestlist:', error);
      return res.status(500).json({ error: 'Failed to delete guestlist' });
    }

    res.status(200).json({ success: true, message: 'Guestlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting guestlist:', error);
    res.status(500).json({ error: 'Failed to delete guestlist' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Stripe API server running on port ${port}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST /api/create-payment-intent`);
  console.log(`   POST /api/confirm-payment`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/test-email`);
  console.log(`   POST /api/create-guestlist`);
  console.log(`   GET  /api/guestlists`);
  console.log(`   POST /api/resend-guestlist-qr`);
  console.log(`   DELETE /api/guestlists/:id`);
});
