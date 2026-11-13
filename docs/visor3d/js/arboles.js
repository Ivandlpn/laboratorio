import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { b64Int16 } from './proyeccion.js';

/** Árboles del entorno real de un km: Int16 [dE, dN, h, r] en dm + caja UTM que ocupan (con los edificios). */
export function decodificarArboles(ent) {
  const dat = ent.arboles ? b64Int16(ent.arboles) : new Int16Array(0);
  const n = Math.floor(dat.length / 4);
  let minE = Infinity, minN = Infinity, maxE = -Infinity, maxN = -Infinity;
  const ampliar = (E, N) => { if (E < minE) minE = E; if (E > maxE) maxE = E; if (N < minN) minN = N; if (N > maxN) maxN = N; };
  for (let i = 0; i < n; i++) ampliar(ent.e0 + dat[i * 4] * 0.1, ent.n0 + dat[i * 4 + 1] * 0.1);
  for (const ed of ent.edificios || []) for (let i = 0; i < ed.a.length; i += 2) ampliar(ent.e0 + ed.a[i] * 0.1, ent.n0 + ed.a[i + 1] * 0.1);
  if (!Number.isFinite(minE)) return null;
  return { n, dat, e0: ent.e0, n0: ent.n0, minE, minN, maxE, maxN };
}

// Árboles del entorno real: modelos por especie (copa de lóbulos con normales suaves, ~120 triángulos)
export function crearArboles() {
  let sd = 9137;
  const az = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const ruido = (x, y, z) => { const h = Math.sin(x * 91.7 + y * 47.3 + z * 13.1) * 43758.5453; return h - Math.floor(h); };

  function copa(lobulos) {
    const partes = [];
    for (const [cx, cy, cz, rx, ry, rz] of lobulos) {
      const g = new THREE.IcosahedronGeometry(1, 0);
      const p = g.attributes.position, nor = new Float32Array(p.count * 3), col = new Float32Array(p.count * 3);
      const sombraLobulo = 0.9 + az() * 0.14;
      for (let i = 0; i < p.count; i++) {
        const ox = p.getX(i), oy = p.getY(i), oz = p.getZ(i);
        const j = 0.82 + ruido(ox, oy, oz) * 0.32;
        const x = cx + ox * rx * j, y = cy + oy * ry * j, z = cz + oz * rz * j;
        p.setXYZ(i, x, y, z);
        const l1 = Math.hypot(ox, oy, oz) || 1, gx = x, gy = y - 0.45, gz = z, l2 = Math.hypot(gx, gy, gz) || 1;
        const nx = ox / l1 * 0.55 + gx / l2 * 0.45, ny = oy / l1 * 0.55 + gy / l2 * 0.45, nz = oz / l1 * 0.55 + gz / l2 * 0.45;
        const ln = Math.hypot(nx, ny, nz) || 1;
        nor[i * 3] = nx / ln; nor[i * 3 + 1] = ny / ln; nor[i * 3 + 2] = nz / ln;
        const s = (0.58 + 0.42 * Math.min(1, Math.max(0, y))) * sombraLobulo * (0.92 + ruido(oz, ox, oy) * 0.16);
        col[i * 3] = s; col[i * 3 + 1] = s; col[i * 3 + 2] = s;
      }
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.deleteAttribute('uv');
      partes.push(g);
    }
    const g = mergeGeometries(partes, false);
    partes.forEach((x) => x.dispose());
    g.userData.compartida = true;
    return g;
  }

  function anillo(n, radio, y, dy, rx, ry, rz, fase = 0) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = fase + (k / n) * Math.PI * 2 + (az() - 0.5) * 0.7;
      const rr = radio * (0.8 + az() * 0.35);
      out.push([Math.cos(a) * rr, y + (az() - 0.5) * dy, Math.sin(a) * rr, rx * (0.85 + az() * 0.3), ry * (0.85 + az() * 0.3), rz * (0.85 + az() * 0.3)]);
    }
    return out;
  }

  function tronco(retorcido) {
    const g = new THREE.CylinderGeometry(0.7, 1, 1, 6, retorcido ? 3 : 1, true).translate(0, 0.5, 0);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      if (retorcido) {
        const a = y * 1.6, c = Math.cos(a), s = Math.sin(a), x = p.getX(i), z = p.getZ(i);
        p.setXYZ(i, x * c - z * s + Math.sin(y * 4) * 0.9, y, x * s + z * c + Math.cos(y * 3) * 0.5);
      }
      const t = 0.72 + y * 0.28;
      col[i * 3] = t; col[i * 3 + 1] = t; col[i * 3 + 2] = t;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    g.userData.compartida = true;
    return g;
  }

  const copaOlivo = copa([[0, 0.5, 0, 0.62, 0.36, 0.62], ...anillo(5, 0.5, 0.5, 0.3, 0.46, 0.34, 0.46)]);
  const copaAlmendro = copa([[0, 0.62, 0, 0.5, 0.34, 0.5], ...anillo(5, 0.48, 0.58, 0.25, 0.42, 0.36, 0.42, 0.4)]);
  const copaPino = copa([
    [0.05, 0.78, -0.05, 0.6, 0.2, 0.55],
    ...anillo(3, 0.5, 0.62, 0.2, 0.45, 0.2, 0.42, 0.3),
    ...anillo(2, 0.4, 0.35, 0.15, 0.36, 0.18, 0.34, 1.2),
  ]);

  const matCopa = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  const matTronco = new THREE.MeshStandardMaterial({ color: '#7a6450', vertexColors: true, roughness: 0.95, side: THREE.DoubleSide });
  return {
    copaOlivo, copaAlmendro, copaPino, troncoOlivo: tronco(true), troncoRecto: tronco(false), matCopa, matTronco,
    tinte: { olivo: new THREE.Color('#545c46'), almendro: new THREE.Color('#56653e'), pino: new THREE.Color('#4f6b3c') },
  };
}
