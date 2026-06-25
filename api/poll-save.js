function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return res.status(200).json({ ok: true, saved: false, reason: 'Supabase env not configured' });

  const body = req.body || {};
  const poll = body.poll || body;
  const pollId = clean(poll.id || poll.poll_id || `poll_${Date.now()}`, 160);
  const question = clean(poll.question, 3000);
  if (!question) return res.status(400).json({ error: 'Poll question required' });

  const payload = {
    poll_id: pollId,
    series_slug: clean(body.series_slug || poll.series_slug || 'the-ministry', 120),
    lesson_slug: clean(body.lesson_slug || poll.lesson_slug || 'lesson-1', 120),
    question,
    poll_type: clean(poll.type || poll.poll_type || 'choice', 80),
    options: Array.isArray(poll.options) ? poll.options.map(x => clean(x, 500)).filter(Boolean) : [],
    save_anonymous: poll.save_anonymous !== false,
    status: clean(body.status || poll.status || 'live', 80),
    archived_at: ['archived','killed','closed','replaced'].includes(clean(body.status || poll.status || '', 80)) ? new Date().toISOString() : (poll.archived_at || null)
  };

  try {
    const r = await fetch(`${SB_URL}/rest/v1/lesson_polls?on_conflict=poll_id`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return res.status(500).json({ error: 'Poll save failed', details: await r.text().catch(() => '') });
    return res.status(200).json({ ok: true, saved: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
