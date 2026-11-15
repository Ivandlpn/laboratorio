import * as THREE from 'three';
import { crearInterior } from './interior.js';

// Pantalla del portátil del pasajero: captura de visorlav.web.app (no se puede incrustar: su CSP lo impide)
let texPantallaVisorLav = null;
const pantallaVisorLav = () => {
  if (!texPantallaVisorLav) {
    texPantallaVisorLav = new THREE.TextureLoader().load('./comun/texturas/visorlav.jpg');
    texPantallaVisorLav.colorSpace = THREE.SRGBColorSpace;
  }
  return texPantallaVisorLav;
};

const LIBREAS_L042 = {
  // Librea nueva de los AVE (2026): azul marino, puertas azul acero, ondas de bandas verticales y «AVE» en blanco
  ave:   { cuerpo: '#16294b', techo: '#1d3358', franja: '#a9bcd2', bajos: '#0e1626', nombre: 'Renfe AVE S-106 (Talgo Avril)' },
  avant: { cuerpo: '#f8fafc', techo: '#9aa5b4', franja: '#70205a', bajos: '#2b313b', nombre: 'Renfe Avant S-114' },
  iryo:  { cuerpo: '#b90e24', techo: '#22262e', franja: '#dce2ea', bajos: '#1b1f26', nombre: 'Iryo ETR-1000 (Frecciarossa)' },
  avlo:  { cuerpo: '#16294b', techo: '#1d3358', franja: '#5ee3b8', bajos: '#0e1626', nombre: 'Renfe Avlo S-106 (Talgo Avril)' },
  ouigo: { cuerpo: '#f8fafc', techo: '#cbd5e1', franja: '#00a8e8', bajos: '#242933', nombre: 'Ouigo España TGV Euroduplex (2 pisos)' },
};

const DIST_BOGIE_STD = 5.85;

function dibujarVentana(x, vx, vy, vw, vh, radio = 4) {
  x.beginPath();
  x.roundRect(vx, vy, vw, vh, radio);
  x.fillStyle = '#0e1726';
  x.fill();
  // Reflejo vítreo sutil
  const g = x.createLinearGradient(vx, vy, vx + vw, vy + vh);
  g.addColorStop(0, 'rgba(148, 197, 240, 0.26)');
  g.addColorStop(0.55, 'rgba(30, 58, 95, 0.08)');
  g.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
  x.fillStyle = g;
  x.fill();
  x.strokeStyle = 'rgba(203, 213, 225, 0.35)';
  x.lineWidth = 1.5;
  x.stroke();
}

