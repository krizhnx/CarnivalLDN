module.exports = async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Guestlist ID is required' });
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

    // Delete guestlist (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('guestlists')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting guestlist:', deleteError);
      return res.status(500).json({ error: 'Failed to delete guestlist' });
    }

    res.status(200).json({
      success: true,
      message: 'Guestlist deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting guestlist:', error);
    res.status(500).json({ error: 'Failed to delete guestlist' });
  }
};
