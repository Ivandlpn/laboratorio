// Módulo de realismo UX y UI para Visor3D:
// UX 1: Colisión con terreno MDT | UX 2: Salto a báculos CCTV | UX 3: Vuelo parabólico
// UX 4: Efecto cabina (peralte, vibración, exposición túnel) | UX 5: Clima y atmósfera
// UI 3: Inspector flotante 3D | UI 5: Brújula Norte real + altitud + escala gráfica dinámica

export const CLIMAS = {
  despejado: { nombre: 'Despejado', fogNear: 1950, fogFar: 11200, fogColor: null, solMult: 1.0, hemiMult: 1.0, railRough: 0.24 },
  bruma:     { nombre: 'Calima',    fogNear: 780,  fogFar: 5200,  fogColor: '#d9d3c7', solMult: 0.86, hemiMult: 1.05, railRough: 0.26 },
  nublado:   { nombre: 'Nublado',   fogNear: 950,  fogFar: 6400,  fogColor: '#b9c6d4', solMult: 0.56, hemiMult: 1.25, railRough: 0.28 },
  lluvia:    { nombre: 'Lluvia',    fogNear: 420,  fogFar: 3100,  fogColor: '#8d9dad', solMult: 0.38, hemiMult: 1.15, railRough: 0.11 },
  nieve:     { nombre: 'Nieve',     fogNear: 340,  fogFar: 2600,  fogColor: '#d8e2ec', solMult: 0.48, hemiMult: 1.32, railRough: 0.18 },
  tormenta:  { nombre: 'Tormenta',  fogNear: 260,  fogFar: 2000,  fogColor: '#4b5563', solMult: 0.22, hemiMult: 0.85, railRough: 0.08 },
};

// UX 1: Evita que la cámara libre atraviese el terreno MDT LiDAR (salvo en modo Rayos X o dentro de túnel)
export function aplicarColisionTerreno({ camara, controles, cotaTerrenoUTM, UTMdeMundo, Eje3D, pkObservado, rayosX }) {
  if (rayosX) return;
  const pEje = Eje3D.enPk(pkObservado);
  if (pEje.enTunel) return;

  const camU = UTMdeMundo(camara.position);
  const zSueloCam = cotaTerrenoUTM(camU.E, camU.N);
  if (Number.isFinite(zSueloCam)) {
    const yMinCam = (zSueloCam - camU.Z + camara.position.y) + 1.65;
    if (camara.position.y < yMinCam) {
      camara.position.y += (yMinCam - camara.position.y) * 0.45;
    }
  }

  const tgtU = UTMdeMundo(controles.target);
  const zSueloTgt = cotaTerrenoUTM(tgtU.E, tgtU.N);
  if (Number.isFinite(zSueloTgt)) {
    const yMinTgt = (zSueloTgt - tgtU.Z + controles.target.y) - 1.5;
    if (controles.target.y < yMinTgt) {
      controles.target.y += (yMinTgt - controles.target.y) * 0.45;
    }
  }
}

