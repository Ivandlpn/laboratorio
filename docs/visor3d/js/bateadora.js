// Bateadora-niveladora-alineadora (tipo Plasser & Theurer 09-3X): ciclo de levante, ripado y bateo traviesa a traviesa
//
// Trabaja en «stop & go» sobre el tramo dinámico (js/tramo-via.js), una traviesa por ciclo:
//   Avance → Agarre → Levante y ripado → Descenso de bates → Vibración (35 Hz) → Cierre → Apertura y ascenso
// Por delante la vía tiene asientos y desplazamientos laterales; por detrás queda en su geometría de proyecto.
//
// Jerarquía (THREE.Group con nombre): Root_Chassis › Bogies, Sistema_Medicion (carros delantero, central y trasero
// con la cuerda láser), Unidad_Levante_Ripado (cilindros y pinzas de rodillos) y Grupos_de_Bateo (un bastidor por
// carril con 8 bates en pares enfrentados). Ejes locales: X adelante (PK creciente), Y arriba, Z a la derecha.
// Aspecto: cabinas en los extremos, pórtico en arco sobre los grupos de bateo, cabina de bateo baja, módulo de motor,
// racimos de mangueras, bates oxidados con la punta pulida por el balasto y fugas de aceite en los cilindros.

import * as THREE from 'three';
import { ESPACIADO, GALGA, Z_CAJON, suave } from './tramo-via.js';
import { materialesMaquina, caja, cil, tubo, mangueras, focoHalogeno, pegatina, cabina, bogie, crearPolvo, crearPiedras, fijarCarril } from './pbr-maquinas.js';

const FASES = [['avance', 0.75], ['agarre', 0.22], ['levante', 0.4], ['descenso', 0.32], ['vibracion', 0.38], ['cierre', 0.45], ['retirada', 0.36]];
const T_CICLO = FASES.reduce((a, f) => a + f[1], 0);
export const NOMBRE_FASE = {
  avance: 'Avance a la traviesa', agarre: 'Agarre del carril', levante: 'Levante y ripado', descenso: 'Descenso de bates',
  vibracion: 'Vibración (35 Hz)', cierre: 'Cierre: compresión del balasto', retirada: 'Apertura y ascenso',
};
export const VEL_MEDIA_BATEO = ESPACIADO / T_CICLO;

// Defectos de la vía sin batear (m)
export const defectoV = (pk) => -(0.011 + 0.006 * Math.sin(pk * 2 * Math.PI / 9.7) + 0.005 * Math.sin(pk * 2 * Math.PI / 23.3 + 1.1) + 0.003 * Math.sin(pk * 2 * Math.PI / 4.1 + 0.4));
export const defectoH = (pk) => 0.009 * Math.sin(pk * 2 * Math.PI / 17.9 + 0.7) + 0.005 * Math.sin(pk * 2 * Math.PI / 7.3 + 2.1);

const L = 26.5, XB = 4.4, XL = 6.4;   // largo, grupo de bateo y unidad de levante desde el centro

