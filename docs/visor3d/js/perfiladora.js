// Perfiladora-regularizadora de balasto (tipo Plasser & Theurer SSP 110): avanza de forma continua y da a la banqueta
// su sección de proyecto
//
// Delante, el balasto está suelto y desordenado, cubriendo en parte traviesas y sujeciones. A su paso:
//   Arado_Central (en V, bajo el chasis): rebaja el centro hasta la cara de las traviesas y echa la piedra a los lados.
//   Arados_Laterales (alas): cortan el exterior y dejan el talud 1:1,5.
//   Unidad_Cepillo (detrás): barre las traviesas; la piedra sobrante sube por la Cinta_Transportadora a la Tolva.
// Detrás queda un trapecio perfecto con traviesas y sujeciones limpias. El balasto se recalcula donde están las
// herramientas («morphing» de la malla de alturas atado a su posición).
// Ejes locales: X adelante, Y arriba, Z a la derecha; origen en el eje de la vía a la cota de la cabeza de carril.

import * as THREE from 'three';
import { Z_TRAV, Z_CAJON, SEMI_BANQUETA, ruido, suave } from './tramo-via.js';
import { materialesMaquina, caja, cil, tubo, mangueras, focoHalogeno, pegatina, bogie, crearPolvo, crearPiedras, fijarCarril, vidaMaquina } from './pbr-maquinas.js';

const L = 17.2;
const X_ARADO = 1.6, X_ALAS = -1.0, X_CEPILLO = -L / 2 + 0.9;
export const FASES_PERF = { despliegue: 'Despliegue de arados y cepillo', regulacion: 'Perfilado y barrido continuo' };

