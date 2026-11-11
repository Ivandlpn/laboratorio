/* Elementos de línea comunes a los visores 3D (sin dependencias propias):
   - el eje de VISOR LAV desde el que se abre el entorno (`?eje=` en la dirección o en la página que lo enmarca) con su línea,
     su PK de referencia y las ciudades que une (cartelón de línea y PK, señalética del pueblo),
   - cartelón azul de línea y PK junto a la vía, cajas amarillas de conexión en la vía, tapas de la canaleta cada 50 cm,
   - punto de acceso del mantenimiento: camino de servicio junto al vallado, puerta en el cerramiento y coche blanco de Ineco,
   - dron de inspección que sobrevuela la línea, con su cámara (vista «Desde el dron»),
   - armario de báculo a la altura de un trabajador (abierto, con su interior), foco infrarrojo, cámara domo en brazo de cuello
     de cisne, arqueta de segregación y armario de fusión de fibra.
   Contrato: Linea3D.init(THREE, mergeGeometries); cada función recibe ctx = { P, poner, capa } y las posiciones en coordenadas de
   plano (x a lo largo de la vía, y perpendicular, z cota). Lo que se mueve queda en Linea3D.dinamicos (hay que añadirlo a los
   «dinámicos» del visor antes de fusionar y congelar). Posiciones, medidas y PK son genéricos: no proceden de planos. */
