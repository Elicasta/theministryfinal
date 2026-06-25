import crypto from 'node:crypto';

function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function normalizeEmail(email) {
  return clean(email, 320).toLowerCase();
}
function emailHash(email) {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex');
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

  const { email, name, source, series_slug, lesson_slug, session_id } = req.body || {};
  const attendeeName = clean(name || 'Anonymous', 200) || 'Anonymous';
  const attendeeEmail = normalizeEmail(email);
  if (!attendeeEmail) return res.status(400).json({ error: 'Email required' });

  const attendeeSessionId = clean(session_id || `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`, 160);
  const attendeeEmailHash = emailHash(attendeeEmail);

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  let saved = false;
  let saveError = null;
  let attendee = { session_id: attendeeSessionId, email_hash: attendeeEmailHash };

  if (SB_URL && SB_KEY) {
    try {
      const series = clean(series_slug || 'the-ministry', 120);
      const lesson = clean(lesson_slug || 'lesson-1', 120);
      const q = new URLSearchParams();
      q.set('select', 'id,email_hash,session_id');
      q.set('email_hash', `eq.${attendeeEmailHash}`);
      q.set('series_slug', `eq.${series}`);
      q.set('lesson_slug', `eq.${lesson}`);
      q.set('limit', '1');
      const existing = await supaFetch(SB_URL, SB_KEY, `attendees?${q.toString()}`);
      const payload = {
        name: attendeeName,
        email: attendeeEmail,
        email_hash: attendeeEmailHash,
        session_id: attendeeSessionId,
        source: source || 'session_access',
        series_slug: series,
        lesson_slug: lesson,
        checked_in_at: new Date().toISOString()
      };
      let write;
      if (existing.ok && Array.isArray(existing.json) && existing.json.length) {
        const id = existing.json[0].id;
        const p = new URLSearchParams();
        p.set('id', `eq.${id}`);
        write = await supaFetch(SB_URL, SB_KEY, `attendees?${p.toString()}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(payload)
        });
      } else {
        write = await supaFetch(SB_URL, SB_KEY, 'attendees', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(payload)
        });
      }
      if (!write.ok) saveError = write.text || 'Supabase attendee save failed';
      else {
        saved = true;
        const row = Array.isArray(write.json) ? write.json[0] : write.json;
        attendee = {
          id: row?.id || null,
          session_id: row?.session_id || attendeeSessionId,
          email_hash: row?.email_hash || attendeeEmailHash
        };
      }
    } catch (e) {
      saveError = e.message;
    }
  } else {
    saveError = 'Supabase env not configured';
  }

  if (!RESEND_KEY) return res.status(200).json({ ok: true, saved, saveError, attendee });

  const safeName = attendeeName.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{margin:0;padding:0;background:#0A0A0A;color:#F1EDE4;font-family:'Helvetica Neue',sans-serif}.w{max-width:560px;margin:0 auto;padding:40px 24px}.ey{font-size:10px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:#888;margin-bottom:20px;display:flex;align-items:center;gap:10px}.ey::before{content:'';width:3px;height:14px;background:#E8180D;flex-shrink:0}.t{font-family:Impact,sans-serif;font-size:64px;line-height:.9;text-transform:uppercase;margin-bottom:6px}.tw{color:#F1EDE4}.tr{color:#E8180D}.sub{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#666;margin-bottom:32px}.box{background:#111;border:1px solid #1E1E1E;padding:20px 24px;margin-bottom:24px;display:flex;gap:24px;flex-wrap:wrap}.brow{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#E8180D;margin-bottom:3px}.bval{font-size:13px;font-weight:600;color:#F1EDE4}.body{font-size:14px;line-height:1.7;color:#666;margin-bottom:24px}.body b{color:#F1EDE4}.quote{border-left:2px solid #E8180D;padding-left:14px;font-style:italic;font-size:12px;color:#666;margin:24px 0}.foot{font-size:11px;color:#333;text-align:center;margin-top:32px}</style></head><body><div class="w"><div class="ey">Called Close. Sent Far.</div><div class="t"><span class="tw">THE</span><br><span class="tr">MINISTRY</span></div><div class="sub">A Matthew Chapter 10 Series</div><div class="box"><div><div class="brow">Presenter</div><div class="bval">Elder Eli Castaneda</div></div><div><div class="brow">Series Text</div><div class="bval">Matthew 10</div></div></div><div class="body"><b>${safeName},</b><br><br>You&rsquo;re registered for <b>The Ministry</b> &mdash; a Matthew Chapter 10 series on being called, authorized, and sent.<br><br>Access opens when the session goes live.</div><div class="quote">Ministry does not begin with a platform. It begins with a call.</div><div class="foot">The Ministry &middot; A Matthew Chapter 10 Series &middot; Elder Eli Castaneda</div></div></body></html>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: `The Ministry <${FROM}>`, to: attendeeEmail, subject: "You're registered — The Ministry", html })
    });
  } catch (e) {}

  return res.status(200).json({ ok: true, saved, saveError, attendee });
}
