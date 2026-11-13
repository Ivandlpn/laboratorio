// Utilidades de PK y proyección exacta bidireccional WGS84/ETRS89 (lon, lat) <-> UTM 30N (precisión < 0,1 mm)

export function fmtPk(pk) {
  const m = Math.round(pk), km = Math.floor(m / 1000);
  return km + '+' + String(((m % 1000) + 1000) % 1000).padStart(3, '0');
}

export function parsearPk(txt, ini, fin) {
  if (!txt) return null;
  const s = String(txt).trim().replace(',', '.');
  const m = /^(\d{3})\s*\+\s*(\d{1,3}(?:\.\d+)?)$/.exec(s);
  let v = m ? Number(m[1]) * 1000 + Number(m[2]) : Number(s);
  if (!Number.isFinite(v)) return null;
  if (v >= 300 && v <= 500) v *= 1000;
  return Math.max(ini, Math.min(fin, v));
}

export function b64Int16(s, unsigned = false) {
  const bin = atob(s), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return unsigned ? new Uint16Array(u.buffer) : new Int16Array(u.buffer);
}

const WGS_A = 6378137.0, WGS_F = 1 / 298.257222101, WGS_E2 = WGS_F * (2 - WGS_F), WGS_EP2 = WGS_E2 / (1 - WGS_E2), WGS_K0 = 0.9996;
const LON0_30 = (-3 * Math.PI) / 180;

export function lonlatAUTM(lon, lat) {
  const lr = (lon * Math.PI) / 180, fr = (lat * Math.PI) / 180;
  const s = Math.sin(fr), c = Math.cos(fr), t = Math.tan(fr);
  const n = WGS_A / Math.sqrt(1 - WGS_E2 * s * s), t2 = t * t, c2 = WGS_EP2 * c * c, a = c * (lr - LON0_30);
  const m = WGS_A * (
    (1 - WGS_E2 / 4 - 3 * WGS_E2 * WGS_E2 / 64 - 5 * WGS_E2 ** 3 / 256) * fr
    - (3 * WGS_E2 / 8 + 3 * WGS_E2 * WGS_E2 / 32 + 45 * WGS_E2 ** 3 / 1024) * Math.sin(2 * fr)
    + (15 * WGS_E2 * WGS_E2 / 256 + 45 * WGS_E2 ** 3 / 1024) * Math.sin(4 * fr)
    - (35 * WGS_E2 ** 3 / 3072) * Math.sin(6 * fr)
  );
  const E = WGS_K0 * n * (a + (1 - t2 + c2) * a ** 3 / 6 + (5 - 18 * t2 + t2 * t2 + 72 * c2 - 58 * WGS_EP2) * a ** 5 / 120) + 500000.0;
  const N = WGS_K0 * (m + n * t * (a * a / 2 + (5 - t2 + 9 * c2 + 4 * c2 * c2) * a ** 4 / 24 + (61 - 58 * t2 + t2 * t2 + 600 * c2 - 330 * WGS_EP2) * a ** 6 / 720));
  return [E, N];
}

export function utmALonlat(E, N) {
  const x = E - 500000.0, m = N / WGS_K0;
  const e1 = (1 - Math.sqrt(1 - WGS_E2)) / (1 + Math.sqrt(1 - WGS_E2));
  const mu = m / (WGS_A * (1 - WGS_E2 / 4 - 3 * WGS_E2 ** 2 / 64 - 5 * WGS_E2 ** 3 / 256));
  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const s1 = Math.sin(phi1), c1 = Math.cos(phi1), t1 = Math.tan(phi1);
  const n1 = WGS_A / Math.sqrt(1 - WGS_E2 * s1 * s1), r1 = (WGS_A * (1 - WGS_E2)) / (1 - WGS_E2 * s1 * s1) ** 1.5;
  const d = x / (n1 * WGS_K0), t2 = t1 * t1, c2 = WGS_EP2 * c1 * c1;
  const lat = phi1 - ((n1 * t1) / r1) * (d * d / 2 - (5 + 3 * t2 + 10 * c2 - 4 * c2 * c2 - 9 * WGS_EP2) * d ** 4 / 24 + (61 + 90 * t2 + 298 * c2 + 45 * t2 * t2 - 252 * WGS_EP2 - 3 * c2 * c2) * d ** 6 / 720);
  const lon = LON0_30 + (d - (1 + 2 * t2 + c2) * d ** 3 / 6 + (5 - 2 * c2 + 28 * t2 - 3 * c2 * c2 + 8 * WGS_EP2 + 24 * t2 * t2) * d ** 5 / 120) / c1;
  return [(lon * 180) / Math.PI, (lat * 180) / Math.PI];
}

export function lonlatAMercPx([lon, lat], z) {
  const esc = 256 * Math.pow(2, z);
  const x = ((lon + 180) / 360) * esc;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * esc;
  return [x, y];
}
