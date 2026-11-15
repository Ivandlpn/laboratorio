import * as THREE from 'three';

/*
 * Tráfico en las carreteras y caminos que cruzan la línea (SUPUESTO: la cartografía no dice el tipo de vía).
 * El tipo se deduce del ancho medido de cada paso:
 *   - paso superior de 17 m o más: autovía o carretera ancha  → coches, autobuses y camiones
 *   - paso superior de 10 a 17 m o paso inferior de 10 m o más: carretera → coches y algún camión
 *   - el resto: camino rural → tractores, bicicletas, personas andando y algún coche
 * Los vehículos recorren el tablero del paso superior (o el fondo del paso inferior), uno por carril y sentido,
 * y al llegar al final esperan un rato antes de volver a entrar. Solo hay tráfico en los pasos cercanos a la cámara.
 */

const RADIO_ACTIVO = 1400;     // m: pasos con tráfico alrededor de la cámara
const VEL = { coche: 13, autobus: 11, camion: 10, tractor: 5, bici: 4.5, peaton: 1.35 };

// ---- Modelos sencillos (adelante = +Z, suelo en y = 0) ----
const caja = (w, h, l) => new THREE.BoxGeometry(w, h, l);
const GEO = {
  rueda: new THREE.CylinderGeometry(0.33, 0.33, 0.24, 14).rotateZ(Math.PI / 2),
  ruedaGrande: new THREE.CylinderGeometry(0.75, 0.75, 0.42, 16).rotateZ(Math.PI / 2),
  ruedaBici: new THREE.TorusGeometry(0.33, 0.035, 6, 18).rotateY(Math.PI / 2),
  cabeza: new THREE.SphereGeometry(0.12, 10, 8),
  tronco: new THREE.CylinderGeometry(0.17, 0.15, 0.62, 8),
  pierna: new THREE.CylinderGeometry(0.065, 0.06, 0.82, 6),
};
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.15, ...o });
const MAT = {
  rueda: M('#1b1d21', { roughness: 0.9 }),
  cristal: M('#1d2a38', { roughness: 0.15, metalness: 0.6 }),
  faro: M('#fff6d8', { emissive: '#fff1c0', emissiveIntensity: 0.6 }),
  piloto: M('#c81e1e', { emissive: '#a01010', emissiveIntensity: 0.4 }),
  piel: M('#c99b7a', { roughness: 0.8 }),
  pantalon: M('#2d3a52', { roughness: 0.85 }),
  acero: M('#9aa3ad', { metalness: 0.7, roughness: 0.35 }),
  tractor: M('#2f7d32'), tractorCab: M('#e8e8e2'),
  bus: M('#f2f4f6'), busFranja: M('#1d6fd1'),
  camionCaja: M('#dfe3e8'), camionCab: M('#c0392b'),
};
const COLORES_COCHE = ['#e9ecef', '#1f2933', '#9aa5b1', '#b91c1c', '#1e40af', '#3f3f46', '#f8fafc', '#0f766e', '#6b7280', '#7c2d12'];
const COLORES_ROPA = ['#dc2626', '#2563eb', '#f59e0b', '#16a34a', '#7c3aed', '#f8fafc', '#0f172a', '#ea580c'];
const matsColor = new Map();
const matColor = (c) => { if (!matsColor.has(c)) matsColor.set(c, M(c, { metalness: 0.35, roughness: 0.35 })); return matsColor.get(c); };

