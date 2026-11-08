// Service Worker para VISOR MDC (Monforte del Cid) (PWA & Modo Campo Offline)
const CACHE_NAME = 'visor-mdc-pwa-v1';
const CACHE_CLIMA = 'visor-mdc-clima-cache';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png',
  '/version.json',
  '/data/provincias.geojson',
  '/data/nacional.geojson'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Fallo parcial en precache inicial PWA:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== CACHE_CLIMA)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'PRECACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          event.data.urls.map((url) =>
            fetch(url).then((res) => {
              if (res.ok) return cache.put(url, res);
            })
          )
        );
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o esquemas no soportados (ej. extensiones)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // APIs externas de meteorología y emergencias: Network-First con fallback resiliente a última caché
  if (
    url.pathname.includes('/aemet-') ||
    url.pathname.includes('/firms-') ||
    url.pathname.includes('/emsc-')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copia = response.clone();
            caches.open(CACHE_CLIMA).then((cache) => cache.put(event.request, copia));
          }
          return response;
        })
        .catch(() => {
          // Si no hay red (túnel, trinchera sin cobertura), devolver última respuesta meteorológica conocida
          return caches.match(event.request);
        })
    );
    return;
  }

  // Navegación (HTML SPA): Network-First con fallback a index.html en caché
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html') || caches.match(event.request))
    );
    return;
  }

  // Datasets estáticos de traza y geojson (/datos/, /data/): Stale-While-Revalidate con cache-first
  if (url.pathname.includes('/datos/') || url.pathname.includes('/data/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Todo lo que no es de este origen (radar de lluvia, teselas, APIs) va directo a la red:
  // cachearlo congelaba el radar de lluvia en el mismo fotograma para siempre.
  if (url.origin !== self.location.origin) return;

  // Recursos estáticos generales (JS, CSS, fuentes, imágenes locales): Cache-first con actualización en segundo plano
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
