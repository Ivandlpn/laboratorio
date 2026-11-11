/* Detalle de entorno y de línea para los visores 3D (sin dependencias propias): bosquetes de pinos, chopos de ribera,
   olivares en hileras, parcelas de cultivo con surcos, rocas, hitos kilométricos, señales de velocidad, balizas ERTMS,
   líneas de alta tensión y caminos de servicio. Todo se reparte con una semilla fija, así que es el mismo en cada visita.
   Cada visor llama a Entorno3D.anadir(ctx); ver el contrato en la función. Las posiciones son genéricas: no proceden de cartografía. */
(function () {
  let T = null;
  const azarSemilla = (semilla) => { let s = semilla >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const mat = (c, extra = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0.05, ...extra });

  function texSurcos(base, surco, ancho) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 128, 128);
    x.fillStyle = surco; for (let i = 0; i < 128; i += ancho * 2) x.fillRect(i, 0, ancho, 128);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(60,45,25,${Math.random() * 0.12})`; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function texSenal(texto) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.strokeStyle = '#c8102e'; x.lineWidth = 12; x.beginPath(); x.arc(64, 64, 54, 0, 7); x.stroke();
    x.fillStyle = '#111'; x.font = '800 46px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, 64, 68);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }

  window.Entorno3D = {
    init(THREE) { T = THREE; },
    /**
     * ctx: {
     *   P, poner(id, obj, nombre, info), capa: id de la capa del paisaje, capaVia: id de la capa de la vía,
     *   altura(x, y), libre(x, y), region: [x0, x1, y0, y1] (zona de reparto), semilla,
     *   dispersar (bool), ribera: [[x, y], ...] (posiciones junto al agua), olivares/parcelas: cuántos,
     *   vias: [{ y, z }] ejes de vía y cota del balasto, x: [xa, xb], lateral: [{ y, z }] bordes donde van hitos y señales,
     *   caminos: [{ y, x: [a, b] }]
     * }
     */
    anadir(ctx) {
      const { P, poner } = ctx, azar = azarSemilla(ctx.semilla || 5), o = new T.Object3D(), tono = new T.Color();
      const [rx0, rx1, ry0, ry1] = ctx.region || [-300, 300, -300, 300];
      const aleat = (n, libre, caja) => { const r = []; for (let k = 0; r.length < n && k < n * 30; k++) { const x = caja[0] + azar() * (caja[1] - caja[0]), y = caja[2] + azar() * (caja[3] - caja[2]); if (libre(x, y)) r.push([x, y]); } return r; };
      const plano = (x0, x1, y0, y1) => { const h = [ctx.altura(x0, y0), ctx.altura(x1, y0), ctx.altura(x0, y1), ctx.altura(x1, y1), ctx.altura((x0 + x1) / 2, (y0 + y1) / 2)]; return Math.max(...h) - Math.min(...h) < 0.7; };
      const ocupadas = [];
      const choca = (x0, x1, y0, y1) => ocupadas.some(([a, b, c, d]) => x0 < b + 6 && x1 > a - 6 && y0 < d + 6 && y1 > c - 6);

      if (ctx.dispersar !== false) {
        const libre = ctx.libre;
        // Parcelas de cultivo con surcos: sobre terreno llano y sin pisar la zona de la vía
        const parcelas = new T.Group(), colores = [['#b49456', '#a6854a'], ['#7f9a4d', '#6f8b42'], ['#9b7a4b', '#8b6a3d'], ['#c2a468', '#b39556'], ['#8aa05a', '#7b9150']];
        const nPar = ctx.parcelas ?? 12;
        for (let k = 0, hechas = 0; hechas < nPar && k < 400; k++) {
          const w = 50 + azar() * 90, h = 36 + azar() * 70, cx = rx0 + azar() * (rx1 - rx0), cy = ry0 + azar() * (ry1 - ry0);
          const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
          if (![[x0, y0], [x1, y0], [x0, y1], [x1, y1], [cx, cy]].every(([x, y]) => libre(x, y)) || !plano(x0, x1, y0, y1) || choca(x0, x1, y0, y1)) continue;
          const [b, s] = colores[Math.floor(azar() * colores.length)], tx = texSurcos(b, s, 4), horizontal = azar() > 0.5;
          tx.repeat.set((horizontal ? w : h) / 12, (horizontal ? h : w) / 12);
          const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tx, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
          m.rotation.x = -Math.PI / 2; if (!horizontal) m.rotation.z = Math.PI / 2; m.position.copy(P(cx, cy, ctx.altura(cx, cy) + 0.05)); m.receiveShadow = true; parcelas.add(m);
          ocupadas.push([x0, x1, y0, y1]); hechas++;
        }
        if (parcelas.children.length) poner(ctx.capa, parcelas, 'Parcelas de cultivo', 'Parcelas de labor con surcos, de distintos tonos según el cultivo. Reparto genérico: no procede de cartografía.');
        // Olivares en hileras
        const oliv = [];
        for (let k = 0, hechas = 0; hechas < (ctx.olivares ?? 3) && k < 400; k++) {
          const w = 54 + azar() * 40, h = 40 + azar() * 40, cx = rx0 + azar() * (rx1 - rx0), cy = ry0 + azar() * (ry1 - ry0);
          const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
          if (![[x0, y0], [x1, y0], [x0, y1], [x1, y1]].every(([x, y]) => libre(x, y)) || !plano(x0, x1, y0, y1) || choca(x0, x1, y0, y1)) continue;
          for (let x = x0 + 3; x < x1; x += 6) for (let y = y0 + 3; y < y1; y += 6) oliv.push([x + (azar() - 0.5) * 0.6, y + (azar() - 0.5) * 0.6]);
          ocupadas.push([x0, x1, y0, y1]); hechas++;
        }
        if (oliv.length) {
          const tr = new T.InstancedMesh(new T.CylinderGeometry(0.12, 0.22, 1, 6), mat('#6b5a45'), oliv.length), cp = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), mat('#ffffff'), oliv.length);
          oliv.forEach(([x, y], i) => {
            const z = ctx.altura(x, y), r = 1.1 + azar() * 0.6;
            o.rotation.set(0, azar() * 6.28, 0); o.position.copy(P(x, y, z + 0.5)); o.scale.set(1, 1.0, 1); o.updateMatrix(); tr.setMatrixAt(i, o.matrix);
            o.position.copy(P(x, y, z + 1.55)); o.scale.set(r, r * 0.72, r); o.updateMatrix(); cp.setMatrixAt(i, o.matrix); cp.setColorAt(i, tono.set('#7e8b5c').offsetHSL((azar() - 0.5) * 0.04, 0, (azar() - 0.5) * 0.1));
          });
          const g = new T.Group(); g.add(tr, cp); poner(ctx.capa, g, 'Olivar', 'Olivos plantados en hileras a marco real de unos 6 m. Reparto genérico.');
        }
        // Bosquetes de pinos
        const pinos = [];
        for (let b = 0; b < (ctx.bosquetes ?? 9); b++) {
          const c = aleat(1, libre, [rx0, rx1, ry0, ry1])[0]; if (!c) continue;
          for (const [x, y] of aleat(26, (x, y) => Math.hypot(x - c[0], y - c[1]) < 26 && libre(x, y), [c[0] - 26, c[0] + 26, c[1] - 26, c[1] + 26])) pinos.push([x, y]);
        }
        if (pinos.length) {
          const tr = new T.InstancedMesh(new T.CylinderGeometry(0.14, 0.26, 1, 6), mat('#5b4634'), pinos.length), c1 = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), mat('#ffffff'), pinos.length), c2 = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), mat('#ffffff'), pinos.length);
          pinos.forEach(([x, y], i) => {
            const z = ctx.altura(x, y), h = 6 + azar() * 6, r = 1.5 + azar() * 1.3;
            o.rotation.set(0, azar() * 6.28, 0); o.position.copy(P(x, y, z + h * 0.3)); o.scale.set(1, h * 0.6, 1); o.updateMatrix(); tr.setMatrixAt(i, o.matrix);
            o.position.copy(P(x, y, z + h * 0.72)); o.scale.set(r * 1.25, h * 0.2, r * 1.25); o.updateMatrix(); c1.setMatrixAt(i, o.matrix); c1.setColorAt(i, tono.set('#2f4f2e').offsetHSL((azar() - 0.5) * 0.03, 0, (azar() - 0.5) * 0.08));
            o.position.copy(P(x, y, z + h * 0.93)); o.scale.set(r * 0.85, h * 0.15, r * 0.85); o.updateMatrix(); c2.setMatrixAt(i, o.matrix); c2.setColorAt(i, tono.set('#365a34').offsetHSL((azar() - 0.5) * 0.03, 0, (azar() - 0.5) * 0.08));
          });
          const g = new T.Group(); g.add(tr, c1, c2); poner(ctx.capa, g, 'Pinar', 'Bosquetes de pino carrasco, de 6 a 12 m. Reparto genérico.');
        }
        // Chopos de ribera
        if (ctx.ribera?.length) {
          const tr = new T.InstancedMesh(new T.CylinderGeometry(0.09, 0.16, 1, 6), mat('#8a7d68'), ctx.ribera.length), cp = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), mat('#ffffff'), ctx.ribera.length);
          ctx.ribera.forEach(([x, y], i) => {
            const z = ctx.altura(x, y), h = 10 + azar() * 7;
            o.rotation.set(0, azar() * 6.28, 0); o.position.copy(P(x, y, z + h * 0.25)); o.scale.set(1, h * 0.5, 1); o.updateMatrix(); tr.setMatrixAt(i, o.matrix);
            o.position.copy(P(x, y, z + h * 0.66)); o.scale.set(1.5 + azar() * 0.6, h * 0.36, 1.5 + azar() * 0.6); o.updateMatrix(); cp.setMatrixAt(i, o.matrix); cp.setColorAt(i, tono.set('#7ea83c').offsetHSL((azar() - 0.5) * 0.04, 0, (azar() - 0.5) * 0.1));
          });
          const g = new T.Group(); g.add(tr, cp); poner(ctx.capa, g, 'Chopos de ribera', 'Choperas junto al cauce: árboles altos y esbeltos de hoja clara. Reparto genérico.');
        }
        // Rocas sueltas
        const rocas = aleat(70, libre, [rx0, rx1, ry0, ry1]);
        if (rocas.length) {
          const rm = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), mat('#8c867a', { flatShading: true }), rocas.length);
          rocas.forEach(([x, y], i) => { const r = 0.4 + azar() * 1.1; o.rotation.set(azar() * 3, azar() * 6, azar() * 3); o.position.copy(P(x, y, ctx.altura(x, y) + r * 0.25)); o.scale.set(r * 1.2, r * 0.7, r); o.updateMatrix(); rm.setMatrixAt(i, o.matrix); rm.setColorAt(i, tono.set('#8c867a').offsetHSL(0, 0, (azar() - 0.5) * 0.14)); });
          poner(ctx.capa, rm, 'Rocas', 'Bloques de roca sueltos en el campo. Reparto genérico.');
        }
        // Línea de alta tensión que cruza el paisaje
        if (ctx.altaTension !== false) {
          const g = new T.Group(), xL = ctx.xAltaTension ?? rx1 * 0.55, mtal = mat('#8d949a', { metalness: 0.6, roughness: 0.5 }), ais = mat('#c9d4d6', { roughness: 0.4 });
          const ys = []; for (let y = ry0 + 40; y <= ry1 - 40; y += 230) ys.push(y);
          const bra = (a, b, r) => { const d = new T.Vector3().subVectors(b, a), m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 4), mtal); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(m); };
          const alt = 36, brazos = [alt * 0.62, alt * 0.8, alt * 0.97], salidas = [-9, 9, 9];
          const hilos = [[], [], [], [], [], []];
          ys.forEach((y) => {
            const z0 = ctx.altura(xL, y);
            for (const sx of [-1, 1]) for (const sy of [-1, 1]) bra(P(xL + sx * 3.4, y + sy * 3.4, z0), P(xL + sx * 0.5, y + sy * 0.5, z0 + alt), 0.16);
            bra(P(xL, y, z0 + alt), P(xL, y, z0 + alt + 5), 0.1);
            brazos.forEach((h, i) => {
              const lado = i === 0 ? [-1, 1] : [i === 1 ? -1 : 1];
              for (const l of lado) { const ext = (i === 0 ? l : i === 1 ? -1 : 1) * 6.3; bra(P(xL, y, z0 + h), P(xL + ext, y, z0 + h), 0.09); const pa = P(xL + ext, y, z0 + h - 1.6); bra(P(xL + ext, y, z0 + h), pa, 0.05); hilos[i === 0 ? (l < 0 ? 0 : 1) : i + 1].push(pa); }
            });
          });
          for (const h of hilos) for (let i = 0; i < h.length - 1; i++) {
            const a = h[i], b = h[i + 1], pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * 7; pts.push(p); }
            g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: '#2b2f33' })));
          }
          poner(ctx.capa, g, 'Línea de alta tensión', 'Línea eléctrica de alta tensión con apoyos metálicos de celosía, cada 230 m, que cruza el paisaje. Genérica.');
        }
      }

      // ----- Detalle de línea: hitos, señales, balizas -----
      const [xa, xb] = ctx.x || [-300, 300], g = new T.Group();
      const lateral = ctx.lateral || [];
      if (lateral.length) {
        const nh = []; for (let x = Math.ceil(xa / 100) * 100; x <= xb; x += 100) nh.push(x);
        const hm = new T.InstancedMesh(new T.BoxGeometry(0.16, 0.9, 0.16), mat('#ecece6'), nh.length * lateral.length), hc = new T.InstancedMesh(new T.BoxGeometry(0.17, 0.2, 0.17), mat('#1f5fa8'), nh.length * lateral.length);
        let k = 0;
        for (const l of lateral) for (const x of nh) { o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.position.copy(P(x, l.y, l.z + 0.45)); o.updateMatrix(); hm.setMatrixAt(k, o.matrix); o.position.copy(P(x, l.y, l.z + 0.85)); o.updateMatrix(); hc.setMatrixAt(k++, o.matrix); }
        g.add(hm, hc);
        const textos = ['300', '300', '250', '300', '200', '300'];
        textos.forEach((tx, i) => {
          const l = lateral[i % lateral.length], x = xa + (xb - xa) * (0.1 + 0.16 * i), poste = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.6, 6), mat('#6e757a', { metalness: 0.5 }));
          poste.position.copy(P(x, l.y, l.z + 1.3)); g.add(poste);
          const disco = new T.Mesh(new T.CircleGeometry(0.4, 24), new T.MeshStandardMaterial({ map: texSenal(tx), roughness: 0.5, side: T.DoubleSide }));
          disco.position.copy(P(x, l.y, l.z + 2.7)); disco.rotation.y = Math.PI / 2; g.add(disco);
        });
      }
      const vias = ctx.vias || [];
      if (vias.length) {
        const nb = []; for (let x = Math.ceil(xa / 80) * 80; x <= xb; x += 80) nb.push(x);
        const bm = new T.InstancedMesh(new T.BoxGeometry(0.5, 0.05, 0.3), mat('#e3c02a', { roughness: 0.6 }), nb.length * vias.length);
        let k = 0; for (const v of vias) for (const x of nb) { o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.position.copy(P(x, v.y, v.z + 0.19)); o.updateMatrix(); bm.setMatrixAt(k++, o.matrix); }
        g.add(bm);
      }
      if (g.children.length) poner(ctx.capaVia, g, 'Hitos, señales y balizas', 'Hitos kilométricos cada 100 m, señales de velocidad en postes laterales y balizas ERTMS (amarillas) entre carriles cada 80 m. Posición y valores supuestos.');

      // ----- Caminos de servicio -----
      for (const c of ctx.caminos || []) {
        const n = Math.round((c.x[1] - c.x[0]) / 8), pos = [], idx = [], uv = [];
        for (let i = 0; i <= n; i++) { const x = c.x[0] + (c.x[1] - c.x[0]) * i / n, z = ctx.altura(x, c.y) + 0.06; pos.push(x, z, -(c.y - 1.5), x, z, -(c.y + 1.5)); uv.push(i, 0, i, 1); }
        for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
        const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: '#a4957a', roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.receiveShadow = true;
        poner(ctx.capa, m, 'Camino de servicio', 'Camino de tierra paralelo a la línea para el acceso del mantenimiento. Posición supuesta.');
      }
    }
  };
})();
