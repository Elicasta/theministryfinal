function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SB_URL || !SB_KEY) return res.status(200).json({ ok: true, saved: false, reason: 'Supabase env not configured' });

  const body = req.body || {};
  const id = clean(body.id || body.question_id, 140);
  const status = clean(body.status || 'answered', 80);
  if (!id) return res.status(400).json({ error: 'Question id required' });

  const payload = { status, updated_at: new Date().toISOString() };
  const col = id.startsWith('q') ? 'question_id' : 'id';
  const params = new URLSearchParams();
  params.set(col, `eq.${id}`);

  try {
    const r = await fetch(`${SB_URL}/rest/v1/lesson_questions?${params.toString()}`, {
      method: 'PATCH',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return res.status(500).json({ error: 'Question update failed', details: await r.text().catch(() => '') });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
