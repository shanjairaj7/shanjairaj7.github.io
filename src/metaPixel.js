const pixelId = '2238910003510755';
let initialized = false;

export function initMetaPixel() {
  if (initialized || !pixelId || typeof window === 'undefined') return;
  initialized = true;
  if (!window.fbq) {
    const fbq = (...args) => { fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args); };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  window.fbq('init', pixelId);
}

export function trackMeta(eventName, parameters = {}, options) {
  if (!pixelId || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, parameters, options);
}

export const madeForMorePixelId = pixelId;
