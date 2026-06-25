export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  res.status(200).json({
    ok: true,
    supabaseUrl,
    supabaseAnonKey,
    realtimeConfigured: Boolean(supabaseUrl && supabaseAnonKey)
  });
}
