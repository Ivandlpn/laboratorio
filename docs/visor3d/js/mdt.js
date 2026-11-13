import { b64Int16 } from './proyeccion.js';

// Gestor del Modelo Digital del Terreno Real (IGN PNOA-LiDAR MDT25 + MDT05)
export function crearMdtCorredor({ RUTA, mdtIndex, mdt5Index }) {
  const disponibles = new Set(mdtIndex?.teselas || []);
  const tamM = mdtIndex?.tamMacro || 4800;
  const cargadas = new Map();
  const enVuelo = new Set();

  let reg = null;
  if (mdtIndex?.regional) {
    const r = mdtIndex.regional, u16 = b64Int16(r.z, true), f32 = new Float32Array(u16.length);
    for (let i = 0; i < u16.length; i++) f32[i] = r.zMinM + u16[i];
    reg = { e0: r.e0, n0: r.n0, paso: r.paso, nx: r.nx, ny: r.ny, Z: f32 };
  }

  function cotaRegional(E, N) {
    if (!reg) return null;
    const fx = Math.max(0, Math.min(reg.nx - 1.001, (E - reg.e0) / reg.paso));
    const fy = Math.max(0, Math.min(reg.ny - 1.001, (N - reg.n0) / reg.paso));
    const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
    const Z = reg.Z, nx = reg.nx;
    const a = Z[j * nx + i], b = Z[j * nx + i + 1], c = Z[(j + 1) * nx + i], d = Z[(j + 1) * nx + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  }

  async function pedirMacro(bx, by, alCargar) {
    const k = `${bx}_${by}`;
    if (!disponibles.has(k) || cargadas.has(k) || enVuelo.has(k)) return;
    enVuelo.add(k);
    try {
      const r = await fetch(`${RUTA}/mdt/${k}.json`);
      if (!r.ok) return;
      const d = await r.json();
      const u16 = b64Int16(d.z, true), f32 = new Float32Array(u16.length);
      for (let i = 0; i < u16.length; i++) f32[i] = (d.zMinDm + u16[i]) * 0.1;
      cargadas.set(k, { bx, by, e0: d.e0, n0: d.n0, paso: d.paso, n: d.n, Z: f32 });
      if (cargadas.size > 18) cargadas.delete(cargadas.keys().next().value);
      if (alCargar) alCargar(d.e0, d.n0, d.e0 + tamM, d.n0 + tamM);
    } catch {} finally {
      enVuelo.delete(k);
    }
  }

  const tamF = mdt5Index?.tam || 480;
  const finasDisp = new Set(mdt5Index?.teselas || []);
  const finas = new Map();
  const finasEnVuelo = new Set();
  const FUNDIDO_F = 140;

  async function pedirFina(bx, by, alCargar) {
    const k = `${bx}_${by}`;
    if (!finasDisp.has(k) || finas.has(k) || finasEnVuelo.has(k)) return;
    finasEnVuelo.add(k);
    try {
      const r = await fetch(`${RUTA}/mdt5/${k}.json`);
      if (!r.ok) return;
      const d = await r.json();
      const u16 = b64Int16(d.z, true), f32 = new Float32Array(u16.length);
      for (let i = 0; i < u16.length; i++) f32[i] = (d.zMinDm + u16[i]) * 0.1;
      finas.set(k, { e0: d.e0, n0: d.n0, paso: d.paso, n: d.n, Z: f32 });
      if (finas.size > 64) finas.delete(finas.keys().next().value);
      if (alCargar) alCargar(d.e0 - FUNDIDO_F, d.n0 - FUNDIDO_F, d.e0 + tamF + FUNDIDO_F, d.n0 + tamF + FUNDIDO_F);
    } catch {} finally {
      finasEnVuelo.delete(k);
    }
  }

  function bilineal(m, E, N) {
    const fx = Math.max(0, Math.min(m.n - 1.001, (E - m.e0) / m.paso));
    const fy = Math.max(0, Math.min(m.n - 1.001, (N - m.n0) / m.paso));
    const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j, n = m.n, Z = m.Z;
    const a = Z[j * n + i], b = Z[j * n + i + 1], c = Z[(j + 1) * n + i], d = Z[(j + 1) * n + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  }

  function tieneFina(bx, by) { return finas.has(`${bx}_${by}`); }

  function asegurarEntorno(centroE, centroN, alCargar) {
    const bx0 = Math.floor(centroE / tamM), by0 = Math.floor(centroN / tamM);
    const proms = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      proms.push(pedirMacro(bx0 + dx, by0 + dy, alCargar));
    }
    if (finasDisp.size) {
      const fx0 = Math.floor(centroE / tamF), fy0 = Math.floor(centroN / tamF);
      for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) proms.push(pedirFina(fx0 + dx, fy0 + dy, alCargar));
    }
    return Promise.all(proms);
  }

  function asegurarCaja(minE, minN, maxE, maxN) {
    const proms = [];
    for (let bx = Math.floor(minE / tamM); bx <= Math.floor(maxE / tamM); bx++) {
      for (let by = Math.floor(minN / tamM); by <= Math.floor(maxN / tamM); by++) proms.push(pedirMacro(bx, by));
    }
    if (finasDisp.size) {
      for (let bx = Math.floor(minE / tamF); bx <= Math.floor(maxE / tamF); bx++) {
        for (let by = Math.floor(minN / tamF); by <= Math.floor(maxN / tamF); by++) proms.push(pedirFina(bx, by));
      }
    }
    return Promise.all(proms);
  }

  function cotaGruesa(E, N) {
    const bx = Math.floor(E / tamM), by = Math.floor(N / tamM);
    const m = cargadas.get(`${bx}_${by}`);
    return m ? bilineal(m, E, N) : cotaRegional(E, N);
  }

  function cota(E, N) {
    if (finas.size) {
      const bx = Math.floor(E / tamF), by = Math.floor(N / tamF);
      const f = finas.get(`${bx}_${by}`);
      if (f) {
        const zf = bilineal(f, E, N);
        const lx = E - bx * tamF, ly = N - by * tamF;
        let w = 1;
        if (lx < FUNDIDO_F && !finas.has(`${bx - 1}_${by}`)) w = Math.min(w, lx / FUNDIDO_F);
        if (tamF - lx < FUNDIDO_F && !finas.has(`${bx + 1}_${by}`)) w = Math.min(w, (tamF - lx) / FUNDIDO_F);
        if (ly < FUNDIDO_F && !finas.has(`${bx}_${by - 1}`)) w = Math.min(w, ly / FUNDIDO_F);
        if (tamF - ly < FUNDIDO_F && !finas.has(`${bx}_${by + 1}`)) w = Math.min(w, (tamF - ly) / FUNDIDO_F);
        if (w >= 1) return zf;
        const zg = cotaGruesa(E, N);
        if (zg === null) return zf;
        const s = w * w * (3 - 2 * w);
        return zg * (1 - s) + zf * s;
      }
    }
    return cotaGruesa(E, N);
  }

  return { cota, cotaRegional, asegurarEntorno, asegurarCaja, tieneFina };
}

