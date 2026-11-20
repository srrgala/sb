// Service worker: guarda toda la app en el móvil para que funcione sin conexión.
const VERSION = 'senorbusca-v2';
const ARCHIVOS = [
  './',
  './index.html',
  './estilo.css',
  './impresion.css',
  './app.js',
  './textos.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './fonts/libre-caslon-text-latin-400-normal.woff2',
  './fonts/libre-caslon-text-latin-ext-400-normal.woff2',
  './fonts/libre-caslon-text-latin-400-italic.woff2',
  './fonts/libre-caslon-text-latin-ext-400-italic.woff2',
  './fonts/libre-caslon-text-latin-700-normal.woff2',
  './fonts/libre-caslon-text-latin-ext-700-normal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((enCache) => {
      if (enCache) return enCache;
      return fetch(req).then((resp) => {
        if (resp && resp.ok && resp.type === 'basic') {
          const copia = resp.clone();
          caches.open(VERSION).then((c) => c.put(req, copia));
        }
        return resp;
      }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
