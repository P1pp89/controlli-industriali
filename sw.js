// Service Worker per funzionalità offline
const CACHE_NAME = 'controlli-tecnici-v2-20250121'; // ← VERSIONE AGGIORNATA
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/config.js',
  '/manifest.json'
];

// Installazione del Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercettazione delle richieste
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Per i file critici (JS, HTML), usa "Network First"
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.includes('config')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Se la rete funziona, aggiorna la cache e restituisci la risposta
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(function() {
          // Se la rete fallisce, usa la cache
          return caches.match(event.request);
        })
    );
  } else {
    // Per altri file, usa "Cache First"
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          
          return fetch(event.request).catch(function() {
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
        }
      )
    );
  }
});

// Aggiornamento del Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});