// UX 3: Gestor de vuelos parabólicos suaves entre PKs / hitos / activos
export function crearGestorVuelo({ camara, controles, Eje3D, origen, W, recentrarOrigen, gestionarStreaming, bloquesTerreno, procesarColaTerreno, actualizarUI, onTunelDestino }) {
  let vuelo = null;

  function cancelar() { vuelo = null; }

  function poseParaPk(pk, modoVista) {
    const p = Eje3D.enPk(pk);
    const nx = -p.ty, ny = p.tx;
    let objE = p.E, objN = p.N, objZ = p.Z + 1.2;
    let posE = p.E + nx * 56 - p.tx * 78, posN = p.N + ny * 56 - p.ty * 78, posZ = p.Z + 25;
    if (modoVista === 'aerea') {
      objZ = p.Z;
      posE = p.E + nx * 210 - p.tx * 240; posN = p.N + ny * 210 - p.ty * 240; posZ = p.Z + 148;
    } else if (modoVista === 'cerca') {
      objE = p.E + p.tx * 36; objN = p.N + p.ty * 36; objZ = p.Z + 2.0;
      posE = p.E + nx * 5.8 - p.tx * 16; posN = p.N + ny * 5.8 - p.ty * 16; posZ = p.Z + 2.65;
    } else if (modoVista === 'lateral') {
      objZ = p.Z + 3.0;
      posE = p.E + nx * 92; posN = p.N + ny * 92; posZ = p.Z + 14;
    } else {
      objE = p.E + p.tx * 22; objN = p.N + p.ty * 22;
    }
    return { p, posE, posN, posZ, objE, objN, objZ };
  }

  function volarAPose({ posE, posN, posZ, objE, objN, objZ, pk = null, inmediato = false, duracion = null }) {
    const pRef = pk !== null ? Eje3D.enPk(pk) : Eje3D.proyUTM(objE, objN);
    if (pRef.enTunel && onTunelDestino) onTunelDestino(true);
    if (pk !== null) gestionarStreaming(pk);

    if (inmediato) {
      vuelo = null;
      if (Math.hypot(objE - origen.E, objN - origen.N) > 2500) recentrarOrigen(objE, objN, objZ);
      if (bloquesTerreno.size < 9) procesarColaTerreno(true);
      camara.position.copy(W(posE, posN, posZ));
      controles.target.copy(W(objE, objN, objZ));
      controles.update();
      if (pk !== null) actualizarUI(pk);
      return;
    }

    const p0 = camara.position.clone();
    const t0 = controles.target.clone();
    // Recentramos en destino antes de interpolar para evitar saltos de precisión en vuelos largos
    if (Math.hypot(objE - origen.E, objN - origen.N) > 2500) {
      const dE = objE - origen.E, dN = objN - origen.N, dZ = objZ - origen.Z;
      recentrarOrigen(objE, objN, objZ);
      p0.x -= dE; p0.y -= dZ; p0.z += dN;
      t0.x -= dE; t0.y -= dZ; t0.z += dN;
    }
    if (bloquesTerreno.size < 9) procesarColaTerreno(true);

    const p1 = W(posE, posN, posZ);
    const t1 = W(objE, objN, objZ);
    const dist = p0.distanceTo(p1);
    const dur = duracion ?? Math.max(480, Math.min(1550, 420 + dist * 0.25));
    const arco = dist > 220 ? Math.min(420, dist * 0.14) : 0;

    vuelo = { tIni: performance.now(), dur, p0, t0, p1, t1, arco, pk };
  }

  function actualizar(ahora) {
    if (!vuelo) return false;
    const k = Math.min(1, (ahora - vuelo.tIni) / vuelo.dur);
    const s = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camara.position.lerpVectors(vuelo.p0, vuelo.p1, s);
    camara.position.y += Math.sin(k * Math.PI) * vuelo.arco;
    controles.target.lerpVectors(vuelo.t0, vuelo.t1, s);
    controles.update();
    if (k >= 1) {
      const pkFin = vuelo.pk;
      vuelo = null;
      if (pkFin !== null) actualizarUI(pkFin);
    }
    return true;
  }

  return {
    poseParaPk,
    volarAPose,
    actualizar,
    cancelar,
    get activo() { return Boolean(vuelo); },
  };
}

