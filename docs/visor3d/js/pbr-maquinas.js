// Materiales PBR y piezas comunes de la maquinaria de vía (bateadora, perfiladora, estabilizador, dresina)
//
// Amarillo señal (RAL 1028, #F6A800) nunca uniforme: el sombreador mezcla desde abajo el polvo de balasto (o el
// grafito en la dresina) según la altura sobre el carril, con manchas de ruido, y oscurece de hollín alrededor de las
// chimeneas. Además: acero rayado de las palas, bates oxidados con la punta pulida, mangueras hidráulicas, bocinas,
// focos halógenos cuadrados, franjas de peligro y pegatinas.

import * as THREE from 'three';

const lienzo = (w, h, pintar) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  pintar(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/**
 * Pintura con suciedad procedimental. uniforms.yCarril se actualiza cada fotograma con la cota (escena) del carril.
 * @param {string} color
 * @param {object} o  alturaSucio: m sobre el carril hasta donde sube el polvo; colorSucio; fuerza; hollin: nº de chimeneas
 */
export function pinturaSucia(color, { rough = 0.62, metal = 0.12, alturaSucio = 0.9, colorSucio = '#bfb8aa', fuerza = 1, hollin = 0, rayas = 0, arriba = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const u = {
    yCarril: { value: 0 }, alturaSucio: { value: alturaSucio }, colorSucio: { value: new THREE.Color(colorSucio) }, fuerza: { value: fuerza },
    chimeneas: { value: Array.from({ length: 2 }, () => new THREE.Vector3(0, -1e6, 0)) }, nHollin: { value: hollin }, rayas: { value: rayas }, arriba: { value: arriba },
  };
  m.userData.uniforms = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosM;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n  vec4 pM = vec4(transformed, 1.0);\n  #ifdef USE_INSTANCING\n  pM = instanceMatrix * pM;\n  #endif\n  vPosM = (modelMatrix * pM).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vPosM;
uniform float yCarril; uniform float alturaSucio; uniform vec3 colorSucio; uniform float fuerza; uniform vec3 chimeneas[2]; uniform int nHollin; uniform float rayas; uniform float arriba;
float hS(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float nS(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hS(i), hS(i + vec2(1, 0)), w.x), mix(hS(i + vec2(0, 1)), hS(i + vec2(1, 1)), w.x), w.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  float hRel = vPosM.y - yCarril;
  float n = nS(vPosM.xz * 3.1 + vPosM.y * 1.7) * 0.6 + nS(vPosM.xz * 11.0 + vPosM.y * 7.0) * 0.4;
  float sucio;
  if (arriba > 0.0) {
    // Polvo que cae de arriba (grafito del hilo de contacto sobre el techo de la dresina)
    sucio = smoothstep(arriba - 0.6, arriba + 0.15, hRel) * fuerza * (0.75 + 0.35 * n);
  } else {
    sucio = (1.0 - smoothstep(alturaSucio * 0.35, alturaSucio * (1.0 + 0.25 * n), hRel)) * fuerza;
    // Chorreones finos que suben un poco más
    sucio = max(sucio, (1.0 - smoothstep(0.0, alturaSucio * 1.8, hRel)) * step(0.72, nS(vec2(vPosM.x * 6.0 + vPosM.z * 6.0, 0.0))) * 0.45 * fuerza);
  }
  diffuseColor.rgb = mix(diffuseColor.rgb, colorSucio * (0.85 + 0.3 * n), clamp(sucio, 0.0, 1.0));
  // Desgaste general: pintura algo más oscura y sucia en manchas
  diffuseColor.rgb *= 0.88 + 0.12 * n;
  for (int k = 0; k < 2; k++) { if (k >= nHollin) break;
    vec3 d = vPosM - chimeneas[k]; float r = length(d.xz) + max(0.0, -d.y) * 0.6;
    diffuseColor.rgb *= mix(0.18, 1.0, smoothstep(0.25, 1.6 + n * 0.6, r)); }
  if (rayas > 0.0) { float st = nS(vec2(vPosM.y * 2.0, (vPosM.x + vPosM.z) * 90.0)); diffuseColor.rgb *= 0.78 + 0.35 * st; }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, 1.0, clamp(sucio, 0.0, 1.0));`);
  };
  m.customProgramCacheKey = () => `pinturaSucia:${hollin}:${rayas > 0 ? 1 : 0}:${arriba > 0 ? 1 : 0}`;
  return m;
}
/** Actualiza la cota del carril (y chimeneas) de los materiales sucios de una máquina. */
export function fijarCarril(mats, yCarril, chimeneas = []) {
  for (const m of mats) {
    const u = m.userData.uniforms;
    if (!u) continue;
    u.yCarril.value = yCarril;
    chimeneas.forEach((c, i) => { if (u.chimeneas.value[i]) u.chimeneas.value[i].copy(c); });
  }
}

// ---- Texturas ----
export const texFranjas = () => lienzo(128, 128, (g, w, h) => {
  g.fillStyle = '#f2b705'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#141414';
  for (let k = -h; k < w + h; k += 44) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 22, 0); g.lineTo(k + 22 - h, h); g.lineTo(k - h, h); g.fill(); }
});
// Acero de las palas: arañazos direccionales profundos (color y rugosidad)
export const texAceroRayado = () => lienzo(256, 256, (g, w, h) => {
  g.fillStyle = '#8c9298'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const y = Math.random() * h, l = 30 + Math.random() * 200, x = Math.random() * w;
    g.strokeStyle = `rgba(${Math.random() < 0.5 ? '210,215,220' : '60,62,66'},${0.15 + Math.random() * 0.35})`;
    g.lineWidth = 0.5 + Math.random() * 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (Math.random() - 0.5) * 3); g.stroke();
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,80,45,${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 30, 4 + Math.random() * 10); }
});
// Cristal tintado con rejilla de protección
export const texRejilla = () => lienzo(128, 128, (g, w, h) => {
  g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
  g.strokeStyle = '#1b1d1f'; g.lineWidth = 3;
  for (let k = 0; k <= w; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(w, k); g.stroke(); }
});
export const texTramex = () => lienzo(128, 128, (g, w, h) => {
  g.fillStyle = '#3b3f43'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#16181a';
  for (let x = 2; x < w; x += 10) for (let y = 2; y < h; y += 10) g.fillRect(x, y, 7, 7);
});
// Pegatinas: rayo de peligro eléctrico, atrapamiento de manos, extintor
export const texPegatina = (tipo) => lienzo(64, 64, (g) => {
  if (tipo === 'rayo') {
    g.fillStyle = '#f6c400'; g.beginPath(); g.moveTo(32, 3); g.lineTo(61, 58); g.lineTo(3, 58); g.closePath(); g.fill();
    g.strokeStyle = '#111'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#111'; g.beginPath(); g.moveTo(35, 18); g.lineTo(25, 38); g.lineTo(32, 38); g.lineTo(28, 52); g.lineTo(40, 31); g.lineTo(33, 31); g.closePath(); g.fill();
  } else if (tipo === 'mano') {
    g.fillStyle = '#f6c400'; g.beginPath(); g.moveTo(32, 3); g.lineTo(61, 58); g.lineTo(3, 58); g.closePath(); g.fill();
    g.strokeStyle = '#111'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#111'; g.fillRect(22, 30, 20, 16); g.fillRect(24, 22, 4, 10); g.fillRect(30, 20, 4, 12); g.fillRect(36, 22, 4, 10);
  } else {
    g.fillStyle = '#c81e1e'; g.fillRect(4, 4, 56, 56); g.fillStyle = '#fff'; g.fillRect(26, 14, 12, 36); g.fillRect(20, 26, 24, 10);
  }
});

/** Juego de materiales de una máquina. */
export function materialesMaquina({ sucio = '#bfb8aa', alturaSucio = 0.9, fuerza = 1, hollin = 0, grafito = false, arriba = 0 } = {}) {
  const colorSucio = grafito ? '#1d1e20' : sucio;
  const M = {
    amarillo: pinturaSucia('#f6a800', { alturaSucio, colorSucio, fuerza, hollin, arriba }),
    amarilloOsc: pinturaSucia('#d99400', { alturaSucio, colorSucio, fuerza, hollin, arriba }),
    verde: pinturaSucia('#5fa83a', { alturaSucio: alturaSucio * 1.4, colorSucio, fuerza: fuerza * 1.2, rough: 0.7 }),
    chasis: pinturaSucia('#2b2e31', { alturaSucio: alturaSucio * 1.2, colorSucio, fuerza, rough: 0.75, metal: 0.4 }),
    acero: new THREE.MeshStandardMaterial({ color: '#9aa1a8', roughness: 0.35, metalness: 0.85 }),
    cromo: new THREE.MeshStandardMaterial({ color: '#e6eaee', roughness: 0.0, metalness: 1.0 }),
    pulido: new THREE.MeshStandardMaterial({ color: '#dfe3e6', roughness: 0.1, metalness: 1.0 }),
    oxido: new THREE.MeshStandardMaterial({ color: '#6b4a32', roughness: 0.92, metalness: 0.35 }),
    oscuro: new THREE.MeshStandardMaterial({ color: '#1c1f22', roughness: 0.7, metalness: 0.45 }),
    goma: new THREE.MeshStandardMaterial({ color: '#141516', roughness: 0.85, metalness: 0.0 }),
    manguera: new THREE.MeshStandardMaterial({ color: '#101112', roughness: 0.55, metalness: 0.05 }),
    aceite: new THREE.MeshStandardMaterial({ color: '#2a2010', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.85 }),
    cristal: new THREE.MeshStandardMaterial({ color: '#23382c', roughness: 0.05, metalness: 0.7 }),
    cristalMarron: new THREE.MeshStandardMaterial({ color: '#3b2a1d', roughness: 0.05, metalness: 0.7 }),
    rejilla: new THREE.MeshBasicMaterial({ map: texRejilla(), transparent: true, depthWrite: false }),
    franjas: new THREE.MeshStandardMaterial({ map: texFranjas(), roughness: 0.6 }),
    palaAcero: new THREE.MeshStandardMaterial({ map: texAceroRayado(), roughness: 0.42, metalness: 0.9, roughnessMap: null }),
    tramex: new THREE.MeshStandardMaterial({ map: texTramex(), roughness: 0.8, metalness: 0.5 }),
    foco: new THREE.MeshBasicMaterial({ color: '#fffbea' }),
    faroBlanco: new THREE.MeshBasicMaterial({ color: '#fff6dc' }),
    rojo: new THREE.MeshBasicMaterial({ color: '#ff2a2a' }),
    destello: new THREE.MeshBasicMaterial({ color: '#ffa31a' }),
    destelloApagado: new THREE.MeshStandardMaterial({ color: '#7a4a10', roughness: 0.5 }),
    pegRayo: new THREE.MeshBasicMaterial({ map: texPegatina('rayo'), transparent: true }),
    pegMano: new THREE.MeshBasicMaterial({ map: texPegatina('mano'), transparent: true }),
    pegExt: new THREE.MeshBasicMaterial({ map: texPegatina('ext') }),
  };
  M.sucios = [M.amarillo, M.amarilloOsc, M.verde, M.chasis];
  return M;
}

// ---- Constructores de piezas ----
export function caja(sx, sy, sz, m, x = 0, y = 0, z = 0) {
  const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
  me.position.set(x, y, z);
  me.castShadow = true; me.receiveShadow = true;
  return me;
}
export function cil(r, h, m, x = 0, y = 0, z = 0, eje = 'y', seg = 14) {
  const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
  me.position.set(x, y, z);
  if (eje === 'z') me.rotation.x = Math.PI / 2; else if (eje === 'x') me.rotation.z = Math.PI / 2;
  me.castShadow = true;
  return me;
}
/** Tubo entre dos puntos. */
export function tubo(r, a, b, m, seg = 8) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), m);
  me.position.copy(a).addScaledVector(d, 0.5);
  me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  me.castShadow = true;
  return me;
}
/** Racimo de mangueras hidráulicas colgando entre dos puntos (curvas con comba). */
export function mangueras(m, a, b, n = 5, comba = 0.35, r = 0.018) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const off = new THREE.Vector3((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.14);
    const p0 = a.clone().add(off), p2 = b.clone().add(off);
    const p1 = p0.clone().lerp(p2, 0.5); p1.y -= comba * (0.7 + Math.random() * 0.6);
    const curva = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const me = new THREE.Mesh(new THREE.TubeGeometry(curva, 14, r * (0.8 + Math.random() * 0.5), 6, false), m);
    me.castShadow = true;
    g.add(me);
  }
  return g;
}
/** Bocina de aire comprimido cromada. */
export function bocina(M, x, y, z, sentido = 1) {
  const g = new THREE.Group();
  const cono = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.025, 0.42, 14, 1, true), M.cromo);
  cono.rotation.z = -sentido * Math.PI / 2;
  cono.position.x = sentido * 0.21;
  g.add(cono, cil(0.03, 0.18, M.cromo, 0, -0.08, 0));
  g.position.set(x, y, z);
  return g;
}
/** Foco halógeno cuadrado (carcasa y cristal encendido) mirando hacia abajo. */
const matRotativo = new THREE.MeshBasicMaterial({ color: '#ff9a1a', transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
/** Rotativos naranjas: giran a ~1,5 vueltas/s y la cúpula destella cuando el espejo mira a la cámara. */
export function animarRotativos(dest, M, dt, noche = true) {
  for (const d of dest) {
    const g = d.userData.giro;
    if (g) { g.rotation.y += dt * 9.4; g.visible = noche; }
    d.material = Math.cos(g ? g.rotation.y * 2 : performance.now() / 140) > 0.2 ? M.destello : M.destelloApagado;
  }
}
// Haz de luz visible bajo los focos (de noche, en el polvo del tajo)
const matHaz = new THREE.MeshBasicMaterial({ color: '#fff1cf', transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
export function focoHalogeno(M, x, y, z, { alto = 1.6, abre = 0.55 } = {}) {
  const g = new THREE.Group();
  g.add(caja(0.26, 0.12, 0.26, M.oscuro, 0, 0.06, 0), caja(0.22, 0.02, 0.22, M.foco, 0, -0.005, 0));
  const haz = new THREE.Mesh(new THREE.ConeGeometry(abre, alto, 18, 1, true), matHaz);
  haz.position.y = -alto / 2; haz.renderOrder = 5; haz.castShadow = false; haz.userData.haz = true;
  g.add(haz);
  g.position.set(x, y, z);
  return g;
}
/** Enciende o apaga los haces de luz de una máquina (de noche). */
export function hacesVisibles(raiz, on) { raiz.traverse((n) => { if (n.userData?.haz) n.visible = on; }); }
/** Gira las ruedas de los bogies de una máquina según lo avanzado (m). */
export function girarRuedas(raiz, ds) {
  raiz.traverse((n) => { if (n.userData?.rueda) n.rotation.z -= ds / 0.42; });
}
/** Humo del escape (partículas oscuras que suben y se abren). */
export function crearHumo(n = 160) { return crearPolvo(n, '#3a3836'); }
/**
 * Movimiento «vivo» común de una máquina, a llamar tras colocarla en la vía: ruedas que giran con lo avanzado,
 * rotativos, haces de los focos de noche, cabeceo y balanceo de la caja sobre la suspensión, temblor del motor
 * y humo del escape (más denso con carga).
 */
export function vidaMaquina({ raiz, M, destellos = [], chimeneas = [], efectos }) {
  const humo = crearHumo(220);
  efectos.add(humo.puntos);
  let t = Math.random() * 10, acum = 0, nochePrev = null;
  const _p = new THREE.Vector3();
  return function vivir(dt, { ds = 0, noche = true, carga = 0.4 } = {}) {
    t += dt;
    girarRuedas(raiz, ds);
    animarRotativos(destellos, M, dt, noche);
    if (noche !== nochePrev) { hacesVisibles(raiz, noche); nochePrev = noche; }
    const v = dt > 0 ? Math.abs(ds) / dt : 0;
    // Suspensión: balanceo y cabeceo lentos en marcha; temblor fino del motor siempre
    raiz.rotateX(Math.sin(t * 1.9) * 0.0016 * Math.min(1, v * 2 + 0.25) + Math.sin(t * 61) * 0.00025 * (0.5 + carga));
    raiz.rotateZ(Math.sin(t * 1.3 + 1) * 0.0009 * Math.min(1, v * 2));
    // Humo del escape
    acum += dt * (3 + 9 * carga);
    while (acum >= 1) {
      acum -= 1;
      for (const c of chimeneas) {
        c.getWorldPosition(_p); _p.y += 0.5;
        efectos.worldToLocal(_p);
        humo.emitir(_p, 1, { tam: 0.22, crece: 0.85, vida: 3.2, alfa: 0.28 + 0.2 * carga, sube: 1.4, fuerza: 0.5 });
      }
    }
    humo.actualizar(dt);
  };
}
/** Pegatina plana (plano de 0,2 m) en una cara vertical. */
export function pegatina(mat, x, y, z, rotY = 0, tam = 0.2) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), mat);
  p.position.set(x, y, z); p.rotation.y = rotY;
  return p;
}
/** Cabina con cristales tintados y rejilla. sentido: +1 si su frente mira a +X. */
export function cabina(M, { largo = 2.6, alto = 2.3, ancho = 2.9, y0 = 1.35, sentido = 1, tinte = 'verde' } = {}) {
  const c = new THREE.Group();
  const cr = tinte === 'marron' ? M.cristalMarron : M.cristal;
  c.add(caja(largo, alto, ancho, M.amarillo, 0, y0 + alto / 2, 0));
  c.add(caja(largo + 0.1, 0.1, ancho + 0.1, M.amarilloOsc, 0, y0 + alto + 0.05, 0));
  // Frente y laterales acristalados con rejilla delante
  const frente = caja(0.05, alto * 0.42, ancho - 0.5, cr, sentido * (largo / 2 + 0.01), y0 + alto * 0.68, 0);
  const rej = new THREE.Mesh(new THREE.PlaneGeometry(ancho - 0.5, alto * 0.42), M.rejilla);
  rej.position.set(sentido * (largo / 2 + 0.05), y0 + alto * 0.68, 0); rej.rotation.y = sentido * Math.PI / 2;
  c.add(frente, rej);
  for (const z of [-1, 1]) {
    c.add(caja(largo * 0.55, alto * 0.38, 0.05, cr, -sentido * 0.15, y0 + alto * 0.68, z * (ancho / 2 + 0.01)));
    c.add(caja(0.6, alto * 0.75, 0.04, M.amarilloOsc, sentido * (largo / 2 - 0.4), y0 + alto * 0.45, z * (ancho / 2 + 0.02)));   // puerta
    // Faros y piloto
    c.add(caja(0.05, 0.2, 0.3, M.faroBlanco, sentido * (largo / 2 + 0.02), y0 + 0.35, z * (ancho / 2 - 0.45)));
  }
  // Franjas de peligro en las esquinas delanteras
  for (const z of [-1, 1]) c.add(caja(0.16, alto + 0.8, 0.16, M.franjas, sentido * (largo / 2 + 0.06), y0 + alto / 2 - 0.4, z * (ancho / 2 + 0.02)));
  // Bocinas y destellos
  c.add(bocina(M, 0, y0 + alto + 0.25, ancho * 0.3, sentido), bocina(M, 0, y0 + alto + 0.25, -ancho * 0.3, sentido));
  const dest = [];
  for (const z of [-0.6, 0.6]) {
    const d = cil(0.12, 0.24, M.destello, -sentido * 0.6, y0 + alto + 0.22, z);
    // Rotativo: espejo que gira dentro de la cúpula y barre dos haces naranjas
    const giro = new THREE.Group(); giro.position.copy(d.position);
    for (const k of [0, Math.PI]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.2, 12, 1, true), matRotativo); h.rotation.z = Math.PI / 2; h.position.x = 1.1; const p = new THREE.Group(); p.rotation.y = k; p.add(h); giro.add(p); }
    giro.rotation.y = Math.random() * 6;
    c.add(d, giro); d.userData.giro = giro; dest.push(d);
  }
  c.userData.destellos = dest;
  return c;
}
/** Bogie de dos ejes con caja de grasa y amortiguadores. */
export function bogie(M, x) {
  const b = new THREE.Group();
  b.add(caja(2.6, 0.32, 2.2, M.chasis, 0, 0.64, 0));
  for (const dx of [-0.9, 0.9]) for (const z of [-0.7175, 0.7175]) {
    // Rueda que gira (con radios y tornillería visibles para que se note el giro)
    const r = new THREE.Group(); r.position.set(dx, 0.42, z); r.userData.rueda = true;
    r.add(cil(0.42, 0.13, M.acero, 0, 0, 0, 'z', 18), cil(0.43, 0.025, M.pulido, 0, 0, -z * 0.08 / 0.7175 * 0.7175, 'z', 18));
    for (const a of [0, Math.PI / 3, 2 * Math.PI / 3]) { const rad = caja(0.7, 0.05, 0.02, M.oscuro, 0, 0, Math.sign(z) * 0.07); rad.rotation.z = a; r.add(rad); }
    r.add(cil(0.1, 0.16, M.oscuro, 0, 0, 0, 'z', 10));
    b.add(r);
    b.add(caja(0.32, 0.3, 0.22, M.chasis, dx, 0.5, z * 1.42));
  }
  for (const z of [-1, 1]) b.add(cil(0.07, 0.4, M.oscuro, 0, 0.92, z * 0.9));
  b.position.x = x;
  return b;
}
/** Partículas de polvo (sombreador con alfa y tamaño por partícula). */
export function crearPolvo(n = 400, color = '#cdc6b8') {
  const g = new THREE.BufferGeometry();
  const P = new Float32Array(n * 3), A = new Float32Array(n), T = new Float32Array(n), V = new Float32Array(n * 3), vida = new Float32Array(n), crec = new Float32Array(n);
  g.setAttribute('position', new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('alfa', new THREE.BufferAttribute(A, 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('tam', new THREE.BufferAttribute(T, 1).setUsage(THREE.DynamicDrawUsage));
  const tex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const c = cv.getContext('2d'), gr = c.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  })();
  const mat = new THREE.ShaderMaterial({
    uniforms: { mapa: { value: tex }, color: { value: new THREE.Color(color) }, escala: { value: 400 } },
    vertexShader: 'attribute float alfa; attribute float tam; varying float vA; uniform float escala;\nvoid main(){ vA = alfa; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = tam * escala / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D mapa; uniform vec3 color; varying float vA;\nvoid main(){ vec4 t = texture2D(mapa, gl_PointCoord); gl_FragColor = vec4(color, t.a * vA); if (gl_FragColor.a < 0.01) discard; }',
    transparent: true, depthWrite: false,
  });
  const puntos = new THREE.Points(g, mat);
  puntos.frustumCulled = false;
  let i0 = 0;
  return {
    puntos,
    emitir(p, k = 4, { fuerza = 1, tam = 0.08, vida: v0 = 2, crece = 0.55, alfa = 0.55, sube = 0.5 } = {}) {
      for (let j = 0; j < k; j++) {
        const i = i0++ % n;
        P[i * 3] = p.x + (Math.random() - 0.5) * 0.3; P[i * 3 + 1] = p.y + Math.random() * 0.06; P[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.3;
        V[i * 3] = (Math.random() - 0.5) * 0.6 * fuerza; V[i * 3 + 1] = (0.15 + Math.random() * sube) * fuerza; V[i * 3 + 2] = (Math.random() - 0.5) * 0.6 * fuerza;
        vida[i] = v0 * (0.7 + Math.random() * 0.8); T[i] = tam; crec[i] = crece; A[i] = 0.0001;
        g.userData[i] = alfa;
      }
    },
    actualizar(dt) {
      for (let i = 0; i < n; i++) {
        if (vida[i] <= 0) { A[i] = 0; continue; }
        vida[i] -= dt;
        P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
        V[i * 3 + 1] *= 1 - 0.6 * dt; V[i * 3] *= 1 - 0.4 * dt; V[i * 3 + 2] *= 1 - 0.4 * dt;
        T[i] += dt * crec[i];
        const a = g.userData[i] ?? 0.5;
        A[i] = Math.min(a, vida[i] * 0.45) * Math.min(1, (3.2 - vida[i]) * 3);
      }
      g.attributes.position.needsUpdate = true; g.attributes.alfa.needsUpdate = true; g.attributes.tam.needsUpdate = true;
    },
  };
}
/** Piedras de balasto lanzadas con gravedad y rebote (instancias). */
export function crearPiedras(n = 120, mat) {
  const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.03, 0), mat, n);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false;
  im.castShadow = true;
  const ps = Array.from({ length: n }, () => ({ vida: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), suelo: 0, e: 1 }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let i0 = 0;
  return {
    im,
    lanzar(p, v, suelo, esc = 1) {
      const o = ps[i0++ % n];
      o.vida = 1.4 + Math.random() * 1.2; o.p.copy(p); o.v.copy(v); o.suelo = suelo; o.e = esc * (0.6 + Math.random() * 0.9);
      o.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    },
    actualizar(dt) {
      for (let i = 0; i < n; i++) {
        const o = ps[i];
        if (o.vida > 0) {
          o.vida -= dt; o.v.y -= 9.8 * dt; o.p.addScaledVector(o.v, dt);
          if (o.p.y < o.suelo) { o.p.y = o.suelo; o.v.multiplyScalar(0.35); o.v.y = Math.abs(o.v.y) * 0.3; }
          o.r.x += o.v.length() * dt * 8; o.r.z += o.v.length() * dt * 5;
        }
        const e = o.vida > 0 ? o.e * Math.min(1, o.vida * 2) : 0;
        im.setMatrixAt(i, m4.compose(o.p, q.setFromEuler(o.r), sc.set(e, e * 0.8, e)));
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
}
