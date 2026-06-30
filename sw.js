const CACHE = 'fitapp-v1';
const ASSETS = ['/fitapp/', '/fitapp/index.html', '/fitapp/styles.css', '/fitapp/app.js', '/fitapp/data.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
