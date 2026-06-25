function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function supaFetch(SB_URL, SB_KEY, path, opts = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  const text = await r.text().catch(() => '');
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch(e) {}
  return { ok: r.ok, status: r.status, text, json };
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

  const clientVoteId = clean(vote.id || vote.client_vote_id || `vote_${Date.now()}_${Math.random().toString(16).slice(2)}`, 160);
  const payload = {
    poll_id: pollId,
    answer,
    anonymous: vote.anonymous !== false,
    display_name: vote.anonymous === false ? clean(vote.name || vote.display_name || 'Anonymous', 160) : null,
    client_vote_id: clientVoteId
  };

  try {
    // Make sure the poll row exists before inserting a vote, even if the launch save failed.
    const q = new URLSearchParams();
    q.set('select', 'id,poll_id');
    q.set('poll_id', `eq.${pollId}`);
    q.set('limit', '1');
    const existingPoll = await supaFetch(SB_URL, SB_KEY, `lesson_polls?${q.toString()}`);
    if (existingPoll.ok && Array.isArray(existingPoll.json) && !existingPoll.json.length) {
      await supaFetch(SB_URL, SB_KEY, 'lesson_polls', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          poll_id: pollId,
          series_slug: clean(body.series_slug || 'the-ministry', 120),
          lesson_slug: clean(body.lesson_slug || 'lesson-1', 120),
          question: clean(vote.question || 'Live poll', 3000),
          poll_type: 'choice',
          options: [],
          save_anonymous: true,
          status: 'live'
        })
      });
    }

    // Avoid duplicate client votes without requiring a unique constraint.
    const vq = new URLSearchParams();
    vq.set('select', 'id,client_vote_id');
    vq.set('client_vote_id', `eq.${clientVoteId}`);
    vq.set('limit', '1');
    const existingVote = await supaFetch(SB_URL, SB_KEY, `lesson_poll_votes?${vq.toString()}`);
    if (existingVote.ok && Array.isArray(existingVote.json) && existingVote.json.length) {
      return res.status(200).json({ ok: true, saved: false, duplicate: true });
    }

    const write = await supaFetch(SB_URL, SB_KEY, 'lesson_poll_votes', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
    if (!write.ok) return res.status(500).json({ error: 'Poll vote save failed', details: write.text, payload_keys: Object.keys(payload) });
    return res.status(200).json({ ok: true, saved: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
