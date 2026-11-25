/* Service worker de VISOR3D: lo que se ha visto queda disponible sin conexión.
 *  - HTML, JS, CSS y JSON: primero la red (así una publicación nueva se ve al instante y nunca se mezclan ficheros viejos y nuevos);
 *    sin red, la copia guardada.
 *  - Cartografía por km, relieve, modelos y texturas: lo guardado primero y se renueva por detrás.
 *  - three.js (URL con versión) y tipografías: lo guardado primero.
 *  - Ortofotos, ficheros grandes y peticiones que no son GET: no se guardan.
 */
const CACHE = 'visor3d-v1';
const PESADO = /\/ortofotos\//;
const ESTABLE = /\/(datos\/albali\/(km|mdt|mdt5|entorno)|modelos|comun\/(modelos|texturas))\//;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('visor3d-')) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function guardar(req, resp) {
  if (resp && resp.ok && resp.status === 200) { const c = await caches.open(CACHE); await c.put(req, resp.clone()); }
  return resp;
}
const primeroRed = async (req) => { try { return await guardar(req, await fetch(req)); } catch (err) { const c = await caches.match(req); if (c) return c; throw err; } };
const primeroCache = async (req) => (await caches.match(req)) || guardar(req, await fetch(req));
async function viejoYRenueva(req) {
  const c = await caches.match(req);
  const red = fetch(req).then((r) => guardar(req, r)).catch(() => null);
  return c || (await red) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (PESADO.test(url.pathname)) return;
  if (url.origin === self.location.origin) {
    e.respondWith(ESTABLE.test(url.pathname) ? viejoYRenueva(req) : primeroRed(req));
  } else if (/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(primeroCache(req));
  }
});
