const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
});

const eventTypes = new Set([
  'page_view', 'session_start', 'session_end', 'section_enter', 'section_leave',
  'section_reached', 'scroll_direction_change', 'cta_clicked', 'registration_started',
  'form_field_completed', 'registration_details_saved', 'registration_submitted',
  'checkout_viewed', 'addon_selected', 'addon_removed', 'paddle_checkout_opened',
  'checkout_abandoned', 'manual_reservation_requested', 'manual_reservation_confirmed',
  'payment_completed',
]);

let paddleAvailabilityCache = null;

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

function notificationText(title, lines) {
  return [`<b>${title}</b>`, ...lines.filter(Boolean)].join('\n');
}

function escapeTelegramHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

async function sendTelegramNotification(env, { key, visitorId = null, eventType, text, payload = {} }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const now = new Date().toISOString();
  const claim = await env.DB.prepare(`INSERT INTO notification_log (notification_key, visitor_id, event_type, status, attempted_at, payload_json)
    VALUES (?, ?, ?, 'pending', ?, ?) ON CONFLICT(notification_key) DO NOTHING`)
    .bind(key, visitorId, eventType, now, toJson(payload)).run();
  if (!claim.meta?.changes) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!response.ok) throw new Error(`Telegram returned ${response.status}`);
    await env.DB.prepare(`UPDATE notification_log SET status = 'sent', sent_at = ? WHERE notification_key = ?`).bind(new Date().toISOString(), key).run();
  } catch (error) {
    await env.DB.prepare('DELETE FROM notification_log WHERE notification_key = ?').bind(key).run();
    console.warn(`Telegram notification could not be sent: ${error.message}`);
  }
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
  const completeDetails = [draft.first_name, draft.last_name, draft.email, draft.phone, draft.profession].every(Boolean);
  if (completeDetails) {
    await sendTelegramNotification(env, {
      key: `registration_details_complete:${body.visitor_id}`,
      visitorId: body.visitor_id,
      eventType: 'registration_details_complete',
      text: notificationText('New workshop registration details', [
        `Visitor ID: <code>${escapeTelegramHtml(body.visitor_id)}</code>`,
        `Name: ${escapeTelegramHtml(draft.first_name)} ${escapeTelegramHtml(draft.last_name)}`,
        `WhatsApp: ${escapeTelegramHtml(draft.phone)}`,
        `Email: ${escapeTelegramHtml(draft.email)}`,
        `Profession: ${escapeTelegramHtml(draft.profession)}`,
        'Status: details completed — payment not started yet',
      ]),
      payload: draft,
    });
  }
  if (body.checkout_viewed && completeDetails) {
    await sendTelegramNotification(env, {
      key: `checkout_reached:${body.visitor_id}`,
      visitorId: body.visitor_id,
      eventType: 'checkout_reached',
      text: notificationText('Registration reached checkout', [
        `Visitor ID: <code>${escapeTelegramHtml(body.visitor_id)}</code>`,
        `Name: ${escapeTelegramHtml(draft.first_name)} ${escapeTelegramHtml(draft.last_name)}`,
        'Status: step 2 opened — payment not complete',
      ]),
      payload: { email: draft.email, profession: draft.profession },
    });
  }
  return json({ saved: true }, 202, cors(request, env));
}

