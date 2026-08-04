const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
});

const eventTypes = new Set([
  'page_view', 'session_start', 'session_end', 'section_enter', 'section_leave',
  'section_reached', 'scroll_direction_change', 'cta_clicked', 'registration_started',
  'form_field_completed', 'registration_details_saved', 'registration_submitted',
  'checkout_viewed', 'addon_selected', 'addon_removed', 'paddle_checkout_opened',
  'checkout_abandoned', 'payment_completed',
]);

function allowedOrigin(request, env) {
  const origin = request.headers.get('origin') || '';
  const origins = (env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim());
  return origins.includes(origin) ? origin : '';
}

function cors(request, env) {
  const origin = allowedOrigin(request, env);
  return origin ? {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin',
  } : {};
}

function validId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}

function validShortText(value, max = 180) {
  return typeof value === 'string' && value.length <= max ? value : null;
}

function toJson(value) {
  try { return JSON.stringify(value ?? {}); } catch { return '{}'; }
}

function safeEvent(event) {
  if (!event || !validId(event.event_id) || !eventTypes.has(event.event_type)) return null;
  const occurredAt = validShortText(event.occurred_at, 40);
  if (!occurredAt || Number.isNaN(Date.parse(occurredAt))) return null;
  const payload = event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload) ? event.payload : {};
  return {
    event_id: event.event_id,
    event_type: event.event_type,
    occurred_at: occurredAt,
    path: validShortText(event.path, 240),
    section_id: validShortText(event.section_id, 100),
    payload_json: toJson(payload),
  };
}

async function saveEvents(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !validId(body.visitor_id) || !validId(body.session_id) || !Array.isArray(body.events) || body.events.length > 25) {
    return json({ error: 'Invalid analytics payload' }, 400, cors(request, env));
  }
  const events = body.events.map(safeEvent).filter(Boolean);
  if (!events.length) return json({ error: 'No valid events' }, 400, cors(request, env));

  const now = new Date().toISOString();
  const landingPath = validShortText(body.landing_path, 240);
  const referrer = validShortText(body.referrer, 500);
  const campaign = body.campaign && typeof body.campaign === 'object' ? body.campaign : {};
  const locale = validShortText(body.locale, 40);
  const timezone = validShortText(body.timezone, 100);
  const deviceType = validShortText(body.device_type, 30);
  const statements = [
    env.DB.prepare(`INSERT INTO visitors (visitor_id, first_seen_at, last_seen_at, first_landing_path, first_referrer, campaign_json, locale, timezone, device_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(visitor_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`)
      .bind(body.visitor_id, now, now, landingPath, referrer, toJson(campaign), locale, timezone, deviceType),
    env.DB.prepare(`INSERT INTO sessions (session_id, visitor_id, started_at, landing_path, referrer, campaign_json)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(session_id) DO NOTHING`)
      .bind(body.session_id, body.visitor_id, now, landingPath, referrer, toJson(campaign)),
  ];
  for (const event of events) {
    statements.push(env.DB.prepare(`INSERT INTO journey_events (event_id, visitor_id, session_id, event_type, occurred_at, path, section_id, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING`)
      .bind(event.event_id, body.visitor_id, body.session_id, event.event_type, event.occurred_at, event.path, event.section_id, event.payload_json));
  }
  if (events.some((event) => event.event_type === 'session_end')) {
    statements.push(env.DB.prepare('UPDATE sessions SET ended_at = ? WHERE session_id = ?').bind(now, body.session_id));
  }
  await env.DB.batch(statements);
  return json({ accepted: events.length }, 202, cors(request, env));
}

