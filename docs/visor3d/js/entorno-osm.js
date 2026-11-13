// Enriquecimiento asíncrono de edificios reales (alturas y huellas) vía OpenStreetMap Overpass API
// Se usa únicamente en kilómetros sin fichero local de Catastro (entorno/<km>.json).

const cacheKmOsm = new Map();
let colaActiva = 0;

export async function cargarEdificiosOsmKm({
  km, anclaE, anclaN, anclaZ,
  utmALonlat, lonlatAUTM, cotaTerrenoUTM,
  enZonaEstacion, Eje3D,
  THREE, Malla, prisma, lamina, matEdifCivil, matCubiertaPlana,
  grupoEdificios, vivo,
}) {
  if (!grupoEdificios || colaActiva >= 2) return;
  if (cacheKmOsm.has(km)) {
    const cached = cacheKmOsm.get(km);
    if (cached && vivo()) construirMallaOsm(cached);
    return;
  }

  colaActiva++;
  try {
    const [lonC, latC] = utmALonlat(anclaE, anclaN);
    const dLat = 0.0042, dLon = 0.0055;
    const bbox = `${(latC - dLat).toFixed(5)},${(lonC - dLon).toFixed(5)},${(latC + dLat).toFixed(5)},${(lonC + dLon).toFixed(5)}`;
    const q = `[out:json][timeout:12];way["building"](${bbox});out body;>;out skel qt;`;
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: 'data=' + encodeURIComponent(q),
    });
    if (!r.ok) { cacheKmOsm.set(km, null); return; }
    const data = await r.json();
    const nodos = new Map();
    const edifs = [];
    for (const el of data.elements || []) {
      if (el.type === 'node') nodos.set(el.id, [el.lon, el.lat]);
    }
    for (const el of data.elements || []) {
      if (el.type !== 'way' || !el.nodes || el.nodes.length < 4) continue;
      const pts = [];
      for (const nid of el.nodes) {
        const ll = nodos.get(nid);
        if (ll) pts.push(lonlatAUTM(ll[0], ll[1]));
      }
      if (pts.length < 4) continue;
      const tags = el.tags || {};
      let h = parseFloat(String(tags.height || '').replace(',', '.'));
      if (!Number.isFinite(h) || h <= 0) {
        const niveles = parseFloat(tags['building:levels']);
        if (Number.isFinite(niveles) && niveles > 0) h = niveles * 3.1;
        else if (tags.building === 'industrial' || tags.building === 'warehouse') h = 8.2;
        else h = 6.2;
      }
      edifs.push({ pts, h: Math.min(45, Math.max(3.0, h)), nombre: tags.name || null });
    }
    cacheKmOsm.set(km, edifs);
    if (vivo()) construirMallaOsm(edifs);
  } catch {
    cacheKmOsm.set(km, null);
  } finally {
    colaActiva--;
  }

  function construirMallaOsm(edifs) {
    if (!edifs.length) return;
    const mEdif = new Malla();
    const mCub = new Malla();
    let n = 0;
    for (const ed of edifs) {
      let sE = 0, sN = 0, zMin = Infinity;
      for (const [E, N] of ed.pts) {
        sE += E; sN += N;
        zMin = Math.min(zMin, cotaTerrenoUTM(E, N));
      }
      const cE = sE / ed.pts.length, cN = sN / ed.pts.length;
      if (enZonaEstacion(cE, cN)) continue;
      if (Eje3D.proyUTM(cE, cN).d < 16) continue;
      const anillo = ed.pts.map(([E, N]) => [E - anclaE, -(N - anclaN)]);
      const y0 = zMin - 0.4 - anclaZ;
      const y1 = zMin + ed.h - anclaZ;
      prisma(mEdif, anillo, y0, y1);
      lamina(mCub, anillo, y1 + 0.02);
      n++;
    }
    if (!n) return;
    const meshEd = new THREE.Mesh(mEdif.construir(true), matEdifCivil);
    meshEd.castShadow = true; meshEd.receiveShadow = true;
    meshEd.userData = { capa: 'Edificios reales (OSM)', nombre: `Edificación entorno km ${km}`, info: 'Huella y altura real (height / building:levels) obtenidas de OpenStreetMap.' };
    const meshCub = new THREE.Mesh(mCub.construir(true), matCubiertaPlana);
    meshCub.receiveShadow = true;
    meshCub.userData = meshEd.userData;
    grupoEdificios.add(meshEd, meshCub);
  }
}