async function paddleAvailability(request, env) {
  const body = await request.json().catch(() => null);
  const priceId = validShortText(body?.price_id, 80);
  const domain = validShortText(body?.domain, 255)?.toLowerCase();
  if (!priceId || !/^pri_[a-z\d]{20,60}$/.test(priceId)) return json({ available: false, reason: 'invalid_price' }, 400, cors(request, env));
  if (!domain || !/^[a-z\d.-]+$/.test(domain)) return json({ available: false, reason: 'invalid_domain' }, 400, cors(request, env));

  const now = Date.now();
  if (paddleAvailabilityCache && paddleAvailabilityCache.priceId === priceId && paddleAvailabilityCache.domain === domain && now - paddleAvailabilityCache.checkedAt < 60_000) {
    return json(paddleAvailabilityCache.result, 200, cors(request, env));
  }
  if (!env.PADDLE_API_KEY) {
    const result = { available: false, reason: 'paddle_api_not_configured' };
    paddleAvailabilityCache = { priceId, checkedAt: now, result };
    return json(result, 200, cors(request, env));
  }

  try {
    const headers = { authorization: `Bearer ${env.PADDLE_API_KEY}`, 'content-type': 'application/json' };
    const [previewResponse, domainsResponse] = await Promise.all([
      fetch('https://api.paddle.com/transactions/preview', {
      method: 'POST',
      headers,
      body: JSON.stringify({ items: [{ price_id: priceId, quantity: 1 }], currency_code: 'INR' }),
      }),
      fetch('https://api.paddle.com/checkout-domains', { headers }),
    ]);
    const preview = await previewResponse.json().catch(() => ({}));
    const domains = await domainsResponse.json().catch(() => ({}));
    const code = preview?.error?.code;
    const checkoutDomain = Array.isArray(domains?.data) ? domains.data.find((item) => item.domain?.toLowerCase() === domain) : null;
    const domainApproved = domainsResponse.ok && checkoutDomain?.status === 'approved';
    const result = previewResponse.ok && domainApproved
      ? { available: true, reason: 'preview_and_domain_approved' }
      : { available: false, reason: code === 'transaction_checkout_not_enabled' ? 'checkout_not_enabled' : domainApproved ? 'paddle_unavailable' : 'checkout_domain_not_approved' };
    paddleAvailabilityCache = { priceId, domain, checkedAt: now, result };
    return json(result, 200, cors(request, env));
  } catch {
    const result = { available: false, reason: 'paddle_unreachable' };
    paddleAvailabilityCache = { priceId, checkedAt: now, result };
    return json(result, 200, cors(request, env));
  }
}

