const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT || 'https://made-for-more-analytics.shanjairajdev.workers.dev';
const visitorKey = 'madeForMoreVisitorId';
const sessionKey = 'madeForMoreSessionId';
let queue = [];
let flushTimer;
let started = false;
let currentRoute = '/';
let direction = '';
let lastScrollY = 0;
let lastDirectionEventAt = 0;

const id = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9_-]/g, '');

export function getVisitorId() {
  let value = localStorage.getItem(visitorKey);
  if (!value) { value = id(); localStorage.setItem(visitorKey, value); }
  return value;
}

function getSessionId() {
  let value = sessionStorage.getItem(sessionKey);
  if (!value) { value = id(); sessionStorage.setItem(sessionKey, value); }
  return value;
}

function campaign() {
  const params = new URLSearchParams(location.search);
  return Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].flatMap((key) => {
    const value = params.get(key);
    return value ? [[key, value.slice(0, 180)]] : [];
  }));
}

function deviceType() {
  return matchMedia('(max-width: 800px)').matches ? 'mobile' : 'desktop';
}

function eventPayload() {
  return {
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    landing_path: location.pathname + location.hash,
    referrer: document.referrer.slice(0, 500),
    campaign: campaign(),
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    device_type: deviceType(),
  };
}

export function flush() {
  if (!queue.length) return;
  const events = queue.splice(0, queue.length);
  clearTimeout(flushTimer);
  fetch(`${endpoint}/v1/events`, {
    method: 'POST',
    mode: 'cors',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...eventPayload(), events }),
  }).catch(() => { /* Analytics must never interrupt registration. */ });
}

export function track(eventType, payload = {}, sectionId = null) {
  queue.push({
    event_id: id(),
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    path: currentRoute,
    section_id: sectionId,
    payload,
  });
  if (queue.length >= 10) flush();
  else {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 2500);
  }
}

export function saveLeadDraft(draft) {
  if (!draft.consent) return;
  const data = {
    visitor_id: getVisitorId(),
    consent: true,
    first_name: draft.firstName || '',
    last_name: draft.lastName || '',
    email: draft.email || '',
    phone: draft.phone || '',
    profession: draft.profession || '',
    registration_submitted: Boolean(draft.registrationSubmitted),
    checkout_viewed: Boolean(draft.checkoutViewed),
  };
  localStorage.setItem('madeForMoreLeadDraft', JSON.stringify(data));
  return fetch(`${endpoint}/v1/lead-drafts`, {
    method: 'POST',
    mode: 'cors',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}

export function startJourney(route) {
  currentRoute = route || '/';
  if (!started) {
    started = true;
    track('session_start');
    window.addEventListener('pagehide', () => { track('session_end'); flush(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('scroll', () => {
      const nextY = window.scrollY;
      const nextDirection = nextY > lastScrollY ? 'down' : nextY < lastScrollY ? 'up' : direction;
      if (nextDirection && nextDirection !== direction && Date.now() - lastDirectionEventAt > 1500) {
        direction = nextDirection;
        lastDirectionEventAt = Date.now();
        track('scroll_direction_change', { direction, scroll_y: Math.round(nextY) });
      }
      lastScrollY = nextY;
    }, { passive: true });
  }
  track('page_view');
}

export function observeSections() {
  const activeSince = new Map();
  const reached = new Set();
  const sections = [...document.querySelectorAll('[data-track-section]')];
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const sectionId = entry.target.getAttribute('data-track-section');
      if (!sectionId) continue;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (!reached.has(sectionId)) { reached.add(sectionId); track('section_reached', { scroll_y: Math.round(window.scrollY) }, sectionId); }
        if (!activeSince.has(sectionId)) { activeSince.set(sectionId, performance.now()); track('section_enter', {}, sectionId); }
      } else if (activeSince.has(sectionId)) {
        const durationMs = Math.round(performance.now() - activeSince.get(sectionId));
        activeSince.delete(sectionId);
        if (durationMs >= 250) track('section_leave', { duration_ms: durationMs }, sectionId);
      }
    }
  }, { threshold: [0, 0.5, 0.75] });
  sections.forEach((section) => observer.observe(section));
  return () => {
    for (const [sectionId, since] of activeSince) track('section_leave', { duration_ms: Math.round(performance.now() - since) }, sectionId);
    observer.disconnect();
  };
}
