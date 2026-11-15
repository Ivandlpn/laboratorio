import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/*
 * Interior de un coche del AVE (Talgo Avril), según las fotos de Renfe: asientos de piel negra con funda blanca
 * «renfe AVE», paneles crema con madera naranja entre ventanas, techo con tiras de luz y portaequipajes, moqueta gris
 * con pasillo, disposición 2+1 con un grupo de cuatro enfrentados y mesa de madera. La ventana del pasajero lleva el
 * máximo detalle: marco con fondo, junta, doble acristalamiento con reflejos, estor, repisa y aviso de emergencia.
 * El pasajero viaja en la ventanilla derecha con un portátil en la bandeja que muestra visorlav.web.app.
 *
 * Coordenadas del marco de la carrocería del coche: x a lo largo (+x = sentido de marcha), y hacia arriba, z a la
 * derecha. La carrocería de los coches Avril mide 13,2 m; el interior va de x = −6,3 a +6,3.
 */
const SUELO = 0.40, TECHO = 2.20, PARED = 1.36, LARGO = 12.6;
const VENT = { ancho: 1.05, alto: 0.74, base: 1.02, radio: 0.14, paso: 1.3, n: 9 };
const VENTANAS_X = Array.from({ length: VENT.n }, (_, i) => -((VENT.n - 1) / 2) * VENT.paso + i * VENT.paso);

const lienzo = (w, h, pintar) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
// Materiales de interior: algo de luz propia (emisivo) para simular el alumbrado del coche
const matInt = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, emissive: color, emissiveIntensity: 0.28, ...extra });

function rectRedondo(forma, w, h, r, cx = 0, cy = 0) {
  const x = cx - w / 2, y = cy - h / 2;
  forma.moveTo(x + r, y); forma.lineTo(x + w - r, y); forma.quadraticCurveTo(x + w, y, x + w, y + r);
  forma.lineTo(x + w, y + h - r); forma.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  forma.lineTo(x + r, y + h); forma.quadraticCurveTo(x, y + h, x, y + h - r);
  forma.lineTo(x, y + r); forma.quadraticCurveTo(x, y, x + r, y);
  return forma;
}

/** Pared lateral con los huecos de las ventanas, pintada con su revestimiento (UV = coordenadas x, y en metros). */
function pared(lado, texPared) {
  const f = new THREE.Shape();
  f.moveTo(-LARGO / 2, SUELO); f.lineTo(LARGO / 2, SUELO); f.lineTo(LARGO / 2, TECHO); f.lineTo(-LARGO / 2, TECHO); f.lineTo(-LARGO / 2, SUELO);
  for (const x of VENTANAS_X) f.holes.push(rectRedondo(new THREE.Path(), VENT.ancho, VENT.alto, VENT.radio, x, VENT.base + VENT.alto / 2));
  const g = new THREE.ShapeGeometry(f, 10);
  if (lado < 0) g.rotateY(Math.PI);
  g.translate(0, 0, lado * PARED);
  const m = new THREE.Mesh(g, matInt('#ffffff', { map: texPared, side: THREE.DoubleSide, emissiveMap: texPared, emissiveIntensity: 0.2 }));
  return m;
}