function add(g, geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
function ruedas(g, geo, ancho, ejes, y) { for (const z of ejes) for (const s of [-1, 1]) add(g, geo, MAT.rueda, s * ancho / 2, y, z); }

function modeloCoche(rnd) {
  const g = new THREE.Group(), mc = matColor(COLORES_COCHE[Math.floor(rnd() * COLORES_COCHE.length)]);
  add(g, caja(1.78, 0.62, 4.3), mc, 0, 0.6, 0);
  add(g, caja(1.6, 0.52, 2.2), mc, 0, 1.17, -0.25);
  add(g, caja(1.62, 0.4, 2.0), MAT.cristal, 0, 1.15, -0.25);
  for (const s of [-1, 1]) { add(g, caja(0.3, 0.12, 0.05), MAT.faro, s * 0.6, 0.72, 2.16); add(g, caja(0.3, 0.12, 0.05), MAT.piloto, s * 0.62, 0.75, -2.16); }
  ruedas(g, GEO.rueda, 1.66, [1.35, -1.3], 0.33);
  return g;
}
function modeloAutobus() {
  const g = new THREE.Group();
  add(g, caja(2.5, 2.9, 12), MAT.bus, 0, 1.85, 0);
  add(g, caja(2.54, 0.95, 10.4), MAT.cristal, 0, 2.35, -0.4);
  add(g, caja(2.54, 1.2, 0.08), MAT.cristal, 0, 2.35, 6.0);
  add(g, caja(2.54, 0.22, 12.02), MAT.busFranja, 0, 1.5, 0);
  for (const s of [-1, 1]) add(g, caja(0.35, 0.14, 0.05), MAT.faro, s * 0.85, 0.85, 6.02);
  ruedas(g, GEO.rueda.clone().scale(1, 1.55, 1.55), 2.3, [3.9, -3.4], 0.5);
  return g;
}
function modeloCamion(rnd) {
  const g = new THREE.Group();
  const cab = rnd() < 0.5 ? MAT.camionCab : matColor(['#1e3a8a', '#f8fafc', '#166534'][Math.floor(rnd() * 3)]);
  add(g, caja(2.45, 2.5, 2.3), cab, 0, 1.75, 6.0);
  add(g, caja(2.47, 0.9, 0.06), MAT.cristal, 0, 2.35, 7.16);
  add(g, caja(2.5, 2.9, 9.8), MAT.camionCaja, 0, 2.15, -0.3);
  add(g, caja(2.2, 0.35, 15), MAT.acero, 0, 0.75, 0.6);
  ruedas(g, GEO.rueda.clone().scale(1, 1.6, 1.6), 2.2, [6.2, -1.8, -3.0, -4.2], 0.52);
  return g;
}
function modeloTractor() {
  const g = new THREE.Group();
  add(g, caja(1.2, 0.95, 2.4), MAT.tractor, 0, 1.15, 0.7);
  add(g, caja(1.35, 1.45, 1.4), MAT.tractorCab, 0, 2.1, -0.55);
  add(g, caja(1.36, 1.0, 1.3), MAT.cristal, 0, 2.2, -0.55);
  add(g, caja(1.5, 0.12, 1.6), MAT.tractor, 0, 2.86, -0.55);
  for (const s of [-1, 1]) {
    add(g, GEO.ruedaGrande, MAT.rueda, s * 0.95, 0.75, -0.75);
    add(g, GEO.rueda.clone().scale(1.4, 1.4, 1.4), MAT.rueda, s * 0.82, 0.46, 1.5);
  }
  return g;
}
function persona(g, rnd, sentado) {
  const ropa = matColor(COLORES_ROPA[Math.floor(rnd() * COLORES_ROPA.length)]);
  const y0 = sentado ? 0.55 : 0;
  const piernas = [];
  for (const s of [-1, 1]) {
    piernas.push(add(g, GEO.pierna, MAT.pantalon, s * 0.09, y0 + 0.41, 0));
  }
  add(g, GEO.tronco, ropa, 0, y0 + 1.13, sentado ? -0.12 : 0).rotation.x = sentado ? 0.35 : 0;
  add(g, GEO.cabeza, MAT.piel, 0, y0 + 1.58, sentado ? 0.02 : 0);
  return piernas;
}
function modeloPeaton(rnd) { const g = new THREE.Group(); g.userData.piernas = persona(g, rnd, false); return g; }
function modeloBici(rnd) {
  const g = new THREE.Group();
  for (const z of [0.55, -0.55]) add(g, GEO.ruedaBici, MAT.rueda, 0, 0.36, z);
  add(g, caja(0.05, 0.05, 1.05), MAT.acero, 0, 0.62, 0).rotation.x = 0.1;
  add(g, caja(0.05, 0.5, 0.05), MAT.acero, 0, 0.6, -0.2);
  add(g, caja(0.5, 0.04, 0.04), MAT.acero, 0, 1.0, 0.5);
  persona(g, rnd, true);
  return g;
}

const CREAR = { coche: modeloCoche, autobus: modeloAutobus, camion: modeloCamion, tractor: modeloTractor, bici: modeloBici, peaton: modeloPeaton };
const NOMBRE = { coche: 'Turismo', autobus: 'Autobús', camion: 'Camión', tractor: 'Tractor', bici: 'Ciclista', peaton: 'Persona andando' };
const TIPO_VIA = { autovia: 'autovía o carretera ancha', carretera: 'carretera', camino: 'camino rural' };

export function crearTrafico({ escena, W, cotaTerrenoUTM, PASOS_SUP, PASOS_INF }) {
  const grupo = new THREE.Group();
  grupo.name = 'Tráfico';
  escena.add(grupo);

  // Rutas: polilínea en UTM [E, N, Z] por cada paso, con su tipo de vía
  const rutas = [];
  for (const ps of PASOS_SUP) {
    const ancho = ps.ancho;
    const tipo = ancho >= 17 ? 'autovia' : ancho >= 10 ? 'carretera' : 'camino';
    rutas.push({ id: ps.id || `ps-${ps.pk}`, pk: ps.pk, tipo, ancho, sobre: true, eje: ps.p.map((q) => [q[0], q[1], q[2] - 0.12 + 0.07]) });
  }
  for (const pi of PASOS_INF) {
    const tipo = pi.ancho >= 10 ? 'carretera' : 'camino';
    const s0 = -(pi.finIzq || 8) - 6, s1 = (pi.finDer || 8) + 6, eje = [];
    for (let s = s0; s <= s1 + 0.01; s += 2) {
      const E = pi.E + pi.ax * s, N = pi.N + pi.ay * s;
      eje.push([E, N, cotaTerrenoUTM(E, N) + 0.04]);
    }
    rutas.push({ id: `pi-${pi.pk}`, pk: pi.pk, tipo, ancho: pi.ancho, sobre: false, bajo: pi.galibo < 2.6, eje });
  }
  for (const r of rutas) {
    r.acum = [0];
    for (let i = 1; i < r.eje.length; i++) r.acum.push(r.acum[i - 1] + Math.hypot(r.eje[i][0] - r.eje[i - 1][0], r.eje[i][1] - r.eje[i - 1][1]));
    r.largo = r.acum[r.acum.length - 1];
    r.centro = r.eje[r.eje.length >> 1];
  }

  let semilla = 4242;
  const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const elegir = (tipo, r) => {
    const u = rnd();
    if (r.bajo) return u < 0.5 ? 'peaton' : 'bici';
    if (tipo === 'autovia') return u < 0.6 ? 'coche' : u < 0.8 ? 'camion' : 'autobus';
    if (tipo === 'carretera') return u < 0.8 ? 'coche' : u < 0.92 ? 'camion' : 'autobus';
    return u < 0.3 ? 'tractor' : u < 0.55 ? 'bici' : u < 0.8 ? 'peaton' : 'coche';
  };

  function activar(r) {
    r.agentes = [];
    // Un carril por sentido; en autovía dos carriles por sentido
    const carriles = r.tipo === 'autovia' ? [-0.38, -0.14, 0.14, 0.38] : [-0.22, 0.22];
    for (const fr of carriles) {
      const clase = elegir(r.tipo, r);
      const obj = CREAR[clase](rnd);
      // Por la derecha: el carril de desplazamiento positivo recorre la polilínea en su sentido, el negativo al revés
      const sentido = fr > 0 ? 1 : -1;
      // Peatones y bicis por el borde de la calzada
      const lat = (clase === 'peaton' || clase === 'bici') ? Math.sign(fr) * Math.max(0.5, r.ancho / 2 - 0.9) : fr * r.ancho;
      obj.userData = {
        capa: 'Tráfico (supuesto)',
        nombre: `${NOMBRE[clase]} en ${TIPO_VIA[r.tipo]}`,
        info: `Paso ${r.sobre ? 'superior' : 'inferior'} del PK ${(r.pk / 1000).toFixed(3).replace('.', '+')}. Supuesto: el tipo de vía (${TIPO_VIA[r.tipo]}) se deduce del ancho medido del paso (${r.ancho.toFixed(1)} m) y el tráfico es ilustrativo.`,
        piernas: obj.userData.piernas,
      };
      obj.traverse((n) => { if (n.isMesh) n.userData = obj.userData; });
      grupo.add(obj);
      r.agentes.push({ obj, clase, lat, sentido, s: rnd() * r.largo, espera: rnd() * 6, vel: VEL[clase] * (0.85 + rnd() * 0.3), fase: rnd() * 6 });
    }
  }
  function desactivar(r) {
    for (const a of r.agentes) grupo.remove(a.obj);
    r.agentes = null;
  }

  // Punto de la ruta a la distancia s, desplazado `lat` metros a la derecha del sentido de la polilínea
  function enRuta(r, s, lat) {
    let i = 1;
    while (i < r.acum.length - 1 && r.acum[i] < s) i++;
    const a = r.eje[i - 1], b = r.eje[i], l = (r.acum[i] - r.acum[i - 1]) || 1, u = Math.min(1, Math.max(0, (s - r.acum[i - 1]) / l));
    const dx = (b[0] - a[0]) / l, dy = (b[1] - a[1]) / l;
    return [a[0] + (b[0] - a[0]) * u + dy * lat, a[1] + (b[1] - a[1]) * u - dx * lat, a[2] + (b[2] - a[2]) * u];
  }

  const _p = new THREE.Vector3(), _q = new THREE.Vector3();
  let tAcum = 0, tRevision = 0;
  const UTM = { E: 0, N: 0 };

  function actualizar(dt, utmCamara) {
    tAcum += dt;
    if (utmCamara) { UTM.E = utmCamara.E; UTM.N = utmCamara.N; }
    // Encender o apagar los pasos según la distancia a la cámara (cada medio segundo)
    if (tAcum - tRevision > 0.5) {
      tRevision = tAcum;
      for (const r of rutas) {
        const cerca = Math.hypot(r.centro[0] - UTM.E, r.centro[1] - UTM.N) < RADIO_ACTIVO;
        if (cerca && !r.agentes) activar(r);
        else if (!cerca && r.agentes) desactivar(r);
      }
    }
    for (const r of rutas) {
      if (!r.agentes) continue;
      for (const a of r.agentes) {
        if (a.espera > 0) { a.espera -= dt; a.obj.visible = false; continue; }
        a.s += a.vel * dt;
        if (a.s > r.largo) { a.s = 0; a.espera = 2 + rnd() * 9; a.obj.visible = false; continue; }
        a.obj.visible = true;
        const sR = a.sentido > 0 ? a.s : r.largo - a.s;
        const p = enRuta(r, sR, a.lat);
        const pAd = enRuta(r, Math.min(r.largo, Math.max(0, sR + a.sentido * 1.5)), a.lat);
        _p.copy(W(p[0], p[1], p[2]));
        _q.copy(W(pAd[0], pAd[1], pAd[2]));
        a.obj.position.copy(_p);
        if (_q.distanceToSquared(_p) > 1e-4) a.obj.lookAt(_q.x, _p.y + (_q.y - _p.y), _q.z);
        // Paso al andar
        const pi = a.obj.userData.piernas;
        if (pi) { const ang = Math.sin((tAcum + a.fase) * 6.5) * 0.45; pi[0].rotation.x = ang; pi[1].rotation.x = -ang; }
      }
    }
  }

  return { grupo, actualizar, rutas };
}
