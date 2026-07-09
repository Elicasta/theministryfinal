export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return res.status(200).json({ ok: true, notes: [], reason: 'Supabase env not configured' });

  const clean = (v, max = 160) => String(v || '').replace(/[^a-zA-Z0-9_:\-@.]/g, '').slice(0, max);
  const series = clean(req.query.series_slug || 'the-ministry', 120);
  const lesson = clean(req.query.lesson_slug || 'lesson-4', 120);
  const attendeeId = clean(req.query.attendee_id || '', 80);
  const sessionId = clean(req.query.session_id || '', 160);
  const emailHash = clean(req.query.email_hash || '', 160);

  const filters = [];
  if (attendeeId) filters.push(`attendee_id.eq.${attendeeId}`);
  if (sessionId) filters.push(`session_id.eq.${sessionId}`);
  if (emailHash) filters.push(`email_hash.eq.${emailHash}`);

  const params = new URLSearchParams();
  params.set('select', 'lesson_slug,slide_index,slide_title,notes,updated_at');
  params.set('series_slug', `eq.${series}`);
  params.set('lesson_slug', `eq.${lesson}`);
  if (filters.length) params.set('or', `(${filters.join(',')})`);
  params.set('order', 'updated_at.desc');
  params.set('limit', '1');

  try {
    const r = await fetch(`${SB_URL}/rest/v1/audience_notes?${params.toString()}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    if (!r.ok) return res.status(500).json({ error: 'Note fetch failed', details: await r.text().catch(() => '') });
    return res.status(200).json({ ok: true, notes: await r.json() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
