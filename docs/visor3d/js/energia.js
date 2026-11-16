// Mantenimiento de energía: dresina de catenaria con castillete elevador
//
// La dresina avanza por la vía, se detiene bajo una ménsula (en la primera péndola del vano) y sigue el ciclo:
//   Avance → Parada → Subida del castillete (tijera, y se desplaza hacia el poste) → Puesta a tierra con la pértiga
//   (chispa al tocar el hilo) → Trabajo en la péndola (las manos de los operarios llegan al cable por IK y el cable se
//   mueve unos milímetros) → Retirada de la pértiga → Bajada → Avance al siguiente vano.
// Catenaria física: en el vano de trabajo el hilo de contacto, el sustentador y las péndolas se dibujan aparte con
// física de posiciones (Verlet con restricciones de distancia y rigidez hacia su forma tensada). Los hilos fijos del
// visor se recortan en esa caja. El pantógrafo de auscultación empuja el hilo hacia arriba y su frotador muestra el
// zigzag (descentramiento de js/catenaria.js).
// Aspecto: techo, barandillas y plataforma manchados de polvo negro de grafito (no de balasto); hilo de cobre con la
// cara inferior pulida; aisladores de vidrio en la plataforma.
// Ejes de la dresina: X adelante, Y arriba, Z a la derecha; origen sobre el eje de la vía a la cota de la cabeza de carril.

import * as THREE from 'three';
import { crearAudioObras } from './audio-obras.js';
import { materialesMaquina, caja, cil, tubo, focoHalogeno, pegatina, cabina, bogie, crearPolvo, fijarCarril } from './pbr-maquinas.js';

const L = 13.5, Y_TECHO = 3.05, X_PLAT = -0.6, X_PANTO = L / 2 - 1.3;
const H_HILO = 5.30, H_SUST = 6.46;
export const FASES_ENER = {
  avance: 'Avance al siguiente vano', parada: 'Parada bajo la ménsula', subida: 'Subida del castillete', tierra: 'Puesta a tierra con la pértiga',
  trabajo: 'Ajuste de la péndola', retirada: 'Retirada de la pértiga', bajada: 'Bajada del castillete',
};
const DURACION = { parada: 1.2, subida: 3.5, tierra: 3.6, trabajo: 7.5, retirada: 2.6, bajada: 3.0 };
const ORDEN = ['parada', 'subida', 'tierra', 'trabajo', 'retirada', 'bajada', 'avance'];
const suave = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

