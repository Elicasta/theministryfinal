import crypto from 'node:crypto';

function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function normalizeEmail(email) {
  return clean(email, 320).toLowerCase();
}
function hashEmail(email) {
  const e = normalizeEmail(email);
  return e ? crypto.createHash('sha256').update(e).digest('hex') : null;
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

  const email = normalizeEmail(vote.email || body.email);
  const voteEmailHash = clean(vote.email_hash || body.email_hash || '', 160) || hashEmail(email);
  const sessionId = clean(vote.session_id || body.session_id || '', 160);
  const attendeeId = clean(vote.attendee_id || body.attendee_id || '', 80);
  const clientVoteId = clean(vote.id || vote.client_vote_id || `${pollId}_${sessionId || Date.now()}_${Math.random().toString(16).slice(2)}`, 180);

  const payload = {
    poll_id: pollId,
    answer,
    anonymous: vote.anonymous !== false,
    display_name: vote.anonymous === false ? clean(vote.name || vote.display_name || 'Anonymous', 160) : null,
    client_vote_id: clientVoteId,
    attendee_id: attendeeId || null,
    session_id: sessionId || null,
    email_hash: voteEmailHash || null
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

    // Prefer duplicate prevention by session_id. Fall back to email_hash. Fall back to client_vote_id.
    let existingVote = null;
    if (sessionId) {
      const vq = new URLSearchParams();
      vq.set('select', 'id');
      vq.set('poll_id', `eq.${pollId}`);
      vq.set('session_id', `eq.${sessionId}`);
      vq.set('limit', '1');
      existingVote = await supaFetch(SB_URL, SB_KEY, `lesson_poll_votes?${vq.toString()}`);
    }
    if ((!existingVote || !existingVote.ok || !Array.isArray(existingVote.json) || !existingVote.json.length) && voteEmailHash) {
      const vq = new URLSearchParams();
      vq.set('select', 'id');
      vq.set('poll_id', `eq.${pollId}`);
      vq.set('email_hash', `eq.${voteEmailHash}`);
      vq.set('limit', '1');
      existingVote = await supaFetch(SB_URL, SB_KEY, `lesson_poll_votes?${vq.toString()}`);
    }
    if ((!existingVote || !existingVote.ok || !Array.isArray(existingVote.json) || !existingVote.json.length) && clientVoteId) {
      const vq = new URLSearchParams();
      vq.set('select', 'id');
      vq.set('client_vote_id', `eq.${clientVoteId}`);
      vq.set('limit', '1');
      existingVote = await supaFetch(SB_URL, SB_KEY, `lesson_poll_votes?${vq.toString()}`);
    }

    if (existingVote && existingVote.ok && Array.isArray(existingVote.json) && existingVote.json.length) {
      // Update the answer instead of inserting another vote.
      const p = new URLSearchParams();
      p.set('id', `eq.${existingVote.json[0].id}`);
      const write = await supaFetch(SB_URL, SB_KEY, `lesson_poll_votes?${p.toString()}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      });
      if (!write.ok) return res.status(500).json({ error: 'Poll vote update failed', details: write.text, payload_keys: Object.keys(payload) });
      return res.status(200).json({ ok: true, saved: true, updated: true });
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
