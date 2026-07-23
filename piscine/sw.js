// Service worker minimal de l'app Piscine Avenue.
// Sa présence (avec un gestionnaire fetch) rend l'app « installable » : sur Android,
// Chrome crée alors une vraie icône avec le logo du manifest au lieu d'un raccourci générique.
// On ne met PAS en cache /api/ (rendu IA + proxy plan) ni les réponses POST.
const CACHE = 'piscine-av-v11';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './assets/logo.jpg',
  './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.url.includes('/api/')) return; // jamais le rendu IA
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && req.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
