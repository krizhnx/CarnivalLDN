module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, name, phone, source } = req.body || {}

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    const { createClient } = require('@supabase/supabase-js')

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Upsert to avoid duplicates
    const insertRes = await supabase
      .from('waitlist_halloween')
      .insert({
        email: String(email).toLowerCase().trim(),
        name: (name ? String(name) : '').trim() || null,
        phone: phone ? String(phone).trim() : null,
        source: source ? String(source) : null
      })

    if (insertRes.error) {
      // If duplicate key (unique email), treat as already registered; don't modify existing row
      // Postgres error code 23505 = unique_violation
      if ((insertRes.error as any)?.code === '23505') {
        return res.status(200).json({ success: true, alreadyRegistered: true })
      }
      return res.status(500).json({ error: 'Failed to save' })
    }

    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: e && e.message ? e.message : 'Internal error' })
  }
}