function crearTexturaLateralCoche(tipo, esMotriz) {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 256;
  const x = cv.getContext('2d');
  const lib = LIBREAS_L042[tipo] || LIBREAS_L042.ave;

  // Fondo base de la carrocería
  x.fillStyle = lib.cuerpo;
  x.fillRect(0, 0, 1024, 256);

  // Faldón inferior oscuro
  x.fillStyle = lib.bajos;
  x.fillRect(0, 214, 1024, 42);

  if (tipo === 'avlo') {
    // Librea nueva Avlo (Talgo Avril): azul marino con grandes manchas redondeadas verde menta en los coches
    // y el rótulo «avlo» gigante en menta en las cabezas
    const MENTA = '#5ee3b8';
    const mancha = (mx, my, mw, mh, r, alfa = 1) => {
      x.globalAlpha = alfa; x.fillStyle = MENTA;
      x.beginPath(); x.roundRect(mx, my, mw, mh, r); x.fill(); x.globalAlpha = 1;
    };
    if (!esMotriz) {
      // Manchas de menta repartidas por el coche, algunas bajo la banda de ventanas
      mancha(110, 30, 220, 120, 40);
      mancha(300, 120, 140, 88, 44);
      mancha(470, 26, 90, 70, 35);
      mancha(600, 110, 200, 100, 50);
      mancha(820, 40, 80, 60, 30, 0.9);
      x.fillStyle = '#0a1222';
      x.beginPath(); x.roundRect(110, 62, 800, 62, 12); x.fill();
      for (let i = 0; i < 9; i++) dibujarVentana(x, 120 + i * 87, 66, 78, 54, 6);
      // Puertas en menta
      for (const px of [36, 932]) {
        mancha(px, 40, 56, 172, 6);
        x.fillStyle = '#16294b'; x.fillRect(px + 27, 46, 2, 160);
        dibujarVentana(x, px + 13, 64, 30, 50, 8);
      }
      x.save(); x.fillStyle = MENTA; x.font = '800 30px "Segoe UI", Arial, sans-serif'; x.textBaseline = 'middle';
      x.fillText('avlo', 470, 176); x.restore();
    } else {
      // Ventanilla pequeña junto a la cabina y el rótulo «avlo» ocupando casi todo el costado
      dibujarVentana(x, 860, 66, 100, 58, 10);
      x.save(); x.fillStyle = MENTA; x.textBaseline = 'middle';
      x.font = '800 168px "Segoe UI", "Arial Rounded MT Bold", Arial, sans-serif';
      try { x.letterSpacing = '-6px'; } catch { /* sin letterSpacing */ }
      x.fillText('avl', 260, 118);
      // La «o» del logotipo es un trazo curvo abierto por arriba
      const ox = 260 + x.measureText('avl').width + 52;
      x.strokeStyle = MENTA; x.lineWidth = 24; x.lineCap = 'round';
      x.beginPath(); x.arc(ox, 112, 36, Math.PI * 0.05, Math.PI * 0.95); x.stroke();
      x.beginPath(); x.moveTo(ox + 36, 112); x.lineTo(ox + 36, 72); x.stroke();
      x.restore();
    }
  } else if (tipo === 'ave') {
    // Librea nueva AVE (Talgo Avril S-106): azul marino, ondas de bandas verticales azul claro que crecen y menguan,
    // gran banda acristalada oscura, puertas azul acero y «AVE» en blanco
    const ondas = (x0, x1, fase) => {
      const n = Math.floor((x1 - x0) / 30);
      for (let i = 0; i < n; i++) {
        const t = i / Math.max(1, n - 1), bx = x0 + i * 30;
        const amp = Math.sin(Math.PI * t + fase);
        const top = 26 + 34 * (1 - amp), bot = 206 - 46 * (1 - Math.abs(Math.sin(Math.PI * t * 1.4 + fase)));
        const g = x.createLinearGradient(0, top, 0, bot);
        g.addColorStop(0, 'rgba(96, 132, 184, 0.85)');
        g.addColorStop(1, 'rgba(52, 84, 134, 0.85)');
        x.fillStyle = g;
        x.beginPath(); x.roundRect(bx, top, 22, bot - top, [2, 2, 11, 11]); x.fill();
      }
    };
    const puerta = (px) => {
      x.fillStyle = '#9fb4cc';
      x.beginPath(); x.roundRect(px, 40, 56, 172, 6); x.fill();
      x.strokeStyle = '#6f87a3'; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#16294b'; x.fillRect(px + 27, 46, 2, 160);
      dibujarVentana(x, px + 13, 64, 30, 50, 8);
    };
    const rotulo = (cx, cy, alto) => {
      // «AVE» con el trazo del logotipo nuevo (la A y la V partidas por una barra) en blanco
      x.save(); x.fillStyle = '#ffffff'; x.textAlign = 'left'; x.textBaseline = 'middle';
      x.font = `600 ${alto}px "Segoe UI", Arial, sans-serif`;
      try { x.letterSpacing = `${alto * 0.04}px`; } catch { /* sin letterSpacing */ }
      const w = x.measureText('AVE').width;
      x.fillText('AVE', cx - w / 2, cy);
      x.restore();
    };
    if (!esMotriz) {
      ondas(500, 920, 0.2);
      // Banda acristalada continua con las ventanillas
      x.fillStyle = '#0a1222';
      x.beginPath(); x.roundRect(110, 62, 800, 66, 12); x.fill();
      for (let i = 0; i < 9; i++) dibujarVentana(x, 120 + i * 87, 67, 78, 56, 6);
      puerta(36);
      puerta(932);
      rotulo(250, 176, 34);
    } else {
      ondas(120, 420, 0.6);
      // «renfe» grande en blanco con «AVE» debajo, como en el costado de las cabezas nuevas
      x.save(); x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = 'italic 700 58px "Segoe UI", Arial, sans-serif'; x.fillText('renfe', 590, 92);
      x.restore();
      rotulo(600, 146, 30);
      puerta(800);
      rotulo(930, 170, 34);
    }
  } else if (tipo === 'avant') {
    // Renfe Avant S-114: banda continua oscura + franja morada y gris
    x.fillStyle = '#70205a';
    x.fillRect(0, 150, 1024, 22);
    x.fillStyle = '#64748b';
    x.fillRect(0, 172, 1024, 9);
    if (!esMotriz) {
      x.fillStyle = '#0f172a';
      x.fillRect(116, 66, 792, 62);
      for (let i = 0; i < 9; i++) {
        dibujarVentana(x, 126 + i * 86, 70, 74, 54, 4);
      }
      for (const px of [34, 932]) {
        x.fillStyle = '#e2e8f0';
        x.fillRect(px, 48, 56, 162);
        x.strokeStyle = '#64748b';
        x.strokeRect(px, 48, 56, 162);
        dibujarVentana(x, px + 14, 68, 28, 54, 5);
      }
      x.fillStyle = '#70205a';
      x.font = '800 28px sans-serif';
      x.fillText('renfe', 395, 204);
      x.fillStyle = '#475569';
      x.font = '700 24px sans-serif';
      x.fillText('Avant', 485, 204);
    } else {
      x.fillStyle = '#70205a';
      x.font = '800 30px sans-serif';
      x.fillText('renfe Avant', 540, 204);
    }
  } else if (tipo === 'iryo') {
    // Iryo ETR-1000 Frecciarossa: rojo intenso, techo y banda negra continua, filetes plata
    x.fillStyle = '#22262e';
    x.fillRect(0, 0, 1024, 34);
    x.fillStyle = '#0c111b';
    x.fillRect(72, 62, 880, 68);
    x.fillStyle = '#e2e8f0';
    x.fillRect(0, 56, 1024, 5);
    x.fillRect(0, 131, 1024, 5);
    if (!esMotriz) {
      for (let i = 0; i < 9; i++) {
        dibujarVentana(x, 118 + i * 88, 67, 76, 58, 4);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        dibujarVentana(x, 130 + i * 92, 67, 76, 58, 4);
      }
    }
    // Puertas oscuras integradas
    for (const px of [24, 952]) {
      x.fillStyle = '#1b1f26';
      x.fillRect(px, 50, 48, 162);
      dibujarVentana(x, px + 12, 68, 24, 54, 4);
    }
    // Logo iryo blanco sobre rojo
    x.fillStyle = '#ffffff';
    x.font = '800 38px sans-serif';
    x.fillText('iryo', 472, 188);
  } else if (tipo === 'ouigo') {
    // Ouigo España TGV Euroduplex: blanco con turquesa y fucsia + 2 PISOS de ventanillas en remolques
    x.fillStyle = '#00a8e8';
    x.fillRect(0, 192, 1024, 22);
    // Burbujas decorativas características de Ouigo España
    x.fillStyle = '#e6007e';
    x.beginPath(); x.arc(170, 152, 22, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(855, 138, 18, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#00b4d8';
    x.beginPath(); x.arc(215, 168, 14, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(815, 158, 13, 0, Math.PI * 2); x.fill();

    if (!esMotriz) {
      // DOBLE PISO: fila superior + fila inferior de ventanillas
      for (let i = 0; i < 8; i++) {
        dibujarVentana(x, 136 + i * 94, 34, 72, 46, 7);   // piso superior
        dibujarVentana(x, 136 + i * 94, 124, 72, 46, 7);  // piso inferior
      }
      // Puerta rosa fucsia característica en piso inferior
      x.fillStyle = '#e6007e';
      x.fillRect(40, 106, 62, 106);
      dibujarVentana(x, 56, 122, 30, 44, 5);
      // Branding OUIGO
      x.fillStyle = '#00a8e8';
      x.font = '900 34px sans-serif';
      x.fillText('OUIGO', 446, 110);
    } else {
      // Motriz de 1 piso
      x.fillStyle = '#e6007e';
      x.fillRect(60, 140, 190, 52);
      x.fillStyle = '#334155';
      for (let i = 0; i < 4; i++) x.fillRect(280 + i * 115, 76, 84, 48);
      x.fillStyle = '#00a8e8';
      x.font = '900 36px sans-serif';
      x.fillText('OUIGO', 450, 180);
    }
  }

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({
    map: t,
    roughness: 0.24,
    metalness: 0.16,
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

function crearCajaCurvaSimetrica(largo, alto) {
  // Sección transversal simétrica y curva en ambos costados (-Z y +Z)
  const h = alto;
  const forma = new THREE.Shape();
  forma.moveTo(-1.26, 0);
  forma.lineTo(1.26, 0);
  forma.quadraticCurveTo(1.47, 0.02, 1.47, 0.28);
  forma.lineTo(1.47, h - 0.52);
  forma.quadraticCurveTo(1.47, h - 0.10, 1.02, h);
  forma.quadraticCurveTo(0, h + 0.12, -1.02, h);
  forma.quadraticCurveTo(-1.47, h - 0.10, -1.47, h - 0.52);
  forma.lineTo(-1.47, 0.28);
  forma.quadraticCurveTo(-1.47, 0.02, -1.26, 0);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: largo, bevelEnabled: false, curveSegments: 8 });
  geo.rotateY(Math.PI / 2);
  geo.translate(-largo * 0.5, 0, 0);
  return geo;
}

function crearMorroAerodinamico(tipo) {
  let pts;
  let sy = 0.86;
  let sz = 0.99;
  if (tipo === 'ave' || tipo === 'avlo') {
    // Morro redondeado del Talgo Avril S-106 (nueva flota AVE)
    pts = [
      new THREE.Vector2(0.0, 4.0),
      new THREE.Vector2(0.42, 3.86),
      new THREE.Vector2(0.80, 3.35),
      new THREE.Vector2(1.10, 2.30),
      new THREE.Vector2(1.32, 0.85),
      new THREE.Vector2(1.44, -1.00),
      new THREE.Vector2(1.47, -3.4),
    ];
    sy = 0.78;
  } else if (tipo === 'iryo') {
    // Morro cuña Bertone muy estilizado del ETR-1000
    pts = [
      new THREE.Vector2(0.0, 4.0),
      new THREE.Vector2(0.26, 3.85),
      new THREE.Vector2(0.64, 3.15),
      new THREE.Vector2(1.00, 1.85),
      new THREE.Vector2(1.28, 0.35),
      new THREE.Vector2(1.45, -1.45),
      new THREE.Vector2(1.47, -3.3),
    ];
    sy = 0.80;
  } else {
    // Avant S-114 / Ouigo Euroduplex
    pts = [
      new THREE.Vector2(0.0, 3.5),
      new THREE.Vector2(0.30, 3.35),
      new THREE.Vector2(0.68, 2.72),
      new THREE.Vector2(1.04, 1.60),
      new THREE.Vector2(1.32, 0.25),
      new THREE.Vector2(1.46, -1.40),
      new THREE.Vector2(1.47, -3.2),
    ];
    sy = 0.86;
  }
  const g = new THREE.LatheGeometry(pts, 24);
  g.rotateZ(-Math.PI / 2);
  g.scale(1, sy, sz);
  return g;
}

export function crearFlota({ escena, Eje3D, W, mat, matFoco, matPilotoRojo, pkArranque }) {
  const grupoFlota = new THREE.Group();
  escena.add(grupoFlota);
  const matSombraTren = crearMatSombraTren();

  function crearModeloTren(nCoches = 6, tipo = 'ave') {
    const lib = LIBREAS_L042[tipo] || LIBREAS_L042.ave;
    const tren = new THREE.Group();
    const matCuerpo = mat(lib.cuerpo, 1, { roughness: 0.22, metalness: 0.16 });
    const matTecho = mat(lib.techo, 1, { roughness: 0.30, metalness: 0.55 });
    const matFranja = mat(lib.franja, 1, { roughness: 0.28, metalness: 0.22 });
    const matBajos = mat(lib.bajos, 1, { roughness: 0.68, metalness: 0.28 });
    const matLatMotriz = crearTexturaLateralCoche(tipo, true);
    const matLatRemolque = crearTexturaLateralCoche(tipo, false);

    const matAceroRueda = mat('#dce3ec', 1, { roughness: 0.18, metalness: 0.88 });
    const matBastidorBogie = mat('#1e232b', 1, { roughness: 0.64, metalness: 0.45 });
    const matVent = mat('#0b1324', 1, { roughness: 0.08, metalness: 0.62 });
    const matFuelle = mat('#16191f', 1, { roughness: 0.88, metalness: 0.05 });
    const matPanto = mat('#64748b', 1, { roughness: 0.30, metalness: 0.80 });
    const matPlata = mat('#cbd5e1', 1, { roughness: 0.26, metalness: 0.68 });

    const avril = tipo === 'ave' || tipo === 'avlo';
    const largoMotriz = avril ? 16.4 : 17.4;
    const largoRemolque = avril ? 13.2 : 17.4;
    const altoMotriz = avril ? 2.95 : (tipo === 'ouigo' ? 2.98 : 2.86);
    const altoRemolque = avril ? 2.52 : (tipo === 'ouigo' ? 3.44 : 2.86);

    const gCajaMot = crearCajaCurvaSimetrica(largoMotriz, altoMotriz);
    const gCajaRem = crearCajaCurvaSimetrica(largoRemolque, altoRemolque);
    const gTechoMot = new THREE.CylinderGeometry(1.44, 1.44, largoMotriz, 16, 1, false, 0, Math.PI);
    gTechoMot.rotateZ(Math.PI / 2); gTechoMot.scale(1, 0.34, 1);
    const gTechoRem = new THREE.CylinderGeometry(1.44, 1.44, largoRemolque, 16, 1, false, 0, Math.PI);
    gTechoRem.rotateZ(Math.PI / 2); gTechoRem.scale(1, 0.34, 1);

    const gPanelMot = new THREE.PlaneGeometry(largoMotriz - 0.5, altoMotriz - 0.35);
    const gPanelRem = new THREE.PlaneGeometry(largoRemolque - 0.4, altoRemolque - 0.32);

    const gSombraMot = new THREE.PlaneGeometry(largoMotriz + 0.8, 3.35); gSombraMot.rotateX(-Math.PI / 2);
    const gSombraRem = new THREE.PlaneGeometry(largoRemolque + 0.8, 3.35); gSombraRem.rotateX(-Math.PI / 2);
    const gBajosMot = new THREE.BoxGeometry(largoMotriz - 0.6, 0.62, 2.66);
    const gBajosRem = new THREE.BoxGeometry(largoRemolque - 0.5, 0.62, 2.66);
    const gCarenado = new THREE.BoxGeometry(4.2, 0.24, 1.65);
    const gFuelle = new THREE.BoxGeometry(0.95, 2.52, 2.62);
    const gMorro = crearMorroAerodinamico(tipo);
    // Cabeza Talgo Avril: hocico (radio horizontal 1,47 m, vertical ×0,6), cabina abombada y su luna oscura
    const torno = (pts, sy, phi0 = 0, phiL = Math.PI * 2) => {
      const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 28, phi0, phiL);
      g.rotateZ(-Math.PI / 2); g.scale(1, sy, 1); return g;
    };
    const PERFIL_CABINA = [[0, 3.0], [0.45, 2.85], [0.85, 2.35], [1.12, 1.5], [1.3, 0.4], [1.4, -0.6], [1.42, -1.6]];
    const gHocicoAvril = torno([[0, 5.2], [0.3, 5.1], [0.62, 4.75], [0.92, 4.1], [1.18, 3.0], [1.36, 1.6], [1.45, 0], [1.47, -1.2]], 0.6);
    const gCabinaAvril = torno(PERFIL_CABINA, 0.95);
    // Luna: casquete delantero de la cabina, solo el sector superior (de lado a lado por arriba)
    const gLunaAvril = torno(PERFIL_CABINA.slice(0, 4).map(([r, y]) => [r * 1.012 + 0.004, y + 0.004]), 0.95, Math.PI * 1.5 - 1.15, 2.3);
    const gFaroAvril = new THREE.BoxGeometry(0.95, 0.2, 0.3);
    const matLunaAvril = new THREE.MeshStandardMaterial({ color: '#10161e', roughness: 0.03, metalness: 0.95, envMapIntensity: 1.8 });
    const gRotuloAvril = new THREE.PlaneGeometry(2.4, 0.6);
    const matRotuloAvril = (() => {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
      const x = cv.getContext('2d');
      x.textBaseline = 'middle';
      if (tipo === 'avlo') {
        x.fillStyle = '#5ee3b8'; x.font = '800 84px "Segoe UI", Arial, sans-serif'; x.fillText('avlo', 60, 66);
      } else {
        x.fillStyle = '#ffffff'; x.font = 'italic 700 70px "Segoe UI", Arial, sans-serif'; x.fillText('renfe', 20, 46);
        x.font = '600 46px "Segoe UI", Arial, sans-serif'; x.fillText('AVE', 205, 100);
      }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 });
    })();
    const gQuitanieves = new THREE.BoxGeometry(1.15, 0.32, 2.48);
    const gParabrisas = new THREE.BoxGeometry(2.3, 0.64, 2.18);
    gParabrisas.rotateZ(-0.30);
    const gLuz = new THREE.SphereGeometry(0.15, 8, 6);

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

    function crearPantografo(yBase) {
      const p = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 1.4), matPanto);
      base.position.set(0, yBase, 0);
      const brazoInf = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.07, 0.09), matPanto);
      brazoInf.position.set(-0.36, yBase + 0.41, 0);
      brazoInf.rotation.z = -0.48;
      const brazoSup = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.06, 0.07), matPanto);
      brazoSup.position.set(-0.28, yBase + 0.94, 0);
      brazoSup.rotation.z = 0.44;
      const mesilla = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.048, 1.72), matPlata);
      mesilla.position.set(0.38, yBase + 1.32, 0);
      p.add(base, brazoInf, brazoSup, mesilla);
      return p;
    }

    // Calcular posiciones acumuladas por longitud de coche para evitar huecos
    const largos = [];
    for (let i = 0; i < nCoches; i++) {
      largos.push((i === 0 || i === nCoches - 1) ? largoMotriz : largoRemolque);
    }
    const pasoGap = 0.72;
    const totalLen = largos.reduce((a, b) => a + b, 0) + pasoGap * (nCoches - 1);
    const offsetsX = [];
    let cursor = totalLen * 0.5;
    for (let i = 0; i < nCoches; i++) {
      cursor -= largos[i] * 0.5;
      offsetsX.push(cursor);
      cursor -= largos[i] * 0.5 + pasoGap;
    }

    const coches = [];
    let interior = null;
    for (let i = 0; i < nCoches; i++) {
      const c = new THREE.Group();
      const esMotriz = i === 0 || i === nCoches - 1;
      const largoC = largos[i];
      const altoC = esMotriz ? altoMotriz : altoRemolque;
      const dBogie = esMotriz ? DIST_BOGIE_STD : Math.min(DIST_BOGIE_STD, largoC * 0.36);

      const sombra = new THREE.Mesh(esMotriz ? gSombraMot : gSombraRem, matSombraTren);
      sombra.position.y = 0.008;
      const bog1 = crearBogie(); bog1.position.set(dBogie, 0, 0);
      const bog2 = crearBogie(); bog2.position.set(-dBogie, 0, 0);
      c.add(sombra, bog1, bog2);

      const carroceria = new THREE.Group();
      carroceria.position.y = 0.78;
      const caja = new THREE.Mesh(esMotriz ? gCajaMot : gCajaRem, matCuerpo);
      caja.castShadow = true;
      const techo = new THREE.Mesh(esMotriz ? gTechoMot : gTechoRem, matTecho);
      techo.position.y = altoC - 0.16;
      const bajos = new THREE.Mesh(esMotriz ? gBajosMot : gBajosRem, matBajos);
      bajos.position.y = 0.04;
      const carenado = new THREE.Mesh(gCarenado, matTecho);
      carenado.position.y = altoC + 0.24;
      carroceria.add(caja, techo, bajos, carenado);

      // Paneles laterales con librea, ventanillas reales y puertas del operador
      const gPanel = esMotriz ? gPanelMot : gPanelRem;
      const matPanel = esMotriz ? matLatMotriz : matLatRemolque;
      const panD = new THREE.Mesh(gPanel, matPanel);
      panD.position.set(0, altoC * 0.46, 1.474);
      const panI = new THREE.Mesh(gPanel, matPanel);
      panI.position.set(0, altoC * 0.46, -1.474);
      panI.rotation.y = Math.PI;
      carroceria.add(panD, panI);

      if (i < nCoches - 1) {
        const fuelle = new THREE.Mesh(gFuelle, matFuelle);
        fuelle.position.set(-(largoC * 0.5 + pasoGap * 0.5), 1.32, 0);
        carroceria.add(fuelle);
      }

      if (esMotriz && avril) {
        // Cabeza del Talgo Avril (AVE y Avlo): hocico largo y bajo, cabina abombada encima con parabrisas oscuro envolvente,
        // faros rasgados en los costados del hocico y la marca en blanco sobre el morro
        const s = i === 0 ? 1 : -1, x0 = s * largoC * 0.5;
        const hocico = new THREE.Mesh(gHocicoAvril, matCuerpo);
        hocico.position.set(x0, 0.95, 0);
        const cabina = new THREE.Mesh(gCabinaAvril, matCuerpo);
        cabina.position.set(x0 + s * 0.6, 1.75, 0);
        const luna = new THREE.Mesh(gLunaAvril, matLunaAvril);
        luna.position.copy(cabina.position);
        for (const m of [hocico, cabina, luna]) { if (s < 0) m.rotation.y = Math.PI; m.castShadow = true; }
        const matOptica = i === 0 ? matFoco : matPilotoRojo;
        const piezas = [hocico, cabina, luna];
        for (const lado of [-1, 1]) {
          const faro = new THREE.Mesh(gFaroAvril, matOptica);
          faro.position.set(x0 + s * 3.35, 1.14, lado * 0.98);
          faro.rotation.y = s * lado * 0.62;
          // Rótulo pegado al costado del hocico, inclinado como su estrechamiento
          const rot = new THREE.Mesh(gRotuloAvril, matRotuloAvril);
          rot.position.set(x0 + s * 2.05, 1.28, lado * 1.36);
          rot.rotation.y = (lado > 0 ? 0 : Math.PI) + s * lado * 0.2;
          piezas.push(faro, rot);
        }
        carroceria.add(...piezas);
        if (i === nCoches - 1) {
          const panto = crearPantografo(altoMotriz + 0.28);
          panto.position.set(2.0, 0, 0);
          carroceria.add(panto);
        }
      } else if (esMotriz) {
        const s = i === 0 ? 1 : -1;
        const xBase = s * (largoC * 0.5 + 2.4);
        const morro = new THREE.Mesh(gMorro, matCuerpo);
        morro.position.set(xBase, 1.06, 0);
        if (s < 0) morro.rotation.y = Math.PI;
        morro.castShadow = true;

        // Franja de color envolvente en el morro (para distinguir operadores desde el frente)
        const franjaMorro = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 2.74), matFranja);
        franjaMorro.position.set(s * (largoC * 0.5 + 0.65), 0.72, 0);

        const quita = new THREE.Mesh(gQuitanieves, matBajos);
        quita.position.set(s * (largoC * 0.5 + 2.15), -0.34, 0);

        const parab = new THREE.Mesh(gParabrisas, matVent);
        parab.position.set(s * (largoC * 0.5 + 0.55), 1.82, 0);
        if (s < 0) parab.rotation.y = Math.PI;

        const matOptica = i === 0 ? matFoco : matPilotoRojo;
        const f1 = new THREE.Mesh(gLuz, matOptica);
        const f2 = new THREE.Mesh(gLuz, matOptica);
        const xFaro = s * (largoC * 0.5 + 4.35);
        f1.position.set(xFaro, 0.66, 0.66);
        f2.position.set(xFaro, 0.66, -0.66);

        carroceria.add(morro, franjaMorro, quita, parab, f1, f2);
        if (i === nCoches - 1) {
          const panto = crearPantografo(altoMotriz + 0.28);
          panto.position.set(2.0, 0, 0);
          carroceria.add(panto);
        }
      }

      // Interior completo en el cuarto coche de los Avril (AVE y Avlo): vista del pasajero y vuelo del dron por dentro
      if (avril && i === 3) {
        const int = crearInterior({ texPantalla: pantallaVisorLav() });
        int.grupo.visible = false;
        carroceria.add(int.grupo);
        // Por dentro la carrocería no debe tapar las ventanas: solo sus caras exteriores
        caja.material = matCuerpo.clone(); caja.material.side = THREE.FrontSide;
        interior = { ...int, coche: c, carroceria };
      }
      c.add(carroceria);
      const ud = {
        capa: 'Circulación Alta Velocidad',
        nombre: lib.nombre,
        info: `${lib.nombre} · Composición articulada con bogies UIC 1.435 mm sobre cabeza de carril UIC 60 y pantógrafo en contacto con hilo a 5,30 m.`,
      };
      c.userData = ud;
      carroceria.userData = ud;
      c.traverse((n) => { if (n.isMesh && !n.userData?.capa) n.userData = ud; });
      c.userData.bog1 = bog1;
      c.userData.bog2 = bog2;
      c.userData.carroceria = carroceria;
      c.userData.offsetX = offsetsX[i];
      c.userData.distBogie = dBogie;
      tren.add(c);
      coches.push(c);
    }
    return { grupo: tren, coches, interior };
  }

  const faroCabina = new THREE.SpotLight(0xfff5d6, 0, 260, 0.44, 0.45, 1.1);
  escena.add(faroCabina, faroCabina.target);

  const PARADAS_CORREDOR = [
    { pk: 435650, nombre: 'Villena AV', espera: 14 },
    { pk: 485905, nombre: 'Alicante-Terminal', espera: 16 },
  ];

  const flota = [
    { pk: pkArranque - 420, sentido: 1, velBase: 83.3, velActual: 69.4, viaSigno: -1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(8, 'ave') },
    { pk: pkArranque + 320, sentido: -1, velBase: 83.3, velActual: 69.4, viaSigno: 1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(6, 'iryo') },
    { pk: 355400, sentido: 1, velBase: 83.3, velActual: 75.0, viaSigno: -1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(6, 'ouigo') },
    { pk: 465200, sentido: -1, velBase: 75.0, velActual: 64.0, viaSigno: 1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(5, 'avant') },
    { pk: 405000, sentido: 1, velBase: 83.3, velActual: 72.0, viaSigno: -1, paradaTimer: 0, ultimaParada: null, estadoTxt: 'En marcha', modelo: crearModeloTren(8, 'avlo') },
  ];
  for (const tr of flota) grupoFlota.add(tr.modelo.grupo);

  function actualizarFlota(dt, pkTerminal, trenSeguido = null) {
    const pkTope = Math.min(Eje3D.pkFin - 200, pkTerminal + 580);
    for (const tr of flota) {
      if (tr === trenSeguido) continue;
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
  const semiejeEnPk = (pk, sep) => {
    const base = sep * 0.5;
    if (pk < 435050 || pk > 436050) return base;
    let u = 1;
    if (pk < 435280) { const t = (pk - 435050) / 230; u = t * t * (3 - 2 * t); }
    else if (pk > 435820) { const t = 1 - (pk - 435820) / 230; u = t * t * (3 - 2 * t); }
    return base + (8.7 - base) * u;
  };
  function posicionarTren(tr) {
    const nC = tr.modelo.coches.length;
    for (let i = 0; i < nC; i++) {
      const coche = tr.modelo.coches[i];
      const dBogie = coche.userData.distBogie || DIST_BOGIE_STD;
      const pkC = Math.max(Eje3D.pkIni + dBogie + 1, Math.min(Eje3D.pkFin - dBogie - 1, tr.pk + tr.sentido * (coche.userData.offsetX || 0)));
      const pkDel = pkC + tr.sentido * dBogie;
      const pkTras = pkC - tr.sentido * dBogie;
      const pD = Eje3D.enPk(pkDel);
      const pT = Eje3D.enPk(pkTras);
      const pM = Eje3D.enPk(pkC);
      const offD = tr.viaSigno * semiejeEnPk(pkDel, pD.sep);
      const offT = tr.viaSigno * semiejeEnPk(pkTras, pT.sep);
      const wD = W(pD.E + (-pD.ty) * offD, pD.N + pD.tx * offD, pD.Z + 0.022);
      const wT = W(pT.E + (-pT.ty) * offT, pT.N + pT.tx * offT, pT.Z + 0.022);

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
