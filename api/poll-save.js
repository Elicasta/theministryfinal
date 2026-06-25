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
  const poll = body.poll || body;
  const pollId = clean(poll.id || poll.poll_id || `poll_${Date.now()}`, 160);
  const question = clean(poll.question, 3000);
  if (!question) return res.status(400).json({ error: 'Poll question required' });

  const status = clean(body.status || poll.status || 'live', 80);
  const payload = {
    poll_id: pollId,
    series_slug: clean(body.series_slug || poll.series_slug || 'the-ministry', 120),
    lesson_slug: clean(body.lesson_slug || poll.lesson_slug || 'lesson-1', 120),
    question,
    poll_type: clean(poll.type || poll.poll_type || 'choice', 80),
    options: Array.isArray(poll.options) ? poll.options.map(x => clean(x, 500)).filter(Boolean) : [],
    save_anonymous: poll.save_anonymous !== false,
    status,
    archived_at: ['archived','killed','closed','replaced'].includes(status) ? new Date().toISOString() : (poll.archived_at || null),
    updated_at: new Date().toISOString()
  };

  try {
    // Do not rely on on_conflict. Some existing projects were created before poll_id was unique.
    // First check if this poll already exists, then PATCH or POST.
    const q = new URLSearchParams();
    q.set('select', 'id,poll_id');
    q.set('poll_id', `eq.${pollId}`);
    q.set('limit', '1');
    const existing = await supaFetch(SB_URL, SB_KEY, `lesson_polls?${q.toString()}`);
    if (!existing.ok) return res.status(500).json({ error: 'Poll lookup failed', details: existing.text });

    const rows = Array.isArray(existing.json) ? existing.json : [];
    let write;
    if (rows.length) {
      const p = new URLSearchParams();
      p.set('id', `eq.${rows[0].id}`);
      write = await supaFetch(SB_URL, SB_KEY, `lesson_polls?${p.toString()}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      });
    } else {
      write = await supaFetch(SB_URL, SB_KEY, 'lesson_polls', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      });
    }

    if (!write.ok) return res.status(500).json({ error: 'Poll save failed', details: write.text, payload_keys: Object.keys(payload) });
    return res.status(200).json({ ok: true, saved: true, poll_id: pollId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
