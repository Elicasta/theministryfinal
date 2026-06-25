function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return res.status(200).json({ ok: true, polls: [], votes: [], saved: false, reason: 'Supabase env not configured' });

  const series = clean(req.query.series_slug || 'the-ministry', 120);
  const lesson = clean(req.query.lesson_slug || 'lesson-1', 120);
  const status = clean(req.query.status || '', 80);

  const p = new URLSearchParams();
  p.set('select', 'id,poll_id,series_slug,lesson_slug,question,poll_type,options,save_anonymous,status,created_at,updated_at,archived_at');
  p.set('series_slug', `eq.${series}`);
  p.set('lesson_slug', `eq.${lesson}`);
  p.set('order', 'updated_at.desc');
  p.set('limit', '100');
  if (status) p.set('status', `eq.${status}`);

  try {
    const pollsReq = await fetch(`${SB_URL}/rest/v1/lesson_polls?${p.toString()}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    if (!pollsReq.ok) return res.status(500).json({ error: 'Poll fetch failed', details: await pollsReq.text().catch(() => '') });
    const polls = await pollsReq.json();
    const ids = polls.map(x => x.poll_id).filter(Boolean);
    let votes = [];
    if (ids.length) {
      const vp = new URLSearchParams();
      vp.set('select', 'id,poll_id,answer,anonymous,display_name,client_vote_id,created_at');
      vp.set('poll_id', `in.(${ids.map(x => `"${String(x).replace(/"/g,'\\"')}"`).join(',')})`);
      vp.set('limit', '2000');
      const votesReq = await fetch(`${SB_URL}/rest/v1/lesson_poll_votes?${vp.toString()}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      if (votesReq.ok) votes = await votesReq.json();
    }
    return res.status(200).json({ ok: true, polls, votes });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
