// Operario articulado del tren de trabajo: esqueleto procedimental con cinemática inversa de dos huesos en las piernas
//
// Pelvis › muslo › rodilla › espinilla › tobillo › bota (las dos piernas), tronco con chaleco reflectante, hombros ›
// brazo › codo › antebrazo › mano, cuello › cabeza con casco. Estados:
//   andar      marcha con zancada, balanceo de brazos y pasos que suenan en el balasto
//   mirar      de pie, con el peso cambiando de pierna y las manos en la cintura
//   agacharse  en cuclillas con LAS DOS piernas: los pies quedan plantados y bajan caderas y rodillas
//   senalizar  piquete: farol en alto, balanceándolo
//   radio      habla por la emisora con la mano en la cara
// Ejes locales: X hacia donde mira, Y arriba, Z a su derecha; origen en el suelo entre los pies.

import * as THREE from 'three';

const PIEL = ['#c99a78', '#b07f5f', '#e0b48f', '#8d5f43'];
const L_MUSLO = 0.44, L_ESPINILLA = 0.43, Y_TOBILLO = 0.08, Y_CADERA = L_MUSLO + L_ESPINILLA + Y_TOBILLO - 0.02;

const materiales = (() => {
  let M = null;
  return () => {
    if (M) return M;
    const std = (c, r = 0.75, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    M = {
      chaleco: std('#ff6a00', 0.6), reflectante: new THREE.MeshStandardMaterial({ color: '#d9dcc8', roughness: 0.3, metalness: 0.2, emissive: '#e8ecd0', emissiveIntensity: 0.25 }),
      pantalon: std('#1d2633', 0.85), bota: std('#22201e', 0.7), casco: std('#f4f4ef', 0.35), cinta: std('#d97706', 0.5),
      guante: std('#3b3b37', 0.8), radio: std('#151515', 0.5), farolR: new THREE.MeshBasicMaterial({ color: '#ff2a1a' }), farolB: new THREE.MeshBasicMaterial({ color: '#fff3d0' }),
      pieles: PIEL.map((c) => std(c, 0.8)),
      cuero: std('#6b4a2e', 0.85), visor: new THREE.MeshStandardMaterial({ color: '#1c2a1a', roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.85 }),
      gafas: new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 }),
      led: new THREE.MeshBasicMaterial({ color: '#e8f2ff' }), pantallaTab: new THREE.MeshBasicMaterial({ color: '#7fd4ff' }),
    };
    return M;
  };
})();
const caja = (sx, sy, sz, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); me.castShadow = true; return me; };
const capsula = (r, l, m, y) => { const me = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 8), m); me.position.y = y; me.castShadow = true; return me; };

/** Ángulos de cadera y rodilla para llevar el tobillo a (dx adelante, dy abajo) desde la cadera, en el plano sagital. */
function ik2(dx, dy) {
  const d = Math.min(L_MUSLO + L_ESPINILLA - 1e-4, Math.max(0.05, Math.hypot(dx, dy)));
  const a = Math.atan2(dx, dy);                                   // del eje vertical hacia delante
  const cosK = (L_MUSLO * L_MUSLO + L_ESPINILLA * L_ESPINILLA - d * d) / (2 * L_MUSLO * L_ESPINILLA);
  const rodilla = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosK)));            // flexión (≥ 0)
  const cosA = (L_MUSLO * L_MUSLO + d * d - L_ESPINILLA * L_ESPINILLA) / (2 * L_MUSLO * d);
  const cadera = a + Math.acos(Math.max(-1, Math.min(1, cosA)));                 // muslo adelantado: rodilla hacia delante
  return { cadera, rodilla };
}

/**
 * @param {object} o  piel (0..3), farol: 'rojo'|'blanco'|null, nombre
 */
