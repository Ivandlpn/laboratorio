// Simulación de la bateadora-niveladora-alineadora: ciclo de levante, ripado y bateo traviesa a traviesa
//
// Vía de alta velocidad (carriles UIC 60, traviesas monobloque de hormigón cada 0,6 m) sobre balasto deformable.
// Por delante de la máquina la vía tiene defectos de nivelación (asientos) y de alineación; por detrás queda en su
// geometría de proyecto. La máquina trabaja en modo «stop & go», una traviesa por ciclo:
//
//   Avance → Agarre → Levante y ripado → Descenso de bates → Vibración (35 Hz) → Cierre → Apertura y ascenso → Avance…
//
// Donde trabaja, la vía fija del visor se recorta con planos de corte (materiales de vía) y se sustituye por un tramo
// propio de unos 90 m que sí se deforma: traviesas, sujeciones, carriles y la superficie del balasto (malla de alturas).
//
// Jerarquía de la máquina (THREE.Group con nombre): Root_Chassis › Bogies, Sistema_Medicion (carros delantero, central
// y trasero con la cuerda láser), Unidad_Levante_Ripado (cilindros y pinzas de rodillos) y Grupos_de_Bateo (un
// bastidor por carril con 8 bates en pares enfrentados). Ejes locales: X hacia delante (PK creciente), Y arriba, Z a la
// izquierda; origen sobre el eje de la vía a la cota de la cabeza de carril.

import * as THREE from 'three';

const ESPACIADO = 0.6;              // m entre traviesas
const N_TRAV = 150;                 // traviesas del tramo dinámico (90 m)
const DETRAS = 34;                  // m del tramo por detrás del grupo de bateo
const GALGA = 0.7175;               // semiancho entre ejes de carril (1.435 / 2)
const Z_TRAV = -0.16;               // cara superior de la traviesa respecto a la cabeza de carril
const Z_BAL = -0.23;                // superficie del balasto en los cajones
const ANCHO_BAL = 3.45, TALUD = 0.85, Z_PIE = -0.44;
const FASES = [                     // estado, duración (s)
  ['avance', 0.75], ['agarre', 0.22], ['levante', 0.4], ['descenso', 0.32], ['vibracion', 0.38], ['cierre', 0.45], ['retirada', 0.36],
];
const T_CICLO = FASES.reduce((a, f) => a + f[1], 0);
export const NOMBRE_FASE = {
  avance: 'Avance a la traviesa', agarre: 'Agarre del carril', levante: 'Levante y ripado', descenso: 'Descenso de bates',
  vibracion: 'Vibración (35 Hz)', cierre: 'Cierre: compresión del balasto', retirada: 'Apertura y ascenso',
};
export const VEL_MEDIA_BATEO = ESPACIADO / T_CICLO;   // m/s
const suave = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

// Defectos de la vía sin batear (m): asientos verticales (negativos) y desplazamiento lateral, deterministas por PK
function defectoV(pk) {
  return -(0.011 + 0.006 * Math.sin(pk * 2 * Math.PI / 9.7) + 0.005 * Math.sin(pk * 2 * Math.PI / 23.3 + 1.1) + 0.003 * Math.sin(pk * 2 * Math.PI / 4.1 + 0.4));
}
function defectoH(pk) {
  return 0.009 * Math.sin(pk * 2 * Math.PI / 17.9 + 0.7) + 0.005 * Math.sin(pk * 2 * Math.PI / 7.3 + 2.1);
}

/**
 * @param {object} o
 * @param {object} o.Eje3D
 * @param {Function} o.aLocal  ({E,N,Z}) → Vector3 en el grupo del tajo
 * @param {object} o.mats  materiales de la vía del visor (se recortan) { balasto, traviesa, carrilAlma, carrilCabeza, placa, grapa, tirafondo }
 * @param {object} o.GEO   geometrías compartidas del visor { traviesa, placaAsiento, grapa, tirafondo }
 * @param {Function} o.mat  constructor de materiales
 * @param {Function} o.mundo ({E,N,Z}) → Vector3 en coordenadas de escena (para los planos de corte)
 * @param {Function} [o.audioActivo] () → boolean
 */