function texturaPared() {
  // 100 px por metro: 1260 × 180 (x de −6,3 a 6,3; y de 0,40 a 2,20)
  const t = lienzo(1260, 180, (x, w, h) => {
    const px = (m) => (m + LARGO / 2) * 100, py = (m) => h - (m - SUELO) * 100;
    x.fillStyle = '#e8e4da'; x.fillRect(0, 0, w, h);
    // Zócalo gris claro y rejilla de calefacción
    x.fillStyle = '#d3cec3'; x.fillRect(0, py(0.95), w, py(SUELO) - py(0.95));
    x.fillStyle = '#9b958a';
    for (let i = 0; i < w; i += 6) x.fillRect(i, py(0.66), 3, py(0.56) - py(0.66));
    // Paneles de madera naranja entre ventanas, con dos franjas grises como en las fotos
    for (let k = 0; k < VENTANAS_X.length - 1; k++) {
      const x0 = px(VENTANAS_X[k] + VENT.ancho / 2 + 0.05), x1 = px(VENTANAS_X[k + 1] - VENT.ancho / 2 - 0.05);
      const g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#c4622a'); g.addColorStop(0.5, '#d27436'); g.addColorStop(1, '#c4622a');
      x.fillStyle = g; x.fillRect(x0, py(1.86), x1 - x0, py(0.98) - py(1.86));
      x.strokeStyle = 'rgba(120, 56, 20, .25)';
      for (let v = 0; v < 6; v++) { x.beginPath(); x.moveTo(x0 + 3 + v * 2, py(1.86)); x.lineTo(x0 + 2 + v * 2.4, py(0.98)); x.stroke(); }
      x.fillStyle = '#d9d5cc'; for (const yy of [1.6, 1.3]) x.fillRect(x0, py(yy), x1 - x0, 5);
    }
    // Moldura bajo el portaequipajes
    x.fillStyle = '#c9c4b9'; x.fillRect(0, py(1.92), w, 4);
  });
  t.repeat.set(1 / LARGO, 1 / (TECHO - SUELO)); t.offset.set(0.5, -SUELO / (TECHO - SUELO));
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Ventana de máximo detalle (marco con fondo, junta, doble vidrio, estor, repisa, aviso), mirando hacia el interior. */
function ventana(x, lado, conAviso) {
  const g = new THREE.Group();
  const cy = VENT.base + VENT.alto / 2;
  // Marco de plástico gris claro con fondo de 12 cm hacia el exterior
  const anillo = rectRedondo(new THREE.Shape(), VENT.ancho + 0.16, VENT.alto + 0.16, VENT.radio + 0.07);
  anillo.holes.push(rectRedondo(new THREE.Path(), VENT.ancho, VENT.alto, VENT.radio));
  const gMarco = new THREE.ExtrudeGeometry(anillo, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 10 });
  const marco = new THREE.Mesh(gMarco, matInt('#c3c7ca', { roughness: 0.5, emissiveIntensity: 0.14 }));
  // Junta negra de goma entre marco y vidrio
  const junta = rectRedondo(new THREE.Shape(), VENT.ancho + 0.004, VENT.alto + 0.004, VENT.radio);
  junta.holes.push(rectRedondo(new THREE.Path(), VENT.ancho - 0.04, VENT.alto - 0.04, VENT.radio - 0.02));
  const mJunta = new THREE.Mesh(new THREE.ExtrudeGeometry(junta, { depth: 0.02, bevelEnabled: false, curveSegments: 10 }), matInt('#1d2024', { emissiveIntensity: 0.05 }));
  mJunta.position.z = 0.1;
  // Doble acristalamiento: dos vidrios tintados con reflejos del cielo
  const gVid = new THREE.ShapeGeometry(rectRedondo(new THREE.Shape(), VENT.ancho - 0.03, VENT.alto - 0.03, VENT.radio - 0.015), 10);
  const mVid = new THREE.MeshStandardMaterial({ color: '#a8bfc2', transparent: true, opacity: 0.12, roughness: 0.03, metalness: 0.1, envMapIntensity: 1.4, depthWrite: false });
  const v1 = new THREE.Mesh(gVid, mVid); v1.position.z = 0.105;
  const v2 = new THREE.Mesh(gVid, mVid); v2.position.z = 0.135;
  // Estor plisado medio bajado en la parte alta, con su tirador
  const estor = new THREE.Mesh(new THREE.BoxGeometry(VENT.ancho - 0.06, 0.13, 0.012), matInt('#bfb9ad', { roughness: 0.95 }));
  estor.position.set(0, VENT.alto / 2 - 0.08, 0.06);
  const tirador = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 0.025), matInt('#8d8a84', { metalness: 0.5 }));
  tirador.position.set(0, VENT.alto / 2 - 0.15, 0.05);
  // Repisa bajo la ventana
  const repisa = new THREE.Mesh(new THREE.BoxGeometry(VENT.ancho + 0.2, 0.025, 0.11), matInt('#d2cec5'));
  repisa.position.set(0, -VENT.alto / 2 - 0.1, -0.03);
  g.add(marco, mJunta, v1, v2, estor, tirador, repisa);
  // Aviso de martillo de emergencia en la esquina del marco
  if (conAviso) {
    const aviso = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.05), new THREE.MeshBasicMaterial({ map: lienzo(70, 50, (c) => {
      c.fillStyle = '#d7261e'; c.fillRect(0, 0, 70, 50); c.fillStyle = '#fff'; c.font = '700 13px Arial'; c.textAlign = 'center';
      c.fillText('ROMPER', 35, 22); c.fillText('CRISTAL', 35, 38);
    }) }));
    aviso.position.set(VENT.ancho / 2 + 0.035, VENT.alto / 2 + 0.03, -0.012);
    g.add(aviso);
  }
  // El grupo mira hacia el interior: el fondo del marco (+z local) va hacia fuera
  g.position.set(x, cy, lado * (PARED - 0.12));
  if (lado < 0) g.rotation.y = Math.PI;
  return g;
}