async function saveLeadDraft(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.consent || !validId(body.visitor_id)) return json({ error: 'Consent is required to save a draft' }, 400, cors(request, env));
  const fields = ['first_name', 'last_name', 'email', 'phone', 'profession'];
  const draft = Object.fromEntries(fields.map((field) => [field, validShortText(body[field], 180)]));
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) return json({ error: 'Invalid email' }, 400, cors(request, env));
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO visitors (visitor_id, first_seen_at, last_seen_at)
    VALUES (?, ?, ?) ON CONFLICT(visitor_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`)
    .bind(body.visitor_id, now, now).run();
  await env.DB.prepare(`INSERT INTO lead_drafts (visitor_id, first_name, last_name, email, phone, profession, consent_at, updated_at, registration_submitted_at, checkout_viewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(visitor_id) DO UPDATE SET first_name = excluded.first_name, last_name = excluded.last_name, email = excluded.email,
      phone = excluded.phone, profession = excluded.profession, updated_at = excluded.updated_at,
      registration_submitted_at = COALESCE(excluded.registration_submitted_at, lead_drafts.registration_submitted_at),
      checkout_viewed_at = COALESCE(excluded.checkout_viewed_at, lead_drafts.checkout_viewed_at)`)
    .bind(body.visitor_id, draft.first_name, draft.last_name, draft.email, draft.phone, draft.profession, now, now,
      body.registration_submitted ? now : null, body.checkout_viewed ? now : null).run();
  return json({ saved: true }, 202, cors(request, env));
}

function parseSignature(header) {
  const entries = header.split(';').map((part) => part.trim().split('='));
  const timestamp = entries.find(([key]) => key === 'ts')?.[1];
  const signatures = entries.filter(([key]) => key === 'h1').map(([, value]) => value);
  return { timestamp, signatures };
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
}

async function verifyPaddleSignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const { timestamp, signatures } = parseSignature(header);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}:${rawBody}`));
  const hash = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some((candidate) => constantTimeEqual(hash, candidate));
}

async function handlePaddleWebhook(request, env) {
  const rawBody = await request.text();
  const valid = await verifyPaddleSignature(rawBody, request.headers.get('paddle-signature'), env.PADDLE_WEBHOOK_SECRET);
  if (!valid) return json({ error: 'Invalid webhook signature' }, 401);
  const event = JSON.parse(rawBody);
  if (event.event_type !== 'transaction.completed') return json({ received: true });
  const transaction = event.data;
  const customData = transaction.custom_data || {};
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO paddle_orders (transaction_id, visitor_id, customer_email, status, amount, currency_code, completed_at, received_at, order_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(transaction_id) DO UPDATE SET status = excluded.status, completed_at = excluded.completed_at, received_at = excluded.received_at, order_json = excluded.order_json`)
    .bind(transaction.id, validId(customData.visitor_id) ? customData.visitor_id : null, transaction.customer?.email || customData.email || null,
      transaction.status || 'completed', transaction.details?.totals?.total || null, transaction.currency_code || null,
      transaction.completed_at || now, now, rawBody).run();
  if (validId(customData.visitor_id) && validId(customData.session_id)) {
    await env.DB.prepare(`INSERT INTO journey_events (event_id, visitor_id, session_id, event_type, occurred_at, path, section_id, payload_json)
      VALUES (?, ?, ?, 'payment_completed', ?, '/checkout', NULL, ?)
      ON CONFLICT(event_id) DO NOTHING`)
      .bind(`paddle_${transaction.id}`, customData.visitor_id, customData.session_id, transaction.completed_at || now,
        toJson({ transaction_id: transaction.id, amount: transaction.details?.totals?.total || null, currency_code: transaction.currency_code || null })).run();
  }
  return json({ received: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request, env) });
    if (url.pathname === '/v1/health') return json({ ok: true });
    if (!allowedOrigin(request, env) && url.pathname !== '/v1/paddle/webhook') return json({ error: 'Origin not allowed' }, 403);
    if (request.method === 'POST' && url.pathname === '/v1/events') return saveEvents(request, env);
    if (request.method === 'POST' && url.pathname === '/v1/lead-drafts') return saveLeadDraft(request, env);
    if (request.method === 'POST' && url.pathname === '/v1/paddle/webhook') return handlePaddleWebhook(request, env);
    return json({ error: 'Not found' }, 404, cors(request, env));
  },
};
