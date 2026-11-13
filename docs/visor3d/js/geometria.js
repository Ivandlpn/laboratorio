import * as THREE from 'three';

// Constructores geométricos indexados en coordenadas locales de tesela y cubiertas arquitectónicas

export function crearMatTejaArabe() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  let sd = 4211; const az = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#93553a'; x.fillRect(0, 0, 128, 128);
  for (let col = 0; col < 8; col++) for (let fil = 0; fil < 4; fil++) {
    const x0 = col * 16, y0 = fil * 32, t = az();
    const g = x.createLinearGradient(x0, 0, x0 + 16, 0);
    const base = `hsl(${16 + t * 8}, ${42 + t * 14}%, ${34 + t * 10}%)`;
    g.addColorStop(0, 'rgba(40,18,10,0.55)'); g.addColorStop(0.35, base); g.addColorStop(0.6, base); g.addColorStop(1, 'rgba(40,18,10,0.45)');
    x.fillStyle = g; x.fillRect(x0, y0, 16, 32);
    x.fillStyle = 'rgba(25,12,6,0.45)'; x.fillRect(x0, y0 + 29, 16, 3);
    if (az() < 0.25) { x.fillStyle = 'rgba(70,80,60,0.25)'; x.fillRect(x0 + 2, y0 + 4, 12, 20); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0, side: THREE.DoubleSide });
}

export function rectMinimo(anillo) {
  const n = anillo.length - 1;
  let mejor = null;
  for (let i = 0; i < n; i++) {
    const dx = anillo[i + 1][0] - anillo[i][0], dz = anillo[i + 1][1] - anillo[i][1], l = Math.hypot(dx, dz);
    if (l < 0.5) continue;
    let ux = dx / l, uz = dz / l;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (let k = 0; k < n; k++) {
      const s = anillo[k][0] * ux + anillo[k][1] * uz, t = -anillo[k][0] * uz + anillo[k][1] * ux;
      if (s < a0) a0 = s; if (s > a1) a1 = s; if (t < b0) b0 = t; if (t > b1) b1 = t;
    }
    const area = (a1 - a0) * (b1 - b0);
    if (!mejor || area < mejor.area) mejor = { area, ux, uz, a0, a1, b0, b1 };
  }
  if (!mejor) return null;
  let { ux, uz, a0, a1, b0, b1 } = mejor;
  if (a1 - a0 < b1 - b0) {
    [ux, uz] = [-uz, ux];
    [a0, a1, b0, b1] = [b0, b1, -a1, -a0];
  }
  return { area: mejor.area, ux, uz, sc: (a0 + a1) / 2, tc: (b0 + b1) / 2, A: (a1 - a0) / 2, B: (b1 - b0) / 2 };
}

export function cubiertaInclinada(mMuro, mTeja, r, y1, tipo) {
  const PEND = 0.4, O = 0.35, REP = 1.76;
  const P = (s, t, y) => [s * r.ux - t * r.uz, y, s * r.uz + t * r.ux];
  const hr = r.B * PEND, yAl = y1 - O * PEND, yC = y1 + hr;
  const { sc, tc } = r, A = r.A + O, B = r.B + O, lPend = Math.hypot(B, hr + O * PEND);
  const v = (s, t, y, distPend) => { const q = P(s, t, y); return mTeja.v(q[0], q[1], q[2], s / REP, distPend / REP); };
  if (tipo === 'dos') {
    for (const lado of [1, -1]) {
      const e1 = v(sc - A, tc + lado * B, yAl, lPend), e2 = v(sc + A, tc + lado * B, yAl, lPend);
      const c2 = v(sc + A, tc, yC, 0), c1 = v(sc - A, tc, yC, 0);
      mTeja.quad(e1, e2, c2, c1);
    }
    for (const lado of [1, -1]) {
      const s = sc + lado * r.A;
      const a = P(s, tc - r.B, y1), b = P(s, tc + r.B, y1), c = P(s, tc, yC);
      mMuro.tri(mMuro.v(...a, 0, 0), mMuro.v(...b, r.B * 2 / 5.2, 0), mMuro.v(...c, r.B / 5.2, hr / 5.4));
    }
    return;
  }
  const dC = Math.max(0, r.A - r.B);
  const c1 = [sc - dC, tc, yC], c2 = [sc + dC, tc, yC];
  for (const lado of [1, -1]) {
    const e1 = v(sc - A, tc + lado * B, yAl, lPend), e2 = v(sc + A, tc + lado * B, yAl, lPend);
    mTeja.quad(e1, e2, v(...c2, 0), v(...c1, 0));
  }
  for (const lado of [1, -1]) {
    const sE = sc + lado * A, cc = lado > 0 ? c2 : c1;
    const lT = Math.hypot(A - dC, hr + O * PEND);
    const e1 = mTeja.v(...P(sE, tc + B, yAl), (tc + B) / REP, lT / REP), e2 = mTeja.v(...P(sE, tc - B, yAl), (tc - B) / REP, lT / REP);
    const q = P(cc[0], cc[1], cc[2]);
    mTeja.tri(e1, e2, mTeja.v(q[0], q[1], q[2], tc / REP, 0));
  }
}

