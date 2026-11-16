// Abrir en GeoLibre (https://web.geolibre.app, SIG libre en el navegador, MIT): enlace profundo con la cartografía
// 3D de Adif del tramo que se está viendo, para medir, consultar atributos, filtrar con SQL o usar sus herramientas
// de geoproceso sin salir del navegador.
//
// GeoLibre descarga los datos él mismo: tienen que ser públicos y con CORS. Por eso los enlaces apuntan siempre a la
// copia publicada en el laboratorio (también cuando el visor se sirve en local). Formato:
//   ?data=<geojson>&style=<estilo>&data=…&style=…&lat=&lon=&zoom=
// El estilo (datos/geolibre/cartografia.style.json, scripts/generar-estilo-geolibre.py) da a cada capa su color.

const PUBLICADO = 'https://ivandlpn.github.io/laboratorio/visor3d/';
const GEOLIBRE = 'https://web.geolibre.app/';

/** Raíz pública de los datos del visor (la propia página si ya está publicada; si no, el laboratorio). */
function raizPublica() {
  const h = location.hostname;
  if (!h || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.localhost') || location.protocol === 'file:') return PUBLICADO;
  return new URL('./', location.href).href;
}

/**
 * Enlace a GeoLibre con la cartografía de los km alrededor de un PK.
 * @param {object} o
 * @param {number} o.pk           PK (m) del punto de interés
 * @param {number} [o.lat] [o.lon] coordenadas para centrar el mapa
 * @param {number} [o.radioKm]    km a cada lado que se añaden (por defecto 1: el km anterior y el siguiente)
 * @param {number} [o.pkIni] [o.pkFin] límites del corredor
 */
export function urlGeoLibre({ pk, lat, lon, zoom = 17, radioKm = 1, pkIni = 322000, pkFin = 486200 }) {
  const raiz = raizPublica();
  const estilo = `${raiz}datos/geolibre/cartografia.style.json`;
  const km = Math.floor(pk / 1000);
  const p = new URLSearchParams();
  for (let k = km - radioKm; k <= km + radioKm; k++) {
    if (k * 1000 + 999 < pkIni || k * 1000 > pkFin) continue;
    p.append('data', `${raiz}datos/albali/km/${k}.geojson`);
    p.append('style', estilo);
  }
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    p.set('lat', lat.toFixed(6));
    p.set('lon', lon.toFixed(6));
    p.set('zoom', String(zoom));
  }
  return `${GEOLIBRE}?${p.toString()}`;
}
