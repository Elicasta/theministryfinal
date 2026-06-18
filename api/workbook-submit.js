export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, name, session, answers, send_admin_copy } = req.body || {};
  if (!email && !send_admin_copy) return res.status(400).json({ error: 'Missing email' });

  const KEY          = process.env.RESEND_API_KEY;
  const FROM         = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const ADMIN_EMAIL  = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
  const SB_URL       = process.env.SUPABASE_URL;
  const SB_KEY       = process.env.SUPABASE_ANON_KEY;

  // Save answers to Supabase
  if (answers && SB_URL && SB_KEY && !send_admin_copy) {
    for (const a of answers) {
      try {
        await fetch(`${SB_URL}/rest/v1/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            name: a.anonymous ? 'Anonymous' : (name || 'Attendee'),
            email: a.anonymous ? null : email,
            session: typeof session === 'number' ? session : 1,
            category: a.category,
            response: a.text,
            anonymous: a.anonymous || false
          })
        });
      } catch(e) {}
    }
  }

  if (!KEY) return res.status(200).json({ ok: true });

  const answersHtml = (answers || []).map(a => `
<div style="background:#111;border:1px solid #1E1E1E;padding:14px 18px;margin-bottom:3px">
  <div style="font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#E8180D;margin-bottom:5px">${a.category || ''}</div>
  <div style="font-size:13px;color:#F1EDE4;line-height:1.6">${(a.text||'').replace(/\n/g,'<br>')}</div>
</div>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0A0A0A;color:#F1EDE4;font-family:'Helvetica Neue',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="font-family:Impact,sans-serif;font-size:56px;line-height:0.88;text-transform:uppercase;margin-bottom:8px">
    <span style="color:#F1EDE4;display:block">THE</span>
    <span style="color:#E8180D;display:block">MINISTRY</span>
  </div>
  <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#666;margin-bottom:24px">
    Lesson ${session || 1} Reflection &middot; Matthew 10
  </div>
  ${answersHtml}
  <div style="border-left:2px solid #E8180D;padding-left:14px;font-style:italic;font-size:12px;color:#666;margin-top:28px">
    Ministry does not begin with a platform. It begins with a call.
  </div>
  <div style="font-size:11px;color:#333;text-align:center;margin-top:28px">
    The Ministry &middot; Matthew 10 &middot; Elder Eli Castaneda
  </div>
</div></body></html>`;

  const toEmail   = send_admin_copy ? ADMIN_EMAIL : email;
  const subject   = send_admin_copy
    ? `[Ministry Response] ${name} submitted their reflection`
    : `Your Lesson ${session || 1} reflection — The Ministry`;

  if (!toEmail) return res.status(200).json({ ok: true });

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({ from: `The Ministry <${FROM}>`, to: toEmail, subject, html })
    });
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
