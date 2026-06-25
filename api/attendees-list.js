export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return res.status(200).json({ ok: true, attendees: [], reason: 'Supabase env not configured' });
  const series = String(req.query.series_slug || 'the-ministry').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
  const lesson = String(req.query.lesson_slug || 'lesson-1').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
  const params = new URLSearchParams();
  params.set('select', 'id,name,email,source,series_slug,lesson_slug,checked_in_at,created_at');
  params.set('series_slug', `eq.${series}`);
  params.set('lesson_slug', `eq.${lesson}`);
  params.set('order', 'created_at.desc');
  params.set('limit', '200');
  try {
    const r = await fetch(`${SB_URL}/rest/v1/attendees?${params.toString()}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    if (!r.ok) return res.status(500).json({ error: 'Attendee fetch failed', details: await r.text().catch(() => '') });
    return res.status(200).json({ ok: true, attendees: await r.json() });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
