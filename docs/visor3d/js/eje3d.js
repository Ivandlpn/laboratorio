import { fmtPk, b64Int16 } from './proyeccion.js';

// Columna vertebral 3D de 164,2 km (paso 20 m, precisión milimétrica + spline cúbico Hermite C¹)
export function crearEje3D(ejeDatos, ramalesReales) {
  const { pkIni, pkFin, paso, n, origen: [E0, N0, Z0], p0, tuneles, subestaciones, bts } = ejeDatos;
  const esc = ejeDatos.escala || 0.01;
  // Viaductos que en realidad son de un ramal (bifurcaciones): la vía principal no va en viaducto en esos PK
  const esDeRamal = (a, b) => (ramalesReales?.ramales || []).some((r) => Math.abs(r.pkEje[0] - a) < 40 && Math.abs(r.pkEje[1] - b) < 40);
  const viaductos = (ejeDatos.viaductos || []).filter(([a, b]) => !esDeRamal(a, b));
  const viaductosInfo = (ejeDatos.viaductosInfo || viaductos.map(([a, b]) => ({ pkIni: a, pkFin: b, nombre: `Viaducto (${Math.round(b - a)} m)` })))
    .filter((v) => !esDeRamal(v.pkIni, v.pkFin));
  const edificios = ejeDatos.edificios || [];
  const de = b64Int16(ejeDatos.de), dn = b64Int16(ejeDatos.dn), dz = b64Int16(ejeDatos.dz), sp = b64Int16(ejeDatos.sep, true);
  const crv = ejeDatos.curv ? b64Int16(ejeDatos.curv) : null;
  const E = new Float64Array(n), N = new Float64Array(n), Z = new Float64Array(n), S = new Float32Array(n), CURV = new Float32Array(n);
  const DE = new Float64Array(n), DN = new Float64Array(n), DZ = new Float64Array(n);
  let ec = p0[0], nc = p0[1], zc = p0[2];
  for (let i = 0; i < n; i++) {
    if (i > 0) { ec += de[i - 1]; nc += dn[i - 1]; zc += dz[i - 1]; }
    E[i] = E0 + ec * esc;
    N[i] = N0 + nc * esc;
    Z[i] = Z0 + zc * esc;
    // sp almacena semientreeje (2,350 m); S[i] guarda el entreeje completo ADIF AV (4,700 m exactos)
    S[i] = sp[i] * esc * 2.0;
    CURV[i] = crv ? crv[i] * 1e-7 : 0;
  }
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      DE[i] = E[1] - E[0]; DN[i] = N[1] - N[0]; DZ[i] = Z[1] - Z[0];
    } else if (i === n - 1) {
      DE[i] = E[n - 1] - E[n - 2]; DN[i] = N[n - 1] - N[n - 2]; DZ[i] = Z[n - 1] - Z[n - 2];
    } else {
      DE[i] = 0.5 * (E[i + 1] - E[i - 1]);
      DN[i] = 0.5 * (N[i + 1] - N[i - 1]);
      DZ[i] = 0.5 * (Z[i + 1] - Z[i - 1]);
    }
  }

  const CELDA = 2000, hashEsp = new Map();
  for (let i = 0; i < n; i += 4) {
    const gx = Math.floor(E[i] / CELDA), gy = Math.floor(N[i] / CELDA);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const k = `${gx + dx},${gy + dy}`;
      let arr = hashEsp.get(k);
      if (!arr) { arr = []; hashEsp.set(k, arr); }
      arr.push(i);
    }
  }

  const buscarTunel = (pk) => {
    for (const t of tuneles) if (pk >= t.pkIni && pk <= t.pkFin) return t;
    return null;
  };
  const buscarViaducto = (pk) => {
    for (const v of viaductos) if (pk >= v[0] && pk <= v[1]) return v;
    return null;
  };
  const buscarViaductoInfo = (pk) => {
    for (const vi of viaductosInfo) if (pk >= vi.pkIni && pk <= vi.pkFin) return vi;
    return null;
  };

  function enPk(pk) {
    const f = Math.max(0, Math.min(n - 1.0001, (pk - pkIni) / paso));
    const i = Math.floor(f), t = f - i, u = 1 - t, tt = t * t, uu = u * u;
    const h00 = (1 + 2 * t) * uu, h10 = t * uu, h01 = tt * (3 - 2 * t), h11 = tt * (t - 1);
    const dh00 = 6 * t * (t - 1), dh10 = (3 * t - 1) * (t - 1), dh01 = -dh00, dh11 = t * (3 * t - 2);
    const dx = dh00 * E[i] + dh10 * DE[i] + dh01 * E[i + 1] + dh11 * DE[i + 1];
    const dy = dh00 * N[i] + dh10 * DN[i] + dh01 * N[i + 1] + dh11 * DN[i + 1];
    const dz = dh00 * Z[i] + dh10 * DZ[i] + dh01 * Z[i + 1] + dh11 * DZ[i + 1];
    const ds = Math.hypot(dx, dy) || paso;
    const curv = CURV[i] * u + CURV[i + 1] * t;
    const peralte = Math.max(-0.093, Math.min(0.093, curv * 110));
    return {
      pk,
      E: h00 * E[i] + h10 * DE[i] + h01 * E[i + 1] + h11 * DE[i + 1],
      N: h00 * N[i] + h10 * DN[i] + h01 * N[i + 1] + h11 * DN[i + 1],
      Z: h00 * Z[i] + h10 * DZ[i] + h01 * Z[i + 1] + h11 * DZ[i + 1],
      sep: S[i] * u + S[i + 1] * t,
      tx: dx / ds,
      ty: dy / ds,
      pend: (dz / ds) * 1000,
      curv,
      peralte,
      enTunel: buscarTunel(pk),
      enViaducto: buscarViaducto(pk),
      viaductoInfo: buscarViaductoInfo(pk),
    };
  }

  function proyUTM(px, py) {
    const cands = hashEsp.get(`${Math.floor(px / CELDA)},${Math.floor(py / CELDA)}`);
    let iMejor = 0, dMejor = 1e30;
    if (cands) {
      for (let k = 0; k < cands.length; k++) {
        const idx = cands[k], d2 = (px - E[idx]) ** 2 + (py - N[idx]) ** 2;
        if (d2 < dMejor) { dMejor = d2; iMejor = idx; }
      }
    } else {
      for (let i = 0; i < n; i += 20) {
        const d2 = (px - E[i]) ** 2 + (py - N[i]) ** 2;
        if (d2 < dMejor) { dMejor = d2; iMejor = i; }
      }
    }
    const a = Math.max(0, iMejor - 6), b = Math.min(n - 2, iMejor + 6);
    let bestPk = pkIni + iMejor * paso, bestD2 = 1e30, bestOf = 0, bestZ = Z[iMejor];
    for (let i = a; i <= b; i++) {
      const vx = E[i + 1] - E[i], vy = N[i + 1] - N[i], l2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((px - E[i]) * vx + (py - N[i]) * vy) / l2));
      const qx = E[i] + t * vx, qy = N[i] + t * vy;
      const dx = px - qx, dy = py - qy, d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestPk = pkIni + (i + t) * paso;
        bestZ = Z[i] + t * (Z[i + 1] - Z[i]);
        const l = Math.sqrt(l2) || 1;
        bestOf = (-vy * dx + vx * dy) / l;
      }
    }
    const bestDist = Math.sqrt(bestD2);
    return { pk: bestPk, Z: bestZ, of: bestOf, d: bestDist, enTunel: buscarTunel(bestPk), enViaducto: buscarViaducto(bestPk), viaductoInfo: buscarViaductoInfo(bestPk) };
  }

  function proximoHito(pk, sentido) {
    let mejor = null;
    const probar = (pkObj, texto) => {
      const d = (pkObj - pk) * sentido;
      if (d > 20 && d < 6000 && (!mejor || d < mejor.d)) mejor = { d, texto };
    };
    for (const t of tuneles) probar(sentido > 0 ? t.pkIni : t.pkFin, t.nombre);
    for (const vi of viaductosInfo) if (vi.pkFin - vi.pkIni >= 180) probar(sentido > 0 ? vi.pkIni : vi.pkFin, vi.nombre);
    for (const ed of edificios) if (ed.cat === 'estacion' || ed.cat === 'base' || ed.cat === 'energia') probar(ed.pk, ed.nombre);
    for (const b of bts) probar(b, 'BTS GSM-R');
    return mejor;
  }

  const btsInfo = (bts || []).map((pkBts, idx) => {
    const codBts = `ALA${String(Math.floor(idx / 2) + 1).padStart(2, '0')}${idx % 2 === 0 ? 'A' : 'B'}`;
    const ed = (edificios || []).find((e) => e.cat === 'bts' && Math.abs(e.pk - pkBts) < 260);
    if (ed) return { pk: pkBts, e: ed.e, n: ed.n, nombre: ed.nombre, sub: ed.sub || `GSM-R · PK ${fmtPk(pkBts)}`, cat: 'bts', id: ed.id || codBts };
    const m = enPk(pkBts);
    const nx = -m.ty, ny = m.tx;
    // Sin edificio BTS en la cartografía: posición (18,5 m a la izquierda del eje) y código supuestos
    return {
      pk: pkBts,
      e: m.E + nx * 18.5,
      n: m.N + ny * 18.5,
      nombre: `Caseta BTS ${codBts}`,
      sub: `GSM-R · PK ${fmtPk(pkBts)} · posición y código supuestos`,
      cat: 'bts',
      id: codBts,
      supuesto: true,
    };
  });

  const saltos = (ejeDatos.saltos || []).slice();
  const idxInsert = saltos.findIndex((s) => s.pk > 327730);
  const hitoAti = { id: 'ati327', pk: 327730, nombre: 'ATI 327.7 ADIF', sub: 'PK 327+730 · Centro 2×25 kV' };
  if (idxInsert >= 0) saltos.splice(idxInsert, 0, hitoAti);
  else saltos.push(hitoAti);

  function velocidadLimite(pk) {
    const i0 = Math.max(0, Math.min(n - 1, Math.round((pk - pkIni) / paso)));
    let maxCurv = 0;
    for (let k = Math.max(0, i0 - 2); k <= Math.min(n - 1, i0 + 2); k++) {
      maxCurv = Math.max(maxCurv, Math.abs(CURV[k]));
    }
    let vMax = 300;
    if (maxCurv > 1e-5) {
      const r = 1 / maxCurv;
      vMax = Math.min(vMax, Math.sqrt(r * 1.35) * 3.6);
    }
    if (pk >= 435100 && pk <= 436300) vMax = Math.min(vMax, 220);
    if (pk >= 484200) vMax = Math.min(vMax, pk >= 485400 ? 80 : 140);
    return Math.max(60, Math.round(vMax / 5) * 5);
  }

  return { pkIni, pkFin, paso, n, E, N, Z, S, CURV, tuneles, viaductos, viaductosInfo, edificios, subestaciones, bts, btsInfo, saltos, enPk, proyUTM, proximoHito, buscarViaductoInfo, velocidadLimite };
}