export function crearEnergia({ escena, Eje3D, W, Catenaria, matHilo }) {
  const audio = crearAudioObras();
  const grupo = new THREE.Group();
  grupo.name = 'Mantenimiento de energia';
  grupo.visible = false;
  escena.add(grupo);
  const M = materialesMaquina({ grafito: true, arriba: Y_TECHO - 0.1, fuerza: 0.85 });
  const matFibra = new THREE.MeshStandardMaterial({ color: '#e87a1c', roughness: 0.5 });
  const matVidrio = new THREE.MeshPhysicalMaterial({ color: '#9fc7c0', roughness: 0.35, metalness: 0, transmission: 0.85, thickness: 0.06, transparent: true, opacity: 0.9 });
  const matCobreLomo = new THREE.MeshStandardMaterial({ color: '#6b3f22', roughness: 0.6, metalness: 0.7, side: THREE.DoubleSide });
  const matCobrePulido = new THREE.MeshStandardMaterial({ color: '#e9b46a', roughness: 0.1, metalness: 1.0, side: THREE.DoubleSide });
  const matPertiga = new THREE.MeshStandardMaterial({ color: '#f2c200', roughness: 0.45 });
  const matRopa = new THREE.MeshStandardMaterial({ color: '#1e2a3a', roughness: 0.85 });
  const matChaleco = new THREE.MeshStandardMaterial({ color: '#cddc2a', roughness: 0.6, emissive: new THREE.Color('#3a4200'), emissiveIntensity: 0.4 });
  const matPiel = new THREE.MeshStandardMaterial({ color: '#c99a78', roughness: 0.8 });
  const matCasco = new THREE.MeshStandardMaterial({ color: '#f4f4f0', roughness: 0.35 });
  const matArnes = new THREE.MeshStandardMaterial({ color: '#1f2c45', roughness: 0.8 });

  // ---- Dresina ----
  const raiz = new THREE.Group(); raiz.name = 'Root_Chassis';
  raiz.add(caja(L - 0.4, 0.45, 2.7, M.chasis, 0, 1.1, 0));
  raiz.add(caja(L - 5.2, 1.7, 2.7, M.amarillo, -0.4, 2.2, 0), caja(L - 5.2, 0.1, 2.8, M.amarilloOsc, -0.4, Y_TECHO, 0));
  for (let x = -L / 2 + 3.2; x < L / 2 - 3.4; x += 1.3) for (const z of [-1, 1]) raiz.add(caja(0.9, 1.0, 0.04, M.amarilloOsc, x, 2.2, z * 1.36));
  const cA = cabina(M, { sentido: 1, tinte: 'verde', largo: 2.6, y0: 1.35, alto: 1.95 }); cA.position.x = L / 2 - 1.4;
  const cB = cabina(M, { sentido: -1, tinte: 'marron', largo: 2.2, y0: 1.35, alto: 1.95 }); cB.position.x = -L / 2 + 1.2;
  raiz.add(cA, cB);
  raiz.add(bogie(M, L / 2 - 2.2), bogie(M, -L / 2 + 2.2));
  // Pasarela de techo con barandilla
  raiz.add(caja(L - 5.4, 0.04, 2.6, M.tramex, -0.4, Y_TECHO + 0.07, 0));
  for (const z of [-1, 1]) for (let x = -L / 2 + 3.0; x <= L / 2 - 3.2; x += 1.2) raiz.add(cil(0.022, 1.0, matFibra, x, Y_TECHO + 0.55, z * 1.3));
  for (const z of [-1, 1]) raiz.add(cil(0.025, L - 5.6, matFibra, -0.4, Y_TECHO + 1.05, z * 1.3, 'x'));
  for (const z of [-1, 1]) raiz.add(pegatina(M.pegRayo, L / 2 - 2.9, 2.3, z * 1.37, z > 0 ? 0 : Math.PI, 0.26));
  const destellos = [...cA.userData.destellos, ...cB.userData.destellos];
  // Escalera lateral de acceso al techo (los operarios suben por ella con la dresina parada)
  for (const z of [-1, 1]) {
    for (const dx of [-0.22, 0.22]) raiz.add(cil(0.022, Y_TECHO - 0.9, M.acero, -L / 2 + 3.4 + dx, 0.95 + (Y_TECHO - 0.9) / 2, z * 1.42));
    for (let y = 1.1; y < Y_TECHO; y += 0.3) raiz.add(cil(0.016, 0.44, M.acero, -L / 2 + 3.4, y, z * 1.42, 'x'));
  }

  // Castillete elevador de tijera
  const cast = new THREE.Group(); cast.name = 'Castillete_Elevador';
  cast.position.set(X_PLAT, Y_TECHO + 0.1, 0);
  raiz.add(cast);
  cast.add(caja(3.6, 0.12, 1.9, M.chasis, 0, 0.06, 0));
  const plataforma = new THREE.Group(); plataforma.name = 'Plataforma';
  plataforma.add(caja(4.2, 0.1, 2.3, M.tramex, 0, 0, 0));
  for (const [x, z] of [[-2, -1.05], [-2, 1.05], [2, -1.05], [2, 1.05], [0, -1.05], [0, 1.05]]) plataforma.add(cil(0.03, 1.1, matFibra, x, 0.6, z));
  for (const z of [-1.05, 1.05]) plataforma.add(cil(0.03, 4.0, matFibra, 0, 1.15, z, 'x'), cil(0.025, 4.0, matFibra, 0, 0.62, z, 'x'));
  for (const x of [-2, 2]) plataforma.add(cil(0.03, 2.1, matFibra, x, 1.15, 0, 'z'));
  for (const x of [-1.6, 1.6]) for (const z of [-0.8, 0.8]) plataforma.add(cil(0.07, 0.16, matVidrio, x, -0.12, z));   // aisladores de vidrio
  const focoPlat = new THREE.SpotLight('#f4f7ff', 0, 10, 0.9, 0.5, 1.2);
  focoPlat.position.set(1.8, 1.2, 0); focoPlat.target.position.set(0, 3, 0);
  plataforma.add(focoPlat, focoPlat.target, focoHalogeno(M, 1.8, 1.2, 0));
  cast.add(plataforma);
  const brazos = [];
  for (let k = 0; k < 8; k++) { const b = caja(1, 0.08, 0.08, M.amarilloOsc, 0, 0, 0); cast.add(b); brazos.push(b); }
  function tijera(h, lat) {
    // Dos etapas de tijera a cada lado: barras de 1,8 m que se abren con la altura
    const LB = 1.8, hs = Math.max(0.06, h / 2), dx = Math.sqrt(Math.max(0.01, LB * LB - hs * hs)) / 2;
    plataforma.position.set(0, 0.12 + h, lat);
    let k = 0;
    for (const z of [-0.85, 0.85]) for (let e = 0; e < 2; e++) for (const sg of [-1, 1]) {
      const a = new THREE.Vector3(-sg * dx, 0.12 + e * hs, z + lat * (e / 2)), b = new THREE.Vector3(sg * dx, 0.12 + (e + 1) * hs, z + lat * ((e + 1) / 2));
      const br = brazos[k++], d = b.clone().sub(a);
      br.position.copy(a).add(b).multiplyScalar(0.5);
      br.scale.x = d.length();
      br.rotation.set(0, -Math.atan2(d.z, d.x), Math.atan2(d.y, Math.hypot(d.x, d.z)));
    }
  }
  // Grúa-cesta plegada sobre la cabina trasera
  raiz.add(tubo(0.09, new THREE.Vector3(-L / 2 + 2.4, Y_TECHO + 0.2, -0.7), new THREE.Vector3(-L / 2 + 0.6, Y_TECHO + 0.55, -0.7), M.amarillo), caja(0.9, 0.7, 0.9, matFibra, -L / 2 + 0.5, Y_TECHO + 0.8, -0.7));
  // Pantógrafo de auscultación en el extremo delantero del techo
  const panto = new THREE.Group(); panto.name = 'Pantografo_Auscultacion';
  panto.position.set(X_PANTO, Y_TECHO + 0.1, 0);
  for (const z of [-0.35, 0.35]) panto.add(cil(0.06, 0.25, matVidrio, -0.4, 0.12, z));
  panto.add(caja(1.1, 0.07, 0.8, M.chasis, -0.2, 0.28, 0));
  const pBrazoI = caja(1, 0.06, 0.06, M.acero, 0, 0, 0), pBrazoS = caja(1, 0.05, 0.05, M.acero, 0, 0, 0);
  const mesilla = new THREE.Group();
  mesilla.add(caja(0.3, 0.04, 1.3, M.pulido, 0, 0, 0), caja(0.06, 0.03, 1.2, M.oscuro, 0.08, 0.025, 0), caja(0.06, 0.03, 1.2, M.oscuro, -0.08, 0.025, 0));
  const marca = caja(0.3, 0.004, 0.03, new THREE.MeshBasicMaterial({ color: '#ffb35a' }), 0, 0.043, 0); marca.castShadow = false;
  mesilla.add(marca);
  panto.add(pBrazoI, pBrazoS, mesilla);
  raiz.add(panto);
  const ficha = { capa: 'Mantenimiento de energía', nombre: 'Dresina de catenaria', info: 'Vagoneta de electrificación con castillete elevador de tijera, grúa-cesta y pantógrafo de auscultación que mide la altura y el descentramiento del hilo de contacto.' };
  raiz.traverse((o) => { if (o.isMesh) o.userData = ficha; });

  // ---- Operarios del castillete (cuerpo en la plataforma; brazos por IK en coordenadas del tajo) ----
  function operario(x, z) {
    const o = new THREE.Group();
    for (const dz of [-0.1, 0.1]) o.add(caja(0.14, 0.82, 0.14, matRopa, 0, 0.41, dz));
    o.add(caja(0.24, 0.6, 0.42, matChaleco, 0, 1.12, 0));
    // Arnés anticaída (tirantes y cinturón) sobre el chaleco
    for (const z of [-0.1, 0.1]) o.add(caja(0.25, 0.58, 0.035, matArnes, 0, 1.12, z));
    o.add(caja(0.26, 0.06, 0.44, matArnes, 0, 0.86, 0));
    const cabeza = new THREE.Group(); cabeza.position.y = 1.45; o.add(cabeza);
    cabeza.add(new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), matPiel).translateY(0.1));
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), matCasco); c.position.y = 0.15; cabeza.add(c);
    const hI = new THREE.Object3D(); hI.position.set(0.02, 1.38, -0.21); const hD = new THREE.Object3D(); hD.position.set(0.02, 1.38, 0.21);
    o.add(hI, hD);
    o.position.set(x, 0.05, z);
    plataforma.add(o);
    const seg = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 1, 8), matRopa); m.castShadow = true; grupoBrazos.add(m); return m; };
    // Cabo del arnés hasta la barandilla
    const cabo = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#d14a12' }));
    cabo.frustumCulled = false; grupoBrazos.add(cabo);
    return { o, cabeza, cabo, x0: x, hombros: [hI, hD], brazos: [[seg(), seg()], [seg(), seg()]] };
  }
  const grupoBrazos = new THREE.Group();
  const opA = operario(1.0, 0), opB = operario(-1.0, 0);
  for (const op of [opA, opB]) op.o.rotation.y = Math.PI / 2;
  const pertiga = cil(0.025, 3.4, matPertiga, 0, 0, 0); pertiga.castShadow = true;
  const gancho = caja(0.04, 0.14, 0.04, M.cromo, 0, 0, 0);
  const llave = caja(0.03, 0.03, 0.22, M.cromo, 0, 0, 0);
  // Cable de tierra de la pértiga al carril
  const gCable = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 24 }, () => new THREE.Vector3()));
  const cableTierra = new THREE.Line(gCable, new THREE.LineBasicMaterial({ color: '#2a8a3a' }));
  cableTierra.frustumCulled = false;
  const chispas = crearPolvo(140, '#bfe0ff');
  chispas.puntos.material.blending = THREE.AdditiveBlending;
  const luzChispa = new THREE.PointLight('#cfe6ff', 0, 12, 1.5);

  // ---- Catenaria física del vano de trabajo ----
  const PASO = 0.5;
  const cat = { nodosC: [], nodosS: [], restC: [], restS: [], prevC: [], prevS: [], pendolas: [], largoC: 0, largoS: 0, pkA: 0, pkB: 0, n: 0 };
  const gHiloP = new THREE.BufferGeometry(), gHiloL = new THREE.BufferGeometry();
  const hiloPulido = new THREE.Mesh(gHiloP, matCobrePulido), hiloLomo = new THREE.Mesh(gHiloL, matCobreLomo);
  const gSust = new THREE.BufferGeometry(), sust = new THREE.Line(gSust, new THREE.LineBasicMaterial({ color: '#475569' }));
  const gPend = new THREE.BufferGeometry(), pend = new THREE.LineSegments(gPend, new THREE.LineBasicMaterial({ color: '#7c8796' }));
  for (const o of [hiloPulido, hiloLomo, sust, pend, cableTierra]) o.frustumCulled = false;
  hiloPulido.userData = hiloLomo.userData = { capa: 'Mantenimiento de energía', nombre: 'Hilo de contacto (vano en trabajo)', info: 'Hilo de cobre: el lomo superior oscurecido y la cara inferior pulida por el frotamiento de los pantógrafos. Tensado mecánicamente: al empujarlo, la tensión se reparte por las péndolas hacia el sustentador.' };

  // ---- Recorte de los hilos fijos del visor en el vano ----
  const planos = [0, 1, 2, 3, 4, 5].map(() => new THREE.Plane());
  const matsRecortados = new Set();
  const NOMBRES_HILOS = ['Hilo de contacto EAC-350 (Cu-Ag)', 'Cable sustentador y celosía EAC-350', 'Péndolas equipotenciales EAC-350'];
  function recortarHilos(on) {
    const aplicar = (m) => { m.clippingPlanes = on ? planos : null; m.clipIntersection = on; m.needsUpdate = true; if (on) matsRecortados.add(m); };
    if (!on) { for (const m of matsRecortados) aplicar(m); matsRecortados.clear(); return; }
    if (matHilo) aplicar(matHilo);
    escena.traverse((o) => { if ((o.isLineSegments || o.isLine) && NOMBRES_HILOS.includes(o.userData?.nombre) && !matsRecortados.has(o.material)) aplicar(o.material); });
  }

  let sit = null;
  const estado = { activo: false, fase: 'avance', vano: 0, alturaHilo: 0, descentramiento: 0 };
  const enVia = (pk, s, d = 0) => { const m = Eje3D.enPk(pk), off = s * m.sep * 0.5 + d; return { E: m.E - m.ty * off, N: m.N + m.tx * off, Z: m.Z, m }; };
  const aLocal = (p) => W(p.E, p.N, p.Z).sub(W(sit.ancla.E, sit.ancla.N, sit.ancla.Z));
  const puntoHilo = (pk, s, h) => aLocal({ ...enVia(pk, s, Catenaria ? Catenaria.descentramiento(pk, s) : 0), Z: Eje3D.enPk(pk).Z + h });

  function construirVano(pkA, pkB) {
    const s = sit.s, span = pkB - pkA, n = Math.max(4, Math.round(span / PASO));
    const flecha = 0.38 * Math.min(1, span / 55) ** 2;
    Object.assign(cat, { pkA, pkB, n, nodosC: [], nodosS: [], restC: [], restS: [], prevC: [], prevS: [], pendolas: [] });
    for (let k = 0; k <= n; k++) {
      const u = k / n, pk = pkA + span * u;
      const c = puntoHilo(pk, s, H_HILO), m = puntoHilo(pk, s, H_SUST - flecha * 4 * u * (1 - u));
      cat.restC.push(c); cat.restS.push(m); cat.nodosC.push(c.clone()); cat.nodosS.push(m.clone()); cat.prevC.push(c.clone()); cat.prevS.push(m.clone());
    }
    const nSub = Math.max(2, Math.round(span / 4.6));
    for (let j = 1; j < nSub; j++) { const k = Math.round(j * n / nSub); cat.pendolas.push({ k, largo: cat.restS[k].y - cat.restC[k].y }); }
    cat.largoC = cat.restC[1].distanceTo(cat.restC[0]);
    cat.largoS = cat.restS[1].distanceTo(cat.restS[0]);
    gHiloP.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 2 * 3), 3));
    gHiloL.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 2 * 3), 3));
    const idx = [];
    for (let k = 0; k < n; k++) idx.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
    gHiloP.setIndex(idx); gHiloL.setIndex(idx);
    gSust.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 3), 3));
    gPend.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cat.pendolas.length * 2 * 3), 3));
    actualizarCorte();
  }
  // Caja de recorte de los hilos fijos: el vano, alrededor de la vía y a la altura de la catenaria (en coordenadas de
  // escena: se recalcula cada fotograma porque el origen del mundo se recentra)
  function actualizarCorte() {
    const s = sit.s, pkA = cat.pkA, pkB = cat.pkB;
    const mA = Eje3D.enPk(pkA - 0.4), mB = Eje3D.enPk(pkB + 0.4);
    const pA = W(mA.E, mA.N, mA.Z), pB = W(mB.E, mB.N, mB.Z);
    const dir = pB.clone().sub(pA).setY(0).normalize(), izq = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir);
    const centro = pA.clone().addScaledVector(izq, s * mA.sep * 0.5);
    planos[0].setFromNormalAndCoplanarPoint(dir.clone().negate(), pA);
    planos[1].setFromNormalAndCoplanarPoint(dir.clone(), pB);
    planos[2].setFromNormalAndCoplanarPoint(izq.clone().negate(), centro.clone().addScaledVector(izq, -0.95));
    planos[3].setFromNormalAndCoplanarPoint(izq.clone(), centro.clone().addScaledVector(izq, 0.95));
    planos[4].setFromNormalAndCoplanarPoint(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, Math.min(pA.y, pB.y) + 4.9, 0));
    planos[5].setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, Math.max(pA.y, pB.y) + 7.2, 0));
  }
  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  function restringir(a, b, largo, fijoA, fijoB) {
    _v.subVectors(b, a); const d = _v.length() || 1e-6, dif = (d - largo) / d;
    if (fijoA && fijoB) return;
    if (fijoA) b.addScaledVector(_v, -dif); else if (fijoB) a.addScaledVector(_v, dif);
    else { a.addScaledVector(_v, dif * 0.5); b.addScaledVector(_v, -dif * 0.5); }
  }
  const empujes = [];   // { k, y }: nodos del hilo que una pieza empuja hacia arriba (cota mínima) o mueve
  function simular() {
    const { nodosC, nodosS, restC, restS, prevC, prevS, n } = cat;
    for (const [N, R, P] of [[nodosC, restC, prevC], [nodosS, restS, prevS]]) {
      for (let k = 1; k < n; k++) {
        _v.subVectors(N[k], P[k]).multiplyScalar(0.86);
        P[k].copy(N[k]);
        N[k].add(_v).addScaledVector(_w.subVectors(R[k], N[k]), 0.035);
      }
    }
    for (let it = 0; it < 8; it++) {
      for (let k = 0; k < n; k++) { restringir(nodosC[k], nodosC[k + 1], cat.largoC, k === 0, k + 1 === n); restringir(nodosS[k], nodosS[k + 1], cat.largoS, k === 0, k + 1 === n); }
      for (const p of cat.pendolas) restringir(nodosC[p.k], nodosS[p.k], p.largo, false, false);
      for (const e of empujes) { const nd = nodosC[e.k]; if (nd && e.k > 0 && e.k < n) { if (e.min !== undefined) nd.y = Math.max(nd.y, e.min); if (e.d) nd.addScaledVector(e.d, 0.5); } }
    }
    // Dibujo: cara inferior pulida y lomo superior del hilo; sustentador y péndolas
    const pP = gHiloP.attributes.position.array, pL = gHiloL.attributes.position.array, pS = gSust.attributes.position.array, pD = gPend.attributes.position.array;
    for (let k = 0; k <= n; k++) {
      const a = nodosC[Math.max(0, k - 1)], b = nodosC[Math.min(n, k + 1)];
      _v.subVectors(b, a).setY(0).normalize(); const zx = -_v.z * 0.006, zz = _v.x * 0.006;
      const c = nodosC[k];
      pP.set([c.x - zx, c.y - 0.006, c.z - zz, c.x + zx, c.y - 0.006, c.z + zz], k * 6);
      pL.set([c.x - zx, c.y + 0.006, c.z - zz, c.x + zx, c.y + 0.006, c.z + zz], k * 6);
      pS.set([nodosS[k].x, nodosS[k].y, nodosS[k].z], k * 3);
    }
    cat.pendolas.forEach((p, i) => { const c = nodosC[p.k], m = nodosS[p.k]; pD.set([c.x, c.y, c.z, m.x, m.y, m.z], i * 6); });
    for (const g of [gHiloP, gHiloL, gSust, gPend]) g.attributes.position.needsUpdate = true;
    gHiloP.computeVertexNormals(); gHiloL.computeVertexNormals();
  }
  const nodoEn = (pk) => Math.max(1, Math.min(cat.n - 1, Math.round((pk - cat.pkA) / (cat.pkB - cat.pkA) * cat.n)));

  function montar({ pk, s = 1 }) {
    desmontar();
    const m0 = Eje3D.enPk(pk);
    sit = { s, ancla: { E: m0.E, N: m0.N, Z: m0.Z }, pk, fase: 'parada', tFase: 0, iVano: -1, pkParada: 0, v: 0, tierra: 0, hook: new THREE.Vector3(), t: 0 };
    grupo.position.copy(W(sit.ancla.E, sit.ancla.N, sit.ancla.Z));
    grupo.add(raiz, grupoBrazos, pertiga, gancho, llave, cableTierra, chispas.puntos, luzChispa, hiloPulido, hiloLomo, sust, pend);
    prepararParada(pk);
    sit.pk = sit.pkParada;
    recortarHilos(true);
    // Sonido: diésel de la dresina, hidráulica del castillete y zumbido de la catenaria en tensión
    sit.snd = {
      diesel: audio.fuente('diesel', { ref: 5 }).set({ rpm: 850, carga: 0.25 }),
      hidr: audio.fuente('hidraulica', { ref: 3 }).set({ nivel: 0 }),
      zumbido: audio.fuente('zumbido', { ref: 3, caida: 1.4 }).set({ nivel: 1 }),
    };
    grupo.visible = true;
    estado.activo = true;
    actualizar(0);
  }
  // Siguiente parada: la primera péndola del vano siguiente
  function prepararParada(desde) {
    const aps = Catenaria.apoyosEntre(desde - 10, desde + 160, sit.s).map((a) => a.pk);
    const iA = aps.findIndex((p) => p > desde + 1);
    const a = aps[Math.max(0, iA)], b = aps[Math.max(0, iA) + 1] ?? a + 55;
    sit.pkParada = a + (b - a) / Math.max(2, Math.round((b - a) / 4.6));
    sit.vano = [a, b];
    construirVano(a, b);
    estado.vano++;
  }
  function desmontar() {
    if (sit?.snd) for (const f of Object.values(sit.snd)) f.parar();
    recortarHilos(false);
    for (const c of [...grupo.children]) grupo.remove(c);
    sit = null; grupo.visible = false; estado.activo = false;
  }

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _bx = new THREE.Matrix4();
  function colocar() {
    _a.copy(aLocal(enVia(sit.pk + 5, sit.s))).y += 0.022; _b.copy(aLocal(enVia(sit.pk - 5, sit.s))).y += 0.022;
    raiz.position.copy(_a).add(_b).multiplyScalar(0.5);
    _x.copy(_a).sub(_b).normalize(); _z.crossVectors(_x, _up).normalize(); _y.crossVectors(_z, _x);
    raiz.quaternion.setFromRotationMatrix(_bx.makeBasis(_x, _y, _z));
  }
  // Brazo por IK de dos huesos (hombro → codo → mano) con el codo hacia «polo»
  function brazoIK(segs, hombro, objetivo, polo) {
    const L1 = 0.31, L2 = 0.3;
    const S = hombro.getWorldPosition(new THREE.Vector3()); grupo.worldToLocal(S);
    const d0 = objetivo.clone().sub(S), d = Math.min(L1 + L2 - 1e-3, Math.max(0.1, d0.length()));
    const dir = d0.normalize();
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const perp = polo.clone().sub(dir.clone().multiplyScalar(polo.dot(dir))).normalize();
    const E = S.clone().addScaledVector(dir, a).addScaledVector(perp, h), H = S.clone().addScaledVector(dir, d);
    for (const [m, p, q] of [[segs[0], S, E], [segs[1], E, H]]) {
      const v = q.clone().sub(p); m.position.copy(p).addScaledVector(v, 0.5); m.scale.set(1, v.length(), 1);
      m.quaternion.setFromUnitVectors(_up, v.normalize());
    }
    return H;
  }

  function actualizar(dt, { noche = true } = {}) {
    if (!sit) return;
    dt = Math.min(dt, 0.1);
    sit.t += dt; sit.tFase += dt;
    grupo.position.copy(W(sit.ancla.E, sit.ancla.N, sit.ancla.Z));
    const s = sit.s;
    actualizarCorte();
    // Los hilos de las teselas que se cargan después también se recortan
    if ((sit.tRecorte = (sit.tRecorte || 0) + dt) > 2) { sit.tRecorte = 0; recortarHilos(true); }
    // Máquina de estados
    if (sit.fase === 'avance') {
      const falta = sit.pkParada - sit.pk;
      sit.v = Math.min(4.5, Math.max(0.3, Math.sqrt(Math.max(0, falta) * 1.2)), sit.v + dt * 1.2);
      sit.pk += Math.min(falta, sit.v * dt);
      if (falta < 0.02) { sit.fase = 'parada'; sit.tFase = 0; sit.v = 0; audio.golpe(raiz.getWorldPosition(_w), { tipo: 'clac', nivel: 0.5 }); }
    } else if (sit.tFase > DURACION[sit.fase]) {
      const acaba = sit.fase;
      sit.fase = ORDEN[ORDEN.indexOf(sit.fase) + 1];
      sit.tFase = 0;
      // Topes mecánicos: el castillete llega arriba o abajo, la pértiga se suelta
      if (acaba === 'subida' || acaba === 'bajada' || acaba === 'retirada') audio.golpe(plataforma.getWorldPosition(_w), { tipo: 'clac', nivel: 0.7 });
      if (sit.fase === 'avance') prepararParada(sit.pkParada + 1);
    }
    const f = sit.fase, u = sit.tFase / (DURACION[f] || 1);
    estado.fase = f;
    // Castillete: altura (pecho de los operarios a la altura del hilo) y desplazamiento lateral hacia el poste
    const sube = f === 'subida' ? suave(u) : ['tierra', 'trabajo', 'retirada'].includes(f) ? 1 : f === 'bajada' ? 1 - suave(u) : 0;
    const hMax = H_HILO - 1.42 - (Y_TECHO + 0.22);
    tijera(hMax * sube, -s * 0.55 * sube);   // Z de la dresina es la derecha: hacia el poste del lado de la vía
    colocar();
    destellos.forEach((d, i) => { d.material = Math.sin(sit.t * 7 + i * 1.7) > 0.1 ? M.destello : M.destelloApagado; });
    focoPlat.intensity = noche ? 40 : 0;
    fijarCarril(M.sucios, raiz.getWorldPosition(_v).y, []);

    // Pantógrafo de auscultación: frotador justo bajo el hilo, que empuja ~3 cm hacia arriba
    raiz.updateMatrixWorld(true);
    const pkPanto = sit.pk + X_PANTO;
    const enVano = pkPanto > cat.pkA && pkPanto < cat.pkB;
    empujes.length = 0;
    const hHilo = H_HILO - 0.022;               // sobre la cabeza de carril
    const yMes = hHilo - (Y_TECHO + 0.1) - 0.04 + 0.03;
    const xr = 0.15, H0 = new THREE.Vector3(-0.55, 0.32, 0), P = new THREE.Vector3(0.05, yMes, 0), K = new THREE.Vector3(0.75, 0.32 + (yMes - 0.32) * 0.5, 0);
    for (const [m, a, b] of [[pBrazoI, H0, K], [pBrazoS, K, P]]) { const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, 0.5); m.scale.x = d.length(); m.rotation.z = Math.atan2(d.y, d.x); }
    mesilla.position.copy(P);
    void xr;
    if (enVano) {
      const k = nodoEn(pkPanto);
      const cotaRest = cat.restC[k].y;
      empujes.push({ k, min: cotaRest + 0.03 }, { k: k + 1, min: cotaRest + 0.025 }, { k: k - 1, min: cotaRest + 0.025 });
    }
    // Zigzag: la marca de contacto sigue al hilo sobre el frotador
    const dsc = Catenaria ? Catenaria.descentramiento(pkPanto, s) : 0;
    marca.position.z = Math.max(-0.55, Math.min(0.55, -dsc));
    estado.descentramiento = Math.round(dsc * 1000);
    estado.alturaHilo = enVano ? Math.round((cat.nodosC[nodoEn(pkPanto)].y - cat.restC[nodoEn(pkPanto)].y) * 1000) : 30;

    // Operarios: A con la pértiga de puesta a tierra, B ajusta la péndola
    const kTrab = cat.pendolas.length ? cat.pendolas[0].k : nodoEn(sit.pk);
    const pHilo = cat.nodosC[kTrab].clone();
    const ganchoObj = cat.nodosC[Math.max(1, kTrab + 3)] || pHilo;
    const tierra = f === 'tierra' ? suave(u / 0.7) : f === 'trabajo' ? 1 : f === 'retirada' ? 1 - suave(u) : 0;
    const base = opA.o.getWorldPosition(new THREE.Vector3()); grupo.worldToLocal(base); base.y += 0.95;
    const reposo = base.clone().add(new THREE.Vector3(0, 3.2, 0));
    const punta = reposo.clone().lerp(ganchoObj.clone().add(_v.set(0, 0.02, 0)), tierra);
    const dirP = punta.clone().sub(base).normalize();
    pertiga.position.copy(base).addScaledVector(dirP, 1.7);
    pertiga.quaternion.setFromUnitVectors(_up, dirP);
    gancho.position.copy(base).addScaledVector(dirP, 3.4);
    const polo = new THREE.Vector3(0, -1, 0);
    // Punto de la barandilla (lado del poste) junto a cada operario
    const enBarandilla = (op, dx) => { const p = plataforma.localToWorld(new THREE.Vector3(op.x0 + dx, 1.15, -s * 1.05)); return grupo.worldToLocal(p); };
    const conPertiga = ['tierra', 'trabajo', 'retirada'].includes(f) || (f === 'subida' && u > 0.6);
    if (conPertiga) {
      brazoIK(opA.brazos[0], opA.hombros[0], base.clone().addScaledVector(dirP, 0.25), polo);
      brazoIK(opA.brazos[1], opA.hombros[1], base.clone().addScaledVector(dirP, 0.75), polo);
    } else {
      // Mientras el castillete se mueve o la dresina avanza, se agarra a la barandilla con las dos manos
      brazoIK(opA.brazos[0], opA.hombros[0], enBarandilla(opA, -0.25), polo);
      brazoIK(opA.brazos[1], opA.hombros[1], enBarandilla(opA, 0.25), polo);
    }
    pertiga.visible = gancho.visible = conPertiga;
    // Chispa al tocar el hilo (descarga de la energía residual)
    if (f === 'tierra' && u > 0.7 && !sit.chispa) { sit.chispa = 0.18; audio.golpe(grupo.localToWorld(ganchoObj.clone()), { tipo: 'chispa', nivel: 1 }); for (let i = 0; i < 4; i++) chispas.emitir(ganchoObj, 12, { tam: 0.03, crece: 0, vida: 0.4, alfa: 1, sube: 1.5, fuerza: 3 }); }
    if (f !== 'tierra') sit.chispa = f === 'trabajo' || f === 'retirada' ? -1 : 0;
    if (sit.chispa > 0) sit.chispa -= dt;
    luzChispa.position.copy(ganchoObj);
    luzChispa.intensity = sit.chispa > 0 ? 120 * (sit.chispa / 0.18) : 0;
    chispas.actualizar(dt);
    // Cable de tierra: del gancho baja por la pértiga y cuelga hasta la grapa del carril
    const pos = gCable.attributes.position.array;
    const grapa = aLocal(enVia(sit.pk - 1.5, s, s * 0.9)); grapa.y += 0.03;
    const pie = base.clone();
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      let p;
      if (t < 0.35) p = gancho.position.clone().lerp(pie, t / 0.35);
      else { const w = (t - 0.35) / 0.65; p = pie.clone().lerp(grapa, w); p.y -= Math.sin(Math.PI * w) * 0.6; }
      pos.set([p.x, p.y, p.z], i * 3);
    }
    gCable.attributes.position.needsUpdate = true;
    cableTierra.visible = tierra > 0.9;
    // Operario B: las dos manos a la péndola y al hilo, que se mueve unos milímetros con la llave
    const trabaja = f === 'trabajo';
    const osc = trabaja ? Math.sin(sit.t * 5) * 0.006 : 0;
    // La llave gira en la grapa de la péndola (gestos alternos de las dos manos); la otra mano sujeta el hilo
    const giro = sit.t * 2.2;
    const manoD = trabaja ? pHilo.clone().add(new THREE.Vector3(Math.cos(giro) * 0.06, 0.25 + Math.sin(giro) * 0.04, Math.sin(giro) * 0.06)) : null;
    const manoI = trabaja ? pHilo.clone().add(new THREE.Vector3(0, -0.02 + Math.max(0, Math.sin(giro * 0.5)) * 0.03, 0)) : null;
    const hB = opB.o.getWorldPosition(new THREE.Vector3()); grupo.worldToLocal(hB);
    const preparado = f === 'tierra' || f === 'retirada';
    brazoIK(opB.brazos[1], opB.hombros[1], manoD || (preparado ? hB.clone().add(new THREE.Vector3(0.25, 1.15, 0.12)) : enBarandilla(opB, 0.25)), polo);
    brazoIK(opB.brazos[0], opB.hombros[0], manoI || (preparado ? hB.clone().add(new THREE.Vector3(0.25, 1.1, -0.12)) : enBarandilla(opB, -0.25)), polo);
    // Cabezas: miran al hilo cuando trabajan; el cuerpo acompaña el vaivén de la plataforma
    const mueve = f === 'subida' || f === 'bajada' || f === 'avance';
    for (const [op, obj] of [[opA, conPertiga ? ganchoObj : null], [opB, trabaja || preparado ? pHilo : null]]) {
      const cab = op.cabeza.getWorldPosition(new THREE.Vector3()); grupo.worldToLocal(cab);
      const inc = obj ? Math.atan2(obj.y - cab.y, Math.hypot(obj.x - cab.x, obj.z - cab.z)) : 0;
      op.cabeza.rotation.z += ((obj ? Math.min(0.9, inc) : 0) - op.cabeza.rotation.z) * Math.min(1, dt * 3);
      op.o.rotation.x = mueve ? Math.sin(sit.t * 3.1 + op.x0) * 0.025 : 0;
      op.o.position.y = 0.05 + (mueve ? Math.abs(Math.sin(sit.t * 3.1 + op.x0)) * 0.012 : 0);
      // Cabo del arnés: de la espalda a la barandilla
      const pa = op.o.localToWorld(new THREE.Vector3(-0.13, 1.1, 0)); grupo.worldToLocal(pa);
      const pb = enBarandilla(op, 0);
      const pm = pa.clone().lerp(pb, 0.5); pm.y -= 0.25;
      op.cabo.geometry.setFromPoints([pa, pm, pb]);
    }
    // Sonidos
    const pw = raiz.getWorldPosition(new THREE.Vector3());
    sit.snd.diesel.colocar(pw).set({ rpm: f === 'avance' ? 1150 + sit.v * 120 : mueve ? 1050 : 820, carga: f === 'avance' ? 0.55 : mueve ? 0.45 : 0.22 });
    sit.snd.hidr.colocar(plataforma.getWorldPosition(new THREE.Vector3())).set({ nivel: f === 'subida' || f === 'bajada' ? 0.85 : 0, tono: f === 'subida' ? 0.3 + 0.5 * u : 0.7 - 0.4 * u });
    // La catenaria zumba en tensión; tras la puesta a tierra queda descargada y callada
    sit.snd.zumbido.colocar(grupo.localToWorld(pHilo.clone())).set({ nivel: tierra > 0.9 ? 0 : 1 });
    llave.visible = trabaja;
    if (manoD) llave.position.copy(manoD);
    if (trabaja) empujes.push({ k: kTrab, d: new THREE.Vector3(0, 0.004 + osc, 0) });
    simular();
  }

  // ---- Cámaras ----
  function pose(modo) {
    if (!sit) return null;
    raiz.updateMatrixWorld(true);
    const zOut = -sit.s;
    if (modo === 'castillete') {
      // Anclada a la plataforma: sube y baja con ella, mirando al hilo sobre los operarios
      const pos = plataforma.localToWorld(new THREE.Vector3(-3.9, 2.3, zOut * 1.5));
      const obj = grupo.localToWorld(cat.nodosC[cat.pendolas[0]?.k ?? 1].clone());
      return { pos, obj };
    }
    if (modo === 'pantografo') {
      const pos = panto.localToWorld(new THREE.Vector3(1.1, H_HILO - Y_TECHO - 0.55, zOut * 0.9));
      const obj = panto.localToWorld(mesilla.position.clone().add(new THREE.Vector3(0, 0.05, 0)));
      return { pos, obj };
    }
    const pos = raiz.localToWorld(new THREE.Vector3(9, 6.5, zOut * 10));
    const obj = raiz.localToWorld(new THREE.Vector3(-1, 3.5, 0));
    return { pos, obj };
  }

  return { grupo, estado, montar, desmontar, actualizar, pose, get sitio() { return sit; } };
}
