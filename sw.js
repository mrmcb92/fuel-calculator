const CACHE_NAME = 'combustibil-v5';
const resurse = [
  '/calculator-combustibil/',
  '/calculator-combustibil/index.html',
  '/calculator-combustibil/app.js',
  '/calculator-combustibil/style.css',
  '/calculator-combustibil/manifest.json',
  '/calculator-combustibil/icon-nou-192.png',
  '/calculator-combustibil/icon-nou-512.png'
];

self.addEventListener('install', (eveniment) => {
  self.skipWaiting();
  eveniment.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(resurse);
    }).catch((err) => {
      console.error('[SW] Eroare la instalare, nu s-au putut cachea resursele:', err);
    })
  );
});

self.addEventListener('activate', (eveniment) => {
  eveniment.waitUntil(
    caches.keys().then((numeCacheUri) => {
      return Promise.all(
        numeCacheUri.map((nume) => {
          if (nume !== CACHE_NAME) {
            return caches.delete(nume);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (eveniment) => {
  eveniment.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(eveniment.request).then((raspunsCache) => {
        const cerereRetea = fetch(eveniment.request).then((raspunsRetea) => {
          if (raspunsRetea && raspunsRetea.status === 200) {
            cache.put(eveniment.request, raspunsRetea.clone());
          }
          return raspunsRetea;
        }).catch(() => {
          // rețeaua nu e disponibilă, nu facem nimic
        });

        // returnează cache-ul imediat dacă există, altfel așteptăm rețeaua
        return raspunsCache || cerereRetea;
      });
    })
  );
});
