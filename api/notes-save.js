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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const notes = clean(body.notes, 20000);
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SB_URL || !SB_KEY) {
    return res.status(200).json({ ok: true, saved: false, reason: 'Supabase env not configured' });
  }

  const email = normalizeEmail(body.email);
  const payload = {
    series_slug: clean(body.series_slug || 'the-ministry', 120),
    lesson_slug: clean(body.lesson_slug || 'lesson-4', 120),
    slide_index: Number.isFinite(Number(body.slide_index)) ? Number(body.slide_index) : 0,
    slide_title: clean(body.slide_title || '', 500),
    notes,
    name: clean(body.name || 'Anonymous', 160),
    attendee_id: clean(body.attendee_id || '', 80) || null,
    session_id: clean(body.session_id || '', 160) || null,
    email_hash: clean(body.email_hash || '', 160) || hashEmail(email),
    updated_at: new Date().toISOString()
  };

  try {
    const r = await fetch(`${SB_URL}/rest/v1/audience_notes`, {
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
      return res.status(500).json({ error: 'Note save failed', details });
    }

    return res.status(200).json({ ok: true, saved: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
