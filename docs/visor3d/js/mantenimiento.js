// Trabajos de mantenimiento nocturnos (banda de mantenimiento con la vía cortada al tráfico)
//
// Tren de trabajo de nivelación en alta velocidad, en su orden real de avance, sobre un mismo tramo de vía dinámico
// (js/tramo-via.js) que cada máquina transforma:
//   1. Bateadora (js/bateadora.js): levanta y alinea la vía a su geometría de proyecto y batea traviesa a traviesa.
//   2. Perfiladora (js/perfiladora.js): perfila la banqueta en trapecio y barre traviesas y sujeciones.
//   3. Estabilizador (js/estabilizador.js): vibra la vía y la asienta unos milímetros de forma controlada.
// Alrededor: torres de iluminación, piquetes con luz roja en los extremos y operarios con chaleco.

import * as THREE from 'three';
import { crearTramoVia, ESPACIADO } from './tramo-via.js';
import { crearBateadora, NOMBRE_FASE, VEL_MEDIA_BATEO } from './bateadora.js';
import { crearPerfiladora, FASES_PERF } from './perfiladora.js';
import { crearEstabilizador } from './estabilizador.js';

export const MAQUINAS = {
  bateadora: {
    nombre: 'Bateadora-niveladora-alineadora', tipo: 'Tipo Plasser & Theurer 09-3X',
    funcion: 'Levanta y alinea la vía con las pinzas de rodillos y compacta el balasto bajo cada traviesa con los bates vibrantes. Avanza a saltos de una traviesa (0,6 m).',
    camaras: [['general', 'General'], ['bateo', 'Bateo'], ['geometria', 'Geometría']],
  },
  perfiladora: {
    nombre: 'Perfiladora-regularizadora de balasto', tipo: 'Tipo Plasser & Theurer SSP 110',
    funcion: 'El arado central en V reparte la piedra, las alas cortan el talud 1:1,5 y el cepillo de mangueras de poliuretano barre traviesas y sujeciones; la sobrante sube por la cinta a la tolva.',
    camaras: [['perf-general', 'General'], ['arado', 'Arado lateral'], ['cepillo', 'Cepillo']],
  },
  estabilizador: {
    nombre: 'Estabilizador dinámico de vía', tipo: 'Tipo Plasser & Theurer DGS',
    funcion: 'Agarra los carriles, carga la vía hacia abajo y la vibra en horizontal (~35 Hz, ±1,5 mm): el balasto se reacomoda y la vía asienta unos 4 mm.',
    camaras: [['est-general', 'General'], ['rodillos', 'Rodillos'], ['laser', 'Láser']],
  },
};
export { NOMBRE_FASE, FASES_PERF };
// Distancia entre el grupo de bateo y el centro de cada máquina (m)
const SEPARACION = { perfiladora: 4.4 + 42, estabilizador: 4.4 + 80 };
const ATRAS = 112, DELANTE = 56;

