/* Vía en balasto para los visores 3D: banqueta de balasto en trapecio, traviesas, almohadillas, carril con perfil
   (patín, alma y cabeza) y sujeciones en verde Adif (clip elástico + escuadra de apoyo). Las sujeciones solo se dibujan
   en un tramo de `detalle` metros a cada lado del origen para no cargar la escena. */
(function () {
  let THREE_ = null, merge = null;
  const VERDE_ADIF = '#27b43c';

  function geoSujecion() {
    const a = new THREE_.BoxGeometry(0.15, 0.028, 0.045), b = new THREE_.BoxGeometry(0.05, 0.06, 0.07);
    a.translate(0, 0.0, 0); b.translate(-0.06, -0.02, 0);
    const col = (g, c) => { const k = new THREE_.Color(c), n = g.attributes.position.count, v = new Float32Array(n * 3); for (let i = 0; i < n; i++) { v[i * 3] = k.r; v[i * 3 + 1] = k.g; v[i * 3 + 2] = k.b; } g.setAttribute('color', new THREE_.BufferAttribute(v, 3)); return g; };
    const u = merge([col(a, VERDE_ADIF), col(b, '#2b2e31')], false);
    u.rotateY(Math.PI / 2);
    return u;
  }


  // Balasto realista: textura de piedras angulosas (con relieve por bump) y piedras sueltas en los hombros de la banqueta.
  let texB = null, matB = null;
  function matBalastoReal() {
    if (matB) return matB;
    const T = THREE_, c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    let sd = 4217; const az = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    x.fillStyle = '#3d3a36'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1300; i++) {
      const cx = az() * 512, cy = az() * 512, r = 6 + az() * 12, n = 5 + Math.floor(az() * 3), v = 88 + az() * 100 | 0, rot = az() * 6.283, tono = az();
      const pts = []; for (let k = 0; k < n; k++) { const a = rot + k / n * 6.283, rr = r * (0.62 + az() * 0.55); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.78]); }
      for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
        if (cx + ox < -20 || cx + ox > 532 || cy + oy < -20 || cy + oy > 532) continue;
        x.beginPath(); pts.forEach(([px, py], k) => k ? x.lineTo(cx + ox + px, cy + oy + py) : x.moveTo(cx + ox + px, cy + oy + py)); x.closePath();
        x.fillStyle = tono > 0.8 ? `rgb(${v + 14},${v - 2},${v - 22})` : `rgb(${v},${v - 3},${v - 10})`; x.fill();
        x.strokeStyle = 'rgba(12,11,10,.6)'; x.lineWidth = 1.6; x.stroke();
      }
    }
    texB = new T.CanvasTexture(c); texB.wrapS = texB.wrapT = T.RepeatWrapping; texB.colorSpace = T.SRGBColorSpace; texB.anisotropy = 8; texB.repeat.set(0.8, 0.8);
    matB = new T.MeshStandardMaterial({ map: texB, bumpMap: texB, bumpScale: 2.2, roughness: 1, metalness: 0 });
    return matB;
  }
  // Piedras sueltas (icosaedros deformados) sobre los hombros del balasto y en los extremos de las traviesas, cerca del origen
  function piedrasBalasto(P, eje, z0, x0, x1) {
    const T = THREE_, g = new T.IcosahedronGeometry(1, 0), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.8 + Math.random() * 0.4), p.getY(i) * (0.45 + Math.random() * 0.3), p.getZ(i) * (0.8 + Math.random() * 0.4));
    const xa = Math.max(x0, -45), xb = Math.min(x1, 45), area = (xb - xa) * 2 * 1.3, n = Math.max(0, Math.min(9000, Math.floor(area * 16)));
    const m = new T.InstancedMesh(g, new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), n), o = new T.Object3D(), col = new T.Color();
    for (let i = 0; i < n; i++) {
      const s = Math.random() < 0.5 ? -1 : 1, l = 1.3 + Math.random() * 1.2, t = l < 1.85 ? 0 : Math.min(1, (l - 1.85) / 0.65), z = z0 - 0.5 * t, r = 0.022 + Math.random() * 0.03;
      o.position.copy(P(xa + Math.random() * (xb - xa), eje + s * l, z + 0.01)); o.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); o.scale.setScalar(r); o.updateMatrix();
      m.setMatrixAt(i, o.matrix); const v = 0.28 + Math.random() * 0.34; m.setColorAt(i, col.setRGB(v, v * 0.97, v * 0.9));
    }
    m.receiveShadow = true; return m;
  }

  window.Via3D = {
    init(THREE, mergeGeometries) { THREE_ = THREE; merge = mergeGeometries; },
    /** Devuelve un grupo con la vía entera. P: plano -> mundo; z0 = cara superior del balasto. */
    construir(P, o) {
      const T = THREE_, g = new T.Group(), { x0, x1, eje, z0 } = o, L = x1 - x0, detalle = o.detalle ?? 160, paso = 0.6;
      // Banqueta de balasto: trapecio de 3,7 m en coronación a 5,0 m en la base
      const sh = new T.Shape([new T.Vector2(-2.5, -0.5), new T.Vector2(2.5, -0.5), new T.Vector2(1.85, 0), new T.Vector2(-1.85, 0)]);
      const gb = new T.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false });
      gb.rotateY(Math.PI / 2);
      const balasto = new T.Mesh(gb, matBalastoReal()); balasto.position.copy(P(x0, eje, z0)); balasto.receiveShadow = true; g.add(balasto);
      // Traviesas de hormigón monobloque, con almohadilla bajo cada carril
      const n = Math.floor(L / paso), dummy = new T.Object3D();
      const traviesas = new T.InstancedMesh(new T.BoxGeometry(0.24, 0.2, 2.6), o.matTraviesa, n);
      const almohadillas = new T.InstancedMesh(new T.BoxGeometry(0.2, 0.014, 0.17), new T.MeshStandardMaterial({ color: '#2a2d30', roughness: 0.9 }), n * 2);
      for (let i = 0; i < n; i++) {
        const x = x0 + paso / 2 + i * paso;
        dummy.position.copy(P(x, eje, z0 + 0.06)); dummy.updateMatrix(); traviesas.setMatrixAt(i, dummy.matrix);
        for (const [k, s] of [-0.7175, 0.7175].entries()) { dummy.position.copy(P(x, eje + s, z0 + 0.167)); dummy.updateMatrix(); almohadillas.setMatrixAt(i * 2 + k, dummy.matrix); }
      }
      traviesas.castShadow = false; traviesas.receiveShadow = true;
      g.add(traviesas, almohadillas, piedrasBalasto(P, eje, z0, x0, x1));
      // Carril: patín, alma y cabeza
      const mC = o.matCarril;
      for (const s of [-0.7175, 0.7175]) {
        for (const [ancho, alto, zc] of [[0.15, 0.024, 0.186], [0.028, 0.1, 0.248], [0.072, 0.045, 0.3225]]) {
          const c = new T.Mesh(new T.BoxGeometry(L, alto, ancho), mC); c.position.copy(P((x0 + x1) / 2, eje + s, z0 + zc)); g.add(c);
        }
      }
      // Sujeciones verdes (cuatro por traviesa), solo cerca del origen
      const xa = Math.max(x0, -detalle), xb = Math.min(x1, detalle);
      if (xb > xa && merge) {
        const idx = []; for (let i = 0; i < n; i++) { const x = x0 + paso / 2 + i * paso; if (x >= xa && x <= xb) idx.push(x); }
        const sujeciones = new T.InstancedMesh(geoSujecion(), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.2 }), idx.length * 4);
        let k = 0;
        for (const x of idx) for (const s of [-0.7175, 0.7175]) for (const lado of [-1, 1]) {
          dummy.position.copy(P(x, eje + s + lado * 0.1, z0 + 0.205)); dummy.rotation.set(0, lado > 0 ? Math.PI : 0, 0); dummy.updateMatrix(); sujeciones.setMatrixAt(k++, dummy.matrix);
        }
        dummy.rotation.set(0, 0, 0);
        g.add(sujeciones);
      }
      return g;
    }
  };
})();