// Índice espacial de cotas de detalle del DXF de Adif (acotado por celda para interpolación en < 10 ms)
export function crearHashCotas() {
  const CELDA = 40, MAX_POR_CELDA = 18, mapa = new Map();
  const clave = (E, N) => `${Math.floor(E / CELDA)},${Math.floor(N / CELDA)}`;
  function insertarKm(km, puntos) {
    for (let i = 0; i < puntos.length; i++) {
      const pt = puntos[i];
      const k = clave(pt[0], pt[1]);
      let arr = mapa.get(k);
      if (!arr) { arr = []; mapa.set(k, arr); }
      if (arr.length < MAX_POR_CELDA) arr.push(pt);
    }
  }
  function quitarKm(km) {
    for (const [k, arr] of mapa) {
      const f = arr.filter((p) => p[3] !== km);
      if (f.length) mapa.set(k, f); else mapa.delete(k);
    }
  }
  function interpolar(E, N) {
    const gx = Math.floor(E / CELDA), gy = Math.floor(N / CELDA);
    let sw = 0, sz = 0, dMin2 = 1e30;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const arr = mapa.get(`${gx + dx},${gy + dy}`);
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i], d2 = (E - p[0]) ** 2 + (N - p[1]) ** 2;
        if (d2 > 9000) continue;
        if (d2 < dMin2) dMin2 = d2;
        const w = 1 / (d2 + 9);
        sw += w; sz += w * p[2];
      }
    }
    return sw > 0 ? { z: sz / sw, confianza: Math.min(1, Math.max(0, 1 - Math.sqrt(dMin2) / 92)) } : null;
  }
  return { insertarKm, quitarKm, interpolar };
}