export function crearOperario({ piel = Math.floor(Math.random() * 4), farol = 'blanco', nombre = 'Operario', chaleco = null, ropa = null, colorCasco = null, extras = [] } = {}) {
  const M0 = materiales();
  // Variantes de vestuario: chaleco, ropa y casco de otro color sin tocar los materiales compartidos
  const M = { ...M0 };
  if (chaleco) M.chaleco = new THREE.MeshStandardMaterial({ color: chaleco, roughness: 0.6 });
  if (ropa) M.pantalon = new THREE.MeshStandardMaterial({ color: ropa, roughness: 0.85 });
  if (colorCasco) M.casco = new THREE.MeshStandardMaterial({ color: colorCasco, roughness: 0.35 });
  const ex = new Set(extras);
  const raiz = new THREE.Group(); raiz.name = nombre;
  const pelvis = new THREE.Group(); pelvis.position.y = Y_CADERA; raiz.add(pelvis);
  pelvis.add(caja(0.2, 0.16, 0.34, M.pantalon, 0, 0, 0));
  // Piernas
  const piernas = [-1, 1].map((lado) => {
    const cadera = new THREE.Group(); cadera.position.set(0, -0.04, lado * 0.1); pelvis.add(cadera);
    cadera.add(capsula(0.075, L_MUSLO - 0.12, M.pantalon, -L_MUSLO / 2));
    const rodilla = new THREE.Group(); rodilla.position.y = -L_MUSLO; cadera.add(rodilla);
    rodilla.add(capsula(0.062, L_ESPINILLA - 0.1, M.pantalon, -L_ESPINILLA / 2));
    const tobillo = new THREE.Group(); tobillo.position.y = -L_ESPINILLA; rodilla.add(tobillo);
    tobillo.add(caja(0.27, 0.09, 0.11, M.bota, 0.06, -Y_TOBILLO + 0.045, 0));
    return { lado, cadera, rodilla, tobillo };
  });
  // Tronco con chaleco y bandas reflectantes
  const tronco = new THREE.Group(); tronco.position.y = 0.06; pelvis.add(tronco);
  tronco.add(caja(0.24, 0.52, 0.4, M.chaleco, 0, 0.28, 0));
  for (const y of [0.16, 0.36]) tronco.add(caja(0.245, 0.045, 0.405, M.reflectante, 0, y, 0));
  tronco.add(caja(0.02, 0.4, 0.05, M.reflectante, 0.125, 0.27, 0.12), caja(0.02, 0.4, 0.05, M.reflectante, 0.125, 0.27, -0.12));
  const cuello = new THREE.Group(); cuello.position.y = 0.58; tronco.add(cuello);
  const cabeza = new THREE.Group(); cabeza.position.y = 0.1; cuello.add(cabeza);
  const cara = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10), M.pieles[piel % 4]); cara.scale.set(1, 1.15, 0.95); cara.castShadow = true;
  cabeza.add(cara);
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.casco); casco.position.y = 0.035; casco.castShadow = true;
  cabeza.add(casco, caja(0.3, 0.012, 0.26, M.casco, 0.04, 0.035, 0), caja(0.252, 0.02, 0.252, M.cinta, 0, 0.06, 0));
  // Brazos
  const brazos = [-1, 1].map((lado) => {
    const hombro = new THREE.Group(); hombro.position.set(0, 0.5, lado * 0.23); tronco.add(hombro);
    hombro.add(capsula(0.055, 0.2, M.chaleco, -0.15));
    const codo = new THREE.Group(); codo.position.y = -0.3; hombro.add(codo);
    codo.add(capsula(0.047, 0.18, M.pantalon, -0.13));
    const mano = new THREE.Group(); mano.position.y = -0.28; codo.add(mano);
    mano.add(caja(0.08, 0.1, 0.05, M.guante, 0, -0.03, 0));
    return { lado, hombro, codo, mano };
  });
  // Farol en la mano izquierda y emisora en el pecho
  const farolG = new THREE.Group();
  farolG.add(caja(0.1, 0.14, 0.1, M.bota, 0, -0.12, 0), caja(0.08, 0.09, 0.08, farol === 'rojo' ? M.farolR : M.farolB, 0, -0.12, 0.0));
  farolG.visible = Boolean(farol);
  brazos[0].mano.add(farolG);
  tronco.add(caja(0.05, 0.12, 0.04, M.radio, 0.13, 0.42, -0.1));
  // Equipos de protección y útiles
  let pantalla = null, frontal = null, tablet = null;
  if (ex.has('pantalla')) {                // pantalla facial tintada abatible (soldador)
    pantalla = new THREE.Group(); pantalla.position.set(0.12, 0.06, 0);
    pantalla.add(caja(0.02, 0.2, 0.24, M.visor, 0.03, -0.1, 0), caja(0.05, 0.03, 0.26, M.radio, 0.0, 0.0, 0));
    cabeza.add(pantalla);
  }
  if (ex.has('gafas')) cabeza.add(caja(0.03, 0.045, 0.2, M.gafas, 0.1, 0.02, 0));
  if (ex.has('orejeras')) { for (const z of [-1, 1]) cabeza.add(caja(0.08, 0.1, 0.04, M.radio, 0, 0, z * 0.12)); cabeza.add(caja(0.03, 0.03, 0.26, M.radio, 0, 0.12, 0)); }
  if (ex.has('frontal')) { frontal = caja(0.04, 0.035, 0.06, M.led, 0.125, 0.075, 0); cabeza.add(frontal); }
  if (ex.has('polainas')) for (const p of piernas) p.rodilla.add(capsula(0.072, 0.16, M.cuero, -0.3));
  if (ex.has('guantesLargos')) for (const b of brazos) b.codo.add(capsula(0.06, 0.12, M.cuero, -0.2));
  if (ex.has('tablet')) { tablet = new THREE.Group(); tablet.add(caja(0.02, 0.2, 0.15, M.radio, 0, 0, 0), caja(0.022, 0.17, 0.12, M.pantallaTab, 0.003, 0, 0)); tablet.position.set(0.05, -0.08, 0); tablet.rotation.z = 0.4; brazos[1].mano.add(tablet); }
  if (ex.has('emisoraHombro')) tronco.add(caja(0.05, 0.1, 0.04, M.radio, 0.02, 0.56, 0.2));
  const ficha = { capa: 'Trabajos de mantenimiento', nombre, info: 'Operario del tajo con chaleco de alta visibilidad, casco, farol y emisora.' };
  raiz.traverse((n) => { if (n.isMesh) n.userData = ficha; });

  // ---- Estado y animación ----
  const st = { estado: 'mirar', vel: 0, fase: Math.random() * 10, t: Math.random() * 10, agacha: 0, mirarYaw: 0, pasoPrev: 0 };
  /**
   * @param {number} dt
   * @param {object} o  estado, vel (m/s de la marcha, ya aplicada a la posición de raiz por quien lo mueve),
   *                    alPisar(lado) callback de cada pisada
   */
  function actualizar(dt, { estado = st.estado, vel = 0, alPisar = null, pose = null } = {}) {
    st.estado = estado; st.vel = vel; st.t += dt;
    const t = st.t;
    // Transición suave a cuclillas
    const objA = pose?.agacha ?? (estado === 'agacharse' ? 1 : 0);
    st.agacha += (objA - st.agacha) * Math.min(1, dt * 3);
    const a = st.agacha;
    const andando = vel > 0.05 && estado === 'andar';
    if (andando) st.fase += dt * vel / 0.68 * Math.PI;           // medio ciclo por paso de 0,68 m
    const fase = st.fase;
    // Pelvis: baja al agacharse (cuclillas) y oscila al andar
    const bob = andando ? Math.abs(Math.sin(fase)) * 0.035 - 0.015 : 0;
    pelvis.position.y = Y_CADERA - 0.47 * a + bob;
    pelvis.position.x = -0.12 * a;
    pelvis.rotation.y = andando ? Math.sin(fase) * 0.08 : 0;
    // Peso cambiando de pierna al estar de pie
    const balanceo = !andando && a < 0.5 ? Math.sin(t * 0.4) * 0.03 : 0;
    pelvis.position.z = balanceo;
    // Piernas: con los pies plantados (IK) de pie y en cuclillas; ciclo de marcha al andar
    for (const p of piernas) {
      let fx, fy;
      if (andando) {
        const ph = fase + (p.lado > 0 ? Math.PI : 0), s = Math.sin(ph), c = Math.cos(ph);
        fx = 0.3 * s;                                             // adelante y atrás
        const alza = Math.max(0, c) * 0.11;                       // pie en el aire en la fase de avance
        fy = pelvis.position.y - Y_TOBILLO - alza;
      } else {
        // De pie o en cuclillas: los dos pies quietos, uno algo adelantado
        fx = (p.lado > 0 ? 0.08 : -0.05) + 0.12 * a - pelvis.position.x;
        fy = pelvis.position.y - Y_TOBILLO;
      }
      const ik = ik2(fx, fy + 0.04);
      p.cadera.rotation.z = ik.cadera;
      p.rodilla.rotation.z = -ik.rodilla;
      p.tobillo.rotation.z = -(ik.cadera - ik.rodilla);             // bota paralela al suelo
      p.cadera.rotation.x = p.lado * 0.08 * a;                     // rodillas algo abiertas en cuclillas
    }
    // Pisadas: al cruzar el seno por cero
    if (andando) {
      const paso = Math.floor(fase / Math.PI);
      if (paso !== st.pasoPrev) { st.pasoPrev = paso; alPisar?.(paso % 2 ? 1 : -1); }
    }
    // Tronco: inclinado al agacharse y al andar
    tronco.rotation.z = -(0.55 * a + (andando ? 0.06 : 0));
    // Cabeza: mira la vía al agacharse, a los lados al andar
    cabeza.rotation.z = -0.35 * a + (andando ? -0.2 : 0);
    cabeza.rotation.y = andando ? Math.sin(t * 0.7) * 0.35 : Math.sin(t * 0.25) * 0.5 * (1 - a);
    // Brazos
    const [izq, der] = brazos;
    if (andando) {
      for (const b of brazos) { const sw = Math.sin(fase + (b.lado > 0 ? 0 : Math.PI)) * 0.45; b.hombro.rotation.z = sw; b.hombro.rotation.x = -b.lado * 0.08; b.codo.rotation.z = 0.35; }
    } else if (estado === 'senalizar') {
      // Farol en alto con balanceo lateral (señal de protección)
      izq.hombro.rotation.z = 2.4; izq.hombro.rotation.x = 0.25 + Math.sin(t * 2.2) * 0.45; izq.codo.rotation.z = 0.2;
      der.hombro.rotation.z = 0.1; der.hombro.rotation.x = -0.1; der.codo.rotation.z = 0.25;
    } else if (estado === 'radio') {
      der.hombro.rotation.z = 0.9; der.hombro.rotation.x = 0.55; der.codo.rotation.z = 2.3;
      izq.hombro.rotation.z = 0.25 + Math.sin(t * 1.3) * 0.15; izq.hombro.rotation.x = 0.1; izq.codo.rotation.z = 0.5;
    } else if (a > 0.3) {
      // En cuclillas: el farol hacia la traviesa y la otra mano en la rodilla
      izq.hombro.rotation.z = 1.25 * a; izq.hombro.rotation.x = 0.2; izq.codo.rotation.z = 0.6;
      der.hombro.rotation.z = 0.9 * a; der.hombro.rotation.x = -0.25; der.codo.rotation.z = 1.2 * a;
    } else {
      // De pie mirando: manos en la cintura
      for (const b of brazos) { b.hombro.rotation.z = -0.25; b.hombro.rotation.x = -b.lado * 0.55; b.codo.rotation.z = 1.75; }
    }
    // Pose impuesta por quien dirige la tarea (soldadura: palear, sostener el soplete, golpear…)
    if (pose) {
      if (pose.tronco !== undefined) tronco.rotation.z = -pose.tronco;
      if (pose.cabeza) { cabeza.rotation.z = pose.cabeza.z ?? cabeza.rotation.z; cabeza.rotation.y = pose.cabeza.y ?? cabeza.rotation.y; }
      for (const [k, b] of [['izq', izq], ['der', der]]) {
        const q = pose[k];
        if (!q) continue;
        b.hombro.rotation.z = q.z ?? b.hombro.rotation.z; b.hombro.rotation.x = q.x ?? b.hombro.rotation.x; b.codo.rotation.z = q.codo ?? b.codo.rotation.z;
      }
      if (pantalla && pose.pantalla !== undefined) pantalla.rotation.z = pose.pantalla ? 0 : 1.4;   // bajada o levantada
    }
  }
  return { raiz, actualizar, estado: st, farol: farolG, manos: { izq: brazos[0].mano, der: brazos[1].mano }, cabeza, frontal, tablet };
}
