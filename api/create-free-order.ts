const { sendTicketConfirmationEmail: sendEmail } = require('../src/lib/emailService.js');

module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, tickets, customerInfo, totalAmount } = req.body;

    if (!eventId || !tickets || !customerInfo || totalAmount !== 0) {
      return res.status(400).json({ 
        error: 'Invalid request: This endpoint is only for free events (totalAmount must be 0)',
        received: { eventId, tickets, customerInfo, totalAmount }
      });
    }
    
    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.dateOfBirth) {
      return res.status(400).json({ 
        error: 'Missing required customer information',
        missing: {
          name: !customerInfo.name,
          email: !customerInfo.email,
          phone: !customerInfo.phone,
          dateOfBirth: !customerInfo.dateOfBirth
        }
      });
    }
    
    // Age validation - must be 18 or older
    if (customerInfo.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(customerInfo.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        return res.status(400).json({ 
          error: 'You must be 18 years or older to get tickets',
          age: age
        });
      }
    }

    // Validate tickets array
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ error: 'Invalid tickets array' });
    }

    // Get Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
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

    // Create order with no payment intent (free event)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        event_id: eventId,
        stripe_payment_intent_id: null, // No payment for free events
        status: 'completed',
        total_amount: 0, // Free event
        currency: 'gbp',
        customer_email: customerInfo.email,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_date_of_birth: customerInfo.dateOfBirth,
        customer_gender: customerInfo.gender
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
          unit_price: 0, // Free tickets
          total_price: 0 // Free tickets
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
    const ticketTierIds = tickets.map((t: any) => t.tierId);
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
          customerPhone: customerInfo.phone,
          customerDateOfBirth: customerInfo.dateOfBirth,
          customerGender: customerInfo.gender,
          orderId: order.id,
          eventName: event.title,
          eventDate: event.date,
          eventLocation: event.venue,
          tickets: tickets.map((ticket: any) => {
            const tier = ticketTiers.find((tt: any) => tt.id === ticket.tierId);
            return {
              tierId: ticket.tierId,
              tierName: tier?.name || 'Unknown Tier',
              quantity: parseInt(ticket.quantity.toString()),
              unitPrice: 0, // Free tickets
              totalPrice: 0 // Free tickets
            };
          }),
          totalAmount: 0,
          currency: 'gbp'
        };

        await sendEmail(emailData);
        console.log('Confirmation email sent successfully for free event');
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the whole request if email fails
    }

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        eventId: eventId,
        status: 'completed',
        totalAmount: 0,
        currency: 'gbp',
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerDateOfBirth: customerInfo.dateOfBirth,
        customerGender: customerInfo.gender,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      },
      message: 'Free event order created successfully'
    });
  } catch (error) {
    console.error('Error creating free order:', error);
    res.status(500).json({ error: 'Failed to create free order' });
  }
}
