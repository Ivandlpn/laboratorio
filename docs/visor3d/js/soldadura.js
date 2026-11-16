// Soldadura aluminotérmica de carril UIC 60 en una banda de mantenimiento nocturna (vía cortada y catenaria sin tensión)
//
// Reacción exotérmica de óxido de hierro y aluminio: el acero líquido (>2000 °C) cae del crisol «one-shot» a un molde
// de arena que abraza los dos extremos del carril, separados 25 mm, y los une sin junta. Fases (acortadas; el panel
// da su duración real):
//   desguarnecido → corte → alineación → moldes y sellado → precalentamiento → crisol e ignición → reacción → colada →
//   enfriamiento → desmoldeo → rebarbado → esmerilado → comprobación
// Cuadrilla: soldador principal (buzo ignífugo azul marino, chaleco HV con bandas, pantalla facial tintada abatible,
// guantes de serraje largos y polainas), ayudante (HV, casco con frontal LED, gafas claras, orejeras) y capataz (casco
// blanco, tablet, emisora al hombro, pirómetro óptico).
// El carril de la soldadura tiene un sombreador térmico: emisión de cuerpo negro según la temperatura (blanco-amarillo
// a 2000 °C, rojo cereza a 900 °C, sin luz por debajo de ~450 °C, con enfriamiento asimétrico) y cascarilla mate con
// grietas (Voronoi) al enfriarse.

import * as THREE from 'three';
import { crearTramoVia, ESPACIADO, GALGA, suave } from './tramo-via.js';
import { crearOperario } from './operario.js';
import { crearPolvo, cil, caja as cajaP, tubo } from './pbr-maquinas.js';
import { crearAudioObras } from './audio-obras.js';

export const FASES_SOLD = [
  ['desguarnecido', 12, 'Desguarnecido', 'Retiran el balasto bajo la junta con palas y picos para dejar sitio a los moldes', '10 min'],
  ['corte', 10, 'Corte del carril', 'Tronzadora de disco: los extremos quedan a 25 mm', '5 min'],
  ['alineacion', 8, 'Alineación', 'Gato bajo el patín y regla de 1 m sobre la cabeza del carril', '10 min'],
  ['moldes', 10, 'Moldes y sellado', 'Moldes de arena con portamoldes; pasta de sellado en patín, alma y cabeza', '10 min'],
  ['precalentamiento', 18, 'Precalentamiento', 'Soplete de propano y oxígeno por la boca del molde hasta 900–1000 °C', '5–10 min'],
  ['crisol', 6, 'Crisol e ignición', 'Se retira el soplete, se coloca el crisol y se enciende con la bengala', '1 min'],
  ['reaccion', 10, 'Reacción', 'Reacción aluminotérmica: humo blanco muy denso y metal burbujeante', '15–20 s'],
  ['colada', 4, 'Colada', 'Se funde el tapón: el acero a más de 2000 °C cae al molde; la escoria rebosa a las cazoletas', '10 s'],
  ['enfriamiento', 6, 'Enfriamiento', 'Solidificación del acero dentro del molde', '4–5 min'],
  ['desmoldeo', 8, 'Desmoldeo', 'Se rompen los moldes a golpes de piqueta', '2 min'],
  ['rebarbado', 6, 'Rebarbado', 'La rebarbadora hidráulica arranca de un tajo el exceso de metal caliente de la cabeza', '1 min'],
  ['esmerilado', 14, 'Esmerilado', 'Por debajo de 300–400 °C se perfila la cabeza al perfil del carril', '10 min'],
  ['fin', 6, 'Comprobación', 'Regla sobre la soldadura, reposición del balasto y registro en la tablet', '5 min'],
];
const NOMBRE = Object.fromEntries(FASES_SOLD.map((f) => [f[0], f[2]]));

// Perfil UIC 60 simplificado (y desde la cabeza del carril hacia abajo, z lateral)
function perfilUIC60(esc = 1) {
  const p = [[0, 0], [0.036, 0], [0.037, -0.012], [0.036, -0.037], [0.033, -0.049], [0.012, -0.056], [0.0085, -0.07], [0.0085, -0.13], [0.012, -0.146], [0.03, -0.158], [0.075, -0.164], [0.075, -0.172]];
  const s = new THREE.Shape();
  const pts = [...p.map(([z, y]) => [z * esc, y * (esc > 1 ? 1.04 : 1)]), ...p.slice().reverse().map(([z, y]) => [-z * esc, y * (esc > 1 ? 1.04 : 1)])];
  s.moveTo(pts[0][0], pts[0][1]);
  for (const [z, y] of pts.slice(1)) s.lineTo(z, y);
  return s;
}
function geoCarril(largo, esc = 1) {
  const g = new THREE.ExtrudeGeometry(perfilUIC60(esc), { depth: largo, bevelEnabled: false, steps: Math.max(2, Math.round(largo / 0.05)) });
  g.rotateY(Math.PI / 2);          // extrusión (Z) → X a lo largo del carril
  return g;
}

/** Acero del carril con radiación de cuerpo negro y cascarilla al enfriarse (uniforms en m.userData.u). */
function matCarrilTermico() {
  // A dos caras: el perfil extruido queda con las caras hacia dentro tras girarlo
  const m = new THREE.MeshStandardMaterial({ color: '#c3c8cd', roughness: 0.42, metalness: 0.5, side: THREE.DoubleSide });   // sin mapa de entorno: metal medio, como los carriles del visor
  const u = { tPico: { value: 20 }, sigma: { value: 0.12 }, casc: { value: 0 }, invCarril: { value: new THREE.Matrix4() } };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    // Coordenadas en el marco de la soldadura (X a lo largo del carril, 0 en la junta), sea cual sea la pieza
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;\nuniform mat4 invCarril;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vObj = (invCarril * modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vObj; uniform float tPico; uniform float sigma; uniform float casc;
float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float nz(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 w = f*f*(3.0-2.0*f); return mix(mix(h1(i), h1(i+vec2(1,0)), w.x), mix(h1(i+vec2(0,1)), h1(i+vec2(1,1)), w.x), w.y); }
float voro(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(x, y); vec2 o = vec2(h1(i + g), h1(i + g + 7.3)); float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
  return d2 - d1; }
vec3 cuerpoNegro(float t){
  if (t < 450.0) return vec3(0.0);
  float a = clamp((t - 450.0) / 450.0, 0.0, 1.0);            // rojo oscuro → cereza (900 °C)
  float b = clamp((t - 900.0) / 500.0, 0.0, 1.0);            // → naranja
  float c = clamp((t - 1400.0) / 600.0, 0.0, 1.0);           // → blanco amarillento (2000 °C)
  vec3 col = mix(vec3(0.35, 0.01, 0.0), vec3(1.0, 0.08, 0.02), a);
  col = mix(col, vec3(1.0, 0.42, 0.05), b); col = mix(col, vec3(1.0, 0.9, 0.62), c);
  return col * pow(t / 900.0, 3.2) * 2.2;
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  // Temperatura: campana alrededor de la soldadura; el hongo y el patín (lejos del alma) se enfrían antes
  float x = vObj.x;
  float masa = 1.0 - 0.18 * smoothstep(0.0, 0.03, abs(vObj.z)) - 0.12 * smoothstep(-0.05, 0.0, vObj.y);
  float ruidoT = 0.85 + 0.3 * nz(vec2(x * 9.0, vObj.y * 40.0 + vObj.z * 30.0));
  float T = 20.0 + (tPico - 20.0) * exp(-(x * x) / (2.0 * sigma * sigma)) * masa * ruidoT;
  // Cascarilla: islas de óxido negro-pardo con grietas en la zona calentada
  float zona = exp(-(x * x) / (2.0 * 0.22 * 0.22));
  float grieta = smoothstep(0.02, 0.09, voro(vec2(x * 38.0, (vObj.y + vObj.z) * 38.0)));
  float k = clamp(casc * zona, 0.0, 1.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.03, 0.025, 0.02), vec3(0.13, 0.09, 0.06), grieta), k);
  vec3 emisionTermica = cuerpoNegro(T) * mix(1.0, 0.7 + 0.3 * grieta, k);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, 0.9, k);`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
  metalnessFactor = mix(metalnessFactor, 0.0, k);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += emisionTermica;`);
  };
  m.customProgramCacheKey = () => 'carrilTermico';
  return m;
}