// UX 4: Micro-vibración de rodadura, inclinación en curvas (peralte), cabeceo y onda de presión en cruces
export function crearEfectoCabina() {
  let fase = 0;
  let rollSuave = 0;
  let pitchSuave = 0;
  let expActual = null;
  let sacudidaCruce = 0;

  function actualizar({ camara, Eje3D, pk, sentido, multVel, dt, reducido, pausado, enTunel, render, expBase }) {
    // Transición suave de exposición al entrar o salir de túnel
    const expObj = enTunel ? Math.min(1.42, expBase * 1.24) : expBase;
    if (expActual === null) expActual = expObj;
    expActual += (expObj - expActual) * Math.min(1, dt * 3.5);
    render.toneMappingExposure = expActual;

    // Curvatura del trazado para simular peralte suave
    const pA = Eje3D.enPk(Math.max(Eje3D.pkIni, pk - 24));
    const pB = Eje3D.enPk(Math.min(Eje3D.pkFin, pk + 24));
    const cross = (pA.tx * pB.ty - pA.ty * pB.tx) * sentido;
    const rollObj = reducido ? 0 : Math.max(-0.038, Math.min(0.038, cross * 2.4));
    rollSuave += (rollObj - rollSuave) * Math.min(1, dt * 4.5);

    // Cabeceo por rasante (pendientes y aceleración)
    const pendiente = (pB.Z - pA.Z) / 48.0;
    const pitchObj = reducido ? 0 : Math.max(-0.024, Math.min(0.024, pendiente * 0.8));
    pitchSuave += (pitchObj - pitchSuave) * Math.min(1, dt * 3.2);

    const dir = camara.getWorldDirection(new camara.position.constructor());
    const right = new camara.position.constructor().crossVectors(dir, { x: 0, y: 1, z: 0 }).normalize();
    camara.up.set(0, 1, 0).addScaledVector(right, rollSuave).normalize();

    // Micro-vibración sutil proporcional a la velocidad y amortiguación de onda de presión en cruce
    if (!reducido && !pausado) {
      const amp = Math.min(0.016, 0.004 + multVel * 0.0016) + sacudidaCruce * 0.035;
      fase += dt * (18 + multVel * 5);
      camara.position.y += Math.sin(fase) * amp;
      camara.position.x += Math.cos(fase * 0.63) * (amp * 0.5) + (Math.sin(fase * 2.1) * sacudidaCruce * 0.025);
    }
    if (sacudidaCruce > 0) {
      sacudidaCruce = Math.max(0, sacudidaCruce - dt * 1.8);
    }
  }

  function sacudirPorCruce() {
    sacudidaCruce = 1.0;
  }

  function reiniciar(camara) {
    rollSuave = 0;
    pitchSuave = 0;
    sacudidaCruce = 0;
    expActual = null;
    camara.up.set(0, 1, 0);
  }

  return { actualizar, sacudirPorCruce, reiniciar };
}

// UI 5: Actualiza brújula (Norte real), altitud de cámara y barra de escala dinámica
export function actualizarBrujulaYEscala({ THREE, camara, controles, UTMdeMundo, flecha, elAlt, elEscalaBarra, elEscalaTxt }) {
  const dirCam = new THREE.Vector3();
  camara.getWorldDirection(dirCam);
  // En nuestro sistema de mundo: +X = Este, -Z = Norte (por tanto +Z = Sur).
  // El ángulo hacia el Norte (-Z) respecto a la vista actual es atan2(dirCam.x, -dirCam.z)
  const azimutNorteDeg = (Math.atan2(dirCam.x, -dirCam.z) * 180) / Math.PI;
  if (flecha) flecha.style.transform = `rotate(${-azimutNorteDeg.toFixed(1)}deg)`;

  if (elAlt) {
    const camU = UTMdeMundo(camara.position);
    elAlt.textContent = `${Math.max(0, Math.round(camU.Z))} m`;
  }

  if (elEscalaBarra && elEscalaTxt) {
    const dist = camara.position.distanceTo(controles.target);
    const vH = 2 * Math.tan((camara.fov * Math.PI) / 360) * dist;
    const mPorPx = vH / Math.max(200, window.innerHeight);
    const mObj = mPorPx * 64;
    const pasos = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    let m = pasos[0];
    for (const p of pasos) if (p <= mObj * 1.35) m = p;
    const px = Math.max(24, Math.min(96, Math.round(m / (mPorPx || 1))));
    elEscalaBarra.style.width = `${px}px`;
    elEscalaTxt.textContent = m >= 1000 ? `${(m / 1000).toFixed(m % 1000 ? 1 : 0)} km` : `${m} m`;
  }
}
