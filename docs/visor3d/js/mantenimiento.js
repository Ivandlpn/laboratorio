// Trabajos de mantenimiento nocturnos (banda de mantenimiento con la vía cortada al tráfico)
//
// Tajo de renovación / nivelación de vía con el tren de trabajo típico en alta velocidad: bateadora-niveladora-
// alineadora, perfiladora-regularizadora de balasto y estabilizador dinámico, en ese orden y en sentido de avance.
// Alrededor: torres de iluminación, piquetes de protección con luz roja en los extremos y operarios con chaleco.
//
// MODELOS PROVISIONALES: cada máquina se construye con su función de MAQUINAS (dimensiones y colores tipo). Están
// pensadas para sustituirse por modelos detallados (glTF en comun/modelos/ o geometría propia) sin tocar el resto:
// basta con cambiar `construir` y mantener el origen en el centro de la máquina sobre la cabeza de carril, eje X a lo
// largo de la vía (hacia delante) y eje Z transversal.

import * as THREE from 'three';

const AMARILLO = '#f2b705';

// Catálogo de máquinas. vel: avance medio (m/s). ciclo: 'bateo' (avance a saltos de una traviesa y bateo), 'continuo'.
export const MAQUINAS = {
  bateadora: {
    nombre: 'Bateadora-niveladora-alineadora',
    tipo: 'Bateadora de vía continua (tipo Plasser & Theurer 09-3X)',
    funcion: 'Levanta y alinea la vía y compacta el balasto bajo cada traviesa con los bates vibrantes (bateo). Avanza a saltos de una traviesa (0,6 m).',
    largo: 27.5, vel: 0.28, ciclo: 'bateo', color: AMARILLO,
  },
  perfiladora: {
    nombre: 'Perfiladora-regularizadora de balasto',
    tipo: 'Perfiladora de balasto (tipo Plasser USP)',
    funcion: 'Reparte el balasto con el arado central y las alas laterales, da forma a los hombros de la banqueta y barre las traviesas con el cepillo.',
    largo: 16.5, vel: 0.28, ciclo: 'continuo', color: AMARILLO,
  },
  estabilizador: {
    nombre: 'Estabilizador dinámico de vía',
    tipo: 'Estabilizador dinámico (tipo Plasser DGS)',
    funcion: 'Hace vibrar la vía en horizontal con carga vertical para asentar el balasto y recuperar enseguida la resistencia lateral tras el bateo.',
    largo: 17.5, vel: 0.28, ciclo: 'continuo', color: AMARILLO,
  },
};

/**
 * @param {object} o
 * @param {THREE.Scene} o.escena
 * @param {object} o.Eje3D
 * @param {Function} o.W  (E, N, Z) → Vector3 en la escena
 * @param {Function} o.mat (color, opacidad, opciones) → material
 */
