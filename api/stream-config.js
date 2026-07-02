function clean(value, max = 2000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function normalizeStatus(value) {
  const v = clean(value, 80).toLowerCase();
  return ['offline', 'starting-soon', 'live', 'ended'].includes(v) ? v : 'starting-soon';
}
function normalizeProvider(value, embedUrl) {
  const v = clean(value, 80).toLowerCase();
  if (v) return v;
  return String(embedUrl || '').includes('youtube') ? 'youtube' : 'custom';
}
function normalizeSlug(value, fallback, max = 120) {
  const v = clean(value, max).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return v || fallback;
}
function lessonConfigId(seriesSlug, lessonSlug) {
  return `${normalizeSlug(seriesSlug, 'the-ministry')}::${normalizeSlug(lessonSlug, 'lesson-1')}`;
}
function getParam(req, name, fallback = '') {
  if (req.query && req.query[name] !== undefined) {
    const raw = Array.isArray(req.query[name]) ? req.query[name][0] : req.query[name];
    return raw || fallback;
  }
  try {
    const url = new URL(req.url || '/', 'https://local.test');
    return url.searchParams.get(name) || fallback;
  } catch (e) {
    return fallback;
  }
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
function defaultConfig(overrides = {}) {
  return {
    id: 'default',
    scope: 'global',
    series_slug: 'the-ministry',
    lesson_slug: 'lesson-1',
    status: 'starting-soon',
    provider: 'youtube',
    embed_url: '',
    title: 'The Ministry Live',
    service_label: 'Sunday Service · Online Portal',
    sync_delay_seconds: 10,
    updated_at: null,
    ...overrides
  };
}
function rowToConfig(row, source = 'database') {
  if (!row) return null;
  return {
    ...defaultConfig(),
    ...row,
    source,
    scope: row.id === 'default' ? 'global' : 'lesson'
  };
}
async function readRow(SB_URL, SB_KEY, id) {
  const q = new URLSearchParams();
  q.set('select', '*');
  q.set('id', `eq.${id}`);
  q.set('limit', '1');
  const out = await supaFetch(SB_URL, SB_KEY, `live_stream_config?${q.toString()}`);
  if (!out.ok) return { ok: false, warning: out.text, row: null };
  const rows = Array.isArray(out.json) ? out.json : [];
  return { ok: true, row: rows[0] || null };
}
async function upsertRow(SB_URL, SB_KEY, payload) {
  return supaFetch(SB_URL, SB_KEY, 'live_stream_config', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload)
  });
}

export default async function handler(req, res) {
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  const requestedSeries = normalizeSlug(getParam(req, 'series_slug', getParam(req, 'series', 'the-ministry')), 'the-ministry');
  const requestedLesson = normalizeSlug(getParam(req, 'lesson_slug', getParam(req, 'lesson', 'lesson-1')), 'lesson-1');
  const requestedLessonId = lessonConfigId(requestedSeries, requestedLesson);

  if (!SB_URL || !SB_KEY) {
    const fallback = defaultConfig({ series_slug: requestedSeries, lesson_slug: requestedLesson, id: requestedLessonId, scope: 'lesson' });
    if (req.method === 'GET') return res.status(200).json({ ok: true, saved: false, config: fallback, reason: 'Supabase env not configured' });
    if (req.method === 'POST') return res.status(200).json({ ok: true, saved: false, config: fallback, reason: 'Supabase env not configured' });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    const lessonRead = await readRow(SB_URL, SB_KEY, requestedLessonId);
    const defaultRead = await readRow(SB_URL, SB_KEY, 'default');

    const lessonConfig = lessonRead.ok && lessonRead.row ? rowToConfig(lessonRead.row, 'lesson') : null;
    const globalConfig = defaultRead.ok && defaultRead.row ? rowToConfig(defaultRead.row, 'global') : null;
    const config = lessonConfig || globalConfig || defaultConfig({ series_slug: requestedSeries, lesson_slug: requestedLesson, id: requestedLessonId, scope: 'lesson' });

    return res.status(200).json({
      ok: true,
      saved: !!(lessonConfig || globalConfig),
      source: lessonConfig ? 'lesson' : (globalConfig ? 'global' : 'fallback'),
      requested_id: requestedLessonId,
      config,
      lesson_config: lessonConfig,
      global_config: globalConfig,
      warning: (!lessonRead.ok || !defaultRead.ok) ? (lessonRead.warning || defaultRead.warning || null) : null
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const seriesSlug = normalizeSlug(body.series_slug || body.seriesSlug || requestedSeries, 'the-ministry');
  const lessonSlug = normalizeSlug(body.lesson_slug || body.lessonSlug || requestedLesson, 'lesson-1');
  const lessonId = lessonConfigId(seriesSlug, lessonSlug);
  const embedUrl = clean(body.embed_url || body.embedUrl, 3000);

  const basePayload = {
    series_slug: seriesSlug,
    lesson_slug: lessonSlug,
    status: normalizeStatus(body.status),
    provider: normalizeProvider(body.provider, embedUrl),
    embed_url: embedUrl,
    title: clean(body.title || 'The Ministry Live', 180),
    service_label: clean(body.service_label || body.serviceLabel || 'Sunday Service · Online Portal', 220),
    sync_delay_seconds: Math.max(0, Math.min(120, Number(body.sync_delay_seconds ?? body.syncDelaySeconds ?? 10) || 0)),
    updated_at: new Date().toISOString()
  };

  // v57: save the stream to the current lesson by default.
  // Global fallback is optional so switching Lesson 2 / 3 / 4 shows each lesson's own saved YouTube link.
  const saveGlobal = body.save_global === true || body.saveGlobal === true || body.scope === 'global_and_lesson';
  const lessonPayload = { ...basePayload, id: lessonId };
  const lessonWrite = await upsertRow(SB_URL, SB_KEY, lessonPayload);
  if (!lessonWrite.ok) {
    return res.status(500).json({ error: 'Lesson stream config save failed', details: lessonWrite.text, payload_keys: Object.keys(lessonPayload) });
  }

  let globalWrite = null;
  if (saveGlobal) {
    const globalPayload = { ...basePayload, id: 'default' };
    globalWrite = await upsertRow(SB_URL, SB_KEY, globalPayload);
  }

  const lessonRows = Array.isArray(lessonWrite.json) ? lessonWrite.json : [];
  const savedConfig = rowToConfig(lessonRows[0], 'lesson') || lessonPayload;

  return res.status(200).json({
    ok: true,
    saved: true,
    saved_global: !!(globalWrite && globalWrite.ok),
    saved_lesson: true,
    source: 'lesson',
    lesson_id: lessonId,
    warning: globalWrite && !globalWrite.ok ? 'Saved to lesson, but global fallback save failed.' : null,
    details: globalWrite && !globalWrite.ok ? globalWrite.text : null,
    config: savedConfig
  });
}
