// Server-authoritative wall clock for synchronizing independent presenter and confidence devices.
// No session data or credentials are returned. Works without a Supabase connection.
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({ now: Date.now() });
}
