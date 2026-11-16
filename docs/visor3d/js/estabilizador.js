// Estabilizador dinámico de vía (tipo Plasser & Theurer DGS): avanza de forma continua, agarra los carriles, carga la
// vía hacia abajo y la hace vibrar en horizontal (~35 Hz, ±1,5 mm) para que el balasto se reacomode
//
// Delante la vía está en su cota alta tras el bateo; detrás de las unidades de estabilización ha descendido de forma
// controlada (−4 mm) y el balasto queda algo más compacto. La vía bajo las unidades vibra con ellas.
// Jerarquía: Root_Chassis › Unidades_de_Estabilizacion (Rodillos_Abrazadera, Cilindros_de_Carga, Masa_Oscilante).
// Ejes locales: X adelante, Y arriba, Z a la derecha.

import * as THREE from 'three';
import { GALGA, Z_CAJON, suave } from './tramo-via.js';
import { materialesMaquina, caja, cil, mangueras, focoHalogeno, pegatina, cabina, bogie, crearPolvo, fijarCarril } from './pbr-maquinas.js';

const L = 16.5, X_UNID = [-1.6, 1.6];
export const ASIENTO = 0.004;   // m de descenso controlado
const FREC = 35, AMP = 0.0015;

export function crearEstabilizador({ tramo }) {
  // Polvo colado en todas las rendijas y hollín alrededor de las chimeneas
  const M = materialesMaquina({ alturaSucio: 1.15, fuerza: 0.9, sucio: '#c4bfb3', hollin: 2 });
  const raiz = new THREE.Group(); raiz.name = 'Root_Chassis';
  // Bloque rectangular macizo
  raiz.add(caja(L - 0.4, 0.5, 2.75, M.chasis, 0, 1.12, 0));
  raiz.add(caja(L - 5.8, 2.1, 2.75, M.amarillo, 0, 2.4, 0), caja(L - 5.9, 0.12, 2.82, M.amarilloOsc, 0, 3.5, 0));
  for (let x = -L / 2 + 3.6; x < L / 2 - 3.4; x += 1.25) for (const z of [-1, 1]) raiz.add(caja(0.9, 1.3, 0.04, M.amarilloOsc, x, 2.35, z * 1.39));
  // Cabinas sobre silentblocks (cilindros de goma negra) que aíslan de la vibración
  const cabs = [];
  for (const [x, sg] of [[L / 2 - 1.5, 1], [-L / 2 + 1.5, -1]]) {
    const c = cabina(M, { sentido: sg, tinte: sg > 0 ? 'verde' : 'marron', largo: 2.7, y0: 1.62 });
    for (const dx of [-0.9, 0.9]) for (const z of [-1.1, 1.1]) c.add(cil(0.13, 0.22, M.goma, dx, 1.48, z));
    c.position.x = x;
    raiz.add(c); cabs.push(c);
  }
  // Cubierta de rejilla sobre la plataforma central (como en la foto) y chimeneas
  const tejado = new THREE.Group();
  for (const x of [-L / 2 + 3.4, 0, L / 2 - 3.4]) for (const z of [-1.3, 1.3]) tejado.add(cil(0.05, 1.0, M.amarilloOsc, x, 4.05, z));
  const malla = caja(L - 6.4, 0.05, 2.9, M.tramex, 0, 4.58, 0); malla.material = M.tramex;
  tejado.add(malla);
  raiz.add(tejado);
  const chims = [cil(0.13, 1.1, M.oscuro, -2.6, 4.0, 0.7), cil(0.13, 1.1, M.oscuro, 2.2, 4.0, -0.7)];
  raiz.add(...chims);
  raiz.add(caja(1.2, 0.9, 1.4, M.tramex, 0.6, 3.95, 0.4));   // radiador
  const bogies = new THREE.Group(); bogies.name = 'Bogies';
  bogies.add(bogie(M, L / 2 - 2.3), bogie(M, -L / 2 + 2.3));
  raiz.add(bogies);
  for (const x of X_UNID) for (const z of [-1.0, 1.0]) raiz.add(focoHalogeno(M, x, 1.3, z));
  const luz = new THREE.SpotLight('#fff4dc', 0, 12, 1.0, 0.5, 1.2);
  luz.position.set(0, 1.3, 0); luz.target.position.set(0, -0.3, 0);
  raiz.add(luz, luz.target);
  for (const z of [-1, 1]) raiz.add(pegatina(M.pegRayo, 0, 2.6, z * 1.4, z > 0 ? 0 : Math.PI, 0.24), pegatina(M.pegMano, X_UNID[1] + 0.9, 1.5, z * 1.4, z > 0 ? 0 : Math.PI, 0.18));

  // ---- Unidades de estabilización ----
  const unidadesG = new THREE.Group(); unidadesG.name = 'Unidades_de_Estabilizacion';
  const unidades = [], rodillos = [], masas = [], fantasmas = [], cilindros = [];
  const matFant = new THREE.MeshBasicMaterial({ color: '#9aa1a8', transparent: true, opacity: 0.22, depthWrite: false });
  for (const x of X_UNID) {
    const u = new THREE.Group();
    u.add(caja(1.5, 0.5, 1.5, M.oscuro, 0, 0.66, 0));                   // carro de acero macizo (entre carriles)
    for (const z of [-1, 1]) u.add(caja(1.3, 0.28, 0.3, M.oscuro, 0, 0.52, z * GALGA));
    const masa = new THREE.Group(); masa.name = 'Masa_Oscilante';
    masa.add(caja(0.9, 0.42, 1.0, M.amarilloOsc, 0, 0, 0), cil(0.16, 0.5, M.acero, 0.2, 0.05, 0, 'z'));
    masa.position.set(0, 1.05, 0); u.add(masa); masas.push(masa);
    for (const zR of [-GALGA, GALGA]) {
      const g = new THREE.Group(); g.name = 'Rodillos_Abrazadera';
      for (const dx of [-0.45, 0.45]) {
        // Rueda de pestaña sobre el carril: oscura, con el interior de la pestaña pulido por la fricción
        g.add(cil(0.2, 0.1, M.oscuro, dx, 0.2, 0, 'z', 20), cil(0.215, 0.018, M.pulido, dx, 0.2, -Math.sign(zR) * 0.05, 'z', 20));
      }
      // Discos que muerden la cabeza del carril por los lados
      for (const lado of [-1, 1]) { const dsc = cil(0.12, 0.05, M.oscuro, 0, 0.0, lado * 0.075, 'y', 18); dsc.userData.lado = lado; g.add(dsc); rodillos.push(dsc); }
      g.position.z = zR;
      u.add(g);
    }
    // Estela de la vibración (desenfoque de movimiento) en los rodillos
    const fan = new THREE.Group();
    for (const zR of [-GALGA, GALGA]) for (const dx of [-0.45, 0.45]) fan.add(cil(0.235, 0.16, matFant, dx, 0.2, zR, 'z', 20));
    fan.visible = false;
    u.add(fan); fantasmas.push(fan);
    u.position.set(x, 0, 0);
    unidadesG.add(u); unidades.push(u);
    // Cilindros de carga cromados (dos por unidad) entre el chasis y el carro
    const cg = new THREE.Group(); cg.name = 'Cilindros_de_Carga';
    for (const z of [-0.85, 0.85]) {
      cg.add(cil(0.11, 0.42, M.amarillo, x, 1.2, z));
      const v = cil(0.06, 0.5, M.cromo, x, 0.9, z); cg.add(v); cilindros.push(v);
      const aceite = caja(0.12, 0.2, 0.12, M.aceite, x, 1.0, z); aceite.castShadow = false; cg.add(aceite);
    }
    raiz.add(cg);
  }
  raiz.add(unidadesG);
  for (const z of [-1, 1]) raiz.add(mangueras(M.manguera, new THREE.Vector3(X_UNID[0], 1.35, z * 1.0), new THREE.Vector3(X_UNID[1], 1.35, z * 1.0), 5, 0.4));
  // Medición del asiento: carros y láseres delante y detrás de las unidades
  const carros = [], laseres = [];
  const matLaser = new THREE.MeshBasicMaterial({ color: '#ff2b2b' });
  for (const x of [L / 2 + 1.6, -L / 2 - 1.2]) {
    const c = new THREE.Group();
    c.add(caja(0.6, 0.16, 1.9, M.chasis, 0, 0.4, 0), caja(0.22, 0.22, 0.22, M.oscuro, 0, 0.6, 0));
    for (const z of [-GALGA, GALGA]) c.add(cil(0.15, 0.08, M.acero, 0, 0.15, z, 'z'));
    c.position.x = x; raiz.add(c); carros.push(c);
  }
  for (const z of [-GALGA, GALGA]) { const l = caja(1, 0.01, 0.01, matLaser, 0, 0.62, z); l.castShadow = false; raiz.add(l); laseres.push(l); }

  const ficha = { capa: 'Trabajos de mantenimiento', nombre: 'Estabilizador dinámico de vía', info: 'Estabilizador dinámico (tipo Plasser & Theurer DGS): dos unidades con rodillos que muerden el carril, cuatro cilindros de carga vertical y masas excéntricas que hacen vibrar la vía en horizontal (~35 Hz, ±1,5 mm). El balasto se reacomoda y la vía asienta unos 4 mm de forma controlada.' };
  raiz.traverse((o) => { if (o.isMesh) o.userData = ficha; });

  // ---- Efectos: polvo fino a ras de suelo y chispas de los rodillos ----
  const polvo = crearPolvo(360, '#d6d0c4');
  const chispas = crearPolvo(120, '#ffc061');
  chispas.puntos.material.blending = THREE.AdditiveBlending;
  const efectos = new THREE.Group(); efectos.add(polvo.puntos, chispas.puntos);

  // ---- Estado ----
  const estado = { activo: false, fase: 'agarre', agarre: 0, carga: 0, asientoMm: 0, vel: 0 };
  let pk = 0, tiempo = 0, vib = 0;
  const pkDel = () => pk + X_UNID[1] + 0.8, pkTra = () => pk + X_UNID[0] - 0.8;
  // Proveedor de desviación: descenso entre las unidades (interpolado de cota alta a asentada) y vibración bajo ellas
  function desviacion(p) {
    const c = estado.carga;
    let v = 0, h = 0;
    if (p < pkDel()) v = -ASIENTO * c * suave((pkDel() - p) / (pkDel() - pkTra()));
    if (p > pkTra() - 1.2 && p < pkDel() + 1.2) h = vib * c;
    return { v, h };
  }
  /** Compactación del balasto por detrás de las unidades. */
  const compactacion = (p) => (p < pkTra() ? -0.004 * estado.carga : p < pkDel() ? -0.004 * estado.carga * suave((pkDel() - p) / (pkDel() - pkTra())) : 0);

  function montar(pkCentro) { pk = pkCentro; tiempo = 0; estado.activo = true; estado.agarre = 0; estado.carga = 0; }
  function desmontar() { estado.activo = false; }

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _bx = new THREE.Matrix4();
  function colocar() {
    _a.copy(tramo.punto(pk + 6)); _b.copy(tramo.punto(pk - 6));
    raiz.position.copy(_a).add(_b).multiplyScalar(0.5);
    _x.copy(_a).sub(_b).normalize(); _z.crossVectors(_x, _up).normalize(); _y.crossVectors(_z, _x);
    raiz.quaternion.setFromRotationMatrix(_bx.makeBasis(_x, _y, _z));
  }

  function actualizar(dt, { pkObjetivo, noche = true, yCarril = 0 } = {}) {
    if (!estado.activo) return;
    dt = Math.min(dt, 0.1);
    tiempo += dt;
    // Agarre (1,5 s) y carga progresiva; luego marcha continua
    estado.agarre = Math.min(1, tiempo / 1.5);
    estado.carga = suave(Math.min(1, Math.max(0, (tiempo - 1.2) / 2)));
    estado.fase = estado.agarre < 1 ? 'agarre' : estado.carga < 1 ? 'carga' : 'estabilizacion';
    estado.vel = estado.carga < 1 ? 0 : Math.max(0, Math.min(0.6, (pkObjetivo - pk) * 0.25));
    pk += estado.vel * dt;
    const t = performance.now() / 1000;
    vib = Math.sin(t * 2 * Math.PI * FREC) * AMP;
    const ag = suave(estado.agarre);
    for (const r of rodillos) r.position.z = r.userData.lado * (0.11 - 0.035 * ag);
    // Unidades: vibración transversal violenta y carga vertical (el carro baja con la vía)
    const dU = tramo.desviacion(pk);
    unidades.forEach((u, i) => {
      u.position.z = vib * estado.carga;
      u.position.y = dU.v;
      fantasmas[i].visible = estado.carga > 0.5;
      masas[i].rotation.x = t * 2 * Math.PI * FREC * 0.02;   // excéntrica (vista ralentizada)
    });
    for (const c of cilindros) c.position.y = 0.9 + dU.v * 0.5;
    estado.asientoMm = Math.round(ASIENTO * estado.carga * 10000) / 10;
    tramo.marcar(pkTra() - 1.5, pkDel() + 1.5);
    // Láseres de medición entre carros
    const cA = carros[0].position, cB = carros[1].position;
    carros.forEach((c) => { c.position.y = tramo.desviacion(pk + c.position.x).v; });
    for (const l of laseres) { l.position.x = (cA.x + cB.x) / 2; l.position.y = (cA.y + cB.y) / 2 + 0.62; l.scale.x = cA.x - cB.x; l.rotation.z = Math.atan2(cA.y - cB.y, cA.x - cB.x); }
    // Polvo fino de los cajones y chispas ocasionales en los rodillos
    if (estado.carga > 0.5) {
      for (let k = 0; k < 2; k++) {
        const p = pkTra() + Math.random() * (pkDel() - pkTra()), uL = (Math.random() - 0.5) * 2.6;
        polvo.emitir(tramo.punto(p, uL, Z_CAJON), 1, { tam: 0.12, crece: 0.5, vida: 2.2, alfa: 0.4, sube: 0.12, fuerza: 0.6 });
      }
      if (Math.random() < dt * 6) {
        const xU = X_UNID[Math.random() < 0.5 ? 0 : 1] + (Math.random() < 0.5 ? -0.45 : 0.45);
        chispas.emitir(tramo.punto(pk + xU, (Math.random() < 0.5 ? -GALGA : GALGA) * tramo.s, 0.02), 5, { tam: 0.025, crece: 0, vida: 0.35, alfa: 1, sube: 1.6, fuerza: 2.2 });
      }
    }
    luz.intensity = noche ? 50 : 0;
    colocar();
    fijarCarril(M.sucios, yCarril, chims.map((c) => c.getWorldPosition(new THREE.Vector3())));
    polvo.actualizar(dt);
    chispas.actualizar(dt);
  }

  /** Perfil de asiento medido (mm) a lo largo del tramo, para el HUD. */
  function perfilAsiento() {
    const out = [];
    for (let p = pk - 30; p <= pk + 30; p += 0.6) out.push([p - pk, -desviacion(p).v * 1000]);
    return out;
  }

  // ---- Cámaras ----
  function pose(modo) {
    raiz.updateMatrixWorld(true);
    const zOut = -tramo.s;
    if (modo === 'rodillos') {
      // A pocos centímetros de los rodillos de la unidad delantera, por el lado exterior
      const pos = raiz.localToWorld(new THREE.Vector3(X_UNID[1] + 1.15, 0.26, zOut * (GALGA + 0.85)));
      const obj = raiz.localToWorld(new THREE.Vector3(X_UNID[1] + 0.45, 0.15, zOut * GALGA));
      return { pos, obj, mundo: true };
    }
    if (modo === 'laser') {
      const pos = raiz.localToWorld(new THREE.Vector3(L / 2 + 6, 1.4, zOut * 2.2));
      const obj = raiz.localToWorld(new THREE.Vector3(-2, 0.5, 0));
      return { pos, obj, mundo: true };
    }
    return { pos: tramo.punto(pk + 14, 11, 7), obj: tramo.punto(pk, 0, 1) };
  }

  return {
    raiz, efectos, estado, desviacion, compactacion, montar, desmontar, actualizar, pose, perfilAsiento,
    get pk() { return pk; }, get vibrando() { return estado.carga > 0.5; }, LARGO: L,
  };
}
