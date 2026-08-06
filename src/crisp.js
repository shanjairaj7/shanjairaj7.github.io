const websiteId = '7423fc6c-761e-4c0e-8133-95df60bf211c';

export function initCrisp() {
  if (window.__madeForMoreCrispLoaded) return;
  window.__madeForMoreCrispLoaded = true;
  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = websiteId;
  const script = document.createElement('script');
  script.src = 'https://client.crisp.chat/l.js';
  script.async = true;
  script.id = 'made-for-more-crisp';
  document.head.appendChild(script);
}
