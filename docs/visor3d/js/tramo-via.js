// Tramo de vía dinámico del tren de trabajo (bateadora → perfiladora → estabilizador)
//
// Unos 170 m de la vía en trabajo dibujados aparte, porque cambian mientras pasan las máquinas: traviesas monobloque
// cada 0,6 m con sus sujeciones, carriles UIC 60 y la superficie del balasto como malla de alturas. La vía fija del
// visor se recorta en esa caja con planos de corte (en los materiales de vía).
//
// Lo que hace cada máquina se expresa con funciones del PK que ella aporta («proveedores»):
//   desviacion(pk) → { v, h }      desplazamiento vertical y lateral de la vía (m)
//   balasto(pk, u, base) → cota    superficie del balasto (m respecto a la cabeza de carril de proyecto), u hacia fuera
//   suciedad(pk) → 0..1            piedra y polvo sobre traviesas y sujeciones
// El balasto se recalcula solo en las filas que las máquinas marcan como «sucias» (donde están sus herramientas).

import * as THREE from 'three';

export const ESPACIADO = 0.6;
export const GALGA = 0.7175;
export const Z_TRAV = -0.16;          // cara superior de la traviesa
export const Z_CAJON = -0.2;          // balasto perfilado en los cajones (entre traviesas)
export const Z_PIE = -0.44;           // pie de la banqueta (coronación del subbalasto)
export const SEMI_BANQUETA = 1.725;   // semiancho de la cara superior
export const TALUD = 1.5;             // talud 1:1,5 (V:H)

