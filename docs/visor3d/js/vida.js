import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Vida dinámica de la escena: lluvia, nieve, tormenta con relámpagos, pájaros, aviones y coches blancos de servicio
export function crearVidaEscena({ escena, Eje3D, W, cotaTerrenoUTM, caminosPorKm }) {
  const gltfLoader = new GLTFLoader();
  const grupo = new THREE.Group();
  grupo.name = 'vidaEscena';
  escena.add(grupo);

  // ---- 1. Lluvia y Tormenta 3D ----
  const N_GOTAS = 1600;
  const CAJA_XZ = 64, CAJA_Y = 40;
  const posGotas = new Float32Array(N_GOTAS * 6);
  const velGotas = new Float32Array(N_GOTAS);
  for (let i = 0; i < N_GOTAS; i++) {
    const x = (Math.random() - 0.5) * CAJA_XZ;
    const y = (Math.random() - 0.5) * CAJA_Y;
    const z = (Math.random() - 0.5) * CAJA_XZ;
    velGotas[i] = 19 + Math.random() * 9;
    posGotas[i * 6] = x; posGotas[i * 6 + 1] = y; posGotas[i * 6 + 2] = z;
    posGotas[i * 6 + 3] = x + 0.14; posGotas[i * 6 + 4] = y + 1.05; posGotas[i * 6 + 5] = z + 0.08;
  }
  const geoLluvia = new THREE.BufferGeometry();
  geoLluvia.setAttribute('position', new THREE.BufferAttribute(posGotas, 3));
  const matLluvia = new THREE.LineBasicMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const lluvia = new THREE.LineSegments(geoLluvia, matLluvia);
  lluvia.frustumCulled = false;
  lluvia.visible = false;
  lluvia.renderOrder = 10;
  grupo.add(lluvia);

  // Luz de relámpago para modo tormenta
  const luzRayo = new THREE.DirectionalLight(0xe0f2fe, 0);
  luzRayo.position.set(120, 260, -80);
  escena.add(luzRayo);
  let proxRayo = 2.5;
  let flashRayo = 0;

  function actualizarLluvia(dt, camPos, modoClima, enTunel, enCabina) {
    const esTormenta = modoClima === 'tormenta';
    const esLluvia = modoClima === 'lluvia' || esTormenta;
    lluvia.visible = esLluvia && !enTunel;

    if (esTormenta && !enTunel) {
      proxRayo -= dt;
      if (proxRayo <= 0) {
        flashRayo = 1.0;
        proxRayo = 3.5 + Math.random() * 5.5;
        luzRayo.position.set(camPos.x + (Math.random() - 0.5) * 400, 260, camPos.z + (Math.random() - 0.5) * 400);
      }
      if (flashRayo > 0) {
        flashRayo = Math.max(0, flashRayo - dt * 4.2);
        const pulso = flashRayo > 0.65 ? 1 : (flashRayo > 0.45 ? 0.25 : flashRayo * 1.4);
        luzRayo.intensity = pulso * 5.5;
      } else {
        luzRayo.intensity = 0;
      }
    } else {
      luzRayo.intensity = 0;
      flashRayo = 0;
    }

    if (!lluvia.visible) return;
    lluvia.position.copy(camPos);
    matLluvia.opacity = esTormenta ? 0.82 : 0.64;
    const arr = geoLluvia.attributes.position.array;
    const halfXZ = CAJA_XZ * 0.5, halfY = CAJA_Y * 0.5;
    const largoY = enCabina ? 1.65 : (esTormenta ? 1.45 : 1.15);
    const sesgoX = enCabina ? 0.38 : (esTormenta ? 0.32 : 0.16);
    const mult = (enCabina ? 1.45 : 1.0) * (esTormenta ? 1.35 : 1.0);
    for (let i = 0; i < N_GOTAS; i++) {
      const k = i * 6;
      let y = arr[k + 1] - velGotas[i] * mult * dt;
      let x = arr[k] - (esTormenta ? 5.2 : 2.4) * dt;
      if (y < -halfY) {
        y += CAJA_Y;
        x = (Math.random() - 0.5) * CAJA_XZ;
        arr[k + 2] = (Math.random() - 0.5) * CAJA_XZ;
      }
      if (x < -halfXZ) x += CAJA_XZ;
      arr[k] = x; arr[k + 1] = y;
      arr[k + 3] = x + sesgoX; arr[k + 4] = y + largoY; arr[k + 5] = arr[k + 2] + 0.08;
    }
    geoLluvia.attributes.position.needsUpdate = true;
  }

  // ---- 2. Nieve 3D ----
  const N_COPOS = 1800;
  const posCopos = new Float32Array(N_COPOS * 3);
  const faseCopos = new Float32Array(N_COPOS);
  for (let i = 0; i < N_COPOS; i++) {
    posCopos[i * 3] = (Math.random() - 0.5) * CAJA_XZ;
    posCopos[i * 3 + 1] = (Math.random() - 0.5) * CAJA_Y;
    posCopos[i * 3 + 2] = (Math.random() - 0.5) * CAJA_XZ;
    faseCopos[i] = Math.random() * Math.PI * 2;
  }
  const geoNieve = new THREE.BufferGeometry();
  geoNieve.setAttribute('position', new THREE.BufferAttribute(posCopos, 3));
  const cvCopo = document.createElement('canvas');
  cvCopo.width = cvCopo.height = 32;
  const ctxC = cvCopo.getContext('2d');
  const gradC = ctxC.createRadialGradient(16, 16, 1, 16, 16, 15);
  gradC.addColorStop(0, 'rgba(255,255,255,0.98)');
  gradC.addColorStop(0.55, 'rgba(241,245,249,0.75)');
  gradC.addColorStop(1, 'rgba(255,255,255,0)');
  ctxC.fillStyle = gradC;
  ctxC.fillRect(0, 0, 32, 32);
  const texCopo = new THREE.CanvasTexture(cvCopo);
  const matNieve = new THREE.PointsMaterial({
    map: texCopo,
    size: 0.34,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const nieve = new THREE.Points(geoNieve, matNieve);
  nieve.frustumCulled = false;
  nieve.visible = false;
  nieve.renderOrder = 10;
  grupo.add(nieve);

  let tCielo = 0;
  function actualizarNieve(dt, camPos, modoClima, enTunel) {
    nieve.visible = modoClima === 'nieve' && !enTunel;
    if (!nieve.visible) return;
    nieve.position.copy(camPos);
    const arr = geoNieve.attributes.position.array;
    const halfXZ = CAJA_XZ * 0.5, halfY = CAJA_Y * 0.5;
    for (let i = 0; i < N_COPOS; i++) {
      const k = i * 3;
      let y = arr[k + 1] - 3.2 * dt;
      let x = arr[k] + Math.sin(tCielo * 1.5 + faseCopos[i]) * 1.1 * dt;
      let z = arr[k + 2] + Math.cos(tCielo * 1.2 + faseCopos[i]) * 0.8 * dt;
      if (y < -halfY) {
        y += CAJA_Y;
        x = (Math.random() - 0.5) * CAJA_XZ;
        z = (Math.random() - 0.5) * CAJA_XZ;
      }
      if (x < -halfXZ) x += CAJA_XZ;
      else if (x > halfXZ) x -= CAJA_XZ;
      if (z < -halfXZ) z += CAJA_XZ;
      else if (z > halfXZ) z -= CAJA_XZ;
      arr[k] = x; arr[k + 1] = y; arr[k + 2] = z;
    }
    geoNieve.attributes.position.needsUpdate = true;
  }

  // ---- 3. Pájaros en bandadas y aviones en altura (centrados en el entorno de la cámara) ----
  const grupoAves = new THREE.Group();
  const matAve = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
  const geoAla = new THREE.BufferGeometry();
  geoAla.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0.28,   0, 0, -0.28,   0.95, 0.12, -0.06,
  ], 3));
  geoAla.computeVertexNormals();

  const bandadas = [];
  for (let b = 0; b < 5; b++) {
    const aves = [];
    const nA = 7 + (b % 3);
    for (let i = 0; i < nA; i++) {
      const ave = new THREE.Group();
      const alaI = new THREE.Mesh(geoAla, matAve);
      const alaD = new THREE.Mesh(geoAla, matAve);
      alaI.scale.x = -1;
      ave.add(alaI, alaD);
      ave.scale.setScalar(1.25 + (i % 3) * 0.22);
      grupoAves.add(ave);
      aves.push({ ave, alaI, alaD, fase: b * 1.7 + i * 0.85, offR: (i - nA * 0.5) * 3.8, offY: ((i % 3) - 1) * 1.8 });
    }
    bandadas.push({
      aves,
      ang: b * 1.25,
      radio: 26 + b * 11,
      alt: 18 + b * 7,
      vel: 0.22 + b * 0.03,
      dx: Math.cos(b * 1.3) * 38,
      dz: Math.sin(b * 1.3) * 38,
    });
  }
  grupo.add(grupoAves);

  const grupoAviones = new THREE.Group();
  const matFuselaje = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.26, metalness: 0.24, clearcoat: 0.85, clearcoatRoughness: 0.12 });
  const matMotorAv = new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.72 });
  const matEstela = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false });
  const matBaliza = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const gFusAv = new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 8.6),
    new THREE.Vector2(0.32, 7.6),
    new THREE.Vector2(0.62, 5.4),
    new THREE.Vector2(0.68, 1.5),
    new THREE.Vector2(0.65, -3.5),
    new THREE.Vector2(0.42, -6.8),
    new THREE.Vector2(0.08, -8.4),
  ], 16);
  gFusAv.rotateZ(-Math.PI / 2);
  const fAlaAv = new THREE.Shape();
  fAlaAv.moveTo(2.4, 0.0); fAlaAv.lineTo(-2.6, 8.2); fAlaAv.lineTo(-4.0, 8.2); fAlaAv.lineTo(-1.2, 0.0);
  fAlaAv.lineTo(-4.0, -8.2); fAlaAv.lineTo(-2.6, -8.2); fAlaAv.closePath();
  const gAlaAv = new THREE.ExtrudeGeometry(fAlaAv, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 2 });
  gAlaAv.rotateX(Math.PI / 2);
  const fColaAv = new THREE.Shape();
  fColaAv.moveTo(0, 0); fColaAv.lineTo(-2.2, 0); fColaAv.lineTo(-3.4, 3.0); fColaAv.lineTo(-2.1, 3.0); fColaAv.closePath();
  const gColaAv = new THREE.ExtrudeGeometry(fColaAv, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  const gMotorAv = new THREE.CylinderGeometry(0.28, 0.25, 2.0, 12).rotateZ(Math.PI / 2);

  const aviones = [];
  for (let i = 0; i < 3; i++) {
    const av = new THREE.Group();
    const fus = new THREE.Mesh(gFusAv, matFuselaje);
    const ala = new THREE.Mesh(gAlaAv, matFuselaje);
    ala.position.set(0.8, -0.1, 0);
    const cola = new THREE.Mesh(gColaAv, matFuselaje);
    cola.position.set(-5.8, 0.3, -0.07);
    const mIzq = new THREE.Mesh(gMotorAv, matMotorAv); mIzq.position.set(0.4, -0.45, -3.1);
    const mDer = new THREE.Mesh(gMotorAv, matMotorAv); mDer.position.set(0.4, -0.45, 3.1);
    const estela = new THREE.Mesh(new THREE.PlaneGeometry(240, 2.0).rotateX(-Math.PI / 2), matEstela);
    estela.position.set(-128, 0, 0);
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 6), matBaliza);
    luz.position.set(0, 0.72, 0);
    av.add(fus, ala, cola, mIzq, mDer, estela, luz);
    av.scale.setScalar(2.1);
    grupoAviones.add(av);
    aviones.push({
      av, luz,
      ang: i * 2.1 + 0.35,
      alt: 260 + i * 95,
      dist: 240 + i * 160,
      vel: 78 + i * 16,
      progreso: -1200 + i * 850,
    });
  }
  grupo.add(grupoAviones);

  function actualizarCielo(dt, camPos, enTunel) {
    tCielo += dt;
    grupoAves.visible = !enTunel;
    grupoAviones.visible = !enTunel;
    if (enTunel) return;

    for (const b of bandadas) {
      b.ang += b.vel * dt;
      const cx = camPos.x + b.dx;
      const cz = camPos.z + b.dz;
      const cy = Math.max(camPos.y, 6) + b.alt;
      for (const a of b.aves) {
        const angA = b.ang + a.offR * 0.025;
        const r = b.radio + a.offR;
        const x = cx + Math.cos(angA) * r;
        const z = cz + Math.sin(angA) * r;
        const y = cy + a.offY + Math.sin(tCielo * 1.4 + a.fase) * 1.2;
        a.ave.position.set(x, y, z);
        a.ave.rotation.y = -angA;
        const batida = Math.sin(tCielo * 10.5 + a.fase) * 0.56;
        a.alaI.rotation.z = -batida;
        a.alaD.rotation.z = batida;
      }
    }

    for (const av of aviones) {
      av.progreso += av.vel * dt;
      if (av.progreso > 1600) av.progreso = -1600;
      const dx = Math.cos(av.ang), dz = Math.sin(av.ang);
      const nx = -dz, nz = dx;
      av.av.position.set(camPos.x + dx * av.progreso + nx * av.dist, Math.max(camPos.y, 0) + av.alt, camPos.z + dz * av.progreso + nz * av.dist);
      av.av.rotation.y = -av.ang;
      av.luz.visible = Math.sin(tCielo * 5.5 + av.ang) > 0.35;
    }
  }

  // ---- 4. Vehículos blancos de mantenimiento (SUV/Pickup 4x4 realista estilo Principled BSDF + Bevel) ----
  const grupoCoches = new THREE.Group();
  const matBlanco = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc, roughness: 0.22, metalness: 0.14, clearcoat: 1.0, clearcoatRoughness: 0.08,
  });
  const matPlastico = new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.78, metalness: 0.12 });
  const matCristal = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a, roughness: 0.05, metalness: 0.12, clearcoat: 1.0, clearcoatRoughness: 0.04,
  });
  const matRueda = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88 });
  const matLlanta = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.24, metalness: 0.86 });
  const matFranjaVeh = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.42, metalness: 0.18 });
  const matFaroCoche = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  const matPilotoCoche = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const matBalizaAmbar = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

  // Silueta lateral automotriz suave con bevel (estilo Blender Subsurf/Bevel)
  const formaVeh = new THREE.Shape();
  formaVeh.moveTo(-2.15, 0.34);
  formaVeh.lineTo(2.10, 0.34);
  formaVeh.quadraticCurveTo(2.26, 0.42, 2.24, 0.74);
  formaVeh.lineTo(2.12, 0.96);
  formaVeh.quadraticCurveTo(1.62, 1.06, 1.18, 1.08);
  formaVeh.lineTo(0.48, 1.62);
  formaVeh.quadraticCurveTo(0.32, 1.68, -0.05, 1.68);
  formaVeh.lineTo(-1.82, 1.66);
  formaVeh.quadraticCurveTo(-2.10, 1.60, -2.18, 1.15);
  formaVeh.lineTo(-2.22, 0.50);
  formaVeh.closePath();
  const gCarroceriaVeh = new THREE.ExtrudeGeometry(formaVeh, {
    depth: 1.66, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.10, bevelSegments: 4,
  });
  gCarroceriaVeh.translate(0, 0, -0.83);

  const gParachoque = new THREE.BoxGeometry(0.24, 0.24, 1.84);
  const gParrilla = new THREE.BoxGeometry(0.08, 0.26, 1.18);
  const gParabrisasVeh = new THREE.BoxGeometry(0.82, 0.06, 1.54);
  gParabrisasVeh.rotateZ(-0.62);
  const gVentLat = new THREE.BoxGeometry(1.98, 0.44, 1.82);
  const gLunaTras = new THREE.BoxGeometry(0.10, 0.42, 1.44);
  gLunaTras.rotateZ(0.25);
  const gRetro = new THREE.BoxGeometry(0.14, 0.12, 0.20);
  const gBarraTecho = new THREE.BoxGeometry(1.45, 0.06, 0.07);
  const gFranjaVeh = new THREE.BoxGeometry(3.85, 0.12, 1.94);
  const gNeumatico = new THREE.CylinderGeometry(0.37, 0.37, 0.24, 18).rotateX(Math.PI / 2);
  const gLlanta = new THREE.CylinderGeometry(0.22, 0.22, 0.255, 12).rotateX(Math.PI / 2);
  const gCubo = new THREE.BoxGeometry(0.06, 0.36, 0.265);

  function crearCocheBlanco() {
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(gCarroceriaVeh, matBlanco);
    const paraDel = new THREE.Mesh(gParachoque, matPlastico); paraDel.position.set(2.22, 0.44, 0);
    const paraTras = new THREE.Mesh(gParachoque, matPlastico); paraTras.position.set(-2.18, 0.44, 0);
    const parrilla = new THREE.Mesh(gParrilla, matPlastico); parrilla.position.set(2.28, 0.72, 0);
    const parab = new THREE.Mesh(gParabrisasVeh, matCristal); parab.position.set(0.86, 1.38, 0);
    const ventLat = new THREE.Mesh(gVentLat, matCristal); ventLat.position.set(-0.75, 1.36, 0);
    const lunaTras = new THREE.Mesh(gLunaTras, matCristal); lunaTras.position.set(-2.12, 1.38, 0);
    const franja = new THREE.Mesh(gFranjaVeh, matFranjaVeh); franja.position.set(-0.1, 0.84, 0);
    g.add(cuerpo, paraDel, paraTras, parrilla, parab, ventLat, lunaTras, franja);

    for (const sz of [-0.98, 0.98]) {
      const retro = new THREE.Mesh(gRetro, matPlastico);
      retro.position.set(0.88, 1.14, sz);
      const barra = new THREE.Mesh(gBarraTecho, matPlastico);
      barra.position.set(-0.85, 1.78, sz * 0.62);
      g.add(retro, barra);
    }

    // Puente rotativo / baliza ámbar de mantenimiento en techo
    const puenteBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.96), matPlastico);
    puenteBase.position.set(-0.22, 1.80, 0);
    const baliza = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.88), matBalizaAmbar);
    baliza.position.set(-0.22, 1.86, 0);
    g.add(puenteBase, baliza);

    const ruedas = [];
    for (const sx of [-1.36, 1.38]) {
      for (const sz of [-0.88, 0.88]) {
        const rGrp = new THREE.Group();
        rGrp.position.set(sx, 0.37, sz);
        const neum = new THREE.Mesh(gNeumatico, matRueda);
        const llanta = new THREE.Mesh(gLlanta, matLlanta);
        const radio1 = new THREE.Mesh(gCubo, matPlastico);
        const radio2 = new THREE.Mesh(gCubo, matPlastico);
        radio2.rotation.z = Math.PI * 0.5;
        rGrp.add(neum, llanta, radio1, radio2);
        g.add(rGrp);
        ruedas.push(rGrp);
      }
    }
    for (const sz of [-0.66, 0.66]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.30), matFaroCoche);
      f.position.set(2.26, 0.78, sz);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.16, 0.26), matPilotoCoche);
      p.position.set(-2.22, 0.88, sz);
      g.add(f, p);
    }
    g.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
    g.userData.ruedas = ruedas;
    g.userData.baliza = baliza;
    return g;
  }

  const coches = [
    { dir: 1, vel: 12.5, s: 10, camino: null, mesh: crearCocheBlanco() },
    { dir: -1, vel: 14.0, s: 40, camino: null, mesh: crearCocheBlanco() },
    { dir: 1, vel: 11.8, s: 25, camino: null, mesh: crearCocheBlanco() },
    { dir: -1, vel: 13.2, s: 60, camino: null, mesh: crearCocheBlanco() },
    { dir: 1, vel: 12.0, s: 15, camino: null, mesh: crearCocheBlanco() },
  ];
  for (const c of coches) {
    c.mesh.visible = false;
    grupoCoches.add(c.mesh);
  }
  grupo.add(grupoCoches);

  gltfLoader.load('./modelos/vehiculo_servicio.glb', (gltf) => {
    const udVeh = {
      capa: 'Mantenimiento ferroviario',
      nombre: 'Vehículo de servicio Adif',
      info: 'Vehículo todo terreno de mantenimiento e inspección circulando por los caminos de servicio paralelos a la plataforma.',
    };
    for (const c of coches) {
      const modeloBl = gltf.scene.clone(true);
      modeloBl.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = true;
          n.receiveShadow = true;
          n.userData = udVeh;
        }
      });
      const balizaGlb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.84), matBalizaAmbar);
      balizaGlb.position.set(-0.22, 1.86, 0);
      balizaGlb.userData = udVeh;
      c.mesh.clear();
      c.mesh.add(modeloBl, balizaGlb);
      c.mesh.userData.ruedas = null;
      c.mesh.userData.baliza = balizaGlb;
    }
  }, undefined, () => {});

  function muestrearCamino(camino, sDist) {
    const pts = camino.pts;
    const s = Math.max(0, Math.min(camino.len, sDist));
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].s >= s || i === pts.length - 1) {
        const a = pts[i - 1], b = pts[i];
        const ds = b.s - a.s;
        const t = ds > 1e-4 ? Math.max(0, Math.min(1, (s - a.s) / ds)) : 0;
        return {
          E: a.E + (b.E - a.E) * t,
          N: a.N + (b.N - a.N) * t,
          Z: a.Z + (b.Z - a.Z) * t,
        };
      }
    }
    return pts[0];
  }

  const _uX = new THREE.Vector3(), _uY = new THREE.Vector3(), _uZ = new THREE.Vector3(), _vUp = new THREE.Vector3(0, 1, 0), _mC = new THREE.Matrix4();
  function actualizarCoches(dt, pkObs) {
    const kmObs = Math.floor(pkObs / 1000);
    const disponibles = [];
    if (caminosPorKm) {
      for (const [km, lista] of caminosPorKm.entries()) {
        if (Math.abs(km - kmObs) <= 2) {
          for (const cam of lista) disponibles.push(cam);
        }
      }
      disponibles.sort((a, b) => Math.abs(a.km - kmObs) - Math.abs(b.km - kmObs) || b.len - a.len);
    }

    const usados = new Set();
    for (let idx = 0; idx < coches.length; idx++) {
      const c = coches[idx];
      if (!c.camino || !caminosPorKm?.has(c.camino.km) || Math.abs(c.camino.km - kmObs) > 2) {
        c.camino = null;
        for (const cand of disponibles) {
          if (!usados.has(cand)) {
            c.camino = cand;
            c.s = Math.min(cand.len * 0.5, (idx * 27) % Math.max(10, cand.len));
            break;
          }
        }
        if (!c.camino && disponibles.length > 0) {
          c.camino = disponibles[idx % disponibles.length];
          c.s = ((idx * 37) % Math.max(10, Math.floor(c.camino.len)));
        }
      }
      if (!c.camino || c.camino.len < 10) {
        c.mesh.visible = false;
        continue;
      }
      usados.add(c.camino);
      c.mesh.visible = true;
      c.s += c.dir * c.vel * dt;
      if (c.s >= c.camino.len - 2) { c.s = c.camino.len - 2; c.dir = -1; }
      else if (c.s <= 2) { c.s = 2; c.dir = 1; }

      const pA = muestrearCamino(c.camino, c.s);
      const pB = muestrearCamino(c.camino, c.s + c.dir * 2.5);
      const wA = W(pA.E, pA.N, pA.Z);
      const wB = W(pB.E, pB.N, pB.Z);
      c.mesh.position.copy(wA);
      _uX.copy(wB).sub(wA);
      if (_uX.lengthSq() > 1e-4) {
        _uX.normalize();
        _uZ.crossVectors(_uX, _vUp).normalize();
        _uY.crossVectors(_uZ, _uX).normalize();
        _mC.makeBasis(_uX, _uY, _uZ);
        c.mesh.quaternion.setFromRotationMatrix(_mC);
      }
      if (c.mesh.userData.ruedas) {
        const dAng = (c.vel * dt) / 0.37;
        for (const r of c.mesh.userData.ruedas) r.rotation.z -= dAng;
      }
      if (c.mesh.userData.baliza) {
        c.mesh.userData.baliza.visible = Math.sin(tCielo * 9.0 + idx * 1.4) > -0.15;
      }
    }
  }

  // ---- 5. Cuadrillas de trabajadores orgánicos articulados (estilo Blender Subsurf + Rigging + Principled BSDF) ----
  const grupoTrabajadores = new THREE.Group();
  const matChaleco = new THREE.MeshPhysicalMaterial({
    color: 0xfacc15, roughness: 0.62, metalness: 0.04, sheen: 0.75, sheenRoughness: 0.5,
    emissive: 0x3b2f00, emissiveIntensity: 0.08,
  });
  const matBandaRefl = new THREE.MeshPhysicalMaterial({ color: 0xf1f5f9, roughness: 0.18, metalness: 0.85, clearcoat: 0.6 });
  const matPantalon = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, roughness: 0.86, sheen: 0.4 });
  const matCamisa = new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.80, sheen: 0.35 });
  const matPiel = new THREE.MeshPhysicalMaterial({ color: 0xd9a47c, roughness: 0.64, sheen: 0.3 });
  const matCascoBlanco = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.08, clearcoat: 0.75 });
  const matCascoAmarillo = new THREE.MeshPhysicalMaterial({ color: 0xfde047, roughness: 0.25, metalness: 0.08, clearcoat: 0.75 });
  const matBota = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 });
  const matGuante = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.82 });
  const matTablet = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.5 });
  const matPantallaTab = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Geometrías anatómicas perfiladas con LatheGeometry (sin cilindros ni cajas rígidas)
  const gPiernaOrg = new THREE.LatheGeometry([
    new THREE.Vector2(0.052, 0.00),
    new THREE.Vector2(0.056, 0.12),
    new THREE.Vector2(0.072, 0.28), // gemelo
    new THREE.Vector2(0.062, 0.40), // rodilla
    new THREE.Vector2(0.082, 0.58), // muslo
    new THREE.Vector2(0.092, 0.76), // cadera
  ], 12);
  const gBotaOrg = new THREE.ExtrudeGeometry((() => {
    const s = new THREE.Shape();
    s.moveTo(-0.065, -0.08); s.lineTo(0.065, -0.08);
    s.quadraticCurveTo(0.075, 0.08, 0.058, 0.17);
    s.quadraticCurveTo(0, 0.20, -0.058, 0.17);
    s.quadraticCurveTo(-0.075, 0.08, -0.065, -0.08);
    return s;
  })(), { depth: 0.09, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2 });
  gBotaOrg.rotateX(-Math.PI / 2);

  const gPelvis = new THREE.SphereGeometry(0.165, 12, 10);
  gPelvis.scale(1.12, 0.72, 0.80);

  const gTorsoOrg = new THREE.LatheGeometry([
    new THREE.Vector2(0.155, 0.00), // cintura
    new THREE.Vector2(0.168, 0.16), // abdomen
    new THREE.Vector2(0.195, 0.36), // pecho
    new THREE.Vector2(0.185, 0.48), // hombros
    new THREE.Vector2(0.078, 0.55), // base cuello
  ], 16);
  gTorsoOrg.scale(1.16, 1.0, 0.76);

  const gBandaH = new THREE.CylinderGeometry(0.192, 0.178, 0.045, 16);
  gBandaH.scale(1.17, 1.0, 0.77);

  const gCuello = new THREE.CylinderGeometry(0.052, 0.060, 0.11, 10);
  const gCabezaOrg = new THREE.SphereGeometry(0.108, 14, 12);
  gCabezaOrg.scale(0.88, 1.12, 0.96);
  const gNariz = new THREE.ConeGeometry(0.020, 0.042, 6);
  gNariz.rotateX(Math.PI * 0.5);

  const gCascoOrg = new THREE.SphereGeometry(0.126, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56);
  gCascoOrg.scale(0.95, 0.95, 1.04);
  const gNervioCasco = new THREE.BoxGeometry(0.028, 0.04, 0.18);
  const gViseraOrg = new THREE.CylinderGeometry(0.118, 0.124, 0.018, 12, 1, false, -Math.PI * 0.35, Math.PI * 0.70);

  const gBrazoSup = new THREE.LatheGeometry([
    new THREE.Vector2(0.042, 0.00),
    new THREE.Vector2(0.048, 0.14),
    new THREE.Vector2(0.056, 0.27),
  ], 10);
  const gAntebrazo = new THREE.LatheGeometry([
    new THREE.Vector2(0.032, 0.00),
    new THREE.Vector2(0.041, 0.16),
    new THREE.Vector2(0.043, 0.25),
  ], 10);
  const gMano = new THREE.SphereGeometry(0.036, 8, 8);
  gMano.scale(0.85, 1.25, 0.65);

  function crearTrabajador(rol = 0) {
    const t = new THREE.Group();

    // Piernas anatómicas con ligera postura natural de apoyo
    const piernaI = new THREE.Mesh(gPiernaOrg, matPantalon);
    piernaI.position.set(-0.095, 0.08, 0.02);
    piernaI.rotation.x = -0.04;
    const piernaD = new THREE.Mesh(gPiernaOrg, matPantalon);
    piernaD.position.set(0.095, 0.08, -0.02);
    piernaD.rotation.x = 0.05;
    const botaI = new THREE.Mesh(gBotaOrg, matBota); botaI.position.set(-0.095, 0.01, 0.02);
    const botaD = new THREE.Mesh(gBotaOrg, matBota); botaD.position.set(0.095, 0.01, -0.02);
    const pelvis = new THREE.Mesh(gPelvis, matPantalon); pelvis.position.set(0, 0.84, 0);
    t.add(piernaI, piernaD, botaI, botaD, pelvis);

    // Grupo tronco (animado por respiración)
    const grpTorso = new THREE.Group();
    grpTorso.position.set(0, 0.88, 0);
    const torso = new THREE.Mesh(gTorsoOrg, matChaleco);
    const banda1 = new THREE.Mesh(gBandaH, matBandaRefl); banda1.position.y = 0.14;
    const banda2 = new THREE.Mesh(gBandaH, matBandaRefl); banda2.position.y = 0.28;
    const cremallera = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.46, 0.02), matPlastico);
    cremallera.position.set(0, 0.25, 0.145);
    grpTorso.add(torso, banda1, banda2, cremallera);

    // Cabeza articulada con cuello, nariz y casco ergonómico
    const grpCabeza = new THREE.Group();
    grpCabeza.position.set(0, 0.54, 0);
    const cuello = new THREE.Mesh(gCuello, matPiel); cuello.position.y = 0.04;
    const cabeza = new THREE.Mesh(gCabezaOrg, matPiel); cabeza.position.y = 0.16;
    const nariz = new THREE.Mesh(gNariz, matPiel); nariz.position.set(0, 0.15, 0.10);
    const matC = rol === 0 ? matCascoBlanco : matCascoAmarillo;
    const casco = new THREE.Mesh(gCascoOrg, matC); casco.position.y = 0.20;
    const nervio = new THREE.Mesh(gNervioCasco, matC); nervio.position.set(0, 0.31, 0);
    const visera = new THREE.Mesh(gViseraOrg, matC); visera.position.set(0, 0.195, 0.03);
    grpCabeza.add(cuello, cabeza, nariz, casco, nervio, visera);
    grpTorso.add(grpCabeza);

    // Brazos articulados en 2 segmentos (hombro -> codo -> antebrazo -> mano)
    function crearBrazo(sx) {
      const hombro = new THREE.Group();
      hombro.position.set(sx * 0.22, 0.46, 0);
      const bSup = new THREE.Mesh(gBrazoSup, matCamisa);
      bSup.position.y = -0.26;
      const codo = new THREE.Group();
      codo.position.set(0, -0.26, 0);
      const aBrazo = new THREE.Mesh(gAntebrazo, matCamisa);
      aBrazo.position.y = -0.24;
      const mano = new THREE.Mesh(gMano, matGuante);
      mano.position.set(0, -0.26, 0.01);
      codo.add(aBrazo, mano);
      hombro.add(bSup, codo);
      return { hombro, codo, mano };
    }
    const brI = crearBrazo(-1);
    const brD = crearBrazo(1);

    // Posturas diferenciadas según el rol en la cuadrilla
    if (rol === 0) {
      // Jefe de equipo: sostiene tablet/plano con izquierda y gesticula con derecha
      brI.hombro.rotation.set(-0.45, 0, -0.15);
      brI.codo.rotation.set(-1.15, 0.25, 0);
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.018, 0.28), matTablet);
      tab.position.set(0.06, -0.26, 0.10);
      tab.rotation.x = 0.3;
      const pant = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.23).rotateX(-Math.PI / 2), matPantallaTab);
      pant.position.set(0.06, -0.25, 0.10);
      pant.rotation.x = 0.3;
      brI.codo.add(tab, pant);
      brD.hombro.rotation.set(-0.55, 0, 0.20);
      brD.codo.rotation.set(-0.75, -0.2, 0);
    } else if (rol === 1) {
      // Operario con jalón topográfico blanco/rojo de inspección
      brI.hombro.rotation.set(0.05, 0, -0.14);
      brI.codo.rotation.set(-0.22, 0, 0);
      brD.hombro.rotation.set(-0.42, 0, 0.12);
      brD.codo.rotation.set(-0.85, 0, 0);
      const jalon = new THREE.Group();
      jalon.position.set(0.02, -0.26, 0.04);
      jalon.rotation.x = 0.38;
      for (let s = 0; s < 5; s++) {
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.016, 0.34, 8),
          s % 2 === 0 ? matCascoBlanco : matPilotoCoche,
        );
        seg.position.y = -0.35 + s * 0.34;
        jalon.add(seg);
      }
      brD.codo.add(jalon);
    } else {
      // Operario conversando / observando la vía
      brI.hombro.rotation.set(-0.18, 0, -0.18);
      brI.codo.rotation.set(-0.65, 0.2, 0);
      brD.hombro.rotation.set(-0.22, 0, 0.16);
      brD.codo.rotation.set(-0.55, -0.15, 0);
    }

    grpTorso.add(brI.hombro, brD.hombro);
    t.add(grpTorso);
    t.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
    t.userData = {
      capa: 'Mantenimiento ferroviario',
      nombre: rol === 0 ? 'Encargado de mantenimiento (Adif)' : 'Operario de mantenimiento de vía',
      info: 'Personal técnico con equipo de protección individual (chaleco reflectante EN ISO 20471, casco y botas de seguridad) situado fuera del vallado perimetral.',
      grpTorso,
      grpCabeza,
      brazoDer: brD.hombro,
      codoDer: brD.codo,
      brazoBaseX: brD.hombro.rotation.x,
      codoBaseX: brD.codo.rotation.x,
      fase: Math.random() * Math.PI * 2,
    };
    return t;
  }

  function crearCuadrilla(pk, lado, off, tamano, fija = false) {
    const cantidad = tamano === 3 ? 3 : 2; // Siempre en pareja (2) o grupo de tres (3)
    const grupoC = new THREE.Group();
    const miembros = [];
    const offsetsLocales = cantidad === 2
      ? [{ dx: -0.52, dz: -0.18, yaw: 1.05 }, { dx: 0.52, dz: 0.18, yaw: -2.05 }]
      : [{ dx: -0.62, dz: -0.25, yaw: 0.72 }, { dx: 0.60, dz: -0.22, yaw: -0.82 }, { dx: 0.02, dz: 0.66, yaw: 3.05 }];
    for (let i = 0; i < cantidad; i++) {
      const m = crearTrabajador(i);
      m.position.set(offsetsLocales[i].dx, 0, offsetsLocales[i].dz);
      m.rotation.y = offsetsLocales[i].yaw;
      grupoC.add(m);
      miembros.push({ mesh: m, dx: offsetsLocales[i].dx, dz: offsetsLocales[i].dz, yawBase: offsetsLocales[i].yaw });
    }
    grupoTrabajadores.add(grupoC);
    return { pk, lado, off, fija, grupo: grupoC, miembros, pkColocado: NaN };
  }

  const cuadrillas = [
    crearCuadrilla(436220, 1, 15.6, 2, true),
    crearCuadrilla(437160, -1, 15.8, 3, true),
    crearCuadrilla(438120, 1, 15.5, 2, true),
    crearCuadrilla(444660, -1, 16.0, 3, true),
    crearCuadrilla(374450, 1, 15.6, 2, false),
    crearCuadrilla(405300, -1, 15.8, 3, false),
    crearCuadrilla(454150, 1, 15.7, 2, false),
    crearCuadrilla(464350, -1, 15.6, 3, false),
  ];
  grupo.add(grupoTrabajadores);

  const archivosRoles = [
    './modelos/trabajador_encargado.glb',
    './modelos/trabajador_operario.glb',
    './modelos/trabajador_observador.glb',
  ];
  archivosRoles.forEach((ruta, rolIdx) => {
    gltfLoader.load(ruta, (gltf) => {
      for (const q of cuadrillas) {
        for (let i = 0; i < q.miembros.length; i++) {
          if (i % 3 !== rolIdx) continue;
          const m = q.miembros[i];
          const modeloBl = gltf.scene.clone(true);
          const ud = m.mesh.userData;
          modeloBl.traverse((n) => {
            if (n.isMesh) {
              n.castShadow = true;
              n.receiveShadow = true;
              n.userData = ud;
            }
          });
          m.mesh.clear();
          m.mesh.add(modeloBl);
          ud.modeloBlender = modeloBl;
          ud.grpTorso = null;
          ud.grpCabeza = null;
          ud.brazoDer = null;
          ud.codoDer = null;
        }
      }
    }, undefined, () => {});
  });

  let tAnimTrab = 0;
  function actualizarCuadrillas(dt, pkObs) {
    tAnimTrab += dt;
    for (let i = 0; i < cuadrillas.length; i++) {
      const q = cuadrillas[i];
      if (!q.fija && Math.abs(q.pk - pkObs) > 2200) {
        const signo = (i % 2 === 0 ? 1 : -1);
        const cand = Math.max(Eje3D.pkIni + 180, Math.min(Eje3D.pkFin - 750, pkObs + signo * (280 + (i * 137) % 620)));
        const pCand = Eje3D.enPk(cand);
        if (!pCand.enTunel && !pCand.enViaducto) {
          q.pk = cand;
          q.pkColocado = NaN;
        }
      }
      const p = Eje3D.enPk(q.pk);
      if (p.enTunel || p.enViaducto) {
        q.grupo.visible = false;
        continue;
      }
      q.grupo.visible = true;
      if (q.pkColocado !== q.pk) {
        q.pkColocado = q.pk;
        q.eBase = p.E + (-p.ty) * q.lado * q.off;
        q.nBase = p.N + p.tx * q.lado * q.off;
        q.zBase = cotaTerrenoUTM(q.eBase, q.nBase);
        const wBase = W(q.eBase, q.nBase, q.zBase);
        for (const m of q.miembros) {
          const eM = q.eBase + p.tx * m.dx + (-p.ty) * m.dz;
          const nM = q.nBase + p.ty * m.dx + p.tx * m.dz;
          const zM = cotaTerrenoUTM(eM, nM);
          const wM = W(eM, nM, zM);
          m.mesh.position.copy(wM).sub(wBase);
        }
      }
      q.grupo.position.copy(W(q.eBase, q.nBase, q.zBase));
      for (const m of q.miembros) {
        const ud = m.mesh.userData;
        const f = ud.fase;
        if (ud.modeloBlender) {
          ud.modeloBlender.rotation.y = Math.sin(tAnimTrab * 0.75 + f) * 0.10;
        } else {
          if (ud.grpTorso) ud.grpTorso.rotation.x = Math.sin(tAnimTrab * 1.1 + f) * 0.025;
          if (ud.grpCabeza) ud.grpCabeza.rotation.y = Math.sin(tAnimTrab * 0.85 + f * 1.3) * 0.24;
          if (ud.brazoDer) ud.brazoDer.rotation.x = ud.brazoBaseX + Math.sin(tAnimTrab * 1.7 + f) * 0.12;
          if (ud.codoDer) ud.codoDer.rotation.x = ud.codoBaseX + Math.cos(tAnimTrab * 1.7 + f) * 0.10;
        }
      }
    }
  }

  return {
    actualizar(dt, { camara, pkObs, modoClima, enTunel, enCabina }) {
      actualizarLluvia(dt, camara.position, modoClima, enTunel, enCabina);
      actualizarNieve(dt, camara.position, modoClima, enTunel);
      actualizarCielo(dt, camara.position, enTunel);
      actualizarCoches(dt, pkObs);
      actualizarCuadrillas(dt, pkObs);
    },
  };
}