export class Malla {
  constructor() { this.pos = []; this.idx = []; this.uv = []; }
  get vacia() { return this.idx.length === 0; }
  v(x, y, z, u = 0, w = 0) { const i = this.pos.length / 3; this.pos.push(x, y, z); this.uv.push(u, w); return i; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  construir(conUV = false) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    if (conUV) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

export function cinta(malla, pts, ancho, zBajo, zAlto, talud = 0, uEsc = 0.2) {
  const m = ancho / 2, mt = m + talud;
  let dist = 0, prev = null;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)];
    let dx = q[0] - r[0], dz = q[2] - r[2];
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const nx = -dz, nz = dx;
    if (i > 0) dist += Math.hypot(p[0] - prev[0], p[2] - prev[2]);
    const u = dist * uEsc;
    const ti = malla.v(p[0] - nx * m, p[1] + zAlto, p[2] - nz * m, 0, u);
    const td = malla.v(p[0] + nx * m, p[1] + zAlto, p[2] + nz * m, 1, u);
    const bi = malla.v(p[0] - nx * mt, p[1] + zBajo, p[2] - nz * mt, -0.3, u);
    const bd = malla.v(p[0] + nx * mt, p[1] + zBajo, p[2] + nz * mt, 1.3, u);
    if (prev) {
      malla.quad(prev.ti, prev.td, td, ti);
      malla.quad(prev.bi, prev.ti, ti, bi);
      malla.quad(prev.td, prev.bd, bd, td);
    }
    prev = { 0: p[0], 2: p[2], ti, td, bi, bd };
  }
}

export function extruirSeccion(malla, pts, perfil, cerrar = true, uEsc = 0.12) {
  const np = perfil.length;
  let dist = 0, prev = null;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)];
    let dx = q[0] - r[0], dz = q[2] - r[2];
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const nx = -dz, nz = dx;
    if (i > 0) dist += Math.hypot(p[0] - pts[i - 1][0], p[2] - pts[i - 1][2]);
    const u = dist * uEsc, aro = [];
    for (let k = 0; k < np; k++) {
      const [lat, dy] = perfil[k];
      aro.push(malla.v(p[0] + nx * lat, p[1] + dy, p[2] + nz * lat, k / np, u));
    }
    if (prev) {
      const lim = cerrar ? np : np - 1;
      for (let k = 0; k < lim; k++) {
        const k2 = (k + 1) % np;
        malla.quad(prev[k], prev[k2], aro[k2], aro[k]);
      }
    }
    prev = aro;
  }
}

export function cajaOrientada(malla, cx, cz, y0, y1, ux, uz, largo0, ancho0, largo1 = largo0, ancho1 = ancho0) {
  const nx = -uz, nz = ux;
  const wAlto = Math.max(0.25, Math.min(3, (y1 - y0) / 4.2));
  const esq = (l, a, y) => [
    [cx - ux * l - nx * a, y, cz - uz * l - nz * a],
    [cx + ux * l - nx * a, y, cz + uz * l - nz * a],
    [cx + ux * l + nx * a, y, cz + uz * l + nz * a],
    [cx - ux * l + nx * a, y, cz - uz * l + nz * a],
  ];
  const b = esq(largo0 * 0.5, ancho0 * 0.5, y0), t = esq(largo1 * 0.5, ancho1 * 0.5, y1);
  const uLados = [Math.max(1, Math.round(largo0 / 4.6)), Math.max(1, Math.round(ancho0 / 4.6)), Math.max(1, Math.round(largo0 / 4.6)), Math.max(1, Math.round(ancho0 / 4.6))];
  for (let k = 0; k < 4; k++) {
    const k2 = (k + 1) % 4, uM = uLados[k];
    const i0 = malla.v(b[k][0], b[k][1], b[k][2], 0, 0), i1 = malla.v(b[k2][0], b[k2][1], b[k2][2], uM, 0);
    const i2 = malla.v(t[k2][0], t[k2][1], t[k2][2], uM, wAlto), i3 = malla.v(t[k][0], t[k][1], t[k][2], 0, wAlto);
    malla.quad(i0, i1, i2, i3);
  }
  const ts = t.map((q) => malla.v(q[0], q[1], q[2], q[0] * 0.25, q[2] * 0.25));
  const bs = b.map((q) => malla.v(q[0], q[1], q[2], q[0] * 0.25, q[2] * 0.25));
  malla.quad(ts[0], ts[1], ts[2], ts[3]);
  malla.quad(bs[3], bs[2], bs[1], bs[0]);
}

export function prisma(malla, anillo, y0, y1) {
  const n = anillo.length - 1; if (n < 3) return;
  const wAlto = Math.max(0.5, Math.round((y1 - y0) / 5.4));
  let perim = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const len = Math.hypot(anillo[j][0] - anillo[i][0], anillo[j][1] - anillo[i][1]);
    const u0 = perim / 5.2, u1 = (perim + len) / 5.2;
    perim += len;
    const b0 = malla.v(anillo[i][0], y0, anillo[i][1], u0, 0), b1 = malla.v(anillo[j][0], y0, anillo[j][1], u1, 0);
    const t1 = malla.v(anillo[j][0], y1, anillo[j][1], u1, wAlto), t0 = malla.v(anillo[i][0], y1, anillo[i][1], u0, wAlto);
    malla.quad(b0, b1, t1, t0);
  }
  const arriba = anillo.slice(0, n).map((p) => malla.v(p[0], y1, p[1], p[0] * 0.28, p[1] * 0.28));
  const s = new THREE.Shape(anillo.slice(0, n).map((p) => new THREE.Vector2(p[0], p[1])));
  for (const t of THREE.ShapeUtils.triangulateShape(s.getPoints(), [])) malla.tri(arriba[t[0]], arriba[t[2]], arriba[t[1]]);
}

export function lamina(malla, anillo, y) {
  const n = anillo.length - 1; if (n < 3) return;
  const idx = anillo.slice(0, n).map((p) => malla.v(p[0], y, p[1], p[0] * 0.2, p[1] * 0.2));
  const s = new THREE.Shape(anillo.slice(0, n).map((p) => new THREE.Vector2(p[0], p[1])));
  for (const t of THREE.ShapeUtils.triangulateShape(s.getPoints(), [])) malla.tri(idx[t[0]], idx[t[2]], idx[t[1]]);
}