(function () {
  let T = null, merge = null;
  const dinamicos = [], animar = [];
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cacheMat = {};
  const mat = (c, o = {}) => { const k = c + JSON.stringify(o); return (cacheMat[k] ||= new T.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0.08, ...o })); };

  // ---------- Ejes: línea, PK y ciudades (dirección en grados en planta: 0 = +x, 90 = +y) ----------
  const EJES = {
    este: { nombre: 'Eje Este', linea: 'L040', pk: 271430, ciudades: [['Madrid', 180], ['Cuenca', 155], ['Valencia', 20], ['Castellón', 50], ['Albacete', 245], ['Alicante', 290], ['Murcia', 320]] },
    norte: { nombre: 'Eje Norte', linea: 'L080', pk: 148250, ciudades: [['Madrid', 200], ['Segovia', 160], ['Valladolid', 15], ['Palencia', 40], ['Burgos', 70], ['León', 330], ['Zamora', 280], ['Ourense', 300]] },
    noreste: { nombre: 'Eje Noreste', linea: 'L050', pk: 312400, ciudades: [['Madrid', 190], ['Guadalajara', 160], ['Zaragoza', 20], ['Huesca', 60], ['Lleida', 340], ['Tarragona', 300], ['Barcelona', 270], ['Girona', 235]] },
    sur: { nombre: 'Eje Sur', linea: 'L010', pk: 198600, ciudades: [['Madrid', 15], ['Toledo', 50], ['Ciudad Real', 340], ['Puertollano', 300], ['Córdoba', 200], ['Sevilla', 230], ['Málaga', 260], ['Granada', 160]] }
  };
  function idEje() {
    const de = (s) => { try { return new URLSearchParams(s).get('eje'); } catch (e) { return null; } };
    let id = de(location.search);
    if (!id) { try { id = de(window.parent.location.search); } catch (e) { /* otro origen */ } }
    return EJES[id] ? id : 'este';
  }
  const formatoPk = (m) => { const v = Math.max(0, Math.round(m)); return Math.floor(v / 1000) + '+' + String(v % 1000).padStart(3, '0'); };

  // ---------- Imágenes (logotipos) y lienzos que se redibujan cuando cargan ----------
  const imgs = {};
  const imagen = (src) => (imgs[src] ||= new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  const LOGOS = { adif: '/logos/adif.png', ineco: '/logos/ineco.png', ojo: '/favicon.svg' };
  /** Textura de lienzo que se dibuja ya (sin imágenes) y se repinta cuando llegan las imágenes pedidas. */
  function lienzo(w, h, srcs, dibujar) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    dibujar(x, w, h, srcs.map(() => null));
    if (srcs.length) Promise.all(srcs.map(imagen)).then((ims) => { x.clearRect(0, 0, w, h); dibujar(x, w, h, ims); t.needsUpdate = true; });
    return t;
  }
  /** Dibuja una imagen dentro de la caja (x, y, w, h) conservando su proporción. */
  function encajar(x, im, bx, by, bw, bh, alin = 'centro') {
    if (!im) return;
    const k = Math.min(bw / im.width, bh / im.height), w = im.width * k, h = im.height * k;
    const dx = alin === 'izq' ? bx : alin === 'der' ? bx + bw - w : bx + (bw - w) / 2;
    x.drawImage(im, dx, by + (bh - h) / 2, w, h);
  }

  // ---------- Geometría con color por vértice (piezas fusionadas en una malla) ----------
  function geoColor(partes) {
    const c = new T.Color();
    const geos = partes.map((p) => {
      let g;
      if (p[0] === 'c') { g = new T.CylinderGeometry(p[1], p[2], p[3], p[8] || 12); g.translate(p[4], p[5], p[6]); c.set(p[7]); }
      else { g = new T.BoxGeometry(p[0], p[1], p[2]); g.translate(p[3], p[4], p[5]); c.set(p[6]); }
      g = g.index ? g.toNonIndexed() : g;
      const n = g.attributes.position.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new T.BufferAttribute(col, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g;
    });
    const u = merge(geos, false); geos.forEach((g) => g.dispose()); return u;
  }
  const matV = () => (cacheMat.vc ||= new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.15 }));
  // Caja local (coordenadas three, y hacia arriba) añadida a un grupo
  const cj = (g, w, h, d, x, y, z, m) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const tubo = (g, a, b, r, m, seg = 8) => {
    const d = new T.Vector3().subVectors(b, a), L = d.length(); if (L < 1e-4) return null;
    const c = new T.Mesh(new T.CylinderGeometry(r, r, L, seg), m); c.position.copy(a).addScaledVector(d, 0.5);
    c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); c.castShadow = true; g.add(c); return c;
  };
  // Orienta un grupo construido mirando a +x local hacia la dirección de planta `ang` (radianes)
  const orientar = (g, P, x, y, z, ang) => { g.position.copy(P(x, y, z)); g.rotation.y = ang; return g; };

  // ---------- Foco infrarrojo: carcasa cuadrada con matriz de LED rojo oscuro ----------
  let texIR = null;
  function texturaIR() {
    if (texIR) return texIR;
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#121416'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#1d2024'; x.fillRect(8, 8, 112, 112);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const cx = 20 + i * 17.6, cy = 20 + j * 17.6, gr = x.createRadialGradient(cx, cy, 0, cx, cy, 7);
      gr.addColorStop(0, '#ff5a4a'); gr.addColorStop(0.35, '#a01812'); gr.addColorStop(1, '#2a0b09'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, 6.5, 0, 7); x.fill();
    }
    texIR = new T.CanvasTexture(c); texIR.colorSpace = T.SRGBColorSpace; return texIR;
  }
  /** Foco IR cuadrado (lado `l` m) mirando a +x local. */
  function focoIR(l = 0.16) {
    const g = new T.Group(), carc = mat('#2b2f33', { metalness: 0.5, roughness: 0.45 });
    cj(g, 0.08, l, l, 0, 0, 0, carc);
    const cara = new T.Mesh(new T.PlaneGeometry(l * 0.9, l * 0.9), new T.MeshStandardMaterial({ map: texturaIR(), emissive: '#5a0a06', emissiveIntensity: 0.6, roughness: 0.3 }));
    cara.position.set(0.041, 0, 0); cara.rotation.y = Math.PI / 2; g.add(cara);
    cj(g, 0.1, 0.012, l + 0.02, 0.01, l / 2 + 0.01, 0, carc);                        // visera
    cj(g, 0.04, 0.06, 0.03, -0.06, 0, 0, carc);                                      // rótula
    return g;
  }

  // ---------- Armario de báculo: a media altura, abierto, con automáticos, regletas, repartidor de fibra, switch y fuente ----------
  let texFondo = null;
  function texturaFondoArmario() {
    if (texFondo) return texFondo;
    const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d');
    x.fillStyle = '#d7dadb'; x.fillRect(0, 0, 256, 384);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(120,130,135,${Math.random() * 0.08})`; x.fillRect(Math.random() * 256, Math.random() * 384, 30, 2); }
    // Mazo de cables: negros por el contorno, azules y amarillos (fibra) hacia el repartidor, verde-amarillo de tierra
    const curva = (col, w, pts) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(...pts[0]); for (let i = 1; i < pts.length - 2; i += 3) x.bezierCurveTo(...pts[i], ...pts[i + 1], ...pts[i + 2]); x.stroke(); };
    curva('#16181a', 9, [[20, 380], [10, 300], [12, 120], [30, 60]]); curva('#16181a', 9, [[236, 380], [250, 300], [246, 140], [226, 70]]);
    curva('#1f4fb0', 4, [[60, 120], [70, 170], [100, 190], [130, 200]]); curva('#1f4fb0', 4, [[150, 115], [140, 160], [160, 180], [190, 210]]);
    curva('#7a2fb0', 4, [[200, 120], [230, 190], [190, 230], [170, 250]]); curva('#e8c81a', 3, [[40, 250], [55, 200], [110, 190], [130, 175]]);
    curva('#e8c81a', 3, [[60, 250], [80, 215], [120, 205], [150, 185]]); curva('#3c9b3a', 3, [[24, 70], [30, 140], [26, 260], [40, 360]]);
    curva('#16181a', 6, [[60, 370], [120, 350], [180, 370], [230, 350]]); curva('#1f4fb0', 3, [[90, 372], [120, 340], [170, 360], [210, 330]]);
    texFondo = new T.CanvasTexture(c); texFondo.colorSpace = T.SRGBColorSpace; return texFondo;
  }
  /**
   * Armario de intemperie atado al fuste a media altura (bajo a 1,0 m, alto a 1,75 m). ang = dirección de planta hacia la que abre.
   * rFuste = radio del fuste a esa altura. Devuelve el grupo (sin poner).
   */
  function armarioBaculo(P, x, y, z, ang, color = '#169b4a', rFuste = 0.15, abierto = true) {
    const g = new T.Group(), carc = mat(color, { metalness: 0.3, roughness: 0.55 }), W = 0.5, H = 0.75, D = 0.26, z0 = 1.0, cx = rFuste + 0.03 + D / 2;
    const yc = z0 + H / 2, galv = mat('#9aa3a6', { metalness: 0.6, roughness: 0.4 });
    // Abrazaderas al fuste
    for (const dy of [z0 + 0.12, z0 + H - 0.12]) { cj(g, rFuste * 2 + 0.06, 0.05, 0.12, 0, dy, 0, galv); cj(g, 0.06, 0.05, 0.3, rFuste + 0.02, dy, 0, galv); }
    // Cuerpo: fondo, techo con vierteaguas, suelo y laterales
    cj(g, 0.02, H, W, cx - D / 2, yc, 0, carc);
    cj(g, D + 0.04, 0.03, W + 0.05, cx + 0.01, z0 + H + 0.015, 0, carc);
    cj(g, D, 0.02, W, cx, z0 + 0.01, 0, carc);
    for (const s of [-1, 1]) cj(g, D, H, 0.02, cx, yc, s * (W / 2 - 0.01), carc);
    // Placa de montaje con el mazo de cables dibujado
    const placa = new T.Mesh(new T.PlaneGeometry(W - 0.06, H - 0.06), new T.MeshStandardMaterial({ map: texturaFondoArmario(), roughness: 0.7, metalness: 0.2 }));
    placa.position.set(cx - D / 2 + 0.015, yc, 0); placa.rotation.y = Math.PI / 2; g.add(placa);
    const xf = cx - D / 2 + 0.02;                                                           // cara de la placa
    // Parte alta: carril DIN con bornas (azul, gris, verde-amarillo) y automáticos blancos (uno rojo) y base de enchufe
    const yA = z0 + H - 0.13, piezas = [[0.075, 0.03, 0.04, xf + 0.012, yA, 0, '#aab0b3']];
    piezas.push([0.01, 0.012, W - 0.1, xf + 0.005, yA, 0, '#c8ccce']);
    let zz = -W / 2 + 0.06;
    for (const c of ['#2a62c4', '#2a62c4', '#9aa0a4', '#9aa0a4', '#3d9b3a', '#2a62c4', '#9aa0a4']) { piezas.push([0.05, 0.07, 0.011, xf + 0.03, yA, zz, c]); zz += 0.013; }
    zz += 0.012;
    for (const c of ['#f4f4f2', '#f4f4f2', '#d9261c', '#f4f4f2', '#f4f4f2', '#f4f4f2']) { piezas.push([0.06, 0.085, 0.034, xf + 0.035, yA, zz + 0.017, c], [0.012, 0.02, 0.01, xf + 0.067, yA + 0.012, zz + 0.017, '#2a2d30']); zz += 0.036; }
    piezas.push([0.06, 0.07, 0.05, xf + 0.035, yA, Math.min(zz + 0.03, W / 2 - 0.04), '#f4f4f2']);
    // Parte baja: galleta del repartidor de fibra (caja blanca), switch negro con aletas y fuente de alimentación blanca
    const yB = z0 + 0.2;
    piezas.push([0.05, 0.2, 0.15, xf + 0.03, yB, -W / 2 + 0.11, '#eef0ee'], [0.006, 0.012, 0.012, xf + 0.058, yB + 0.06, -W / 2 + 0.1, '#2a2d30']);
    for (let i = 0; i < 4; i++) piezas.push([0.012, 0.012, 0.01, xf + 0.058, yB + 0.095, -W / 2 + 0.06 + i * 0.022, '#2aa84a']);
    piezas.push([0.07, 0.17, 0.12, xf + 0.04, yB + 0.005, 0.03, '#141618']);
    for (let i = 0; i < 6; i++) piezas.push([0.008, 0.15, 0.006, xf + 0.078, yB + 0.005, -0.02 + i * 0.02, '#26292c']);
    piezas.push([0.004, 0.02, 0.03, xf + 0.076, yB + 0.06, 0.03, '#e8e8e4']);
    piezas.push([0.05, 0.11, 0.04, xf + 0.03, yB - 0.01, W / 2 - 0.06, '#e9ebe8'], [0.004, 0.01, 0.01, xf + 0.056, yB + 0.03, W / 2 - 0.06, '#2bd96a']);
    const interior = new T.Mesh(geoColor(piezas), matV()); g.add(interior);
    // Puerta con bisagras en un lateral, abierta para ver el interior, y cerradura
    const piv = new T.Group(); piv.position.set(cx + D / 2, yc, -W / 2);
    const hoja = new T.Mesh(new T.BoxGeometry(0.02, H, W), carc); hoja.position.set(0, 0, W / 2); hoja.castShadow = true; piv.add(hoja);
    cj(piv, 0.03, 0.06, 0.03, 0.015, 0, W - 0.05, mat('#c9ced0', { metalness: 0.7 }));
    const junta = new T.Mesh(new T.BoxGeometry(0.004, H - 0.04, W - 0.04), mat('#1b1d1f')); junta.position.set(-0.012, 0, W / 2); piv.add(junta);
    piv.rotation.y = abierto ? 1.9 : 0; g.add(piv);
    // Pegatina de riesgo eléctrico
    const pg = new T.Mesh(new T.PlaneGeometry(0.07, 0.07), mat('#f2c200')); pg.position.set(cx + D / 2 + 0.012, yc + 0.22, 0.12); pg.rotation.y = Math.PI / 2; g.add(pg);
    return orientar(g, P, x, y, z, ang);
  }

  // ---------- Dron de inspección ----------
  const dron = {
    obj: null, pos: { x: 0, y: 0, z: 0 }, rumbo: 0, cfg: null, lim: null,
    manual: false, vista: false, exterior: false, cam: -0.38, mirar: { yaw: 0, pit: 0 }, teclas: new Set(), m: { vf: 0, vl: 0, vz: 0, giro: 0 }
  };
  const TECLAS_VUELO = ['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 'x', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'pageup', 'pagedown'];
  function pilotoManual(on) {
    if (on === dron.manual) return;
    if (on) { Object.assign(dron.m, { vf: 0, vl: 0, vz: 0, giro: 0 }); dron.cam = -0.38; dron.mirar.yaw = dron.mirar.pit = 0; dron.manual = true; }
    else { dron.teclas.clear(); dron.auto && dron.auto(); }
  }
  addEventListener('keydown', (e) => {
    if (!dron.vista || e.ctrlKey || e.metaKey || e.altKey || (e.target && e.target.closest && e.target.closest('input,textarea,select'))) return;
    const k = e.key.toLowerCase();
    if (k === 'p') { pilotoManual(!dron.manual); e.preventDefault(); return; }
    if (k === 'c') { dron.exterior = !dron.exterior; return; }
    if (!TECLAS_VUELO.includes(k)) return;
    e.preventDefault();
    if (k !== 'shift') pilotoManual(true);
    dron.teclas.add(k);
  });
  addEventListener('keyup', (e) => dron.teclas.delete(e.key.toLowerCase()));
  addEventListener('blur', () => dron.teclas.clear());
  // Arrastrar sobre la escena mueve la mirada del dron (vuelve al frente al soltar)
  { let mira = null;
    addEventListener('pointerdown', (e) => { if (dron.vista && dron.manual && e.target && e.target.tagName === 'CANVAS') mira = { x: e.clientX, y: e.clientY }; });
    addEventListener('pointermove', (e) => { if (!mira) return; dron.mirar.yaw = Math.max(-1.7, Math.min(1.7, dron.mirar.yaw - (e.clientX - mira.x) * 0.006)); dron.mirar.pit = Math.max(-1, Math.min(1, dron.mirar.pit - (e.clientY - mira.y) * 0.006)); mira.x = e.clientX; mira.y = e.clientY; });
    addEventListener('pointerup', () => { if (mira) { mira = null; dron.mirar.yaw = dron.mirar.pit = 0; } }); }

  function montarHudDron() {
    const h = document.createElement('div'); h.id = 'hudDron';
    h.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;font:600 12px/1.2 ui-monospace,Consolas,monospace;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.8)';
    const esq = (pos) => `<i style="position:absolute;${pos};width:34px;height:34px;border:0 solid rgba(255,255,255,.85)"></i>`;
    const boton = 'pointer-events:auto;cursor:pointer;display:grid;place-items:center;min-width:44px;min-height:44px;padding:0 6px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:rgba(15,20,24,.62);color:#fff;font:700 15px/1 system-ui,sans-serif;touch-action:none;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);user-select:none';
    const b = (txt, k, titulo, extra = '') => `<button type="button" data-k="${k}" title="${titulo}" aria-label="${titulo}" style="${boton}${extra}">${txt}</button>`;
    const hueco = '<span></span>';
    const chico = ';font-size:11px;min-height:32px';
    h.innerHTML = esq('top:18%;left:22%;border-top-width:2px;border-left-width:2px') + esq('top:18%;right:22%;border-top-width:2px;border-right-width:2px') + esq('bottom:18%;left:22%;border-bottom-width:2px;border-left-width:2px') + esq('bottom:18%;right:22%;border-bottom-width:2px;border-right-width:2px')
      + '<i style="position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:1.5px solid rgba(255,255,255,.8);border-radius:50%"></i>'
      + '<div id="hudDronTop" style="position:absolute;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);display:grid;gap:6px;justify-items:center;max-width:min(430px,calc(100vw - 24px))">'
      + '<div style="display:flex;gap:10px;align-items:center;padding:6px 10px;border-radius:8px;background:rgba(0,0,0,.45);flex-wrap:wrap;justify-content:center"><span style="width:9px;height:9px;border-radius:50%;background:#ff3b30;box-shadow:0 0 8px #ff3b30"></span>REC · CÁMARA DEL DRON <span id="hudDronDato"></span>'
      + `<button type="button" id="hudDronModo" aria-pressed="false" style="${boton};min-height:28px;min-width:0;font-size:11px;padding:0 10px">Pilotar</button><button type="button" id="hudDronCam" style="${boton};min-height:28px;min-width:0;font-size:11px;padding:0 10px" title="Cambiar la cámara (C)">Cámara</button></div>`
      + '<div id="hudDronVel" style="padding:3px 9px;border-radius:7px;background:rgba(0,0,0,.4);font-size:11px;font-weight:500"></div>'
      + '<div id="hudDronAyuda" style="padding:3px 9px;border-radius:7px;background:rgba(0,0,0,.4);font-size:10.5px;font-weight:500;text-align:center">W/S avanzar · A/D girar · Q/E lateral · R/F subir y bajar · ↑/↓ cámara · Mayús turbo · X frenar · C cámara · P piloto automático · arrastra para mirar</div></div>'
      + '<canvas id="hudDronMapa" width="200" height="124" style="position:absolute;right:calc(12px + env(safe-area-inset-right,0px));top:62px;border-radius:10px;border:1px solid rgba(255,255,255,.3)" aria-label="Mapa de la posición del dron"></canvas>'
      + '<div id="hudDronMandos" style="position:absolute;bottom:calc(14px + env(safe-area-inset-bottom,0px));right:50%;display:flex;gap:26px;align-items:flex-end;transform:translateX(50%)">'
      + `<div style="display:grid;grid-template-columns:repeat(3,44px);gap:6px">${b('⇤', 'q', 'Desplazarse a la izquierda (Q)', chico)}${b('▲', 'w', 'Avanzar (W)')}${b('⇥', 'e', 'Desplazarse a la derecha (E)', chico)}${b('◀', 'a', 'Girar a la izquierda (A)')}${b('■', 'x', 'Frenar (X)')}${b('▶', 'd', 'Girar a la derecha (D)')}${hueco}${b('▼', 's', 'Retroceder (S)')}${hueco}</div>`
      + `<div style="display:grid;grid-template-columns:repeat(2,44px);gap:6px">${b('↥', 'r', 'Subir (R)')}${b('⌃', 'arrowup', 'Inclinar la cámara hacia arriba (↑)', chico)}${b('↧', 'f', 'Bajar (F)')}${b('⌄', 'arrowdown', 'Inclinar la cámara hacia abajo (↓)', chico)}</div></div>`
      ;
    document.body.appendChild(h);
    for (const bt of h.querySelectorAll('button[data-k]')) {
      const k = bt.dataset.k;
      bt.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!dron.manual) pilotoManual(true); dron.teclas.add(k); });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) bt.addEventListener(ev, () => dron.teclas.delete(k));
    }
    h.querySelector('#hudDronModo').addEventListener('click', () => pilotoManual(!dron.manual));
    h.querySelector('#hudDronCam').addEventListener('click', () => { dron.exterior = !dron.exterior; });
    const ajusta = () => { h.querySelector('#hudDronTop').style.left = innerWidth > 900 ? 'calc(50% + 150px)' : '50%'; const m = h.querySelector('#hudDronMandos'); m.style.right = innerWidth > 900 ? '150px' : '50%'; m.style.transform = innerWidth > 900 ? 'none' : 'translateX(50%)'; h.querySelector('#hudDronAyuda').style.display = innerHeight < 520 || innerWidth < 640 ? 'none' : ''; };
    ajusta(); addEventListener('resize', ajusta);
    return h;
  }
  function dibujarMapaDron(cv) {
    if (!cv || !dron.lim) return;
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, l = dron.lim, esc = (W - 16) / (l.x[1] - l.x[0]);
    const X = (x) => 8 + (x - l.x[0]) * esc, Y = (y) => H / 2 - (y - dron.cfg.y) * esc;
    c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(12,18,22,.66)'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
    for (let x = Math.ceil(l.x[0] / 100) * 100; x < l.x[1]; x += 100) { c.beginPath(); c.moveTo(X(x), 0); c.lineTo(X(x), H); c.stroke(); }
    c.strokeStyle = '#9fb0b8'; c.lineWidth = 3; c.beginPath(); c.moveTo(X(dron.cfg.x[0]), Y(dron.cfg.y)); c.lineTo(X(dron.cfg.x[1]), Y(dron.cfg.y)); c.stroke();
    const px = Math.max(6, Math.min(W - 6, X(dron.pos.x))), py = Math.max(6, Math.min(H - 6, Y(dron.pos.y)));
    c.save(); c.translate(px, py); c.rotate(-dron.rumbo);
    c.fillStyle = 'rgba(255,214,10,.22)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(34, -15); c.lineTo(34, 15); c.closePath(); c.fill();
    c.fillStyle = '#ffd60a'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-6, -5.5); c.lineTo(-3, 0); c.lineTo(-6, 5.5); c.closePath(); c.fill(); c.restore();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '600 9px ui-monospace,Consolas,monospace'; c.fillText('LÍNEA', 8, H - 6);
  }

  window.Linea3D = {
    EJES, dinamicos, formatoPk, imagen, LOGOS, lienzo, encajar, focoIR, armarioBaculo, geoColor,
    init(THREE, mergeGeometries) { T = THREE; merge = mergeGeometries; },
    eje() { const id = idEje(); return { id, ...EJES[id] }; },

    /** Cartelón azul de línea y PK (letra blanca), sobre dos postes. `pkEje` = { este: {linea, pk}, ... } sustituye al del eje. */
    cartelPk(ctx, { x, y, z, desplazamiento = 0, porEje = {}, ang = Math.PI / 2 }) {
      const e = this.eje(), dato = porEje[e.id] || { linea: e.linea, pk: e.pk }, pk = formatoPk(dato.pk + desplazamiento);
      const g = new T.Group(), galv = mat('#a9b1b4', { metalness: 0.6, roughness: 0.4 });
      const tex = lienzo(640, 400, [], (c, w, h) => {
        c.fillStyle = '#0b4ea2'; c.beginPath(); c.roundRect(0, 0, w, h, 26); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 12; c.beginPath(); c.roundRect(18, 18, w - 36, h - 36, 16); c.stroke();
        c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '800 150px "Segoe UI", Arial, sans-serif'; c.fillText(dato.linea, w / 2, h * 0.36);
        c.font = '700 96px "Segoe UI", Arial, sans-serif'; c.fillText('PK ' + pk, w / 2, h * 0.72);
      });
      const mc = new T.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.05 });
      const W = 1.6, H = 1.0, zb = 1.9;
      for (const s of [-1, 1]) tubo(g, new T.Vector3(0, 0, s * 0.62), new T.Vector3(0, zb + H, s * 0.62), 0.04, galv);
      cj(g, 0.05, H + 0.04, W + 0.04, 0, zb + H / 2, 0, mat('#e8ecee'));
      for (const s of [-1, 1]) { const p = new T.Mesh(new T.PlaneGeometry(W, H), mc); p.position.set(s * 0.027, zb + H / 2, 0); p.rotation.y = s * Math.PI / 2; g.add(p); }
      orientar(g, ctx.P, x, y, z, ang);
      ctx.poner(ctx.capa, g, 'Cartelón de línea y PK', `Cartelón de fondo azul y letra blanca con la línea (${dato.linea}) y el punto kilométrico (PK ${pk}) de este punto de la ${e.nombre}. El PK es orientativo: el entorno es genérico.`);
      return g;
    },

    /** Cajas amarillas de conexión sobre pie gris junto a la vía. puntos: [[x, y, z], ...] (z = apoyo). */
    cajasConexion(ctx, puntos) {
      if (!puntos.length) return null;
      const amarillo = '#e8d21a', gris = '#8d969c', partes = [
        [0.3, 0.02, 0.3, 0, 0.01, 0, gris], [0.11, 0.5, 0.11, 0, 0.27, 0, gris], [0.24, 0.05, 0.24, 0, 0.53, 0, '#9ea6ab'],
        [0.36, 0.05, 0.36, 0, 0.58, 0, amarillo], [0.32, 0.24, 0.32, 0, 0.72, 0, amarillo], [0.26, 0.03, 0.26, 0, 0.855, 0, '#d9c414'],
        ['c', 0.035, 0.035, 0.07, 0, 0.72, 0.18, '#d9c414', 10], [0.012, 0.18, 0.012, 0.155, 0.72, 0, '#c9b512']
      ];
      const geo = geoColor(partes.map((p) => (p[0] === 'c' ? p : p)));
      const im = new T.InstancedMesh(geo, matV(), puntos.length), o = new T.Object3D();
      puntos.forEach(([x, y, z, ang = 0], i) => { o.position.copy(ctx.P(x, y, z)); o.rotation.set(0, ang, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.castShadow = true;
      ctx.poner(ctx.capa, im, 'Caja de conexión de vía', 'Caja amarilla de conexión sobre pie de acero junto a la vía (conexiones de los equipos de vía: balizas, circuitos y detectores). Posiciones supuestas.');
      return im;
    },
    /** Puntos para las cajas: cada `paso` m a lo largo de cada vía, en su lado exterior. vias: [{ y, z }]. */
    puntosCajas(vias, [xa, xb], paso = 60, fuera = 2.05) {
      const r = [];
      vias.forEach((v, i) => { const lado = vias.length > 1 ? Math.sign(v.y - vias.reduce((s, w) => s + w.y, 0) / vias.length) || 1 : -1; for (let x = xa + (i % 2) * paso / 2; x <= xb; x += paso) r.push([x, v.y + lado * fuera, v.z - 0.12, lado > 0 ? Math.PI : 0]); });
      return r;
    },

    /** Tapas de la canaleta, cada 50 cm (tapa de 47 cm y junta de 3 cm). tramos: [{ x: [a, b], y, z (cara superior), ancho }]. */
    tapasCanaleta(ctx, tramos, limite = 330) {
      const lista = [];
      for (const t of tramos) { const a = Math.max(t.x[0], -limite), b = Math.min(t.x[1], limite); for (let x = a + 0.25; x < b; x += 0.5) lista.push([x, t]); }
      if (!lista.length) return null;
      const anchos = [...new Set(tramos.map((t) => t.ancho))], g = new T.Group(), o = new T.Object3D();
      for (const an of anchos) {
        const mios = lista.filter(([, t]) => t.ancho === an);
        const im = new T.InstancedMesh(new T.BoxGeometry(0.47, 0.03, an * 0.9), mat('#c9c4b8', { roughness: 0.95 }), mios.length);
        mios.forEach(([x, t], i) => { o.position.copy(ctx.P(x, t.y, t.z + 0.012)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
        im.receiveShadow = true; g.add(im);
      }
      ctx.poner(ctx.capa, g, 'Tapas de la canaleta', 'Tapas prefabricadas de hormigón de la canaleta de cables, de 50 cm, colocadas una tras otra a lo largo de la vía.');
      return g;
    },

    /**
     * Acceso del mantenimiento: camino de servicio por fuera del vallado, puerta en el cerramiento y coche blanco de Ineco.
     * o = { x, yValla, lado (±1, de la valla hacia el camino), suelo(x, y), largo (m de camino), ancho, cocheX }.
     * El visor debe dejar el hueco de la puerta en su vallado (de x − 2,1 a x + 2,1). Devuelve la posición de los operarios.
     */
    acceso(ctx, o) {
      const { P } = ctx, { x, yValla, lado } = o, suelo = o.suelo, ancho = o.ancho || 4, yc = yValla + lado * (o.sep ?? 3.1), largo = o.largo || 300;
      // Camino de zahorra con roderas
      const tx = lienzo(128, 256, [], (c, w, h) => {
        c.fillStyle = '#b7a888'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${90 + Math.random() * 60},${80 + Math.random() * 50},${60 + Math.random() * 40},${Math.random() * 0.35})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        c.fillStyle = 'rgba(120,104,80,0.35)'; c.fillRect(w * 0.18, 0, w * 0.14, h); c.fillRect(w * 0.68, 0, w * 0.14, h);
        c.fillStyle = 'rgba(122,140,80,0.35)'; c.fillRect(w * 0.44, 0, w * 0.12, h);
      });
      tx.wrapS = tx.wrapT = T.RepeatWrapping;
      const [ca, cb] = o.caminoX || [x - largo / 2, x + largo / 2], n = Math.round((cb - ca) / 4), pos = [], uv = [], idx = [];
      for (let i = 0; i <= n; i++) { const xx = ca + (cb - ca) * i / n; for (const s of [-1, 1]) { const v = P(xx, yc + s * ancho / 2, suelo(xx, yc + s * ancho / 2) + 0.06); pos.push(v.x, v.y, v.z); uv.push(s < 0 ? 0 : 1, xx / 8); } }
      for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const camino = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tx, roughness: 1, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); camino.receiveShadow = true;
      ctx.poner(ctx.capa, camino, 'Camino de servicio', 'Camino de zahorra paralelo a la vía, por fuera del cerramiento, por el que circulan los vehículos de mantenimiento. Posición supuesta.');

      // Puerta de doble hoja en el cerramiento, con candado y cartel
      const gp = new T.Group(), zp = suelo(x, yValla), verde = mat('#2f5a3f', { metalness: 0.4, roughness: 0.5 });
      const malla = new T.MeshStandardMaterial({ color: '#7f8f86', transparent: true, alphaTest: 0.3, side: T.DoubleSide, map: lienzo(64, 64, [], (c, w) => { c.clearRect(0, 0, w, w); c.fillStyle = '#fff'; for (let i = 0; i < w; i += 16) { c.fillRect(i, 0, 3, w); c.fillRect(0, i, w, 3); } }) });
      malla.map.wrapS = malla.map.wrapT = T.RepeatWrapping; malla.map.repeat.set(10, 10);
      for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(0.12, 2.5, 0.12), verde); p.position.set(s * 2.05, 1.25, 0); p.castShadow = true; gp.add(p); }
      for (const s of [-1, 1]) {
        const hoja = new T.Group(); hoja.position.set(s * 1.98, 0, 0);
        const L = 1.92, cx2 = -s * L / 2;
        for (const yy of [0.12, 2.1]) tubo(hoja, new T.Vector3(0, yy, 0), new T.Vector3(-s * L, yy, 0), 0.025, verde);
        for (const xx of [0, -s * L]) tubo(hoja, new T.Vector3(xx, 0.12, 0), new T.Vector3(xx, 2.1, 0), 0.025, verde);
        tubo(hoja, new T.Vector3(0, 0.12, 0), new T.Vector3(-s * L, 2.1, 0), 0.018, verde);
        const pm = new T.Mesh(new T.PlaneGeometry(L, 1.98), malla); pm.position.set(cx2, 1.11, 0); hoja.add(pm);
        hoja.rotation.y = s < 0 ? -0.0 : 0.0; gp.add(hoja);
      }
      cj(gp, 0.08, 0.1, 0.05, -0.02, 1.1, 0.04, mat('#c9a21a', { metalness: 0.7 }));
      const cartel = new T.Mesh(new T.PlaneGeometry(0.6, 0.4), new T.MeshStandardMaterial({ side: T.DoubleSide, map: lienzo(300, 200, [LOGOS.adif], (c, w, h, [ad]) => {
        c.fillStyle = '#f7d100'; c.fillRect(0, 0, w, h); c.strokeStyle = '#111'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12);
        c.fillStyle = '#111'; c.textAlign = 'center'; c.font = '800 30px Arial'; c.fillText('PROHIBIDO EL PASO', w / 2, 52); c.font = '600 22px Arial'; c.fillText('Personal autorizado', w / 2, 86);
        c.fillStyle = '#fff'; c.fillRect(70, 112, 160, 66); encajar(c, ad, 76, 116, 148, 58);
      }) }));
      cartel.position.set(0.95, 1.45, lado * 0.03); gp.add(cartel);
      orientar(gp, P, x, yValla, zp, 0);
      ctx.poner(ctx.capa, gp, 'Puerta de acceso a la vía', 'Puerta de doble hoja en el cerramiento de la línea, cerrada con candado, por la que el personal de mantenimiento accede a la plataforma desde el camino de servicio. Posición supuesta.');

      // Coche blanco de Ineco aparcado en el camino (sin luces en el techo), con el logotipo bien visible
      const V3 = window.Vehiculos3D, cx = x + (o.cocheX ?? 8.5);
      if (V3) {
        const gc = new T.Group(), cuerpo = new T.Mesh(V3.geoVehiculo(V3.modelos.suv('#f4f5f3', true)), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.3 })); cuerpo.castShadow = true; gc.add(cuerpo);
        const logo = new T.MeshStandardMaterial({ transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, map: lienzo(800, 220, [LOGOS.ineco], (c, w, h, [im]) => { c.clearRect(0, 0, w, h); if (im) encajar(c, im, 10, 10, w - 20, h - 20); else { c.fillStyle = '#1b4a8c'; c.font = '800 150px Arial'; c.textAlign = 'center'; c.fillText('ineco', w / 2, 170); } }) });
        for (const s of [-1, 1]) { const p = new T.Mesh(new T.PlaneGeometry(2.7, 0.8), logo); p.position.set(s * 0.975, 1.0, 0.22); p.rotation.y = s * Math.PI / 2; gc.add(p); }
        gc.position.copy(P(cx, yc + lado * 0.2, suelo(cx, yc) + 0.06)); gc.rotation.y = -Math.PI / 2;
        ctx.poner(ctx.capa, gc, 'Vehículo de mantenimiento de Ineco', 'Todoterreno blanco de Ineco, sin nada en el techo y solo con su logotipo en las puertas, aparcado en el camino de servicio junto a la puerta de acceso a la vía.');
      }
      return { x: x - 1.2, y: yValla + lado * 1.35, f: [0, -lado] };
    },

    /**
     * Dron de inspección. o = { x: [a, b], y (eje de la línea), z (cota de la vía), altura, ancho }.
     * Recorre la línea solo (piloto automático) o se pilota con el teclado y los botones de la vista «Desde el dron»
     * (ver `hudDron`): W/S avanzar, A/D girar, Q/E lateral, R/F subir y bajar, flechas arriba/abajo inclinan la cámara.
     * Linea3D.poseDron() da { pos, mira } para la cámara de la vista.
     */
    dron(ctx, o) {
      const g = new T.Group(), cuerpo = mat('#2a2e33', { metalness: 0.4, roughness: 0.4 }), claro = mat('#e9ecee', { roughness: 0.4 }), E = 1.6;
      cj(g, 0.5 * E, 0.14 * E, 0.34 * E, 0, 0, 0, claro); cj(g, 0.36 * E, 0.08 * E, 0.26 * E, 0, 0.1 * E, 0, cuerpo);
      const rotores = [];
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const fin = new T.Vector3(sx * 0.48 * E, 0.03 * E, sz * 0.42 * E); tubo(g, new T.Vector3(0, 0, 0), fin, 0.022 * E, cuerpo);
        const motor = new T.Mesh(new T.CylinderGeometry(0.05 * E, 0.05 * E, 0.08 * E, 12), cuerpo); motor.position.copy(fin).add(new T.Vector3(0, 0.03 * E, 0)); g.add(motor);
        const disco = new T.Mesh(new T.CylinderGeometry(0.24 * E, 0.24 * E, 0.006, 24), new T.MeshBasicMaterial({ color: '#cfd6da', transparent: true, opacity: 0.28, depthWrite: false })); disco.position.copy(fin).add(new T.Vector3(0, 0.08 * E, 0)); g.add(disco);
        const pala = new T.Mesh(new T.BoxGeometry(0.46 * E, 0.006, 0.035 * E), cuerpo); pala.position.copy(disco.position); g.add(pala); rotores.push(pala);
        const led = new T.Mesh(new T.SphereGeometry(0.025 * E, 8, 6), new T.MeshBasicMaterial({ color: sx > 0 ? '#ff2a1a' : '#2bff6a' })); led.position.copy(fin).add(new T.Vector3(0, -0.03 * E, 0)); g.add(led);
      }
      for (const sz of [-1, 1]) { tubo(g, new T.Vector3(-0.1 * E, -0.05 * E, sz * 0.12 * E), new T.Vector3(-0.1 * E, -0.22 * E, sz * 0.16 * E), 0.012 * E, cuerpo); tubo(g, new T.Vector3(0.1 * E, -0.05 * E, sz * 0.12 * E), new T.Vector3(0.1 * E, -0.22 * E, sz * 0.16 * E), 0.012 * E, cuerpo); tubo(g, new T.Vector3(-0.18 * E, -0.22 * E, sz * 0.16 * E), new T.Vector3(0.18 * E, -0.22 * E, sz * 0.16 * E), 0.012 * E, cuerpo); }
      const gimbal = new T.Mesh(new T.SphereGeometry(0.07 * E, 14, 10), cuerpo); gimbal.position.set(0.2 * E, -0.1 * E, 0); g.add(gimbal);
      const lente = new T.Mesh(new T.SphereGeometry(0.035 * E, 10, 8), new T.MeshStandardMaterial({ color: '#1a3a6a', emissive: '#0a2a5a', roughness: 0.1, metalness: 0.6 })); lente.position.set(0.26 * E, -0.11 * E, 0); g.add(lente);
      ctx.poner(ctx.capa, g, 'Dron de inspección', 'Dron multirrotor de inspección que sobrevuela la línea grabando la vía, la catenaria y el entorno. Su cámara se ve en la vista «Desde el dron», donde también se puede pilotar con el teclado. Recorrido ilustrativo.');
      dinamicos.push(g); dron.obj = g; dron.cfg = o;
      const [xa, xb] = o.x, A = (xb - xa) / 2, xc = (xa + xb) / 2, H = o.altura ?? 32, B = o.ancho ?? 14, w = 7.5 / Math.max(A, 1);
      dron.lim = { x: [xa - 80, xb + 80], y: [o.y - 190, o.y + 190], z: [o.z + (o.zMin ?? 3), o.z + 150] };
      const auto = (t) => {
        const s = t * w, x = xc + A * Math.sin(s), y = o.y + B * Math.sin(2 * s + 0.6) + (o.desvio ?? 0), z = o.z + H + 3 * Math.sin(t * 0.5);
        const vx = A * w * Math.cos(s), vy = 2 * B * w * Math.cos(2 * s + 0.6);
        dron.pos.x = x; dron.pos.y = y; dron.pos.z = z; dron.rumbo = Math.atan2(vy, vx);
        g.position.copy(ctx.P(x, y, z)); g.rotation.set(0, dron.rumbo, 0); g.rotateZ(-0.12); g.rotateX(Math.sin(t * 0.8) * 0.05);
      };
      const pilotar = (dt) => {
        const k = dron.teclas, m = dron.m, l = dron.lim, turbo = k.has('shift') ? 2.6 : 1, tecla = (...ns) => ns.some((n) => k.has(n));
        const eje = (mas, menos) => (tecla(...mas) ? 1 : 0) - (tecla(...menos) ? 1 : 0);
        if (k.has('x')) { m.vf *= 0.85; m.vl *= 0.85; m.vz *= 0.85; }
        const suave = (v, objetivo, a) => v + (objetivo - v) * Math.min(1, dt * a);
        m.vf = suave(m.vf, eje(['w'], ['s']) * 14 * turbo, 1.8);
        m.vl = suave(m.vl, eje(['e'], ['q']) * 8 * turbo, 2.2);
        m.vz = suave(m.vz, eje(['r', 'pageup'], ['f', 'pagedown']) * 5.5 * turbo, 2.4);
        m.giro = suave(m.giro, eje(['a', 'arrowleft'], ['d', 'arrowright']) * 1.05, 3);
        const tilt = eje(['arrowup'], ['arrowdown']) * 0.9 * dt; dron.cam = Math.max(-1.45, Math.min(0.45, dron.cam + tilt));
        dron.rumbo += m.giro * dt;
        const c = Math.cos(dron.rumbo), s = Math.sin(dron.rumbo);
        dron.pos.x = Math.max(l.x[0], Math.min(l.x[1], dron.pos.x + (c * m.vf + s * m.vl) * dt));
        dron.pos.y = Math.max(l.y[0], Math.min(l.y[1], dron.pos.y + (s * m.vf - c * m.vl) * dt));
        dron.pos.z = Math.max(l.z[0], Math.min(l.z[1], dron.pos.z + m.vz * dt));
        g.position.copy(ctx.P(dron.pos.x, dron.pos.y, dron.pos.z)); g.rotation.set(0, dron.rumbo, 0);
        g.rotateZ(-0.04 - m.vf * 0.012); g.rotateX(-m.giro * 0.28 + m.vl * 0.012);
      };
      let previo = null;
      const paso = (t) => {
        const dt = previo === null ? 0 : Math.min(0.1, Math.max(0, t - previo)); previo = t;
        if (dron.manual) pilotar(dt); else auto(t);
        for (const [i, r] of rotores.entries()) r.rotation.y = t * (dron.manual ? 85 : 55) * (i % 2 ? 1 : -1);
      };
      dron.auto = () => { dron.manual = false; previo = null; };
      animar.push(paso); paso(4);
      return g;
    },
    /**
     * Cámara del dron y mandos. Con `on` activo muestra el rótulo REC, los botones de vuelo, el minimapa y la telemetría, y
     * atiende el teclado (cualquier tecla de vuelo pasa a pilotaje manual; «Piloto automático» o P devuelve el recorrido solo).
     */
    hudDron(on) {
      let h = document.getElementById('hudDron');
      dron.vista = !!on;
      if (!on) { if (h) h.hidden = true; clearInterval(this._hud); dron.teclas.clear(); if (dron.manual) dron.auto(); return; }
      if (!h) { h = montarHudDron(); }
      h.hidden = false;
      const e = this.eje(), dato = h.querySelector('#hudDronDato'), modo = h.querySelector('#hudDronModo'), mini = h.querySelector('#hudDronMapa'), vel = h.querySelector('#hudDronVel');
      const pinta = () => {
        if (!dron.obj) return;
        dato.textContent = `· ALT ${Math.round(dron.pos.z - dron.cfg.z)} m · ${e.linea} PK ${formatoPk(e.pk + dron.pos.x)}`;
        modo.textContent = dron.manual ? 'Piloto automático' : 'Pilotar'; modo.setAttribute('aria-pressed', String(dron.manual));
        vel.textContent = dron.manual ? `${Math.round(Math.abs(dron.m.vf) * 3.6)} km/h · cámara ${dron.exterior ? 'exterior' : 'a bordo'}` : 'recorrido automático · pulsa W para pilotar';
        dibujarMapaDron(mini);
      };
      pinta(); clearInterval(this._hud); this._hud = setInterval(pinta, 120);
    },
    /** Cámara del dron: a bordo (un poco por delante y por debajo del cuerpo) o exterior (detrás y arriba) al pilotar. */
    poseDron(P) {
      if (!dron.obj) return null;
      const { x, y, z } = dron.pos, o = dron.cfg;
      if (!dron.manual) {
        const c = Math.cos(dron.rumbo), s = Math.sin(dron.rumbo), avance = 34, mx = x + c * avance, my = (y + s * avance) * 0.35 + o.y * 0.65;
        return { pos: P(x + c * 0.6, y + s * 0.6, z - 0.4), mira: P(mx, my, o.z + 1.0) };
      }
      const yaw = dron.rumbo + dron.mirar.yaw, pit = Math.max(-1.45, Math.min(1.2, dron.cam + dron.mirar.pit)), cp = Math.cos(pit);
      const dx = Math.cos(yaw) * cp, dy = Math.sin(yaw) * cp, dz = Math.sin(pit);
      if (dron.exterior) {
        const d = 9, bx = x - Math.cos(yaw) * d * cp, by = y - Math.sin(yaw) * d * cp, bz = z - dz * d + 1.5;
        return { pos: P(bx, by, bz), mira: P(x + Math.cos(dron.rumbo) * 3, y + Math.sin(dron.rumbo) * 3, z) };
      }
      const c = Math.cos(dron.rumbo), s = Math.sin(dron.rumbo);
      return { pos: P(x + c * 0.6, y + s * 0.6, z - 0.4), mira: P(x + c * 0.6 + dx * 30, y + s * 0.6 + dy * 30, z - 0.4 + dz * 30) };
    },

    /**
     * Material de talud: «terraplen» (tierra compactada con hidrosiembra verde a manchas, regueros y piedras) o «desmonte»
     * (roca y tierra en estratos, con grietas y algo de vegetación en las bermas). rx, ry = repeticiones de la textura.
     */
    matTalud(rx = 20, ry = 4, tipo = 'terraplen') {
      const t = lienzo(512, 512, [], (c, w, h) => {
        const az = (() => { let s = tipo === 'desmonte' ? 7 : 3; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
        if (tipo === 'desmonte') {
          c.fillStyle = '#b39c76'; c.fillRect(0, 0, w, h);
          for (let i = 0; i < 26; i++) { const y = az() * h, hh = 6 + az() * 26; c.fillStyle = ['#a68c66', '#c2ab84', '#9a8360', '#b8a07a'][i % 4]; c.globalAlpha = 0.55; c.fillRect(0, y, w, hh); }
          c.globalAlpha = 1;
          for (let i = 0; i < 90; i++) { c.strokeStyle = `rgba(70,55,40,${0.25 + az() * 0.35})`; c.lineWidth = 1 + az() * 1.5; c.beginPath(); let x = az() * w, y = az() * h; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (az() - 0.5) * 30; y += az() * 22; c.lineTo(x, y); } c.stroke(); }
          for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(110,128,70,${0.25 + az() * 0.3})`; c.beginPath(); c.ellipse(az() * w, az() * h, 6 + az() * 18, 3 + az() * 8, 0, 0, 7); c.fill(); }
        } else {
          c.fillStyle = '#a39470'; c.fillRect(0, 0, w, h);
          // Manchas amplias y difusas de hidrosiembra y matas pequeñas
          for (let i = 0; i < 40; i++) { const x = az() * w, y = az() * h, r = 40 + az() * 90, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${104 + az() * 20 | 0},${124 + az() * 20 | 0},${66 + az() * 14 | 0},.42)`); g.addColorStop(1, 'rgba(110,128,70,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
          for (let i = 0; i < 1400; i++) { c.fillStyle = ['rgba(98,122,58,.55)', 'rgba(122,140,74,.5)', 'rgba(86,104,52,.5)'][i % 3]; c.beginPath(); c.ellipse(az() * w, az() * h, 1.5 + az() * 4, 1 + az() * 2.5, az() * 3, 0, 7); c.fill(); }
          for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(150,130,96,${0.18 + az() * 0.2})`; c.lineWidth = 1.5 + az() * 2; const x = az() * w, y = az() * h; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 4, y + 20, x - 4, y + 40, x + 2, y + 60 + az() * 40); c.stroke(); }
        }
        for (let i = 0; i < 4200; i++) { const v = 80 + az() * 100 | 0; c.fillStyle = `rgba(${v},${v - 8},${v - 22},${0.2 + az() * 0.35})`; c.fillRect(az() * w, az() * h, 1 + az() * 2, 1 + az() * 2); }
        for (let i = 0; i < 160; i++) { const v = 150 + az() * 50 | 0; c.fillStyle = `rgba(${v},${v - 6},${v - 16},.75)`; c.beginPath(); c.ellipse(az() * w, az() * h, 1 + az() * 2.2, 0.8 + az() * 1.6, az() * 3, 0, 7); c.fill(); }
      });
      t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry);
      return new T.MeshStandardMaterial({ map: t, roughness: 1, side: T.DoubleSide });
    },
    /** Bajante escalonada de hormigón por un talud, de a [x, y, z] (coronación) a b [x, y, z] (pie). Devuelve el grupo. */
    bajante(P, a, b, ancho = 0.8) {
      const g = new T.Group(), hm = mat('#c9c5bb', { roughness: 0.95 }), n = Math.max(3, Math.round(Math.abs(a[2] - b[2]) / 0.5));
      const dx = (b[0] - a[0]) / n, dy = (b[1] - a[1]) / n, dz = (b[2] - a[2]) / n, ang = Math.atan2(dy, dx), L = Math.hypot(dx, dy);
      for (let i = 0; i < n; i++) {
        const st = new T.Group(); st.position.copy(P(a[0] + dx * (i + 0.5), a[1] + dy * (i + 0.5), a[2] + dz * (i + 1))); st.rotation.y = ang;
        cj(st, L + 0.05, 0.08, ancho, 0, -0.04, 0, hm); for (const s of [-1, 1]) cj(st, L + 0.05, 0.3, 0.1, 0, 0.05, s * (ancho / 2 + 0.05), hm); cj(st, 0.08, 0.22, ancho, L / 2, 0.06, 0, hm);
        g.add(st);
      }
      return g;
    },
    /** Cuneta de hormigón en V (ancho total `ancho`) a lo largo de x, con la cota del fondo dada por z(x). Devuelve la malla. */
    cuneta(P, x0, x1, y, z, ancho = 1.2) {
      const n = Math.max(1, Math.round((x1 - x0) / 6)), pos = [], idx = [];
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, zz = z(x); for (const [dy, dz] of [[-ancho / 2, 0.12], [0, -0.12], [ancho / 2, 0.12]]) { const v = P(x, y + dy, zz + dz); pos.push(v.x, v.y, v.z); } }
      for (let i = 0; i < n; i++) { const a = i * 3; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new T.Mesh(geo, mat('#bdb8ad', { roughness: 0.95, side: T.DoubleSide })); m.receiveShadow = true; return m;
    },

    /**
     * Arqueta de empalme de fibra de 1 x 1 m con tres tapas de chapa galvanizada (gris claro), pensada para ir adosada a la
     * canaleta: las tres tapas se reparten a lo largo de x (la dirección de la vía). Devuelve el grupo (sin poner).
     */
    arqueta(P, x, y, z) {
      const g = new T.Group(), L = 1.0, ho = mat('#b9b5ab', { roughness: 0.95 });
      const tapa = mat('#b7bcbf', { metalness: 0.15, roughness: 0.55 }), asa = mat('#8d9396', { metalness: 0.2, roughness: 0.5 });
      cj(g, L, 0.12, L, 0, 0.06, 0, ho);                                           // marco de hormigón
      const w = (L - 0.2) / 3;
      for (let i = 0; i < 3; i++) {
        const tx = (i - 1) * (w + 0.02);
        cj(g, w - 0.02, 0.025, L - 0.16, tx, 0.1225, 0, tapa);                     // tapa
        cj(g, w - 0.14, 0.012, 0.05, tx, 0.14, 0, asa);                            // asa de izado
        for (const sy of [-1, 1]) cj(g, 0.035, 0.01, 0.035, tx + (w / 2 - 0.05) * sy, 0.139, (L / 2 - 0.12) * -sy, asa);   // tornillos
      }
      g.position.copy(P(x, y, z)); return g;
    },
    /** Armario de fusión de fibra blanco, en forma de cubo (lado l), adosado a un muro; ang = dirección de planta hacia la que mira la puerta. */
    armarioFusion(P, x, y, z, ang, l = 0.6) {
      const g = new T.Group(), gr = mat('#f2f3f1', { metalness: 0.15, roughness: 0.5 });
      cj(g, l, l, l, l / 2, l / 2, 0, gr);
      cj(g, 0.02, l - 0.06, l - 0.06, l + 0.01, l / 2, 0, mat('#ffffff', { metalness: 0.15, roughness: 0.45 }));
      cj(g, 0.03, 0.09, 0.04, l + 0.03, l / 2, l / 2 - 0.08, mat('#2b2e31'));
      cj(g, l + 0.06, 0.03, l + 0.06, l / 2, l + 0.015, 0, gr);
      const et = new T.Mesh(new T.PlaneGeometry(0.3, 0.12), new T.MeshStandardMaterial({ map: lienzo(256, 100, [], (c, w, h) => { c.fillStyle = '#f7d100'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '800 34px Arial'; c.textAlign = 'center'; c.fillText('FIBRA ÓPTICA', w / 2, 44); c.font = '600 24px Arial'; c.fillText('Empalme DCO', w / 2, 80); }) }));
      et.position.set(l + 0.022, l * 0.8, 0); et.rotation.y = Math.PI / 2; g.add(et);
      for (const s of [-1, 1]) cj(g, 0.05, 0.06, 0.05, l * 0.3 + s * 0.08, -0.03, 0, mat('#1d2023'));      // prensaestopas
      return orientar(g, P, x, y, z, ang);
    }
  };

  // Bucle de animación propio (el dron); se para con la pestaña oculta
  let t0 = performance.now(), t = 0;
  const bucle = () => {
    const ahora = performance.now(), dt = Math.min((ahora - t0) / 1000, 0.1); t0 = ahora; t += reducido ? 0 : dt;
    if (!document.hidden) for (const f of animar) f(t + 4);
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
})();
