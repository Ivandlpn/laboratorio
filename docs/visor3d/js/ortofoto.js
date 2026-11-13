import * as THREE from 'three';
import { utmALonlat, lonlatAMercPx } from './proyeccion.js';

// Cargador asíncrono de Ortofoto Aérea PNOA (local del proyecto, IGN WMTS y respaldo Esri) sobre bloques UTM
export function crearOrtofoto3D({ maxAnisotropy, getFondoTerreno, getEje3D }) {
  const cacheImg = new Map();
  const URL_PNOA = (z, x, y) => `https://www.ign.es/wmts/pnoa-ma?service=WMTS&request=GetTile&version=1.0.0&layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&tilematrix=${z}&tilerow=${y}&tilecol=${x}&format=image/jpeg`;
  const URL_ESRI = (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

  let catalogoOrtoLocal = null;
  const cargarCatalogoLocal = (() => {
    let p = null;
    return () => {
      if (!p) {
        p = Promise.all([
          fetch('./datos/ortofotos/042.DES.V1.447_670/teselas.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('./datos/ortofotos/albali-orto/teselas.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]).then(([r042, rAlb]) => {
          catalogoOrtoLocal = {
            pkg042: r042?.niveles || {},
            pkgAlbali: rAlb?.niveles || {},
          };
          return catalogoOrtoLocal;
        });
      }
      return p;
    };
  })();

  function existeEnNiveles(niveles, z, x, y) {
    if (!niveles) return false;
    const n = niveles[String(z)];
    if (!n || !n.cols) return false;
    const col = n.cols[x - n.x0];
    if (!col) return false;
    for (let i = 0; i < col.length; i += 2) {
      if (y >= col[i] && y <= col[i + 1]) return true;
    }
    return false;
  }

  function descargarImg(url) {
    return new Promise((res) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = url;
    });
  }

  function obtenerTesela(z, x, y) {
    const fuente = getFondoTerreno();
    const k = `${fuente}/${z}/${x}/${y}`;
    if (cacheImg.has(k)) return cacheImg.get(k);
    const p = (async () => {
      if (fuente === 'esri') return descargarImg(URL_ESRI(z, x, y));
      if (fuente === 'proyecto') {
        await cargarCatalogoLocal();
        if (catalogoOrtoLocal) {
          if (existeEnNiveles(catalogoOrtoLocal.pkg042, z, x, y)) {
            const im = await descargarImg(`./datos/ortofotos/042.DES.V1.447_670/${z}/${x}/${y}.webp`);
            if (im) return im;
          }
          if (existeEnNiveles(catalogoOrtoLocal.pkgAlbali, z, x, y)) {
            const im = await descargarImg(`./datos/ortofotos/albali-orto/${z}/${x}/${y}.webp`);
            if (im) return im;
          }
        }
      }
      const imPnoa = await descargarImg(URL_PNOA(z, x, y));
      if (imPnoa) return imPnoa;
      return descargarImg(URL_ESRI(z, x, y));
    })();
    cacheImg.set(k, p);
    if (cacheImg.size > 320) cacheImg.delete(cacheImg.keys().next().value);
    return p;
  }

  async function generarTexturaBloque(E0, N0, tamBloque, zoom) {
    const W_CV = zoom >= 19 ? 2048 : zoom === 18 ? 1024 : zoom === 17 ? 768 : 512;
    const pNW = lonlatAMercPx(utmALonlat(E0, N0 + tamBloque), zoom);
    const pNE = lonlatAMercPx(utmALonlat(E0 + tamBloque, N0 + tamBloque), zoom);
    const pSW = lonlatAMercPx(utmALonlat(E0, N0), zoom);
    const pSE = lonlatAMercPx(utmALonlat(E0 + tamBloque, N0), zoom);

    const txMin = Math.floor(Math.min(pNW[0], pNE[0], pSW[0], pSE[0]) / 256);
    const txMax = Math.floor(Math.max(pNW[0], pNE[0], pSW[0], pSE[0]) / 256);
    const tyMin = Math.floor(Math.min(pNW[1], pNE[1], pSW[1], pSE[1]) / 256);
    const tyMax = Math.floor(Math.max(pNW[1], pNE[1], pSW[1], pSE[1]) / 256);

    const pedidos = [];
    for (let tx = txMin; tx <= txMax; tx++) for (let ty = tyMin; ty <= tyMax; ty++) {
      pedidos.push(obtenerTesela(zoom, tx, ty).then((im) => ({ tx, ty, im })));
    }
    const teselas = await Promise.all(pedidos);
    if (!teselas.some((t) => t.im)) return null;

    const cv = document.createElement('canvas');
    cv.width = cv.height = W_CV;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#9c8a6b';
    ctx.fillRect(0, 0, W_CV, W_CV);

    const dxU = pNE[0] - pNW[0], dyU = pNE[1] - pNW[1];
    const dxV = pSW[0] - pNW[0], dyV = pSW[1] - pNW[1];
    const det = dxU * dyV - dyU * dxV || 1;
    const a = (W_CV * dyV) / det, c = (-W_CV * dxV) / det, e = -(a * pNW[0] + c * pNW[1]);
    const b = (-W_CV * dyU) / det, d = (W_CV * dxU) / det, f = -(b * pNW[0] + d * pNW[1]);
    ctx.setTransform(a, b, c, d, e, f);
    for (const { tx, ty, im } of teselas) {
      if (im) ctx.drawImage(im, tx * 256 - 0.45, ty * 256 - 0.45, 256.9, 256.9);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Enmascarar la ortofoto del tablero bajo los viaductos copiando terreno adyacente (±16..24 m) para evitar duplicado 2D/3D
    const eje = getEje3D?.();
    if (eje?.viaductos?.length) {
      const pxPorM = W_CV / tamBloque;
      const rPatch = Math.max(4, Math.round(7.5 * pxPorM));
      const pad = 28;
      for (const [va, vb] of eje.viaductos) {
        for (let pk = va + 4; pk <= vb - 4; pk += 7) {
          const m = eje.enPk(pk);
          if (m.E < E0 - pad || m.E > E0 + tamBloque + pad || m.N < N0 - pad || m.N > N0 + tamBloque + pad) continue;
          const cx = (m.E - E0) * pxPorM;
          const cy = (1 - (m.N - N0) / tamBloque) * W_CV;
          const nx = -m.ty, ny = m.tx;
          for (const lado of [-1, 1]) {
            const sx = Math.max(0, Math.min(W_CV - rPatch * 2, Math.round(cx + nx * lado * 19 * pxPorM - rPatch)));
            const sy = Math.max(0, Math.min(W_CV - rPatch * 2, Math.round(cy - ny * lado * 19 * pxPorM - rPatch)));
            for (const off of [1.5, 5.5]) {
              const dx = Math.round(cx + nx * lado * off * pxPorM - rPatch);
              const dy = Math.round(cy - ny * lado * off * pxPorM - rPatch);
              ctx.globalAlpha = off < 3 ? 0.92 : 0.72;
              ctx.drawImage(cv, sx, sy, rPatch * 2, rPatch * 2, dx, dy, rPatch * 2, rPatch * 2);
            }
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = Math.min(16, maxAnisotropy || 8);
    return tex;
  }

  return { generarTexturaBloque, vaciarCache: () => cacheImg.clear() };
}
