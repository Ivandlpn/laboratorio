// Inspección de superestructura a pie (escenario nocturno)
//
// Un equipo de seis agentes (hombres y mujeres, sin casco, chaleco amarillo retrorreflectante y ropa de trabajo oscura)
// patrulla la vía registrando incidencias en la tablet, mientras un 4x4 blanco de apoyo avanza por el camino de
// servicio a su altura. Al activar el modo, un dron graba en modo cine automático.
//
//   Agentes: rig procedural (cadera, tronco, cabeza, brazos y piernas) con cinemática inversa de dos huesos en las
//   piernas: cada pie pisa exactamente la cara superior de una traviesa (rejilla de 0,6 m), nunca el cajón de balasto.
//   Máquina de estados: Walk_Track (por el eje o por fuera del carril, mirando abajo y a los lados), NoteTaking
//   (camina tecleando en la tablet), Crouch_Inspect (se agacha junto a una sujeción e ilumina de cerca) y Photograph
//   (levanta la tablet con las dos manos y salta el flash).
//   Luces: frontal (SpotLight en la cabeza) o linterna de mano (SpotLight en la mano derecha, con balanceo al andar),
//   con haz visible; la tablet ilumina la cara desde abajo. El chaleco brilla solo cuando le da una luz.
//   Coche: sigue el camino de servicio (3-5 km/h) a la altura del grupo, con faros (SpotLight) y pilotos rojos.
//   Dron: plano A (sobrevuelo desde atrás pasando por encima del coche), B (órbita a un agente agachado) y C (cenital
//   bajo viendo los haces).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { crearAudioObras } from './audio-obras.js';
import { crearPolvo } from './pbr-maquinas.js';

const _gltfInsp = new GLTFLoader();
const _cacheGlbInsp = new Map();
function cargarGlbInsp(ruta) {
  if (!_cacheGlbInsp.has(ruta)) {
    _cacheGlbInsp.set(ruta, new Promise((res, rej) => _gltfInsp.load(ruta, res, undefined, rej)));
  }
  return _cacheGlbInsp.get(ruta);
}

const ESP = 0.6;                 // espaciado de traviesas (rejilla global de PK)
const Z_TRAV = -0.16;            // cara superior de la traviesa respecto a la cabeza de carril
const MUSLO = 0.45, TIBIA = 0.44, TOBILLO = 0.07;
export const ESTADOS_INSP = {
  Walk_Track: 'Caminando por la vía', NoteTaking: 'Anotando en la tablet', Crouch_Inspect: 'Agachado inspeccionando', Photograph: 'Fotografiando',
  Drive: 'Conduciendo el vehículo de apoyo',
};
const INCIDENCIAS = [
  'Clip de sujeción desplazado', 'Falta de balasto en el cajón', 'Soldadura aluminotérmica con rebaba', 'Traviesa con fisura en la cabeza',
  'Placa de asiento deteriorada', 'Desgaste ondulatorio en la cabeza del carril', 'Tirafondo flojo', 'Junta aislante con suciedad',
];
// Seis agentes: cuatro inspeccionan cada uno un hilo (carril) de las dos vías, escalonados a lo largo y con su propio
// ritmo; uno revisa por fuera de la vía el desbroce de cunetas y taludes y las soldaduras; y uno conduce el coche.
// Solo hay tres tablets. via: +1 vía 1 (izquierda), −1 vía 2; lat: lado del hilo respecto al eje de esa vía.
const EQUIPO = [
  { nombre: 'Ana', mujer: true, luz: 'frontal', tablet: true, via: 1, lat: 0.95, desfase: 0, rol: 'vía 1 · hilo izquierdo' },
  { nombre: 'Edu', mujer: false, luz: 'linterna', via: 1, lat: -0.95, desfase: -23, rol: 'vía 1 · hilo derecho' },
  { nombre: 'Iván', mujer: false, luz: 'linterna', tablet: true, via: -1, lat: 0.95, desfase: -9, rol: 'vía 2 · hilo izquierdo' },
  { nombre: 'Pepe', mujer: false, luz: 'frontal', via: -1, lat: -0.95, desfase: -34, rol: 'vía 2 · hilo derecho' },
  { nombre: 'Manuel', mujer: false, luz: 'frontal', tablet: true, via: 1, lat: 4.3, desfase: -15, suelo: true, rol: 'desbroce y soldaduras' },
  { nombre: 'Raúl', mujer: false, luz: 'frontal', conductor: true, rol: 'conductor del vehículo de apoyo' },
];
const INC_ENTORNO = [
  'Vegetación invadiendo la cuneta', 'Desbroce pendiente en el talud', 'Cuneta obstruida por arrastres', 'Soldadura aluminotérmica con rebaba',
  'Soldadura con fisura en el patín', 'Malla del vallado rota', 'Arqueta de drenaje colmatada',
];
// Hora de la simulación dentro de la banda nocturna de mantenimiento (empieza a la 01:10)
const BANDA_INI = 1 * 3600 + 10 * 60, BANDA_FIN = 5 * 3600;
const suave = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
// Acerca un valor a su objetivo con amortiguación (transiciones de postura suaves)
const acerca = (a, b, dt, rapidez = 5) => a + (b - a) * Math.min(1, dt * rapidez);