export function crearSimulacionBateo({ Eje3D, aLocal, mats, GEO, mat, mundo, audioActivo = () => false }) {
  const grupo = new THREE.Group();
  grupo.name = 'Simulacion_Bateo';

  // ---- Materiales propios (copias sin recorte) ----
  const sinCorte = (m) => { const c = m.clone(); c.clippingPlanes = null; return c; };
  const MV = {
    balasto: sinCorte(mats.balasto), traviesa: sinCorte(mats.traviesa), alma: sinCorte(mats.carrilAlma), cabeza: sinCorte(mats.carrilCabeza),
    placa: sinCorte(mats.placa), grapa: sinCorte(mats.grapa), tirafondo: sinCorte(mats.tirafondo),
  };
  MV.balasto.side = THREE.DoubleSide;
  const M = {
    amarillo: mat('#f2b705', 1, { roughness: 0.55, metalness: 0.2 }),
    gris: mat('#4b5563', 1, { roughness: 0.6, metalness: 0.4 }),
    oscuro: mat('#1f2429', 1, { roughness: 0.7, metalness: 0.35 }),
    acero: mat('#a9b1ba', 1, { roughness: 0.3, metalness: 0.85 }),
    cromo: mat('#d9dee3', 1, { roughness: 0.15, metalness: 0.95 }),
    azul: mat('#2f5d8a', 1, { roughness: 0.5, metalness: 0.3 }),
    rojo: mat('#c81e1e', 1, { roughness: 0.5, metalness: 0.2 }),
    cristal: mat('#0f1b2b', 1, { roughness: 0.1, metalness: 0.6 }),
    faro: new THREE.MeshBasicMaterial({ color: '#fff6dc' }),
    destello: new THREE.MeshBasicMaterial({ color: '#ffa31a' }),
    destelloApagado: mat('#7a4a10', 1, { roughness: 0.5 }),
    laser: new THREE.MeshBasicMaterial({ color: '#ff2b2b' }),
    fantasma: new THREE.MeshBasicMaterial({ color: '#c6ccd2', transparent: true, opacity: 0.28, depthWrite: false }),
    piedra: mat('#8d8a84', 1, { roughness: 0.95 }),
  };
  const caja = (sx, sy, sz, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); me.castShadow = true; return me; };
  const cil = (r, h, m, x = 0, y = 0, z = 0, eje = 'y', seg = 14) => {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
    me.position.set(x, y, z);
    if (eje === 'z') me.rotation.x = Math.PI / 2; else if (eje === 'x') me.rotation.z = Math.PI / 2;
    return me;
  };

  // =====================================================================================================
  // Tramo dinámico de vía
  // =====================================================================================================
  let s = -1, pkVentana = 0;                       // vía (+1 izq., −1 der.) y PK de la primera traviesa del tramo
  const base = [];                                 // por traviesa: { pk, p (local), dir, izq }
  const imTrav = new THREE.InstancedMesh(GEO.traviesa, MV.traviesa, N_TRAV);
  const imPlaca = new THREE.InstancedMesh(GEO.placaAsiento, MV.placa, N_TRAV);
  const imGrapa = new THREE.InstancedMesh(GEO.grapa, MV.grapa, N_TRAV);
  const imTira = new THREE.InstancedMesh(GEO.tirafondo, MV.tirafondo, N_TRAV);
  // Carril UIC 60 por tramos entre traviesas: cabeza, alma y patín (geometría de 1 m que se escala en X)
  const gCab = new THREE.BoxGeometry(1, 0.05, 0.072).translate(0, -0.025, 0);
  const gAlma = new THREE.BoxGeometry(1, 0.11, 0.017).translate(0, -0.105, 0);
  const gPatin = new THREE.BoxGeometry(1, 0.012, 0.15).translate(0, -0.166, 0);
  const imCab = new THREE.InstancedMesh(gCab, MV.cabeza, 2 * (N_TRAV - 1));
  const imAlma = new THREE.InstancedMesh(gAlma, MV.alma, 2 * (N_TRAV - 1));
  const imPatin = new THREE.InstancedMesh(gPatin, MV.alma, 2 * (N_TRAV - 1));
  for (const im of [imTrav, imPlaca, imGrapa, imTira, imCab, imAlma, imPatin]) {
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false;
    im.castShadow = im === imTrav;
    im.receiveShadow = true;
    grupo.add(im);
  }
  imTrav.userData = { capa: 'Trabajos de mantenimiento', nombre: 'Traviesa monobloque de hormigón', info: 'Tramo de vía en trabajo: por delante de la bateadora con defectos de nivelación y alineación; por detrás, en su geometría de proyecto.' };

  // Balasto: malla de alturas (filas cada 0,1 m a lo largo, columnas a lo ancho de la banqueta con sus taludes)
  const PASO_F = 0.1, NF = Math.round(N_TRAV * ESPACIADO / PASO_F) + 1;
  const LAT = [];
  const nTop = 30;
  LAT.push(-(ANCHO_BAL / 2 + TALUD));
  for (let i = 0; i <= nTop; i++) LAT.push(-ANCHO_BAL / 2 + ANCHO_BAL * i / nTop);
  LAT.push(ANCHO_BAL / 2 + TALUD);
  const NC = LAT.length;
  const deform = new Float32Array(NF * NC);         // hundimiento (−) o abombamiento (+) de la superficie, m
  const gBal = new THREE.BufferGeometry();
  const posBal = new Float32Array(NF * NC * 3), uvBal = new Float32Array(NF * NC * 2);
  const idx = [];
  for (let f = 0; f < NF - 1; f++) for (let c = 0; c < NC - 1; c++) {
    const a = f * NC + c, b = a + 1, d = a + NC, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  gBal.setIndex(idx);
  gBal.setAttribute('position', new THREE.BufferAttribute(posBal, 3).setUsage(THREE.DynamicDrawUsage));
  gBal.setAttribute('uv', new THREE.BufferAttribute(uvBal, 2));
  const meshBal = new THREE.Mesh(gBal, MV.balasto);
  meshBal.receiveShadow = true;
  meshBal.frustumCulled = false;
  meshBal.userData = { capa: 'Trabajos de mantenimiento', nombre: 'Balasto en bateo', info: 'Banqueta de balasto: los bates penetran en los cajones entre traviesas y compactan la piedra bajo ellas.' };
  grupo.add(meshBal);
  const filasBase = [];                            // por fila: { p, izq, dir } (local)
  let filasSucias = [0, NF - 1];

  // Estado geométrico
  let pkHecho = -Infinity;                         // PK de la última traviesa bateada (por detrás, vía perfecta)
  let iActual = 0;                                 // índice (en la vía) de la traviesa en bateo
  const pkTrav = (i) => i * ESPACIADO;              // PK de la traviesa i (rejilla global de 0,6 m)

  function enVia(pk, d = 0) {
    const m = Eje3D.enPk(pk), off = s * m.sep * 0.5 + d;
    return { E: m.E - m.ty * off, N: m.N + m.tx * off, Z: m.Z + 0.022, m };
  }
  const _up = new THREE.Vector3(0, 1, 0);
  function marcoLocal(pk) {
    const p = aLocal(enVia(pk)), q = aLocal(enVia(pk + 0.5));
    const dir = q.clone().sub(p).setY(0).normalize();
    const izq = new THREE.Vector3().crossVectors(_up, dir);
    return { p, dir, izq };
  }

  // (Re)coloca el tramo a partir de la traviesa i0
  function reanclar(i0) {
    const desplF = Math.round((pkTrav(i0) - pkVentana) / PASO_F);
    pkVentana = pkTrav(i0);
    base.length = 0;
    for (let k = 0; k < N_TRAV; k++) base.push({ pk: pkVentana + k * ESPACIADO, ...marcoLocal(pkVentana + k * ESPACIADO) });
    // Las deformaciones del balasto se desplazan con la ventana
    if (desplF > 0 && desplF < NF) { deform.copyWithin(0, desplF * NC); deform.fill(0, (NF - desplF) * NC); }
    else deform.fill(0);
    filasBase.length = 0;
    for (let f = 0; f < NF; f++) filasBase.push(marcoLocal(pkVentana + f * PASO_F));
    filasSucias = [0, NF - 1];
    actualizarCorte();
  }

  // Desviación de la vía (vertical v y lateral h, m) en un PK, con el efecto de la unidad de levante
  const geo = { levante: 0, levObj: 0, ripObj: 0 };
  function defectoTramo(pk) {
    if (pk <= pkHecho + 1e-6) return { v: 0, h: 0 };
    const fin = pkVentana + N_TRAV * ESPACIADO;
    const k = 1 - suave((pk - (fin - 12)) / 10);         // los defectos se apagan al final del tramo
    return { v: defectoV(pk) * k, h: defectoH(pk) * k };
  }
  function desviacion(pk) {
    let { v, h } = defectoTramo(pk);
    if (geo.levante > 0) {
      // El carril es continuo: el levante se reparte en unos ±7 m alrededor de las pinzas
      const x = (pk - pkPinzas()) / 7;
      if (Math.abs(x) < 1) {
        const w = 0.5 * (1 + Math.cos(Math.PI * x));
        v += geo.levante * (geo.levObj - 0) * w;
        h += geo.levante * geo.ripObj * w;
      }
    }
    return { v, h };
  }

  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _sc = new THREE.Vector3(1, 1, 1), _bx = new THREE.Matrix4();
  const ptsCarril = [[], []];
  function actualizarVia() {
    for (let k = 0; k < N_TRAV; k++) {
      const b = base[k], d = desviacion(b.pk);
      b.dv = d.v; b.dh = d.h;
      _bx.makeBasis(b.dir, _up, _z.copy(b.izq).negate());
      _q.setFromRotationMatrix(_bx);
      _v.copy(b.p).addScaledVector(b.izq, d.h).addScaledVector(_up, d.v + Z_TRAV);
      _m4.compose(_v, _q, _sc);
      imTrav.setMatrixAt(k, _m4); imPlaca.setMatrixAt(k, _m4); imGrapa.setMatrixAt(k, _m4); imTira.setMatrixAt(k, _m4);
      for (let r = 0; r < 2; r++) {
        const p = ptsCarril[r][k] || (ptsCarril[r][k] = new THREE.Vector3());
        p.copy(b.p).addScaledVector(b.izq, d.h + (r ? GALGA : -GALGA)).addScaledVector(_up, d.v);
      }
    }
    let n = 0;
    for (let r = 0; r < 2; r++) for (let k = 0; k < N_TRAV - 1; k++) {
      const a = ptsCarril[r][k], b2 = ptsCarril[r][k + 1];
      const dx = b2.x - a.x, dy = b2.y - a.y, dz = b2.z - a.z, L = Math.hypot(dx, dy, dz);
      const dir = _v.set(dx / L, dy / L, dz / L);
      const z = new THREE.Vector3().crossVectors(dir, _up).normalize();
      const y = new THREE.Vector3().crossVectors(z, dir);
      _bx.makeBasis(dir, y, z);
      _q.setFromRotationMatrix(_bx);
      _m4.compose(new THREE.Vector3((a.x + b2.x) / 2, (a.y + b2.y) / 2, (a.z + b2.z) / 2), _q, new THREE.Vector3(L + 0.002, 1, 1));
      imCab.setMatrixAt(n, _m4); imAlma.setMatrixAt(n, _m4); imPatin.setMatrixAt(n, _m4);
      n++;
    }
    for (const im of [imTrav, imPlaca, imGrapa, imTira, imCab, imAlma, imPatin]) im.instanceMatrix.needsUpdate = true;
  }

  // Superficie del balasto: sigue a la vía (la banqueta acompaña al levante) más las huellas del bateo
  let corteActivo = false;
  function actualizarBalasto(todo = false) {
    const [f0, f1] = todo ? [0, NF - 1] : filasSucias;
    for (let f = Math.max(0, f0); f <= Math.min(NF - 1, f1); f++) {
      const fb = filasBase[f], pk = pkVentana + f * PASO_F;
      const d = desviacion(pk);
      // Bajo la traviesa levantada el balasto se queda abajo (hueco) hasta que se batea
      const ladoCorte = corteActivo && Math.abs(pk - pkBateo()) < 3.2;
      for (let c = 0; c < NC; c++) {
        const lat = LAT[c];
        let y = c === 0 || c === NC - 1 ? Z_PIE : Z_BAL;
        y += defectoTramo(pk).v + deform[f * NC + c];
        // Vista en corte: banqueta rebajada por el lado exterior junto al grupo de bateo
        if (ladoCorte && lat * s > 1.32) y = Math.min(y, -0.5);
        const o = (f * NC + c) * 3;
        posBal[o] = fb.p.x + fb.izq.x * (lat + d.h * 0.4);
        posBal[o + 1] = fb.p.y + y;
        posBal[o + 2] = fb.p.z + fb.izq.z * (lat + d.h * 0.4);
        uvBal[(f * NC + c) * 2] = (c / (NC - 1)) * 1.6;
        uvBal[(f * NC + c) * 2 + 1] = pk * 0.25;
      }
    }
    gBal.attributes.position.needsUpdate = true;
    if (todo) { gBal.attributes.uv.needsUpdate = true; gBal.computeVertexNormals(); }
    else if ((nNorm++ & 7) === 0) gBal.computeVertexNormals();
    filasSucias = [NF, -1];
  }
  let nNorm = 0;
  function hundir(pk, lat, radio, prof) {
    const fC = Math.round((pk - pkVentana) / PASO_F), nR = Math.ceil(radio / PASO_F) + 1;
    for (let f = fC - nR; f <= fC + nR; f++) {
      if (f < 0 || f >= NF) continue;
      for (let c = 1; c < NC - 1; c++) {
        const dd = Math.hypot((f - fC) * PASO_F, LAT[c] - lat) / radio;
        if (dd < 1) {
          const w = 0.5 * (1 + Math.cos(Math.PI * dd));
          const i = f * NC + c;
          deform[i] = Math.min(deform[i], -prof * w);
        }
        else if (dd < 1.5) deform[f * NC + c] = Math.max(deform[f * NC + c], 0.012 * (1.5 - dd));   // cerco de piedra levantada
      }
    }
    filasSucias = [Math.min(filasSucias[0], fC - nR), Math.max(filasSucias[1], fC + nR)];
  }
  function rellenar(pk, lat, radio, resto) {
    const fC = Math.round((pk - pkVentana) / PASO_F), nR = Math.ceil(radio / PASO_F) + 1;
    for (let f = fC - nR; f <= fC + nR; f++) {
      if (f < 0 || f >= NF) continue;
      for (let c = 1; c < NC - 1; c++) { const i = f * NC + c; if (deform[i] < 0) deform[i] *= resto; }
    }
    filasSucias = [Math.min(filasSucias[0], fC - nR), Math.max(filasSucias[1], fC + nR)];
  }

  // ---- Recorte de la vía fija del visor en la caja del tramo dinámico ----
  const planos = [0, 1, 2, 3, 4, 5].map(() => new THREE.Plane());
  const matsRecorte = Object.values(mats);
  function actualizarCorte() {
    // Caja en coordenadas de escena: a lo largo de la ventana, de entrevía a fuera de la banqueta y de −0,42 a +0,6
    const pkA = pkVentana - 0.25, pkB = pkVentana + (N_TRAV - 1) * ESPACIADO + 0.25;
    const mA = Eje3D.enPk(pkA), mB = Eje3D.enPk(pkB);
    const pA = mundo({ E: mA.E, N: mA.N, Z: mA.Z }), pB = mundo({ E: mB.E, N: mB.N, Z: mB.Z });
    const dir = pB.clone().sub(pA).setY(0).normalize();
    const izq = new THREE.Vector3().crossVectors(_up, dir);
    const lado = izq.clone().multiplyScalar(s);     // hacia la vía en trabajo
    const p0 = pA.clone();
    // Normales hacia fuera de la caja (con clipIntersection se recorta lo que queda dentro de todos)
    planos[0].setFromNormalAndCoplanarPoint(dir.clone().negate(), p0);
    planos[1].setFromNormalAndCoplanarPoint(dir.clone(), pB);
    planos[2].setFromNormalAndCoplanarPoint(lado.clone().negate(), p0.clone().addScaledVector(lado, 0.02));
    planos[3].setFromNormalAndCoplanarPoint(lado.clone(), p0.clone().addScaledVector(lado, mA.sep * 0.5 + ANCHO_BAL / 2 + TALUD + 0.3));
    planos[4].setFromNormalAndCoplanarPoint(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, Math.min(pA.y, pB.y) - 0.425, 0));
    planos[5].setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, Math.max(pA.y, pB.y) + 0.6, 0));
  }
  function aplicarRecorte(on) {
    for (const m of matsRecorte) {
      m.clippingPlanes = on ? planos : null;
      m.clipIntersection = on;
      m.needsUpdate = true;
    }
  }

  // =====================================================================================================
  // La máquina
  // =====================================================================================================
  const L = 27.5, XB = 4.6, XL = 6.6;               // largo, grupo de bateo y unidad de levante (desde el centro)
  const raiz = new THREE.Group(); raiz.name = 'Root_Chassis';
  // Chasis, cabinas y carrocería
  raiz.add(caja(L, 0.45, 2.7, M.amarillo, 0, 1.25, 0), caja(L, 0.12, 2.72, M.rojo, 0, 1.13, 0));
  const destellos = [];
  for (const [x, sg] of [[L / 2 - 1.4, 1], [-L / 2 + 1.4, -1]]) {
    const c = new THREE.Group();
    c.add(caja(2.6, 2.3, 2.9, M.amarillo, 0, 2.45, 0), caja(0.06, 0.95, 2.5, M.cristal, sg * 1.31, 2.85, 0), caja(2.7, 0.12, 3.0, M.gris, 0, 3.66, 0));
    for (const z of [-1, 1]) c.add(caja(1.6, 0.8, 0.05, M.cristal, 0, 2.85, z * 1.46), caja(0.05, 0.22, 0.32, M.faro, sg * 1.32, 1.75, z * 0.95));
    for (const z of [-1, 1]) { const d = cil(0.14, 0.26, M.destello, 0, 3.86, z); c.add(d); destellos.push(d); }
    c.position.x = x;
    raiz.add(c);
  }
  raiz.add(caja(10.5, 1.9, 2.75, M.amarillo, -5.2, 2.45, 0), caja(10.4, 0.1, 2.8, M.gris, -5.2, 3.45, 0));
  for (let x = -9.6; x < -0.6; x += 2.2) raiz.add(caja(0.9, 1.1, 0.04, M.oscuro, x, 2.4, 1.39), caja(0.9, 1.1, 0.04, M.oscuro, x, 2.4, -1.39));
  // Cabina de bateo sobre los grupos (el operador mira hacia abajo a los bates)
  raiz.add(caja(3.0, 1.7, 2.8, M.amarillo, XB + 0.2, 2.75, 0), caja(2.6, 0.9, 0.05, M.cristal, XB + 0.2, 2.9, 1.41), caja(2.6, 0.9, 0.05, M.cristal, XB + 0.2, 2.9, -1.41));

  // Bogies
  const bogies = new THREE.Group(); bogies.name = 'Bogies';
  for (const xb of [L / 2 - 2.4, -L / 2 + 2.4, -3.4]) {
    const b = new THREE.Group();
    b.add(caja(2.6, 0.35, 2.2, M.oscuro, 0, 0.62, 0));
    for (const dx of [-0.9, 0.9]) for (const z of [-GALGA, GALGA]) b.add(cil(0.42, 0.14, M.acero, dx, 0.42, z, 'z'));
    b.position.x = xb;
    bogies.add(b);
  }
  raiz.add(bogies);

  // Sistema de medición: carros palpadores (delante, centro y detrás) y cuerda láser entre el delantero y el trasero
  const medicion = new THREE.Group(); medicion.name = 'Sistema_Medicion';
  const carros = [];
  for (const [x, nombre] of [[L / 2 + 2.6, 'Carro_Delantero'], [XB - 2.1, 'Carro_Central'], [-L / 2 - 1.3, 'Carro_Trasero']]) {
    const c = new THREE.Group(); c.name = nombre;
    c.add(caja(0.7, 0.18, 1.9, M.gris, 0, 0.42, 0));
    for (const z of [-GALGA, GALGA]) c.add(cil(0.16, 0.08, M.oscuro, 0, 0.16, z, 'z'));
    c.add(caja(0.25, 0.22, 0.25, M.oscuro, 0, 0.62, 0));
    c.position.x = x;
    medicion.add(c);
    carros.push(c);
  }
  // Brazo de tiro del carro delantero hasta el chasis
  medicion.add(caja(2.4, 0.08, 0.08, M.gris, L / 2 + 1.4, 0.9, 0));
  const laser = caja(1, 0.012, 0.012, M.laser, 0, 0.64, 0);
  medicion.add(laser);
  raiz.add(medicion);

  // Unidad de levante y ripado: por cada carril, bastidor con dos cilindros hidráulicos y pinzas de rodillos
  const levante = new THREE.Group(); levante.name = 'Unidad_Levante_Ripado';
  const pinzas = [], vastagos = [];
  for (const zR of [-GALGA, GALGA]) {
    const u = new THREE.Group();
    u.add(caja(0.9, 0.12, 0.42, M.azul, 0, 0.42, 0));
    for (const dx of [-0.32, 0.32]) {
      u.add(cil(0.07, 0.55, M.azul, dx, 0.82, 0));                         // camisa del cilindro (al chasis)
      const v = cil(0.035, 0.5, M.cromo, dx, 0.5, 0);                     // vástago
      u.add(v); vastagos.push(v);
    }
    // Pinzas: dos rodillos por lado que abrazan la cabeza del carril
    for (const lado of [-1, 1]) {
      const p = new THREE.Group();
      p.add(caja(0.1, 0.32, 0.06, M.oscuro, 0, 0.2, 0));
      for (const dx of [-0.2, 0.2]) p.add(cil(0.05, 0.05, M.acero, dx, 0.04, 0, 'z', 12));
      p.position.z = lado * 0.11;
      p.userData.lado = lado;
      u.add(p); pinzas.push(p);
    }
    u.position.set(XL, 0, zR);
    levante.add(u);
  }
  // Rodillos de ripado (empujan la vía de lado) y rueda guía
  levante.add(caja(0.2, 0.25, 2.0, M.gris, XL + 0.7, 0.55, 0));
  raiz.add(levante);

  // Grupos de bateo: un bastidor por carril que sube y baja, con 8 bates (2 por lado del carril × 2 cajones × par)
  const bateo = new THREE.Group(); bateo.name = 'Grupos_de_Bateo';
  const bastidores = [], bates = [], fantasmas = [];
  const Y_PIVOTE = 1.0, LARGO_BATE = 1.32;
  for (const zR of [-GALGA, GALGA]) {
    const bast = new THREE.Group(); bast.name = 'Bastidor_Bateo';
    bast.add(caja(1.05, 0.55, 0.95, M.azul, 0, Y_PIVOTE + 0.42, 0));        // caja de vibradores
    bast.add(cil(0.09, 0.9, M.gris, 0, Y_PIVOTE + 0.3, 0, 'x'));
    for (const dx of [-0.42, 0.42]) bast.add(cil(0.06, 0.75, M.azul, dx, Y_PIVOTE + 0.5, 0.34, 'x'));   // cilindros de cierre
    bast.add(cil(0.05, 1.4, M.cromo, 0, Y_PIVOTE + 1.35, 0));                // guía vertical
    for (const zl of [-0.17, 0.17]) {        // a cada lado del carril
      for (const sx of [-1, 1]) {           // cajón delantero (+) y trasero (−) de la traviesa: pares enfrentados
        for (const dz of [-0.05, 0.05]) {   // bates dobles
          const piv = new THREE.Group();
          const brazo = caja(0.07, LARGO_BATE, 0.05, M.acero, 0, -LARGO_BATE / 2, 0);
          const pala = caja(0.05, 0.16, 0.09, M.acero, -sx * 0.025, -LARGO_BATE + 0.02, 0);
          const fan = caja(0.13, 0.5, 0.11, M.fantasma, 0, -LARGO_BATE + 0.2, 0);
          fan.visible = false;
          piv.add(brazo, pala, fan);
          piv.position.set(sx * 0.2, Y_PIVOTE, zl + dz);
          piv.userData.sx = sx;
          bast.add(piv);
          bates.push(piv); fantasmas.push(fan);
        }
      }
    }
    bast.position.set(XB, 0, zR);
    bateo.add(bast);
    bastidores.push(bast);
  }
  raiz.add(bateo);
  const fichaMaq = { capa: 'Trabajos de mantenimiento', nombre: 'Bateadora-niveladora-alineadora', info: 'Bateadora de vía (tipo Plasser & Theurer 09-3X) en ciclo de levante, ripado y bateo: levanta y alinea la vía con las pinzas de rodillos y compacta el balasto bajo cada traviesa con 16 bates vibrantes. Modelo de trabajo.' };
  raiz.traverse((n) => { if (n.isMesh) n.userData = fichaMaq; });
  grupo.add(raiz);

  // Ángulo de los bates: abiertos (palas en el cajón, lejos de la traviesa) o cerrados (palas bajo el canto)
  const ANG_ABIERTO = Math.atan2(0.17, LARGO_BATE), ANG_CERRADO = -Math.atan2(0.03, LARGO_BATE);
  // Bajada del bastidor: las palas pasan de +0,25 m sobre el carril a −0,44 (bajo la cara inferior de la traviesa)
  const BAJADA = 0.69;

  // ---- Polvo (partículas) ----
  const N_POLVO = 420;
  const gPolvo = new THREE.BufferGeometry();
  const pPolvo = new Float32Array(N_POLVO * 3), aPolvo = new Float32Array(N_POLVO), tPolvo = new Float32Array(N_POLVO);
  const vPolvo = new Float32Array(N_POLVO * 3), vidaPolvo = new Float32Array(N_POLVO);
  gPolvo.setAttribute('position', new THREE.BufferAttribute(pPolvo, 3).setUsage(THREE.DynamicDrawUsage));
  gPolvo.setAttribute('alfa', new THREE.BufferAttribute(aPolvo, 1).setUsage(THREE.DynamicDrawUsage));
  gPolvo.setAttribute('tam', new THREE.BufferAttribute(tPolvo, 1).setUsage(THREE.DynamicDrawUsage));
  const texPolvo = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  })();
  const matPolvo = new THREE.ShaderMaterial({
    uniforms: { mapa: { value: texPolvo }, color: { value: new THREE.Color('#cdc6b8') }, escala: { value: 400 } },
    vertexShader: 'attribute float alfa; attribute float tam; varying float vA; uniform float escala;\n' +
      'void main(){ vA = alfa; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = tam * escala / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D mapa; uniform vec3 color; varying float vA;\n' +
      'void main(){ vec4 t = texture2D(mapa, gl_PointCoord); gl_FragColor = vec4(color, t.a * vA); if (gl_FragColor.a < 0.01) discard; }',
    transparent: true, depthWrite: false,
  });
  const polvo = new THREE.Points(gPolvo, matPolvo);
  polvo.frustumCulled = false;
  grupo.add(polvo);
  let iPolvo = 0;
  function emitirPolvo(p, n, fuerza = 1) {
    for (let k = 0; k < n; k++) {
      const i = iPolvo++ % N_POLVO;
      pPolvo[i * 3] = p.x + (Math.random() - 0.5) * 0.25; pPolvo[i * 3 + 1] = p.y + Math.random() * 0.05; pPolvo[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.25;
      vPolvo[i * 3] = (Math.random() - 0.5) * 0.5 * fuerza; vPolvo[i * 3 + 1] = (0.25 + Math.random() * 0.55) * fuerza; vPolvo[i * 3 + 2] = (Math.random() - 0.5) * 0.5 * fuerza;
      vidaPolvo[i] = 1.4 + Math.random() * 1.6;
      tPolvo[i] = 0.08;
      aPolvo[i] = 0.0001;
    }
  }
  function actualizarPolvo(dt) {
    for (let i = 0; i < N_POLVO; i++) {
      if (vidaPolvo[i] <= 0) { aPolvo[i] = 0; continue; }
      vidaPolvo[i] -= dt;
      pPolvo[i * 3] += vPolvo[i * 3] * dt; pPolvo[i * 3 + 1] += vPolvo[i * 3 + 1] * dt; pPolvo[i * 3 + 2] += vPolvo[i * 3 + 2] * dt;
      vPolvo[i * 3 + 1] *= 1 - 0.6 * dt; vPolvo[i * 3] *= 1 - 0.4 * dt; vPolvo[i * 3 + 2] *= 1 - 0.4 * dt;
      tPolvo[i] += dt * 0.55;
      const v = vidaPolvo[i];
      aPolvo[i] = Math.min(0.55, v * 0.4) * Math.min(1, (3.2 - v) * 3);
    }
    gPolvo.attributes.position.needsUpdate = true; gPolvo.attributes.alfa.needsUpdate = true; gPolvo.attributes.tam.needsUpdate = true;
  }

  // ---- Piedras de balasto que empujan los bates bajo la traviesa ----
  const N_PIEDRA = 96;
  const gPiedra = new THREE.DodecahedronGeometry(0.028, 0);
  const imPiedra = new THREE.InstancedMesh(gPiedra, M.piedra, N_PIEDRA);
  imPiedra.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  imPiedra.frustumCulled = false;
  grupo.add(imPiedra);
  const piedras = Array.from({ length: N_PIEDRA }, () => ({ vida: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), rot: new THREE.Euler(), suelo: 0, esc: 1 }));
  let iPiedra = 0;
  function lanzarPiedra(p, v, suelo) {
    const q = piedras[iPiedra++ % N_PIEDRA];
    q.vida = 1.6 + Math.random() * 0.8; q.p.copy(p); q.v.copy(v); q.suelo = suelo; q.esc = 0.7 + Math.random() * 0.8;
    q.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  }
  const _e = new THREE.Vector3();
  function actualizarPiedras(dt) {
    for (let i = 0; i < N_PIEDRA; i++) {
      const q = piedras[i];
      if (q.vida > 0) {
        q.vida -= dt;
        q.v.y -= 9.8 * dt;
        q.p.addScaledVector(q.v, dt);
        if (q.p.y < q.suelo) { q.p.y = q.suelo; q.v.multiplyScalar(0.35); q.v.y = Math.abs(q.v.y) * 0.3; }
        q.rot.x += q.v.length() * dt * 8;
      }
      const e = q.vida > 0 ? q.esc * Math.min(1, q.vida * 2) : 0;
      _m4.compose(q.p, _q.setFromEuler(q.rot), _e.set(e, e * 0.8, e));
      imPiedra.setMatrixAt(i, _m4);
    }
    imPiedra.instanceMatrix.needsUpdate = true;
  }

  // ---- Audio: diésel, chillido hidráulico y zumbido de vibración (Web Audio, sintetizado) ----
  let audio = null;
  function crearAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const ruido = (() => {
      const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const n = ctx.createBufferSource(); n.buffer = b; n.loop = true; n.start();
      return n;
    })();
    // Motor diésel: dos dientes de sierra graves filtrados y ruido sordo
    const motor = ctx.createGain(); motor.gain.value = 0.32; motor.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 190; lp.connect(motor);
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 31; o1.connect(lp); o1.start();
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 62.5; const g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(lp); o2.start();
    const nm = ctx.createBiquadFilter(); nm.type = 'lowpass'; nm.frequency.value = 260; const gn = ctx.createGain(); gn.gain.value = 0.35; ruido.connect(nm); nm.connect(gn); gn.connect(lp);
    // Hidráulica: silbido que sube de tono
    const hid = ctx.createGain(); hid.gain.value = 0; hid.connect(master);
    const bh = ctx.createBiquadFilter(); bh.type = 'bandpass'; bh.frequency.value = 900; bh.Q.value = 6; bh.connect(hid);
    const oh = ctx.createOscillator(); oh.type = 'sawtooth'; oh.frequency.value = 520; oh.connect(bh); oh.start();
    // Vibración de los bates (35 Hz) y piedra rozando
    const vib = ctx.createGain(); vib.gain.value = 0; vib.connect(master);
    const ov = ctx.createOscillator(); ov.type = 'square'; ov.frequency.value = 35; const lv = ctx.createBiquadFilter(); lv.type = 'lowpass'; lv.frequency.value = 420; ov.connect(lv); lv.connect(vib); ov.start();
    const br = ctx.createBiquadFilter(); br.type = 'bandpass'; br.frequency.value = 2200; br.Q.value = 0.8; const gr = ctx.createGain(); gr.gain.value = 0.55; ruido.connect(br); br.connect(gr); gr.connect(vib);
    return { ctx, master, motor, o1, o2, hid, oh, vib };
  }
  function actualizarAudio(fase, u, distCam) {
    const on = audioActivo() && estado.activo;
    if (!on) { if (audio) audio.master.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.1); return; }
    if (!audio) audio = crearAudio();
    if (!audio) return;
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    const t = audio.ctx.currentTime;
    const vol = Math.min(1, 22 / Math.max(6, distCam)) * 0.55;
    audio.master.gain.setTargetAtTime(vol, t, 0.15);
    const carga = fase === 'vibracion' || fase === 'cierre' ? 1.18 : fase === 'avance' ? 1.08 : 1;
    audio.o1.frequency.setTargetAtTime(31 * carga, t, 0.2); audio.o2.frequency.setTargetAtTime(62.5 * carga, t, 0.2);
    const hidr = fase === 'levante' || fase === 'agarre' ? 0.22 : fase === 'cierre' ? 0.16 : fase === 'retirada' ? 0.1 : 0;
    audio.hid.gain.setTargetAtTime(hidr, t, 0.05);
    audio.oh.frequency.setTargetAtTime(fase === 'levante' ? 520 + 600 * u : fase === 'cierre' ? 700 + 300 * u : 480, t, 0.05);
    audio.vib.gain.setTargetAtTime(fase === 'vibracion' ? 0.5 : fase === 'cierre' ? 0.42 : fase === 'descenso' ? 0.15 : 0, t, 0.04);
  }

  // ---- Cinta de geometría exagerada (Cam_Geometría): roja por delante (vía sin corregir), verde por detrás ----
  const EXAG = 30;   // exageración de la desviación en la cinta (25 mm → 0,75 m)
  const nG = N_TRAV;
  const gGeo = new THREE.BufferGeometry();
  const pGeo = new Float32Array(2 * nG * 2 * 3), cGeo = new Float32Array(2 * nG * 2 * 3);
  const iGeo = [];
  for (let r = 0; r < 2; r++) for (let k = 0; k < nG - 1; k++) { const a = (r * nG + k) * 2; iGeo.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  gGeo.setIndex(iGeo);
  gGeo.setAttribute('position', new THREE.BufferAttribute(pGeo, 3).setUsage(THREE.DynamicDrawUsage));
  gGeo.setAttribute('color', new THREE.BufferAttribute(cGeo, 3).setUsage(THREE.DynamicDrawUsage));
  const cintaGeo = new THREE.Mesh(gGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false, depthTest: false }));
  cintaGeo.frustumCulled = false;
  cintaGeo.visible = false;
  cintaGeo.renderOrder = 50;
  grupo.add(cintaGeo);
  const C_MAL = new THREE.Color('#ff4d2e'), C_BIEN = new THREE.Color('#22e07a');
  function actualizarCintaGeo() {
    for (let r = 0; r < 2; r++) for (let k = 0; k < nG; k++) {
      const b = base[k], col = b.pk > pkHecho + 1e-6 ? C_MAL : C_BIEN;
      const lat = (r ? GALGA : -GALGA) + b.dh * EXAG;
      for (let j = 0; j < 2; j++) {
        const o = ((r * nG + k) * 2 + j) * 3;
        const w = j ? 0.05 : -0.05;
        pGeo[o] = b.p.x + b.izq.x * (lat + w); pGeo[o + 1] = b.p.y + 0.06 + b.dv * EXAG; pGeo[o + 2] = b.p.z + b.izq.z * (lat + w);
        cGeo[o] = col.r; cGeo[o + 1] = col.g; cGeo[o + 2] = col.b;
      }
    }
    gGeo.attributes.position.needsUpdate = true; gGeo.attributes.color.needsUpdate = true;
  }

  // =====================================================================================================
  // Máquina de estados del ciclo de bateo
  // =====================================================================================================
  const estado = { activo: false, fase: 'avance', u: 0, traviesa: 0, levanteMm: 0, ripadoMm: 0, bateadas: 0, vista: null };
  let tFase = 0, iFase = 0, pkMaq = 0, pkMaqIni = 0, sacudida = 0;
  const pkBateo = () => pkMaq;                                  // PK del grupo de bateo
  const pkPinzas = () => pkMaq + (XL - XB);
  const latRiel = (r) => (r ? GALGA : -GALGA);

  function montar({ pkIni, via = -1 }) {
    s = via;
    iActual = Math.ceil((pkIni + DETRAS + 2) / ESPACIADO);
    pkHecho = pkTrav(iActual - 1);
    pkMaq = pkMaqIni = pkTrav(iActual) - ESPACIADO;
    iFase = 0; tFase = 0;
    pkVentana = pkTrav(iActual) - DETRAS;
    reanclar(Math.round(pkVentana / ESPACIADO));
    actualizarVia();
    actualizarBalasto(true);
    aplicarRecorte(true);
    estado.activo = true;
  }
  function desmontar() {
    aplicarRecorte(false);
    estado.activo = false;
    if (audio) { audio.master.gain.value = 0; audio.ctx.suspend(); }
  }

  const _w = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
  function colocarMaquina() {
    const pkC = pkMaq - XB;                                     // centro de la máquina
    _a.copy(aLocal(enVia(pkC + 9))); _b.copy(aLocal(enVia(pkC - 9)));
    raiz.position.copy(_a).add(_b).multiplyScalar(0.5);
    // Base dextrógira: X adelante, Y arriba, Z a la derecha de la marcha
    _x.copy(_a).sub(_b).normalize(); _z.crossVectors(_x, _up).normalize(); _y.crossVectors(_z, _x);
    _bx.makeBasis(_x, _y, _z);
    raiz.quaternion.setFromRotationMatrix(_bx);
  }

  function actualizar(dt, distCam = 50) {
    if (!estado.activo) return;
    dt = Math.min(dt, 0.1);
    tFase += dt;
    while (tFase >= FASES[iFase][1]) {
      tFase -= FASES[iFase][1];
      const fin = FASES[iFase][0];
      if (fin === 'retirada') { pkHecho = pkTrav(iActual); estado.bateadas++; iActual++; }
      if (fin === 'avance') pkMaq = pkTrav(iActual);
      iFase = (iFase + 1) % FASES.length;
      if (FASES[iFase][0] === 'avance') pkMaqIni = pkMaq;
      if (FASES[iFase][0] === 'levante') {
        // Objetivos del ciclo: llevar la traviesa a su cota y alineación de proyecto (+3 mm de sobrelevante)
        const pk = pkTrav(iActual);
        geo.levObj = -defectoV(pk) + 0.003;
        geo.ripObj = -defectoH(pk);
      }
    }
    const fase = FASES[iFase][0], u = tFase / FASES[iFase][1];
    estado.fase = fase; estado.u = u; estado.traviesa = iActual;

    // Avance «stop & go» a la traviesa siguiente
    if (fase === 'avance') pkMaq = pkMaqIni + (pkTrav(iActual) - pkMaqIni) * suave(u);
    // Reancla el tramo cuando la máquina se acerca a su final
    if (pkTrav(iActual) - pkVentana > N_TRAV * ESPACIADO - 50) {
      reanclar(Math.round((pkTrav(iActual) - DETRAS) / ESPACIADO));
      actualizarBalasto(true);
    }

    // Levante: sube durante «levante», se mantiene mientras se batea y se suelta al retirarse (la vía queda en su cota)
    geo.levante = fase === 'levante' ? suave(u) : fase === 'descenso' || fase === 'vibracion' || fase === 'cierre' ? 1 : fase === 'retirada' ? 1 - suave(u) : 0;
    estado.levanteMm = Math.round(geo.levante * geo.levObj * 1000);
    estado.ripadoMm = Math.round(geo.levante * geo.ripObj * 1000);

    // Pinzas: cierran en «agarre», abren en «retirada»
    const cierrePinza = fase === 'agarre' ? suave(u) : fase === 'avance' ? 0 : fase === 'retirada' ? 1 - suave(u) : 1;
    for (const p of pinzas) p.position.z = p.userData.lado * (0.11 - 0.065 * cierrePinza);
    const dPinza = desviacion(pkPinzas());
    for (const u2 of levante.children) if (u2.isGroup) { u2.position.y = dPinza.v * cierrePinza; u2.position.z = Math.sign(u2.position.z) * GALGA + dPinza.h * cierrePinza * -1; }
    for (const v of vastagos) v.position.y = 0.5 + dPinza.v * cierrePinza * 0.5;

    // Bastidores: bajan en «descenso», abajo en vibración y cierre, suben en «retirada»
    const baja = fase === 'descenso' ? suave(u) : fase === 'vibracion' || fase === 'cierre' ? 1 : fase === 'retirada' ? 1 - suave(Math.min(1, u * 1.4)) : 0;
    const vibra = fase === 'vibracion' || fase === 'cierre' || (fase === 'descenso' && u > 0.5);
    const cierra = fase === 'cierre' ? suave(u) : fase === 'retirada' ? 1 - suave(Math.min(1, u * 2.2)) : 0;
    const tiempo = performance.now() / 1000;
    const dBat = desviacion(pkBateo());
    // Palas a Y_PIVOTE − LARGO_BATE (−0,32 m) del bastidor: arriba quedan a +0,25 m sobre el carril y abajo a −0,44 m
    for (const b of bastidores) b.position.y = 0.25 + LARGO_BATE - Y_PIVOTE - BAJADA * baja + dBat.v + (vibra ? Math.sin(tiempo * 2 * Math.PI * 35) * 0.004 : 0);
    bates.forEach((pv, i) => {
      const ang = ANG_ABIERTO + (ANG_CERRADO - ANG_ABIERTO) * cierra;
      pv.rotation.z = pv.userData.sx * ang + (vibra ? Math.sin(tiempo * 2 * Math.PI * 35 + i) * 0.012 : 0);
      fantasmas[i].visible = vibra;
    });

    // Huellas en el balasto, polvo y piedras
    const pkT = pkTrav(iActual);
    if (fase === 'descenso' && u > 0.45) {
      for (let r = 0; r < 2; r++) for (const zl of [-0.17, 0.17]) for (const sx of [-1, 1]) {
        const lat = latRiel(r) + zl;
        hundir(pkT + sx * 0.36, lat, 0.16, 0.09 * suave((u - 0.45) / 0.55));
      }
    }
    if ((fase === 'descenso' && u > 0.5) || fase === 'vibracion' || fase === 'cierre') {
      const n = fase === 'cierre' ? 3 : fase === 'vibracion' ? 2 : 4;
      for (let r = 0; r < 2; r++) for (const sx of [-1, 1]) {
        const b = base[Math.round((pkT - pkVentana) / ESPACIADO)] || base[0];
        _w.copy(b.p).addScaledVector(b.izq, latRiel(r) + (Math.random() - 0.5) * 0.6).addScaledVector(b.dir, sx * 0.36).addScaledVector(_up, Z_BAL);
        if (Math.random() < 0.6) emitirPolvo(_w, n, fase === 'descenso' ? 1.4 : 1);
        if (fase === 'cierre' && Math.random() < 0.55) {
          // La piedra se mete bajo la traviesa empujada por las palas
          const v = b.dir.clone().multiplyScalar(-sx * (0.5 + Math.random() * 0.4)).addScaledVector(_up, 0.4 + Math.random() * 0.6).addScaledVector(b.izq, (Math.random() - 0.5) * 0.5);
          lanzarPiedra(_w.clone().addScaledVector(_up, 0.03), v, _w.y - 0.02);
        }
      }
    }
    if (fase === 'cierre' && u > 0.9) for (let r = 0; r < 2; r++) for (const zl of [-0.17, 0.17]) for (const sx of [-1, 1]) rellenar(pkT + sx * 0.36, latRiel(r) + zl, 0.16, 0.35);
    // Sacudida de cámara: leve en la vibración
    sacudida = vibra ? 1 : Math.max(0, sacudida - dt * 4);

    // Destellos
    destellos.forEach((d, i) => { d.material = Math.sin(tiempo * 7 + i * 1.7) > 0.1 ? M.destello : M.destelloApagado; });

    // Medición: los carros siguen la vía real (el delantero sube y baja con los defectos) y la cuerda láser los une
    carros.forEach((c) => {
      const pkC = pkMaq - XB + c.position.x;
      const d = desviacion(pkC);
      c.position.y = d.v; c.position.z = -d.h;   // Z local del chasis hacia la derecha de la marcha (ver colocarMaquina)
    });
    const cA = carros[0].position, cB = carros[2].position;
    laser.position.set((cA.x + cB.x) / 2, (cA.y + cB.y) / 2 + 0.64, (cA.z + cB.z) / 2);
    laser.scale.x = Math.hypot(cA.x - cB.x, cA.y - cB.y);
    laser.rotation.z = Math.atan2(cA.y - cB.y, cA.x - cB.x);

    colocarMaquina();
    actualizarVia();
    if (filasSucias[1] >= filasSucias[0] || geo.levante > 0) {
      if (geo.levante > 0) {
        const fP = Math.round((pkPinzas() - pkVentana) / PASO_F), r = Math.ceil(7 / PASO_F);
        filasSucias = [Math.min(filasSucias[0], fP - r), Math.max(filasSucias[1], fP + r)];
      }
      actualizarBalasto();
    }
    actualizarPolvo(dt);
    actualizarPiedras(dt);
    if (cintaGeo.visible) actualizarCintaGeo();
    actualizarAudio(fase, u, distCam);
  }

  // ---- Cámaras ----
  function poseCamara(modo) {
    const pkB = pkBateo();
    const m = Eje3D.enPk(pkB), nx = -m.ty, ny = m.tx;
    const ejeVia = enVia(pkB);
    const jit = () => (Math.random() - 0.5) * 0.012 * sacudida;
    if (modo === 'bateo') {
      // A ras de carril, por el lado exterior de la vía en trabajo, mirando a las pinzas y los bates
      const lat = s * 3.4;
      return {
        pos: { E: ejeVia.E + nx * lat + m.tx * 2.2 + jit(), N: ejeVia.N + ny * lat + m.ty * 2.2 + jit(), Z: ejeVia.Z + 0.55 + jit() },
        obj: { E: ejeVia.E + m.tx * 0.6 + nx * s * 0.2, N: ejeVia.N + m.ty * 0.6 + ny * s * 0.2, Z: ejeVia.Z - 0.15 },
      };
    }
    if (modo === 'geometria') {
      // Desde atrás, a ras de suelo en el eje de la vía, mirando hacia la máquina y la vía sin corregir
      // Detrás, sobre el eje de la vía y algo elevada: la cinta exagerada se ve a través de la máquina
      const atras = enVia(pkB - 30);
      const delante = enVia(pkB + 34);
      return { pos: { E: atras.E, N: atras.N, Z: atras.Z + 2.1 }, obj: { E: delante.E, N: delante.N, Z: delante.Z + 0.3 } };
    }
    // General: tres cuartos elevada, por fuera de la vía y algo por delante
    const lat = s * 15;
    const c = enVia(pkB - XB);
    return {
      pos: { E: c.E + nx * lat + m.tx * 22 + jit() * 0.3, N: c.N + ny * lat + m.ty * 22, Z: c.Z + 9.5 },
      obj: { E: c.E, N: c.N, Z: c.Z + 1.2 },
    };
  }
  function setVista(modo) {
    estado.vista = modo;
    cintaGeo.visible = modo === 'geometria';
    corteActivo = modo === 'bateo';
    if (estado.activo) { actualizarCintaGeo(); actualizarBalasto(true); }
  }
  // Para la vista en corte los bastidores necesitan verse también por el lado exterior: nada más que hacer aquí

  return {
    grupo, estado, montar, desmontar, actualizar, poseCamara, setVista,
    get pkCabeza() { return pkMaq; }, get pkMaquina() { return pkMaq - XB; },
    VEL_MEDIA: VEL_MEDIA_BATEO,
  };
}
