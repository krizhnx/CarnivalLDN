module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
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

    // Fetch guestlists for the event
    const { data: guestlists, error: guestlistsError } = await supabase
      .from('guestlists')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (guestlistsError) {
      console.error('Error fetching guestlists:', guestlistsError);
      return res.status(500).json({ error: 'Failed to fetch guestlists' });
    }

    // Transform data to match frontend interface
    const transformedGuestlists = (guestlists || []).map(guestlist => ({
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
};
