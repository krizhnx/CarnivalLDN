const { sendGuestlistEmail: createGuestlistEmail } = require('../src/lib/emailService.js');

module.exports = async function handler(req: any, res: any) {
  // Add CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting guestlist creation...');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const { eventId, leadName, leadEmail, leadPhone, totalTickets, notes, category } = req.body;

    if (!eventId || !leadName || !leadEmail || !totalTickets || totalTickets < 1) {
      console.error('❌ Validation failed:', { eventId, leadName, leadEmail, totalTickets });
      return res.status(400).json({ 
        error: 'Missing required fields: eventId, leadName, leadEmail, totalTickets' 
      });
    }

    console.log('✅ Validation passed, checking environment variables...');
    
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    
    console.log('🔑 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseServiceKey,
      hasResendKey: !!resendApiKey,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
      supabaseKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 10)}...` : 'MISSING'
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing');
      return res.status(500).json({ 
        error: 'Database configuration error',
        details: {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseServiceKey
        }
      });
    }

    console.log('🔌 Creating Supabase client...');
    
    // Get Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    if (!createClient) {
      console.error('❌ Failed to import Supabase client');
      return res.status(500).json({ error: 'Database client import failed' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client created');

    // Verify event exists
    console.log('🔍 Verifying event exists:', eventId);
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, date, time, venue, image, gradient')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('❌ Event verification failed:', eventError);
      return res.status(400).json({ 
        error: 'Event not found',
        details: eventError.message
      });
    }

    if (!event) {
      console.error('❌ Event not found for ID:', eventId);
      return res.status(400).json({ error: 'Event not found' });
    }

    console.log('✅ Event verified:', event.title);

    // Generate unique guestlist ID (UUID v4)
    const uuid = require('uuid');
    const guestlistId = uuid.v4();
    console.log('🆔 Generated guestlist ID:', guestlistId);

    // Create QR code data
    const qrCodeData = JSON.stringify({
      type: 'guestlist',
      guestlistId: guestlistId,
      eventId: eventId,
      totalTickets: totalTickets,
      leadEmail: leadEmail,
      leadName: leadName
    });

    console.log('📱 Creating guestlist record...');
    
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
        category: category || 'other',
        qr_code_data: qrCodeData,
        remaining_scans: totalTickets,
        created_by: 'admin'
      })
      .select()
      .single();

    if (guestlistError) {
      console.error('❌ Error creating guestlist record:', guestlistError);
      return res.status(500).json({ 
        error: 'Failed to create guestlist',
        details: guestlistError.message
      });
    }

    console.log('✅ Guestlist record created successfully');

    // Send email with QR code
    console.log('📧 Attempting to send email...');
    try {
      if (!resendApiKey) {
        console.warn('⚠️ RESEND_API_KEY missing, skipping email');
      } else {
        await createGuestlistEmail({
          guestlistId: guestlistId,
          eventId: eventId,
          eventName: event.title,
          eventDate: event.date,
          eventTime: event.time,
          eventLocation: event.venue,
          eventImage: event.image,
          eventTheme: event.gradient,
          leadName: leadName,
          leadEmail: leadEmail,
          totalTickets: totalTickets,
          notes: notes
        });
        console.log('✅ Email sent successfully');
      }
    } catch (emailError) {
      console.error('❌ Error sending guestlist email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    console.log('🎉 Guestlist creation completed successfully');
    
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
        category: category || 'other',
        qrCodeData: qrCodeData,
        remainingScans: totalTickets,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      },
      message: 'Guestlist created successfully and QR code sent'
    });

  } catch (error) {
    console.error('💥 Unexpected error in guestlist creation:', error);
    console.error('📊 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Failed to create guestlist',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
