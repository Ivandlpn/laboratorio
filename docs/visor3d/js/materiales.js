import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cinta, extruirSeccion } from './geometria.js';

export function crearMateriales({ conHuecos }) {
  // ---- Materiales compartidos y texturas procedurales PBR de ingeniería y arquitectura ----
  const cacheMat = new Map();
  // ---- Estación de Villena AV: materiales a partir de las fotos del proyecto (INES Ingenieros para Adif) ----
  const TEX_FACHADA_VILLENA = (() => {
    // Fachada del volumen alto: paneles de vidrio en mosaico de verdes y grises (1 tesela = 6 x 3,6 m)
    const c = document.createElement('canvas'); c.width = 256; c.height = 192;
    const x = c.getContext('2d');
    x.fillStyle = '#2a3330'; x.fillRect(0, 0, 256, 192);
    const tonos = ['#2f5a45', '#3c6b52', '#4b5652', '#5d6b66', '#26413a', '#7c8c86', '#1f2a28'];
    let semilla = 7;
    const azar = () => { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; };
    for (let fy = 0; fy < 4; fy++) {
      for (let fx = 0; fx < 8; fx++) {
        x.fillStyle = tonos[Math.floor(azar() * tonos.length)];
        x.fillRect(fx * 32 + 1, fy * 48 + 1, 30, 46);
        if (azar() < 0.3) { x.fillStyle = 'rgba(210,230,235,0.35)'; x.fillRect(fx * 32 + 3, fy * 48 + 3, 26, 20); }
      }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    t.repeat.set(1 / 6, 1 / 3.6);
    return t;
  })();
  const TEX_CHAPA_VILLENA = (() => {
    // Chapa grecada gris oscura del zócalo (nervios verticales cada 0,25 m)
    const c = document.createElement('canvas'); c.width = 64; c.height = 8;
    const x = c.getContext('2d');
    x.fillStyle = '#474d54'; x.fillRect(0, 0, 64, 8);
    for (let i = 0; i < 64; i += 16) { x.fillStyle = '#3a4046'; x.fillRect(i, 0, 5, 8); x.fillStyle = '#565c63'; x.fillRect(i + 5, 0, 2, 8); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(1, 1);
    return t;
  })();
  function texRotulo(texto, sub) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#1d2733'; x.fillRect(0, 0, 512, 128);
    x.fillStyle = '#ffffff'; x.font = '600 54px "IBM Plex Sans Condensed", Arial, sans-serif'; x.textBaseline = 'middle';
    x.fillText(texto, 24, sub ? 50 : 64);
    if (sub) { x.font = '500 26px "IBM Plex Sans Condensed", Arial, sans-serif'; x.fillStyle = '#b8c4cf'; x.fillText(sub, 26, 100); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  // ---- Estación de Alicante-Terminal: edificio de la MZA (1858), neoclásico, planta en U, y marquesina Polonceau ----
  const TEX_FACHADA_MZA = (() => {
    // Un vano de 5,2 m y dos plantas: muro de color crema, pilastras, ventanas altas de medio punto e imposta entre plantas
    const c = document.createElement('canvas'); c.width = 128; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#dccaa3'; x.fillRect(0, 0, 128, 256);
    x.fillStyle = '#cdb88e'; x.fillRect(0, 0, 10, 256); x.fillRect(118, 0, 10, 256);   // pilastras
    x.fillStyle = '#efe4c9'; x.fillRect(0, 124, 128, 10); x.fillRect(0, 0, 128, 8);      // imposta y cornisa
    for (const y0 of [22, 150]) {
      x.fillStyle = '#e9dcbc'; x.beginPath(); x.moveTo(36, y0 + 92); x.lineTo(36, y0 + 26); x.arc(64, y0 + 26, 28, Math.PI, 0); x.lineTo(92, y0 + 92); x.fill();
      x.fillStyle = '#2b3036'; x.beginPath(); x.moveTo(42, y0 + 88); x.lineTo(42, y0 + 28); x.arc(64, y0 + 28, 22, Math.PI, 0); x.lineTo(86, y0 + 88); x.fill();
      x.strokeStyle = '#8a8f93'; x.lineWidth = 2; x.beginPath(); x.moveTo(64, y0 + 8); x.lineTo(64, y0 + 88); x.moveTo(42, y0 + 50); x.lineTo(86, y0 + 50); x.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  })();
  const MAT_ALI = {
    fachada: new THREE.MeshStandardMaterial({ map: TEX_FACHADA_MZA, roughness: 0.85, side: THREE.DoubleSide }),
    cornisa: new THREE.MeshStandardMaterial({ color: '#efe4c9', roughness: 0.8, side: THREE.DoubleSide }),
    cubiertaEd: new THREE.MeshStandardMaterial({ color: '#8b5a44', roughness: 0.85, side: THREE.DoubleSide }),
    vestibulo: new THREE.MeshStandardMaterial({ color: '#b9ccd3', roughness: 0.1, metalness: 0.7, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
    anden: new THREE.MeshStandardMaterial({ color: '#b1aea6', roughness: 0.92, side: THREE.DoubleSide }),
    bordeAnden: new THREE.MeshStandardMaterial({ color: '#e9d44a', roughness: 0.85, side: THREE.DoubleSide }),
    chapaShed: new THREE.MeshStandardMaterial({ color: '#7d868d', roughness: 0.55, metalness: 0.55, side: THREE.DoubleSide }),
    lucernario: new THREE.MeshStandardMaterial({ color: '#cfdde3', roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    hierro: new THREE.MeshStandardMaterial({ color: '#4a5560', roughness: 0.5, metalness: 0.7, side: THREE.DoubleSide }),
    marqAV: new THREE.MeshStandardMaterial({ color: '#e8ecee', roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide }),
    tope: new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide }),
  };
  const GEO_ROTULO = (() => { const g = new THREE.PlaneGeometry(2.2, 0.55); g.userData.compartida = true; return g; })();
  const MAT_EST = {
    anden: new THREE.MeshStandardMaterial({ color: '#a7aaa8', roughness: 0.92, metalness: 0.02, side: THREE.DoubleSide }),
    bandaRoja: new THREE.MeshStandardMaterial({ color: '#94402f', roughness: 0.9, side: THREE.DoubleSide }),
    bordeBlanco: new THREE.MeshStandardMaterial({ color: '#e8e6df', roughness: 0.85, side: THREE.DoubleSide }),
    marquesina: new THREE.MeshStandardMaterial({ color: '#3b4046', roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide }),
    pilar: new THREE.MeshStandardMaterial({ color: '#4d535a', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }),
    chapa: new THREE.MeshStandardMaterial({ map: TEX_CHAPA_VILLENA, roughness: 0.55, metalness: 0.5, side: THREE.DoubleSide }),
    fachada: new THREE.MeshStandardMaterial({ map: TEX_FACHADA_VILLENA, roughness: 0.25, metalness: 0.55, side: THREE.DoubleSide }),
    vidrio: new THREE.MeshStandardMaterial({ color: '#b7cdd5', roughness: 0.08, metalness: 0.7, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
    vidrioBlanco: new THREE.MeshStandardMaterial({ color: '#e9eef0', roughness: 0.3, metalness: 0.25, side: THREE.DoubleSide }),
    cubierta: new THREE.MeshStandardMaterial({ color: '#30353b', roughness: 0.65, metalness: 0.45, side: THREE.DoubleSide }),
    celosia: new THREE.MeshStandardMaterial({ color: '#9aa1a7', roughness: 0.45, metalness: 0.65, side: THREE.DoubleSide }),
    placaSolar: new THREE.MeshStandardMaterial({ color: '#1c2a44', roughness: 0.25, metalness: 0.6, side: THREE.DoubleSide }),
  };
  MAT_EST.rotulo = new THREE.MeshStandardMaterial({ map: texRotulo('Villena AV', 'Alta Velocidad'), roughness: 0.5, side: THREE.DoubleSide });

  // Vallado de cerramiento: el mismo que el entorno 3D de la caseta GSM-R (malla de simple torsión en rombo de unos 6 cm,
  // postes de tubo gris cada 2,5 m y tres alambres por encima). UV en metros: 1 rombo cada 0,12 m.
  const TEX_MALLA_VALLA = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    x.strokeStyle = '#fff'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(64, 64); x.moveTo(64, 0); x.lineTo(0, 64); x.stroke();
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    return t;
  })();
  const MAT_MALLA_VALLA = new THREE.MeshStandardMaterial({ color: '#a7b0b2', map: TEX_MALLA_VALLA, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 });
  const MAT_PUERTA_VALLA = new THREE.MeshStandardMaterial({ color: '#8d979b', map: TEX_MALLA_VALLA, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 });
  const ALTO_VALLA = 2.0, SEP_POSTE_VALLA = 2.5, ESC_ROMBO = 0.12;
  // Paño de malla vertical sobre una polilínea local [[x, y, z], ...] (y = pie de la valla) + postes y alambres
  function valla(mMalla, mAlambre, postes, pts, alto = ALTO_VALLA, matInstF = null) {
    let dist = 0, prev = null;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (prev) dist += Math.hypot(p[0] - prev.p[0], p[2] - prev.p[2]);
      const u = dist / ESC_ROMBO;
      const b = mMalla.v(p[0], p[1], p[2], u, 0);
      const t = mMalla.v(p[0], p[1] + alto, p[2], u, alto / ESC_ROMBO);
      if (prev) mMalla.quad(prev.b, b, t, prev.t);
      prev = { p, b, t };
    }
    for (const h of [alto, alto + 0.15, alto + 0.3]) cinta(mAlambre, pts, 0.012, h - 0.006, h + 0.006, 0, 0.2);
    if (!postes) return;
    // Postes cada 2,5 m a lo largo de la polilínea (y en sus vértices de quiebro)
    let resto = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const l = Math.hypot(c[0] - a[0], c[2] - a[2]);
      for (let d = resto; d < l; d += SEP_POSTE_VALLA) {
        const f = d / l;
        postes.push(matInstF([a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f, a[2] + (c[2] - a[2]) * f], 0));
      }
      resto = (resto - l) % SEP_POSTE_VALLA; if (resto < 0) resto += SEP_POSTE_VALLA;
    }
    postes.push(matInstF(pts[pts.length - 1], 0));
  }
  // Rectángulo de vallado alrededor de un recinto (centro, eje u y normal n en el plano, medidas a lo largo y a lo ancho)
  function vallaRecinto(mMalla, mAlambre, postes, cx, cz, y0, ux, uz, largo, ancho, alto, matInstF) {
    const nx = -uz, nz = ux, a = largo / 2, b = ancho / 2;
    const esq = [[-a, -b], [a, -b], [a, b], [-a, b], [-a, -b]].map(([s, t]) => [cx + s * ux + t * nx, y0, cz + s * uz + t * nz]);
    valla(mMalla, mAlambre, postes, esq, alto, matInstF);
  }

  function mat(color, opacidad = 1, extra = {}) {
    const k = color + '|' + opacidad + '|' + JSON.stringify(extra);
    if (!cacheMat.has(k)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.08, side: THREE.DoubleSide, ...extra });
      if (opacidad < 1) Object.assign(m, { transparent: true, opacity: opacidad, depthWrite: false });
      cacheMat.set(k, m);
    }
    return cacheMat.get(k);
  }
  const matFoco = new THREE.MeshStandardMaterial({ color: '#fff9e0', emissive: '#ffdf85', emissiveIntensity: 1.15, roughness: 0.22 });
  const matPilotoRojo = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.45, roughness: 0.28 });
  const matBalizaRoja = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#dc2626', emissiveIntensity: 1.35, roughness: 0.25 });
  const matLumTunel = new THREE.MeshStandardMaterial({ color: '#eef7ff', emissive: '#bae6fd', emissiveIntensity: 1.85, roughness: 0.2 });
  const matSalidaEmerg = new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#16a34a', emissiveIntensity: 1.35, roughness: 0.3 });
  const matCobreContacto = new THREE.MeshStandardMaterial({ color: '#b87344', metalness: 0.85, roughness: 0.24, side: THREE.DoubleSide });

  const texBalasto = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    let sd = 4217; const az = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    x.fillStyle = '#4e4a45'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1650; i++) {
      const cx = az() * 256, cy = az() * 256, r = 1.6 + az() * 4.0, v = 78 + (az() * 108 | 0);
      x.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      x.beginPath();
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * 6.28 + az() * 0.5, rad = r * (0.7 + az() * 0.5);
        p ? x.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad) : x.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      }
      x.closePath(); x.fill();
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  })();
  const matBalasto = new THREE.MeshStandardMaterial({ map: texBalasto, bumpMap: texBalasto, bumpScale: 1.75, roughness: 0.96, metalness: 0.02, side: THREE.DoubleSide });

  const texSubbalasto = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    let sd = 911; const az = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    x.fillStyle = '#aba59a'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const v = 148 + (az() * 48 | 0);
      x.fillStyle = `rgba(${v},${v - 3},${v - 8},0.55)`;
      x.fillRect(az() * 128, az() * 128, 1 + az() * 2.5, 1 + az() * 2.5);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const matSubbalasto = new THREE.MeshStandardMaterial({ map: texSubbalasto, bumpMap: texSubbalasto, bumpScale: 0.5, roughness: 0.92, metalness: 0.02, side: THREE.DoubleSide });

  const texHormigon = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    let sd = 313; const az = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    x.fillStyle = '#cbc7be'; x.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) { x.fillStyle = 'rgba(90,88,82,0.16)'; x.fillRect(0, y, 256, 1.5); }
    for (let i = 0; i < 1200; i++) {
      const v = 175 + (az() * 52 | 0);
      x.fillStyle = `rgba(${v},${v - 1},${v - 4},0.35)`;
      x.fillRect(az() * 256, az() * 256, 1 + az() * 3, 1 + az() * 3);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const matHormigonViad = new THREE.MeshStandardMaterial({ map: texHormigon, bumpMap: texHormigon, bumpScale: 0.4, roughness: 0.78, metalness: 0.05, side: THREE.DoubleSide });

  // Materiales arquitectónicos fieles a la realidad (muros y cubiertas técnicas ADIF, sin vanos ni tejas inventadas)
  const matEdifCivil = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#d6cfc1'; x.fillRect(0, 0, 128, 128);
    let sd = 512; const az = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 500; i++) {
      const v = 208 + (az() * 26 | 0);
      x.fillStyle = `rgba(${v},${v - 4},${v - 12},0.28)`;
      x.fillRect(az() * 128, az() * 128, 1 + az() * 3, 1 + az() * 3);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 0.12, roughness: 0.88, metalness: 0.04, side: THREE.DoubleSide });
  })();

  // Paneles prefabricados de hormigón técnico / naves de mantenimiento (tono técnico real)
  const matEdifTecnico = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#c9ccc7'; x.fillRect(0, 0, 128, 128);
    for (let px = 0; px < 128; px += 32) { x.fillStyle = 'rgba(71,85,105,0.14)'; x.fillRect(px, 0, 1.5, 128); }
    for (let py = 0; py < 128; py += 32) { x.fillStyle = 'rgba(71,85,105,0.12)'; x.fillRect(0, py, 128, 1.5); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 0.15, roughness: 0.80, metalness: 0.10, side: THREE.DoubleSide });
  })();

  // Cubierta plana técnica / grava de azotea (según cartografía y ortofoto PNOA)
  const matCubiertaPlana = mat('#8d9a9e', 1, { roughness: 0.90, metalness: 0.05 });

  // Andén de viajeros en granito gris con banda amarilla podotáctil de seguridad ADIF
  const matAndenGranito = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#cbd0d6'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#eab308'; x.fillRect(6, 0, 10, 128); x.fillRect(112, 0, 10, 128);
    x.fillStyle = 'rgba(71,85,105,0.22)';
    for (let i = 0; i < 128; i += 16) { x.fillRect(0, i, 128, 1); x.fillRect(i, 0, 1, 128); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.72, metalness: 0.08, side: THREE.DoubleSide });
  })();

  const matCarrilAlma = mat('#6e4a34', 1, { metalness: 0.35, roughness: 0.78 });   // óxido de alma, patín y costados de cabeza
  const matCarrilCabeza = mat('#e5ebf0', 1, { metalness: 0.92, roughness: 0.14 }); // banda de rodadura pulida por las ruedas
  // Sujeción de carril: grapa elástica en verde Adif, placa guía y placa de asiento negras, tirafondo oxidado
  const MAT_GRAPA = new THREE.MeshStandardMaterial({ color: '#1f7a3e', roughness: 0.45, metalness: 0.15 });
  const MAT_PLACA_GUIA = new THREE.MeshStandardMaterial({ color: '#1d1f22', roughness: 0.75, metalness: 0.05 });
  const MAT_TIRAFONDO = new THREE.MeshStandardMaterial({ color: '#7a4a2c', roughness: 0.8, metalness: 0.35 });
  // Perfil UIC 60 (60E1): 172 mm de alto, patín de 150 mm, alma de 16,5 mm y cabeza de 72 mm.
  // [desplazamiento lateral, cota] en metros respecto a la cota de cabeza de carril (Z + 0,022). Esquinas repetidas = aristas vivas.
  const PERFIL_UIC60 = (() => {
    const d = [
      [-0.075, -0.172], [-0.075, -0.172], [0.075, -0.172], [0.075, -0.172], [0.075, -0.1605], [0.075, -0.1605],
      [0.016, -0.147], [0.0083, -0.135], [0.0083, -0.072], [0.016, -0.059], [0.036, -0.050], [0.036, -0.050],
      [0.0365, -0.013], [0.031, -0.003], [0.019, 0],
      [-0.019, 0], [-0.031, -0.003], [-0.0365, -0.013],
      [-0.036, -0.050], [-0.036, -0.050], [-0.016, -0.059], [-0.0083, -0.072], [-0.0083, -0.135], [-0.016, -0.147],
      [-0.075, -0.1605], [-0.075, -0.1605],
    ];
    return d.map(([x, y]) => [x, y + 0.022]);
  })();
  // Banda de rodadura pulida (abierta), un pelo por encima del perfil
  const PERFIL_RODADURA = [[-0.031, 0.019], [-0.019, 0.0222], [0.019, 0.0222], [0.031, 0.019]];
  function carrilUIC60(mOxido, mPulido, pts) {
    extruirSeccion(mOxido, pts, PERFIL_UIC60, true, 0.5);
    extruirSeccion(mPulido, pts, PERFIL_RODADURA, false, 0.5);
  }
  const matTraviesa = mat('#beb9b0', 1, { roughness: 0.88, metalness: 0.04 });

  // Canaleta prefabricada de hormigón gris con tapas de 50 cm (1 repetición V = 0,50 m con uvEscala = 2.0 en cinta)
  const matCanaleta = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#9ea4a8'; x.fillRect(0, 0, 64, 128);
    let sd = 913; const az = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 420; i++) {
      const v = 138 + (az() * 38 | 0);
      x.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
      x.fillRect(az() * 64, az() * 128, 1 + az() * 2, 1 + az() * 2);
    }
    x.fillStyle = '#4f555b'; x.fillRect(0, 0, 64, 6);        // junta entre tapas cada 50 cm
    x.fillStyle = '#b4bac0'; x.fillRect(0, 6, 64, 3);        // bisel claro de la tapa
    x.fillStyle = '#7c8288'; x.fillRect(0, 0, 3, 128); x.fillRect(61, 0, 3, 128); // bordes de canaleta
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.88, metalness: 0.05, side: THREE.DoubleSide });
  })();

  const texGrano = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); x.fillStyle = 'rgb(238,238,236)'; x.fillRect(0, 0, 256, 256);
    let s = 13; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 65; i++) { const v = 208 + r() * 42 | 0; x.fillStyle = `rgba(${v},${v},${v},0.32)`; x.beginPath(); x.arc(r() * 256, r() * 256, 6 + r() * 20, 0, 7); x.fill(); }
    for (let i = 0; i < 5500; i++) { const v = 160 + r() * 92 | 0; x.fillStyle = `rgba(${v},${v},${v},0.48)`; x.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  })();
  const matTerrenoTopo = new THREE.MeshStandardMaterial({ vertexColors: true, map: texGrano, roughness: 0.98, metalness: 0, side: THREE.DoubleSide });
  conHuecos(matTerrenoTopo);
  const matTerrenoRegional = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });

  // Geometrías unitarias detalladas para InstancedMesh (compartidas entre teselas)
  const GEO = {
    // Traviesa monobloque de hormigón pretensado AI-04 con cintura central
    traviesa: (() => {
      // Cara de apoyo del carril en y = 0 (bajo el patín y la placa de asiento de 10 mm)
      const extI = new THREE.BoxGeometry(0.26, 0.21, 0.92).translate(0, -0.105, -0.84);
      const cen = new THREE.BoxGeometry(0.21, 0.17, 0.92).translate(0, -0.125, 0);
      const extD = new THREE.BoxGeometry(0.26, 0.21, 0.92).translate(0, -0.105, 0.84);
      const g = mergeGeometries([extI, cen, extD], false);
      extI.dispose(); cen.dispose(); extD.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    // Placa de asiento bajo el patín (10 mm) y placas guía acodadas a cada lado del carril. Local: x a lo largo de la vía,
    // z transversal (carriles en ±0,7175), y = 0 en la cara superior de la traviesa.
    placaAsiento: (() => {
      const partes = [];
      for (const zR of [-0.7175, 0.7175]) {
        partes.push(new THREE.BoxGeometry(0.18, 0.01, 0.17).translate(0, 0.005, zR));
        for (const s of [-1, 1]) {
          // Placa guía: cuña negra de 150 mm entre el borde del patín y el tirafondo
          const g = new THREE.BoxGeometry(0.15, 0.03, 0.115);
          const pos = g.attributes.position;
          for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0 && pos.getZ(i) * s < 0) pos.setY(i, 0.006); // chaflán hacia el carril
          g.translate(0, 0.015, zR + s * (0.075 + 0.058));
          partes.push(g);
        }
      }
      const g = mergeGeometries(partes, false);
      for (const p of partes) p.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    // Grapa elástica (tipo Vossloh SKL) en verde Adif: lazo de varilla de 13 mm con las puntas apoyadas en el patín
    grapa: (() => {
      const partes = [];
      const lazo = (d) => [
        [-0.048, 0.030, 0.064], [-0.062, 0.040, 0.100], [-0.060, 0.050, 0.150], [-0.042, 0.060, 0.188],
        [0.000, 0.064, 0.200], [0.042, 0.060, 0.188], [0.060, 0.050, 0.150], [0.062, 0.040, 0.100], [0.048, 0.030, 0.064],
      ].map(([x, y, dz]) => new THREE.Vector3(x, y, d * dz));
      for (const zR of [-0.7175, 0.7175]) {
        for (const s of [-1, 1]) {
          const pts = lazo(s);
          const tubo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.0085, 5, false);
          tubo.translate(0, 0, zR);
          partes.push(tubo);
        }
      }
      const g = mergeGeometries(partes.map((t) => t.toNonIndexed()), false);
      for (const p of partes) p.dispose();
      g.computeVertexNormals();
      g.userData.compartida = true;
      return g;
    })(),
    // Tirafondo con arandela: tuerca hexagonal oxidada en el centro de cada grapa
    tirafondo: (() => {
      const partes = [];
      for (const zR of [-0.7175, 0.7175]) {
        for (const s of [-1, 1]) {
          const z = zR + s * 0.13;
          partes.push(new THREE.CylinderGeometry(0.024, 0.024, 0.006, 10).translate(0, 0.033, z));
          partes.push(new THREE.CylinderGeometry(0.017, 0.017, 0.024, 6).translate(0, 0.048, z));
          partes.push(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 6).translate(0, 0.066, z));
        }
      }
      const g = mergeGeometries(partes, false);
      for (const p of partes) p.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    // Poste HEB galvanizado con alas reales
    poste: (() => {
      const ala1 = new THREE.BoxGeometry(0.30, 8.3, 0.045).translate(0, 4.15, -0.12);
      const ala2 = new THREE.BoxGeometry(0.30, 8.3, 0.045).translate(0, 4.15, 0.12);
      const alma = new THREE.BoxGeometry(0.05, 8.3, 0.24).translate(0, 4.15, 0);
      const g = mergeGeometries([ala1, ala2, alma], false);
      ala1.dispose(); ala2.dispose(); alma.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    cimientoPoste: (() => { const g = new THREE.BoxGeometry(0.76, 0.68, 0.76).translate(0, 0.12, 0); g.userData.compartida = true; return g; })(),
    placaPoste: (() => { const g = new THREE.BoxGeometry(0.34, 0.44, 0.34).translate(0, 3.6, 0); g.userData.compartida = true; return g; })(),
    // Equipo de compensación mecánica por contrapesos y polea en seccionamientos de catenaria EAC-350
    contrapeso: (() => {
      const guia = new THREE.CylinderGeometry(0.03, 0.03, 4.8, 6).translate(0.34, 3.2, 0);
      const pesas = new THREE.CylinderGeometry(0.22, 0.22, 1.85, 10).translate(0.34, 2.35, 0);
      const polea = new THREE.CylinderGeometry(0.28, 0.28, 0.09, 10).rotateX(Math.PI / 2).translate(0.28, 5.85, 0);
      const g = mergeGeometries([guia, pesas, polea], false);
      guia.dispose(); pesas.dispose(); polea.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    mensula: (() => {
      // Brazo horizontal + tirante diagonal superior + brazo de atirantado EAC-350 (longitud unitaria en +X)
      const h = new THREE.BoxGeometry(1, 0.072, 0.072);
      const d = new THREE.BoxGeometry(1.09, 0.052, 0.052);
      d.rotateZ(-0.38); d.translate(0, 0.56, 0);
      const at = new THREE.BoxGeometry(0.42, 0.04, 0.04).translate(0.29, -0.22, 0);
      const g = mergeGeometries([h, d, at], false);
      h.dispose(); d.dispose(); at.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    aislador: (() => { const g = new THREE.CylinderGeometry(0.11, 0.11, 0.52, 8).rotateZ(Math.PI / 2); g.userData.compartida = true; return g; })(),
    foco: (() => { const g = new THREE.SphereGeometry(0.24, 8, 6); g.userData.compartida = true; return g; })(),
    arqueta: (() => {
      const marco = new THREE.BoxGeometry(1.06, 0.16, 0.82);
      const t1 = new THREE.BoxGeometry(0.30, 0.04, 0.72).translate(-0.33, 0.09, 0);
      const t2 = new THREE.BoxGeometry(0.30, 0.04, 0.72).translate(0, 0.09, 0);
      const t3 = new THREE.BoxGeometry(0.30, 0.04, 0.72).translate(0.33, 0.09, 0);
      const g = mergeGeometries([marco, t1, t2, t3], false);
      marco.dispose(); t1.dispose(); t2.dispose(); t3.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    baliza: (() => { const g = new THREE.BoxGeometry(0.50, 0.075, 0.36); g.userData.compartida = true; return g; })(),
    senalPoste: (() => {
      const mast = new THREE.CylinderGeometry(0.06, 0.07, 3.3, 8).translate(0, 1.65, 0);
      const base = new THREE.BoxGeometry(0.45, 0.25, 0.45).translate(0, 0.12, 0);
      const vis = new THREE.BoxGeometry(0.28, 0.98, 0.54).translate(0.08, 2.85, 0);
      const g = mergeGeometries([mast, base, vis], false);
      mast.dispose(); base.dispose(); vis.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    senalFoco: (() => { const g = new THREE.SphereGeometry(0.11, 8, 6).translate(0.21, 2.95, 0); g.userData.compartida = true; return g; })(),
    armario: (() => {
      const zoc = new THREE.BoxGeometry(1.18, 0.24, 0.68).translate(0, 0.12, 0);
      const cpo = new THREE.BoxGeometry(1.10, 1.52, 0.58).translate(0, 1.0, 0);
      const tej = new THREE.BoxGeometry(1.20, 0.08, 0.68).translate(0, 1.80, 0);
      const g = mergeGeometries([zoc, cpo, tej], false);
      zoc.dispose(); cpo.dispose(); tej.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    hitoPk: (() => { const g = new THREE.BoxGeometry(0.12, 1.58, 0.44).translate(0, 0.79, 0); g.userData.compartida = true; return g; })(),
    tronco: (() => { const g = new THREE.CylinderGeometry(0.14, 0.22, 1, 6).translate(0, 0.5, 0); g.userData.compartida = true; return g; })(),
    copa: (() => { const g = new THREE.IcosahedronGeometry(1, 1).translate(0, 1.15, 0); g.userData.compartida = true; return g; })(),
    copaOlivo: (() => { const g = new THREE.SphereGeometry(1, 7, 5).scale(1.15, 0.68, 1.1).translate(0, 0.95, 0); g.userData.compartida = true; return g; })(),
    farola: (() => {
      const col = new THREE.CylinderGeometry(0.06, 0.10, 7.6, 7).translate(0, 3.8, 0);
      const bra = new THREE.BoxGeometry(1.3, 0.08, 0.08).translate(0.6, 7.55, 0);
      const g = mergeGeometries([col, bra], false);
      col.dispose(); bra.dispose();
      g.userData.compartida = true;
      return g;
    })(),
    posteValla: (() => { const g = new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6).translate(0, 1.15, 0); g.userData.compartida = true; return g; })(),
    lumTunel: (() => { const g = new THREE.BoxGeometry(1.5, 0.12, 0.18); g.userData.compartida = true; return g; })(),
    cartelTunel: (() => { const g = new THREE.BoxGeometry(0.65, 0.32, 0.05); g.userData.compartida = true; return g; })(),
  };
  matSubbalasto.polygonOffset = true;
  matSubbalasto.polygonOffsetFactor = -1;
  matSubbalasto.polygonOffsetUnits = -1;
  return { ALTO_VALLA, mat, MAT_ALI, GEO_ROTULO, MAT_EST, valla, vallaRecinto, MAT_MALLA_VALLA, MAT_PUERTA_VALLA, matFoco, matPilotoRojo, matBalizaRoja, matLumTunel, matSalidaEmerg, matCobreContacto, matBalasto, matSubbalasto, matCanaleta, matHormigonViad, matEdifCivil, matEdifTecnico, matCubiertaPlana, matAndenGranito, matCarrilAlma, matCarrilCabeza, MAT_GRAPA, MAT_PLACA_GUIA, MAT_TIRAFONDO, carrilUIC60, matTraviesa, matTerrenoTopo, matTerrenoRegional, GEO };
}