export function crearPerfiladora({ tramo }) {
  // La más sucia: el tercio inferior cubierto de polvo de balasto gris blanquecino
  const M = materialesMaquina({ alturaSucio: 1.35, fuerza: 1.0, sucio: '#c9c4b8' });
  const raiz = new THREE.Group(); raiz.name = 'Root_Chassis';
  raiz.add(caja(L - 0.6, 0.45, 2.7, M.chasis, 0, 1.12, 0));
  for (const z of [-1.36, 1.36]) raiz.add(caja(L - 0.6, 0.55, 0.06, M.amarillo, 0, 1.15, z));
  // Capó del motor delante, cabina central con visión de 360° y equipo de climatización
  raiz.add(caja(4.2, 1.5, 2.5, M.amarillo, L / 2 - 2.6, 2.1, 0), caja(1.0, 0.9, 0.05, M.tramex, L / 2 - 1.4, 2.1, 1.26), caja(1.0, 0.9, 0.05, M.tramex, L / 2 - 1.4, 2.1, -1.26));
  const chim = cil(0.1, 0.8, M.oscuro, L / 2 - 3.2, 3.2, -0.6); raiz.add(chim);
  const cab = new THREE.Group();
  cab.add(caja(3.2, 2.2, 2.9, M.amarillo, 0, 2.45, 0), caja(3.3, 0.12, 3.0, M.amarilloOsc, 0, 3.61, 0), caja(1.4, 0.35, 0.9, new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.5 }), 0, 3.85, 0));
  for (const z of [-1, 1]) cab.add(caja(2.7, 1.0, 0.05, M.cristal, 0, 2.95, z * 1.46));
  for (const x of [-1, 1]) cab.add(caja(0.05, 1.0, 2.4, M.cristal, x * 1.61, 2.95, 0));
  cab.position.x = 0.2;
  raiz.add(cab);
  const dest = [];
  for (const z of [-0.8, 0.8]) { const d = cil(0.12, 0.24, M.destello, 0.2, 4.0, z); raiz.add(d); dest.push(d); }
  // Pasarelas de tramex y barandillas amarillas a ambos lados
  for (const z of [-1, 1]) {
    raiz.add(caja(L - 1.5, 0.05, 0.55, M.tramex, -0.4, 1.42, z * 1.62));
    for (let x = -L / 2 + 1.2; x <= L / 2 - 1.2; x += 1.6) raiz.add(cil(0.025, 1.0, M.amarillo, x, 1.95, z * 1.88));
    raiz.add(cil(0.025, L - 2.4, M.amarillo, 0, 2.45, z * 1.88, 'x'), cil(0.02, L - 2.4, M.amarillo, 0, 2.0, z * 1.88, 'x'));
  }
  // Bocinas y franjas de peligro en los testeros
  for (const x of [L / 2 - 0.4, -L / 2 + 0.4]) for (const z of [-1, 1]) raiz.add(caja(0.14, 1.1, 0.14, M.franjas, x, 1.55, z * 1.3));
  raiz.add(cil(0.03, 0.2, M.cromo, 1.0, 3.75, 1.1), new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.02, 0.4, 12, 1, true), M.cromo).translateX(1.25).translateY(3.82).translateZ(1.1).rotateZ(-Math.PI / 2));
  const bogies = new THREE.Group(); bogies.name = 'Bogies';
  bogies.add(bogie(M, L / 2 - 2.4), bogie(M, -L / 2 + 3.2));
  raiz.add(bogies);
  for (const x of [X_ARADO, X_ALAS, X_CEPILLO + 1.3]) for (const z of [-1.1, 1.1]) raiz.add(focoHalogeno(M, x, 1.3, z));
  const luz = new THREE.SpotLight('#fff4dc', 0, 14, 1.0, 0.5, 1.2);
  luz.position.set(X_ALAS, 1.3, 0); luz.target.position.set(X_ALAS, -0.3, 0);
  raiz.add(luz, luz.target);
  for (const z of [-1, 1]) raiz.add(pegatina(M.pegRayo, L / 2 - 1.0, 2.3, z * 1.27, z > 0 ? 0 : Math.PI, 0.22));

  // ---- Arado central en V ----
  const arado = new THREE.Group(); arado.name = 'Arado_Central';
  const aspas = [];
  for (const z of [-1, 1]) {
    const a = new THREE.Group();
    a.add(caja(1.45, 0.55, 0.05, M.verde, 0.72, 0.28, 0), caja(1.45, 0.14, 0.055, M.palaAcero, 0.72, 0.03, 0));   // hoja: acero desnudo abajo
    a.position.z = z * 0.06; a.userData.z = z;
    arado.add(a); aspas.push(a);
  }
  arado.add(caja(0.4, 0.5, 0.4, M.chasis, 0, 0.55, 0));
  for (const z of [-0.5, 0.5]) arado.add(cil(0.05, 0.9, M.cromo, -0.2, 0.95, z));
  arado.position.x = X_ARADO;
  raiz.add(arado);

  // ---- Alas laterales ----
  const alas = [];
  const alasG = new THREE.Group(); alasG.name = 'Arados_Laterales';
  for (const z of [-1, 1]) {
    const brazo = new THREE.Group();
    brazo.add(caja(0.25, 0.25, 0.9, M.verde, 0, 0, z * 0.45));
    const hoja = new THREE.Group();
    hoja.add(caja(2.3, 0.75, 0.06, M.verde, -1.0, 0, 0), caja(2.3, 0.16, 0.065, M.palaAcero, -1.0, -0.42, 0));
    hoja.position.z = z * 0.9;
    brazo.add(hoja, tubo(0.05, new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(-0.6, 0.1, z * 0.9), M.cromo));
    brazo.position.set(X_ALAS + 0.6, 0.9, z * 1.25);
    brazo.userData = { z, hoja };
    alasG.add(brazo); alas.push(brazo);
  }
  raiz.add(alasG);
  for (const z of [-1, 1]) raiz.add(mangueras(M.manguera, new THREE.Vector3(X_ALAS + 0.5, 1.35, z * 1.2), new THREE.Vector3(X_ARADO, 1.0, z * 0.5), 4, 0.25));

  // ---- Cepillo con mangueras de poliuretano macizo, cinta y tolva ----
  const cep = new THREE.Group(); cep.name = 'Unidad_Cepillo';
  const tambor = new THREE.Group();
  tambor.add(cil(0.32, 2.7, M.oscuro, 0, 0, 0, 'z', 18));
  const gT = new THREE.CylinderGeometry(0.032, 0.03, 0.42, 6);
  const nT = 14 * 12;
  const imT = new THREE.InstancedMesh(gT, M.goma, nT);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let n = 0;
  for (let fila = 0; fila < 14; fila++) for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * Math.PI * 2 + fila * 0.26, z = -1.25 + fila * (2.5 / 13);
    const r = 0.32 + 0.21;
    q.setFromEuler(e.set(0, 0, ang - Math.PI / 2));
    imT.setMatrixAt(n++, m4.compose(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, z), q, new THREE.Vector3(1, 1, 1)));
  }
  imT.castShadow = true;
  tambor.add(imT);
  const carcasa = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.9, 20, 1, true, Math.PI * 0.1, Math.PI * 0.9), M.amarillo);
  carcasa.rotation.x = Math.PI / 2;
  cep.add(tambor, carcasa, caja(0.1, 0.9, 0.1, M.franjas, 0.95, 0.2, 1.4), caja(0.1, 0.9, 0.1, M.franjas, 0.95, 0.2, -1.4));
  for (const z of [-1.3, 1.3]) cep.add(cil(0.06, 1.0, M.cromo, 0.3, 0.9, z));
  cep.position.set(X_CEPILLO, 0.55, 0);
  raiz.add(cep);
  // Cinta transportadora (banda que corre) y tolva sobre la plataforma
  const texBanda = (() => {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256;
    const g = cv.getContext('2d'); g.fillStyle = '#1a1b1c'; g.fillRect(0, 0, 64, 256);
    g.fillStyle = '#2e3032'; for (let y = 0; y < 256; y += 24) g.fillRect(0, y, 64, 6);
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); return t;
  })();
  const banda = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.6), new THREE.MeshStandardMaterial({ map: texBanda, roughness: 0.9 }));
  const cinta = new THREE.Group(); cinta.name = 'Cinta_Transportadora';
  banda.rotation.x = -Math.PI / 2;
  cinta.add(banda, caja(3.6, 0.2, 0.08, M.amarilloOsc, 0, -0.1, 0.5), caja(3.6, 0.2, 0.08, M.amarilloOsc, 0, -0.1, -0.5));
  cinta.position.set(X_CEPILLO + 1.6, 1.75, 0);
  cinta.rotation.z = 0.42;
  raiz.add(cinta);
  const tolva = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.55, 1.3, 4, 1, true), M.amarillo);
  tolva.rotation.y = Math.PI / 4; tolva.scale.set(1, 1, 1.4);
  tolva.position.set(X_CEPILLO + 3.7, 2.55, 0); tolva.name = 'Tolva';
  raiz.add(tolva);
  // Grúa de carga como en la foto
  raiz.add(tubo(0.08, new THREE.Vector3(X_CEPILLO + 2.4, 1.6, -0.9), new THREE.Vector3(X_CEPILLO + 2.0, 4.2, -0.9), M.amarillo), tubo(0.07, new THREE.Vector3(X_CEPILLO + 2.0, 4.2, -0.9), new THREE.Vector3(X_CEPILLO + 0.4, 4.6, -0.9), M.amarillo));

  const ficha = { capa: 'Trabajos de mantenimiento', nombre: 'Perfiladora-regularizadora de balasto', info: 'Perfiladora (tipo Plasser & Theurer SSP 110): el arado central en V rebaja y reparte la piedra, las alas laterales cortan el talud 1:1,5 y el cepillo de mangueras de poliuretano barre traviesas y sujeciones; la piedra sobrante sube por la cinta a la tolva.' };
  raiz.traverse((o) => { if (o.isMesh) o.userData = ficha; });

  // ---- Efectos: piedra lanzada por el cepillo y nube de polvo densa ----
  const polvo = crearPolvo(700, '#d2ccc0');
  const piedras = crearPiedras(220, new THREE.MeshStandardMaterial({ color: '#8f8b84', roughness: 0.95 }));
  const efectos = new THREE.Group(); efectos.add(polvo.puntos, piedras.im);
  const vivir = vidaMaquina({ raiz, M, destellos: dest, chimeneas: [chim], efectos });

  // ---- Estado ----
  const estado = { activo: false, fase: 'despliegue', despliegue: 0, vel: 0 };
  let pk = 0, tiempo = 0;
  const pkArado = () => pk + X_ARADO, pkAlas = () => pk + X_ALAS, pkCepillo = () => pk + X_CEPILLO;

  // Balasto suelto y desordenado (descarga o bateo previo): cubre en parte traviesas y sujeciones
  function caotico(p, u, base) {
    const a = Math.abs(u);
    let extra = 0;
    if (a < 2.1) extra = 0.05 + 0.065 * ruido(p * 1.7, u * 2.3) + 0.03 * ruido(p * 5.1, u * 6.7) - 0.02 * suave((a - 1.6) / 0.5);
    if (a >= 1.6 && a < 2.9) extra += 0.06 * ruido(p * 0.9 + 3, u * 1.9) * (1 - suave((a - 2.2) / 0.7));
    return Math.min(base + extra, -0.06);
  }
  /** Proveedor del balasto del tramo. */
  function balasto(p, u, base) {
    const d = estado.despliegue, a = Math.abs(u);
    let y = caotico(p, u, base);
    const tA = suave((pkArado() - p) / 0.5) * d;     // 1 por detrás del arado central
    const tL = suave((pkAlas() - p) / 0.6) * d;      // por detrás de las alas
    const tC = suave((pkCepillo() - p) / 0.45) * d;  // por detrás del cepillo
    if (tA > 0) {
      if (a < 1.35) y += (Math.min(y, Z_TRAV + 0.004 + 0.012 * ruido(p * 4, u * 5)) - y) * tA;
      else if (a < 2.2) y += 0.03 * tA * (1 - suave((a - 1.9) / 0.3));
    }
    if (tL > 0 && a > 1.4) y += (base + 0.006 * ruido(p * 6, u * 8) - y) * tL;
    if (tL > 0 && a > SEMI_BANQUETA - 0.4 && a <= 1.4) y += (Math.max(base, -0.18) - y) * tL;
    if (tC > 0 && a < 1.4) y += (Z_CAJON + 0.006 * ruido(p * 7, u * 9) - y) * tC;
    return y;
  }
  /** Proveedor de suciedad de traviesas y sujeciones: limpias detrás del cepillo. */
  const suciedad = (p) => 1 - suave((pkCepillo() + 0.2 - p) / 0.5) * estado.despliegue;

  function montar(pkCentro) { pk = pkCentro; tiempo = 0; estado.activo = true; estado.despliegue = 0; estado.fase = 'despliegue'; }
  function desmontar() { estado.activo = false; }

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _bx = new THREE.Matrix4(), _w = new THREE.Vector3();
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
    // Despliegue (3 s) y luego marcha continua siguiendo al tren de trabajo
    estado.despliegue = Math.min(1, tiempo / 3);
    estado.fase = estado.despliegue < 1 ? 'despliegue' : 'regulacion';
    const v = Math.max(0, Math.min(0.6, (pkObjetivo - pk) * 0.25));
    estado.vel = estado.despliegue < 1 ? 0 : v;
    pk += estado.vel * dt;
    const d = suave(estado.despliegue), s = tramo.s;
    // Rigging de las herramientas
    arado.position.y = 0.95 - 0.95 * d - Z_TRAV * 0 + (Z_TRAV + 0.01) * d;
    aspas.forEach((a) => { a.rotation.y = a.userData.z * (0.15 + 0.5 * d); });
    for (const br of alas) {
      const z = br.userData.z;
      br.rotation.x = z * (0.9 - 0.9 * d);                 // plegadas arriba → desplegadas
      br.userData.hoja.rotation.y = z * 0.35 * d;            // hoja abierta hacia fuera
      br.userData.hoja.rotation.x = -z * 0.55 * d;           // inclinada como el talud (1:1,5)
      br.position.y = 0.9 - 0.45 * d;
    }
    cep.position.y = 0.95 - 0.27 * d;
    tambor.rotation.z += dt * 14 * d;                        // gira contra el avance: lanza la piedra hacia atrás y arriba
    texBanda.offset.y -= dt * 1.6 * d;
    tramo.marcar(pkCepillo() - 0.8, pkArado() + 1.2);
    tramo.borrarHuellas(pkArado() - 0.3);

    // Piedra lanzada por el cepillo hacia la cinta y a los lados; polvo denso bajo la máquina
    if (d > 0.5) {
      const tr = tramo.traviesa(pkCepillo());
      for (let k = 0; k < 7; k++) {
        const uL = (Math.random() - 0.5) * 2.6;
        _w.copy(tramo.punto(pkCepillo() + 0.15, uL, Z_TRAV + 0.03));
        const lado = Math.random() < 0.25 ? Math.sign(uL || 1) : 0;
        const vel = tr.dir.clone().multiplyScalar(1.5 + Math.random() * 2.5).addScaledVector(_up, 2 + Math.random() * 2.5).addScaledVector(tr.izq, s * lado * (2 + Math.random() * 2));
        piedras.lanzar(_w, vel, tramo.punto(pkCepillo(), uL, -0.3).y, 1.1);
      }
      for (let k = 0; k < 3; k++) {
        const xR = X_CEPILLO + Math.random() * (L - 3), uL = (Math.random() - 0.5) * 3.6;
        polvo.emitir(tramo.punto(pk + xR, uL, -0.1), 1, { tam: 0.35, crece: 0.9, vida: 3.2, alfa: 0.32, sube: 0.35, fuerza: 0.8 });
      }
      polvo.emitir(tramo.punto(pkCepillo(), (Math.random() - 0.5) * 2.4, Z_TRAV), 3, { tam: 0.2, crece: 1.2, vida: 2.5, alfa: 0.45, sube: 1.2, fuerza: 1.4 });
      for (const z of [-1, 1]) polvo.emitir(tramo.punto(pkAlas() - 0.6, 1.9 * z, -0.15), 1, { tam: 0.25, crece: 0.8, vida: 2.4, alfa: 0.35, sube: 0.4 });
    }
    luz.intensity = noche ? 60 : 0;
    colocar();
    vivir(dt, { ds: estado.vel * dt, noche, carga: 0.4 + 0.6 * d });
    fijarCarril(M.sucios, yCarril, [chim.getWorldPosition(_w)]);
    polvo.actualizar(dt);
    piedras.actualizar(dt);
  }

  // ---- Cámaras ----
  function pose(modo) {
    if (modo === 'arado') {
      // Adherida al chasis, por fuera y mirando hacia abajo a la hoja del ala exterior
      raiz.updateMatrixWorld(true);
      const zOut = -tramo.s;   // en ejes de la máquina (Z a la derecha), el exterior de la vía
      const pos = raiz.localToWorld(new THREE.Vector3(X_ALAS + 2.0, 2.3, zOut * 2.6));
      const obj = raiz.localToWorld(new THREE.Vector3(X_ALAS - 0.6, -0.2, zOut * 2.0));
      return { pos, obj, mundo: true };
    }
    if (modo === 'cepillo') return { pos: tramo.punto(pkCepillo() - 6.5, 0.2, 0.45), obj: tramo.punto(pkCepillo() + 0.3, 0, 0.35) };
    return { pos: tramo.punto(pk + 16, 13, 11), obj: tramo.punto(pk - 4, 0, 0) };
  }

  return {
    raiz, efectos, estado, balasto, suciedad, montar, desmontar, actualizar, pose,
    get pk() { return pk; }, get pkCepillo() { return pkCepillo(); }, LARGO: L,
  };
}