export function crearBateadora({ tramo, audioActivo = () => false }) {
  const M = materialesMaquina({ alturaSucio: 0.85, fuerza: 0.8 });
  const raiz = new THREE.Group(); raiz.name = 'Root_Chassis';

  // ---- Chasis, cabinas, pórtico y motor ----
  raiz.add(caja(L - 1, 0.42, 2.6, M.chasis, 0, 1.1, 0));
  for (const z of [-1.31, 1.31]) raiz.add(caja(L - 1, 0.5, 0.06, M.amarillo, 0, 1.15, z));
  const cDel = cabina(M, { sentido: 1, tinte: 'verde', largo: 2.8, y0: 1.35 });
  cDel.position.x = L / 2 - 1.5;
  const cTra = cabina(M, { sentido: -1, tinte: 'marron', largo: 2.8, y0: 1.35 });
  cTra.position.x = -L / 2 + 1.5;
  raiz.add(cDel, cTra);
  // Pórtico en arco sobre los grupos de bateo: dos vigas inclinadas y la viga superior con la placa de la máquina
  const xA0 = XB - 4.6, xA1 = XB + 2.6;
  for (const z of [-1.25, 1.25]) {
    raiz.add(tubo(0.18, new THREE.Vector3(xA0 - 2.2, 1.3, z), new THREE.Vector3(xA0, 3.1, z), M.amarillo, 6));
    raiz.add(tubo(0.18, new THREE.Vector3(xA1 + 2.0, 1.3, z), new THREE.Vector3(xA1, 3.1, z), M.amarillo, 6));
    raiz.add(caja(xA1 - xA0 + 0.3, 0.42, 0.3, M.amarillo, (xA0 + xA1) / 2, 3.15, z));
  }
  raiz.add(caja(xA1 - xA0, 0.14, 2.7, M.amarilloOsc, (xA0 + xA1) / 2, 3.42, 0));
  const placa = (() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d'); g.fillStyle = '#f6a800'; g.fillRect(0, 0, 512, 128);
    g.fillStyle = '#111'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.fillText('BATEADORA', 256, 62);
    g.font = 'bold 38px monospace'; g.fillText('B-01 · 09-3X', 256, 110);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  for (const z of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshStandardMaterial({ map: placa, roughness: 0.6 })); p.position.set((xA0 + xA1) / 2, 2.85, z * 1.42); p.rotation.y = z > 0 ? 0 : Math.PI; raiz.add(p); }
  // Módulo de motor sobre el bogie trasero: radiador, escape y filtro
  raiz.add(caja(6.2, 1.9, 2.5, M.amarillo, -L / 2 + 6.4, 2.3, 0));
  raiz.add(caja(1.4, 1.1, 0.05, M.tramex, -L / 2 + 5.0, 2.45, 1.27), caja(1.4, 1.1, 0.05, M.tramex, -L / 2 + 5.0, 2.45, -1.27));
  const chim = cil(0.12, 0.9, M.oscuro, -L / 2 + 7.8, 3.6, 0.6); raiz.add(chim, cil(0.22, 0.5, M.amarilloOsc, -L / 2 + 6.6, 3.45, -0.5));
  // Cabina de bateo baja, colgada junto a los grupos (el operador ve los bates)
  const cBat = new THREE.Group();
  cBat.add(caja(2.0, 1.6, 1.25, M.amarillo, 0, 1.55, 0), caja(1.6, 0.8, 0.04, M.cristalMarron, 0, 1.8, 0.64), caja(0.04, 0.8, 0.9, M.cristalMarron, 1.01, 1.8, 0));
  const rejB = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), M.rejilla); rejB.position.set(0, 1.8, 0.67); cBat.add(rejB);
  cBat.position.set(XB - 2.6, 0, 1.0);
  raiz.add(cBat);
  // Bogies
  const bogies = new THREE.Group(); bogies.name = 'Bogies';
  for (const xb of [L / 2 - 2.4, -L / 2 + 2.4]) bogies.add(bogie(M, xb));
  raiz.add(bogies);
  // Focos halógenos bajo el pórtico mirando a los ejes y a los bates
  for (const x of [XB - 1.2, XB + 1.2, XL + 0.4]) for (const z of [-0.9, 0.9]) raiz.add(focoHalogeno(M, x, 2.9, z));
  const luzBateo = new THREE.SpotLight('#fff4dc', 0, 14, 0.9, 0.5, 1.2);
  luzBateo.position.set(XB + 0.4, 2.9, 0); luzBateo.target.position.set(XB, 0, 0);
  raiz.add(luzBateo, luzBateo.target);
  // Pegatinas
  for (const z of [-1, 1]) { raiz.add(pegatina(M.pegRayo, L / 2 - 2.7, 2.2, z * 1.47, z > 0 ? 0 : Math.PI, 0.22), pegatina(M.pegMano, XB + 0.8, 1.55, z * 1.34, z > 0 ? 0 : Math.PI, 0.18)); }

  // ---- Sistema de medición ----
  const medicion = new THREE.Group(); medicion.name = 'Sistema_Medicion';
  const carros = [];
  for (const [x, nombre] of [[L / 2 + 2.6, 'Carro_Delantero'], [XB - 1.9, 'Carro_Central'], [-L / 2 - 1.3, 'Carro_Trasero']]) {
    const c = new THREE.Group(); c.name = nombre;
    c.add(caja(0.7, 0.18, 1.9, M.chasis, 0, 0.42, 0), caja(0.25, 0.22, 0.25, M.oscuro, 0, 0.62, 0));
    for (const z of [-GALGA, GALGA]) c.add(cil(0.16, 0.08, M.acero, 0, 0.16, z, 'z'));
    c.position.x = x;
    medicion.add(c); carros.push(c);
  }
  medicion.add(caja(2.4, 0.08, 0.08, M.chasis, L / 2 + 1.4, 0.9, 0));
  const laser = caja(1, 0.012, 0.012, new THREE.MeshBasicMaterial({ color: '#ff2b2b' }), 0, 0.64, 0);
  laser.castShadow = false;
  medicion.add(laser);
  raiz.add(medicion);

  // ---- Unidad de levante y ripado ----
  const levante = new THREE.Group(); levante.name = 'Unidad_Levante_Ripado';
  const unidadesLev = [], pinzas = [], vastagos = [];
  for (const zR of [-GALGA, GALGA]) {
    const u = new THREE.Group();
    u.add(caja(0.9, 0.12, 0.42, M.amarilloOsc, 0, 0.42, 0));
    for (const dx of [-0.32, 0.32]) {
      u.add(cil(0.07, 0.55, M.amarillo, dx, 0.84, 0));
      const v = cil(0.035, 0.5, M.cromo, dx, 0.5, 0); u.add(v); vastagos.push(v);
      const mancha = caja(0.075, 0.18, 0.075, M.aceite, dx, 0.64, 0); mancha.castShadow = false; u.add(mancha);   // aceite rezumando
    }
    for (const lado of [-1, 1]) {
      const p = new THREE.Group();
      p.add(caja(0.1, 0.32, 0.06, M.oscuro, 0, 0.2, 0));
      for (const dx of [-0.2, 0.2]) p.add(cil(0.05, 0.05, M.pulido, dx, 0.04, 0, 'z', 12));
      p.position.z = lado * 0.11; p.userData.lado = lado;
      u.add(p); pinzas.push(p);
    }
    u.position.set(XL, 0, zR); u.userData.z0 = zR;
    levante.add(u); unidadesLev.push(u);
  }
  levante.add(caja(0.2, 0.25, 2.0, M.chasis, XL + 0.7, 0.55, 0));
  raiz.add(levante);

  // ---- Grupos de bateo ----
  const bateo = new THREE.Group(); bateo.name = 'Grupos_de_Bateo';
  const bastidores = [], bates = [], fantasmas = [];
  const Y_PIV = 1.0, LB = 1.32, PUNTA = 0.15;
  const matFantasma = new THREE.MeshBasicMaterial({ color: '#c6ccd2', transparent: true, opacity: 0.28, depthWrite: false });
  for (const zR of [-GALGA, GALGA]) {
    const b = new THREE.Group(); b.name = 'Bastidor_Bateo';
    b.add(caja(1.05, 0.55, 0.95, M.amarillo, 0, Y_PIV + 0.42, 0));
    b.add(cil(0.09, 0.9, M.chasis, 0, Y_PIV + 0.3, 0, 'x'));
    for (const dx of [-0.42, 0.42]) {
      b.add(cil(0.06, 0.75, M.amarilloOsc, dx, Y_PIV + 0.5, 0.34, 'x'));
      const m = caja(0.2, 0.05, 0.13, M.aceite, dx, Y_PIV + 0.44, 0.34); m.castShadow = false; b.add(m);
    }
    b.add(cil(0.05, 1.4, M.cromo, 0, Y_PIV + 1.35, 0));
    b.add(mangueras(M.manguera, new THREE.Vector3(-0.3, Y_PIV + 0.75, 0.3), new THREE.Vector3(-0.6, 3.0, 0.5), 4, 0.25));
    for (const zl of [-0.17, 0.17]) for (const sx of [-1, 1]) for (const dz of [-0.05, 0.05]) {
      const piv = new THREE.Group();
      // Bate: forjado, oxidado y mate arriba; los últimos 15 cm pulidos como un espejo por el cuarzo del balasto
      piv.add(caja(0.07, LB - PUNTA, 0.05, M.oxido, 0, -(LB - PUNTA) / 2, 0));
      piv.add(caja(0.065, PUNTA, 0.07, M.pulido, -sx * 0.02, -LB + PUNTA / 2, 0));
      const fan = caja(0.13, 0.5, 0.11, matFantasma, 0, -LB + 0.2, 0); fan.visible = false; fan.castShadow = false;
      piv.add(fan);
      piv.position.set(sx * 0.2, Y_PIV, zl + dz); piv.userData.sx = sx;
      b.add(piv); bates.push(piv); fantasmas.push(fan);
    }
    b.position.set(XB, 0, zR);
    bateo.add(b); bastidores.push(b);
  }
  raiz.add(bateo);
  // Racimos de mangueras del pórtico a los grupos y a la unidad de levante
  for (const z of [-1.0, 1.0]) {
    raiz.add(mangueras(M.manguera, new THREE.Vector3(xA0 + 0.5, 3.0, z), new THREE.Vector3(XB - 0.6, 1.9, z * 0.7), 6, 0.3));
    raiz.add(mangueras(M.manguera, new THREE.Vector3(xA1 - 0.3, 3.0, z), new THREE.Vector3(XL, 1.3, z * 0.75), 5, 0.4));
  }
  const ficha = { capa: 'Trabajos de mantenimiento', nombre: 'Bateadora-niveladora-alineadora', info: 'Bateadora de vía (tipo Plasser & Theurer 09-3X): levanta y alinea la vía con las pinzas de rodillos y compacta el balasto bajo cada traviesa con 16 bates vibrantes (35 Hz), traviesa a traviesa.' };
  raiz.traverse((n) => { if (n.isMesh) n.userData = ficha; });
  const destellos = [...cDel.userData.destellos, ...cTra.userData.destellos];

  const ANG_AB = Math.atan2(0.17, LB), ANG_CE = -Math.atan2(0.03, LB), BAJADA = 0.69;

  // ---- Efectos ----
  const polvo = crearPolvo(420);
  const piedras = crearPiedras(96, new THREE.MeshStandardMaterial({ color: '#8d8a84', roughness: 0.95 }));
  const efectos = new THREE.Group(); efectos.add(polvo.puntos, piedras.im);

  // ---- Audio (Web Audio sintetizado) ----
  let audio = null;
  function crearAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC(), master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), dd = b.getChannelData(0);
    for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
    const ruido = ctx.createBufferSource(); ruido.buffer = b; ruido.loop = true; ruido.start();
    const motor = ctx.createGain(); motor.gain.value = 0.32; motor.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 190; lp.connect(motor);
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 31; o1.connect(lp); o1.start();
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 62.5; const g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(lp); o2.start();
    const nm = ctx.createBiquadFilter(); nm.type = 'lowpass'; nm.frequency.value = 260; const gn = ctx.createGain(); gn.gain.value = 0.35; ruido.connect(nm); nm.connect(gn); gn.connect(lp);
    const hid = ctx.createGain(); hid.gain.value = 0; hid.connect(master);
    const bh = ctx.createBiquadFilter(); bh.type = 'bandpass'; bh.frequency.value = 900; bh.Q.value = 6; bh.connect(hid);
    const oh = ctx.createOscillator(); oh.type = 'sawtooth'; oh.frequency.value = 520; oh.connect(bh); oh.start();
    const vib = ctx.createGain(); vib.gain.value = 0; vib.connect(master);
    const ov = ctx.createOscillator(); ov.type = 'square'; ov.frequency.value = 35; const lv = ctx.createBiquadFilter(); lv.type = 'lowpass'; lv.frequency.value = 420; ov.connect(lv); lv.connect(vib); ov.start();
    const br = ctx.createBiquadFilter(); br.type = 'bandpass'; br.frequency.value = 2200; br.Q.value = 0.8; const gr = ctx.createGain(); gr.gain.value = 0.55; ruido.connect(br); br.connect(gr); gr.connect(vib);
    return { ctx, master, o1, o2, hid, oh, vib };
  }
  function actualizarAudio(fase, u, distCam) {
    if (!(audioActivo() && estado.activo)) { if (audio) audio.master.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.1); return; }
    audio = audio || crearAudio();
    if (!audio) return;
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    const t = audio.ctx.currentTime;
    audio.master.gain.setTargetAtTime(Math.min(1, 22 / Math.max(6, distCam)) * 0.55, t, 0.15);
    const carga = fase === 'vibracion' || fase === 'cierre' ? 1.18 : fase === 'avance' ? 1.08 : 1;
    audio.o1.frequency.setTargetAtTime(31 * carga, t, 0.2); audio.o2.frequency.setTargetAtTime(62.5 * carga, t, 0.2);
    audio.hid.gain.setTargetAtTime(fase === 'levante' || fase === 'agarre' ? 0.22 : fase === 'cierre' ? 0.16 : fase === 'retirada' ? 0.1 : 0, t, 0.05);
    audio.oh.frequency.setTargetAtTime(fase === 'levante' ? 520 + 600 * u : fase === 'cierre' ? 700 + 300 * u : 480, t, 0.05);
    audio.vib.gain.setTargetAtTime(fase === 'vibracion' ? 0.5 : fase === 'cierre' ? 0.42 : fase === 'descenso' ? 0.15 : 0, t, 0.04);
  }

  // ---- Cinta de geometría exagerada (Cam_Geometría) ----
  const EXAG = 30;
  const nG = tramo.N_TRAV;
  const gGeo = new THREE.BufferGeometry();
  const pGeo = new Float32Array(2 * nG * 2 * 3), cGeo = new Float32Array(2 * nG * 2 * 3), iGeo = [];
  for (let r = 0; r < 2; r++) for (let k = 0; k < nG - 1; k++) { const a = (r * nG + k) * 2; iGeo.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  gGeo.setIndex(iGeo);
  gGeo.setAttribute('position', new THREE.BufferAttribute(pGeo, 3).setUsage(THREE.DynamicDrawUsage));
  gGeo.setAttribute('color', new THREE.BufferAttribute(cGeo, 3).setUsage(THREE.DynamicDrawUsage));
  const cintaGeo = new THREE.Mesh(gGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false, depthTest: false }));
  cintaGeo.frustumCulled = false; cintaGeo.visible = false; cintaGeo.renderOrder = 50;
  efectos.add(cintaGeo);
  const C_MAL = new THREE.Color('#ff4d2e'), C_BIEN = new THREE.Color('#22e07a');
  function actualizarCintaGeo() {
    const s = tramo.s;
    for (let r = 0; r < 2; r++) for (let k = 0; k < nG; k++) {
      const b = tramo.base[k], col = b.pk > pkHecho + 1e-6 ? C_MAL : C_BIEN;
      const lat = (r ? GALGA : -GALGA) + b.dh * EXAG;
      for (let j = 0; j < 2; j++) {
        const o = ((r * nG + k) * 2 + j) * 3, w = j ? 0.05 : -0.05;
        pGeo[o] = b.p.x + b.izq.x * (lat + w); pGeo[o + 1] = b.p.y + 0.06 + b.dv * EXAG; pGeo[o + 2] = b.p.z + b.izq.z * (lat + w);
        cGeo[o] = col.r; cGeo[o + 1] = col.g; cGeo[o + 2] = col.b;
      }
    }
    void s;
    gGeo.attributes.position.needsUpdate = true; gGeo.attributes.color.needsUpdate = true;
  }

  // ---- Estado y ciclo ----
  const estado = { activo: false, fase: 'avance', u: 0, levanteMm: 0, ripadoMm: 0, bateadas: 0, vista: null };
  let tFase = 0, iFase = 0, iActual = 0, pkMaq = 0, pkMaqIni = 0, pkHecho = -Infinity, sacudida = 0;
  const geo = { levante: 0, levObj: 0, ripObj: 0 };
  const pkTrav = (i) => i * ESPACIADO;
  const pkPinzas = () => pkMaq + (XL - XB);

  // Proveedor de desviación de la vía: defectos por delante de la última traviesa bateada y levante de las pinzas
  function desviacion(pk) {
    let v = 0, h = 0;
    if (pk > pkHecho + 1e-6) {
      const k = 1 - suave((pk - (tramo.pkFin - 12)) / 10);
      v = defectoV(pk) * k; h = defectoH(pk) * k;
    }
    if (geo.levante > 0) {
      const x = (pk - pkPinzas()) / 7;
      if (Math.abs(x) < 1) { const w = 0.5 * (1 + Math.cos(Math.PI * x)); v += geo.levante * geo.levObj * w; h += geo.levante * geo.ripObj * w; }
    }
    return { v, h };
  }

  function montar(pkCabeza) {
    iActual = Math.ceil(pkCabeza / ESPACIADO);
    pkHecho = pkTrav(iActual - 1);
    pkMaq = pkMaqIni = pkTrav(iActual) - ESPACIADO;
    iFase = 0; tFase = 0; estado.bateadas = 0;
    estado.activo = true;
  }
  function desmontar() {
    estado.activo = false;
    if (audio) { audio.master.gain.value = 0; audio.ctx.suspend(); }
  }

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _bx = new THREE.Matrix4(), _w = new THREE.Vector3();
  function colocar() {
    const pkC = pkMaq - XB;
    _a.copy(tramo.punto(pkC + 9)); _b.copy(tramo.punto(pkC - 9));
    raiz.position.copy(_a).add(_b).multiplyScalar(0.5);
    _x.copy(_a).sub(_b).normalize(); _z.crossVectors(_x, _up).normalize(); _y.crossVectors(_z, _x);
    raiz.quaternion.setFromRotationMatrix(_bx.makeBasis(_x, _y, _z));
  }

  function actualizar(dt, { distCam = 50, noche = true, yCarril = 0 } = {}) {
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
      if (FASES[iFase][0] === 'levante') { const pk = pkTrav(iActual); geo.levObj = -defectoV(pk) + 0.003; geo.ripObj = -defectoH(pk); }
    }
    const fase = FASES[iFase][0], u = tFase / FASES[iFase][1];
    estado.fase = fase; estado.u = u;
    if (fase === 'avance') pkMaq = pkMaqIni + (pkTrav(iActual) - pkMaqIni) * suave(u);

    geo.levante = fase === 'levante' ? suave(u) : fase === 'descenso' || fase === 'vibracion' || fase === 'cierre' ? 1 : fase === 'retirada' ? 1 - suave(u) : 0;
    estado.levanteMm = Math.round(geo.levante * geo.levObj * 1000);
    estado.ripadoMm = Math.round(geo.levante * geo.ripObj * 1000);
    if (geo.levante > 0) tramo.marcar(pkPinzas() - 7.5, pkPinzas() + 7.5);

    const cierreP = fase === 'agarre' ? suave(u) : fase === 'avance' ? 0 : fase === 'retirada' ? 1 - suave(u) : 1;
    for (const p of pinzas) p.position.z = p.userData.lado * (0.11 - 0.065 * cierreP);
    const dP = tramo.desviacion(pkPinzas());
    for (const un of unidadesLev) { un.position.y = dP.v * cierreP; un.position.z = un.userData.z0 - dP.h * cierreP; }
    for (const v of vastagos) v.position.y = 0.5 + dP.v * cierreP * 0.5;

    const baja = fase === 'descenso' ? suave(u) : fase === 'vibracion' || fase === 'cierre' ? 1 : fase === 'retirada' ? 1 - suave(Math.min(1, u * 1.4)) : 0;
    const vibra = fase === 'vibracion' || fase === 'cierre' || (fase === 'descenso' && u > 0.5);
    const cierra = fase === 'cierre' ? suave(u) : fase === 'retirada' ? 1 - suave(Math.min(1, u * 2.2)) : 0;
    const t = performance.now() / 1000;
    const dB = tramo.desviacion(pkMaq);
    for (const b of bastidores) b.position.y = 0.25 + LB - Y_PIV - BAJADA * baja + dB.v + (vibra ? Math.sin(t * 2 * Math.PI * 35) * 0.004 : 0);
    bates.forEach((pv, i) => {
      pv.rotation.z = pv.userData.sx * (ANG_AB + (ANG_CE - ANG_AB) * cierra) + (vibra ? Math.sin(t * 2 * Math.PI * 35 + i) * 0.012 : 0);
      fantasmas[i].visible = vibra;
    });

    // Huellas, polvo y piedra
    const pkT = pkTrav(iActual), s = tramo.s;
    if (fase === 'descenso' && u > 0.45) for (let r = 0; r < 2; r++) for (const zl of [-0.17, 0.17]) for (const sx of [-1, 1]) {
      const latL = (r ? GALGA : -GALGA) + zl;   // lateral a la izquierda; u (hacia fuera) = lat·s
      tramo.hundir(pkT + sx * 0.36, latL * s, 0.16, 0.09 * suave((u - 0.45) / 0.55));
    }
    if ((fase === 'descenso' && u > 0.5) || fase === 'vibracion' || fase === 'cierre') {
      for (let r = 0; r < 2; r++) for (const sx of [-1, 1]) {
        const latL = (r ? GALGA : -GALGA) + (Math.random() - 0.5) * 0.6;
        _w.copy(tramo.punto(pkT + sx * 0.36, latL * s, Z_CAJON));
        if (Math.random() < 0.6) polvo.emitir(_w, fase === 'cierre' ? 3 : 2, { fuerza: fase === 'descenso' ? 1.4 : 1 });
        if (fase === 'cierre' && Math.random() < 0.55) {
          const tr = tramo.traviesa(pkT);
          const v = tr.dir.clone().multiplyScalar(-sx * (0.5 + Math.random() * 0.4)).addScaledVector(_up, 0.4 + Math.random() * 0.6).addScaledVector(tr.izq, (Math.random() - 0.5) * 0.5);
          piedras.lanzar(_w.clone().addScaledVector(_up, 0.03), v, _w.y - 0.02);
        }
      }
    }
    if (fase === 'cierre' && u > 0.9) for (let r = 0; r < 2; r++) for (const zl of [-0.17, 0.17]) for (const sx of [-1, 1]) tramo.rellenar(pkT + sx * 0.36, ((r ? GALGA : -GALGA) + zl) * s, 0.16, 0.35);
    sacudida = vibra ? 1 : Math.max(0, sacudida - dt * 4);

    destellos.forEach((d, i) => { d.material = Math.sin(t * 7 + i * 1.7) > 0.1 ? M.destello : M.destelloApagado; });
    luzBateo.intensity = noche ? 60 : 0;

    carros.forEach((c) => { const d = tramo.desviacion(pkMaq - XB + c.position.x); c.position.y = d.v; c.position.z = -d.h; });
    const cA = carros[0].position, cB = carros[2].position;
    laser.position.set((cA.x + cB.x) / 2, (cA.y + cB.y) / 2 + 0.64, (cA.z + cB.z) / 2);
    laser.scale.x = Math.hypot(cA.x - cB.x, cA.y - cB.y);
    laser.rotation.z = Math.atan2(cA.y - cB.y, cA.x - cB.x);

    colocar();
    fijarCarril(M.sucios, yCarril, [chim.getWorldPosition(_w)]);
    polvo.actualizar(dt);
    piedras.actualizar(dt);
    if (cintaGeo.visible) actualizarCintaGeo();
    actualizarAudio(fase, u, distCam);
  }

  // ---- Cámaras ----
  function pose(modo) {
    const pkB = pkMaq, s = tramo.s, jit = () => (Math.random() - 0.5) * 0.012 * sacudida;
    if (modo === 'bateo') {
      const p = tramo.punto(pkB + 2.2, 3.4, 0.55), o = tramo.punto(pkB + 0.6, -0.2, -0.15);
      p.x += jit(); p.y += jit(); p.z += jit();
      return { pos: p, obj: o };
    }
    if (modo === 'geometria') return { pos: tramo.punto(pkB - 30, 0, 2.1), obj: tramo.punto(pkB + 34, 0, 0.3) };
    void s;
    return { pos: tramo.punto(pkB - XB + 22, 15, 9.5), obj: tramo.punto(pkB - XB, 0, 1.2) };
  }
  function setVista(modo) {
    estado.vista = modo;
    cintaGeo.visible = modo === 'geometria';
    if (cintaGeo.visible) actualizarCintaGeo();
  }

  return {
    raiz, efectos, estado, desviacion, montar, desmontar, actualizar, pose, setVista,
    get pkCabeza() { return pkMaq; }, get pkCentro() { return pkMaq - XB; }, get pkHecho() { return pkHecho; },
    get sacudida() { return sacudida; },
    LARGO: L, VEL_MEDIA: VEL_MEDIA_BATEO,
  };
}