export function crearMantenimiento({ escena, Eje3D, W, mat, matsVia, GEO, audioActivo }) {
  const grupo = new THREE.Group();
  grupo.name = 'Trabajos de mantenimiento';
  grupo.visible = false;
  escena.add(grupo);

  const M = {
    amarillo: mat('#f6a800', 1, { roughness: 0.6, metalness: 0.15 }),
    gris: mat('#4b5563', 1, { roughness: 0.6, metalness: 0.4 }),
    oscuro: mat('#1f2429', 1, { roughness: 0.7, metalness: 0.35 }),
    rojoFranja: mat('#c81e1e', 1, { roughness: 0.5, metalness: 0.2 }),
    chaleco: mat('#ff7a00', 1, { roughness: 0.6 }),
    pantalon: mat('#1e2a3a', 1, { roughness: 0.8 }),
    casco: mat('#f5f5f0', 1, { roughness: 0.4 }),
    piel: mat('#c99a78', 1, { roughness: 0.8 }),
    rojo: new THREE.MeshBasicMaterial({ color: '#ff2a2a' }),
    foco: new THREE.MeshBasicMaterial({ color: '#fffbe8' }),
    reflectante: new THREE.MeshBasicMaterial({ color: '#e8f0c8' }),
  };
  const caja = (sx, sy, sz, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); me.castShadow = true; return me; };
  const cil = (r, h, m, x = 0, y = 0, z = 0, eje = 'z') => {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), m);
    me.position.set(x, y, z);
    if (eje === 'z') me.rotation.x = Math.PI / 2; else if (eje === 'x') me.rotation.z = Math.PI / 2;
    return me;
  };
  function operario() {
    const o = new THREE.Group();
    for (const z of [-0.11, 0.11]) o.add(caja(0.16, 0.85, 0.16, M.pantalon, 0, 0.43, z));
    o.add(caja(0.3, 0.62, 0.46, M.chaleco, 0, 1.17, 0));
    o.add(caja(0.31, 0.06, 0.47, M.reflectante, 0, 1.05, 0), caja(0.31, 0.06, 0.47, M.reflectante, 0, 1.3, 0));
    o.add(caja(0.2, 0.22, 0.2, M.piel, 0, 1.6, 0));
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.casco);
    c.position.y = 1.68;
    o.add(c, caja(0.04, 0.05, 0.08, M.foco, 0.13, 1.72, 0));
    return o;
  }
  function torreLuz() {
    const t = new THREE.Group();
    t.add(caja(2.2, 0.9, 1.3, M.amarillo, 0, 0.75, 0));
    for (const z of [-0.55, 0.55]) t.add(cil(0.2, 0.18, M.oscuro, 0, 0.25, z));
    t.add(cil(0.07, 7.5, M.gris, 0, 4.5, 0, 'y'));
    const panel = new THREE.Group();
    for (let i = 0; i < 4; i++) panel.add(caja(0.12, 0.42, 0.42, M.foco, 0.1, (i % 2) * 0.46, (i < 2 ? -0.24 : 0.24)));
    panel.add(caja(0.08, 1.0, 1.1, M.oscuro, -0.02, 0.23, 0));
    panel.position.y = 8.0;
    t.add(panel);
    return t;
  }
  function piquete() {
    const p = new THREE.Group();
    p.add(cil(0.04, 1.4, M.gris, 0, 0.7, 0, 'y'));
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 20), M.rojoFranja);
    disco.rotation.z = Math.PI / 2; disco.position.y = 1.55;
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), M.rojo);
    luz.position.set(0, 1.95, 0);
    p.add(disco, luz);
    p.userData.luz = luz;
    return p;
  }

  // ---- Tramo y máquinas (se crean una vez) ----
  let tajo = null, tramo = null, bat = null, perf = null, est = null;
  const estado = { activo: false };
  const aLocal = (p) => W(p.E, p.N, p.Z).sub(W(tajo.ancla.E, tajo.ancla.N, tajo.ancla.Z));
  function crearSistema() {
    tramo = crearTramoVia({ Eje3D, aLocal: (p) => aLocal(p), mundo: (p) => W(p.E, p.N, p.Z), mats: matsVia, GEO, atras: ATRAS, delante: DELANTE });
    bat = crearBateadora({ tramo, audioActivo });
    perf = crearPerfiladora({ tramo });
    est = crearEstabilizador({ tramo });
    // Lo que hace cada máquina sobre la vía
    tramo.prov.desviacion = [bat.desviacion, est.desviacion];
    tramo.prov.balasto = (pk, u, base) => perf.balasto(pk, u, base) + est.compactacion(pk);
    tramo.prov.suciedad = perf.suciedad;
  }

  function enVia(pk, s, d = 0) {
    const m = Eje3D.enPk(pk), off = s * m.sep * 0.5 + d;
    return { E: m.E - m.ty * off, N: m.N + m.tx * off, Z: m.Z + 0.022, m };
  }

  /** Monta el tajo en la vía s (+1 izquierda, −1 derecha): el grupo de bateo empieza en pkIni + 120. */
  function montar({ pkIni, s = -1, largo = 1500 }) {
    desmontar();
    if (!tramo) crearSistema();
    const pkT = pkIni + 120;
    const m0 = Eje3D.enPk(pkT);
    tajo = { pkIni, s, largo, ancla: { E: m0.E, N: m0.N, Z: m0.Z }, torres: [], piquetes: [], operarios: [], luces: [], t: 0 };
    grupo.position.copy(W(tajo.ancla.E, tajo.ancla.N, tajo.ancla.Z));
    tramo.montar(s, Math.round((pkT - ATRAS) / ESPACIADO));
    bat.montar(pkT);
    perf.montar(pkT - SEPARACION.perfiladora);
    est.montar(pkT - SEPARACION.estabilizador);
    grupo.add(tramo.grupo, bat.raiz, bat.efectos, perf.raiz, perf.efectos, est.raiz, est.efectos);
    tramo.marcarTodo();
    // Torres de iluminación del lado exterior y piquetes con luz roja en los extremos
    for (let k = 0; k < 4; k++) {
      const pk = pkT - 100 + k * 45;
      const t = torreLuz();
      t.rotation.y = Math.atan2(m0.ty, m0.tx) + (s > 0 ? -Math.PI / 2 : Math.PI / 2);
      grupo.add(t);
      const luz = new THREE.PointLight('#fff1d0', 0, 60, 1.6);
      grupo.add(luz);
      tajo.torres.push({ obj: t, pk });
      tajo.luces.push(luz);
    }
    for (const pk of [pkT - 140, pkT + 90]) for (const d of [-1.9, 1.9]) {
      const pq = piquete();
      pq.position.copy(aLocal(enVia(pk, s, d)));
      grupo.add(pq);
      tajo.piquetes.push(pq);
    }
    for (let k = 0; k < 7; k++) {
      const o = operario();
      // En la entrevía y en el paseo, sin acercarse a los grupos de trabajo por el lado exterior (cámaras de detalle)
      o.userData.sig = { dPk: 18 - k * 15 + Math.random() * 4, d: s * (k % 2 ? 2.75 : -2.7), fase: Math.random() * 6 };
      if (o.userData.sig.d * s > 0 && Math.abs(o.userData.sig.dPk) < 10) o.userData.sig.d = -o.userData.sig.d;
      grupo.add(o);
      tajo.operarios.push(o);
    }
    grupo.visible = true;
    estado.activo = true;
    actualizar(0);
    return tajo;
  }

  function desmontar() {
    if (tramo) { tramo.desmontar(); bat.desmontar(); perf.desmontar(); est.desmontar(); }
    for (const c of [...grupo.children]) {
      grupo.remove(c);
      if (![tramo?.grupo, bat?.raiz, bat?.efectos, perf?.raiz, perf?.efectos, est?.raiz, est?.efectos].includes(c)) c.traverse?.((n) => { if (n.isMesh) n.geometry?.dispose?.(); });
    }
    tajo = null;
    grupo.visible = false;
    estado.activo = false;
  }

  const _w = new THREE.Vector3();
  function actualizar(dt, { distCam = 60, noche = true } = {}) {
    if (!tajo) return;
    tajo.t += dt;
    grupo.position.copy(W(tajo.ancla.E, tajo.ancla.N, tajo.ancla.Z));
    tramo.refrescarCorte();
    const pkT = bat.pkCabeza;
    // El tramo dinámico acompaña al tren de trabajo
    if (pkT - tramo.pkIni > ATRAS + 24) { tramo.reanclar(Math.round((pkT - ATRAS) / ESPACIADO)); tramo.marcarTodo(); }
    const yCarril = tramo.punto(pkT).add(grupo.position).y;
    bat.actualizar(dt, { distCam, noche, yCarril });
    perf.actualizar(dt, { pkObjetivo: pkT - SEPARACION.perfiladora, noche, yCarril });
    est.actualizar(dt, { pkObjetivo: pkT - SEPARACION.estabilizador, noche, yCarril });
    tramo.actualizarVia();
    tramo.actualizarBalasto();

    const t = tajo.t, s = tajo.s;
    for (const o of tajo.operarios) {
      const g = o.userData.sig;
      const pk = pkT + g.dPk + Math.sin(t * 0.25 + g.fase) * 2.5;
      const p = enVia(pk, s, g.d);
      o.position.copy(aLocal(p));
      o.rotation.y = Math.atan2(p.m.ty, p.m.tx) + (Math.cos(t * 0.25 + g.fase) > 0 ? 0 : Math.PI);
    }
    for (const pq of tajo.piquetes) pq.userData.luz.visible = Math.sin(t * 5) > -0.2;
    tajo.torres.forEach((tr, i) => {
      if (pkT - tr.pk > 110) tr.pk += 180;
      const p = enVia(tr.pk, s, s * 5.6);
      p.Z = Eje3D.enPk(tr.pk).Z - 0.3;
      tr.obj.position.copy(aLocal(p));
      tajo.luces[i].position.copy(tr.obj.position).add(_w.set(0, 8.2, 0));
      tajo.luces[i].intensity = noche ? 120 : 0;
    });
  }
  // Compatibilidad con el visor (las luces se gobiernan dentro de actualizar)
  function encendidoLuces() {}

  const maq = (clave) => (clave === 'perfiladora' ? perf : clave === 'estabilizador' ? est : bat);
  /** Punto (UTM aprox.) de una máquina para encuadrar: se devuelve el PK y la vía. */
  function posicion(clave) {
    if (!tajo) return null;
    const pk = clave === 'perfiladora' ? perf.pk : clave === 'estabilizador' ? est.pk : bat.pkCentro;
    const p = enVia(pk, tajo.s);
    return { ...p, pk, s: tajo.s, largo: maq(clave).LARGO };
  }
  /** Pose de cámara (coordenadas de escena) para un modo. */
  function poseCamara(modo) {
    if (!tajo) return null;
    const dueño = ['general', 'bateo', 'geometria'].includes(modo) ? bat : ['perf-general', 'arado', 'cepillo'].includes(modo) ? perf : est;
    const p = dueño.pose(modo);
    if (!p) return null;
    if (p.mundo) return { pos: p.pos, obj: p.obj };
    return { pos: p.pos.clone().add(grupo.position), obj: p.obj.clone().add(grupo.position) };
  }
  function setVista(modo) { bat?.setVista(modo); }
  /** Intensidad de la sacudida de cámara (0..1) por cercanía a las máquinas que vibran. */
  function sacudida(camPos, modo) {
    if (!tajo) return 0;
    let k = 0;
    if (bat.sacudida > 0 && (modo === 'bateo' || modo === 'general')) k = Math.max(k, bat.sacudida * (modo === 'bateo' ? 1 : 0.25));
    if (est.vibrando) {
      est.raiz.getWorldPosition(_w);
      const d = camPos.distanceTo(_w);
      k = Math.max(k, modo === 'rodillos' ? 1.2 : Math.max(0, 1 - d / 22) * 0.9);
    }
    return k;
  }
  const lista = () => (tajo ? [
    { clave: 'bateadora', ...MAQUINAS.bateadora, pk: bat.pkCentro, vel: VEL_MEDIA_BATEO, estado: NOMBRE_FASE[bat.estado.fase] },
    { clave: 'perfiladora', ...MAQUINAS.perfiladora, pk: perf.pk, vel: perf.estado.vel, estado: FASES_PERF[perf.estado.fase] },
    { clave: 'estabilizador', ...MAQUINAS.estabilizador, pk: est.pk, vel: est.estado.vel, estado: est.estado.fase === 'estabilizacion' ? `Estabilizando · asiento ${est.estado.asientoMm.toFixed(1).replace('.', ',')} mm` : est.estado.fase === 'carga' ? 'Carga vertical' : 'Agarre de los carriles' },
  ] : []);

  return {
    grupo, estado, montar, desmontar, actualizar, encendidoLuces, posicion, poseCamara, setVista, sacudida, lista,
    get tajo() { return tajo; }, get bateo() { return bat; }, get perfiladora() { return perf; }, get estabilizador() { return est; },
  };
}