async function createManualReservation(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.consent || !validId(body.visitor_id) || !validId(body.session_id)) return json({ error: 'Consent and a valid visitor session are required' }, 400, cors(request, env));
  const selectedOffer = body.selected_offer === 'bundle' ? 'bundle' : body.selected_offer === 'workshop' ? 'workshop' : null;
  const listedAmount = Number(body.listed_amount);
  const discountAmount = Number(body.discount_amount);
  const amountDue = Number(body.amount_due);
  if (!selectedOffer || !Number.isInteger(listedAmount) || !Number.isInteger(discountAmount) || !Number.isInteger(amountDue) || listedAmount < 0 || discountAmount < 0 || amountDue < 0 || amountDue !== Math.max(0, listedAmount - discountAmount)) {
    return json({ error: 'Invalid reservation total' }, 400, cors(request, env));
  }
  const fields = ['first_name', 'last_name', 'email', 'phone', 'profession'];
  const lead = Object.fromEntries(fields.map((field) => [field, validShortText(body[field], 180)]));
  if (![lead.first_name, lead.last_name, lead.email, lead.phone, lead.profession].every(Boolean) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return json({ error: 'Complete registration details are required' }, 400, cors(request, env));
  }
  const now = new Date().toISOString();
  const reservationId = `reserve_${crypto.randomUUID().replaceAll('-', '')}`;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO visitors (visitor_id, first_seen_at, last_seen_at)
      VALUES (?, ?, ?) ON CONFLICT(visitor_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`)
      .bind(body.visitor_id, now, now),
    env.DB.prepare(`INSERT INTO manual_reservations (visitor_id, reservation_id, session_id, first_name, last_name, email, phone, profession, selected_offer, listed_amount, early_bird_discount, amount_due, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'payment_details_to_send', ?, ?)
      ON CONFLICT(visitor_id) DO UPDATE SET session_id = excluded.session_id, first_name = excluded.first_name, last_name = excluded.last_name,
        email = excluded.email, phone = excluded.phone, profession = excluded.profession, selected_offer = excluded.selected_offer,
        listed_amount = excluded.listed_amount, early_bird_discount = excluded.early_bird_discount, amount_due = excluded.amount_due,
        status = excluded.status, updated_at = excluded.updated_at`)
      .bind(body.visitor_id, reservationId, body.session_id, lead.first_name, lead.last_name, lead.email, lead.phone, lead.profession, selectedOffer, listedAmount, discountAmount, amountDue, now, now),
  ]);
  await sendTelegramNotification(env, {
    key: `manual_reservation:${body.visitor_id}:${selectedOffer}`,
    visitorId: body.visitor_id,
    eventType: 'manual_reservation',
    text: notificationText('Early-bird seat reserved — WhatsApp follow-up needed', [
      `Visitor ID: <code>${escapeTelegramHtml(body.visitor_id)}</code>`,
      `Name: ${escapeTelegramHtml(lead.first_name)} ${escapeTelegramHtml(lead.last_name)}`,
      `WhatsApp: ${escapeTelegramHtml(lead.phone)}`,
      `Email: ${escapeTelegramHtml(lead.email)}`,
      `Profession: ${escapeTelegramHtml(lead.profession)}`,
      selectedOffer === 'bundle' ? 'Selected: workshop + Build With AI live add-on' : 'Selected: main workshop only',
      discountAmount > 0
        ? `Listed amount: ₹${listedAmount} · discount: ₹${discountAmount} · manual payment due: ₹${amountDue}`
        : `Payment to arrange: ₹${amountDue}`,
      'Status: payment details must be sent manually — NOT PAID',
    ]),
    payload: { ...lead, selected_offer: selectedOffer, listed_amount: listedAmount, discount_amount: discountAmount, amount_due: amountDue },
  });
  return json({ reserved: true, reservation_id: reservationId, status: 'payment_details_to_send' }, 201, cors(request, env));
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

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sendMetaPurchase(request, transaction, customData, env) {
  if (!env.META_CAPI_ACCESS_TOKEN || !env.META_PIXEL_ID) return;
  const customerEmail = (transaction.customer?.email || customData.email || '').trim().toLowerCase();
  const customerPhone = (customData.phone || '').replace(/[^0-9]/g, '');
  const userData = {};
  if (customerEmail) userData.em = [await sha256(customerEmail)];
  if (customerPhone) userData.ph = [await sha256(customerPhone)];
  if (validId(customData.visitor_id)) userData.external_id = [await sha256(customData.visitor_id)];
  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) userData.client_ip_address = clientIp;
  const completedAt = transaction.completed_at || new Date().toISOString();
  const amount = Number(transaction.details?.totals?.total || 0);
  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.parse(completedAt) / 1000),
      event_id: `paddle_${transaction.id}`,
      action_source: 'website',
      event_source_url: 'https://shanjairaj7.github.io/',
      user_data: userData,
      custom_data: {
        currency: transaction.currency_code || 'INR',
        value: Number.isFinite(amount) ? amount / 100 : 0,
        content_name: customData.selected_offer === 'bundle' ? 'Made for More workshop + Build With AI add-on' : 'Made for More Live Claude & AI Workshop',
      },
    }],
  };
  const response = await fetch(`https://graph.facebook.com/v23.0/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_ACCESS_TOKEN)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) console.warn(`Meta Purchase event was not accepted (${response.status})`);
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
  await sendTelegramNotification(env, {
    key: `payment_completed:${transaction.id}`,
    visitorId: validId(customData.visitor_id) ? customData.visitor_id : null,
    eventType: 'payment_completed',
    text: notificationText('Payment confirmed', [
      `Transaction: <code>${escapeTelegramHtml(transaction.id)}</code>`,
      customData.visitor_id ? `Visitor ID: <code>${escapeTelegramHtml(customData.visitor_id)}</code>` : null,
      customData.first_name || customData.last_name ? `Name: ${escapeTelegramHtml(`${customData.first_name || ''} ${customData.last_name || ''}`.trim())}` : null,
      transaction.customer?.email || customData.email ? `Email: ${escapeTelegramHtml(transaction.customer?.email || customData.email)}` : null,
      customData.phone ? `WhatsApp: ${escapeTelegramHtml(customData.phone)}` : null,
      `Paid: ${escapeTelegramHtml(transaction.currency_code || 'INR')} ${(Number(transaction.details?.totals?.total || 0) / 100).toFixed(2)}`,
      customData.selected_offer === 'bundle' ? 'Order: workshop + Build With AI add-on' : 'Order: workshop',
      'Status: payment completed',
    ]),
    payload: { transaction_id: transaction.id, amount: transaction.details?.totals?.total || null, currency_code: transaction.currency_code || null, selected_offer: customData.selected_offer || 'workshop' },
  });
  try { await sendMetaPurchase(request, transaction, customData, env); } catch { console.warn('Meta Purchase event could not be sent'); }
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
    if (request.method === 'POST' && url.pathname === '/v1/paddle/availability') return paddleAvailability(request, env);
    if (request.method === 'POST' && url.pathname === '/v1/manual-reservations') return createManualReservation(request, env);
    if (request.method === 'POST' && url.pathname === '/v1/paddle/webhook') return handlePaddleWebhook(request, env);
    return json({ error: 'Not found' }, 404, cors(request, env));
  },
};