// Perfil de proyecto de la banqueta (u: distancia al eje de la vía, positiva hacia fuera; negativa hacia la entrevía)
export function perfilBanqueta(u) {
  const a = Math.abs(u);
  if (a <= SEMI_BANQUETA) return Z_CAJON;
  const y = Z_CAJON - (a - SEMI_BANQUETA) / TALUD;
  return u < 0 ? Math.max(y, -0.32) : Math.max(y, Z_PIE);
}
// Ruido determinista 2D (valor suavizado) para la piedra suelta
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
export function ruido(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
export const suave = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

/**
 * @param {object} o
 * @param {object} o.Eje3D
 * @param {Function} o.aLocal ({E,N,Z}) → Vector3 en el grupo del tajo
 * @param {Function} o.mundo ({E,N,Z}) → Vector3 en la escena (planos de corte)
 * @param {object} o.mats materiales de vía del visor (se recortan)
 * @param {object} o.GEO geometrías del visor (traviesa, placaAsiento, grapa, tirafondo)
 */
export function crearTramoVia({ Eje3D, aLocal, mundo, mats, GEO, atras = 112, delante = 56 }) {
  const grupo = new THREE.Group();
  grupo.name = 'Tramo_Via_Dinamico';
  const N_TRAV = Math.round((atras + delante) / ESPACIADO);
  const PASO_F = 0.12, NF = Math.round(N_TRAV * ESPACIADO / PASO_F) + 1;
  // Columnas del balasto (u hacia fuera): entrevía … cara superior (densa) … talud y pie
  const U = [];
  for (let u = -2.3; u < -1.9; u += 0.2) U.push(u);
  for (let i = 0; i <= 34; i++) U.push(-1.9 + 3.8 * i / 34);
  for (let u = 2.0; u <= 3.31; u += 0.13) U.push(u);
  const NC = U.length;

  const sinCorte = (m) => { const c = m.clone(); c.clippingPlanes = null; return c; };
  const MV = {
    balasto: sinCorte(mats.balasto), traviesa: sinCorte(mats.traviesa), alma: sinCorte(mats.carrilAlma), cabeza: sinCorte(mats.carrilCabeza),
    placa: sinCorte(mats.placa), grapa: sinCorte(mats.grapa), tirafondo: sinCorte(mats.tirafondo),
  };
  MV.balasto.side = THREE.DoubleSide;

  // ---- Traviesas, sujeciones y carriles (instancias que se recolocan cada fotograma) ----
  const imTrav = new THREE.InstancedMesh(GEO.traviesa, MV.traviesa, N_TRAV);
  const imPlaca = new THREE.InstancedMesh(GEO.placaAsiento, MV.placa, N_TRAV);
  const imGrapa = new THREE.InstancedMesh(GEO.grapa, MV.grapa, N_TRAV);
  const imTira = new THREE.InstancedMesh(GEO.tirafondo, MV.tirafondo, N_TRAV);
  const gCab = new THREE.BoxGeometry(1, 0.05, 0.072).translate(0, -0.025, 0);
  const gAlma = new THREE.BoxGeometry(1, 0.11, 0.017).translate(0, -0.105, 0);
  const gPatin = new THREE.BoxGeometry(1, 0.012, 0.15).translate(0, -0.166, 0);
  const imCab = new THREE.InstancedMesh(gCab, MV.cabeza, 2 * (N_TRAV - 1));
  const imAlma = new THREE.InstancedMesh(gAlma, MV.alma, 2 * (N_TRAV - 1));
  const imPatin = new THREE.InstancedMesh(gPatin, MV.alma, 2 * (N_TRAV - 1));
  const todas = [imTrav, imPlaca, imGrapa, imTira, imCab, imAlma, imPatin];
  for (const im of todas) {
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false;
    im.receiveShadow = true;
    grupo.add(im);
  }
  imTrav.castShadow = true;
  // Color por instancia: polvo y piedra sobre traviesas y sujeciones (blanco = limpio)
  const C_LIMPIO = new THREE.Color(1, 1, 1), C_POLVO_T = new THREE.Color('#b9b2a5'), C_POLVO_S = new THREE.Color('#9d978c'), _c = new THREE.Color();
  for (const im of [imTrav, imPlaca, imGrapa, imTira]) { for (let k = 0; k < N_TRAV; k++) im.setColorAt(k, C_LIMPIO); im.instanceColor.setUsage(THREE.DynamicDrawUsage); }
  const ficha = { capa: 'Trabajos de mantenimiento', nombre: 'Vía en trabajo', info: 'Tramo de vía que trabajan la bateadora (levante, ripado y bateo), la perfiladora (perfil de la banqueta y barrido) y el estabilizador (asiento controlado).' };
  for (const im of todas) im.userData = ficha;

  // ---- Balasto: malla de alturas ----
  const gBal = new THREE.BufferGeometry();
  const posB = new Float32Array(NF * NC * 3), norB = new Float32Array(NF * NC * 3), uvB = new Float32Array(NF * NC * 2);
  const altura = new Float32Array(NF * NC);   // cota calculada (local, respecto a la cabeza de carril de proyecto)
  const huella = new Float32Array(NF * NC);   // huellas de los bates (hundimiento)
  const idx = [];
  for (let f = 0; f < NF - 1; f++) for (let c = 0; c < NC - 1; c++) { const a = f * NC + c, b = a + 1, d = a + NC, e = d + 1; idx.push(a, d, b, b, d, e); }
  gBal.setIndex(idx);
  gBal.setAttribute('position', new THREE.BufferAttribute(posB, 3).setUsage(THREE.DynamicDrawUsage));
  gBal.setAttribute('normal', new THREE.BufferAttribute(norB, 3).setUsage(THREE.DynamicDrawUsage));
  gBal.setAttribute('uv', new THREE.BufferAttribute(uvB, 2).setUsage(THREE.DynamicDrawUsage));
  const meshBal = new THREE.Mesh(gBal, MV.balasto);
  meshBal.receiveShadow = true;
  meshBal.frustumCulled = false;
  meshBal.userData = { capa: 'Trabajos de mantenimiento', nombre: 'Balasto', info: 'Banqueta de balasto de la vía en trabajo: suelta y desordenada por delante, perfilada en trapecio con talud 1:1,5 y barrida por detrás de la perfiladora.' };
  grupo.add(meshBal);

  // ---- Estado ----
  let s = -1, pkVentana = 0;
  const base = [];        // por traviesa: { pk, p, dir, izq, dv, dh, suc }
  const filas = [];       // por fila del balasto: { pk, p, dir, izq }
  const prov = { desviacion: [], balasto: null, suciedad: null };
  let sucia = [0, NF - 1];
  const _up = new THREE.Vector3(0, 1, 0);

  function enVia(pk, d = 0) {
    const m = Eje3D.enPk(pk), off = s * m.sep * 0.5 + d;
    return { E: m.E - m.ty * off, N: m.N + m.tx * off, Z: m.Z + 0.022, m };
  }
  function marco(pk) {
    const p = aLocal(enVia(pk)), q = aLocal(enVia(pk + 0.5));
    const dir = q.clone().sub(p).setY(0).normalize();
    return { p, dir, izq: new THREE.Vector3().crossVectors(_up, dir) };
  }
  function desviacion(pk) {
    let v = 0, h = 0;
    for (const f of prov.desviacion) { const d = f(pk); v += d.v; h += d.h; }
    return { v, h };
  }

  // ---- Recorte de la vía fija ----
  const planos = [0, 1, 2, 3, 4, 5].map(() => new THREE.Plane());
  const matsRecorte = Object.values(mats);
  function actualizarCorte() {
    const pkA = pkVentana - 0.25, pkB = pkVentana + (N_TRAV - 1) * ESPACIADO + 0.25;
    const mA = Eje3D.enPk(pkA), mB = Eje3D.enPk(pkB);
    const pA = mundo({ E: mA.E, N: mA.N, Z: mA.Z }), pB = mundo({ E: mB.E, N: mB.N, Z: mB.Z });
    const dir = pB.clone().sub(pA).setY(0).normalize();
    const lado = new THREE.Vector3().crossVectors(_up, dir).multiplyScalar(s);
    planos[0].setFromNormalAndCoplanarPoint(dir.clone().negate(), pA);
    planos[1].setFromNormalAndCoplanarPoint(dir.clone(), pB);
    planos[2].setFromNormalAndCoplanarPoint(lado.clone().negate(), pA.clone().addScaledVector(lado, 0.02));
    planos[3].setFromNormalAndCoplanarPoint(lado.clone(), pA.clone().addScaledVector(lado, mA.sep * 0.5 + 3.4));
    planos[4].setFromNormalAndCoplanarPoint(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, Math.min(pA.y, pB.y) - 0.425, 0));
    planos[5].setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, Math.max(pA.y, pB.y) + 0.6, 0));
  }
  function recortar(on) {
    for (const m of matsRecorte) { m.clippingPlanes = on ? planos : null; m.clipIntersection = on; m.needsUpdate = true; }
  }
  // Tras recentrar el origen del mundo los planos cambian: se recalculan
  function refrescarCorte() { actualizarCorte(); }

  /** Coloca la ventana con su primera traviesa en el índice i0 de la rejilla de 0,6 m. */
  function reanclar(i0) {
    const nuevo = i0 * ESPACIADO, despl = Math.round((nuevo - pkVentana) / PASO_F);
    if (despl > 0 && despl < NF) { huella.copyWithin(0, despl * NC); huella.fill(0, (NF - despl) * NC); } else huella.fill(0);
    pkVentana = nuevo;
    base.length = 0;
    for (let k = 0; k < N_TRAV; k++) base.push({ pk: pkVentana + k * ESPACIADO, ...marco(pkVentana + k * ESPACIADO), dv: 0, dh: 0, suc: 0 });
    filas.length = 0;
    for (let f = 0; f < NF; f++) filas.push({ pk: pkVentana + f * PASO_F, ...marco(pkVentana + f * PASO_F) });
    sucia = [0, NF - 1];
    actualizarCorte();
  }

  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _sc = new THREE.Vector3(1, 1, 1), _bx = new THREE.Matrix4(), _z = new THREE.Vector3(), _y = new THREE.Vector3();
  const ptsR = [[], []];
  function actualizarVia() {
    for (let k = 0; k < N_TRAV; k++) {
      const b = base[k], d = desviacion(b.pk);
      b.dv = d.v; b.dh = d.h;
      b.suc = prov.suciedad ? prov.suciedad(b.pk) : 0;
      _bx.makeBasis(b.dir, _up, _z.copy(b.izq).negate());
      _q.setFromRotationMatrix(_bx);
      _v.copy(b.p).addScaledVector(b.izq, d.h).addScaledVector(_up, d.v + Z_TRAV);
      _m4.compose(_v, _q, _sc);
      imTrav.setMatrixAt(k, _m4); imPlaca.setMatrixAt(k, _m4); imGrapa.setMatrixAt(k, _m4); imTira.setMatrixAt(k, _m4);
      imTrav.setColorAt(k, _c.copy(C_LIMPIO).lerp(C_POLVO_T, b.suc));
      _c.copy(C_LIMPIO).lerp(C_POLVO_S, b.suc);
      imPlaca.setColorAt(k, _c); imGrapa.setColorAt(k, _c); imTira.setColorAt(k, _c);
      for (let r = 0; r < 2; r++) {
        const p = ptsR[r][k] || (ptsR[r][k] = new THREE.Vector3());
        p.copy(b.p).addScaledVector(b.izq, d.h + (r ? GALGA : -GALGA)).addScaledVector(_up, d.v);
      }
    }
    let n = 0;
    for (let r = 0; r < 2; r++) for (let k = 0; k < N_TRAV - 1; k++) {
      const a = ptsR[r][k], b2 = ptsR[r][k + 1];
      _v.subVectors(b2, a);
      const L = _v.length();
      _v.divideScalar(L);
      _z.crossVectors(_v, _up).normalize();
      _y.crossVectors(_z, _v);
      _bx.makeBasis(_v, _y, _z);
      _q.setFromRotationMatrix(_bx);
      _m4.compose(_v.addVectors(a, b2).multiplyScalar(0.5), _q, _sc.set(L + 0.002, 1, 1));
      _sc.set(1, 1, 1);
      imCab.setMatrixAt(n, _m4); imAlma.setMatrixAt(n, _m4); imPatin.setMatrixAt(n, _m4);
      n++;
    }
    for (const im of todas) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  }

  /** Marca para recalcular el balasto entre dos PK. */
  function marcar(pkA, pkB) {
    const fA = Math.floor((Math.min(pkA, pkB) - pkVentana) / PASO_F) - 1, fB = Math.ceil((Math.max(pkA, pkB) - pkVentana) / PASO_F) + 1;
    sucia = [Math.max(0, Math.min(sucia[0], fA)), Math.min(NF - 1, Math.max(sucia[1], fB))];
  }
  function actualizarBalasto() {
    const [f0, f1] = sucia;
    if (f1 < f0) return;
    for (let f = f0; f <= f1; f++) {
      const fr = filas[f], d = desviacion(fr.pk);
      for (let c = 0; c < NC; c++) {
        const u = U[c], i = f * NC + c;
        let y = prov.balasto ? prov.balasto(fr.pk, u, perfilBanqueta(u)) : perfilBanqueta(u);
        // La banqueta acompaña a la vía en su cota (salvo bajo la traviesa levantada, que deja hueco) y en planta
        y += Math.min(0, d.v) + huella[i];
        altura[i] = y;
        const lat = u * s + d.h * 0.4;
        posB[i * 3] = fr.p.x + fr.izq.x * lat; posB[i * 3 + 1] = fr.p.y + y; posB[i * 3 + 2] = fr.p.z + fr.izq.z * lat;
        uvB[i * 2] = (u * s + SEMI_BANQUETA) / (2 * SEMI_BANQUETA); uvB[i * 2 + 1] = fr.pk * 0.25;   // como la cinta del visor
      }
    }
    // Normales por diferencias finitas en las filas tocadas
    for (let f = Math.max(0, f0 - 1); f <= Math.min(NF - 1, f1 + 1); f++) {
      const fr = filas[f];
      for (let c = 0; c < NC; c++) {
        const i = f * NC + c;
        const cA = Math.max(0, c - 1), cB = Math.min(NC - 1, c + 1), fA = Math.max(0, f - 1), fB = Math.min(NF - 1, f + 1);
        const dYdU = (altura[f * NC + cB] - altura[f * NC + cA]) / (U[cB] - U[cA] || 1);
        const dYdX = (altura[fB * NC + c] - altura[fA * NC + c]) / ((fB - fA) * PASO_F || 1);
        // u crece hacia fuera = s·izq
        _v.set(0, 1, 0).addScaledVector(fr.dir, -dYdX).addScaledVector(fr.izq, -dYdU * s).normalize();
        norB[i * 3] = _v.x; norB[i * 3 + 1] = _v.y; norB[i * 3 + 2] = _v.z;
      }
    }
    gBal.attributes.position.needsUpdate = true;
    gBal.attributes.normal.needsUpdate = true;
    gBal.attributes.uv.needsUpdate = true;
    sucia = [NF, -1];
  }

  /** Hundimiento local de la superficie (bates), con cerco de piedra levantada alrededor. */
  function hundir(pk, uC, radio, prof) {
    const fC = Math.round((pk - pkVentana) / PASO_F), nR = Math.ceil(radio / PASO_F) + 1;
    for (let f = fC - nR; f <= fC + nR; f++) {
      if (f < 0 || f >= NF) continue;
      for (let c = 0; c < NC; c++) {
        const dd = Math.hypot((f - fC) * PASO_F, U[c] - uC) / radio, i = f * NC + c;
        if (dd < 1) huella[i] = Math.min(huella[i], -prof * 0.5 * (1 + Math.cos(Math.PI * dd)));
        else if (dd < 1.5) huella[i] = Math.max(huella[i], 0.014 * (1.5 - dd));
      }
    }
    marcar(pk - radio * 1.6, pk + radio * 1.6);
  }
  function rellenar(pk, uC, radio, resto) {
    const fC = Math.round((pk - pkVentana) / PASO_F), nR = Math.ceil(radio / PASO_F) + 1;
    for (let f = fC - nR; f <= fC + nR; f++) {
      if (f < 0 || f >= NF) continue;
      for (let c = 0; c < NC; c++) { const i = f * NC + c; if (huella[i] < 0) huella[i] *= resto; }
    }
    marcar(pk - radio, pk + radio);
  }
  /** Borra las huellas por detrás de un PK (las arrastra el arado). */
  function borrarHuellas(pkHasta) {
    const fB = Math.min(NF - 1, Math.floor((pkHasta - pkVentana) / PASO_F));
    if (fB >= 0) huella.fill(0, 0, (fB + 1) * NC);
  }

  /** Datos de una traviesa por PK (la más cercana). */
  function traviesa(pk) { return base[Math.max(0, Math.min(N_TRAV - 1, Math.round((pk - pkVentana) / ESPACIADO)))]; }
  /** Punto local sobre la vía en trabajo (desplazamiento lateral u hacia fuera, cota y respecto a la cabeza de carril). */
  function punto(pk, u = 0, y = 0) {
    const fr = filas[Math.max(0, Math.min(NF - 1, Math.round((pk - pkVentana) / PASO_F)))];
    return fr.p.clone().addScaledVector(fr.izq, u * s).addScaledVector(_up, y);
  }
  /** Cota del balasto (local) en un punto ya calculado. */
  function cotaBalasto(pk, u) {
    const f = Math.max(0, Math.min(NF - 1, Math.round((pk - pkVentana) / PASO_F)));
    let c = 0; while (c < NC - 1 && U[c + 1] < u) c++;
    return altura[f * NC + c];
  }

  function montar(via, i0) {
    s = via;
    pkVentana = i0 * ESPACIADO;
    reanclar(i0);
    recortar(true);
  }
  function desmontar() { recortar(false); }

  return {
    grupo, N_TRAV, PASO_F, prov, base, montar, desmontar, reanclar, actualizarVia, actualizarBalasto, marcar, hundir, rellenar, borrarHuellas,
    traviesa, punto, cotaBalasto, enVia, desviacion, refrescarCorte,
    get s() { return s; }, get pkIni() { return pkVentana; }, get pkFin() { return pkVentana + (N_TRAV - 1) * ESPACIADO; },
    marcarTodo() { sucia = [0, NF - 1]; },
  };
}
