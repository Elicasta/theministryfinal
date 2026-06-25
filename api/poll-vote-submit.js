function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return res.status(200).json({ ok: true, saved: false, reason: 'Supabase env not configured' });

  const body = req.body || {};
  const vote = body.vote || body;
  const pollId = clean(vote.pollId || vote.poll_id, 160);
  const answer = clean(vote.answer, 1000);
  if (!pollId || !answer) return res.status(400).json({ error: 'Poll id and answer required' });

  const payload = {
    poll_id: pollId,
    answer,
    anonymous: vote.anonymous !== false,
    display_name: vote.anonymous === false ? clean(vote.name || vote.display_name || 'Anonymous', 160) : null,
    client_vote_id: clean(vote.id || vote.client_vote_id || `vote_${Date.now()}`, 160)
  };

  try {
    const r = await fetch(`${SB_URL}/rest/v1/lesson_poll_votes?on_conflict=client_vote_id`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return res.status(500).json({ error: 'Poll vote save failed', details: await r.text().catch(() => '') });
    return res.status(200).json({ ok: true, saved: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
