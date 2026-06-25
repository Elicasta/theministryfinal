function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const text = clean(body.text || body.question, 3000);
  if (!text) return res.status(400).json({ error: 'Question required' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SB_URL || !SB_KEY) {
    return res.status(200).json({ ok: true, saved: false, reason: 'Supabase env not configured' });
  }

  const payload = {
    question_id: clean(body.id || body.question_id || `q_${Date.now()}`, 120),
    series_slug: clean(body.series_slug || 'the-ministry', 120),
    lesson_slug: clean(body.lesson_slug || 'lesson-1', 120),
    name: clean(body.name || 'Anonymous', 160),
    text,
    anonymous: body.anonymous !== false,
    status: 'new'
  };

  try {
    const r = await fetch(`${SB_URL}/rest/v1/lesson_questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const details = await r.text().catch(() => '');
      return res.status(500).json({ error: 'Question save failed', details });
    }

    return res.status(200).json({ ok: true, saved: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