export function crearInspeccion({ escena, Eje3D, W, cotaTerrenoUTM }) {
  const audio = crearAudioObras();
  const grupo = new THREE.Group();
  grupo.name = 'Inspeccion de superestructura';
  grupo.visible = false;
  escena.add(grupo);

  // ---- Materiales ----
  const std = (color, rough = 0.8, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  const M = {
    ropa: std('#1d232b', 0.9), ropa2: std('#2a2f36', 0.9), bota: std('#15171a', 0.7),
    pieles: ['#e0b896', '#c99a78', '#a8765a', '#8a5c42'].map((c) => std(c, 0.75)),
    pelos: ['#1b1410', '#3b2a1e', '#5a4130', '#2a2422', '#7a5a3a'].map((c) => std(c, 0.85)),
    tablet: std('#101214', 0.4, 0.4), linterna: std('#2b2f33', 0.4, 0.6), guante: std('#2b2b2b', 0.85), emisora: std('#16181b', 0.5, 0.2),
    pantalla: new THREE.MeshBasicMaterial({ color: '#7fd6c8' }),
    lente: new THREE.MeshBasicMaterial({ color: '#eaf2ff' }),
    blanco: std('#f2f3f1', 0.35, 0.2), cristal: std('#0e1418', 0.1, 0.6), vidrioCoche: std('#1b2a33', 0.05, 0.4, { transparent: true, opacity: 0.38, depthWrite: false }), asiento: std('#26292d', 0.9), llanta: std('#2a2d30', 0.6, 0.5), neumatico: std('#121314', 0.9),
    faro: new THREE.MeshBasicMaterial({ color: '#fffbe8' }), piloto: new THREE.MeshBasicMaterial({ color: '#ff1e1e' }),
    grava: std('#867e70', 1.0),
  };
  // Grava del camino de servicio: textura con piedrecitas
  M.grava.map = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'); g.fillStyle = '#7d7568'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 1600; i++) { const v = 90 + Math.random() * 90; g.fillStyle = `rgb(${v},${v * 0.95},${v * 0.86})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2.2, 1 + Math.random() * 2.2); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  // Logotipo oficial de Ineco (comun/texturas/ineco.png, fondo transparente, 4,55:1) en chalecos y coche
  const texIneco = new THREE.TextureLoader().load('./comun/texturas/ineco.png');
  texIneco.colorSpace = THREE.SRGBColorSpace; texIneco.anisotropy = 8;
  const matLogoChaleco = new THREE.MeshStandardMaterial({ map: texIneco, transparent: true, alphaTest: 0.05, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
  const matLogoCoche = new THREE.MeshStandardMaterial({ map: texIneco, transparent: true, alphaTest: 0.05, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2 });
  const caja = (sx, sy, sz, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); me.castShadow = true; return me; };
  const cil = (r, h, m, x = 0, y = 0, z = 0, eje = 'y', seg = 12) => {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); me.position.set(x, y, z);
    if (eje === 'z') me.rotation.x = Math.PI / 2; else if (eje === 'x') me.rotation.z = Math.PI / 2;
    return me;
  };

  // Haz de luz visible (cono aditivo que se desvanece con la distancia), apuntando a +X local
  const matHaz = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#cfe0ff') }, fuerza: { value: 0.12 } },
    vertexShader: 'varying float vV; varying vec3 vN; varying vec3 vVista;\nvoid main(){ vV = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vVista = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 color; uniform float fuerza; varying float vV; varying vec3 vN; varying vec3 vVista;\nvoid main(){ float borde = pow(1.0 - abs(dot(vN, vVista)), 0.6); float a = fuerza * pow(vV, 1.6) * (1.0 - borde * 0.7); gl_FragColor = vec4(color * a, a); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  function luzConHaz(largo = 6, angulo = 0.38, intensidad = 30, color = '#dbe8ff') {
    const g = new THREE.Group();
    const luz = new THREE.SpotLight(color, intensidad, largo * 3.5, angulo, 0.55, 1.4);
    const objetivo = new THREE.Object3D(); objetivo.position.set(5, 0, 0);
    luz.target = objetivo;
    const r = Math.tan(angulo) * largo;
    const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.015, r, largo, 18, 1, true).translate(0, -largo / 2, 0), matHaz);
    haz.rotation.z = Math.PI / 2;
    haz.renderOrder = 20;
    g.add(luz, objetivo, haz);
    g.userData = { luz, objetivo, haz, angulo, alcance: largo * 3.5 };
    return g;
  }

  // Geometrías anatómicas perfiladas (sin cubos rígidos) para extremidades y chaleco
  const gMusloInsp = new THREE.LatheGeometry([
    new THREE.Vector2(0.056, -MUSLO),
    new THREE.Vector2(0.062, -MUSLO * 0.65),
    new THREE.Vector2(0.078, -MUSLO * 0.25),
    new THREE.Vector2(0.082, 0.0),
  ], 14);
  const gTibiaInsp = new THREE.LatheGeometry([
    new THREE.Vector2(0.044, -TIBIA),
    new THREE.Vector2(0.064, -TIBIA * 0.42),
    new THREE.Vector2(0.058, 0.0),
  ], 14);
  const gBrazoInsp = new THREE.LatheGeometry([
    new THREE.Vector2(0.042, -0.30),
    new THREE.Vector2(0.048, -0.15),
    new THREE.Vector2(0.056, 0.0),
  ], 12);
  const gAntebrazoInsp = new THREE.LatheGeometry([
    new THREE.Vector2(0.034, -0.27),
    new THREE.Vector2(0.043, -0.12),
    new THREE.Vector2(0.044, 0.0),
  ], 12);

  // ---- Agente: rig orgánico articulado con mallas Blender ----
  function crearAgente(def, i) {
    const raiz = new THREE.Group();
    const anch = def.mujer ? 0.90 : 1;
    const piel = M.pieles[i % M.pieles.length], pelo = M.pelos[i % M.pelos.length];
    // Chaleco retrorreflectante: amarillo fluorescente y bandas plateadas; su brillo (emisivo) depende de la luz que recibe
    const matChaleco = std('#cddc2a', 0.55, 0, { emissive: new THREE.Color('#d9ff3a'), emissiveIntensity: 0.04 });
    const matBanda = std('#d8dce0', 0.22, 0.65, { emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.05 });
    const infoAgente = { capa: 'Inspección de superestructura', nombre: `${def.nombre} · agente de inspección`, info: `Patrulla nocturna de inspección de vía: chaleco retrorreflectante, ${def.luz === 'frontal' ? 'frontal en la cabeza' : 'linterna de mano'} ${def.tablet ? 'y la tablet de la pareja para registrar incidencias' : 'junto a su compañero, que lleva la tablet'}.` };

    const caderas = new THREE.Group(); caderas.position.y = 0.93; raiz.add(caderas);
    const cadMalla = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), M.ropa);
    cadMalla.scale.set(0.82, 0.72, 1.22 * anch); cadMalla.castShadow = true;
    caderas.add(cadMalla);
    cargarGlbInsp('./modelos/op_pelvis.glb').then((g) => {
      const cl = g.scene.clone(true);
      cl.scale.set(1, 1, anch);
      cl.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; n.userData = infoAgente; } });
      caderas.remove(cadMalla);
      caderas.add(cl);
    }).catch(() => {});

    const tronco = new THREE.Group(); tronco.position.y = 0.06; caderas.add(tronco);
    // Torso interior (ropa oscura) + chaleco orgánico Blender ceñido
    const torsoProcedural = new THREE.Group();
    const ropaIntMalla = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.148, 0.52, 16), M.ropa2);
    ropaIntMalla.scale.set(0.70, 1.0, 1.08 * anch); ropaIntMalla.position.y = 0.28; ropaIntMalla.castShadow = true;
    const chalecoMalla = new THREE.Mesh(new THREE.CylinderGeometry(0.178, 0.158, 0.44, 16), matChaleco);
    chalecoMalla.scale.set(0.72, 1.0, 1.12 * anch); chalecoMalla.position.y = 0.28; chalecoMalla.castShadow = true;
    torsoProcedural.add(ropaIntMalla, chalecoMalla);
    for (const [y, r] of [[0.17, 0.176], [0.31, 0.192]]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r - 0.004, 0.042, 20), matBanda);
      b.scale.set(0.64, 1.0, 1.04 * anch); b.position.y = y;
      torsoProcedural.add(b);
    }
    for (const z of [-0.095, 0.095]) {
      const tir = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.24, 4, 8), matBanda);
      tir.scale.set(6.2, 1.0, 1.1); tir.position.set(0, 0.36, z * anch);
      torsoProcedural.add(tir);
    }
    tronco.add(torsoProcedural);
    cargarGlbInsp('./modelos/op_torso.glb').then((g) => {
      const cl = g.scene.clone(true);
      cl.scale.set(1, 1, anch);
      cl.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = true;
          n.receiveShadow = true;
          n.userData = infoAgente;
          if (n.material?.name === 'Chaleco') {
            n.material = n.material.clone();
            n.material.emissive = matChaleco.emissive;
          } else if (n.material?.name === 'Banda3M') {
            n.material = n.material.clone();
            n.material.emissive = matBanda.emissive;
          }
        }
      });
      tronco.remove(torsoProcedural);
      tronco.add(cl);
    }).catch(() => {});

    // Emisora portátil en el pecho, con su antena
    tronco.add(caja(0.032, 0.10, 0.052, M.emisora, 0.125, 0.40, -0.095 * anch), cil(0.004, 0.07, M.emisora, 0.125, 0.49, -0.105 * anch));
    // Logotipo de Ineco en la espalda curva del chaleco
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.058), matLogoChaleco);
    logo.position.set(-0.123, 0.39, 0); logo.rotation.y = -Math.PI / 2;
    tronco.add(logo);

    const cuello = new THREE.Group(); cuello.position.y = 0.54; tronco.add(cuello);
    cuello.add(cil(0.052, 0.09, piel, 0, 0.03, 0, 'y', 14));
    const cabeza = new THREE.Group(); cabeza.position.y = 0.08; cuello.add(cabeza);
    const cráneo = new THREE.Mesh(new THREE.SphereGeometry(0.106, 18, 14), piel);
    cráneo.scale.set(0.96, 1.12, 0.92); cráneo.position.y = 0.10; cráneo.castShadow = true;
    const nariz = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.038, 8).rotateZ(-Math.PI / 2), piel);
    nariz.position.set(0.102, 0.095, 0);
    cabeza.add(cráneo, nariz);
    const pel = new THREE.Mesh(new THREE.SphereGeometry(0.112, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), pelo);
    pel.scale.set(0.98, 1.05, 0.94); pel.position.set(-0.012, 0.115, 0); pel.rotation.z = 0.25; cabeza.add(pel);
    if (def.mujer) { const mono = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 10), pelo); mono.position.set(-0.11, 0.11, 0); cabeza.add(mono); }

    // Brazos orgánicos (hombro → codo → mano)
    const brazo = (lado) => {
      const hombro = new THREE.Group(); hombro.position.set(0, 0.46, lado * 0.20 * anch); tronco.add(hombro);
      const mBr = new THREE.Mesh(gBrazoInsp, M.ropa2); mBr.castShadow = true; hombro.add(mBr);
      const codo = new THREE.Group(); codo.position.y = -0.3; hombro.add(codo);
      const mAnt = new THREE.Mesh(gAntebrazoInsp, M.ropa2); mAnt.castShadow = true; codo.add(mAnt);
      const mano = new THREE.Group(); mano.position.y = -0.28; codo.add(mano);
      const manoMalla = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), M.guante);
      manoMalla.scale.set(0.85, 1.25, 0.62); manoMalla.position.y = -0.03; manoMalla.castShadow = true;
      mano.add(manoMalla);
      cargarGlbInsp('./modelos/op_mano.glb').then((g) => {
        const cl = g.scene.clone(true);
        cl.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.userData = infoAgente; } });
        mano.remove(manoMalla);
        mano.add(cl);
      }).catch(() => {});
      return { hombro, codo, mano };
    };
    const bI = brazo(-1), bD = brazo(1);
    // Tablet en la mano izquierda (pantalla emisiva y tenue luz azul verdosa hacia la cara)
    const tablet = new THREE.Group();
    tablet.visible = Boolean(def.tablet);
    tablet.add(caja(0.012, 0.24, 0.17, M.tablet, 0, 0, 0));
    const pant = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.215), M.pantalla); pant.position.x = 0.007; pant.rotation.y = Math.PI / 2; tablet.add(pant);
    tablet.position.set(0.05, -0.08, 0.02);
    bI.mano.add(tablet);
    const luzTablet = new THREE.PointLight('#7fe0d0', def.tablet ? 0.25 : 0, 0.9, 2); luzTablet.position.set(0.12, 0, 0); tablet.add(luzTablet);
    // Frontal o linterna de mano
    let lampara;
    if (def.luz === 'frontal') {
      cabeza.add(caja(0.035, 0.035, 0.06, M.linterna, 0.1, 0.13, 0), caja(0.006, 0.022, 0.032, M.lente, 0.118, 0.13, 0));
      lampara = luzConHaz(6, 0.36, 26); lampara.position.set(0.12, 0.13, 0); cabeza.add(lampara);
    } else {
      bD.mano.add(cil(0.018, 0.17, M.linterna, 0, -0.08, 0), caja(0.03, 0.004, 0.03, M.lente, 0, -0.167, 0));
      lampara = luzConHaz(7, 0.3, 34); lampara.position.set(0, -0.17, 0); bD.mano.add(lampara);
    }
    // Piernas orgánicas: cadera → rodilla → tobillo (IK)
    const pierna = (lado) => {
      const cad = new THREE.Group(); cad.position.set(0, 0, lado * 0.1 * anch); caderas.add(cad);
      const mMus = new THREE.Mesh(gMusloInsp, M.ropa); mMus.castShadow = true; cad.add(mMus);
      const rod = new THREE.Group(); rod.position.y = -MUSLO; cad.add(rod);
      const mTib = new THREE.Mesh(gTibiaInsp, M.ropa); mTib.castShadow = true; rod.add(mTib);
      const tob = new THREE.Group(); tob.position.y = -TIBIA; rod.add(tob);
      const botaMalla = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.15, 4, 10), M.bota);
      botaMalla.rotation.z = Math.PI / 2; botaMalla.position.set(0.05, -0.035, 0); botaMalla.castShadow = true;
      tob.add(botaMalla);
      cargarGlbInsp('./modelos/op_bota.glb').then((g) => {
        const cl = g.scene.clone(true);
        cl.position.set(0, 0.01, 0);
        cl.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; n.userData = infoAgente; } });
        tob.remove(botaMalla);
        tob.add(cl);
      }).catch(() => {});
      return { cad, rod, tob, lado };
    };
    const pI = pierna(-1), pD = pierna(1);
    raiz.traverse((o) => { if (o.isMesh) o.userData = infoAgente; });

    let mixerHum = null, actIdle = null, actWalk = null, modeloHum = null, caminandoPrev = null;
    if (!def.conductor) {
      cargarGlbInsp('./modelos/humano_ineco.glb').then((gltf) => {
        modeloHum = SkeletonUtils.clone(gltf.scene);
        modeloHum.rotation.y = Math.PI / 2;
        modeloHum.scale.set(1, 1, anch);
        modeloHum.traverse((n) => {
          if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
            n.frustumCulled = false;
            n.userData = infoAgente;
            if (n.material?.name === 'Chaleco') {
              n.material = n.material.clone();
              n.material.emissive = matChaleco.emissive;
            } else if (n.material?.name === 'Banda3M') {
              n.material = n.material.clone();
              n.material.emissive = matBanda.emissive;
            }
          }
        });
        const conservar = new Set([logo]);
        for (const grp of [tablet, lampara]) {
          if (grp) grp.traverse((x) => conservar.add(x));
        }
        caderas.traverse((n) => {
          if (n.isMesh && !conservar.has(n)) n.visible = false;
        });
        raiz.add(modeloHum);

        if (gltf.animations?.length) {
          mixerHum = new THREE.AnimationMixer(modeloHum);
          const clipIdle = gltf.animations.find((c) => c.name === 'Idle') || gltf.animations[0];
          const clipWalk = gltf.animations.find((c) => c.name === 'Walk') || clipIdle;
          actIdle = mixerHum.clipAction(clipIdle);
          actWalk = mixerHum.clipAction(clipWalk);
          actIdle.play();
          caminandoPrev = false;
        }
      }).catch(() => {});
    }
    const actualizarHum = (dt, andando, agachaVal, velAct) => {
      if (!mixerHum || !modeloHum) return;
      if (andando !== caminandoPrev) {
        caminandoPrev = andando;
        if (andando) {
          actIdle?.fadeOut(0.2);
          actWalk?.reset().fadeIn(0.2).play();
        } else {
          actWalk?.fadeOut(0.2);
          actIdle?.reset().fadeIn(0.2).play();
        }
      }
      if (andando && actWalk) actWalk.timeScale = Math.max(0.65, velAct / 0.85);
      mixerHum.update(dt);
      modeloHum.position.y = -0.45 * agachaVal;
    };
    return { def, raiz, caderas, tronco, cabeza, cuello, bI, bD, pI, pD, tablet, pant, luzTablet, lampara, matChaleco, matBanda, actualizarHum };
  }

  // ---- Coche de apoyo (4x4 blanco esculpido en Blender) ----
  function crearCoche() {
    const c = new THREE.Group();
    const chasisFallback = new THREE.Group();
    chasisFallback.add(caja(4.7, 0.75, 1.86, M.blanco, 0, 0.75, 0));
    chasisFallback.add(caja(2.5, 0.09, 1.76, M.blanco, -0.2, 1.8, 0), caja(2.5, 0.08, 1.8, M.blanco, -0.2, 1.16, 0));
    for (const x of [1.0, -0.2, -1.4]) for (const z of [-0.85, 0.85]) chasisFallback.add(caja(0.09, 0.6, 0.07, M.blanco, x, 1.48, z));
    const vid = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.56, 1.72), M.vidrioCoche); vid.position.set(-0.2, 1.48, 0); vid.renderOrder = 2; chasisFallback.add(vid);
    c.add(chasisFallback);
    for (const z of [-0.42, 0.42]) c.add(caja(0.5, 0.2, 0.48, M.asiento, -0.35, 0.68, z), caja(0.1, 0.75, 0.46, M.asiento, -0.62, 1.1, z));
    c.add(cil(0.17, 0.03, M.llanta, 0.45, 1.12, -0.42, 'x', 16));   // volante
    const ruedas = [];
    for (const x of [1.38, -1.38]) for (const z of [-0.88, 0.88]) {
      const r = new THREE.Group(); r.add(cil(0.38, 0.27, M.neumatico, 0, 0, 0, 'z', 18), cil(0.24, 0.28, M.llanta, 0, 0, 0, 'z', 12));
      r.position.set(x, 0.38, z); c.add(r); ruedas.push(r);
    }
    cargarGlbInsp('./modelos/vehiculo_servicio.glb').then((g) => {
      const mBl = g.scene.clone(true);
      mBl.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = true;
          n.receiveShadow = true;
          if (n.material && n.material.name === 'VehCristal') n.material = M.vidrioCoche;
        }
      });
      chasisFallback.clear();
      chasisFallback.add(mBl);
    }).catch(() => {});
    for (const z of [-0.65, 0.65]) { c.add(caja(0.04, 0.12, 0.3, M.faro, 2.36, 0.88, z)); c.add(caja(0.04, 0.16, 0.12, M.piloto, -2.36, 0.95, z * 1.2)); }
    // Logotipo de Ineco en las puertas y en el capó (sin rotativo en el techo)
    for (const z of [-1, 1]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.25), matLogoCoche); l.position.set(-0.15, 0.82, z * 0.935); l.rotation.y = z > 0 ? 0 : Math.PI; c.add(l); }
    const lc = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2), matLogoCoche); lc.position.set(1.75, 1.126, 0); lc.rotation.set(-Math.PI / 2, 0, Math.PI / 2); c.add(lc);
    const faros = [];
    for (const z of [-0.65, 0.65]) {
      const f = new THREE.SpotLight('#fff4dc', 0, 48, 0.4, 0.4, 1.3);
      f.position.set(2.4, 0.88, z);
      const o = new THREE.Object3D(); o.position.set(12, -0.6, z * 1.4); f.target = o;
      c.add(f, o); faros.push(f);
    }
    const pilotosLuz = new THREE.PointLight('#ff2020', 0.6, 4, 2); pilotosLuz.position.set(-2.5, 0.95, 0); c.add(pilotosLuz);
    c.traverse((o) => { if (o.isMesh) o.userData = { capa: 'Inspección de superestructura', nombre: 'Vehículo de apoyo 4x4', info: 'Todoterreno blanco de apoyo a la patrulla: avanza por el camino de servicio a 3-5 km/h a la altura del grupo con los faros encendidos.' }; });
    return { obj: c, ruedas, faros };
  }

  // ---- Estado ----
  let sit = null;
  const estado = { activo: false, plano: 'A' };
  const enVia = (pk, s, d = 0) => { const m = Eje3D.enPk(pk), off = s * m.sep * 0.5 + d; return { E: m.E - m.ty * off, N: m.N + m.tx * off, Z: m.Z, m }; };
  const aLocal = (p) => W(p.E, p.N, p.Z).sub(W(sit.ancla.E, sit.ancla.N, sit.ancla.Z));
  // Cara superior de la traviesa (Z local de la escena) en un PK
  const cotaTrav = (pk) => Eje3D.enPk(pk).Z + 0.022 + Z_TRAV;

  function montar({ pk, s = 1 }) {
    desmontar();
    const m0 = Eje3D.enPk(pk);
    sit = { pk0: pk, s, ancla: { E: m0.E, N: m0.N, Z: m0.Z }, agentes: [], incidencias: [], t: 0, tPlano: 0, flash: null, reloj: BANDA_INI };
    grupo.position.copy(W(sit.ancla.E, sit.ancla.N, sit.ancla.Z));
    // Cada inspector por su hilo, escalonados a lo largo (nunca dos juntos en la misma vía) y cada uno con su ritmo
    EQUIPO.forEach((def, i) => {
      const ag = crearAgente(def, i);
      const lat = def.lat ?? 0;
      const desfase = def.desfase ?? 0;
      Object.assign(ag, { desfase, via: def.via ?? s, suelo: Boolean(def.suelo), paso: def.suelo ? 0.7 : ESP });
      const iT = Math.round((pk + desfase) / ESP);
      Object.assign(ag, {
        lat, pk: iT * ESP + ESP * 0.5, vel: 0.33 + Math.random() * 0.3, estado: 'Walk_Track', tEst: 2 + Math.random() * 9,
        pies: [{ pk: iT * ESP, desde: 0, hasta: 0, t: 1 }, { pk: (iT + 1) * ESP, desde: 0, hasta: 0, t: 1 }], vuelo: -1,
        mirada: Math.random() * 10, objetivo: null, anotadas: 0,
      });
      ag.pies[0].lado = 0; ag.pies[1].lado = 1;
      grupo.add(ag.raiz);
      sit.agentes.push(ag);
    });
    // Camino de servicio de grava paralelo a la vía (por fuera, del lado de la vía inspeccionada)
    sit.latCamino = s * (m0.sep * 0.5 + 8.2);
    const pkA = pk - 160, pkB = pk + 900;
    const gC = new THREE.BufferGeometry(), pos = [], uv = [], idx = [];
    let n = 0;
    for (let p = pkA; p <= pkB; p += 2.5) {
      for (const d of [-1.7, 1.7]) {
        const q = enVia(p, 0, sit.latCamino + d);
        q.Z = cotaTerrenoUTM(q.E, q.N) + 0.04;
        const v = aLocal(q); pos.push(v.x, v.y, v.z); uv.push(d > 0 ? 1 : 0, (p - pkA) / 3);
      }
      if (n) idx.push((n - 1) * 2, n * 2, (n - 1) * 2 + 1, (n - 1) * 2 + 1, n * 2, n * 2 + 1);
      n++;
    }
    gC.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gC.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    gC.setIndex(idx); gC.computeVertexNormals();
    const camino = new THREE.Mesh(gC, M.grava);
    camino.receiveShadow = true;
    camino.userData = { capa: 'Inspección de superestructura', nombre: 'Camino de servicio', info: 'Camino de grava compactada paralelo a la vía para los vehículos de mantenimiento (trazado supuesto).' };
    grupo.add(camino);
    sit.coche = crearCoche();
    sit.coche.pk = pk - 8; sit.coche.vel = 0;
    grupo.add(sit.coche.obj);
    // El conductor, sentado al volante (se le ve por la ventanilla)
    const cond = sit.agentes.find((g) => g.def.conductor);
    if (cond) {
      grupo.remove(cond.raiz);
      sit.coche.obj.add(cond.raiz);
      cond.raiz.position.set(-0.3, 0.55, -0.42); cond.raiz.rotation.set(0, 0, 0);
      cond.caderas.position.set(0, 0.22, 0);
      for (const pi of [cond.pI, cond.pD]) { pi.cad.rotation.z = Math.PI / 2; pi.rod.rotation.z = -Math.PI / 2; pi.tob.rotation.z = 0; }
      cond.tronco.rotation.z = 0.12;
      for (const b of [cond.bI, cond.bD]) { b.hombro.rotation.z = 1.05; b.codo.rotation.z = 0.55; }
      cond.lampara.visible = false; cond.lampara.userData.luz.intensity = 0;
      cond.estado = 'Drive';
    }
    // Flash de la foto (una sola luz que se mueve al agente que dispara)
    sit.flash = new THREE.PointLight('#ffffff', 0, 9, 1.6);
    grupo.add(sit.flash);
    // Vaho de la respiración en la noche fría
    sit.vaho = crearPolvo(160, '#e6edf5');
    grupo.add(sit.vaho.puntos);
    // Sonido: motor del 4x4 al ralentí y viento de ambiente con ráfagas
    sit.motor = audio.fuente('motor', { ref: 4, caida: 1.2 }).set({ nivel: 0.55, rpm: 750 });
    grupo.visible = true;
    estado.activo = true;
    actualizar(0);
    return sit;
  }
  function desmontar() {
    sit?.motor?.parar();
    audio.viento(0);
    for (const c of [...grupo.children]) { grupo.remove(c); c.traverse?.((o) => { if (o.isMesh) o.geometry?.dispose?.(); }); }
    sit = null;
    grupo.visible = false;
    estado.activo = false;
  }

  // Solución analítica de dos huesos en el plano sagital: devuelve [ángulo de cadera, flexión de rodilla]
  function ik2(dx, dy) {
    const d = Math.min(MUSLO + TIBIA - 1e-4, Math.max(0.12, Math.hypot(dx, dy)));
    const a = Math.atan2(dx, -dy);
    const cA = (MUSLO * MUSLO + d * d - TIBIA * TIBIA) / (2 * MUSLO * d);
    const cK = (MUSLO * MUSLO + TIBIA * TIBIA - d * d) / (2 * MUSLO * TIBIA);
    return [a + Math.acos(Math.max(-1, Math.min(1, cA))), -(Math.PI - Math.acos(Math.max(-1, Math.min(1, cK))))];
  }

  const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3();
  function cambiarEstado(ag) {
    const r = Math.random();
    const prev = ag.estado;
    if (prev !== 'Walk_Track') { ag.estado = 'Walk_Track'; ag.tEst = 4 + Math.random() * 10; return; }
    if (!ag.def.tablet) {
      // Sin tablet: inspecciona agachado y comunica la incidencia por la emisora
      if (r < 0.55) { ag.estado = 'Crouch_Inspect'; ag.tEst = 5 + Math.random() * 4; ag.objetivo = { pk: Math.round(ag.pk / ESP + 1) * ESP, rail: Math.sign(ag.lat || (Math.random() - 0.5)) || 1 }; }
      else { ag.estado = 'Walk_Track'; ag.tEst = 4 + Math.random() * 5; }
      return;
    }
    if (r < 0.34) { ag.estado = 'NoteTaking'; ag.tEst = 4 + Math.random() * 3; }
    else if (r < 0.72) { ag.estado = 'Crouch_Inspect'; ag.tEst = 5 + Math.random() * 4; ag.objetivo = { pk: Math.round(ag.pk / ESP + 1) * ESP, rail: Math.sign(ag.lat || (Math.random() - 0.5)) || 1 }; }
    else { ag.estado = 'Photograph'; ag.tEst = 2.2; ag.flashT = 0.9; }
  }
  // Hora nocturna de la simulación (01:10 + tiempo transcurrido, sin salir de la banda de 00:00 a 05:00)
  function horaNocturna() {
    const seg = Math.min(BANDA_FIN - 60, sit.reloj);
    const d = new Date(2026, 10, 17, 0, 0, 0);
    d.setSeconds(Math.floor(seg));
    return d;
  }
  function registrar(ag, tipo) {
    const lista = ag.suelo ? INC_ENTORNO : INCIDENCIAS;
    const quien = ag.def.tablet ? ag.def.nombre : `${ag.def.nombre} (por emisora)`;
    sit.incidencias.unshift({ pk: ag.pk, quien, tipo: `${lista[Math.floor(Math.random() * lista.length)]} · ${ag.suelo ? 'entorno' : ag.def.rol}`, hora: horaNocturna(), foto: tipo === 'foto' });
    sit.incidencias.length = Math.min(sit.incidencias.length, 30);
    ag.anotadas++;
  }

  function actualizar(dt, { noche = true } = {}) {
    if (!sit) return;
    dt = Math.min(dt, 0.1);
    sit.t += dt;
    sit.reloj += dt;
    grupo.position.copy(W(sit.ancla.E, sit.ancla.N, sit.ancla.Z));
    const t = sit.t;
    const andan = sit.agentes.filter((g) => !g.def.conductor);
    const pkMedio = andan.reduce((a, g) => a + g.pk, 0) / andan.length;
    const desfaseMedio = andan.reduce((a, g) => a + g.desfase, 0) / andan.length;
    let flashOn = 0;
    for (const ag of andan) {
      const s = ag.via;
      // ---- Máquina de estados ----
      ag.tEst -= dt;
      if (ag.tEst <= 0) {
        if (ag.estado === 'NoteTaking') registrar(ag, 'nota');
        if (ag.estado === 'Crouch_Inspect' && Math.random() < 0.5) registrar(ag, 'nota');
        cambiarEstado(ag);
      }
      if (ag.estado === 'Photograph') {
        ag.flashT -= dt;
        if (ag.flashT <= 0 && ag.flashT > -dt * 1.01) { registrar(ag, 'foto'); }
        if (ag.flashT <= 0 && ag.flashT > -0.12) { flashOn = 1 - (-ag.flashT / 0.12); sit.flash.position.copy(ag.raiz.position).add(_v.set(0, 1.35, 0)); }
      }
      // Velocidad: cada uno a su ritmo. Solo si se descuelga mucho del equipo aprieta o afloja el paso, y en la misma vía
      // nunca alcanza a quien va delante (se mantiene a más de 12 m)
      const dif = pkMedio + ag.desfase - desfaseMedio - ag.pk;
      const cohes = Math.abs(dif) > 15 ? Math.max(-0.12, Math.min(0.12, (dif - Math.sign(dif) * 15) * 0.02)) : 0;
      const delante = andan.filter((g) => g !== ag && g.via === ag.via && !g.suelo && !ag.suelo && g.pk > ag.pk).reduce((m, g) => Math.min(m, g.pk - ag.pk), Infinity);
      const freno = delante < 12 ? Math.max(0, (delante - 8) / 4) : 1;
      const vObj = (ag.estado === 'Walk_Track' ? ag.vel + cohes : ag.estado === 'NoteTaking' ? ag.vel * 0.55 + cohes : 0) * freno;
      const deteniendose = ag.estado === 'Crouch_Inspect' || ag.estado === 'Photograph';
      const levantandose = !deteniendose && (ag.tAgacha || 0) > 0.15;   // no echa a andar hasta estar de pie
      const vMeta = deteniendose || levantandose ? 0 : Math.max(0, vObj);
      ag.v = (ag.v ?? 0) + (vMeta - (ag.v ?? 0)) * Math.min(1, dt * (vMeta < (ag.v ?? 0) ? 5 : 2));
      ag.pk += ag.v * dt;
      // Parado, la cadera se coloca sobre el punto medio de los pies (sin quedarse por delante de ellos)
      if (deteniendose && ag.vuelo < 0) ag.pk = acerca(ag.pk, (ag.pies[0].pk + ag.pies[1].pk) / 2 + 0.04, dt, 3);
      ag.latAct = (ag.latAct ?? ag.lat) + (ag.lat - (ag.latAct ?? ag.lat)) * Math.min(1, dt * 0.8);

      // ---- Pisadas: el pie de atrás vuela a la traviesa siguiente a la del pie de delante ----
      const pies = ag.pies;
      const tPaso = ag.paso / Math.max(0.25, ag.v);
      const quieto = ag.estado === 'Crouch_Inspect' || ag.estado === 'Photograph';
      if (ag.vuelo < 0 && ag.v > 0.05 && !quieto) {
        const atras = pies[0].pk <= pies[1].pk ? 0 : 1, del = 1 - atras;
        if (ag.pk - pies[atras].pk > ag.paso * 0.75) {
          ag.vuelo = atras;
          pies[atras].desde = pies[atras].pk; pies[atras].hasta = pies[del].pk + ag.paso; pies[atras].t = 0;
        }
      }
      // Para agacharse (o fotografiar) junta los pies en la misma traviesa: así baja con las dos piernas
      if (ag.vuelo < 0 && quieto && pies[0].pk !== pies[1].pk) {
        const atras = pies[0].pk < pies[1].pk ? 0 : 1;
        ag.vuelo = atras;
        pies[atras].desde = pies[atras].pk; pies[atras].hasta = pies[1 - atras].pk; pies[atras].t = 0;
      }
      if (ag.vuelo >= 0) {
        const p = pies[ag.vuelo];
        p.t = Math.min(1, p.t + dt / Math.max(0.3, quieto ? 0.45 : tPaso * 0.6));
        if (p.t >= 1) {
          p.pk = p.hasta;
          // Pisada sobre la traviesa (con algo de balasto)
          const pieM = ag.vuelo === 0 ? ag.pI : ag.pD;
          audio.golpe(pieM.tob.getWorldPosition(_w), { tipo: 'paso', nivel: 0.45 + Math.random() * 0.35 });
          ag.vuelo = -1;
        }
      }
      ag.juntos = ag.vuelo < 0 && pies[0].pk === pies[1].pk;
      // ---- Postura del cuerpo ----
      // Sentadilla con las dos piernas: empieza cuando los pies están juntos en la traviesa
      // Baja con los pies juntos y empieza a levantarse 0,7 s antes de terminar la inspección: una sola variable continua
      const bajando = ag.estado === 'Crouch_Inspect' && ag.juntos && ag.tEst > 0.7;
      ag.tAgacha = bajando ? Math.min(1, (ag.tAgacha || 0) + dt * 1.4) : Math.max(0, (ag.tAgacha || 0) - dt * 1.5);
      const agacha = suave(ag.tAgacha);
      ag.actualizarHum?.(dt, ag.v > 0.05 && !quieto, agacha, ag.v);
      const fase = (t * ag.vel * 1.7 + ag.mirada);
      const hip = 0.9 - 0.5 * agacha + (ag.v > 0.05 ? Math.abs(Math.sin(fase * Math.PI)) * 0.025 : 0);
      ag.caderas.position.y = hip;
      ag.caderas.position.x = -0.2 * agacha;
      ag.tronco.rotation.z = acerca(ag.tronco.rotation.z, -0.12 - 0.75 * agacha - (ag.estado === 'NoteTaking' ? 0.1 : 0) - ag.v * 0.08, dt, 6);
      // Cabeza: mirando abajo y a los lados al andar; hacia la sujeción al agacharse; a la tablet al anotar
      const mirarLado = Math.sin(t * 0.6 + ag.mirada * 3) * 0.55 + Math.sin(t * 1.7 + ag.mirada) * 0.15;
      ag.cuello.rotation.y = acerca(ag.cuello.rotation.y, ag.estado === 'Walk_Track' ? mirarLado : ag.estado === 'Crouch_Inspect' ? ag.objetivo.rail * s * -0.4 : 0, dt, 3);
      ag.cuello.rotation.z = acerca(ag.cuello.rotation.z, ag.estado === 'Walk_Track' ? -0.45 + Math.sin(t * 0.9 + ag.mirada) * 0.15 : ag.estado === 'NoteTaking' ? -0.7 : ag.estado === 'Crouch_Inspect' ? -0.55 : -0.25, dt, 3);
      // Brazos según el estado (rotación z: adelante/atrás; x: separación)
      const bal = Math.sin(fase * Math.PI) * 0.25 * (ag.v > 0.05 ? 1 : 0);
      const ruidoBrazo = Math.sin(t * 2.3 + ag.mirada) * 0.08 + Math.sin(t * 5.1 + ag.mirada * 2) * 0.04;
      const pose = {
        Walk_Track: { iH: 0.25 - bal * 0.5, iC: 0.9, dH: 0.95 + ruidoBrazo + bal * 0.3, dC: 0.35 },
        NoteTaking: { iH: 0.9, iC: 1.25, dH: 0.85, dC: 1.4 + Math.sin(t * 14) * 0.06 },
        Crouch_Inspect: ag.def.luz === 'linterna' ? { iH: 0.55, iC: 0.45, dH: 1.1 + ruidoBrazo * 0.4, dC: 0.25 } : { iH: 0.55, iC: 0.45, dH: 0.6, dC: 0.5 },
        Photograph: { iH: 1.3, iC: 0.55, dH: 1.3, dC: 0.55 },
      }[ag.estado];
      // Los brazos pasan de una postura a otra con suavidad (el balanceo al andar ya va en la propia postura)
      ag.bI.hombro.rotation.z = acerca(ag.bI.hombro.rotation.z, pose.iH, dt, 7); ag.bI.codo.rotation.z = acerca(ag.bI.codo.rotation.z, pose.iC, dt, 7);
      ag.bD.hombro.rotation.z = acerca(ag.bD.hombro.rotation.z, pose.dH, dt, 7); ag.bD.codo.rotation.z = acerca(ag.bD.codo.rotation.z, pose.dC, dt, 7);
      ag.bI.hombro.rotation.x = acerca(ag.bI.hombro.rotation.x, ag.estado === 'Photograph' ? 0.35 : 0.08, dt, 5);
      ag.bD.hombro.rotation.x = acerca(ag.bD.hombro.rotation.x, ag.estado === 'Photograph' ? -0.35 : -0.08, dt, 5);
      // Tablet: mirando a la cara al anotar, hacia la vía al fotografiar
      ag.tablet.rotation.z = acerca(ag.tablet.rotation.z, ag.estado === 'Photograph' ? -1.2 : ag.estado === 'NoteTaking' ? 1.1 : 0.2, dt, 5);
      ag.pant.material = M.pantalla;
      ag.luzTablet.intensity = ag.estado === 'NoteTaking' || ag.estado === 'Photograph' ? 0.5 : 0.15;

      // ---- Raíz sobre la traviesa (cara superior) y orientación según la vía ----
      // Sobre la traviesa o, el que revisa el entorno, sobre el terreno del paseo
      const cota = (p) => { if (!ag.suelo) return cotaTrav(p); const q = enVia(p, s, ag.latAct); return cotaTerrenoUTM(q.E, q.N); };
      const pR = enVia(ag.pk, s, ag.latAct);
      pR.Z = cota(ag.pk);
      ag.raiz.position.copy(aLocal(pR));
      ag.raiz.rotation.y = Math.atan2(pR.m.ty, pR.m.tx);
      // ---- IK de las piernas: el tobillo a la cara de la traviesa (con arco en el vuelo) ----
      for (const [pi, pie] of [[ag.pI, pies[0]], [ag.pD, pies[1]]]) {
        let pkF = pie.pk, alto = 0;
        if (pie.t < 1 && ag.vuelo >= 0 && pies[ag.vuelo] === pie) { const u = suave(pie.t); pkF = pie.desde + (pie.hasta - pie.desde) * u; alto = Math.sin(Math.PI * pie.t) * 0.11; }
        // Al agacharse las caderas retroceden; los pies siguen plantados en su traviesa
        const dx = pkF - ag.pk - ag.caderas.position.x;
        const dy = (cota(pkF) - cota(ag.pk)) + TOBILLO + alto - hip;
        const [aC, aR] = ik2(dx, dy);
        pi.cad.rotation.z = aC; pi.rod.rotation.z = aR;
        pi.tob.rotation.z = -(aC + aR);   // pie plano sobre la traviesa
      }
      // ---- Luz: hacia delante y abajo; al agacharse, a la sujeción ----
      const lp = ag.lampara;
      // Linterna: el haz sigue al antebrazo (−90°) algo hacia abajo, con el balanceo del brazo al andar
      if (ag.def.luz === 'linterna') lp.rotation.z = acerca(lp.rotation.z, -Math.PI / 2 + (ag.estado === 'Crouch_Inspect' ? -0.9 : -0.35 + ruidoBrazo * 2), dt, 4);
      lp.rotation.y = ag.def.luz === 'linterna' ? Math.sin(t * 1.3 + ag.mirada) * 0.25 : 0;
      lp.userData.luz.intensity = noche ? (ag.def.luz === 'frontal' ? 26 : 34) : 0;
      lp.userData.haz.visible = noche;
      lp.userData.objetivo.position.set(5, ag.def.luz === 'frontal' ? -1.8 : 0, 0);
    }
    sit.flash.intensity = noche ? flashOn * 260 : flashOn * 60;
    // Vaho al respirar (cada 3-4 s) y viento con ráfagas
    for (const ag of andan) {
      ag.tVaho = (ag.tVaho ?? Math.random() * 3) - dt;
      if (ag.tVaho <= 0 && noche) {
        ag.tVaho = 3 + Math.random() * 1.5;
        ag.cabeza.getWorldPosition(_w); grupo.worldToLocal(_w); _w.y += 0.08;
        sit.vaho.emitir(_w, 3, { tam: 0.06, crece: 0.35, vida: 1.4, alfa: 0.22, sube: 0.12, fuerza: 0.25 });
      }
    }
    sit.vaho.actualizar(dt);
    audio.viento(0.42 + 0.18 * Math.sin(t * 0.11) + 0.22 * Math.max(0, Math.sin(t * 0.37 + 1.3)) ** 3);

    // ---- Retrorreflexión: cada chaleco brilla según la luz que le llega (frontales, linternas y faros) ----
    grupo.updateMatrixWorld(true);
    const fuentes = [];
    for (const ag of sit.agentes) {
      const L = ag.lampara.userData;
      if (!noche || ag.def.conductor) continue;
      L.luz.getWorldPosition(_v); L.objetivo.getWorldPosition(_w);
      fuentes.push({ p: _v.clone(), dir: _w.clone().sub(_v).normalize(), cos: Math.cos(L.angulo * 1.15), alcance: L.alcance * 0.8, k: 1, de: ag });
    }
    if (noche) for (const f of sit.coche.faros) { f.getWorldPosition(_v); f.target.getWorldPosition(_w); fuentes.push({ p: _v.clone(), dir: _w.clone().sub(_v).normalize(), cos: Math.cos(0.5), alcance: 45, k: 1.6 }); }
    for (const ag of sit.agentes) {
      ag.tronco.getWorldPosition(_v); _v.y += 0.3;
      let I = 0;
      for (const f of fuentes) {
        if (f.de === ag) continue;
        _d.copy(_v).sub(f.p);
        const d = _d.length();
        if (d > f.alcance) continue;
        const c = _d.divideScalar(d).dot(f.dir);
        if (c < f.cos) continue;
        I += f.k * Math.pow(1 - d / f.alcance, 1.3) * suave((c - f.cos) / (1 - f.cos) * 2.5);
      }
      I = Math.min(1.5, I) + flashOn * (ag.raiz.position.distanceTo(sit.flash.position) < 8 ? 1 : 0);
      ag.matChaleco.emissiveIntensity = 0.04 + 1.6 * I;
      ag.matBanda.emissiveIntensity = 0.05 + 4.5 * I;
    }

    // ---- Coche: a 3-5 km/h por el camino de servicio, a la altura del grupo ----
    const co = sit.coche;
    const vObj = Math.max(0, Math.min(1.35, (pkMedio - 7 - co.pk) * 0.3));
    co.vel += (vObj - co.vel) * Math.min(1, dt * 0.8);
    co.pk += co.vel * dt;
    const pc = enVia(co.pk, 0, sit.latCamino), pc2 = enVia(co.pk + 2, 0, sit.latCamino);
    pc.Z = cotaTerrenoUTM(pc.E, pc.N) + 0.04; pc2.Z = cotaTerrenoUTM(pc2.E, pc2.N) + 0.04;
    const a = aLocal(pc), b = aLocal(pc2);
    co.obj.position.copy(a);
    co.obj.rotation.set(0, Math.atan2(-(b.z - a.z), b.x - a.x), Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z)));
    for (const r of co.ruedas) r.rotation.z -= co.vel * dt / 0.38;
    for (const f of co.faros) f.intensity = noche ? 70 : 0;
    sit.motor.colocar(co.obj.getWorldPosition(_w)).set({ nivel: 0.55, rpm: 750 + co.vel * 700 });
  }

  // ---- Dron en modo cine automático (director de planos) ----
  const DUR = { A: 14, B: 14, C: 12 };
  function poseDron(dt) {
    if (!sit) return null;
    sit.tPlano += dt;
    if (sit.tPlano > DUR[estado.plano]) {
      sit.tPlano = 0;
      estado.plano = estado.plano === 'A' ? 'B' : estado.plano === 'B' ? 'C' : 'A';
      if (estado.plano === 'B' && !sit.agentes.some((g) => g.estado === 'Crouch_Inspect')) {
        const g = sit.agentes[Math.floor(Math.random() * sit.agentes.length)];
        g.estado = 'Crouch_Inspect'; g.tEst = DUR.B + 1; g.objetivo = { pk: Math.round(g.pk / ESP + 1) * ESP, rail: Math.sign(g.lat || 1) };
      }
    }
    const u = sit.tPlano / DUR[estado.plano], s = sit.s;
    // El dron sigue a la cabeza del equipo (Ana, vía 1)
    const pkMedio = sit.agentes[0].pk;
    const centro = aLocal({ ...enVia(pkMedio, s), Z: cotaTrav(pkMedio) + 0.9 });
    let pos, obj;
    if (estado.plano === 'A') {
      // Desde atrás, por encima del coche, entrando hacia el grupo
      const pkC = sit.coche.pk - 30 + u * 36, lat = sit.latCamino * (1 - u * 0.75);
      const q = enVia(pkC, 0, lat); q.Z = cotaTrav(pkC) + 14 - 8 * u;
      pos = aLocal(q); obj = centro;
    } else if (estado.plano === 'B') {
      const g = sit.agentes.find((x) => x.estado === 'Crouch_Inspect') || sit.agentes[0];
      const c = g.raiz.position.clone().add(_v.set(0, 0.7, 0));
      const ang = sit.tPlano * 0.28 + 0.6;
      pos = c.clone().add(_v.set(Math.cos(ang) * 4.6, 1.9, Math.sin(ang) * 4.6));
      obj = c;
    } else {
      // Cenital bajo siguiendo al grupo
      const pkC = pkMedio - 4 + u * 6;
      const q = { ...enVia(pkC, s), Z: cotaTrav(pkC) + 11 };
      pos = aLocal(q); obj = aLocal({ ...enVia(pkC + 3, s), Z: cotaTrav(pkC) });
    }
    return { pos: pos.add(grupo.position), obj: obj.clone().add(grupo.position) };
  }

  const lista = () => (sit ? sit.agentes.map((g) => ({ nombre: `${g.def.nombre} · ${g.def.rol}`, luz: g.def.conductor ? 'coche' : g.def.luz, estado: g.estado, pk: g.def.conductor ? sit.coche.pk : g.pk, anotadas: g.anotadas })) : []);
  return {
    grupo, estado, montar, desmontar, actualizar, poseDron, lista,
    get incidencias() { return sit?.incidencias || []; }, get sitio() { return sit; },
  };
}