/** Asiento de piel (adelante = +x): cojín, respaldo reclinado, reposacabezas, reposabrazos y pie. */
function geometriaAsiento() {
  const piezas = [];
  const caja = (w, h, d, x, y, z, rz = 0) => { const b = new THREE.BoxGeometry(d, h, w); if (rz) b.rotateZ(rz); b.translate(x, y, z); piezas.push(b); };
  caja(0.48, 0.13, 0.5, 0.02, 0.44, 0);            // cojín
  caja(0.5, 0.74, 0.13, -0.27, 0.86, 0, 0.17);     // respaldo
  caja(0.44, 0.24, 0.13, -0.35, 1.32, 0, 0.17);    // reposacabezas
  for (const s of [-1, 1]) caja(0.06, 0.07, 0.46, -0.02, 0.64, s * 0.27);  // reposabrazos
  caja(0.3, 0.38, 0.3, 0, 0.19, 0);                // pie
  return mergeGeometries(piezas.map((p) => p.toNonIndexed()));
}

export function crearInterior({ texPantalla }) {
  const grupo = new THREE.Group();
  grupo.name = 'Interior coche AVE';
  const ud = { capa: 'Interior del tren', nombre: 'Coche de viajeros AVE', info: 'Interior del Talgo Avril (S-106) según las fotos de Renfe: asientos de piel con funda «renfe AVE», paneles de madera, portaequipajes y moqueta. Disposición y medidas supuestas.' };

  // Suelo de moqueta gris punteada con pasillo más claro
  const texSuelo = lienzo(512, 128, (x, w, h) => {
    x.fillStyle = '#4a4c50'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#8d8a83'; x.fillRect(0, h * 0.44, w, h * 0.26);
    x.fillStyle = '#c9b48f'; x.fillRect(0, h * 0.44, w, 2); x.fillRect(0, h * 0.70 - 2, w, 2);
    x.fillStyle = 'rgba(255,255,255,.12)';
    for (let i = 0; i < 1800; i++) x.fillRect((i * 37) % w, (i * 53) % h, 1.5, 1.5);
  });
  texSuelo.wrapS = THREE.RepeatWrapping; texSuelo.repeat.set(6, 1);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(LARGO, PARED * 2).rotateX(-Math.PI / 2), matInt('#ffffff', { map: texSuelo, emissiveMap: texSuelo, emissiveIntensity: 0.25, roughness: 0.95 }));
  suelo.position.y = SUELO;
  // Techo curvo crema y tiras de luz a ambos lados
  // Arco que pasa por 2,30 m en el eje y apoya a 2,05 m en las paredes (radio 3,82 m, centro a −1,52 m)
  const gTecho = new THREE.CylinderGeometry(3.824, 3.824, LARGO, 32, 1, true, Math.PI * 0.5 - 0.37, 0.74).rotateZ(Math.PI / 2);
  const techo = new THREE.Mesh(gTecho, matInt('#e6e1d6', { side: THREE.BackSide, emissiveIntensity: 0.3 }));
  techo.position.y = -1.524;
  const tiras = new THREE.Group();
  for (const z of [-0.62, 0.62]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(LARGO - 0.4, 0.02, 0.16), new THREE.MeshBasicMaterial({ color: '#fff7e6' }));
    t.position.set(0, 2.235, z); tiras.add(t);
  }
  // Paredes con huecos, ventanas y portaequipajes
  const texPared = texturaPared();
  const paredes = [pared(1, texPared), pared(-1, texPared)];
  const ventanas = [];
  for (const lado of [-1, 1]) VENTANAS_X.forEach((x, i) => ventanas.push(ventana(x, lado, i % 3 === 1)));
  const portaequipajes = new THREE.Group();
  const mAlu = matInt('#b9bec4', { metalness: 0.7, roughness: 0.3, emissiveIntensity: 0.12 });
  for (const lado of [-1, 1]) {
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, LARGO - 0.3, 8).rotateZ(Math.PI / 2), mAlu);
    barra.position.set(0, 1.98, lado * 0.98);
    const bandeja = new THREE.Mesh(new THREE.BoxGeometry(LARGO - 0.3, 0.012, 0.38), new THREE.MeshStandardMaterial({ color: '#c8d4d8', transparent: true, opacity: 0.35, roughness: 0.1 }));
    bandeja.position.set(0, 1.95, lado * 1.17);
    portaequipajes.add(barra, bandeja);
  }
  // Mamparas de los extremos con la puerta de intercomunicación
  const mampara = (x) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PARED * 2, TECHO - SUELO), matInt('#c9763c', { side: THREE.DoubleSide }));
    m.rotation.y = Math.PI / 2; m.position.set(x, (SUELO + TECHO) / 2, 0);
    const puerta = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.9), matInt('#3c4146', { side: THREE.DoubleSide }));
    puerta.rotation.y = Math.PI / 2; puerta.position.set(x + Math.sign(-x) * 0.01, SUELO + 0.95, 0.12);
    return [m, puerta];
  };

  // Asientos: 2 a la izquierda, 1 a la derecha; un grupo de cuatro enfrentados con mesa (izquierda, centro del coche)
  const gAsiento = geometriaAsiento();
  // Funda blanca sobre el reposacabezas, con su misma inclinación
  const gFunda = new THREE.BoxGeometry(0.145, 0.25, 0.46).rotateZ(0.17).translate(-0.35, 1.32, 0);
  const texFunda = lienzo(256, 160, (x) => {
    x.fillStyle = '#f3f1ec'; x.fillRect(0, 0, 256, 160);
    x.fillStyle = '#8a1f3d'; x.font = 'italic 700 34px "Segoe UI", Arial'; x.textAlign = 'center'; x.fillText('renfe', 128, 96);
    x.fillStyle = '#6b6b6b'; x.font = '600 18px "Segoe UI", Arial'; x.fillText('AVE', 170, 122);
  });
  const PASO = 1.04, filas = [];
  for (let xx = -5.5; xx <= 5.6; xx += PASO) filas.push(xx);
  const plazas = [];   // [x, z, giro]
  filas.forEach((x, k) => {
    plazas.push([x, 0.86, 0]);                                   // derecha, individual
    const club = k === 5 || k === 6;
    const giro = club && k === 6 ? Math.PI : 0;                   // grupo de cuatro enfrentados
    plazas.push([x, -0.5, giro], [x, -1.0, giro]);
  });
  const mPiel = matInt('#26272a', { roughness: 0.42, metalness: 0.05, emissiveIntensity: 0.12 });
  const asientos = new THREE.InstancedMesh(gAsiento, mPiel, plazas.length);
  const fundas = new THREE.InstancedMesh(gFunda, matInt('#ffffff', { map: texFunda, emissiveMap: texFunda, emissiveIntensity: 0.15 }), plazas.length);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), uno = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
  plazas.forEach(([x, z, giro], i) => {
    q.setFromEuler(e.set(0, giro, 0)); mtx.compose(pos.set(x, SUELO, z), q, uno);
    asientos.setMatrixAt(i, mtx); fundas.setMatrixAt(i, mtx);
  });
  // Mesa de madera del grupo de cuatro
  const xMesa = (filas[5] + filas[6]) / 2;
  const mMadera = matInt('#b8622c', { roughness: 0.5 });
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.035, 1.0), mMadera);
  mesa.position.set(xMesa, SUELO + 0.72, -0.78);

  // Pasajero: ventanilla derecha, en la fila más cercana al centro de la ventana 5, con bandeja y portátil
  const xVent = VENTANAS_X[5];
  const xPas = filas.reduce((m, f) => (Math.abs(f - (xVent - 0.25)) < Math.abs(m - (xVent - 0.25)) ? f : m), filas[0]);
  const bandeja = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.42), matInt('#3a3d42'));
  bandeja.position.set(xPas + 0.52, SUELO + 0.70, 0.86);
  const portatil = new THREE.Group();
  const mAluPc = matInt('#9ea3a9', { metalness: 0.75, roughness: 0.3, emissiveIntensity: 0.1 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.014, 0.31), mAluPc);
  const teclado = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.27).rotateX(-Math.PI / 2), matInt('#202225'));
  teclado.position.set(-0.03, 0.0075, 0);
  const tapa = new THREE.Group();
  const carcasa = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.21, 0.31), mAluPc);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.185), new THREE.MeshBasicMaterial({ map: texPantalla, toneMapped: false }));
  pantalla.rotation.y = -Math.PI / 2; pantalla.position.set(-0.005, 0, 0);
  pantalla.userData = { capa: 'Interior del tren', nombre: 'Portátil del pasajero · VisorLAV', info: 'En la pantalla, VisorLAV (visorlav.web.app): la red de alta velocidad a un clic. Pulsa para abrirlo.', url: 'https://visorlav.web.app/' };
  tapa.add(carcasa, pantalla);
  carcasa.position.y = 0.105; pantalla.position.y = 0.105;
  tapa.position.set(0.11, 0.007, 0); tapa.rotation.z = -0.28;  // bisagra al fondo, abierta hacia el pasajero
  portatil.add(base, teclado, tapa);
  // Bisagra al fondo (+x) y pantalla mirando al pasajero (−x)
  portatil.position.set(xPas + 0.55, SUELO + 0.718, 0.86);

  grupo.add(suelo, techo, tiras, ...paredes, ...ventanas, portaequipajes, ...mampara(-LARGO / 2), ...mampara(LARGO / 2), asientos, fundas, mesa, bandeja, portatil);
  grupo.traverse((n) => { if (n.isMesh && !n.userData.url) n.userData = ud; });

  return {
    grupo,
    // Ojos del pasajero y punto al que mira (por la ventana, algo hacia delante), en el marco de la carrocería
    ojoPasajero: new THREE.Vector3(xPas - 0.2, SUELO + 1.22, 0.4),
    miradaPasajero: new THREE.Vector3(xPas + 1.05, SUELO + 0.98, PARED + 1.6),
    // Recorrido del dron dentro del coche: entra por la puerta delantera y baja por el pasillo hasta el pasajero
    recorrido: [
      new THREE.Vector3(LARGO / 2 - 0.3, SUELO + 1.55, 0.12),
      new THREE.Vector3(xPas + 2.2, SUELO + 1.5, 0.15),
      new THREE.Vector3(xPas + 0.9, SUELO + 1.35, 0.35),
      new THREE.Vector3(xPas - 0.2, SUELO + 1.22, 0.4),
    ],
  };
}
