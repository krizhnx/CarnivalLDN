const { sendGuestlistEmail } = require('../src/lib/emailService.js');

module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, leadName, leadEmail, leadPhone, totalTickets, notes } = req.body;

    if (!eventId || !leadName || !leadEmail || !totalTickets || totalTickets < 1) {
      return res.status(400).json({ 
        error: 'Missing required fields: eventId, leadName, leadEmail, totalTickets' 
      });
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

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, date, venue')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(400).json({ error: 'Event not found' });
    }

    // Generate unique guestlist ID
    const guestlistId = `guestlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        created_by: 'admin' // You can get this from auth context
      })
      .select()
      .single();

    if (guestlistError) {
      console.error('Error creating guestlist:', guestlistError);
      return res.status(500).json({ error: 'Failed to create guestlist' });
    }

    // Send email with QR code
    try {
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
};
