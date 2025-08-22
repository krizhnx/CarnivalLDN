const { sendGuestlistEmail } = require('../src/lib/emailService.js');

module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { guestlistId } = req.body;

    if (!guestlistId) {
      return res.status(400).json({ error: 'guestlistId is required' });
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

    // Fetch guestlist details
    const { data: guestlist, error: guestlistError } = await supabase
      .from('guestlists')
      .select('*')
      .eq('id', guestlistId)
      .single();

    if (guestlistError || !guestlist) {
      return res.status(404).json({ error: 'Guestlist not found' });
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, date, venue')
      .eq('id', guestlist.event_id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Send email with QR code
    try {
      await sendGuestlistEmail({
        guestlistId: guestlist.id,
        eventId: guestlist.event_id,
        eventName: event.title,
        eventDate: event.date,
        eventLocation: event.venue,
        leadName: guestlist.lead_name,
        leadEmail: guestlist.lead_email,
        totalTickets: guestlist.total_tickets,
        notes: guestlist.notes
      });
    } catch (emailError) {
      console.error('Error sending guestlist email:', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.status(200).json({
      success: true,
      message: 'QR code resent successfully'
    });

  } catch (error) {
    console.error('Error resending guestlist QR:', error);
    res.status(500).json({ error: 'Failed to resend QR code' });
  }
};
