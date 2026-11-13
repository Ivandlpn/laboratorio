import * as THREE from 'three';

const LIBREAS_L042 = {
  renfe: { cuerpo: '#f5f7fa', franja: '#70205a', nombre: 'Tren Renfe AVE S-112 (L042)' },
  iryo:  { cuerpo: '#c8102e', franja: '#cbd5e1', nombre: 'Tren Iryo ETR-1000 (L042)' },
  ouigo: { cuerpo: '#f4f5f6', franja: '#e6007e', nombre: 'Tren Ouigo Euroduplex (L042)' },
  avlo:  { cuerpo: '#8a2c86', franja: '#2ec4e8', nombre: 'Tren Renfe Avlo S-112 (L042)' },
};

const DIST_BOGIE = 5.85; // Semidistancia entre pivotes de bogie (11,70 m entre centros)

function crearTexturaLateralOperador(marca) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
  const x = cv.getContext('2d');
  if (window.Trenes3D?.logo) {
    window.Trenes3D.logo(x, marca === 'avlo' ? 'renfe' : marca, 256, 30, 28, marca === 'iryo' || marca === 'avlo', null);
  }
  if (marca === 'renfe') {
    x.fillStyle = '#70205a'; x.font = '800 18px sans-serif'; x.textAlign = 'center'; x.fillText('AVE', 108, 76);
  } else if (marca === 'ouigo') {
    x.fillStyle = '#1fb7c9'; x.beginPath(); x.arc(76, 56, 26, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(436, 56, 26, 0, Math.PI * 2); x.fill();
  } else if (marca === 'avlo') {
    x.fillStyle = '#2ec4e8'; x.font = '800 22px sans-serif'; x.textAlign = 'center'; x.fillText('avlo', 390, 34);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: t, transparent: true, roughness: 0.35, metalness: 0.1,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
}

function crearMatSombraTren() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64;
  const x = cv.getContext('2d');
  const g = x.createRadialGradient(64, 32, 6, 64, 32, 58);
  g.addColorStop(0.0, 'rgba(8, 12, 18, 0.68)');
  g.addColorStop(0.62, 'rgba(8, 12, 18, 0.38)');
  g.addColorStop(1.0, 'rgba(8, 12, 18, 0.0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 64);
  const t = new THREE.CanvasTexture(cv);
  return new THREE.MeshBasicMaterial({
    map: t, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  });
}

export function crearFlota({ escena, Eje3D, W, mat, matFoco, matPilotoRojo, pkArranque }) {
  const grupoFlota = new THREE.Group();
  escena.add(grupoFlota);
  const matSombraTren = crearMatSombraTren();

  function crearModeloTren(nCoches = 6, marca = 'renfe') {
    const lib = LIBREAS_L042[marca] || LIBREAS_L042.renfe;
    const tren = new THREE.Group();
    const matBlanco = mat(lib.cuerpo, 1, { roughness: 0.20, metalness: 0.18 });
    const matFranja = mat(lib.franja, 1, { roughness: 0.28, metalness: 0.24 });
    const matRotulo = crearTexturaLateralOperador(marca);
    const gRotulo = new THREE.PlaneGeometry(15.6, 2.2);
    const matPlata = mat('#cbd5e1', 1, { roughness: 0.26, metalness: 0.68 });
    const matAceroRueda = mat('#dce3ec', 1, { roughness: 0.18, metalness: 0.88 });
    const matBastidorBogie = mat('#1e232b', 1, { roughness: 0.64, metalness: 0.45 });
    const matVent = mat('#0b1324', 1, { roughness: 0.08, metalness: 0.62 });
    const matBajos = mat('#252a33', 1, { roughness: 0.68, metalness: 0.30 });
    const matFuelle = mat('#16191f', 1, { roughness: 0.88, metalness: 0.05 });
    const matPanto = mat('#64748b', 1, { roughness: 0.30, metalness: 0.80 });

    const gSombra = new THREE.PlaneGeometry(18.2, 3.35);
    gSombra.rotateX(-Math.PI / 2);
    const gCaja = new THREE.BoxGeometry(17.4, 2.86, 2.94);
    const gTecho = new THREE.CylinderGeometry(1.42, 1.47, 17.4, 12, 1, false, 0, Math.PI);
    gTecho.rotateZ(Math.PI / 2); gTecho.rotateX(-Math.PI / 2);
    const gBajos = new THREE.BoxGeometry(16.9, 0.72, 2.68);
    const gVent = new THREE.BoxGeometry(14.8, 0.66, 2.98);
    const gFranja = new THREE.BoxGeometry(17.44, 0.28, 2.97);
    const gFilete = new THREE.BoxGeometry(17.44, 0.08, 2.975);
    const gCarenado = new THREE.BoxGeometry(4.2, 0.24, 1.65);
    const gFuelle = new THREE.BoxGeometry(0.98, 2.62, 2.66);
    const gMorro = new THREE.ConeGeometry(1.46, 6.8, 16);
    gMorro.rotateZ(-Math.PI / 2); gMorro.scale(1, 0.74, 0.98);
    const gQuitanieves = new THREE.BoxGeometry(1.15, 0.34, 2.52);
    const gParabrisas = new THREE.BoxGeometry(2.1, 0.68, 2.22);
    gParabrisas.rotateZ(-0.28);
    const gLuz = new THREE.SphereGeometry(0.16, 8, 6);

    const gLarguero = new THREE.BoxGeometry(2.92, 0.26, 0.18);
    const gTravesano = new THREE.BoxGeometry(0.46, 0.24, 2.08);
    const gCajaGrasa = new THREE.BoxGeometry(0.34, 0.30, 0.22);
    const gEje = new THREE.CylinderGeometry(0.082, 0.082, 2.04, 10);
    gEje.rotateX(Math.PI / 2);
    const gRueda = new THREE.CylinderGeometry(0.46, 0.46, 0.135, 18);
    gRueda.rotateX(Math.PI / 2);
    const gPestana = new THREE.CylinderGeometry(0.495, 0.495, 0.028, 18);
    gPestana.rotateX(Math.PI / 2);

    function crearBogie() {
      const b = new THREE.Group();
      for (const sZ of [-1, 1]) {
        const larg = new THREE.Mesh(gLarguero, matBastidorBogie);
        larg.position.set(0, 0.54, sZ * 0.98);
        b.add(larg);
      }
      const trav = new THREE.Mesh(gTravesano, matBastidorBogie);
      trav.position.set(0, 0.60, 0);
      b.add(trav);
      for (const xEje of [-1.25, 1.25]) {
        const eje = new THREE.Mesh(gEje, matBastidorBogie);
        eje.position.set(xEje, 0.46, 0);
        b.add(eje);
        for (const sZ of [-1, 1]) {
          const rueda = new THREE.Mesh(gRueda, matAceroRueda);
          rueda.position.set(xEje, 0.46, sZ * 0.7175);
          const pest = new THREE.Mesh(gPestana, matAceroRueda);
          pest.position.set(xEje, 0.46, sZ * 0.652);
          const cg = new THREE.Mesh(gCajaGrasa, matBastidorBogie);
          cg.position.set(xEje, 0.48, sZ * 0.98);
          b.add(rueda, pest, cg);
        }
      }
      return b;
    }

    function crearPantografo() {
      const p = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 1.4), matPanto);
      base.position.set(0, 3.14, 0);
      const brazoInf = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.07, 0.09), matPanto);
      brazoInf.position.set(-0.36, 3.55, 0);
      brazoInf.rotation.z = -0.48;
      const brazoSup = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.06, 0.07), matPanto);
      brazoSup.position.set(-0.28, 4.08, 0);
      brazoSup.rotation.z = 0.44;
      const mesilla = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.048, 1.72), matPlata);
      mesilla.position.set(0.38, 4.456, 0);
      p.add(base, brazoInf, brazoSup, mesilla);
      return p;
    }

    const coches = [];
    for (let i = 0; i < nCoches; i++) {
      const c = new THREE.Group();
      const esMotriz = i === 0 || i === nCoches - 1;
      const sombra = new THREE.Mesh(gSombra, matSombraTren);
      sombra.position.y = 0.008;
      const bog1 = crearBogie(); bog1.position.set(DIST_BOGIE, 0, 0);
      const bog2 = crearBogie(); bog2.position.set(-DIST_BOGIE, 0, 0);
      c.add(sombra, bog1, bog2);

      const carroceria = new THREE.Group();
      carroceria.position.y = 0.80;
      const caja = new THREE.Mesh(gCaja, matBlanco); caja.position.y = 1.36; caja.castShadow = true;
      const techo = new THREE.Mesh(gTecho, matPlata); techo.position.y = 2.32;
      const bajos = new THREE.Mesh(gBajos, matBajos); bajos.position.y = 0.08;
      const franja = new THREE.Mesh(gFranja, matFranja); franja.position.y = 0.86;
      const filete = new THREE.Mesh(gFilete, matPlata); filete.position.y = 1.04;
      const carenado = new THREE.Mesh(gCarenado, matPlata); carenado.position.y = 3.10;
      carroceria.add(caja, techo, bajos, franja, filete, carenado);

      if (!esMotriz) {
        const vent = new THREE.Mesh(gVent, matVent); vent.position.y = 1.72;
        const rotD = new THREE.Mesh(gRotulo, matRotulo); rotD.position.set(0, 1.34, 1.485);
        const rotI = new THREE.Mesh(gRotulo, matRotulo); rotI.position.set(0, 1.34, -1.485); rotI.rotation.y = Math.PI;
        carroceria.add(vent, rotD, rotI);
      }
      if (i < nCoches - 1) {
        const fuelle = new THREE.Mesh(gFuelle, matFuelle);
        fuelle.position.set(-9.16, 1.32, 0);
        carroceria.add(fuelle);
      }
      if (esMotriz) {
        const s = i === 0 ? 1 : -1;
        const morro = new THREE.Mesh(gMorro, matBlanco);
        morro.position.set(s * 11.4, 0.76, 0);
        if (s < 0) morro.rotation.y = Math.PI;
        morro.castShadow = true;
        const quita = new THREE.Mesh(gQuitanieves, matBajos);
        quita.position.set(s * 11.35, -0.44, 0);
        const parab = new THREE.Mesh(gParabrisas, matVent);
        parab.position.set(s * 9.35, 1.70, 0);
        if (s < 0) parab.rotation.y = Math.PI;
        const matOptica = i === 0 ? matFoco : matPilotoRojo;
        const f1 = new THREE.Mesh(gLuz, matOptica), f2 = new THREE.Mesh(gLuz, matOptica);
        f1.position.set(s * 13.5, 0.58, 0.68);
        f2.position.set(s * 13.5, 0.58, -0.68);
        carroceria.add(morro, quita, parab, f1, f2);
        if (i === nCoches - 1) {
          const panto = crearPantografo();
          panto.position.set(2.2, 0, 0);
          carroceria.add(panto);
        }
      }
      c.add(carroceria);
      const ud = {
        capa: 'Circulación Alta Velocidad',
        nombre: lib.nombre,
        info: 'Composición de alta velocidad con bogies UIC 1.435 mm apoyados sobre cabeza de carril UIC 60, cinemática bicordal 3D y pantógrafo EAC-350 en contacto con el hilo a 5,30 m.',
      };
      c.userData = ud;
      carroceria.userData = ud;
      c.traverse((n) => { if (n.isMesh) n.userData = ud; });
      c.userData.bog1 = bog1;
      c.userData.bog2 = bog2;
      c.userData.carroceria = carroceria;
      tren.add(c);
      coches.push(c);
    }
    return { grupo: tren, coches };
  }

  const faroCabina = new THREE.SpotLight(0xfff5d6, 0, 260, 0.44, 0.45, 1.1);
  escena.add(faroCabina, faroCabina.target);

  const PARADAS_CORREDOR = [
    { pk: 435650, nombre: 'Villena AV', espera: 14 },
    { pk: 485800, nombre: 'Alicante-Terminal', espera: 16 },
  ];

  const flota = [
    { pk: pkArranque - 420, sentido: 1, velBase: 83.3, velActual: 69.4, viaSigno: -1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(6, 'renfe') },
    { pk: pkArranque + 320, sentido: -1, velBase: 83.3, velActual: 69.4, viaSigno: 1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(6, 'iryo') },
    { pk: 355400, sentido: 1, velBase: 83.3, velActual: 75.0, viaSigno: -1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(6, 'ouigo') },
    { pk: 465200, sentido: -1, velBase: 77.8, velActual: 66.0, viaSigno: 1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(6, 'avlo') },
  ];
  for (const tr of flota) grupoFlota.add(tr.modelo.grupo);

  function actualizarFlota(dt, pkTerminal) {
    const pkTope = Math.min(Eje3D.pkFin - 200, pkTerminal - 150);
    for (const tr of flota) {
      if (tr.paradaTimer > 0) {
        tr.paradaTimer = Math.max(0, tr.paradaTimer - dt);
        tr.velActual = 0;
        tr.estadoTxt = `Estacionado en ${tr.ultimaParada?.nombre || 'estación'} (${Math.ceil(tr.paradaTimer)} s)`;
        continue;
      }

      const vLimMs = (Eje3D.velocidadLimite ? Eje3D.velocidadLimite(tr.pk) : 300) / 3.6;
      let vObj = Math.min(tr.velBase, vLimMs);
      let proxParada = null;

      for (const par of PARADAS_CORREDOR) {
        const d = (par.pk - tr.pk) * tr.sentido;
        if (d >= -10 && d < 1200 && tr.ultimaParada !== par) {
          proxParada = par;
          if (d <= 12) {
            tr.paradaTimer = par.espera;
            tr.ultimaParada = par;
            tr.velActual = 0;
            vObj = 0;
          } else {
            // Curva parabólica de frenado confortable (0,55 m/s²)
            vObj = Math.min(vObj, Math.max(6, Math.sqrt(2 * 0.55 * d)));
          }
          break;
        }
      }
      if (tr.ultimaParada && Math.abs(tr.pk - tr.ultimaParada.pk) > 1600) {
        tr.ultimaParada = null;
      }

      if (tr.paradaTimer <= 0) {
        const acel = vObj > tr.velActual ? 0.52 : 0.72;
        if (tr.velActual < vObj) tr.velActual = Math.min(vObj, tr.velActual + acel * 12 * dt);
        else tr.velActual = Math.max(vObj, tr.velActual - acel * 12 * dt);

        tr.pk += tr.sentido * tr.velActual * dt;
        if (tr.pk > pkTope) { tr.pk = pkTope; tr.sentido = -1; tr.velActual = Math.min(tr.velActual, 22); }
        if (tr.pk < Eje3D.pkIni + 200) { tr.pk = Eje3D.pkIni + 200; tr.sentido = 1; tr.velActual = Math.min(tr.velActual, 22); }

        const kmh = Math.round(tr.velActual * 3.6);
        tr.estadoTxt = proxParada ? `Aproximación a ${proxParada.nombre} · ${kmh} km/h` : `En marcha · ${kmh} km/h`;
      }
      posicionarTren(tr);
    }
  }

  const _uX = new THREE.Vector3(), _uY = new THREE.Vector3(), _uZ = new THREE.Vector3(), _vUp = new THREE.Vector3(0, 1, 0), _matCoche = new THREE.Matrix4();
  function posicionarTren(tr) {
    const nC = tr.modelo.coches.length, PASO_C = 18.35;
    for (let i = 0; i < nC; i++) {
      const pkC = Math.max(Eje3D.pkIni + DIST_BOGIE + 1, Math.min(Eje3D.pkFin - DIST_BOGIE - 1, tr.pk - tr.sentido * (i - (nC - 1) * 0.5) * PASO_C));
      const pkDel = pkC + tr.sentido * DIST_BOGIE;
      const pkTras = pkC - tr.sentido * DIST_BOGIE;
      const pD = Eje3D.enPk(pkDel);
      const pT = Eje3D.enPk(pkTras);
      const pM = Eje3D.enPk(pkC);
      const offD = tr.viaSigno * (pD.sep * 0.5);
      const offT = tr.viaSigno * (pT.sep * 0.5);
      const wD = W(pD.E + (-pD.ty) * offD, pD.N + pD.tx * offD, pD.Z + 0.022);
      const wT = W(pT.E + (-pT.ty) * offT, pT.N + pT.tx * offT, pT.Z + 0.022);

      const coche = tr.modelo.coches[i];
      coche.position.copy(wD).add(wT).multiplyScalar(0.5);
      _uX.copy(wD).sub(wT).normalize();
      _uZ.crossVectors(_uX, _vUp).normalize();
      _uY.crossVectors(_uZ, _uX).normalize();
      _matCoche.makeBasis(_uX, _uY, _uZ);
      coche.quaternion.setFromRotationMatrix(_matCoche);

      const yawCuerda = Math.atan2(-_uX.z, _uX.x);
      const normAng = (a) => Math.atan2(Math.sin(a), Math.cos(a));
      if (coche.userData.bog1) coche.userData.bog1.rotation.y = normAng(Math.atan2(pD.ty * tr.sentido, pD.tx * tr.sentido) - yawCuerda);
      if (coche.userData.bog2) coche.userData.bog2.rotation.y = normAng(Math.atan2(pT.ty * tr.sentido, pT.tx * tr.sentido) - yawCuerda);
      if (coche.userData.carroceria) coche.userData.carroceria.rotation.x = -pM.peralte * tr.sentido * 0.55;
    }
  }
  for (const tr of flota) posicionarTren(tr);

  return { grupoFlota, flota, faroCabina, posicionarTren, actualizarFlota };
}
