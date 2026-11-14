import * as THREE from 'three';

// Vida dinámica de la escena: lluvia, nieve, tormenta con relámpagos, pájaros, aviones y coches blancos de servicio
export function crearVidaEscena({ escena, Eje3D, W, cotaTerrenoUTM, caminosPorKm }) {
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
  const matFuselaje = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.2 });
  const matEstela = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false });
  const matBaliza = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const aviones = [];
  for (let i = 0; i < 3; i++) {
    const av = new THREE.Group();
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 16, 8).rotateZ(Math.PI / 2), matFuselaje);
    const ala = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 16), matFuselaje);
    ala.position.set(1.0, 0, 0);
    const cola = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.2), matFuselaje);
    cola.position.set(-6.8, 1.4, 0);
    const estela = new THREE.Mesh(new THREE.PlaneGeometry(240, 2.0).rotateX(-Math.PI / 2), matEstela);
    estela.position.set(-128, 0, 0);
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 6), matBaliza);
    luz.position.set(0, 0.6, 0);
    av.add(fus, ala, cola, estela, luz);
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

  // ---- 4. Coches blancos de servicio conduciendo por los caminos paralelos ----
  const grupoCoches = new THREE.Group();
  const matBlanco = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.38, metalness: 0.15 });
  const matCristal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.15, metalness: 0.65 });
  const matRueda = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
  const matFaroCoche = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  const matPilotoCoche = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  function crearCocheBlanco() {
    const g = new THREE.Group();
    const chasis = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 1.85), matBlanco);
    chasis.position.y = 0.62;
    const cabina = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.62, 1.68), matBlanco);
    cabina.position.set(-0.2, 1.24, 0);
    const parabrisas = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.48, 1.56), matCristal);
    parabrisas.position.set(-0.2, 1.22, 0);
    g.add(chasis, cabina, parabrisas);
    for (const sx of [-1.35, 1.35]) {
      for (const sz of [-0.88, 0.88]) {
        const r = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 12).rotateX(Math.PI / 2), matRueda);
        r.position.set(sx, 0.36, sz);
        g.add(r);
      }
    }
    for (const sz of [-0.62, 0.62]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.28), matFaroCoche);
      f.position.set(2.2, 0.68, sz);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.26), matPilotoCoche);
      p.position.set(-2.2, 0.68, sz);
      g.add(f, p);
    }
    g.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
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
    }
  }

  // ---- 5. Cuadrillas de trabajadores con chaleco amarillo fuera del vallado (parejas o tríos) ----
  const grupoTrabajadores = new THREE.Group();
  const matChaleco = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55, metalness: 0.08, emissive: 0x3b2f00, emissiveIntensity: 0.12 });
  const matBandaRefl = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.22, metalness: 0.72 });
  const matPantalon = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const matPiel = new THREE.MeshStandardMaterial({ color: 0xe2b18c, roughness: 0.75 });
  const matCascoBlanco = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.1 });
  const matCascoAmarillo = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.35, metalness: 0.1 });
  const matBota = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

  const gPierna = new THREE.CylinderGeometry(0.085, 0.072, 0.78, 8);
  const gBota = new THREE.BoxGeometry(0.14, 0.10, 0.24);
  const gTorso = new THREE.CylinderGeometry(0.19, 0.17, 0.56, 10);
  const gBanda = new THREE.CylinderGeometry(0.196, 0.186, 0.06, 10);
  const gBrazo = new THREE.CylinderGeometry(0.055, 0.048, 0.48, 8);
  const gCabeza = new THREE.SphereGeometry(0.115, 10, 8);
  const gCasco = new THREE.SphereGeometry(0.132, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const gVisera = new THREE.BoxGeometry(0.18, 0.025, 0.10);

  function crearTrabajador(conCascoBlanco = false) {
    const t = new THREE.Group();
    for (const sx of [-0.095, 0.095]) {
      const p = new THREE.Mesh(gPierna, matPantalon);
      p.position.set(sx, 0.44, 0);
      const b = new THREE.Mesh(gBota, matBota);
      b.position.set(sx, 0.05, 0.04);
      t.add(p, b);
    }
    const torso = new THREE.Mesh(gTorso, matChaleco);
    torso.position.y = 1.11;
    const banda1 = new THREE.Mesh(gBanda, matBandaRefl);
    banda1.position.y = 1.00;
    const banda2 = new THREE.Mesh(gBanda, matBandaRefl);
    banda2.position.y = 1.18;

    const brazoIzq = new THREE.Mesh(gBrazo, matChaleco);
    brazoIzq.position.set(-0.24, 1.08, 0);
    brazoIzq.rotation.z = 0.12;
    const brazoDer = new THREE.Mesh(gBrazo, matChaleco);
    brazoDer.position.set(0.24, 1.08, 0);
    brazoDer.rotation.z = -0.12;

    const cabeza = new THREE.Mesh(gCabeza, matPiel);
    cabeza.position.y = 1.52;
    const matC = conCascoBlanco ? matCascoBlanco : matCascoAmarillo;
    const casco = new THREE.Mesh(gCasco, matC);
    casco.position.y = 1.56;
    const visera = new THREE.Mesh(gVisera, matC);
    visera.position.set(0, 1.565, 0.11);

    t.add(torso, banda1, banda2, brazoIzq, brazoDer, cabeza, casco, visera);
    t.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
    t.userData = {
      capa: 'Mantenimiento ferroviario',
      nombre: 'Equipo de mantenimiento de vía',
      info: 'Trabajadores de mantenimiento con chaleco amarillo de alta visibilidad y casco de seguridad situados fuera del vallado perimetral.',
      brazoDer,
      fase: Math.random() * Math.PI * 2,
    };
    return t;
  }

  function crearCuadrilla(pk, lado, off, tamano, fija = false) {
    const cantidad = tamano === 3 ? 3 : 2; // Siempre en pareja (2) o grupo de tres (3)
    const grupoC = new THREE.Group();
    const miembros = [];
    const offsetsLocales = cantidad === 2
      ? [{ dx: -0.48, dz: -0.18, yaw: 0.9 }, { dx: 0.48, dz: 0.18, yaw: -2.2 }]
      : [{ dx: -0.58, dz: -0.25, yaw: 0.7 }, { dx: 0.56, dz: -0.22, yaw: -0.8 }, { dx: 0.02, dz: 0.62, yaw: 3.05 }];
    for (let i = 0; i < cantidad; i++) {
      const m = crearTrabajador(i === 0);
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
        const b = m.mesh.userData.brazoDer;
        if (b) b.rotation.x = Math.sin(tAnimTrab * 1.9 + m.mesh.userData.fase) * 0.16;
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