export function crearMantenimiento({ escena, Eje3D, W, mat }) {
  const grupo = new THREE.Group();
  grupo.name = 'Trabajos de mantenimiento';
  grupo.visible = false;
  escena.add(grupo);

  // ---- Materiales compartidos ----
  const M = {
    amarillo: mat(AMARILLO, 1, { roughness: 0.55, metalness: 0.2 }),
    gris: mat('#4b5563', 1, { roughness: 0.6, metalness: 0.4 }),
    oscuro: mat('#1f2429', 1, { roughness: 0.7, metalness: 0.35 }),
    acero: mat('#9aa3ad', 1, { roughness: 0.35, metalness: 0.8 }),
    azul: mat('#2f5d8a', 1, { roughness: 0.5, metalness: 0.3 }),
    rojoFranja: mat('#c81e1e', 1, { roughness: 0.5, metalness: 0.2 }),
    cristal: mat('#0f1b2b', 1, { roughness: 0.1, metalness: 0.6 }),
    chaleco: mat('#ff7a00', 1, { roughness: 0.6 }),
    pantalon: mat('#1e2a3a', 1, { roughness: 0.8 }),
    casco: mat('#f5f5f0', 1, { roughness: 0.4 }),
    piel: mat('#c99a78', 1, { roughness: 0.8 }),
    faro: new THREE.MeshBasicMaterial({ color: '#fff6dc' }),
    destello: new THREE.MeshBasicMaterial({ color: '#ffa31a' }),
    destelloApagado: mat('#7a4a10', 1, { roughness: 0.5 }),
    rojo: new THREE.MeshBasicMaterial({ color: '#ff2a2a' }),
    foco: new THREE.MeshBasicMaterial({ color: '#fffbe8' }),
    reflectante: new THREE.MeshBasicMaterial({ color: '#e8f0c8' }),
  };
  const caja = (sx, sy, sz, m, x = 0, y = 0, z = 0) => {
    const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
    me.position.set(x, y, z);
    me.castShadow = true;
    return me;
  };
  const cil = (r, h, m, x = 0, y = 0, z = 0, eje = 'z') => {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), m);
    me.position.set(x, y, z);
    if (eje === 'z') me.rotation.x = Math.PI / 2;
    else if (eje === 'x') me.rotation.z = Math.PI / 2;
    return me;
  };

  // ---- Piezas comunes de las máquinas ----
  function bogie(x) {
    const b = new THREE.Group();
    b.add(caja(2.6, 0.35, 2.2, M.oscuro, 0, 0.62, 0));
    for (const dx of [-0.9, 0.9]) for (const z of [-0.7175, 0.7175]) b.add(cil(0.42, 0.14, M.acero, dx, 0.42, z));
    b.position.x = x;
    return b;
  }
  function cabina(x, sentido, ancho = 2.9) {
    const c = new THREE.Group();
    c.add(caja(2.6, 2.3, ancho, M.amarillo, 0, 2.45, 0));
    c.add(caja(0.06, 0.95, ancho - 0.4, M.cristal, sentido * 1.31, 2.85, 0));       // parabrisas
    for (const z of [-1, 1]) c.add(caja(1.6, 0.8, 0.05, M.cristal, 0, 2.85, z * (ancho / 2 + 0.01)));
    c.add(caja(2.7, 0.12, ancho + 0.1, M.gris, 0, 3.66, 0));                         // techo
    // Faros (blancos delante) y destellos naranjas sobre la cabina
    for (const z of [-0.95, 0.95]) c.add(caja(0.05, 0.22, 0.32, M.faro, sentido * 1.32, 1.75, z));
    const dest = [];
    for (const z of [-1.0, 1.0]) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.26, 12), M.destello);
      d.position.set(0, 3.86, z);
      c.add(d);
      dest.push(d);
    }
    c.position.x = x;
    c.userData.destellos = dest;
    return c;
  }
  function chasis(largo, alto = 1.25) {
    const g = new THREE.Group();
    g.add(caja(largo, 0.45, 2.7, M.amarillo, 0, alto, 0));
    g.add(caja(largo, 0.12, 2.72, M.rojoFranja, 0, alto - 0.12, 0));                // franja roja de gálibo
    return g;
  }

  // ---- Constructores (provisionales) ----
  const CONSTRUIR = {
    bateadora(def) {
      const g = new THREE.Group(), L = def.largo;
      g.add(chasis(L));
      g.add(bogie(-L / 2 + 2.4), bogie(L / 2 - 2.4), bogie(-1.5));
      const cA = cabina(L / 2 - 1.4, 1), cB = cabina(-L / 2 + 1.4, -1);
      g.add(cA, cB);
      // Carrocería de motores y equipos
      g.add(caja(L - 9.5, 1.9, 2.75, M.amarillo, -1.2, 2.45, 0));
      g.add(caja(L - 9.8, 0.1, 2.8, M.gris, -1.2, 3.45, 0));
      for (let x = -L / 2 + 6; x < L / 2 - 7; x += 2.2) g.add(caja(0.9, 1.1, 0.04, M.oscuro, x, 2.4, 1.39), caja(0.9, 1.1, 0.04, M.oscuro, x, 2.4, -1.39));
      // Grupo de bateo (dos unidades, una por carril) que sube y baja
      const bateo = new THREE.Group();
      for (const z of [-0.72, 0.72]) {
        bateo.add(caja(1.3, 1.1, 0.7, M.azul, 0, 1.3, z));
        for (const dx of [-0.45, -0.15, 0.15, 0.45]) for (const dz of [-0.26, 0.26]) bateo.add(caja(0.07, 0.9, 0.07, M.acero, dx, 0.45, z + dz));
      }
      bateo.position.set(L / 2 - 5.2, 0, 0);
      g.add(bateo);
      // Unidad de levante y alineación (rodillos sobre el carril)
      const levante = new THREE.Group();
      for (const z of [-0.7175, 0.7175]) levante.add(cil(0.18, 0.18, M.oscuro, 0, 0.32, z), caja(0.5, 0.7, 0.22, M.gris, 0, 0.85, z));
      levante.position.x = L / 2 - 7.3;
      g.add(levante);
      // Cuerda de nivelación (carros palpadores delante y detrás)
      g.add(caja(0.6, 0.3, 2.0, M.gris, L / 2 + 0.6, 0.5, 0), caja(0.6, 0.3, 2.0, M.gris, -L / 2 - 0.6, 0.5, 0));
      g.userData.anim = { bateo, destellos: [...cA.userData.destellos, ...cB.userData.destellos] };
      return g;
    },
    perfiladora(def) {
      const g = new THREE.Group(), L = def.largo;
      g.add(chasis(L));
      g.add(bogie(-L / 2 + 2.6), bogie(L / 2 - 2.6));
      const cA = cabina(L / 2 - 1.5, 1), cB = cabina(-L / 2 + 4.0, -1);
      g.add(cA, cB);
      g.add(caja(4.4, 1.8, 2.7, M.amarillo, -0.2, 2.4, 0));                            // motor
      // Tolva de balasto sobre el chasis, detrás
      const tol = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.9, 1.5, 4, 1, true), M.amarillo);
      tol.rotation.y = Math.PI / 4;
      tol.position.set(-L / 2 + 1.4, 2.3, 0);
      tol.scale.set(0.9, 1, 1.3);
      g.add(tol);
      // Arado central (en V) y alas laterales desplegadas sobre los hombros de la banqueta
      const arado = new THREE.Group();
      for (const z of [-1, 1]) {
        const p = caja(1.8, 0.7, 0.06, M.gris, 0, 0.55, z * 0.45);
        p.rotation.y = z * 0.45;
        arado.add(p);
      }
      arado.position.x = 1.6;
      const alas = [];
      for (const z of [-1, 1]) {
        const ala = new THREE.Group();
        const placa = caja(2.4, 0.9, 0.08, M.gris, -0.9, 0, 0);
        ala.add(placa, caja(0.3, 1.6, 0.3, M.oscuro, 0, 0.7, 0));
        ala.position.set(1.0, 0.45, z * 1.55);
        ala.rotation.y = z * 0.55;
        alas.push(ala);
        g.add(ala);
      }
      g.add(arado);
      // Cepillo barredor (tambor que gira) en la cola
      const cepillo = new THREE.Group();
      const tambor = cil(0.45, 2.6, M.oscuro, 0, 0, 0, 'z');
      cepillo.add(tambor);
      for (let a = 0; a < 8; a++) {
        const cer = caja(0.06, 0.2, 2.5, M.amarillo, 0, 0, 0);
        cer.position.set(Math.cos(a * Math.PI / 4) * 0.5, Math.sin(a * Math.PI / 4) * 0.5, 0);
        cer.rotation.z = a * Math.PI / 4;
        cepillo.add(cer);
      }
      cepillo.position.set(-L / 2 + 0.4, 0.55, 0);
      g.add(cepillo, caja(1.4, 1.2, 2.9, M.amarillo, -L / 2 + 0.4, 1.3, 0));
      g.userData.anim = { cepillo, destellos: [...cA.userData.destellos, ...cB.userData.destellos] };
      return g;
    },
    estabilizador(def) {
      const g = new THREE.Group(), L = def.largo;
      g.add(chasis(L));
      g.add(bogie(-L / 2 + 2.4), bogie(L / 2 - 2.4));
      const cA = cabina(L / 2 - 1.4, 1), cB = cabina(-L / 2 + 1.4, -1);
      g.add(cA, cB);
      g.add(caja(L - 6.0, 1.9, 2.75, M.amarillo, 0, 2.45, 0));
      g.add(caja(L - 6.2, 0.1, 2.8, M.gris, 0, 3.45, 0));
      // Dos grupos estabilizadores (rodillos que pinzan el carril) entre bogies
      const vibr = new THREE.Group();
      for (const x of [-1.6, 1.6]) for (const z of [-0.7175, 0.7175]) vibr.add(caja(1.1, 0.8, 0.5, M.azul, x, 0.85, z), cil(0.22, 0.2, M.oscuro, x, 0.32, z));
      g.add(vibr);
      g.userData.anim = { vibr, destellos: [...cA.userData.destellos, ...cB.userData.destellos] };
      return g;
    },
  };

  function operario() {
    const o = new THREE.Group();
    for (const z of [-0.11, 0.11]) o.add(caja(0.16, 0.85, 0.16, M.pantalon, 0, 0.43, z));
    o.add(caja(0.3, 0.62, 0.46, M.chaleco, 0, 1.17, 0));
    o.add(caja(0.31, 0.06, 0.47, M.reflectante, 0, 1.05, 0), caja(0.31, 0.06, 0.47, M.reflectante, 0, 1.3, 0));
    o.add(caja(0.2, 0.22, 0.2, M.piel, 0, 1.6, 0));
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.casco);
    c.position.y = 1.68;
    o.add(c);
    // Linterna frontal
    o.add(caja(0.04, 0.05, 0.08, M.foco, 0.13, 1.72, 0));
    return o;
  }
  function torreLuz() {
    const t = new THREE.Group();
    t.add(caja(2.2, 0.9, 1.3, M.amarillo, 0, 0.75, 0));                              // grupo electrógeno
    for (const z of [-0.55, 0.55]) t.add(cil(0.2, 0.18, M.oscuro, 0, 0.25, z));
    t.add(cil(0.07, 7.5, M.gris, 0, 4.5, 0, 'y'));
    const panel = new THREE.Group();
    for (let i = 0; i < 4; i++) panel.add(caja(0.12, 0.42, 0.42, M.foco, 0.1, (i % 2) * 0.46, (i < 2 ? -0.24 : 0.24)));
    panel.add(caja(0.08, 1.0, 1.1, M.oscuro, -0.02, 0.23, 0));
    panel.position.y = 8.0;
    t.add(panel);
    t.userData.panel = panel;
    return t;
  }
  function piquete() {
    const p = new THREE.Group();
    p.add(cil(0.04, 1.4, M.gris, 0, 0.7, 0, 'y'));
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 20), M.rojoFranja);
    disco.rotation.z = Math.PI / 2;
    disco.position.y = 1.55;
    p.add(disco);
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), M.rojo);
    luz.position.set(0, 1.95, 0);
    p.add(luz);
    p.userData.luz = luz;
    return p;
  }

  // ---- Estado del tajo ----
  let tajo = null;
  const estado = { activo: false };

  function enVia(pk, s, d = 0) {
    const m = Eje3D.enPk(pk), off = s * m.sep * 0.5 + d;
    return { E: m.E - m.ty * off, N: m.N + m.tx * off, Z: m.Z + 0.022, m };
  }
  const aLocal = (p) => W(p.E, p.N, p.Z).sub(W(tajo.ancla.E, tajo.ancla.N, tajo.ancla.Z));
  const _f = new THREE.Vector3(), _t = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _m = new THREE.Matrix4();

  // Coloca una máquina con sus dos extremos sobre la vía (eje X hacia PK creciente)
  function colocar(obj, pk, s, largo) {
    const a = aLocal(enVia(pk + largo * 0.35, s)), b = aLocal(enVia(pk - largo * 0.35, s));
    _f.copy(a); _t.copy(b);
    obj.position.copy(_f).add(_t).multiplyScalar(0.5);
    _x.copy(_f).sub(_t).normalize();
    _z.crossVectors(_x, _up).normalize();
    _y.crossVectors(_z, _x).normalize();
    _m.makeBasis(_x, _y, _z);
    obj.quaternion.setFromRotationMatrix(_m);
  }

  /**
   * Monta el tajo en la vía s (+1 izquierda, −1 derecha) desde pkIni con longitud de trabajo «largo».
   */
  function montar({ pkIni, s = -1, largo = 1500 }) {
    desmontar();
    const pkMed = pkIni + 60;
    const m0 = Eje3D.enPk(pkMed);
    tajo = { pkIni, s, largo, ancla: { E: m0.E, N: m0.N, Z: m0.Z }, maquinas: [], torres: [], piquetes: [], operarios: [], t: 0 };
    // Tren de trabajo: bateadora delante, perfiladora y estabilizador detrás (en sentido de avance)
    const orden = [['bateadora', 120], ['perfiladora', 78], ['estabilizador', 40]];
    for (const [clave, pkRel] of orden) {
      const def = MAQUINAS[clave];
      const obj = CONSTRUIR[clave](def);
      const ficha = { capa: 'Trabajos de mantenimiento', nombre: def.nombre, info: `${def.tipo}. ${def.funcion} Modelo provisional.` };
      obj.traverse((n) => { if (n.isMesh) n.userData = ficha; });
      grupo.add(obj);
      tajo.maquinas.push({ clave, def, obj, pk: pkIni + pkRel, fase: Math.random() * 2 });
    }
    // Torres de iluminación junto a la vía cortada, del lado exterior, y piquetes con luz roja en los extremos
    const luces = [];
    for (let k = 0; k < 4; k++) {
      const pk = pkIni + 20 + k * 45;
      const t = torreLuz();
      const p = enVia(pk, s, s * 5.6);
      p.Z = Eje3D.enPk(pk).Z - 0.3;
      t.position.copy(aLocal(p));
      t.rotation.y = Math.atan2(m0.ty, m0.tx) + (s > 0 ? -Math.PI / 2 : Math.PI / 2);   // focos mirando a la vía
      grupo.add(t);
      tajo.torres.push({ obj: t, pk });
      const luz = new THREE.PointLight('#fff1d0', 0, 60, 1.6);
      luz.position.copy(t.position).add(new THREE.Vector3(0, 8.2, 0));
      grupo.add(luz);
      luces.push(luz);
    }
    for (const pk of [pkIni - 30, pkIni + 220]) {
      for (const d of [-1.9, 1.9]) {
        const pq = piquete();
        const p = enVia(pk, s, d);
        pq.position.copy(aLocal(p));
        grupo.add(pq);
        tajo.piquetes.push(pq);
      }
    }
    // Operarios con chaleco a pie de máquina, en la entrevía y el paseo (fuera del gálibo de la vía en trabajo)
    for (let k = 0; k < 7; k++) {
      const o = operario();
      o.userData.sig = { dPk: 132 - k * 15 + Math.random() * 4, d: s * (k % 2 ? 2.7 : -2.75), fase: Math.random() * 6 };
      grupo.add(o);
      tajo.operarios.push(o);
    }
    tajo.luces = luces;
    grupo.visible = true;
    estado.activo = true;
    actualizar(0);
    return tajo;
  }

  function desmontar() {
    for (const c of [...grupo.children]) {
      grupo.remove(c);
      c.traverse?.((n) => { if (n.isMesh) n.geometry?.dispose?.(); });
    }
    tajo = null;
    grupo.visible = false;
    estado.activo = false;
  }

  function actualizar(dt) {
    if (!tajo) return;
    tajo.t += dt;
    grupo.position.copy(W(tajo.ancla.E, tajo.ancla.N, tajo.ancla.Z));
    const t = tajo.t;
    for (const mq of tajo.maquinas) {
      const { def, obj } = mq, an = obj.userData.anim || {};
      if (def.ciclo === 'bateo') {
        // Ciclo de 2,15 s por traviesa: avanza 0,6 m en 0,8 s y batea (bajar, vibrar, subir) el resto
        const ciclo = 2.15, u = ((t + mq.fase) % ciclo) / ciclo;
        if (u < 0.37) mq.pk += (0.6 / (0.37 * ciclo)) * dt;
        if (an.bateo) {
          const b = u < 0.37 ? 0 : u < 0.55 ? (u - 0.37) / 0.18 : u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15;
          an.bateo.position.y = -0.42 * b + (b === 1 ? Math.sin(t * 90) * 0.012 : 0);
        }
      } else {
        mq.pk += def.vel * dt;
      }
      if (an.cepillo) an.cepillo.rotation.z -= dt * 9;
      if (an.vibr) an.vibr.position.z = Math.sin(t * 2 * Math.PI * 30) * 0.008;
      // Destellos naranjas giratorios (parpadeo alterno)
      if (an.destellos) an.destellos.forEach((d, i) => { d.material = Math.sin(t * 7 + i * 1.7) > 0.1 ? M.destello : M.destelloApagado; });
      // Tajo cíclico: al llegar al final vuelve a empezar (largo de trabajo de una noche)
      if (mq.pk > tajo.pkIni + tajo.largo) mq.pk -= tajo.largo;
      colocar(obj, mq.pk, tajo.s, def.largo);
    }
    // Los operarios acompañan al tren de trabajo con pequeños paseos
    const pkTren = tajo.maquinas[0].pk - 120;
    for (const o of tajo.operarios) {
      const g = o.userData.sig;
      const pk = pkTren + g.dPk + Math.sin(t * 0.25 + g.fase) * 2.5;
      const p = enVia(pk, tajo.s, g.d);
      o.position.copy(aLocal(p));
      o.rotation.y = Math.atan2(p.m.ty, p.m.tx) + (Math.cos(t * 0.25 + g.fase) > 0 ? 0 : Math.PI);
    }
    for (const pq of tajo.piquetes) pq.userData.luz.visible = Math.sin(t * 5) > -0.2;
    // Las torres siguen al tren de trabajo cuando se queda atrás
    for (const tr of tajo.torres) if (pkTren - tr.pk > 140) tr.pk += 180;
    tajo.torres.forEach((tr, i) => {
      const p = enVia(tr.pk, tajo.s, tajo.s * 5.6);
      p.Z = Eje3D.enPk(tr.pk).Z - 0.3;
      tr.obj.position.copy(aLocal(p));
      tajo.luces[i].position.copy(tr.obj.position).add(new THREE.Vector3(0, 8.2, 0));
    });
  }

  function encendidoLuces(noche) {
    if (!tajo) return;
    for (const l of tajo.luces) l.intensity = noche ? 120 : 0;
  }

  /** Punto (UTM) y PK de una máquina, para llevar la cámara. */
  function posicion(clave) {
    const mq = tajo?.maquinas.find((x) => x.clave === clave) || tajo?.maquinas[0];
    if (!mq) return null;
    const p = enVia(mq.pk, tajo.s);
    return { ...p, pk: mq.pk, s: tajo.s, largo: mq.def.largo };
  }
  const lista = () => (tajo ? tajo.maquinas.map((m) => ({ clave: m.clave, nombre: m.def.nombre, tipo: m.def.tipo, funcion: m.def.funcion, pk: m.pk, vel: m.def.vel })) : []);

  return { grupo, estado, montar, desmontar, actualizar, encendidoLuces, posicion, lista, get tajo() { return tajo; } };
}
