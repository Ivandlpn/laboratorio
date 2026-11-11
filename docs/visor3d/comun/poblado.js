/* Vida alrededor de la línea para los visores 3D (sin dependencias propias): un pueblo con calles, plaza con fuente, casas con
   jardín y piscina, iglesia, ayuntamiento, restaurante con terraza, campo de fútbol con grada y focos, piscina municipal,
   cementerio, granjas con animales, aerogeneradores, un globo aerostático, aves en vuelo y vecinos que pasean.
   También los dos operarios de mantenimiento con chaleco amarillo junto al vallado (uno consulta VISOR LAV en el móvil).
   Todo se reparte con semilla fija: es el mismo en cada visita. Las posiciones y los edificios son genéricos (no proceden de cartografía).
   Contrato: Poblado3D.init(THREE); Poblado3D.anadir(ctx) con ctx = { P, poner, capa, altura(x,y), libre(x,y), region, semilla };
   Poblado3D.ocupa(x,y) dice si un punto cae en lo construido; Poblado3D.dinamicos lista lo que se mueve (hay que añadirlo a los
   «dinámicos» del visor antes de fusionar y congelar). */
(function () {
  let T = null;
  const dinamicos = [], reservas = [], animar = [];
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const azarSemilla = (semilla) => { let s = semilla >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const cacheMat = {};
  const mat = (c, o = {}) => { const k = c + JSON.stringify(o); return (cacheMat[k] ||= new T.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0.03, ...o })); };
  const matV = () => (cacheMat.vc ||= new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.02 }));
  const lienzo = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; };
  const elige = (a, az) => a[Math.floor(az() * a.length)];

  const MUROS = ['#f1ebdd', '#e8dcc2', '#efe3c8', '#d9c9a6', '#f4f0e6', '#e5cfb4', '#cdd6d2', '#f0d9b5'];
  const TEJAS = ['#b4553a', '#a94b33', '#c0674a', '#9b4a35', '#8f9aa0'];
  const PIELES = ['#e8b998', '#d9a07c', '#c68a63', '#f0c8a8', '#8d5a3b'];
  const PELOS = ['#2a1d14', '#4a3222', '#7a5530', '#b8935a', '#9a9a9a', '#111111'];
  const ROPA = ['#c0392b', '#2e86c1', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#d35400', '#34495e', '#e8e8e8', '#e84393'];
  const PANTALON = ['#2c3e50', '#34495e', '#5d6d7e', '#7b6a4f', '#1c2833', '#3b5b8c'];

  // ---------- Figuras: cada una son 3 mallas (cuerpo y dos piernas) con color por vértice ----------
  function geo(partes) { return window.Vehiculos3D.geoVehiculo(partes); }
  function persona(o) {
    const s = o.altura || 1, k = (partes) => partes.map((pt) => pt.map((v, i) => (i < 6 ? v * s : v)));
    const piel = o.piel, cuerpo = [
      [0.22, 0.56, o.mujer ? 0.34 : 0.38, 0, 1.18, 0, o.camisa], [0.2, 0.24, 0.2, 0, 1.58, 0, piel],
      [0.1, 0.1, 0.1, 0.0, 1.5, 0, piel],
      [0.012, 0.03, 0.04, 0.103, 1.605, 0.05, '#1c1c1c'], [0.012, 0.03, 0.04, 0.103, 1.605, -0.05, '#1c1c1c'],
      [0.03, 0.05, 0.04, 0.108, 1.565, 0, o.piel], [0.012, 0.016, 0.07, 0.103, 1.52, 0, '#9a5a4a'],
      [0.04, 0.07, 0.03, 0.0, 1.57, 0.105, piel], [0.04, 0.07, 0.03, 0.0, 1.57, -0.105, piel]
    ];
    if (o.casco) { const cc = typeof o.casco === 'string' ? o.casco : '#f4f4f2'; cuerpo.push([0.27, 0.14, 0.26, 0, 1.76, 0, cc], [0.12, 0.025, 0.24, 0.16, 1.7, 0, cc], [0.02, 0.12, 0.2, 0.0, 1.78, 0, '#d9dcdc'], [0.24, 0.02, 0.27, 0, 1.69, 0, '#2a2d30']); }
    else cuerpo.push([0.22, 0.1, 0.22, -0.01, 1.72, 0, o.pelo], [0.04, 0.2, 0.2, -0.1, 1.6, 0, o.pelo]);
    // Pelo largo recogido en coleta (asoma bajo el casco) y melena a los lados
    if (o.mujer) cuerpo.push([0.06, 0.1, 0.2, -0.1, 1.64, 0, o.pelo], [0.07, 0.24, 0.08, -0.15, 1.5, 0, o.pelo], [0.09, 0.06, 0.09, -0.13, 1.64, 0, o.pelo], [0.12, 0.14, 0.03, -0.03, 1.62, 0.105, o.pelo], [0.12, 0.14, 0.03, -0.03, 1.62, -0.105, o.pelo]);
    if (o.chaleco) cuerpo.push([0.235, 0.5, 0.4, 0, 1.2, 0, '#e8e11a'], [0.24, 0.05, 0.405, 0, 1.12, 0, '#d5d9dc'], [0.24, 0.05, 0.405, 0, 1.33, 0, '#d5d9dc'], [0.24, 0.5, 0.05, 0, 1.2, 0.1, '#d5d9dc'], [0.24, 0.5, 0.05, 0, 1.2, -0.1, '#d5d9dc']);
    if (o.movil) {
      for (const sg of [-1, 1]) cuerpo.push([0.1, 0.3, 0.1, 0, 1.3, sg * 0.245, o.manga || o.camisa], [0.3, 0.09, 0.09, 0.16, 1.16, sg * 0.13, o.manga || o.camisa], [0.08, 0.08, 0.08, 0.32, 1.17, sg * 0.06, piel]);
    } else {
      for (const sg of [-1, 1]) cuerpo.push([0.1, 0.52, 0.1, 0, 1.2, sg * 0.245, o.manga || o.camisa], [0.09, 0.09, 0.09, 0, 0.92, sg * 0.245, piel]);
    }
    const g = new T.Group(), m = matV();
    const cu = new T.Mesh(geo(k(cuerpo)), m); cu.castShadow = true; g.add(cu);
    g.piernas = [];
    for (const sg of [-1, 1]) {
      const pivote = new T.Group(); pivote.position.set(0, 0.9 * s, sg * 0.1 * s);
      const pierna = [[0.17, 0.45, 0.17, 0, -0.225, 0, o.pantalon], [0.15, 0.42, 0.15, 0, -0.66, 0, o.pantalon], [0.28, 0.09, 0.17, 0.05, -0.865, 0, '#1d1d1d']];
      const mp = new T.Mesh(geo(k(pierna)), m); mp.castShadow = true; pivote.add(mp); g.add(pivote); g.piernas.push(pivote);
    }
    return g;
  }
  function pantallaMovil() {
    // Aplicación MiPK abierta: pantalla blanca con el icono de la gota y el rótulo «MiPK»
    const t = lienzo(256, 512, (x, w, h) => {
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#8a8f96'; x.font = '600 15px Arial'; x.fillText('09:41', 14, 24); x.fillRect(w - 40, 14, 24, 10);
      const cx = w / 2, cy = 196, R = 58;
      // Gota (marcador de mapa) recortada y rellena con ondas de colores
      x.save();
      x.shadowColor = 'rgba(40,40,80,.28)'; x.shadowBlur = 18; x.shadowOffsetY = 6;
      x.beginPath(); x.arc(cx, cy, R, Math.PI * 0.82, Math.PI * 0.18); x.quadraticCurveTo(cx + R * 0.62, cy + R * 1.25, cx, cy + R * 1.85); x.quadraticCurveTo(cx - R * 0.62, cy + R * 1.25, cx - R * Math.cos(Math.PI * 0.18), cy + R * Math.sin(Math.PI * 0.18)); x.closePath();
      x.fillStyle = '#5a3d93'; x.fill(); x.shadowColor = 'transparent'; x.clip();
      const ola = (c, pts) => { x.fillStyle = c; x.beginPath(); x.moveTo(...pts[0]); for (let i = 1; i < pts.length; i += 3) x.bezierCurveTo(...pts[i], ...pts[i + 1], ...pts[i + 2]); x.closePath(); x.fill(); };
      ola('#a9def4', [[cx - 80, cy - 80], [cx, cy - 90], [cx + 70, cy - 80], [cx + 80, cy - 40], [cx + 20, cy - 52], [cx - 20, cy - 34], [cx - 80, cy - 40]]);
      ola('#58a8dc', [[cx - 80, cy - 46], [cx - 40, cy - 66], [cx - 10, cy - 30], [cx + 20, cy - 44], [cx + 10, cy + 10], [cx - 40, cy + 10], [cx - 80, cy + 10]]);
      ola('#1e5fa0', [[cx - 80, cy - 10], [cx - 50, cy - 22], [cx - 20, cy + 6], [cx, cy + 10], [cx - 4, cy + 80], [cx - 40, cy + 80], [cx - 80, cy + 80]]);
      ola('#e8678f', [[cx + 6, cy - 46], [cx + 40, cy - 72], [cx + 80, cy - 40], [cx + 80, cy - 10], [cx + 60, cy + 10], [cx + 30, cy - 6], [cx + 6, cy - 20]]);
      ola('#c42a5c', [[cx + 10, cy - 6], [cx + 40, cy + 6], [cx + 70, cy - 8], [cx + 80, cy + 20], [cx + 60, cy + 60], [cx + 10, cy + 70], [cx + 10, cy + 20]]);
      ola('#8a2f7c', [[cx + 2, cy + 30], [cx + 30, cy + 40], [cx + 60, cy + 50], [cx + 40, cy + 120], [cx + 10, cy + 120], [cx, cy + 90], [cx + 2, cy + 60]]);
      x.restore();
      // Gota blanca interior
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx - 2, cy - 4, 22, Math.PI * 0.85, Math.PI * 0.15); x.quadraticCurveTo(cx + 12, cy + 26, cx - 2, cy + 46); x.quadraticCurveTo(cx - 16, cy + 26, cx - 2 - 22 * Math.cos(Math.PI * 0.15), cy - 4 + 22 * Math.sin(Math.PI * 0.15)); x.closePath(); x.fill();
      x.fillStyle = '#2f5fb3'; x.font = '800 44px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center';
      try { x.letterSpacing = '9px'; } catch (e) { /* sin letterSpacing */ }
      x.fillText('MiPK', cx + 5, 360);
      try { x.letterSpacing = '0px'; } catch (e) { /* */ }
      x.fillStyle = '#7a8594'; x.font = '500 15px Arial'; x.fillText('Tu punto kilométrico', cx, 394);
    });
    return new T.MeshBasicMaterial({ map: t });
  }
  function movil() {
    const g = new T.Group();
    const cuerpo = new T.Mesh(new T.BoxGeometry(0.078, 0.158, 0.009), mat('#15171a', { roughness: 0.3, metalness: 0.4 }));
    const pant = new T.Mesh(new T.PlaneGeometry(0.07, 0.148), pantallaMovil()); pant.position.z = 0.0051;
    g.add(cuerpo, pant); return g;
  }

  // ---------- Animales ----------
  function animal(tipo, az) {
    const g = new T.Group(), m = matV(); let cuerpo, cabeza, cx, cy;
    if (tipo === 'vaca') {
      const c1 = elige([['#f3f1ea', '#1b1b1b'], ['#a5622f', '#f1e6d2'], ['#3a2a22', '#e8dccb']], az);
      cuerpo = [[1.9, 0.8, 0.7, 0, 1.1, 0, c1[0]], [0.6, 0.3, 0.72, 0.1, 1.3, 0, c1[1]], [0.45, 0.28, 0.72, -0.55, 1.05, 0, c1[1]], [0.12, 0.6, 0.12, -1.0, 1.0, 0, c1[0]], [0.3, 0.2, 0.2, -0.95, 0.65, 0, '#222'],
        ...[[0.7, 0.25], [0.7, -0.25], [-0.7, 0.25], [-0.7, -0.25]].map(([x, z]) => [0.14, 0.75, 0.14, x, 0.4, z, c1[0]]), [0.3, 0.2, 0.45, 0.9, 0.78, 0, '#e9b4b0']];
      cabeza = [[0.45, 0.38, 0.34, 0.22, -0.08, 0, c1[0]], [0.14, 0.16, 0.3, 0.45, -0.18, 0, '#e3a9a5'], [0.05, 0.14, 0.05, 0.08, 0.16, 0.14, '#f1e6c8'], [0.05, 0.14, 0.05, 0.08, 0.16, -0.14, '#f1e6c8']]; cx = 1.0; cy = 1.35;
    } else if (tipo === 'oveja') {
      cuerpo = [[0.95, 0.52, 0.5, 0, 0.68, 0, '#efeae0'], [0.3, 0.3, 0.4, 0.1, 0.9, 0, '#e8e2d4'], ...[[0.3, 0.15], [0.3, -0.15], [-0.3, 0.15], [-0.3, -0.15]].map(([x, z]) => [0.07, 0.4, 0.07, x, 0.2, z, '#3b3633'])];
      cabeza = [[0.26, 0.24, 0.2, 0.14, -0.04, 0, '#3b3633'], [0.05, 0.04, 0.12, 0.0, 0.1, 0.12, '#3b3633'], [0.05, 0.04, 0.12, 0.0, 0.1, -0.12, '#3b3633']]; cx = 0.5; cy = 0.88;
    } else if (tipo === 'caballo') {
      const c = elige(['#6b4426', '#2a1b14', '#b88a54', '#8c8c8c'], az);
      cuerpo = [[1.7, 0.7, 0.55, 0, 1.3, 0, c], [0.5, 0.75, 0.3, 0.85, 1.55, 0, c], [0.12, 0.7, 0.06, 0.72, 1.62, 0, '#1c1410'], [0.1, 0.8, 0.1, -0.9, 1.15, 0, '#1c1410'],
        ...[[0.62, 0.2], [0.62, -0.2], [-0.62, 0.2], [-0.62, -0.2]].map(([x, z]) => [0.12, 0.95, 0.12, x, 0.48, z, c])];
      cabeza = [[0.62, 0.3, 0.26, 0.28, -0.14, 0, c], [0.05, 0.12, 0.05, 0.0, 0.1, 0.07, c], [0.05, 0.12, 0.05, 0.0, 0.1, -0.07, c]]; cx = 1.05; cy = 1.95;
    } else {
      const c = elige(['#b8925a', '#2b2b2b', '#e6dccb'], az);
      cuerpo = [[0.6, 0.28, 0.24, 0, 0.5, 0, c], ...[[0.2, 0.08], [0.2, -0.08], [-0.2, 0.08], [-0.2, -0.08]].map(([x, z]) => [0.07, 0.3, 0.07, x, 0.18, z, c]), [0.06, 0.25, 0.06, -0.34, 0.62, 0, c]];
      cabeza = [[0.22, 0.2, 0.18, 0.1, 0.02, 0, c], [0.1, 0.07, 0.12, 0.24, -0.03, 0, '#222']]; cx = 0.34; cy = 0.65;
    }
    const cu = new T.Mesh(geo(cuerpo), m); cu.castShadow = true; g.add(cu);
    const piv = new T.Group(); piv.position.set(cx, cy, 0); const ca = new T.Mesh(geo(cabeza), m); ca.castShadow = true; piv.add(ca); g.add(piv);
    g.cabezaPiv = piv; return g;
  }


  // ---------- Conversación de los operarios: se mueven con suavidad y ella explica en un bocadillo de cómic ----------
  const PAGINAS = [
    'El solicitante que precise acceder a la traza de la vía, deberá efectuar llamada al CPS de la línea correspondiente para:',
    '•  Identificarse.\n•  Solicitar autorización de acceso.\n•  Identificar el punto de acceso (punto kilométrico, puerta, etc.).\n•  Especificar los motivos que justifican el acceso, relacionándolos con su autorización en la herramienta PIDAME de ser necesario.'
  ];
  const VEL_TECLEO = 26, RETENCION = [1.8, 6.5], PAUSA = 2;
  function envolver(c, texto, ancho) {
    const lineas = []; let pos = 0;
    for (const parr of texto.split('\n')) {
      let linea = '', ini = pos;
      for (const palabra of parr.split(' ')) {
        const prueba = linea ? linea + ' ' + palabra : palabra;
        if (linea && c.measureText(prueba).width > ancho) { lineas.push({ txt: linea, ini }); ini += linea.length + 1; linea = palabra; } else linea = prueba;
      }
      lineas.push({ txt: linea, ini }); pos += parr.length + 1;
    }
    return lineas;
  }
  function pintarBocadillo(c, w, h, pagina, n) {
    const cola = 78, cx = w * 0.17;
    c.clearRect(0, 0, w, h);
    c.save(); c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
    c.fillStyle = '#fffdf3'; c.strokeStyle = '#17181a'; c.lineWidth = 9; c.lineJoin = 'round';
    c.beginPath(); c.roundRect(12, 12, w - 24, h - cola - 20, 44); c.fill();
    c.beginPath(); c.moveTo(cx + 70, h - cola - 10); c.lineTo(cx, h - 6); c.lineTo(cx - 12, h - cola - 10); c.closePath(); c.fill();
    c.restore();
    c.beginPath(); c.moveTo(cx + 70, h - cola - 10); c.lineTo(cx, h - 6); c.lineTo(cx - 12, h - cola - 10);
    c.stroke();
    c.beginPath(); c.roundRect(12, 12, w - 24, h - cola - 20, 44); c.stroke();
    c.fillStyle = '#fffdf3'; c.fillRect(cx - 8, h - cola - 16, 74, 12);   // une la cola con el cuerpo sin raya
    c.fillStyle = '#17181a'; c.font = '700 43px "Comic Sans MS","Segoe Print","Chalkboard SE","Marker Felt",cursive,sans-serif'; c.textBaseline = 'top';
    const texto = PAGINAS[pagina], lin = envolver(c, texto, w - 120), paso = 54;
    const total = lin.length * paso, y0 = 12 + Math.max(26, (h - cola - 20 - total) / 2);
    lin.forEach((l, i) => { const vis = Math.max(0, Math.min(l.txt.length, n - l.ini)); if (vis > 0) c.fillText(l.txt.slice(0, vis), 62, y0 + i * paso); });
    if (n < texto.length) { c.fillStyle = '#17181a'; c.fillRect(w - 80, h - cola - 70, 14, 14); }
  }
  function hablar(ctx, t, g, a, b, th, bx, by) {
    const { P } = ctx, alt = ctx.altura, W = 1024, H = 640, escala = 3.7;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(escala, escala * H / W, 1); sp.center.set(0.17, 0); sp.renderOrder = 20; sp.raycast = () => {};
    // Se desvanece cuando la cámara se le echa encima (vista del móvil) para no tapar la escena
    sp.onBeforeRender = (r, sc, cam) => { sp.material.opacity = Math.max(0, Math.min(1, (cam.position.distanceTo(sp.position) - 2.2) / 2.6)); };
    sp.position.copy(P(bx, by, alt(bx, by) + 1.95 * 0.95 + 0.14)); g.add(sp);
    const ctx2 = cv.getContext('2d');
    const duraciones = PAGINAS.map((p, i) => p.length / VEL_TECLEO + RETENCION[i]), ciclo = duraciones.reduce((x, y) => x + y, 0) + PAUSA;
    let ultimo = '';
    const estado = (seg) => {
      let r = seg % ciclo;
      for (let i = 0; i < PAGINAS.length; i++) {
        const tecleo = PAGINAS[i].length / VEL_TECLEO;
        if (r < tecleo) return { pagina: i, n: Math.floor(r * VEL_TECLEO), habla: true };
        if (r < duraciones[i]) return { pagina: i, n: PAGINAS[i].length, habla: false };
        r -= duraciones[i];
      }
      return { pagina: -1, n: 0, habla: false };
    };
    const dibuja = (e) => {
      const clave = e.pagina + ':' + e.n; if (clave === ultimo) return; ultimo = clave;
      if (e.pagina < 0) { sp.visible = false; return; }
      sp.visible = true; pintarBocadillo(ctx2, W, H, e.pagina, e.n); tex.needsUpdate = true;
    };
    dinamicos.push(a, b, sp);
    if (reducido) { dibuja({ pagina: 1, n: PAGINAS[1].length, habla: false }); return; }
    // Movimiento sutil: él escucha (se balancea y asiente), ella habla (gira un poco, gesticula y se apoya alternando las piernas)
    const a0 = { y: a.position.y, ry: a.rotation.y }, b0 = { y: b.position.y, ry: b.rotation.y };
    let ritmo = 0, previo = 0;
    animar.push((seg) => {
      const dt = Math.min(0.1, Math.max(0, seg - previo)); previo = seg;
      const e = estado(seg); dibuja(e);
      ritmo += dt * (e.habla ? 1 : 0.35);
      const gesto = e.habla ? 1 : 0.25;
      b.rotation.y = b0.ry + Math.sin(ritmo * 3.1) * 0.07 * gesto + Math.sin(seg * 0.5) * 0.03;
      b.rotation.z = Math.sin(ritmo * 4.3 + 1) * 0.022 * gesto;
      b.position.y = b0.y + Math.abs(Math.sin(ritmo * 3.1)) * 0.016 * gesto;
      b.piernas[0].rotation.z = Math.sin(seg * 0.35) * 0.05; b.piernas[1].rotation.z = -Math.sin(seg * 0.35) * 0.05;
      a.rotation.y = a0.ry - 0.1 + Math.sin(seg * 0.7) * 0.035 + (e.habla ? Math.max(0, Math.sin(seg * 1.9)) * 0.05 : 0);
      a.rotation.z = Math.sin(seg * 0.9 + 2) * 0.014;
      a.position.y = a0.y + (e.habla ? Math.max(0, Math.sin(seg * 1.9)) * 0.012 : 0);
      a.piernas[0].rotation.z = -Math.sin(seg * 0.3 + 1) * 0.04; a.piernas[1].rotation.z = Math.sin(seg * 0.3 + 1) * 0.04;
    });
  }

  window.Poblado3D = {
    dinamicos, reservas,
    init(THREE) { T = THREE; },
    ocupa(x, y) { return reservas.some(([a, b, c, d]) => x > a - 4 && x < b + 4 && y > c - 4 && y < d + 4); },

    /** Cámaras recomendadas para los operarios (geometría pura). lista: [{ x, y, f: [fx, fy] }]; alt(x, y). */
    vistas(t, alt) {
      const z = alt(t.x, t.y), [fx, fy] = t.f, lx = fy, ly = -fx;
      const loc = (a, b, h) => [t.x + a * fx + b * lx, t.y + a * fy + b * ly, z + h];
      // Por detrás de los operarios, que miran a la vía: se ven de espaldas con el trazado delante
      return {
        medio: { desde: t.desde || loc(-4.2, 0.9, 2.6), hacia: t.mira || loc(9, 0.2, 1.2) },
        movil: { desde: loc(0.78, 0.55, 1.44), hacia: loc(0.36, 0.0, 1.27) }
      };
    },

    /** Dos operarios de mantenimiento (un hombre y una mujer) con chaleco de alta visibilidad y casco blanco; él consulta MiPK en el móvil. */
    trabajadores(ctx, t) {
      const { P, poner, capa } = ctx, alt = ctx.altura, az = azarSemilla(97), [fx, fy] = t.f, th = Math.atan2(fy, fx);
      const lx = fy, ly = -fx, g = new T.Group();
      const base = { casco: '#f4f4f2', chaleco: true, pantalon: '#233044', manga: '#2b3a52' };
      const a = persona({ ...base, camisa: '#2b3a52', piel: '#d9a07c', pelo: '#2a1d14', movil: true });
      const bx = t.x - 1.1 * lx, by = t.y - 1.1 * ly;
      const b = persona({ ...base, camisa: '#37465f', piel: '#e8b998', pelo: '#5a3a22', mujer: true, altura: 0.95 });
      a.position.copy(P(t.x, t.y, alt(t.x, t.y))); a.rotation.y = th;
      b.position.copy(P(bx, by, alt(bx, by))); b.rotation.y = th + 0.45;
      const ph = movil(); ph.scale.setScalar(1.55); ph.position.set(0.36, 1.27, 0.0); ph.rotation.order = 'YXZ'; ph.rotation.y = -0.57; ph.rotation.x = -0.4; a.add(ph);
      for (const p of [a, b]) for (const pv of p.piernas) pv.rotation.z = 0;
      g.add(a, b);
      hablar(ctx, t, g, a, b, th, bx, by);
      // Casco de repuesto y bolsa de herramientas en el suelo, junto a ellos
      const bolsa = new T.Mesh(new T.BoxGeometry(0.5, 0.25, 0.3), mat('#3a3d40')); bolsa.position.copy(P(t.x + 0.7 * lx - 0.5 * fx, t.y + 0.7 * ly - 0.5 * fy, alt(t.x, t.y) + 0.13)); bolsa.rotation.y = th; g.add(bolsa);
      poner(capa, g, 'Operarios de mantenimiento', 'Un operario y una operaria de mantenimiento con casco blanco y chaleco de alta visibilidad, en el camino de servicio junto a la puerta del cerramiento; él consulta la aplicación MiPK en el móvil y ella explica, en un bocadillo, cómo se pide acceso a la traza de la vía: llamada al CPS de la línea para identificarse, solicitar autorización, indicar el punto de acceso y los motivos (PIDAME). Figuras genéricas.');
      return g;
    },

    anadir(ctx) {
      const { P, poner, capa } = ctx, alt = ctx.altura, azar = azarSemilla((ctx.semilla || 5) * 7 + 3), libre = ctx.libre; window.Poblado3D._alt = alt;
      const [rx0, rx1, ry0, ry1] = ctx.region || [-300, 300, -300, 300];
      const sitios = [];
      const info = (window.Poblado3D.sitios = {});
      const buscar = (w, h, tol, margen = 10, intentos = 900, op = {}) => {
        // Entre los sitios válidos que aparecen se elige el más cercano al centro de la escena (o a `op.cerca`): así se ve desde las vistas
        let mejor = null, validos = 0; const [zx0, zx1, zy0, zy1] = op.zona || [rx0, rx1, ry0, ry1], [qx, qy] = op.cerca || [0, 0];
        for (let k = 0; k < intentos && validos < (op.validos || 14); k++) {
          const cx = zx0 + w / 2 + azar() * (zx1 - zx0 - w), cy = zy0 + h / 2 + azar() * (zy1 - zy0 - h), x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
          if (sitios.some((s) => x0 < s[1] + margen && x1 > s[0] - margen && y0 < s[3] + margen && y1 > s[2] - margen)) continue;
          let mn = 1e9, mx = -1e9, ok = true; const px = Math.max(6, w / 9), py = Math.max(6, h / 9);
          for (let x = x0; x <= x1 + 0.01 && ok; x += px) for (let y = y0; y <= y1 + 0.01; y += py) { if (!libre(x, y)) { ok = false; break; } const z = alt(x, y); mn = Math.min(mn, z); mx = Math.max(mx, z); }
          if (!ok || mx - mn > tol) continue;
          validos++; const d = Math.hypot(cx - qx, cy - qy);
          if (!mejor || d < mejor.d) mejor = { d, cx, cy, x0, x1, y0, y1, z: (mn + mx) / 2 };
        }
        if (!mejor) return null;
        sitios.push([mejor.x0, mejor.x1, mejor.y0, mejor.y1]); reservas.push([mejor.x0, mejor.x1, mejor.y0, mejor.y1]); return mejor;
      };

      // ---------- Primitivas ----------
      const caja = (g, x0, x1, y0, y1, z0, z1, m, sombra = true) => { const b = new T.Mesh(new T.BoxGeometry(x1 - x0, z1 - z0, y1 - y0), m); b.position.copy(P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); b.castShadow = sombra; b.receiveShadow = true; g.add(b); return b; };
      const cil = (g, x, y, z0, z1, r0, r1, m, seg = 10) => { const b = new T.Mesh(new T.CylinderGeometry(r1, r0, z1 - z0, seg), m); b.position.copy(P(x, y, (z0 + z1) / 2)); b.castShadow = true; g.add(b); return b; };
      const tri = (g, tris, m) => {
        const pos = []; for (const t of tris) for (const p of t) { const v = P(...p); pos.push(v.x, v.y, v.z); }
        const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); ge.computeVertexNormals();
        const b = new T.Mesh(ge, m); b.castShadow = true; b.receiveShadow = true; g.add(b);
      };
      const mTeja = (c) => mat(c, { side: T.DoubleSide, roughness: 0.8 });
      const tejado = (g, x0, x1, y0, y1, zb, h, eje, color, mur, v = 0.4) => {
        const a = x0 - v, b = x1 + v, c = y0 - v, d = y1 + v, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, mt = mTeja(color);
        if (eje === 'x') {
          tri(g, [[[a, c, zb], [b, c, zb], [b, ym, zb + h]], [[a, c, zb], [b, ym, zb + h], [a, ym, zb + h]], [[a, d, zb], [b, ym, zb + h], [b, d, zb]], [[a, d, zb], [a, ym, zb + h], [b, ym, zb + h]]], mt);
          tri(g, [[[x0, y0, zb], [x0, y1, zb], [x0, ym, zb + h]], [[x1, y0, zb], [x1, ym, zb + h], [x1, y1, zb]]], mat(mur, { side: T.DoubleSide }));
        } else {
          tri(g, [[[a, c, zb], [a, d, zb], [xm, d, zb + h]], [[a, c, zb], [xm, d, zb + h], [xm, c, zb + h]], [[b, c, zb], [xm, d, zb + h], [b, d, zb]], [[b, c, zb], [xm, c, zb + h], [xm, d, zb + h]]], mt);
          tri(g, [[[x0, y0, zb], [xm, y0, zb + h], [x1, y0, zb]], [[x0, y1, zb], [x1, y1, zb], [xm, y1, zb + h]]], mat(mur, { side: T.DoubleSide }));
        }
      };
      const cinta = (g, x0, x1, y0, y1, nx, ny, m, desp = 0.07) => {
        const pos = [], idx = [], uv = [];
        for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const x = x0 + (x1 - x0) * i / nx, y = y0 + (y1 - y0) * j / ny, v = P(x, y, alt(x, y) + desp); pos.push(v.x, v.y, v.z); uv.push(i / nx, j / ny); }
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
        const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals();
        const b = new T.Mesh(ge, m); b.receiveShadow = true; g.add(b); return b;
      };
      const mAsfalto = mat('#4b4e52', { side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const mAcera = mat('#b8b0a0', { side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      const mAdoq = mat('#a89d88', { side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
      const mLinea = mat('#e8e6dc', { side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
      const mAgua = mat('#2aa9d6', { roughness: 0.08, metalness: 0.15, emissive: '#0a4d6e', emissiveIntensity: 0.35 });
      const mBlanco = mat('#f2f2ee'), mMadera = mat('#7a5a3a'), mHierro = mat('#3d4246', { metalness: 0.5, roughness: 0.5 });
      const mVidrio = mat('#2c3a46', { roughness: 0.2, metalness: 0.3 });
      const arbol = (g, x, y, tipo = 0) => {
        const z = alt(x, y), h = 4.5 + azar() * 3;
        cil(g, x, y, z, z + h * 0.55, 0.16, 0.22, mat('#6b5440'), 6);
        const mm = mat(['#4f7a3a', '#5f8a3f', '#6f9a45', '#3f6a35'][Math.floor(azar() * 4)]);
        for (const [dx, dy, dz, r] of [[0, 0, h * 0.75, 1.9], [0.8, 0.4, h * 0.6, 1.4], [-0.7, -0.5, h * 0.62, 1.5], [0.2, -0.8, h * 0.85, 1.2]]) { const b = new T.Mesh(new T.IcosahedronGeometry(r * (0.9 + tipo * 0.1), 1), mm); b.position.copy(P(x + dx, y + dy, z + dz)); b.scale.y = 0.85; b.castShadow = true; g.add(b); }
      };
      const farola = (g, x, y) => { const z = alt(x, y); cil(g, x, y, z, z + 5.2, 0.07, 0.09, mHierro, 6); caja(g, x - 0.35, x + 0.35, y - 0.15, y + 0.15, z + 5.1, z + 5.25, mHierro); caja(g, x - 0.3, x + 0.3, y - 0.12, y + 0.12, z + 5.0, z + 5.1, mat('#fff6d0', { emissive: '#ffe8a0', emissiveIntensity: 0.4 })); };
      const banco = (g, x, y, dir) => { const z = alt(x, y); caja(g, x - 0.9, x + 0.9, y - 0.25, y + 0.25, z + 0.42, z + 0.5, mMadera); caja(g, x - 0.9, x + 0.9, y + dir * 0.25, y + dir * 0.32, z + 0.5, z + 0.95, mMadera); caja(g, x - 0.8, x - 0.7, y - 0.22, y + 0.22, z, z + 0.42, mHierro); caja(g, x + 0.7, x + 0.8, y - 0.22, y + 0.22, z, z + 0.42, mHierro); };
      const piscina = (g, x, y, w, d, z) => {
        // Coronación de piedra alrededor del vaso y lámina de agua
        const mb = mat('#d6cfc0'), a = x - w / 2, b = x + w / 2, c = y - d / 2, e = y + d / 2;
        caja(g, a - 0.7, b + 0.7, c - 0.7, c, z - 0.6, z + 0.12, mb); caja(g, a - 0.7, b + 0.7, e, e + 0.7, z - 0.6, z + 0.12, mb);
        caja(g, a - 0.7, a, c, e, z - 0.6, z + 0.12, mb); caja(g, b, b + 0.7, c, e, z - 0.6, z + 0.12, mb);
        caja(g, a, b, c, e, z - 0.6, z + 0.02, mAgua, false);
        caja(g, x + w / 2 - 0.02, x + w / 2 + 0.3, y - 0.1, y + 0.1, z + 0.12, z + 0.9, mHierro);
      };
      const tumbona = (g, x, y, rot, c = '#f2f2ee') => { const z = alt(x, y); const b = caja(g, x - 0.35, x + 0.35, y - 0.9, y + 0.9, z + 0.25, z + 0.38, mat(c)); caja(g, x - 0.35, x + 0.35, y + 0.2, y + 0.9, z + 0.38, z + 0.78, mat(c)); void rot; return b; };

      // ---------- Casas ----------
      const ventana = (g, x, yf, sg, zb) => {
        const e = (m, a, b2, a2, b3, zz0, zz1) => caja(g, a, b2, Math.min(yf + sg * a2, yf + sg * b3), Math.max(yf + sg * a2, yf + sg * b3), zz0, zz1, m, false);
        e(mBlanco, x - 0.68, x + 0.68, 0, 0.09, zb - 0.1, zb + 1.5);
        e(mVidrio, x - 0.52, x + 0.52, 0, 0.12, zb, zb + 1.3);
        e(mat(sg > 0 ? '#3d6b4f' : '#7b5a3a'), x - 1.0, x - 0.7, 0, 0.1, zb, zb + 1.3); e(mat(sg > 0 ? '#3d6b4f' : '#7b5a3a'), x + 0.7, x + 1.0, 0, 0.1, zb, zb + 1.3);
        e(mat('#9a9488'), x - 0.8, x + 0.8, 0, 0.2, zb - 0.16, zb - 0.08);
      };
      const ventanaLat = (g, xs, sx, y, zb) => {
        caja(g, Math.min(xs, xs + sx * 0.09), Math.max(xs, xs + sx * 0.09), y - 0.68, y + 0.68, zb - 0.1, zb + 1.5, mBlanco, false);
        caja(g, Math.min(xs, xs + sx * 0.12), Math.max(xs, xs + sx * 0.12), y - 0.52, y + 0.52, zb, zb + 1.3, mVidrio, false);
      };
      const casa = (g, x, y, w, d, pisos, mur, tej, frente, opciones = {}) => {
        const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2;
        const z0 = Math.max(alt(x0, y0), alt(x1, y0), alt(x0, y1), alt(x1, y1), alt(x, y)), h = 3 * pisos + 0.2;
        caja(g, x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, z0 - 3.5, z0 + 0.4, mat('#b6ad9b'));
        caja(g, x0, x1, y0, y1, z0 + 0.4, z0 + h, mat(mur));
        const yf = frente > 0 ? y1 : y0, n = Math.max(2, Math.round(w / 3.6)), puerta = Math.floor(n / 2);
        for (let p = 0; p < pisos; p++) for (let i = 0; i < n; i++) {
          const xx = x0 + (i + 0.5) * w / n;
          if (p === 0 && i === puerta) {
            caja(g, xx - 0.6, xx + 0.6, Math.min(yf, yf + frente * 0.1), Math.max(yf, yf + frente * 0.1), z0 + 0.4, z0 + 2.6, mat(['#6b4a2e', '#3f5d7a', '#7a2f2f', '#4d6b4a'][Math.floor(azar() * 4)]), false);
            caja(g, xx - 0.9, xx + 0.9, Math.min(yf, yf + frente * 0.9), Math.max(yf, yf + frente * 0.9), z0 + 0.1, z0 + 0.42, mat('#9a9488'), false);
          } else ventana(g, xx, yf, frente, z0 + 0.4 + p * 3 + 0.9);
        }
        if (d > 7) for (let p = 0; p < pisos; p++) { ventanaLat(g, x0, -1, y, z0 + 0.4 + p * 3 + 0.9); ventanaLat(g, x1, 1, y, z0 + 0.4 + p * 3 + 0.9); }
        const eje = w >= d ? 'x' : 'y', hr = 1.6 + Math.min(w, d) * 0.16;
        tejado(g, x0, x1, y0, y1, z0 + h, hr, eje, tej, mur);
        caja(g, x1 - 1.6, x1 - 1.0, y - 0.3, y + 0.3, z0 + h, z0 + h + hr + 0.6, mat('#a08c7a')); caja(g, x1 - 1.7, x1 - 0.9, y - 0.4, y + 0.4, z0 + h + hr + 0.55, z0 + h + hr + 0.7, mat('#6e6258'));
        if (opciones.balcon && pisos > 1) { const yb = frente > 0 ? y1 : y0, xb = x; caja(g, xb - 1.4, xb + 1.4, Math.min(yb, yb + frente * 1.1), Math.max(yb, yb + frente * 1.1), z0 + 3.25, z0 + 3.4, mat('#cfc8b8')); for (let k = -1.4; k <= 1.4; k += 0.35) caja(g, xb + k - 0.02, xb + k + 0.02, yb + frente * 1.05 - 0.02, yb + frente * 1.05 + 0.02, z0 + 3.4, z0 + 4.3, mHierro, false); }
        if (opciones.parabolica) { const zz = z0 + h + hr * 0.4; cil(g, x0 + 1.2, yf - frente * 0.4, zz, zz + 0.9, 0.02, 0.02, mHierro, 4); const b = new T.Mesh(new T.SphereGeometry(0.4, 10, 6, 0, Math.PI), mBlanco); b.position.copy(P(x0 + 1.2, yf - frente * 0.4, zz + 0.9)); b.rotation.x = -0.6; g.add(b); }
        const mac = mat(['#c0392b', '#d35400', '#e84393', '#f1c40f'][Math.floor(azar() * 4)]);
        for (let k = 0; k < 2; k++) { const xx = x0 + 0.8 + k * (w - 1.6); caja(g, xx - 0.2, xx + 0.2, yf + frente * 0.9 - 0.2, yf + frente * 0.9 + 0.2, z0 + 0.4, z0 + 0.7, mat('#a85a3a'), false); const b = new T.Mesh(new T.SphereGeometry(0.28, 6, 5), mac); b.position.copy(P(xx, yf + frente * 0.9, z0 + 0.85)); g.add(b); }
        return { z0, h, chim: [x1 - 1.3, y, z0 + h + hr + 0.8] };
      };

      // =============== EL PUEBLO ===============
      let pueblo = buscar(172, 124, 4.2, 14, 1400), nivel = 2;
      if (!pueblo) { pueblo = buscar(122, 84, 4.2, 14, 1400); nivel = 1; }
      if (pueblo) {
        info.pueblo = pueblo;
        const { cx, cy } = pueblo, V = (dx, dy) => [cx + dx, cy + dy], g = new T.Group();
        const R = nivel === 2 ? 70 : 48, Y = nivel === 2 ? 52 : 34;
        // Calles y plaza
        const EXT = 120;
        cinta(g, cx - R - 6 - EXT, cx + R + 6 + EXT, cy - 3.6, cy + 3.6, 70, 2, mAsfalto);
        cinta(g, cx - 3.2, cx + 3.2, cy - Y - 6, cy + Y + 6, 2, 30, mAsfalto);
        cinta(g, cx - R - 6 - EXT, cx + R + 6 + EXT, cy - 0.12, cy + 0.12, 140, 1, mLinea, 0.09);
        if (nivel === 2) for (const sy of [-1, 1]) cinta(g, cx - R, cx + R, cy + sy * 36 - 3, cy + sy * 36 + 3, 36, 2, mAsfalto);
        cinta(g, cx - 10, cx + 10, cy - 10, cy + 10, 6, 6, mAdoq, 0.1);
        for (const sy of [-1, 1]) for (const [a, b] of [[-R - 6, R + 6]]) cinta(g, cx + a, cx + b, cy + sy * 4.4 - 0.9, cy + sy * 4.4 + 0.9, 40, 1, mAcera, 0.1);
        // Fuente central
        const zF = alt(cx, cy); cil(g, cx, cy, zF, zF + 0.7, 2.6, 2.6, mat('#bdb5a3'), 20); cil(g, cx, cy, zF + 0.1, zF + 0.72, 2.3, 2.3, mAgua, 20); cil(g, cx, cy, zF, zF + 2.1, 0.25, 0.35, mat('#bdb5a3'), 8); cil(g, cx, cy, zF + 2.0, zF + 2.3, 0.9, 0.5, mat('#bdb5a3'), 12);
        reservas.push([cx - 3, cx + 3, cy - 3, cy + 3]);
        for (const [dx, dy, d] of [[-7, 7.5, -1], [7, 7.5, -1], [-7, -7.5, 1], [7, -7.5, 1]]) banco(g, cx + dx, cy + dy, d);
        for (const [dx, dy] of [[-8.5, -8.5], [8.5, -8.5], [-8.5, 8.5], [8.5, 8.5]]) arbol(g, cx + dx, cy + dy, 1);
        // Edificios singulares: [x0, x1, y0, y1]
        const rs = [[12, 27, 9, 32], [-29, -11, 9, 21], [-10, 10, -23, -10.5]];
        // Iglesia (al norte-este de la plaza), nave a lo largo de y, torre en la fachada sur
        {
          const x0 = cx + 13, x1 = cx + 25, y0 = cy + 10, y1 = cy + 32, z0 = Math.max(alt(x0, y0), alt(x1, y1), alt(cx + 19, cy + 20)), pied = mat('#d9ceb6'), cu = mat('#a9503a', { side: T.DoubleSide }), gi = new T.Group();
          caja(gi, x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, z0 - 3.5, z0 + 0.5, mat('#b9ae98'));
          caja(gi, x0, x1, y0 + 5, y1, z0 + 0.5, z0 + 9.5, pied);
          tejado(gi, x0, x1, y0 + 5, y1, z0 + 9.5, 3.6, 'y', '#a9503a', '#d9ceb6', 0.5);
          for (const xs of [x0, x1]) for (let k = 0; k < 4; k++) { const yy = y0 + 8.5 + k * 5; caja(gi, Math.min(xs, xs + (xs === x0 ? -0.1 : 0.1)), Math.max(xs, xs + (xs === x0 ? -0.1 : 0.1)), yy - 0.45, yy + 0.45, z0 + 4.5, z0 + 7.6, mat('#3b5b86', { emissive: '#1a2c44', emissiveIntensity: 0.3 })); }
          caja(gi, x0 + 3.5, x1 - 3.5, y1, y1 + 3, z0 + 0.5, z0 + 7.5, pied); caja(gi, x0 + 4.2, x1 - 4.2, y1 + 3, y1 + 3.2, z0 + 0.5, z0 + 5, mat('#cabf9f'));
          tejado(gi, x0 + 3.5, x1 - 3.5, y1, y1 + 3, z0 + 7.5, 2.2, 'y', '#a9503a', '#d9ceb6', 0.3);
          // Torre
          const tx0 = x0 + 3.2, tx1 = x1 - 3.2, ty0 = y0, ty1 = y0 + 5.5;
          caja(gi, tx0, tx1, ty0, ty1, z0 + 0.5, z0 + 16, pied); caja(gi, tx0 - 0.15, tx1 + 0.15, ty0 - 0.15, ty1 + 0.15, z0 + 16, z0 + 16.4, mat('#cabf9f'));
          caja(gi, tx0, tx1, ty0, ty1, z0 + 16.4, z0 + 20, pied);
          for (const sg of [-1, 1]) { caja(gi, (tx0 + tx1) / 2 - 0.6, (tx0 + tx1) / 2 + 0.6, sg > 0 ? ty1 : ty0 - 0.1, sg > 0 ? ty1 + 0.1 : ty0, z0 + 17, z0 + 19.2, mat('#251c16')); caja(gi, sg > 0 ? tx1 : tx0 - 0.1, sg > 0 ? tx1 + 0.1 : tx0, (ty0 + ty1) / 2 - 0.6, (ty0 + ty1) / 2 + 0.6, z0 + 17, z0 + 19.2, mat('#251c16')); }
          tri(gi, [[[tx0 - 0.3, ty0 - 0.3, z0 + 20], [tx1 + 0.3, ty0 - 0.3, z0 + 20], [(tx0 + tx1) / 2, (ty0 + ty1) / 2, z0 + 26]], [[tx1 + 0.3, ty0 - 0.3, z0 + 20], [tx1 + 0.3, ty1 + 0.3, z0 + 20], [(tx0 + tx1) / 2, (ty0 + ty1) / 2, z0 + 26]], [[tx1 + 0.3, ty1 + 0.3, z0 + 20], [tx0 - 0.3, ty1 + 0.3, z0 + 20], [(tx0 + tx1) / 2, (ty0 + ty1) / 2, z0 + 26]], [[tx0 - 0.3, ty1 + 0.3, z0 + 20], [tx0 - 0.3, ty0 - 0.3, z0 + 20], [(tx0 + tx1) / 2, (ty0 + ty1) / 2, z0 + 26]]], mat('#5f6a72'));
          const xc = (tx0 + tx1) / 2, yc = (ty0 + ty1) / 2; caja(gi, xc - 0.05, xc + 0.05, yc - 0.05, yc + 0.05, z0 + 26, z0 + 28, mHierro); caja(gi, xc - 0.5, xc + 0.5, yc - 0.05, yc + 0.05, z0 + 27.2, z0 + 27.35, mHierro);
          // Reloj en la fachada
          const rel = new T.Mesh(new T.CircleGeometry(0.9, 24), new T.MeshBasicMaterial({ map: lienzo(128, 128, (x, w, h) => { x.fillStyle = '#f4efe2'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.stroke(); x.lineWidth = 6; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 24); x.stroke(); x.lineWidth = 4; x.beginPath(); x.moveTo(64, 64); x.lineTo(92, 74); x.stroke(); }) }));
          rel.position.copy(P(xc, ty0 - 0.2, z0 + 13)); rel.rotation.y = Math.PI; gi.add(rel);
          // Nido de cigüeña
          caja(gi, xc - 0.7, xc + 0.7, yc - 0.7, yc + 0.7, z0 + 20, z0 + 20.5, mat('#6b5a3a'));
          poner(capa, gi, 'Iglesia', 'Iglesia parroquial con nave, torre-campanario con reloj y chapitel, y nido de cigüeña. Edificio genérico.'); void cu;
        }
        // Restaurante con terraza y toldo
        {
          const x0 = cx - 29, x1 = cx - 11, y0 = cy + 9, y1 = cy + 21, z0 = Math.max(alt(x0, y0), alt(x1, y1)), gr = new T.Group();
          caja(gr, x0, x1, y0, y1, z0 - 3, z0 + 0.4, mat('#b6ad9b')); caja(gr, x0, x1, y0, y1, z0 + 0.4, z0 + 4.2, mat('#e9d7b4'));
          tejado(gr, x0, x1, y0, y1, z0 + 4.2, 2.4, 'x', '#b4553a', '#e9d7b4');
          for (let i = 0; i < 4; i++) { const xx = x0 + 2.2 + i * 4.2; caja(gr, xx - 1.1, xx + 1.1, y0 - 0.1, y0, z0 + 0.9, z0 + 3.0, mat('#e8d8a8', { emissive: '#ffcf70', emissiveIntensity: 0.25 }), false); caja(gr, xx - 1.2, xx + 1.2, y0 - 0.06, y0, z0 + 0.8, z0 + 0.9, mBlanco, false); }
          const cart = new T.Mesh(new T.PlaneGeometry(7, 1.5), new T.MeshBasicMaterial({ map: lienzo(512, 110, (x, w, h) => { x.fillStyle = '#7a1f1f'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e8c97a'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = '#f6e3b0'; x.font = '800 54px Georgia, serif'; x.textAlign = 'center'; x.fillText('RESTAURANTE', w / 2, 70); }) }));
          cart.position.copy(P((x0 + x1) / 2, y0 - 0.2, z0 + 3.6)); cart.rotation.y = Math.PI; gr.add(cart);
          // Toldo a rayas
          const tl = new T.Mesh(new T.BoxGeometry(14, 0.1, 3), new T.MeshStandardMaterial({ map: lienzo(256, 32, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#fff' : '#c0392b'; x.fillRect(i * 16, 0, 16, h); } }), roughness: 0.9 }));
          tl.position.copy(P((x0 + x1) / 2, y0 - 1.5, z0 + 3.0)); tl.rotation.x = 0.0; gr.add(tl);
          for (const xx of [x0 + 1, x1 - 1]) cil(gr, xx, y0 - 2.9, z0, z0 + 3.0, 0.05, 0.05, mHierro, 6);
          // Terraza: mesas, sillas y sombrillas
          const colores = ['#c0392b', '#f1c40f', '#2e86c1', '#27ae60'];
          for (let i = 0; i < 6; i++) {
            const tx = x0 + 2 + i * 2.9, ty = y0 - 4.6 + (i % 2) * 0.4, tz = alt(tx, ty);
            cil(gr, tx, ty, tz + 0.72, tz + 0.76, 0.5, 0.5, mat('#f3efe6'), 12); cil(gr, tx, ty, tz, tz + 0.72, 0.04, 0.04, mHierro, 6);
            for (const [dx, dy] of [[0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]]) caja(gr, tx + dx - 0.18, tx + dx + 0.18, ty + dy - 0.18, ty + dy + 0.18, tz + 0.42, tz + 0.46, mMadera, false);
            if (i % 2 === 0) { cil(gr, tx, ty, tz + 0.76, tz + 2.4, 0.03, 0.03, mHierro, 4); const s = new T.Mesh(new T.ConeGeometry(1.5, 0.5, 8), mat(colores[i % 4], { side: T.DoubleSide })); s.position.copy(P(tx, ty, tz + 2.6)); gr.add(s); }
          }
          poner(capa, gr, 'Restaurante', 'Restaurante del pueblo con toldo a rayas y terraza con mesas y sombrillas. Edificio genérico.');
        }
        // Ayuntamiento con bandera
        {
          const x0 = cx - 10, x1 = cx + 10, y0 = cy - 23, y1 = cy - 11, z0 = Math.max(alt(x0, y0), alt(x1, y1)), ga = new T.Group();
          caja(ga, x0, x1, y0, y1, z0 - 3, z0 + 0.5, mat('#b6ad9b')); caja(ga, x0, x1, y0, y1, z0 + 0.5, z0 + 8, mat('#e4cfa0'));
          caja(ga, x0 - 0.2, x1 + 0.2, y0 - 0.2, y1 + 0.2, z0 + 3.8, z0 + 4.0, mat('#cdb98a')); tejado(ga, x0, x1, y0, y1, z0 + 8, 2.8, 'x', '#a9503a', '#e4cfa0');
          for (let p = 0; p < 2; p++) for (let i = 0; i < 6; i++) { const xx = x0 + 2.2 + i * 3.1; if (p === 0 && i === 2) continue; ventana(ga, xx, y1, 1, z0 + 1.0 + p * 4.1); }
          caja(ga, cx - 1.1, cx + 1.1, y1, y1 + 0.15, z0 + 0.5, z0 + 3.3, mat('#4a3322'));
          for (const xx of [-1.5, 1.5]) cil(ga, cx + xx, y1 + 1.3, z0 + 0.5, z0 + 4.0, 0.2, 0.2, mat('#e9dcc0'), 8);
          caja(ga, cx - 2.2, cx + 2.2, y1, y1 + 1.6, z0 + 4.0, z0 + 4.2, mat('#cdb98a'));
          const zm = alt(cx + 12, cy - 9); cil(ga, cx + 12, cy - 9, zm, zm + 9, 0.05, 0.07, mHierro, 6);
          const banda = new T.Mesh(new T.PlaneGeometry(2.4, 1.6, 6, 1), new T.MeshStandardMaterial({ map: lienzo(30, 20, (x, w, h) => { x.fillStyle = '#c60b1e'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffc400'; x.fillRect(0, h * 0.25, w, h * 0.5); }), side: T.DoubleSide, roughness: 0.9 }));
          banda.position.copy(P(cx + 13.2, cy - 9, zm + 8.1)); ga.add(banda); 
          poner(capa, ga, 'Ayuntamiento', 'Ayuntamiento con soportales, balcón y bandera. Edificio genérico.');
          if (!reducido) { dinamicos.push(ga); animar.push((t) => { const pos = banda.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, Math.sin(x * 2.2 + t * 4) * 0.12 * (x + 1.2) / 2.4); } pos.needsUpdate = true; }); }
        }
        reservas.push(...rs.map(([a, b, c, d]) => [cx + a, cx + b, cy + c, cy + d]));
        // Casas por filas
        const filas = nivel === 2 ? [[11, -1], [-11, 1], [29, 1], [43, -1], [-29, -1], [-43, 1]] : [[11, -1], [-11, 1]];
        const chocaRes = (x0, x1, y0, y1) => rs.some(([a, b, c, d]) => x0 < cx + b + 1 && x1 > cx + a - 1 && y0 < cy + d + 1 && y1 > cy + c - 1);
        let nCasas = 0; const chimeneas = [];
        for (const [fy, frente] of filas) {
          let x = -R + 2;
          while (x < R - 6) {
            const w = 8 + Math.floor(azar() * 5), d = 8 + Math.floor(azar() * 2), px = cx + x + w / 2, py = cy + fy;
            const dentroCalle = Math.abs(x + w / 2) < 5 + w / 2;
            if (!dentroCalle && !chocaRes(px - w / 2, px + w / 2, py - d / 2, py + d / 2) && libre(px, py) && azar() > 0.08) {
              const pisos = azar() > 0.6 ? 2 : 1, mur = elige(MUROS, azar), tej = elige(TEJAS, azar);
              const rc = casa(g, px, py, w, d, pisos, mur, tej, frente, { balcon: pisos === 2 && azar() > 0.4, parabolica: azar() > 0.55 }); nCasas++;
              if (azar() > 0.72 && chimeneas.length < 7) chimeneas.push(rc.chim);
              // Jardín trasero: piscina, árbol, tumbonas
              const yb = py - frente * (d / 2 + 5.5);
              if (azar() > 0.45 && w > 8.5 && libre(px, yb)) { const zp = alt(px, yb), lp = w > 10 ? 6 : 4.6; piscina(g, px, yb, lp, 3.2, zp); tumbona(g, px - lp / 2 - 1.2, yb - 0.5, 0, '#f4f0e0'); tumbona(g, px + lp / 2 + 1.2, yb + 0.4, 0, '#e6c34a'); }
              else if (azar() > 0.5) arbol(g, px + (azar() - 0.5) * w * 0.6, yb);
            }
            x += w + 1.4 + azar() * 2.2;
          }
        }
        // Árboles de calle y farolas
        for (let x = -R; x <= R; x += 14) for (const sy of [-1, 1]) { if (Math.abs(x) < 12) continue; arbol(g, cx + x + 3, cy + sy * 5.3, 0); if (Math.round(x / 14) % 2 === 0) farola(g, cx + x, cy + sy * 4.9); }
        for (const sy of [-1, 1]) for (const [x, y] of [[-8, 5.6], [8, 5.6]]) farola(g, cx + x, cy + sy * y);
        // Coches aparcados
        const V3 = window.Vehiculos3D, cochesPark = [];
        for (let k = 0; k < 9; k++) { const x = cx - R + 8 + azar() * (2 * R - 16), sy = azar() > 0.5 ? 1 : -1, y = cy + sy * 3.0; if (Math.abs(x - cx) < 12) continue; cochesPark.push([x, y, sy]); }
        const gp = new T.Group();
        for (const [x, y, sy] of cochesPark) { const tipo = elige(['coche', 'coche', 'suv', 'furgoneta'], azar), mm = new T.Mesh(geo(V3.modelos[tipo](elige(['#c8c8c4', '#2a2d33', '#9b2a2a', '#2f5d8c', '#e8e8e4', '#4d5b3a'], azar))), matV()); mm.position.copy(P(x, y, alt(x, y))); mm.rotation.y = Math.PI / 2 * (sy > 0 ? 1 : -1); mm.castShadow = true; gp.add(mm); }
        poner(capa, gp, 'Coches aparcados', 'Turismos, todoterrenos y furgonetas aparcados en las calles del pueblo.');
        poner(capa, g, 'Pueblo', `Pueblo genérico de ${nCasas} viviendas con calles, plaza con fuente, jardines con piscina, árboles y farolas. Reparto supuesto: no procede de cartografía.`);

        // Vecinos que pasean por la plaza y las calles
        const recorridos = [[[-9, -6], [9, -6], [9, 6], [-9, 6]], [[-60, 5.6], [60, 5.6]], [[60, -5.6], [-60, -5.6]], [[2, -40], [2, 40]], [[-4, 40], [-4, -40]], [[-30, 5.6], [-12, 5.6], [-12, 3]], [[-8, -5.5], [8, -5.5]]];
        recorridos.forEach((rec, i) => {
          const q = persona({ camisa: elige(ROPA, azar), pantalon: elige(PANTALON, azar), pelo: elige(PELOS, azar), piel: elige(PIELES, azar), altura: 0.92 + azar() * 0.16 });
          const pts = rec.map(([dx, dy]) => [cx + dx, cy + dy]), vel = 1.1 + azar() * 0.5, cer = i % 2 === 0 || rec.length > 2, s0 = caminar(q, pts, vel, cer);
          poner(capa, q, 'Vecino', 'Vecino paseando por el pueblo. Figura genérica.'); dinamicos.push(q);
          if (i % 2 === 1) { const d = animal('perro', azar); caminar(d, pts, vel, cer, s0 + 2.4); poner(capa, d, 'Perro', 'Perro paseando con su dueño.'); dinamicos.push(d); }
        });
        // Clientes sentados en la terraza
        for (const i of [0, 1, 2, 4]) {
          const q = persona({ camisa: elige(ROPA, azar), pantalon: elige(PANTALON, azar), pelo: elige(PELOS, azar), piel: elige(PIELES, azar), altura: 0.95 });
          const tx = cx - 29 + 2 + i * 2.9 + 0.75, ty = cy + 9 - 4.6 + (i % 2) * 0.4; q.position.copy(P(tx, ty, alt(tx, ty) - 0.38)); q.rotation.y = Math.PI;
          for (const pv of q.piernas) pv.rotation.z = 1.4;
          poner(capa, q, 'Cliente de la terraza', 'Cliente sentado en la terraza del restaurante.');
        }
        // Coches que circulan por la calle mayor
        for (const [sg, c, v] of [[1, '#c8c8c4', 5.5], [-1, '#2f5d8c', 4.5]]) {
          const mm = new T.Group(), ca = new T.Mesh(geo(V3.modelos.coche(c)), matV()); ca.castShadow = true; mm.add(ca);
          const y = cy + sg * -1.8; poner(capa, mm, 'Coche', 'Turismo circulando por la calle mayor.'); dinamicos.push(mm);
          let t0 = azar() * 20; animar.push((t) => { const L = 2 * (R + EXT) + 20, s = ((t * v + t0 * v) % L); const x = sg > 0 ? cx - R - EXT - 10 + s : cx + R + EXT + 10 - s; mm.position.copy(P(x, y, alt(x, y))); mm.rotation.y = sg > 0 ? -Math.PI / 2 : Math.PI / 2; });
        }
        // Niños que juegan alrededor de la fuente
        for (let k = 0; k < 3; k++) {
          const q = persona({ camisa: elige(ROPA, azar), pantalon: elige(PANTALON, azar), pelo: elige(PELOS, azar), piel: elige(PIELES, azar), altura: 0.62 });
          poner(capa, q, 'Niño', 'Niño jugando en la plaza.'); dinamicos.push(q);
          const r = 4.6 + k * 0.5, w = (0.35 + k * 0.08) * (k % 2 ? -1 : 1), ph = k * 2.1;
          animar.push((t) => { const a = ph + t * w, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; q.position.copy(P(x, y, alt(x, y))); q.rotation.y = a + Math.sign(w) * Math.PI / 2; const f = Math.sin(t * 7 + k) * 0.8; q.piernas[0].rotation.z = f; q.piernas[1].rotation.z = -f; });
        }
        // Humo de chimeneas
        if (chimeneas.length) {
          const gh = new T.Group(), puffs = [], mh = new T.MeshBasicMaterial({ color: '#d9dadc', transparent: true, opacity: 0.4, depthWrite: false });
          chimeneas.forEach(([x, y, z], i) => { for (let k = 0; k < 5; k++) { const b = new T.Mesh(new T.SphereGeometry(0.45, 7, 6), mh.clone()); gh.add(b); puffs.push([b, x, y, z, k / 5 + i * 0.13]); } });
          poner(capa, gh, 'Humo de chimeneas', 'Humo ligero de las chimeneas del pueblo. Decorativo.'); dinamicos.push(gh);
          animar.push((t) => { for (const [b, x, y, z, ph] of puffs) { const u = ((t * 0.13 + ph) % 1); b.position.copy(P(x + u * 3.5, y + u * 1.2, z + u * 8)); b.scale.setScalar(0.5 + u * 2.6); b.material.opacity = 0.42 * (1 - u); } });
        }
        // Parada de autobús, papeleras y contenedores
        { const gb = new T.Group(), mp = mat('#2a6f4f'), xb = cx - 42, yb = cy - 5.4;
          caja(gb, xb - 2, xb + 2, yb - 0.9, yb + 0.9, alt(xb, yb) + 2.5, alt(xb, yb) + 2.65, mHierro); for (const dx of [-1.9, 1.9]) caja(gb, xb + dx - 0.05, xb + dx + 0.05, yb - 0.85, yb + 0.85, alt(xb, yb), alt(xb, yb) + 2.5, mHierro);
          caja(gb, xb - 1.9, xb + 1.9, yb - 0.85, yb - 0.8, alt(xb, yb) + 0.4, alt(xb, yb) + 2.4, mat('#b9d4dc', { transparent: true, opacity: 0.45 }), false); caja(gb, xb - 1.2, xb + 1.2, yb - 0.5, yb - 0.1, alt(xb, yb) + 0.45, alt(xb, yb) + 0.55, mMadera);
          caja(gb, xb + 2.4, xb + 2.5, yb - 0.4, yb + 0.4, alt(xb + 2.4, yb), alt(xb + 2.4, yb) + 2.6, mHierro); caja(gb, xb + 2.2, xb + 2.7, yb - 0.45, yb + 0.45, alt(xb + 2.4, yb) + 2.2, alt(xb + 2.4, yb) + 2.9, mat('#1f5fa8'));
          for (const x of [-52, -24, 22, 54]) { const xx = cx + x, yy = cy + 5.3; cil(gb, xx, yy, alt(xx, yy), alt(xx, yy) + 0.9, 0.22, 0.2, mp, 8); }
          [['#2f7d3a', 0], ['#2a5fb5', 1.3], ['#e0b81d', 2.6]].forEach(([c, d]) => { const xx = cx + 50 + d, yy = cy - 5.6; caja(gb, xx - 0.5, xx + 0.5, yy - 0.5, yy + 0.5, alt(xx, yy), alt(xx, yy) + 1.3, mat(c)); caja(gb, xx - 0.55, xx + 0.55, yy - 0.55, yy + 0.55, alt(xx, yy) + 1.3, alt(xx, yy) + 1.4, mat('#222')); });
          poner(capa, gb, 'Mobiliario urbano', 'Marquesina de autobús, papeleras y contenedores de reciclaje. Genérico.'); }
        // Postes de madera con cableado a lo largo de la calle mayor
        { const gl = new T.Group(), xs = []; for (let x = -R - 2; x <= R + 2; x += 26) xs.push(x); const cab = [];
          xs.forEach((x) => { const xx = cx + x, yy = cy + 6.2, zz = alt(xx, yy); cil(gl, xx, yy, zz, zz + 8, 0.12, 0.17, mMadera, 6); caja(gl, xx - 0.05, xx + 0.05, yy - 1.1, yy + 1.1, zz + 7.3, zz + 7.45, mMadera); for (const dy of [-0.9, 0, 0.9]) { cil(gl, xx, yy + dy, zz + 7.45, zz + 7.75, 0.04, 0.04, mat('#cdd4d6'), 5); cab.push([xx, yy + dy, zz + 7.8, dy]); } });
          for (let i = 0; i < xs.length - 1; i++) for (let k = 0; k < 3; k++) { const a = cab[i * 3 + k], b = cab[(i + 1) * 3 + k], pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10, v = P(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u - Math.sin(u * Math.PI) * 0.7); pts.push(v); } gl.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: '#1f2326' }))); }
          poner(capa, gl, 'Tendido eléctrico del pueblo', 'Postes de madera con cableado de baja tensión. Decorativo.'); }

        // Señalética de direcciones con las ciudades del eje, junto a la bandera del ayuntamiento
        if (window.Linea3D) {
          const e = window.Linea3D.eje(), gs = new T.Group(), xs = cx + 3.5, ys = cy + 8.4, zs = alt(xs, ys), mPoste = mat('#5d666c', { metalness: 0.5, roughness: 0.45 });
          cil(gs, xs, ys, zs, zs + 5.6, 0.08, 0.09, mPoste, 10); cil(gs, xs, ys, zs + 5.6, zs + 5.75, 0.12, 0.08, mPoste, 10);
          const pala = (texto, sentido) => lienzo(512, 112, (x, w, h) => {
            x.clearRect(0, 0, w, h); x.fillStyle = '#0b4ea2'; x.strokeStyle = '#ffffff'; x.lineWidth = 7;
            const pts = sentido > 0 ? [[6, 8], [w - 70, 8], [w - 6, h / 2], [w - 70, h - 8], [6, h - 8]] : [[w - 6, 8], [70, 8], [6, h / 2], [70, h - 8], [w - 6, h - 8]];
            x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); x.stroke();
            x.fillStyle = '#ffffff'; x.font = '700 58px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, w / 2 + (sentido > 0 ? -26 : 26), h / 2 + 3);
          });
          e.ciudades.forEach(([nombre, grados], i) => {
            const b = new T.Group(), L = 2.0, H = 0.44;
            for (const sg of [1, -1]) { const p = new T.Mesh(new T.PlaneGeometry(L, H), new T.MeshStandardMaterial({ map: pala(nombre, sg), transparent: true, alphaTest: 0.4, roughness: 0.5 })); p.position.set(0.09 + L / 2, 0, sg * 0.012); if (sg < 0) p.rotation.y = Math.PI; b.add(p); }
            b.position.copy(P(xs, ys, zs + 5.4 - i * 0.46)); b.rotation.y = grados * Math.PI / 180; gs.add(b);
          });
          poner(capa, gs, 'Señalética de direcciones', `Poste de señalización con flechas hacia las ciudades de la ${e.nombre}: ${e.ciudades.map((c) => c[0]).join(', ')}. Direcciones orientativas.`);
          reservas.push([xs - 1, xs + 1, ys - 1, ys + 1]);
        }

        // Valla publicitaria de VISOR LAV a la entrada del pueblo
        if (window.Linea3D) {
          const L3 = window.Linea3D, cand = [[cx + R + 24, cy + 13], [cx - R - 24, cy + 13], [cx + R + 24, cy - 13], [cx - R - 24, cy - 13]];
          const sitio = cand.find(([x, y]) => [-5, 0, 5].every((d) => libre(x + d, y) && libre(x + d, y + (y > cy ? 3 : -3))));
          if (sitio) {
            const [vx, vy] = sitio, gv = new T.Group(), zv = alt(vx, vy), W = 9, H = 4.5, z0 = zv + 3.6, acero = mat('#4b5257', { metalness: 0.55, roughness: 0.45 });
            const tex = L3.lienzo(1280, 640, [L3.LOGOS.ojo, L3.LOGOS.adif, L3.LOGOS.ineco], (x, w, h, [ojo, ad, ine]) => {
              const f = x.createLinearGradient(0, 0, w, h); f.addColorStop(0, '#0f2442'); f.addColorStop(1, '#030b18'); x.fillStyle = f; x.fillRect(0, 0, w, h);
              const r = x.createRadialGradient(w / 2, h * 0.36, 10, w / 2, h * 0.36, 360); r.addColorStop(0, 'rgba(56,189,248,.28)'); r.addColorStop(1, 'rgba(56,189,248,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h);
              if (ojo) x.drawImage(ojo, w / 2 - 150, 34, 300, 300);
              else { x.strokeStyle = '#38bdf8'; x.lineWidth = 14; x.beginPath(); x.moveTo(w / 2 - 140, 184); x.quadraticCurveTo(w / 2, 40, w / 2 + 140, 184); x.quadraticCurveTo(w / 2, 328, w / 2 - 140, 184); x.stroke(); }
              x.textBaseline = 'alphabetic'; x.font = '900 120px "Segoe UI", Arial, sans-serif';
              const t1 = 'VISOR ', t2 = 'LAV', w1 = x.measureText(t1).width, w2 = x.measureText(t2).width, x0 = w / 2 - (w1 + w2) / 2;
              x.textAlign = 'left'; x.fillStyle = '#ffffff'; x.fillText(t1, x0, 466); x.fillStyle = '#38bdf8'; x.fillText(t2, x0 + w1, 466);
              x.textAlign = 'center'; x.fillStyle = '#a9c3dc'; x.font = '500 34px "Segoe UI", Arial, sans-serif'; x.fillText('La red de alta velocidad, a un clic', w / 2, 516);
              for (const [im, bx] of [[ad, 40], [ine, w - 40 - 300]]) { x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(bx, h - 116, 300, 92, 16); x.fill(); if (im) L3.encajar(x, im, bx + 16, h - 108, 268, 76); }
            });
            const mv = new T.MeshStandardMaterial({ map: tex, roughness: 0.55, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.08 });
            const ang = vy > cy ? 0 : Math.PI, gpanel = new T.Group();
            for (const sg of [1, -1]) { const pl = new T.Mesh(new T.PlaneGeometry(W, H), mv); pl.position.set(0, 0, sg * 0.16); if (sg < 0) pl.rotation.y = Math.PI; gpanel.add(pl); }
            gpanel.add(new T.Mesh(new T.BoxGeometry(W + 0.3, H + 0.3, 0.3), acero));
            for (const sg of [1, -1]) { const pas = new T.Mesh(new T.BoxGeometry(W, 0.06, 0.8), acero); pas.position.set(0, -H / 2 - 0.25, sg * 0.5); gpanel.add(pas); }
            for (const dx of [-W / 2 + 0.6, 0, W / 2 - 0.6]) { const fo = new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.9), acero); fo.position.set(dx, H / 2 + 0.25, 0.55); gpanel.add(fo); }
            gpanel.position.copy(P(vx, vy, z0 + H / 2)); gpanel.rotation.y = ang; gv.add(gpanel);
            for (const dx of [-W / 2 + 1.3, W / 2 - 1.3]) cil(gv, vx + dx, vy, zv, z0, 0.22, 0.26, acero, 10);
            caja(gv, vx - W / 2 + 0.6, vx + W / 2 - 0.6, vy - 0.4, vy + 0.4, zv - 0.4, zv + 0.15, mat('#b9b4a8'));
            gv.traverse((o) => { if (o.isMesh) o.castShadow = true; });
            poner(capa, gv, 'Valla publicitaria de VISOR LAV', 'Valla publicitaria a la entrada del pueblo: el ojo de VISOR LAV como logotipo principal con el rótulo debajo, y los logotipos de Adif (abajo a la izquierda) e Ineco (abajo a la derecha).');
            reservas.push([vx - W / 2, vx + W / 2, vy - 1.5, vy + 1.5]);
          }
        }
      }

      // ---------- Parques del pueblo: calistenia, infantil y pista de pádel ----------
      if (info.pueblo) {
        const { cx: pcx, cy: pcy } = info.pueblo, zona = [pcx - 150, pcx + 150, pcy - 120, pcy + 120], verdeP = mat('#2f7d4a', { metalness: 0.4, roughness: 0.5 }), acero = mat('#3a3f44', { metalness: 0.6, roughness: 0.4 });
        const barraP = (g, a, b, r, m) => { const d = new T.Vector3().subVectors(P(...b), P(...a)), c = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 8), m); c.position.copy(P(...a)).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); c.castShadow = true; g.add(c); };
        const suelo = (g, s, w, h, c) => caja(g, s.cx - w / 2, s.cx + w / 2, s.cy - h / 2, s.cy + h / 2, s.z - 0.2, s.z + 0.06, mat(c), false);
        // Calistenia: dominadas a tres alturas, paralelas, espaldera, escalera horizontal y banco
        const sc = buscar(24, 16, 1.6, 4, 600, { zona, cerca: [pcx, pcy], validos: 10 });
        if (sc) {
          const g = new T.Group(), z = sc.z, X = (d) => sc.cx + d, Y = (d) => sc.cy + d;
          suelo(g, sc, 24, 16, '#a8442f'); caja(g, X(-11), X(11), Y(-7), Y(7), z + 0.06, z + 0.07, mat('#3e7b56'), false);
          for (const [dx, hh] of [[-8, 2.0], [-6.6, 2.3], [-5.2, 2.6]]) { barraP(g, [X(dx), Y(-4), z], [X(dx), Y(-4), z + hh + 0.1], 0.06, verdeP); barraP(g, [X(dx), Y(-2.6), z], [X(dx), Y(-2.6), z + hh + 0.1], 0.06, verdeP); barraP(g, [X(dx), Y(-4), z + hh], [X(dx), Y(-2.6), z + hh], 0.02, acero); }
          for (const sy of [-0.3, 0.3]) { barraP(g, [X(-2), Y(sy), z + 1.2], [X(0.5), Y(sy), z + 1.2], 0.025, acero); for (const dx of [-2, 0.5]) barraP(g, [X(dx), Y(sy), z], [X(dx), Y(sy), z + 1.2], 0.05, verdeP); }
          for (const dx of [3, 4]) barraP(g, [X(dx), Y(-3), z], [X(dx), Y(-3), z + 2.5], 0.05, verdeP);
          for (let k = 0; k < 9; k++) barraP(g, [X(3), Y(-3), z + 0.3 + k * 0.26], [X(4), Y(-3), z + 0.3 + k * 0.26], 0.018, acero);
          for (const sy of [2, 3]) { for (const dx of [-6, -1]) barraP(g, [X(dx), Y(sy), z], [X(dx), Y(sy), z + 2.3], 0.06, verdeP); barraP(g, [X(-6), Y(sy), z + 2.3], [X(-1), Y(sy), z + 2.3], 0.03, verdeP); }
          for (let k = 0; k <= 10; k++) barraP(g, [X(-6 + k * 0.5), Y(2), z + 2.3], [X(-6 + k * 0.5), Y(3), z + 2.3], 0.018, acero);
          caja(g, X(5.5), X(8.5), Y(1.8), Y(2.4), z + 0.4, z + 0.5, verdeP); for (const dx of [5.7, 8.3]) caja(g, X(dx - 0.05), X(dx + 0.05), Y(1.9), Y(2.3), z, z + 0.4, acero);
          for (const dx of [6, 7.2]) { barraP(g, [X(dx), Y(4.5), z + 0.35], [X(dx + 0.6), Y(4.5), z + 0.35], 0.02, acero); for (const d2 of [0, 0.6]) barraP(g, [X(dx + d2), Y(4.5), z], [X(dx + d2), Y(4.5), z + 0.35], 0.02, acero); }
          const cartel = new T.Mesh(new T.PlaneGeometry(1.4, 0.7), new T.MeshStandardMaterial({ side: T.DoubleSide, map: lienzo(256, 128, (x, w, h) => { x.fillStyle = '#2f7d4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = '800 32px Arial'; x.textAlign = 'center'; x.fillText('PARQUE DE', w / 2, 52); x.fillText('CALISTENIA', w / 2, 92); }) }));
          cartel.position.copy(P(X(9.5), Y(-6.5), z + 1.8)); g.add(cartel); barraP(g, [X(9.5), Y(-6.5), z], [X(9.5), Y(-6.5), z + 1.5], 0.04, acero);
          poner(capa, g, 'Parque de calistenia', 'Parque de calistenia con barras de dominadas a tres alturas, paralelas, espaldera, escalera horizontal, banco de abdominales y barras de flexiones. Genérico.');
          for (const [dx, dy, ang] of [[-0.75, 1.0, -Math.PI / 2], [3.5, -1.8, Math.PI / 2]]) { const q = persona({ camisa: elige(ROPA, azar), pantalon: '#1d1d1d', pelo: elige(PELOS, azar), piel: elige(PIELES, azar), altura: 1.0 }); q.position.copy(P(X(dx), Y(dy), z + 0.07)); q.rotation.y = ang; poner(capa, q, 'Deportista', 'Persona entrenando en el parque de calistenia.'); }
        }
        // Parque infantil: tobogán con torre, columpios y balancín
        const si = buscar(20, 15, 1.6, 4, 600, { zona, cerca: [pcx, pcy], validos: 10 });
        if (si) {
          const g = new T.Group(), z = si.z, X = (d) => si.cx + d, Y = (d) => si.cy + d;
          suelo(g, si, 20, 15, '#d9c18c');
          caja(g, X(-6), X(-3.6), Y(-2), Y(0.4), z + 1.4, z + 1.55, mat('#e7a21a')); for (const [dx, dy] of [[-6, -2], [-3.6, -2], [-6, 0.4], [-3.6, 0.4]]) barraP(g, [X(dx), Y(dy), z], [X(dx), Y(dy), z + 2.8], 0.06, mat('#c0392b'));
          const techo = new T.Mesh(new T.ConeGeometry(1.8, 1.0, 4), mat('#2e86c1')); techo.position.copy(P(X(-4.8), Y(-0.8), z + 3.3)); techo.rotation.y = Math.PI / 4; g.add(techo);
          const tob = new T.Mesh(new T.BoxGeometry(3.4, 0.08, 0.7), mat('#f1c40f')); tob.position.copy(P(X(-1.95), Y(-0.8), z + 0.78)); tob.rotation.z = -0.47; tob.castShadow = true; g.add(tob);
          for (let k = 0; k < 6; k++) caja(g, X(-6.4), X(-6), Y(-1.4), Y(-0.2), z + 0.2 + k * 0.24, z + 0.25 + k * 0.24, mat('#7a5a3a'), false);
          for (const dx of [2, 7]) { barraP(g, [X(dx), Y(-1.2), z], [X(dx), Y(0), z + 2.5], 0.05, mat('#2e86c1')); barraP(g, [X(dx), Y(1.2), z], [X(dx), Y(0), z + 2.5], 0.05, mat('#2e86c1')); }
          barraP(g, [X(2), Y(0), z + 2.5], [X(7), Y(0), z + 2.5], 0.05, mat('#2e86c1'));
          for (const dx of [3.5, 5.5]) { for (const s2 of [-0.25, 0.25]) barraP(g, [X(dx + s2), Y(0), z + 2.5], [X(dx + s2), Y(0), z + 0.5], 0.01, acero); caja(g, X(dx - 0.3), X(dx + 0.3), Y(-0.15), Y(0.15), z + 0.45, z + 0.52, mat('#c0392b')); }
          caja(g, X(1), X(5), Y(4.6), Y(4.9), z + 0.5, z + 0.58, mat('#27ae60')); caja(g, X(2.85), X(3.15), Y(4.45), Y(5.05), z, z + 0.5, mat('#f1c40f'));
          for (const [dx, dy] of [[-8.5, 5.5], [8.5, -5.5]]) banco(g, X(dx), Y(dy), 1);
          poner(capa, g, 'Parque infantil', 'Parque infantil con torre y tobogán, columpios y balancín sobre suelo de arena. Genérico.');
          for (let k = 0; k < 2; k++) { const q = persona({ camisa: elige(ROPA, azar), pantalon: elige(PANTALON, azar), pelo: elige(PELOS, azar), piel: elige(PIELES, azar), altura: 0.6 }); q.position.copy(P(X(-1 + k * 5.5), Y(1.8), z + 0.06)); q.rotation.y = k * 2; poner(capa, q, 'Niño', 'Niño jugando en el parque infantil.'); }
        }
        // Pista de pádel con cristales y malla
        const sp = buscar(24, 14, 1.2, 4, 600, { zona, cerca: [pcx, pcy], validos: 10 });
        if (sp) {
          const g = new T.Group(), z = sp.z, X = (d) => sp.cx + d, Y = (d) => sp.cy + d;
          caja(g, X(-11), X(11), Y(-6), Y(6), z - 0.2, z + 0.05, mat('#9a948a'));
          const pista = new T.Mesh(new T.PlaneGeometry(20, 10), new T.MeshStandardMaterial({ roughness: 0.9, map: lienzo(400, 200, (x, w, h) => { x.fillStyle = '#2a64b8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4); x.beginPath(); x.moveTo(w * 0.15, 0); x.lineTo(w * 0.15, h); x.moveTo(w * 0.85, 0); x.lineTo(w * 0.85, h); x.moveTo(w * 0.15, h / 2); x.lineTo(w * 0.85, h / 2); x.stroke(); }) }));
          pista.rotation.x = -Math.PI / 2; pista.position.copy(P(X(0), Y(0), z + 0.06)); g.add(pista);
          caja(g, X(-0.03), X(0.03), Y(-5), Y(5), z + 0.06, z + 0.92, mat('#1c1f22', { transparent: true, opacity: 0.6 }), false);
          const vidrio = mat('#cfe6ef', { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1 }), mallaP = mat('#2a2e31', { transparent: true, opacity: 0.35 });
          for (const sx of [-1, 1]) { caja(g, X(sx * 10 - 0.03), X(sx * 10 + 0.03), Y(-5), Y(5), z + 0.06, z + 3.0, vidrio, false); for (const sy of [-1, 1]) caja(g, Math.min(X(sx * 8), X(sx * 10)), Math.max(X(sx * 8), X(sx * 10)), Y(sy * 5 - 0.03), Y(sy * 5 + 0.03), z + 0.06, z + 3.0, vidrio, false); }
          for (const sy of [-1, 1]) caja(g, X(-8), X(8), Y(sy * 5 - 0.02), Y(sy * 5 + 0.02), z + 0.06, z + 3.0, mallaP, false);
          for (let k = -10; k <= 10; k += 2) for (const sy of [-1, 1]) caja(g, X(k - 0.04), X(k + 0.04), Y(sy * 5 - 0.04), Y(sy * 5 + 0.04), z, z + 3.1, acero);
          poner(capa, g, 'Pista de pádel', 'Pista de pádel municipal de 20 × 10 m con fondos de cristal, malla lateral y red. Genérica.');
        }
      }

      // =============== CAMPO DE FÚTBOL Y PISCINA MUNICIPAL ===============
      const dep = buscar(112, 74, 3.2, 12, 900);
      if (dep) {
        info.deporte = dep;
        const { cx, cy } = dep, g = new T.Group(), L = 92, A = 56, z0 = dep.z;
        const hierba = new T.MeshStandardMaterial({ map: lienzo(512, 330, (x, w, h) => { for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#3f8a3c' : '#4a9645'; x.fillRect(i * w / 12, 0, w / 12 + 1, h); } x.strokeStyle = '#f2f2ee'; x.lineWidth = 3; const m = 14, W = w - 2 * m, H = h - 2 * m; x.strokeRect(m, m, W, H); x.beginPath(); x.moveTo(w / 2, m); x.lineTo(w / 2, h - m); x.stroke(); x.beginPath(); x.arc(w / 2, h / 2, 40, 0, 7); x.stroke(); x.strokeRect(m, h / 2 - 70, 80, 140); x.strokeRect(w - m - 80, h / 2 - 70, 80, 140); x.strokeRect(m, h / 2 - 32, 30, 64); x.strokeRect(w - m - 30, h / 2 - 32, 30, 64); x.fillStyle = '#f2f2ee'; x.beginPath(); x.arc(w / 2, h / 2, 4, 0, 7); x.fill(); }), roughness: 1, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
        // explanada y césped
        cinta(g, cx - L / 2 - 4, cx + L / 2 + 4, cy - A / 2 - 4, cy + A / 2 + 4, 12, 8, mat('#9a8f7a', { side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 0.06);
        cinta(g, cx - L / 2, cx + L / 2, cy - A / 2, cy + A / 2, 12, 8, hierba, 0.1);
        for (const sx of [-1, 1]) {   // porterías
          const xp = cx + sx * L / 2 * 0.985, zp = alt(xp, cy);
          for (const yy of [-3.66, 3.66]) cil(g, xp, cy + yy, zp + 0.1, zp + 2.5, 0.06, 0.06, mBlanco, 6);
          caja(g, xp - 0.06, xp + 0.06, cy - 3.7, cy + 3.7, zp + 2.44, zp + 2.56, mBlanco);
          caja(g, xp + sx * 2 - 0.02, xp + sx * 2 + 0.02, cy - 3.7, cy + 3.7, zp + 0.1, zp + 2.4, mat('#f0f0f0', { transparent: true, opacity: 0.35 }), false);
        }
        // Valla perimetral y focos
        const vy0 = cy - A / 2 - 4, vy1 = cy + A / 2 + 4, vx0 = cx - L / 2 - 4, vx1 = cx + L / 2 + 4, mv = mat('#8a9096', { metalness: 0.4 });
        for (const yy of [vy0, vy1]) { caja(g, vx0, vx1, yy - 0.02, yy + 0.02, alt(cx, yy) + 0.3, alt(cx, yy) + 1.8, mat('#9aa3a8', { transparent: true, opacity: 0.45 }), false); for (let x = vx0; x <= vx1; x += 6) cil(g, x, yy, alt(x, yy), alt(x, yy) + 1.9, 0.04, 0.04, mv, 5); }
        for (const xx of [vx0, vx1]) { caja(g, xx - 0.02, xx + 0.02, vy0, vy1, alt(xx, cy) + 0.3, alt(xx, cy) + 1.8, mat('#9aa3a8', { transparent: true, opacity: 0.45 }), false); for (let y = vy0; y <= vy1; y += 6) cil(g, xx, y, alt(xx, y), alt(xx, y) + 1.9, 0.04, 0.04, mv, 5); }
        for (const [fx, fy] of [[vx0 + 2, vy0 + 2], [vx1 - 2, vy0 + 2], [vx0 + 2, vy1 - 2], [vx1 - 2, vy1 - 2]]) { const zf = alt(fx, fy); cil(g, fx, fy, zf, zf + 16, 0.2, 0.3, mHierro, 6); caja(g, fx - 1.2, fx + 1.2, fy - 0.3, fy + 0.3, zf + 16, zf + 17.4, mat('#cfd4d6', { emissive: '#fff4c0', emissiveIntensity: 0.3 })); }
        // Grada cubierta junto a la banda sur
        { const gx0 = cx - 22, gx1 = cx + 22, gy = vy0 - 1; for (let k = 0; k < 5; k++) caja(g, gx0, gx1, gy - 1.0 - k * 0.9, gy - k * 0.9, alt(cx, gy) + 0.0, alt(cx, gy) + 0.5 + k * 0.5, mat('#aeb4b6'));
          for (let k = 0; k < 5; k++) for (let s = 0; s < 14; s++) { const xx = gx0 + 1.5 + s * 3, yy = gy - 0.5 - k * 0.9; caja(g, xx - 0.4, xx + 0.4, yy - 0.2, yy + 0.2, alt(cx, gy) + 0.55 + k * 0.5, alt(cx, gy) + 0.7 + k * 0.5, mat(s % 3 ? '#c0392b' : '#2e86c1'), false); }
          for (const xx of [gx0, gx1]) cil(g, xx, gy - 5.5, alt(cx, gy), alt(cx, gy) + 5.2, 0.12, 0.12, mHierro, 6);
          caja(g, gx0 - 0.3, gx1 + 0.3, gy - 6.3, gy - 0.2, alt(cx, gy) + 5.0, alt(cx, gy) + 5.2, mat('#8d3a2a')); }
        // Público: todos los espectadores sentados en una sola malla, mirando al campo (verde = ADIF, azul = INECO)
        { const gx0 = cx - 22, gy = vy0 - 1, base = alt(cx, gy), partes = [], grupos = Array.from({ length: 6 }, () => []), camisas = ['#0d7a3e', '#0d7a3e', '#1b4a8c', '#1b4a8c', ...ROPA];
          for (let k = 0; k < 5; k++) for (let x = gx0 + 1.0; x < cx + 21.2; x += 1.05 + azar() * 0.35) {
            if (azar() < 0.28) continue;
            const X = x, Y = gy - 0.5 - k * 0.9 + (azar() - 0.5) * 0.2, z0 = base + 0.78 + k * 0.5 - 0.9;
            const camisa = elige(camisas, azar), piel = elige(PIELES, azar), pelo = elige(PELOS, azar), pantalon = elige(PANTALON, azar), alt2 = 0.9 + azar() * 0.2;
            const arriba = azar() < 0.22 ? (azar() < 0.5 ? 1 : -1) : 0, gi = Math.floor(azar() * 6);
            const pp = [[0.22, 0.56, 0.38, 0, 1.18, 0, camisa], [0.2, 0.24, 0.2, 0, 1.58, 0, piel], [0.22, 0.1, 0.22, -0.01, 1.72, 0, pelo], [0.04, 0.2, 0.2, -0.1, 1.6, 0, pelo],
              [0.012, 0.03, 0.04, 0.103, 1.605, 0.05, '#1c1c1c'], [0.012, 0.03, 0.04, 0.103, 1.605, -0.05, '#1c1c1c']];
            for (const sg of [-1, 1]) {
              pp.push(sg === arriba ? [0.1, 0.5, 0.1, 0.02, 1.78, sg * 0.245, piel] : [0.1, 0.52, 0.1, 0, 1.2, sg * 0.245, camisa], sg === arriba ? [0.09, 0.09, 0.09, 0.02, 2.06, sg * 0.245, piel] : [0.09, 0.09, 0.09, 0, 0.92, sg * 0.245, piel],
                [0.5, 0.17, 0.17, 0.28, 0.9, sg * 0.1, pantalon], [0.15, 0.45, 0.15, 0.5, 0.64, sg * 0.1, pantalon], [0.28, 0.09, 0.17, 0.58, 0.38, sg * 0.1, '#1d1d1d']);
            }
            // Cada parte pasa de «figura» (x hacia delante, z a un lado) al plano del campo (x = lado, y = hacia el campo)
            for (const [sx, sy, sz, cx2, cy2, cz2, col] of pp) grupos[gi].push([sx * alt2, sy * alt2, sz * alt2, Y + cx2 * alt2, z0 + cy2 * alt2, X + cz2 * alt2, col]);
          }
          // Seis grupos de espectadores que se levantan y se sientan a destiempo (ola, celebraciones), cada uno una malla
          const pubs = grupos.map((pt, i) => {
            const pub = new T.Mesh(geo(pt), matV()); pub.castShadow = true; pub.rotation.y = Math.PI / 2; pub.position.copy(P(0, 0, 0));
            poner(capa, pub, 'Público del campo de fútbol', 'Espectadores en la grada del campo municipal, con camisetas verdes (ADIF) y azules (INECO): se levantan y se sientan, y algunos levantan los brazos. Figuras genéricas.');
            if (!reducido) { dinamicos.push(pub); const y0 = pub.position.y; animar.push((t) => { const o = Math.sin(t * 2.2 + i * 1.05) * Math.sin(t * 0.37 + i * 2.1); pub.position.y = y0 + Math.max(0, o) * 0.28; }); }
            return pub;
          }); void pubs; }
        // Marcador electrónico: ADIF contra INECO, con sus logotipos
        if (window.Linea3D) {
          const L3 = window.Linea3D, gm = new T.Group(), mx = vx1 + 3.2, my = cy + 12, zm = alt(mx, my), W = 7.2, H = 3.1, zb = zm + 3.4, acero = mat('#3a3f44', { metalness: 0.55, roughness: 0.45 });
          const tex = L3.lienzo(1152, 496, [L3.LOGOS.adif, L3.LOGOS.ineco], (x, w, h, [ad, ine]) => {
            x.fillStyle = '#0a0c0e'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a2f33'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
            x.fillStyle = '#16191c'; x.fillRect(20, 20, w - 40, 54); x.fillStyle = '#e8eef2'; x.font = '700 38px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('CAMPO MUNICIPAL', w / 2, 48);
            for (const [im, bx, nombre] of [[ad, 40, 'ADIF'], [ine, w - 40 - 330, 'INECO']]) {
              x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(bx, 100, 330, 130, 16); x.fill(); if (im) L3.encajar(x, im, bx + 18, 112, 294, 106);
              x.fillStyle = '#ffd23a'; x.font = '800 56px "Segoe UI", Arial, sans-serif'; x.fillText(nombre, bx + 165, 280);
            }
            // Dígitos de LED ámbar
            x.shadowColor = '#ff9a1a'; x.shadowBlur = 24; x.fillStyle = '#ffb21f'; x.font = '800 200px "Consolas", "Courier New", monospace';
            x.fillText('2', w / 2 - 95, 220); x.fillText('1', w / 2 + 95, 220); x.font = '800 120px "Consolas", monospace'; x.fillText(':', w / 2, 210);
            x.shadowBlur = 12; x.fillStyle = '#ff5a3a'; x.font = '700 50px "Consolas", monospace'; x.fillText('2ª PARTE  67:12', w / 2, 400);
            x.shadowBlur = 0; x.fillStyle = '#8a949c'; x.font = '500 30px "Segoe UI", Arial'; x.fillText('Trofeo de la Alta Velocidad', w / 2, 452);
          });
          const pl = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.5 }));
          pl.position.copy(P(mx - 0.21, my, zb + H / 2)); pl.rotation.y = -Math.PI / 2; gm.add(pl);
          caja(gm, mx - 0.2, mx + 0.2, my - W / 2 - 0.15, my + W / 2 + 0.15, zb - 0.15, zb + H + 0.15, acero);
          for (const dy of [-W / 2 + 0.8, W / 2 - 0.8]) cil(gm, mx + 0.1, my + dy, zm, zb, 0.13, 0.15, acero, 10);
          poner(capa, gm, 'Marcador del campo de fútbol', 'Marcador electrónico del campo municipal: ADIF 2 – INECO 1 en la segunda parte, con los logotipos de los dos equipos. Ilustrativo.');
        }
        // Jugadores y balón
        const camis = [['#0d7a3e', '#e8e8e4'], ['#1b4a8c', '#e6c52a']];   // ADIF de verde, INECO de azul
        const jug = [];
        for (let i = 0; i < 10; i++) {
          const eq = i % 2, q = persona({ camisa: camis[eq][0], pantalon: eq ? '#f2f2ee' : '#1d1d1d', pelo: elige(PELOS, azar), piel: elige(PIELES, azar), altura: 1.0 });
          poner(capa, q, 'Jugador', 'Jugador de un partido en el campo del pueblo.'); dinamicos.push(q); jug.push(q);
          const ax = 8 + azar() * 22, ay = 5 + azar() * 16, w = 0.35 + azar() * 0.25, ph = azar() * 6.28, ox = (i % 5 - 2) * 8, oy = (eq ? 1 : -1) * 6;
          animar.push((t) => { const x = cx + ox + ax * Math.sin(w * t + ph), y = cy + oy + ay * Math.sin(1.3 * w * t + ph * 2), dx = ax * w * Math.cos(w * t + ph), dy = ay * 1.3 * w * Math.cos(1.3 * w * t + ph * 2); q.position.copy(P(x, y, alt(x, y))); q.rotation.y = Math.atan2(dy, dx); const f = Math.sin(t * 9 + i) * 0.8; q.piernas[0].rotation.z = f; q.piernas[1].rotation.z = -f; });
        }
        const balon = new T.Mesh(new T.SphereGeometry(0.22, 12, 8), mat('#f4f4f0')); balon.castShadow = true; poner(capa, balon, 'Balón', 'Balón del partido.'); dinamicos.push(balon);
        animar.push((t) => { const x = cx + 26 * Math.sin(0.5 * t), y = cy + 14 * Math.sin(0.83 * t + 1), b = Math.abs(Math.sin(t * 3)) * 0.35; balon.position.copy(P(x, y, alt(x, y) + 0.22 + b)); });
        poner(capa, g, 'Campo de fútbol', 'Campo de fútbol con césped a rayas, líneas, porterías, valla, focos y grada cubierta. Genérico.');

        // Piscina municipal junto al campo (si cabe)
        const pm = buscar(46, 34, 3.2, 8, 400);
        if (pm) {
          const gp2 = new T.Group(), { cx: px, cy: py } = pm, zp = pm.z;
          cinta(gp2, px - 21, px + 21, py - 15, py + 15, 8, 6, mat('#d9d2c2', { side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 0.05);
          caja(gp2, px - 13.5, px + 13.5, py - 7, py + 7, zp - 1.2, zp + 0.15, mat('#e8e4da')); caja(gp2, px - 12.5, px + 12.5, py - 6, py + 6, zp - 1.2, zp + 0.1, mAgua, false);
          for (let k = 1; k < 5; k++) caja(gp2, px - 12.5, px + 12.5, py - 6 + k * 2.4 - 0.03, py - 6 + k * 2.4 + 0.03, zp + 0.11, zp + 0.13, mat('#c0392b'), false);
          for (let k = 0; k < 8; k++) tumbona(gp2, px - 16 + k * 4.2, py + 11.5, 0, k % 2 ? '#f4f0e0' : '#4a9ad8');
          for (let k = 0; k < 3; k++) { const sx = px - 14 + k * 14, sy = py - 12.5; cil(gp2, sx, sy, zp, zp + 2.6, 0.03, 0.03, mHierro, 4); const s = new T.Mesh(new T.ConeGeometry(1.7, 0.5, 8), mat(['#e84393', '#f1c40f', '#2e86c1'][k], { side: T.DoubleSide })); s.position.copy(P(sx, sy, zp + 2.8)); gp2.add(s); }
          for (let k = 0; k < 4; k++) { const bx = px - 15 + k * 10, bz = alt(bx, py - 7.4); caja(gp2, bx - 0.5, bx + 0.5, py - 7.9, py - 7.4, bz + 0.1, bz + 0.2, mHierro); }
          caja(gp2, px - 21, px + 21, py - 15, py - 14.95, zp + 0.1, zp + 1.5, mat('#9aa3a8', { transparent: true, opacity: 0.4 }), false); caja(gp2, px - 21, px + 21, py + 15, py + 15.05, zp + 0.1, zp + 1.5, mat('#9aa3a8', { transparent: true, opacity: 0.4 }), false);
          poner(capa, gp2, 'Piscina municipal', 'Piscina municipal con calles, tumbonas, sombrillas y trampolines. Genérica.');
          for (let k = 0; k < 4; k++) { const q = persona({ camisa: elige(ROPA, azar), pantalon: elige(['#3b8fd0', '#d94a7a', '#1e1e1e'], azar), pelo: elige(PELOS, azar), piel: elige(PIELES, azar), altura: 0.9 + azar() * 0.2 }); q.position.copy(P(px - 15 + k * 5 + azar() * 2, py + 9.4, zp + 0.1)); q.rotation.y = -Math.PI / 2 * (azar() > 0.5 ? 1 : -1); poner(capa, q, 'Bañista', 'Persona junto a la piscina.'); }
        }
      }

      // =============== GRANJAS CON ANIMALES ===============
      const hierbaMat = mat('#6f8f46', { side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const nGranjas = ctx.granjas ?? 3;
      for (let gi = 0; gi < nGranjas; gi++) {
        const s = buscar(70, 54, 3.5, 12, 500); if (!s) break;
        info.granja ||= s; const { cx, cy } = s, g = new T.Group(), z0 = s.z, V = (dx, dy) => [cx + dx, cy + dy];
        cinta(g, cx - 34, cx + 34, cy - 26, cy + 26, 10, 8, hierbaMat, 0.03);
        casa(g, cx - 18, cy + 10, 12, 9, 2, elige(MUROS, azar), '#b4553a', -1, { balcon: true });
        casa(g, cx - 4, cy + 10, 8, 8, 1, elige(MUROS, azar), '#a94b33', -1);
        // Nave/establo con tejado a dos aguas y silo
        const [nx, ny] = V(16, 12); caja(g, nx - 9, nx + 9, ny - 6, ny + 6, alt(nx, ny) - 3, alt(nx, ny) + 4.6, mat('#a8a39a')); tejado(g, nx - 9, nx + 9, ny - 6, ny + 6, alt(nx, ny) + 4.6, 2.6, 'x', '#8f9aa0', '#a8a39a', 0.5); caja(g, nx - 2, nx + 2, ny - 6.1, ny - 5.9, alt(nx, ny), alt(nx, ny) + 3.4, mat('#5b4634'));
        cil(g, nx + 12, ny, alt(nx + 12, ny) - 0.5, alt(nx + 12, ny) + 10, 2.0, 2.0, mat('#c9ced0', { metalness: 0.4 }), 14); const cu = new T.Mesh(new T.ConeGeometry(2.1, 1.4, 14), mat('#9aa3a8', { metalness: 0.4 })); cu.position.copy(P(nx + 12, ny, alt(nx + 12, ny) + 10.7)); g.add(cu);
        // Pacas, corral y abrevadero
        for (let k = 0; k < 6; k++) { const bx = cx - 20 + k * 2.4, by = cy - 14; const b = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 1.2, 12), mat('#d9b95a')); b.rotation.z = Math.PI / 2; b.position.copy(P(bx, by, alt(bx, by) + 0.7)); b.castShadow = true; g.add(b); }
        const mv = mMadera; for (let x = -26; x <= 26; x += 2) { for (const yy of [-24, 24]) cil(g, cx + x, cy + yy, alt(cx + x, cy + yy), alt(cx + x, cy + yy) + 1.2, 0.06, 0.06, mv, 5); }
        for (const yy of [-24, 24]) for (const zz of [0.5, 1.0]) caja(g, cx - 26, cx + 26, cy + yy - 0.03, cy + yy + 0.03, alt(cx, cy + yy) + zz - 0.04, alt(cx, cy + yy) + zz + 0.04, mv, false);
        for (const xx of [-26, 26]) for (const zz of [0.5, 1.0]) caja(g, cx + xx - 0.03, cx + xx + 0.03, cy - 24, cy + 24, alt(cx + xx, cy) + zz - 0.04, alt(cx + xx, cy) + zz + 0.04, mv, false);
        caja(g, cx + 5, cx + 8, cy - 8, cy - 7, alt(cx + 6, cy - 8), alt(cx + 6, cy - 8) + 0.6, mat('#6b7378')); caja(g, cx + 5.1, cx + 7.9, cy - 7.9, cy - 7.1, alt(cx + 6, cy - 8) + 0.3, alt(cx + 6, cy - 8) + 0.55, mAgua, false);
        for (let k = 0; k < 5; k++) arbol(g, cx - 30 + k * 14, cy + 26 + (azar() - 0.5) * 3);
        if (gi === 1) { const [ix, iy] = V(-6, -14); caja(g, ix - 10, ix + 10, iy - 4, iy + 4, alt(ix, iy), alt(ix, iy) + 3.2, mat('#e6f0f2', { transparent: true, opacity: 0.38 }), false); tejado(g, ix - 10, ix + 10, iy - 4, iy + 4, alt(ix, iy) + 3.2, 1.6, 'x', '#e6f0f2', '#e6f0f2', 0.05); for (let k = 0; k < 6; k++) caja(g, ix - 9.5 + k * 1.9, ix - 8.5 + k * 1.9, iy - 3, iy + 3, alt(ix, iy), alt(ix, iy) + 0.7, mat('#4a8a3a'), false); }
        if (gi === 0) { const [px2, py2] = V(-4, -3); piscina(g, px2 + 22, py2 + 22, 7, 3.5, alt(px2 + 22, py2 + 22)); }
        poner(capa, g, 'Granja', 'Granja con vivienda, establo, silo, pacas, corral y abrevadero. Genérica.');
        // Animales del corral
        const especies = gi === 0 ? ['vaca', 'vaca', 'vaca', 'caballo', 'caballo', 'perro'] : gi === 1 ? ['oveja', 'oveja', 'oveja', 'oveja', 'oveja', 'oveja', 'oveja', 'perro'] : ['vaca', 'vaca', 'oveja', 'oveja', 'oveja', 'caballo'];
        especies.forEach((sp, i) => {
          const a = animal(sp, azar), esc = sp === 'oveja' ? 1.15 : 1.0; a.scale.setScalar(esc);
          let x = cx + (azar() - 0.5) * 40, y = cy + (azar() - 0.5) * 30, tx = x, ty = y, fase = 'pasta', espera = azar() * 4, rum = azar() * 6.28;
          a.position.copy(P(x, y, alt(x, y))); a.rotation.y = rum;
          poner(capa, a, sp === 'vaca' ? 'Vaca' : sp === 'oveja' ? 'Oveja' : sp === 'caballo' ? 'Caballo' : 'Perro', 'Animal de la granja, en libertad dentro del corral.'); dinamicos.push(a);
          const vel = sp === 'perro' ? 1.4 : sp === 'caballo' ? 1.0 : 0.6;
          animar.push((t, dt) => {
            if (fase === 'pasta') { espera -= dt; a.cabezaPiv.rotation.z = -0.95 + Math.sin(t * 1.7 + i) * 0.12; if (espera <= 0) { tx = cx + (azar() - 0.5) * 48; ty = cy + (azar() - 0.5) * 38; fase = 'anda'; } }
            else { const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy); a.cabezaPiv.rotation.z = -0.1; if (d < 0.5) { fase = 'pasta'; espera = 3 + azar() * 8; } else { rum = Math.atan2(dy, dx); x += dx / d * vel * dt; y += dy / d * vel * dt; } }
            a.position.copy(P(x, y, alt(x, y) + (fase === 'anda' ? Math.abs(Math.sin(t * 5 + i)) * 0.03 : 0))); a.rotation.y = rum;
          });
        });
        // Tractor trabajando una parcela contigua (solo en la primera granja)
        if (gi === 0 && window.Vehiculos3D) {
          const tr = new T.Group(), c = '#c0392b', partes = [[1.3, 0.8, 2.6, 0, 1.0, 0, c], [1.0, 0.7, 1.2, 0, 1.4, -0.9, '#2a2d30'], [0.9, 0.9, 0.9, 0, 1.9, 0.4, '#223344'], [0.9, 0.06, 1.0, 0, 2.38, 0.4, c], ['r', 0.85, 0.5, -0.9, 0.85, 0.9, '#171717'], ['r', 0.85, 0.5, 0.9, 0.85, 0.9, '#171717'], ['r', 0.5, 0.3, -0.8, 0.5, -1.1, '#171717'], ['r', 0.5, 0.3, 0.8, 0.5, -1.1, '#171717'], [0.15, 0.7, 0.15, 0.5, 1.6, -1.2, '#888']];
          const pe = partes.map((p) => (p[0] === 'r' ? p : [p[2], p[1], p[0], p[5], p[4], p[3], p[6]]));   // eje de avance en x
          const pe2 = partes.map((p) => (p[0] === 'r' ? p : p));
          void pe; void pe2;
          const cuerpoT = new T.Mesh(geo(partes.map((p) => (p[0] === 'r' ? p : p))), matV()); cuerpoT.rotation.y = -Math.PI / 2; cuerpoT.castShadow = true; tr.add(cuerpoT);
          const [tx0, ty0] = V(-26, -40); poner(capa, tr, 'Tractor', 'Tractor trabajando una parcela. Modelo genérico.'); dinamicos.push(tr);
          animar.push((t) => { const L = 60, c2 = (t * 2.4) % (2 * L), x = tx0 + (c2 < L ? c2 : 2 * L - c2); const y = ty0 + Math.floor(((t * 2.4) / (2 * L)) % 4) * 3.2; tr.position.copy(P(x, y, alt(x, y))); tr.rotation.y = c2 < L ? 0 : Math.PI; });
        }
      }

      // =============== CEMENTERIO ===============
      const cem = buscar(30, 22, 2.5, 8, 300);
      if (cem) {
        const { cx, cy } = cem, g = new T.Group(), z = cem.z, mp = mat('#e9e4d6');
        for (const [x0, x1, y0, y1] of [[cx - 14, cx + 14, cy - 10, cy - 9.7], [cx - 14, cx + 14, cy + 9.7, cy + 10], [cx - 14, cx - 13.7, cy - 10, cy + 10], [cx + 13.7, cx + 14, cy - 10, cy + 10]]) caja(g, x0, x1, y0, y1, alt(cx, cy) - 0.5, alt(cx, cy) + 2.4, mp);
        caja(g, cx - 1.5, cx + 1.5, cy - 10.2, cy - 9.6, alt(cx, cy) + 2.4, alt(cx, cy) + 4.2, mp);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = cx - 9 + i * 5.6, y = cy - 6 + j * 3.6; caja(g, x - 0.7, x + 0.7, y - 0.35, y + 0.35, alt(x, y), alt(x, y) + 0.5, mat('#9c9a94')); caja(g, x - 0.05, x + 0.05, y - 0.02, y + 0.02, alt(x, y) + 0.5, alt(x, y) + 1.2, mat('#d0cec6')); }
        for (const [x, y] of [[-12.5, -8.5], [12.5, -8.5], [-12.5, 8.5], [12.5, 8.5]]) { const zz = alt(cx + x, cy + y); const c = new T.Mesh(new T.ConeGeometry(0.6, 6, 8), mat('#2f4a2c')); c.position.copy(P(cx + x, cy + y, zz + 3)); c.castShadow = true; g.add(c); }
        poner(capa, g, 'Cementerio', 'Cementerio del pueblo con tapia, nichos, tumbas y cipreses. Genérico.'); void z;
      }

      // =============== CAMPO SOLAR Y TORRES DE LA LÍNEA DE EVACUACIÓN ===============
      const fsol = ctx.solar === false ? null : buscar(150, 96, 5, 14, 900);
      if (fsol) {
        info.solar = fsol;
        const { cx, cy } = fsol, z0 = fsol.z, g = new T.Group(), o = new T.Object3D();
        const placa = lienzo(512, 96, (x, w, h) => {
          x.fillStyle = '#c9ced2'; x.fillRect(0, 0, w, h);
          for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) {
            const mx = 4 + i * (w - 8) / 12, my = 4 + j * (h - 8) / 2, mw = (w - 8) / 12 - 3, mh = (h - 8) / 2 - 3, gr = x.createLinearGradient(mx, my, mx + mw, my + mh);
            gr.addColorStop(0, '#1d3768'); gr.addColorStop(1, '#0f1f3f'); x.fillStyle = gr; x.fillRect(mx, my, mw, mh);
            x.strokeStyle = 'rgba(170,190,220,.35)'; x.lineWidth = 0.8; for (let k = 1; k < 6; k++) { x.beginPath(); x.moveTo(mx + mw * k / 6, my); x.lineTo(mx + mw * k / 6, my + mh); x.stroke(); } for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(mx, my + mh * k / 3); x.lineTo(mx + mw, my + mh * k / 3); x.stroke(); }
          }
        });
        const mesas = [];
        for (let f = 0; f < 9; f++) for (let k = 0; k < 5; k++) { const x = cx - 62 + k * 25.5, y = cy - 38 + f * 9; if (libre(x, y)) mesas.push([x, y]); }
        const pl = new T.InstancedMesh(new T.BoxGeometry(24, 0.06, 4.2), new T.MeshStandardMaterial({ map: placa, roughness: 0.25, metalness: 0.35 }), mesas.length);
        const pies = new T.InstancedMesh(new T.BoxGeometry(0.1, 1, 0.1), mat('#9aa3a6', { metalness: 0.6 }), mesas.length * 6);
        mesas.forEach(([x, y], i) => {
          const z = alt(x, y); o.position.copy(P(x, y, z + 1.7)); o.rotation.set(0.44, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); pl.setMatrixAt(i, o.matrix);
          let k = 0; for (const dx of [-10, 0, 10]) for (const [dy, hh] of [[-1.3, 1.2], [1.3, 2.2]]) { o.position.copy(P(x + dx, y + dy, z + hh / 2)); o.rotation.set(0, 0, 0); o.scale.set(1, hh, 1); o.updateMatrix(); pies.setMatrixAt(i * 6 + k++, o.matrix); }
        });
        pl.castShadow = true; pl.receiveShadow = true; g.add(pl, pies);
        // Centros de transformación entre las filas y vallado perimetral
        for (const dx of [-38, 0, 38]) { const x = cx + dx, y = cy + 39.5, z = alt(x, y); caja(g, x - 1.6, x + 1.6, y - 1.2, y + 1.2, z, z + 2.6, mat('#eef0ee')); caja(g, x - 1.8, x + 1.8, y - 1.4, y + 1.4, z + 2.6, z + 2.75, mat('#9aa3a6')); caja(g, x - 0.5, x + 0.5, y - 1.25, y - 1.2, z, z + 2.1, mat('#5d666c')); }
        const vm = mat('#9aa3a8', { transparent: true, opacity: 0.4 }), [vx0, vx1, vy0, vy1] = [cx - 75, cx + 75, cy - 46, cy + 46];
        for (const [a, b, c2, d] of [[vx0, vx1, vy0 - 0.02, vy0 + 0.02], [vx0, vx1, vy1 - 0.02, vy1 + 0.02], [vx0 - 0.02, vx0 + 0.02, vy0, vy1], [vx1 - 0.02, vx1 + 0.02, vy0, vy1]]) caja(g, a, b, c2, d, z0 + 0.1, z0 + 2.1, vm, false);
        // Subestación elevadora en una esquina
        const sx = cx + 62, sy = cy - 52, zs = alt(sx, sy), ac = mat('#9aa3a6', { metalness: 0.6, roughness: 0.4 });
        caja(g, sx - 9, sx + 9, sy - 6, sy + 6, zs - 0.2, zs + 0.08, mat('#b9b0a0'));
        caja(g, sx - 2, sx + 2, sy - 1.6, sy + 1.6, zs, zs + 3.2, mat('#7d878d')); for (let k = -3; k <= 3; k++) caja(g, sx + k * 0.5 - 0.04, sx + k * 0.5 + 0.04, sy + 1.6, sy + 2.2, zs + 0.4, zs + 2.8, ac);
        for (const dx of [-1, 0, 1]) cil(g, sx + dx * 1.1, sy - 0.6, zs + 3.2, zs + 4.6, 0.12, 0.08, mat('#8b5a3a'), 8);
        for (const dy of [-4.5, 4.5]) for (const dx of [-6, 6]) caja(g, sx + dx - 0.2, sx + dx + 0.2, sy + dy - 0.2, sy + dy + 0.2, zs, zs + 10, ac);
        for (const dy of [-4.5, 4.5]) caja(g, sx - 6, sx + 6, sy + dy - 0.2, sy + dy + 0.2, zs + 9.6, zs + 10, ac);
        caja(g, sx + 5, sx + 9, sy - 5.5, sy - 2.5, zs, zs + 3, mat('#e6dfcf')); tejado(g, sx + 5, sx + 9, sy - 5.5, sy - 2.5, zs + 3, 1.0, 'x', '#9b4a35', '#e6dfcf');
        poner(capa, g, 'Planta solar fotovoltaica', 'Planta fotovoltaica con mesas de paneles orientadas al sur, centros de transformación, vallado y una subestación elevadora de la que sale la línea de evacuación. Genérica: no procede de cartografía.');
        // Torres de la línea de evacuación, hacia el exterior de la escena
        const gt = new T.Group(), dl = Math.hypot(sx, sy) || 1, ux = sx / dl, uy = sy / dl, torres = [];
        const barraT = (a, b, r) => { const d = new T.Vector3().subVectors(b, a), m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 4), ac); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); gt.add(m); };
        for (let k = 0; k < 6; k++) {
          const x = sx + ux * (30 + 115 * k), y = sy + uy * (30 + 115 * k);
          if (x < rx0 - 200 || x > rx1 + 200 || y < ry0 - 200 || y > ry1 + 200) break;
          if (!libre(x, y) && Math.hypot(x, y) < 300) continue;
          const z = alt(x, y), H = 32, ang = Math.atan2(uy, ux) + Math.PI / 2, cs = Math.cos(ang), sn = Math.sin(ang), L = (a, b, h) => P(x + a * cs - b * sn, y + a * sn + b * cs, z + h);
          const pata = (h) => 3.2 * (1 - h / H) + 0.7 * (h / H);
          for (const [sa, sb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) barraT(L(sa * 3.2, sb * 3.2, 0), L(sa * 0.7, sb * 0.7, H), 0.13);
          for (let h = 0; h < H - 1; h += 5) { const a = pata(h), b = pata(h + 5); for (const [p, q] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) { barraT(L(p[0] * a, p[1] * a, h), L(q[0] * b, q[1] * b, h + 5), 0.05); barraT(L(q[0] * a, q[1] * a, h), L(p[0] * b, p[1] * b, h + 5), 0.05); } }
          const brazos = [[H * 0.72, 7.5], [H * 0.86, 6]];
          for (const [h, l] of brazos) { barraT(L(-l, 0, h), L(l, 0, h), 0.1); barraT(L(-l, 0, h), L(-0.7, 0, h + 2.4), 0.06); barraT(L(l, 0, h), L(0.7, 0, h + 2.4), 0.06); }
          barraT(L(0, 0, H), L(0, 0, H + 4), 0.08);
          torres.push([L(-7.5, 0, H * 0.72 - 2), L(7.5, 0, H * 0.72 - 2), L(-6, 0, H * 0.86 - 2), L(6, 0, H * 0.86 - 2), L(0, 0, H + 4)]);
          for (const [h, l] of brazos) for (const s2 of [-1, 1]) barraT(L(s2 * l, 0, h), L(s2 * l, 0, h - 2), 0.05);
        }
        for (let i = 0; i < torres.length - 1; i++) for (let c2 = 0; c2 < 5; c2++) {
          const a = torres[i][c2], b = torres[i + 1][c2], pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12, p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * 5; pts.push(p); }
          gt.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: '#2b2f33' })));
        }
        if (torres.length) poner(capa, gt, 'Torres de la línea de evacuación', 'Torres metálicas de celosía de la línea eléctrica que sale de la subestación de la planta solar, con tres conductores y cable de tierra. Genéricas.');
      }

      // =============== AEROGENERADORES Y GLOBO ===============
      const nTurb = ctx.aerogeneradores ?? 5;
      if (nTurb) {
        const cx0 = (rx0 + rx1) / 2, cy0 = ry0 + (ry1 - ry0) * 0.12, gt = new T.Group();
        const rotores = [];
        for (let i = 0; i < nTurb; i++) {
          const x = cx0 + (i - (nTurb - 1) / 2) * 120 + (azar() - 0.5) * 30, y = ry1 - 40 - (i % 2) * 70, z = alt(x, y), a = new T.Group(), H = 62;
          const torre = new T.Mesh(new T.CylinderGeometry(1.0, 1.9, H, 14), mat('#eceeee', { roughness: 0.5 })); torre.position.y = H / 2; torre.castShadow = true; a.add(torre);
          const gon = new T.Mesh(new T.BoxGeometry(7, 3, 3), mat('#e4e7e8')); gon.position.set(1.5, H + 1.2, 0); a.add(gon);
          const rotor = new T.Group(); rotor.position.set(5.2, H + 1.2, 0);
          const pala = new T.Mesh(new T.BoxGeometry(0.25, 36, 1.6), mat('#f2f4f4')); const buje = new T.Mesh(new T.SphereGeometry(1.4, 10, 8), mat('#d8dcdd')); rotor.add(buje);
          for (let k = 0; k < 3; k++) { const p = pala.clone(); const pv = new T.Group(); pv.rotation.x = k * Math.PI * 2 / 3; p.position.y = 19; pv.add(p); rotor.add(pv); }
          a.add(rotor); a.position.copy(P(x, y, z)); a.rotation.y = 0.5 + (azar() - 0.5) * 0.4; rotores.push([rotor, 0.9 + azar() * 0.5]); gt.add(a);
        }
        poner(capa, gt, 'Aerogeneradores', 'Parque eólico lejano de aerogeneradores tripala. Genérico.'); dinamicos.push(gt);
        animar.push((t) => { for (const [r, v] of rotores) r.rotation.x = t * v; });
      }
      {
        const globo = new T.Group(), cuerpo = new T.Mesh(new T.SphereGeometry(10, 24, 18), new T.MeshStandardMaterial({ map: lienzo(512, 256, (x, w, h) => { const c = ['#d9382b', '#f4c20d', '#ffffff', '#2e6fbf', '#f4c20d', '#d9382b']; for (let i = 0; i < 12; i++) { x.fillStyle = c[i % c.length]; x.fillRect(i * w / 12, 0, w / 12 + 1, h); } }), roughness: 0.85 }));
        cuerpo.scale.y = 1.2; cuerpo.position.y = 14; globo.add(cuerpo);
        const falda = new T.Mesh(new T.CylinderGeometry(3.4, 6.5, 4, 16, 1, true), new T.MeshStandardMaterial({ color: '#d9382b', side: T.DoubleSide })); falda.position.y = 2.6; globo.add(falda);
        const cesta = new T.Mesh(new T.BoxGeometry(2, 1.2, 2), mat('#8b6a45')); cesta.position.y = -4.6; globo.add(cesta);
        for (const [dx, dz] of [[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]]) { const c = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 6.2, 4), mHierro); c.position.set(dx * 1.6, -1.6, dz * 1.6); globo.add(c); }
        poner(capa, globo, 'Globo aerostático', 'Globo aerostático a la deriva sobre el paisaje. Decorativo.'); dinamicos.push(globo);
        const cx0 = (rx0 + rx1) / 2, cy0 = (ry0 + ry1) / 2;
        animar.push((t) => { const a = t * 0.012, r = 330 + Math.sin(t * 0.03) * 60, x = cx0 + Math.cos(a) * r, y = cy0 + Math.sin(a) * r * 0.7, z = 95 + Math.sin(t * 0.2) * 2.5; globo.position.copy(P(x, y, z + (ctx.alturaBase || 0))); globo.rotation.y = t * 0.03; });
      }

      // =============== AVES EN VUELO (instanciadas) ===============
      {
        const geoAve = new T.BufferGeometry(), v = [0.45, 0, 0, -0.35, 0, 0.06, -0.35, 0, -0.06, 0.15, 0, 0.08, -0.25, 0, 0.1, -0.05, 0.22, 1.0, 0.15, 0, -0.08, -0.05, 0.22, -1.0, -0.25, 0, -0.1];
        geoAve.setAttribute('position', new T.Float32BufferAttribute(v, 3)); geoAve.setIndex([0, 1, 2, 3, 4, 5, 6, 7, 8]); geoAve.computeVertexNormals();
        const grupos = [['#f4f4f0', 11, 55, 40], ['#2b2b2e', 16, 28, 30]], ins = [];
        for (const [color, n, altura, radio] of grupos) {
          const im = new T.InstancedMesh(geoAve, new T.MeshStandardMaterial({ color, side: T.DoubleSide, roughness: 0.8 }), n); im.frustumCulled = false;
          poner(capa, im, color === '#f4f4f0' ? 'Cigüeñas y gaviotas' : 'Vencejos y golondrinas', 'Aves en vuelo sobre el paisaje. Decorativas.'); dinamicos.push(im);
          const cx0 = (rx0 + rx1) / 2 + (color === '#f4f4f0' ? -80 : 60), cy0 = (ry0 + ry1) / 2 + (color === '#f4f4f0' ? 60 : -40), datos = Array.from({ length: n }, () => ({ ph: azar() * 6.28, r: radio * (0.5 + azar()), w: (0.12 + azar() * 0.1) * (azar() > 0.5 ? 1 : -1), h: altura + azar() * 22, f: 5 + azar() * 4 }));
          ins.push([im, datos, cx0, cy0]);
        }
        const o = new T.Object3D(), pos = new T.Vector3();
        animar.push((t) => {
          for (const [im, datos, cx0, cy0] of ins) { datos.forEach((d, i) => { const a = d.ph + t * d.w, x = cx0 + Math.cos(a) * d.r, y = cy0 + Math.sin(a) * d.r; pos.copy(P(x, y, d.h + Math.sin(t * 0.6 + d.ph) * 3)); o.position.copy(pos); o.rotation.set(Math.sin(t * 0.7 + d.ph) * 0.2 * Math.sign(d.w), a + Math.sign(d.w) * Math.PI / 2, 0, 'YXZ'); o.scale.set(1, 0.35 + 0.65 * Math.sin(t * d.f + d.ph), 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.instanceMatrix.needsUpdate = true; }
        });
      }

      // =============== AVIÓN EN CRUCERO CON ESTELA ===============
      {
        const av = new T.Group(), mb = mat('#f2f4f5', { roughness: 0.4 });
        const fus = new T.Mesh(new T.CylinderGeometry(1.0, 0.8, 14, 10), mb); fus.rotation.z = Math.PI / 2; av.add(fus);
        const nariz = new T.Mesh(new T.SphereGeometry(1.0, 8, 6), mb); nariz.position.x = 7; av.add(nariz);
        const ala = new T.Mesh(new T.BoxGeometry(2.6, 0.18, 15), mb); ala.position.set(0.5, -0.3, 0); av.add(ala);
        const cola = new T.Mesh(new T.BoxGeometry(1.8, 0.14, 5), mb); cola.position.set(-6.2, 0.1, 0); av.add(cola);
        const aleta = new T.Mesh(new T.BoxGeometry(2.0, 2.4, 0.15), mat('#2e6fbf')); aleta.position.set(-6.2, 1.3, 0); av.add(aleta);
        for (const sg of [-1, 1]) { const mo = new T.Mesh(new T.CylinderGeometry(0.55, 0.5, 2.2, 8), mat('#c9ced0')); mo.rotation.z = Math.PI / 2; mo.position.set(1.6, -0.9, sg * 3.6); av.add(mo); }
        const est = new T.Mesh(new T.PlaneGeometry(420, 1.4), new T.MeshBasicMaterial({ map: lienzo(256, 4, (x, w, h) => { const gd = x.createLinearGradient(0, 0, w, 0); gd.addColorStop(0, 'rgba(255,255,255,0.0)'); gd.addColorStop(1, 'rgba(255,255,255,0.75)'); x.fillStyle = gd; x.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, side: T.DoubleSide }));
        est.rotation.x = -Math.PI / 2; est.position.set(-216, -0.2, 0); av.add(est);
        poner(capa, av, 'Avión', 'Avión comercial en vuelo de crucero con su estela. Decorativo.'); dinamicos.push(av);
        const x0 = rx0 - 300, x1 = rx1 + 300, yv = ry0 + (ry1 - ry0) * 0.3, per = (x1 - x0) / 60;
        animar.push((t) => { const x = x0 + ((t + 12) % per) * 60; av.position.copy(P(x, yv + Math.sin(t * 0.05) * 20, 260)); av.rotation.y = 0; });
      }

      // ---------- Paseo de los vecinos ----------
      function caminar(obj, pts, vel, cerrado, s0fijo) {
        const seg = []; let tot = 0; const n = pts.length;
        for (let i = 0; i < (cerrado ? n : n - 1); i++) { const a = pts[i], b = pts[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l]); tot += l; }
        const total = cerrado ? tot : tot * 2, s0 = s0fijo ?? azar() * total;
        const punto = (s) => { let d = s % total, atras = false; if (!cerrado && d > tot) { d = total - d; atras = true; } for (const [a, b, l] of seg) { if (d <= l) { const k = d / l; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0]) + (atras ? Math.PI : 0)]; } d -= l; } return [pts[0][0], pts[0][1], 0]; };
        animar.push((t) => { const [x, y, th] = punto(s0 + t * vel); obj.position.copy(P(x, y, alt(x, y))); obj.rotation.y = th; const f = reducido ? 0 : Math.sin(t * vel * 3.2) * 0.7; if (obj.piernas) { obj.piernas[0].rotation.z = f; obj.piernas[1].rotation.z = -f; } else obj.position.y += Math.abs(f) * 0.05; });
        return s0;
      }

      // ---------- Bucle de animación propio ----------
      if (!window.Poblado3D._bucle) {
        window.Poblado3D._bucle = true;
        let t0 = performance.now(), t = 0;
        const paso = () => {
          const ahora = performance.now(), dt = Math.min((ahora - t0) / 1000, 0.1); t0 = ahora; t += dt;
          if (!reducido && !document.hidden) for (const f of animar) f(t, dt);
          requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      }
      if (reducido) for (const f of animar) f(1, 0);
    }
  };
})();