export function crearSoldadura({ escena, Eje3D, W, matsVia, GEO }) {
  const grupo = new THREE.Group(); grupo.name = 'Soldadura aluminotérmica'; grupo.visible = false;
  escena.add(grupo);
  const audio = crearAudioObras();
  let sitio = null, tramo = null;
  const aLocal = (p) => W(p.E, p.N, p.Z).sub(W(sitio.ancla.E, sitio.ancla.N, sitio.ancla.Z));

  // ---- Materiales ----
  const std = (c, r = 0.7, m = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });
  const M = {
    crisol: std('#c2b29f', 0.92), crisolBase: std('#8f8270', 0.95), tapa: std('#6d7277', 0.5, 0.7),
    molde: std('#8b4513', 0.82), moldeOsc: std('#3b2418', 0.9), acero: std('#2e3135', 0.55, 0.85), tornillo: std('#9aa1a8', 0.35, 0.9),
    pasta: std('#5c5852', 0.5), gato: std('#c43b1f', 0.6, 0.3), regla: std('#c8ccd0', 0.3, 0.9), amarillo: std('#f2b705', 0.6, 0.2), rojo: std('#b91c1c', 0.55, 0.3),
    goma: std('#141516', 0.85), mangR: std('#b91c1c', 0.6), mangA: std('#1d4ed8', 0.6), botellaR: std('#b42318', 0.45, 0.4), botellaN: std('#1f2937', 0.45, 0.4), blanco: std('#e5e7eb', 0.5),
    madera: std('#7a5a3a', 0.8), cazoleta: std('#3a3a3a', 0.7, 0.6),
    llamaA: new THREE.MeshBasicMaterial({ color: '#5aa9ff', transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }),
    llamaN: new THREE.MeshBasicMaterial({ color: '#ff9a2a', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
    brillo: new THREE.MeshBasicMaterial({ color: '#fff4c8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    escoria: new THREE.MeshStandardMaterial({ color: '#2a1a12', roughness: 0.8, emissive: '#ff3a0a', emissiveIntensity: 0 }),
    interior: new THREE.MeshStandardMaterial({ color: '#222', roughness: 0.9, emissive: '#fff1b8', emissiveIntensity: 0 }),
    focoCalido: new THREE.MeshBasicMaterial({ color: '#ffe3a8' }), focoFrio: new THREE.MeshBasicMaterial({ color: '#eef4ff' }),
  };
  const caja = (sx, sy, sz, m, x = 0, y = 0, z = 0) => cajaP(sx, sy, sz, m, x, y, z);
  const matCarril = matCarrilTermico();

  // ---- Piezas del tajo (en el marco del carril: X a lo largo, Y arriba desde la cabeza, Z a la derecha) ----
  const carrilG = new THREE.Group(); carrilG.name = 'Carril_Soldadura';
  const LADO = 6, HUECO = 0.025;
  const tramoA = new THREE.Mesh(geoCarril(LADO), matCarril); tramoA.position.x = -LADO - HUECO / 2;
  const tramoB = new THREE.Mesh(geoCarril(LADO), matCarril); tramoB.position.x = HUECO / 2;
  for (const t of [tramoA, tramoB]) { t.castShadow = true; t.receiveShadow = true; carrilG.add(t); }
  // Collarín de la soldadura (aparece en la colada) y mazarota sobre la cabeza (la arranca la rebarbadora)
  const collar = new THREE.Mesh(geoCarril(0.075, 1.22), matCarril); collar.position.x = -0.0375; collar.visible = false; carrilG.add(collar);
  const mazarota = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.085), matCarril); mazarota.position.set(0, 0.016, 0); mazarota.visible = false; carrilG.add(mazarota);
  // Moldes de arena con portamoldes y pasta de sellado
  const moldes = new THREE.Group(); moldes.visible = false;
  const mitades = [];
  for (const z of [-1, 1]) {
    const m = new THREE.Group();
    m.add(caja(0.2, 0.25, 0.085, M.molde, 0, -0.07, z * 0.085), caja(0.2, 0.02, 0.02, M.moldeOsc, 0, -0.07, z * 0.044));
    m.add(caja(0.24, 0.05, 0.03, M.acero, 0, 0.03, z * 0.14), caja(0.03, 0.3, 0.03, M.acero, -0.11, -0.07, z * 0.14), caja(0.03, 0.3, 0.03, M.acero, 0.11, -0.07, z * 0.14));
    for (const x of [-0.08, 0.08]) m.add(cil(0.01, 0.08, M.tornillo, x, -0.07, z * 0.17, 'z'));
    moldes.add(m); mitades.push(m);
  }
  const boca = caja(0.06, 0.02, 0.06, M.moldeOsc, 0, 0.065, 0); moldes.add(boca);
  const pasta = [];
  for (const [x, y, z] of [[-0.1, 0.0, 0.05], [0.1, 0.0, 0.05], [-0.1, 0.0, -0.05], [0.1, 0.0, -0.05], [-0.1, -0.16, 0.09], [0.1, -0.16, 0.09], [-0.1, -0.16, -0.09], [0.1, -0.16, -0.09], [-0.1, -0.09, 0.02], [0.1, -0.09, -0.02]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M.pasta); b.position.set(x, y, z); b.scale.set(0.8, 1.3, 1.1); b.visible = false; moldes.add(b); pasta.push(b);
  }
  carrilG.add(moldes);
  // Cazoletas de escoria a los lados
  const cazoletas = [];
  for (const z of [-1, 1]) { const c = new THREE.Group(); c.add(caja(0.14, 0.05, 0.1, M.cazoleta, 0, 0, 0)); const e = caja(0.12, 0.02, 0.08, M.escoria, 0, 0.02, 0); e.visible = false; c.add(e); c.userData.esc = e; c.position.set(0, -0.12, z * 0.27); c.visible = false; carrilG.add(c); cazoletas.push(c); }
  // Crisol «one-shot» sobre su soporte
  const crisol = new THREE.Group(); crisol.visible = false;
  const cono = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.065, 0.32, 24, 1, true), M.crisol); cono.position.y = 0.16; cono.material.side = THREE.DoubleSide;
  crisol.add(cono, cil(0.066, 0.02, M.crisolBase, 0, 0.0, 0), cil(0.152, 0.015, M.tapa, 0, 0.33, 0));
  const interior = new THREE.Mesh(new THREE.CircleGeometry(0.135, 24), M.interior); interior.rotation.x = -Math.PI / 2; interior.position.y = 0.3; crisol.add(interior);
  for (const a of [0, 2.1, 4.2]) { const l = tubo(0.008, new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(Math.cos(a) * 0.3, -0.25, Math.sin(a) * 0.3), M.acero); crisol.add(l); }
  crisol.position.set(0, 0.09, 0);
  carrilG.add(crisol);
  const chorro = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.12, 10), new THREE.MeshBasicMaterial({ color: '#fff1b0' })); chorro.position.set(0, 0.06, 0); chorro.visible = false; carrilG.add(chorro);
  const destello = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), M.brillo); destello.position.set(0, 0.15, 0); carrilG.add(destello);
  // Gato de alineación y regla
  const gato = new THREE.Group(); gato.add(caja(0.18, 0.12, 0.14, M.gato, 0, -0.23, 0), cil(0.012, 0.5, M.acero, 0.05, -0.17, 0.25, 'z')); gato.position.x = -0.45; gato.visible = false; carrilG.add(gato);
  const regla = caja(1.0, 0.015, 0.04, M.regla, 0, 0.008, 0); regla.visible = false; carrilG.add(regla);
  // Rebarbadora hidráulica (cizalla de guillotina) y esmeriladora sobre ruedas guía
  const rebarb = new THREE.Group(); rebarb.visible = false;
  rebarb.add(caja(0.5, 0.32, 0.3, M.amarillo, 0, 0.2, 0), caja(0.05, 0.14, 0.2, M.acero, -0.06, 0.02, 0), caja(0.05, 0.14, 0.2, M.acero, 0.06, 0.02, 0));
  for (const x of [-0.22, 0.22]) rebarb.add(cil(0.04, 0.06, M.acero, x, 0.03, 0.08, 'z'));
  carrilG.add(rebarb);
  const esmer = new THREE.Group(); esmer.visible = false;
  esmer.add(caja(0.6, 0.22, 0.32, M.rojo, 0, 0.18, 0.05), caja(0.3, 0.18, 0.2, M.goma, -0.2, 0.36, 0.05));
  const muela = cil(0.09, 0.04, M.tornillo, 0.12, 0.06, 0, 'z', 18); esmer.add(muela);
  for (const x of [-0.25, 0.25]) esmer.add(cil(0.05, 0.03, M.acero, x, 0.0, -0.04, 'z'));
  esmer.add(tubo(0.015, new THREE.Vector3(-0.3, 0.2, 0.05), new THREE.Vector3(-0.85, 0.85, 0.05), M.acero));
  carrilG.add(esmer);

  // Soplete con su lanza y la llama (va en la mano del soldador)
  const soplete = new THREE.Group();
  soplete.add(cil(0.012, 1.1, M.tornillo, 0, -0.55, 0), cil(0.02, 0.18, M.goma, 0, -0.05, 0));
  const llama = new THREE.Group(); llama.position.y = -1.12;
  const lA = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 12, 1, true), M.llamaA); lA.rotation.x = Math.PI; lA.position.y = -0.1;
  const lN = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.38, 12, 1, true), M.llamaN); lN.rotation.x = Math.PI; lN.position.y = -0.2;
  llama.add(lA, lN); soplete.add(llama); soplete.visible = false;
  // Útiles de mano
  const pala = new THREE.Group(); pala.add(cil(0.016, 1.05, M.madera, 0, -0.45, 0), caja(0.25, 0.3, 0.02, M.acero, 0, -1.05, 0)); pala.visible = false;
  const pala2 = pala.clone(); pala2.visible = false;
  const piqueta = new THREE.Group(); piqueta.add(cil(0.015, 0.45, M.madera, 0, -0.2, 0), caja(0.05, 0.05, 0.22, M.acero, 0, -0.43, 0)); piqueta.visible = false;
  const tronzadora = new THREE.Group(); tronzadora.add(caja(0.35, 0.22, 0.18, M.rojo, 0, -0.1, 0)); const disco = cil(0.17, 0.008, M.tornillo, 0.25, -0.2, 0, 'z', 24); tronzadora.add(disco); tronzadora.visible = false;
  const pirometro = new THREE.Group(); pirometro.add(caja(0.12, 0.09, 0.05, M.amarillo, 0.03, -0.05, 0), caja(0.02, 0.02, 0.02, new THREE.MeshBasicMaterial({ color: '#ff2020' }), 0.1, -0.03, 0)); pirometro.visible = false;
  const bengala = new THREE.Group(); bengala.add(cil(0.006, 0.4, M.acero, 0, -0.2, 0)); const chispaB = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#fffbe0' })); chispaB.position.y = -0.4; bengala.add(chispaB); bengala.visible = false;

  // ---- Equipo auxiliar del tajo ----
  const equipo = new THREE.Group();
  const carroGas = new THREE.Group();
  carroGas.add(cil(0.11, 1.1, M.botellaR, 0, 0.6, -0.13), cil(0.11, 1.1, M.botellaN, 0, 0.6, 0.13), cil(0.13, 0.05, M.blanco, 0, 1.18, 0.13), caja(0.4, 0.05, 0.5, M.acero, 0, 0.05, 0));
  for (const z of [-0.22, 0.22]) carroGas.add(cil(0.1, 0.04, M.goma, -0.15, 0.1, z, 'z'));
  const grupoHid = new THREE.Group(); grupoHid.add(caja(0.8, 0.55, 0.55, M.rojo, 0, 0.28, 0), caja(0.5, 0.1, 0.5, M.goma, 0, 0.6, 0));
  const focos = [];
  for (let k = 0; k < 2; k++) {
    const tr = new THREE.Group();
    for (const a of [0, 2.1, 4.2]) tr.add(tubo(0.012, new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5), M.acero));
    tr.add(caja(0.08, 0.26, 0.34, M.goma, 0, 1.75, 0), caja(0.02, 0.22, 0.3, M.focoCalido, 0.05, 1.75, 0));
    const luz = new THREE.SpotLight('#ffd9a0', 0, 22, 0.75, 0.5, 1.4);
    luz.position.set(0.1, 1.75, 0); tr.add(luz, luz.target);
    equipo.add(tr); focos.push({ tr, luz });
  }
  const torreLED = new THREE.Group(); torreLED.add(caja(1.6, 0.8, 1.1, M.amarillo, 0, 0.5, 0), cil(0.06, 6, M.acero, 0, 3.8, 0), caja(0.1, 0.5, 0.9, M.focoFrio, 0.05, 6.8, 0));
  const luzLED = new THREE.PointLight('#eef4ff', 0, 40, 1.6); luzLED.position.set(0.3, 6.8, 0); torreLED.add(luzLED);
  equipo.add(carroGas, grupoHid, torreLED);
  // Luces de la reacción, la colada, el soplete y el carril al rojo
  const luzReaccion = new THREE.PointLight('#fff0c0', 0, 30, 1.5);
  const luzSoplete = new THREE.PointLight('#8fc3ff', 0, 6, 1.6);
  const luzCarril = new THREE.PointLight('#ff6a20', 0, 5, 1.6);
  carrilG.add(luzReaccion, luzSoplete, luzCarril);
  luzReaccion.position.set(0, 0.45, 0); luzCarril.position.set(0, 0.05, 0.15);

  // ---- Partículas ----
  const efectos = new THREE.Group();
  const humoOsc = crearPolvo(200, '#3b3936'), humoBlanco = crearPolvo(500, '#ecebe6'), polvo = crearPolvo(160, '#cdc6b8');
  efectos.add(humoOsc.puntos, humoBlanco.puntos, polvo.puntos);
  // Chispas: rápidas, en línea recta y rebotando en el balasto
  const N_CH = 700;
  const gCh = new THREE.BufferGeometry(), pCh = new Float32Array(N_CH * 3), cCh = new Float32Array(N_CH * 3);
  gCh.setAttribute('position', new THREE.BufferAttribute(pCh, 3).setUsage(THREE.DynamicDrawUsage));
  gCh.setAttribute('color', new THREE.BufferAttribute(cCh, 3).setUsage(THREE.DynamicDrawUsage));
  const chispas = new THREE.Points(gCh, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  chispas.frustumCulled = false; efectos.add(chispas);
  const vCh = new Float32Array(N_CH * 3), vidaCh = new Float32Array(N_CH), sueloCh = new Float32Array(N_CH);
  let iCh = 0;
  function emitirChispas(p, dir, n, { vel = 6, abre = 0.5, suelo = -0.25 } = {}) {
    for (let k = 0; k < n; k++) {
      const i = iCh++ % N_CH;
      pCh[i * 3] = p.x; pCh[i * 3 + 1] = p.y; pCh[i * 3 + 2] = p.z;
      const v = vel * (0.6 + Math.random() * 0.7);
      vCh[i * 3] = (dir.x + (Math.random() - 0.5) * abre) * v; vCh[i * 3 + 1] = (dir.y + (Math.random() - 0.3) * abre) * v; vCh[i * 3 + 2] = (dir.z + (Math.random() - 0.5) * abre) * v;
      vidaCh[i] = 0.5 + Math.random() * 0.7; sueloCh[i] = suelo;
    }
  }
  function actualizarChispas(dt) {
    for (let i = 0; i < N_CH; i++) {
      if (vidaCh[i] <= 0) { cCh[i * 3] = cCh[i * 3 + 1] = cCh[i * 3 + 2] = 0; continue; }
      vidaCh[i] -= dt;
      vCh[i * 3 + 1] -= 9.8 * dt;
      pCh[i * 3] += vCh[i * 3] * dt; pCh[i * 3 + 1] += vCh[i * 3 + 1] * dt; pCh[i * 3 + 2] += vCh[i * 3 + 2] * dt;
      if (pCh[i * 3 + 1] < sueloCh[i]) { pCh[i * 3 + 1] = sueloCh[i]; vCh[i * 3 + 1] *= -0.35; vCh[i * 3] *= 0.5; vCh[i * 3 + 2] *= 0.5; }
      const v = Math.min(1, vidaCh[i] * 1.6);
      cCh[i * 3] = 1.0 * v; cCh[i * 3 + 1] = (0.55 + 0.35 * v) * v; cCh[i * 3 + 2] = 0.15 * v * v;
    }
    gCh.attributes.position.needsUpdate = true; gCh.attributes.color.needsUpdate = true;
  }
  // Trozos de metal incandescente y de molde que caen al balasto
  const trozos = [];
  const matTrozo = () => new THREE.MeshStandardMaterial({ color: '#2a201a', roughness: 0.8, emissive: '#ff5a10', emissiveIntensity: 3 });
  function soltarTrozo(p, { tam = 0.04, incandescente = true, mat = null } = {}) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(tam, 0), mat || (incandescente ? matTrozo() : M.molde));
    m.position.copy(p); m.castShadow = true;
    efectos.add(m);
    trozos.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.8 + Math.random(), (Math.random() - 0.5) * 1.2), vida: 30, quieto: false, incandescente });
  }
  function actualizarTrozos(dt, suelo) {
    for (let i = trozos.length - 1; i >= 0; i--) {
      const t = trozos[i];
      t.vida -= dt;
      if (!t.quieto) {
        t.v.y -= 9.8 * dt; t.m.position.addScaledVector(t.v, dt); t.m.rotation.x += dt * 5;
        if (t.m.position.y < suelo) { t.m.position.y = suelo; t.v.multiplyScalar(0.3); t.v.y = Math.abs(t.v.y) * 0.3; if (t.v.length() < 0.2) t.quieto = true; }
      }
      if (t.incandescente) {
        t.m.material.emissiveIntensity = Math.max(0, t.m.material.emissiveIntensity - dt * 0.12);
        if (t.quieto && t.m.material.emissiveIntensity > 0.4 && Math.random() < dt * 4) humoOsc.emitir(t.m.position, 1, { tam: 0.06, crece: 0.25, vida: 2, alfa: 0.4, sube: 0.4, fuerza: 0.2 });
      }
      if (t.vida <= 0) { efectos.remove(t.m); t.m.geometry.dispose(); trozos.splice(i, 1); }
    }
  }

  // ---- Cuadrilla ----
  let crew = null;
  function crearCuadrilla() {
    const soldador = crearOperario({ nombre: 'Soldador principal', farol: null, chaleco: '#d9e021', ropa: '#1e2a44', colorCasco: '#f4f4ef', extras: ['pantalla', 'guantesLargos', 'polainas'] });
    const ayudante = crearOperario({ nombre: 'Ayudante especialista', farol: null, chaleco: '#d9e021', ropa: '#1d3b78', colorCasco: '#f2c100', extras: ['frontal', 'gafas', 'orejeras'] });
    const capataz = crearOperario({ nombre: 'Capataz', farol: null, chaleco: '#d9e021', ropa: '#2a2f36', colorCasco: '#f4f4ef', extras: ['tablet', 'emisoraHombro', 'frontal'] });
    const ops = [soldador, ayudante, capataz];
    for (const o of ops) grupo.add(o.raiz);
    // Útiles en las manos
    soldador.manos.der.add(soplete, tronzadora, piqueta, bengala, pala);
    ayudante.manos.der.add(pala2);
    capataz.manos.izq.add(pirometro);
    // Frontal LED del ayudante y del capataz
    for (const o of [ayudante, capataz]) {
      const sp = new THREE.SpotLight('#eaf2ff', 0, 9, 0.5, 0.6, 1.5);
      sp.position.set(0.13, 0.08, 0); sp.target.position.set(1.2, -1.0, 0);
      o.cabeza.add(sp, sp.target); o.luz = sp;
    }
    return { soldador, ayudante, capataz, ops, pos: ops.map(() => ({ pk: 0, u: 0, yaw: null })) };
  }

  // ---- Estado ----
  const estado = { activo: false, fase: 'desguarnecido', u: 0, temperatura: 20, ciclo: 0, levante: 0 };
  let iF = 0, tF = 0, pkW = 0, uRail = 0, r = 1, sons = null, ultimoGolpe = 0;

  function montar({ pk, s = 1 }) {
    desmontar();
    // Soldadura en el carril exterior, en un cajón entre traviesas
    const i = Math.round(pk / ESPACIADO);
    pkW = (i + 0.5) * ESPACIADO;
    r = s > 0 ? 1 : 0; uRail = GALGA;
    const m0 = Eje3D.enPk(pkW);
    sitio = { pk: pkW, s, ancla: { E: m0.E, N: m0.N, Z: m0.Z } };
    grupo.position.copy(W(sitio.ancla.E, sitio.ancla.N, sitio.ancla.Z));
    if (!tramo) tramo = crearTramoVia({ Eje3D, aLocal: (p) => aLocal(p), mundo: (p) => W(p.E, p.N, p.Z), mats: matsVia, GEO, atras: 18, delante: 18 });
    tramo.montar(s, Math.round((pkW - 18) / ESPACIADO));
    tramo.mostrarCarriles();
    tramo.ocultarCarril(r, pkW - LADO + 0.3, pkW + LADO - 0.3);
    // Gato: la vía sube unos milímetros alrededor de la soldadura durante la alineación
    tramo.prov.desviacion = [(p) => ({ v: estado.levante * 0.004 * Math.max(0, 1 - Math.abs(p - pkW) / 3), h: 0 })];
    tramo.prov.balasto = null; tramo.prov.suciedad = () => 0.25;
    tramo.marcarTodo();
    grupo.add(tramo.grupo, carrilG, equipo, efectos);
    crew = crew || crearCuadrilla();
    for (const o of crew.ops) grupo.add(o.raiz);
    for (const p of crew.pos) { p.pk = 0; p.u = 0; }
    for (const o of crew.ops) o.raiz.rotation.set(0, 0, 0);
    estado.levante = 0;
    tramo.actualizarVia(); tramo.actualizarBalasto();
    colocarEquipo();
    sons = {
      soplete: audio.fuente('soplete', { ref: 3 }), disco: audio.fuente('disco', { ref: 3 }), reaccion: audio.fuente('reaccion', { ref: 5 }),
      hidraulico: audio.fuente('diesel', { ref: 3 }), generador: audio.fuente('generador', { ref: 4 }),
    };
    iF = 0; tF = 0; estado.levante = 0; estado.ciclo = 0;
    reiniciarPiezas();
    grupo.visible = true;
    estado.activo = true;
    actualizar(0);
  }
  function desmontar() {
    if (tramo) tramo.desmontar();
    if (sons) { for (const f of Object.values(sons)) f.parar(); sons = null; }
    for (const c of [...grupo.children]) grupo.remove(c);
    for (const t of trozos.splice(0)) { t.m.geometry.dispose(); }
    grupo.visible = false;
    estado.activo = false;
    sitio = null;
  }
  function reiniciarPiezas() {
    matCarril.userData.u.tPico.value = 20; matCarril.userData.u.casc.value = 0; matCarril.userData.u.sigma.value = 0.12;
    collar.visible = false; mazarota.visible = false; moldes.visible = false; for (const p of pasta) p.visible = false;
    for (const m of mitades) { m.visible = true; m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); }
    for (const c of cazoletas) { c.visible = false; c.userData.esc.visible = false; }
    crisol.visible = false; chorro.visible = false; gato.visible = false; regla.visible = false; rebarb.visible = false; esmer.visible = false;
    M.interior.emissiveIntensity = 0; M.escoria.emissiveIntensity = 0;
    // Los dos extremos juntos (sin hueco) hasta el corte
    tramoA.position.x = -LADO; tramoB.position.x = 0;
  }

  const _up = new THREE.Vector3(0, 1, 0), _x = new THREE.Vector3(), _z = new THREE.Vector3(), _bx = new THREE.Matrix4(), _w = new THREE.Vector3(), _p = new THREE.Vector3();
  function colocarEquipo() {
    const s = sitio.s;
    const p0 = tramo.punto(pkW, uRail, 0), p1 = tramo.punto(pkW + 1, uRail, 0);
    _x.copy(p1).sub(p0).setY(0).normalize(); _z.crossVectors(_x, _up).normalize();
    carrilG.position.copy(p0);
    carrilG.quaternion.setFromRotationMatrix(_bx.makeBasis(_x, _up, _z));
    // Equipo en el paseo exterior (u hacia fuera)
    const enSuelo = (pk, u, obj, yaw = 0) => { const pp = tramo.punto(pk, u, tramo.cotaBalasto(pk, Math.min(u, 3.2))); obj.position.copy(pp); obj.rotation.y = Math.atan2(-_x.z, _x.x) + yaw; };
    enSuelo(pkW - 2.4, 2.6, carroGas);
    enSuelo(pkW + 2.8, 2.7, grupoHid);
    enSuelo(pkW - 9, 4.6, torreLED, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    enSuelo(pkW - 3.5, 2.9, focos[0].tr, 0.9 * -s);
    enSuelo(pkW + 3.5, 2.9, focos[1].tr, 2.2 * -s);
    for (const f of focos) { f.tr.updateMatrixWorld(true); f.luz.target.position.copy(f.tr.worldToLocal(carrilG.getWorldPosition(_w))); }
    void s;
  }

  // Posición y pose de la cuadrilla en cada fase (pk relativo a la soldadura, u lateral hacia fuera)
  const SITIOS = {
    soldador: { cerca: [0.35, 1.35], molde: [-0.15, 1.3], atras: [-3.5, 2.6], esmer: [0.2, 1.35] },
    ayudante: { cerca: [-0.4, 0.1], molde: [0.2, 0.15], atras: [-3.2, 3.0], hid: [2.4, 2.4] },
    capataz: { mira: [1.8, 2.5], cerca: [0.9, 1.9], atras: [-2.6, 3.2] },
  };
  function plan(fase, t) {
    // Devuelve, para cada operario, [sitio, pose, útil visible]
    const golpe = Math.sin(t * 6);
    const pal = { agacha: 0.35, tronco: 0.65, der: { z: 0.7 + 0.45 * Math.sin(t * 2.2), x: -0.1, codo: 0.5 }, izq: { z: 1.0 + 0.3 * Math.sin(t * 2.2), x: 0.15, codo: 0.4 } };
    const agach = (extra = {}) => ({ agacha: 1, tronco: 0.55, der: { z: 1.15, x: -0.15, codo: 0.35 }, izq: { z: 1.1, x: 0.15, codo: 0.35 }, ...extra });
    const sostenSoplete = { agacha: 0.15, tronco: 0.25, der: { z: 0.55, x: -0.1, codo: 0.65 }, izq: { z: 0.95, x: 0.2, codo: 0.9 }, pantalla: true };
    const piro = { der: { z: 1.0, x: -0.05, codo: 0.3 }, izq: { z: 1.45, x: 0.1, codo: 0.1 } };
    switch (fase) {
      case 'desguarnecido': return { soldador: ['cerca', pal, 'pala'], ayudante: ['cerca', { ...pal, der: { z: 0.7 + 0.45 * Math.sin(t * 2.2 + 1.5), x: -0.1, codo: 0.5 } }, 'pala2'], capataz: ['mira', null, null] };
      case 'corte': return { soldador: ['cerca', agach({ pantalla: true, der: { z: 1.25, x: -0.2, codo: 0.55 }, izq: { z: 1.25, x: 0.2, codo: 0.55 } }), 'tronzadora'], ayudante: ['atras', null, null], capataz: ['mira', { der: { z: 0.9, x: 0.5, codo: 2.3 } }, null] };
      case 'alineacion': return { soldador: ['molde', agach(), null], ayudante: ['cerca', agach({ der: { z: 0.9 + 0.4 * Math.sin(t * 3), x: -0.15, codo: 0.8 } }), null], capataz: ['cerca', null, null] };
      case 'moldes': return { soldador: ['molde', agach({ izq: { z: 1.2, x: 0.25, codo: 0.4 } }), null], ayudante: ['molde', agach({ der: { z: 1.15, x: -0.1, codo: 0.6 + 0.3 * Math.sin(t * 4) } }), null], capataz: ['mira', null, null] };
      case 'precalentamiento': return { soldador: ['molde', sostenSoplete, 'soplete'], ayudante: ['atras', null, null], capataz: ['cerca', t % 6 < 3 ? piro : null, t % 6 < 3 ? 'pirometro' : null] };
      case 'crisol': return { soldador: ['molde', { agacha: 0.2, tronco: 0.35, pantalla: true, der: { z: 1.1, x: -0.1, codo: 0.3 } }, estado.u > 0.5 ? 'bengala' : null], ayudante: ['atras', null, null], capataz: ['atras', null, null] };
      case 'reaccion': case 'colada': return { soldador: ['atras', { pantalla: true }, null], ayudante: ['atras', null, null], capataz: ['atras', { der: { z: 0.9, x: 0.5, codo: 2.3 } }, null] };
      case 'enfriamiento': return { soldador: ['atras', null, null], ayudante: ['atras', null, null], capataz: ['cerca', piro, 'pirometro'] };
      case 'desmoldeo': return { soldador: ['molde', { agacha: 0.45, tronco: 0.55, pantalla: true, der: { z: 1.3 + 0.8 * golpe, x: -0.1, codo: 0.4 } }, 'piqueta'], ayudante: ['atras', null, null], capataz: ['mira', null, null] };
      case 'rebarbado': return { soldador: ['atras', null, null], ayudante: ['hid', { der: { z: 0.6, x: -0.2, codo: 1.0 } }, null], capataz: ['mira', null, null] };
      case 'esmerilado': return { soldador: ['esmer', { agacha: 0.3, tronco: 0.5, pantalla: true, der: { z: 1.0, x: -0.1, codo: 0.7 }, izq: { z: 1.0, x: 0.1, codo: 0.7 } }, null], ayudante: ['atras', null, null], capataz: ['mira', null, null] };
      default: return { soldador: ['atras', null, null], ayudante: ['cerca', agach(), null], capataz: ['cerca', agach({ der: { z: 1.2, x: -0.1, codo: 0.2 } }), null] };
    }
  }

  function moverCuadrilla(dt, fase, t) {
    const P = plan(fase, t);
    const utiles = { pala, pala2, soplete, tronzadora, piqueta, bengala, pirometro };
    const visibles = new Set(Object.values(P).map((x) => x[2]).filter(Boolean));
    for (const [k, u] of Object.entries(utiles)) u.visible = visibles.has(k);
    ['soldador', 'ayudante', 'capataz'].forEach((nom, i) => {
      const o = crew[nom], pos = crew.pos[i];
      const [sit, pose] = P[nom];
      const [dPk, uT] = SITIOS[nom][sit] || SITIOS[nom].atras;
      if (pos.pk === 0 && pos.u === 0) { pos.pk = pkW + dPk; pos.u = uT; }
      const fk = pkW + dPk - pos.pk, fu = uT - pos.u, dist = Math.hypot(fk, fu);
      const vel = dist > 0.08 ? Math.min(1.1, dist * 1.5 + 0.2) : 0;
      if (vel > 0) { pos.pk += (fk / dist) * vel * dt; pos.u += (fu / dist) * vel * dt; }
      const y = tramo.cotaBalasto(pos.pk, Math.min(pos.u, 3.2));
      o.raiz.position.copy(tramo.punto(pos.pk, pos.u, Math.max(y, pos.u < 1.35 ? -0.16 : y)));
      // Mirando a donde anda o a la soldadura
      const haciaW = tramo.punto(pkW, uRail, 0).sub(o.raiz.position);
      const dir = vel > 0 ? tramo.punto(pkW + dPk, uT, 0).sub(o.raiz.position) : haciaW;
      const yaw = Math.atan2(-dir.z, dir.x);
      const dy = Math.atan2(Math.sin(yaw - o.raiz.rotation.y), Math.cos(yaw - o.raiz.rotation.y));
      o.raiz.rotation.y += dy * Math.min(1, dt * 4);
      o.actualizar(dt, { estado: vel > 0 ? 'andar' : 'mirar', vel, pose: vel > 0 ? null : pose, alPisar: () => { o.raiz.getWorldPosition(_w); audio.golpe(_w, { tipo: 'paso', nivel: 0.6 }); } });
    });
    // Orientación de los útiles en la mano (apuntando a la soldadura)
    soplete.rotation.set(0, 0, -0.4); tronzadora.rotation.set(0, 0, 0.3); pala.rotation.set(0, 0, 0.6); pala2.rotation.set(0, 0, 0.6);
  }

  function actualizar(dt) {
    if (!estado.activo) return;
    dt = Math.max(0, Math.min(dt, 0.1));
    grupo.position.copy(W(sitio.ancla.E, sitio.ancla.N, sitio.ancla.Z));
    tramo.refrescarCorte();
    tF += dt;
    if (tF >= FASES_SOLD[iF][1]) {
      tF -= FASES_SOLD[iF][1];
      iF = (iF + 1) % FASES_SOLD.length;
      if (iF === 0) { reiniciarPiezas(); estado.ciclo++; }
      entrarFase(FASES_SOLD[iF][0]);
    }
    const fase = FASES_SOLD[iF][0], u = tF / FASES_SOLD[iF][1], t = performance.now() / 1000;
    estado.fase = fase; estado.u = u;
    const uMat = matCarril.userData.u;
    carrilG.updateMatrixWorld(true);
    uMat.invCarril.value.copy(carrilG.matrixWorld).invert();
    const pRail = carrilG.getWorldPosition(new THREE.Vector3());
    const local = (x, y, z) => efectos.worldToLocal(carrilG.localToWorld(_p.set(x, y, z)));
    const suelo = tramo.cotaBalasto(pkW, uRail) - 0.02;
    const zF = -sitio.s;       // exterior de la vía en el marco del carril (Z a la derecha)
    // Valores por defecto de luces y sonidos (cada fase los sube)
    let sSop = 0, sDisco = 0, tonoDisco = 0.5, sReac = 0, sHid = 0.25;
    luzSoplete.intensity = 0; luzReaccion.intensity = 0; M.brillo.opacity = 0; chorro.visible = false; llama.visible = soplete.visible;
    estado.levante = Math.max(0, estado.levante - dt * 0.3);

    switch (fase) {
      case 'desguarnecido': {
        // Cajones a ambos lados de la junta vaciados poco a poco; piedras volando a la banqueta
        for (const sx of [-1, 1]) tramo.hundir(pkW + sx * 0.15, uRail, 0.28, 0.16 * suave(u));
        if (Math.random() < dt * 5) {
          const o = local(0.3 * (Math.random() - 0.5), -0.2, 0.2 * zF);
          for (let k = 0; k < 3; k++) polvo.emitir(o, 1, { tam: 0.1, vida: 1.5, alfa: 0.35, sube: 0.3 });
          soltarTrozo(local(0, -0.15, 0), { tam: 0.03, incandescente: false, mat: M.crisolBase });
        }
        break;
      }
      case 'corte': {
        if (u > 0.15 && u < 0.85) {
          sDisco = 1; tonoDisco = 0.6;
          emitirChispas(local(0, -0.04 - 0.12 * u, 0), new THREE.Vector3(0, 0.25, zF * 0.9), 26, { vel: 7, abre: 0.9, suelo });
          if (Math.random() < dt * 8) humoOsc.emitir(local(0, -0.05, 0), 1, { tam: 0.08, crece: 0.4, vida: 1.6, alfa: 0.3, sube: 0.6 });
          // El corte abre la separación de 25 mm
          tramoA.position.x = -LADO - HUECO / 2 * suave((u - 0.15) / 0.7); tramoB.position.x = HUECO / 2 * suave((u - 0.15) / 0.7);
        }
        break;
      }
      case 'alineacion': gato.visible = true; regla.visible = u > 0.35; estado.levante = Math.min(1, estado.levante + dt * 0.6); break;
      case 'moldes': {
        gato.visible = true; moldes.visible = u > 0.15; regla.visible = false;
        pasta.forEach((b, k) => { b.visible = u > 0.4 + k * 0.05; });
        M.pasta.roughness = 0.5;
        break;
      }
      case 'precalentamiento': {
        moldes.visible = true; for (const b of pasta) b.visible = true;
        sSop = 1; luzSoplete.intensity = 18; luzSoplete.position.set(0, 0.15, 0);
        uMat.tPico.value = 20 + 930 * suave(u); uMat.sigma.value = 0.09 + 0.05 * u;
        M.pasta.roughness = 0.5 + 0.4 * u; M.pasta.color.setRGB(0.36 - 0.12 * u, 0.345 - 0.12 * u, 0.32 - 0.12 * u);
        if (Math.random() < dt * 14) humoOsc.emitir(local(0, 0.1, 0), 1, { tam: 0.07, crece: 0.45, vida: 2.2, alfa: 0.25, sube: 0.7, fuerza: 0.4 });
        llama.scale.setScalar(0.9 + Math.random() * 0.25);
        break;
      }
      case 'crisol': {
        crisol.visible = u > 0.25; cazoletas.forEach((c) => { c.visible = true; });
        uMat.tPico.value = Math.max(600, uMat.tPico.value - dt * 30);
        if (u > 0.75) { emitirChispas(local(0, 0.42, 0), new THREE.Vector3(0, 1, 0), 10, { vel: 3, abre: 1.4, suelo }); if (!estado.chispazo) { estado.chispazo = true; audio.golpe(pRail, { tipo: 'chispa', nivel: 1 }); } }
        break;
      }
      case 'reaccion': {
        estado.chispazo = false;
        sReac = 1; M.interior.emissiveIntensity = 6 + 4 * Math.random();
        luzReaccion.intensity = 260 + 140 * Math.random(); luzReaccion.color.set('#ffe7b0');
        for (let k = 0; k < 4; k++) humoBlanco.emitir(local((Math.random() - 0.5) * 0.2, 0.45, (Math.random() - 0.5) * 0.2), 1, { tam: 0.35, crece: 1.6, vida: 4.5, alfa: 0.55, sube: 2.6, fuerza: 0.8 });
        if (Math.random() < dt * 20) emitirChispas(local(0, 0.45, 0), new THREE.Vector3(0, 1, 0), 3, { vel: 2.5, abre: 1.2, suelo });
        break;
      }
      case 'colada': {
        sReac = 0.7; chorro.visible = u < 0.7; M.interior.emissiveIntensity = 10;
        // Destello cegador: domina la escena e ilumina las caras
        const f = Math.max(0, 1 - Math.abs(u - 0.25) * 2.2);
        luzReaccion.intensity = 1800 * f + 300; luzReaccion.color.set('#fff6d8'); M.brillo.opacity = 0.85 * f;
        destello.scale.setScalar(1 + 2.5 * f);
        if (u > 0.2) { collar.visible = true; mazarota.visible = true; uMat.tPico.value = 2000; uMat.sigma.value = 0.06; }
        if (u > 0.4) cazoletas.forEach((c) => { c.userData.esc.visible = true; M.escoria.emissiveIntensity = 5; });
        for (let k = 0; k < 3; k++) humoBlanco.emitir(local((Math.random() - 0.5) * 0.3, 0.4, (Math.random() - 0.5) * 0.3), 1, { tam: 0.4, crece: 1.8, vida: 4.5, alfa: 0.5, sube: 2.8, fuerza: 0.9 });
        break;
      }
      case 'enfriamiento': {
        crisol.visible = u < 0.3; M.interior.emissiveIntensity = Math.max(0, 6 - u * 20);
        uMat.tPico.value = 2000 - 450 * u; uMat.sigma.value = 0.06 + 0.04 * u;
        M.escoria.emissiveIntensity = Math.max(1, 5 - u * 3);
        if (Math.random() < dt * 4) humoBlanco.emitir(local(0, 0.1, 0), 1, { tam: 0.15, crece: 0.8, vida: 3, alfa: 0.25, sube: 1.2 });
        break;
      }
      case 'desmoldeo': {
        crisol.visible = false;
        uMat.tPico.value = 1550 - 300 * u;
        // Golpes de piqueta: el molde se parte y cae
        if (Math.sin(t * 6) > 0.95 && t - ultimoGolpe > 0.3) {
          ultimoGolpe = t; audio.golpe(pRail, { tipo: 'clac', nivel: 1 });
          if (moldes.visible) soltarTrozo(local((Math.random() - 0.5) * 0.15, -0.05, 0.12 * zF), { tam: 0.045, incandescente: false, mat: M.molde });
        }
        mitades.forEach((m, k) => { m.position.y = -0.4 * suave((u - 0.35) / 0.4); m.rotation.x = (k ? 1 : -1) * 0.9 * suave((u - 0.35) / 0.4); });
        if (u > 0.8) { moldes.visible = false; for (const c of cazoletas) c.visible = false; }
        uMat.casc.value = 0.1 * u;
        break;
      }
      case 'rebarbado': {
        rebarb.visible = true; sHid = 0.9;
        rebarb.position.set(0, 0.0 + 0.06 * (1 - suave(u * 2)), 0);
        if (u > 0.55 && mazarota.visible) {
          mazarota.visible = false;
          // El tajo arranca de una vez el exceso de la cabeza: el bloque incandescente cae al balasto
          soltarTrozo(local(0, 0.04, 0.05 * zF), { tam: 0.05, incandescente: true });
          for (let k = 0; k < 3; k++) soltarTrozo(local((Math.random() - 0.5) * 0.08, 0.03, 0.05 * zF), { tam: 0.02, incandescente: true });
          audio.golpe(pRail, { tipo: 'clac', nivel: 1.2 });
        }
        uMat.tPico.value = 1250 - 200 * u; uMat.casc.value = 0.1 + 0.15 * u;
        break;
      }
      case 'esmerilado': {
        rebarb.visible = false; esmer.visible = true;
        const x = Math.sin(t * 1.2) * 0.25;
        esmer.position.set(x, 0, 0);
        muela.rotation.y += dt * 60;
        sDisco = 0.9; tonoDisco = 0.35;
        emitirChispas(local(x + 0.12, 0.0, 0), new THREE.Vector3(-0.8, 0.35, zF * 0.3), 18, { vel: 5, abre: 0.6, suelo });
        uMat.tPico.value = 1050 - 650 * u; uMat.casc.value = 0.25 + 0.65 * u;
        break;
      }
      default: {
        esmer.visible = false; regla.visible = true; regla.position.y = 0.008;
        uMat.tPico.value = Math.max(20, 400 - 300 * u); uMat.casc.value = 0.9;
        for (const sx of [-1, 1]) tramo.rellenar(pkW + sx * 0.15, uRail, 0.3, 1 - dt * 0.6);
      }
    }
    // El carril al rojo alumbra el balasto
    const Tw = uMat.tPico.value;
    luzCarril.intensity = Tw > 450 ? Math.pow((Tw - 450) / 1000, 2) * 60 : 0;
    luzCarril.color.setHSL(0.03 + 0.08 * Math.min(1, Math.max(0, (Tw - 900) / 1100)), 1, 0.55);
    estado.temperatura = Math.round(Tw);
    // Luces del tajo (siempre de noche) y frontales
    for (const f of focos) f.luz.intensity = 22;
    luzLED.intensity = 50;
    if (crew) for (const o of [crew.ayudante, crew.capataz]) if (o.luz) o.luz.intensity = 6;

    moverCuadrilla(dt, fase, t);
    tramo.actualizarVia();
    tramo.actualizarBalasto();
    humoOsc.actualizar(dt); humoBlanco.actualizar(dt); polvo.actualizar(dt);
    actualizarChispas(dt);
    actualizarTrozos(dt, suelo);
    // Sonido
    if (sons) {
      sons.soplete.colocar(pRail).set({ nivel: sSop });
      sons.disco.colocar(pRail).set({ nivel: sDisco, tono: tonoDisco });
      sons.reaccion.colocar(pRail).set({ nivel: sReac });
      sons.hidraulico.colocar(grupoHid.getWorldPosition(_w)).set({ rpm: 1500 + 900 * sHid, carga: sHid });
      sons.generador.colocar(torreLED.getWorldPosition(_w)).set({ nivel: 1 });
    }
  }
  function entrarFase(f) {
    if (f === 'reaccion') audio.golpe(carrilG.getWorldPosition(_w), { tipo: 'chispa', nivel: 0.8 });
  }

  // ---- Cámaras ----
  function poseCamara(modo) {
    if (!sitio) return null;
    carrilG.updateMatrixWorld(true);
    const zF = -sitio.s;
    // A lo largo del carril y algo hacia dentro de la vía, donde no se pone nadie
    if (modo === 'crisol') return { pos: carrilG.localToWorld(new THREE.Vector3(1.9, 0.85, -0.45 * zF)), obj: carrilG.localToWorld(new THREE.Vector3(0, 0.05, 0)) };
    if (modo === 'carril') return { pos: carrilG.localToWorld(new THREE.Vector3(1.6, 0.18, 0.55 * zF)), obj: carrilG.localToWorld(new THREE.Vector3(-0.2, -0.05, 0)) };
    return { pos: carrilG.localToWorld(new THREE.Vector3(5.5, 3.6, 5.5 * zF)), obj: carrilG.localToWorld(new THREE.Vector3(0, 0.3, 1.2 * zF)) };
  }
  const cuadrilla = () => (crew ? [
    { nombre: 'Soldador principal', equipo: 'Buzo ignífugo, chaleco HV, pantalla facial tintada, guantes de serraje largos y polainas' },
    { nombre: 'Ayudante especialista', equipo: 'Uniforme HV, casco con frontal LED, gafas claras y orejeras' },
    { nombre: 'Capataz', equipo: 'Casco blanco, tablet, emisora al hombro y pirómetro óptico' },
  ] : []);

  return { grupo, estado, montar, desmontar, actualizar, poseCamara, cuadrilla, NOMBRE, get sitio() { return sitio; }, get fase() { return FASES_SOLD[iF]; } };
}
