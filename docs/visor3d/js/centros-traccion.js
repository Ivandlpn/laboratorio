import * as THREE from 'three';
import { cajaOrientada } from './geometria.js';

/*
 * Centros de tracción 2×25 kV del corredor (ATI, ATF y subestaciones), como en las fotos de Adif:
 *  - edificio prefabricado de paneles de hormigón blanco con juntas verticales, cubierta plana con albardilla, logotipo de
 *    Adif, apliques, bajantes, rejillas y puertas grises elevadas con escalera y barandilla, sobre acera perimetral;
 *  - explanada de grava dentro del recinto vallado;
 *  - fila de pórticos de celosía galvanizada junto a la fachada que da a la vía, con seccionador y aisladores (2 en un ATI,
 *    3 en un ATF y 4 en una subestación);
 *  - ATI y ATF: autotransformador en su foso entre muros de bloque;
 *  - subestación: recinto mucho mayor con los transformadores de potencia, filas de aparamenta y pórticos de entrada de línea.
 * Recinto y edificio vienen en su posición, tamaño y orientación reales cuando la cartografía o el PNOA los dan
 * (datos/albali/centros-traccion.json); si no, con las medidas tipo, y la ficha lo marca como supuesto.
 *
 * `M` son las mallas de la tesela; los marcos (recinto y edificio) van en coordenadas locales: centro (cx, cz), eje largo
 * (ux, uz) y semilados A (largo) y B (ancho). `via` es el vector unitario local que apunta hacia la vía.
 */
let matLogo = null;
function materialLogo() {
  if (matLogo) return matLogo;
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 512, 160);
  x.fillStyle = 'rgba(150, 154, 158, 0.85)';
  // Flecha del logotipo y el texto «adif» en bajorrelieve gris
  x.beginPath(); x.moveTo(40, 132); x.lineTo(96, 22); x.lineTo(112, 22); x.lineTo(70, 132); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(84, 132); x.lineTo(126, 50); x.lineTo(140, 78); x.lineTo(118, 132); x.closePath(); x.fill();
  x.font = '600 118px Arial, Helvetica, sans-serif'; x.textBaseline = 'alphabetic';
  x.fillText('adif', 160, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  matLogo = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false });
  return matLogo;
}

/** Caja en un marco: s a lo largo del eje largo, t a lo ancho. */
function enMarco(F) {
  const nx = -F.uz, nz = F.ux;
  return {
    p: (s, t) => [F.cx + F.ux * s + nx * t, F.cz + F.uz * s + nz * t],
    caja(m, s, t, y0, y1, largo, ancho, largo1, ancho1) {
      const [x, z] = this.p(s, t);
      cajaOrientada(m, x, z, y0, y1, F.ux, F.uz, largo, ancho, largo1 ?? largo, ancho1 ?? ancho);
    },
  };
}

/** Torre de celosía cuadrada (montantes, presillas horizontales y cruces en dos caras) con cabeza de pórtico. */
function torreCelosia(M, f, s, t, z, h, w, lado, conSeccionador = true) {
  f.caja(M.hormigon, s, t, z - 0.25, z + 0.3, w + 0.6, w + 0.6);
  for (const a of [-1, 1]) for (const b of [-1, 1]) f.caja(M.acero, s + a * w / 2, t + b * w / 2, z + 0.3, z + h, 0.09, 0.09);
  for (let y = z + 0.75; y < z + h - 0.2; y += 0.55) {
    for (const b of [-1, 1]) f.caja(M.acero, s, t + b * w / 2, y, y + 0.045, w, 0.04);
    for (const a of [-1, 1]) f.caja(M.acero, s + a * w / 2, t, y, y + 0.045, 0.04, w);
  }
  f.caja(M.acero, s, t, z + h, z + h + 0.1, w + 0.35, w + 0.35);                 // placa de coronación
  // Cabeza: cruceta con tres aisladores de amarre del feeder
  f.caja(M.acero, s, t, z + h - 0.75, z + h - 0.6, 2.8, 0.16);
  for (const d of [-1.2, 0, 1.2]) {
    f.caja(M.aisladorGris, s + d, t, z + h - 1.65, z + h - 0.75, 0.13, 0.13);
    for (let k = 0; k < 4; k++) f.caja(M.aisladorGris, s + d, t, z + h - 1.55 + k * 0.22, z + h - 1.5 + k * 0.22, 0.3, 0.3);
  }
  if (!conSeccionador) return;
  // Plataforma media del seccionador: viga a lo largo de la fachada con jabalcones y tres columnas de aisladores
  const yS = z + Math.min(5.4, h * 0.55);
  f.caja(M.acero, s, t, yS, yS + 0.2, 3.4, 0.2);
  f.caja(M.acero, s, t + lado * 0.7, yS, yS + 0.2, 0.2, 1.4);
  for (const a of [-1, 1]) f.caja(M.acero, s + a * 0.95, t, yS - 1.1, yS, 0.07, 0.07, 0.07, 0.07);
  for (const d of [-1.25, 0, 1.25]) {
    f.caja(M.aislador, s + d, t + lado * 0.15, yS + 0.2, yS + 1.25, 0.16, 0.16, 0.12, 0.12);
    for (let k = 0; k < 5; k++) f.caja(M.aislador, s + d, t + lado * 0.15, yS + 0.3 + k * 0.19, yS + 0.34 + k * 0.19, 0.3, 0.3);
    f.caja(M.acero, s + d, t + lado * 0.15, yS + 1.25, yS + 1.32, 0.22, 0.6);    // cuchilla del seccionador
  }
  f.caja(M.armario, s, t + lado * (w / 2 + 0.2), z + 1.0, z + 1.9, 0.55, 0.3); // mando del seccionador
  f.caja(M.acero, s, t + lado * (w / 2 + 0.05), z + 1.9, yS, 0.05, 0.05);       // varilla de accionamiento
}

/** Autotransformador o transformador de potencia: cuba, radiadores, conservador y pasatapas. */
function transformador(M, f, s, t, z, largo, ancho, alto) {
  f.caja(M.hormigon, s, t, z - 0.4, z + 0.2, largo + 1.2, ancho + 1.6);
  f.caja(M.grava, s, t, z + 0.2, z + 0.25, largo + 1.0, ancho + 1.4);
  f.caja(M.trafo, s, t, z + 0.25, z + 0.25 + alto, largo, ancho);
  for (const b of [-1, 1]) {
    f.caja(M.trafo, s, t + b * (ancho / 2 + 0.3), z + 0.6, z + alto - 0.1, largo * 0.85, 0.5);
    for (let a = -largo * 0.4; a <= largo * 0.4; a += 0.32) f.caja(M.acero, s + a, t + b * (ancho / 2 + 0.3), z + 0.62, z + alto - 0.12, 0.05, 0.56);
  }
  f.caja(M.trafo, s - largo * 0.2, t, z + alto + 0.45, z + alto + 1.05, largo * 0.55, 0.62);   // conservador
  for (const d of [-0.32, 0, 0.32]) {
    const ds = s + d * largo;
    f.caja(M.aislador, ds, t + ancho * 0.18, z + 0.25 + alto, z + alto + 1.5, 0.24, 0.24, 0.14, 0.14);
    for (let k = 0; k < 5; k++) f.caja(M.aislador, ds, t + ancho * 0.18, z + alto + 0.45 + k * 0.2, z + alto + 0.5 + k * 0.2, 0.36, 0.36);
  }
}

/** Edificio técnico prefabricado blanco (fotos de Adif). Devuelve el plano del logotipo. */
function edificio(M, E, z, H, lejos) {
  const f = enMarco(E);
  const { A, B } = E;
  const tF = lejos * (B + 0.01);                               // fachada de las puertas (la que no da a la vía)
  f.caja(M.hormigon, 0, 0, z - 0.6, z + 0.15, 2 * A + 2.2, 2 * B + 2.2);            // acera perimetral
  f.caja(M.panel, 0, 0, z + 0.15, z + H, 2 * A, 2 * B);
  // Juntas verticales de los paneles (cada 2,4 m) en las cuatro fachadas
  for (let s = -A + 2.4; s < A - 0.3; s += 2.4) for (const b of [-1, 1]) f.caja(M.junta, s, b * (B + 0.004), z + 0.2, z + H, 0.05, 0.02);
  for (let t = -B + 2.4; t < B - 0.3; t += 2.4) for (const a of [-1, 1]) f.caja(M.junta, a * (A + 0.004), t, z + 0.2, z + H, 0.02, 0.05);
  // Cubierta plana y albardilla perimetral
  f.caja(M.cubierta, 0, 0, z + H, z + H + 0.08, 2 * A - 0.3, 2 * B - 0.3);
  for (const b of [-1, 1]) f.caja(M.panel, 0, b * (B - 0.1), z + H, z + H + 0.32, 2 * A + 0.12, 0.32);
  for (const a of [-1, 1]) f.caja(M.panel, a * (A - 0.1), 0, z + H, z + H + 0.32, 0.32, 2 * B + 0.12);
  // Bajantes en las esquinas de la fachada de las puertas
  for (const a of [-1, 1]) f.caja(M.bajante, a * (A - 0.35), lejos * (B + 0.07), z + 0.15, z + H + 0.2, 0.12, 0.12);
  // Puertas metálicas grises elevadas con escalera de tres peldaños y barandilla
  const puertas = A > 9 ? [[-A * 0.45, 1.05], [A * 0.15, 1.05], [A * 0.72, 1.9]] : [[-A * 0.3, 1.05], [A * 0.62, 1.9]];
  for (const [sp, an] of puertas) {
    f.caja(M.puerta, sp, tF, z + 0.62, z + 2.85, an, 0.06);
    f.caja(M.junta, sp, tF + lejos * 0.005, z + 2.85, z + 2.95, an + 0.2, 0.05);
    for (let k = 0; k < 3; k++) f.caja(M.hormigon, sp, lejos * (B + 0.35 + k * 0.3), z + 0.15, z + 0.62 - k * 0.16, an + 0.9, 0.3 + (k === 0 ? 0.4 : 0));
    const tB = lejos * (B + 0.25);
    for (const d of [-1, 1]) f.caja(M.barandilla, sp + d * (an / 2 + 0.45), tB + lejos * 0.55, z + 0.62, z + 1.6, 0.04, 0.04);
    for (const d of [-1, 1]) f.caja(M.barandilla, sp + d * (an / 2 + 0.45), tB + lejos * 0.55, z + 1.55, z + 1.6, 0.04, 1.1);
    f.caja(M.rejilla, sp, tF, z + 3.15, z + 3.55, 0.65, 0.07);                                    // rejilla de ventilación
  }
  // Apliques de pared en la fachada de las puertas y ventanucos cuadrados en los testeros
  for (let s = -A + 2.2; s < A - 1; s += Math.max(4.5, (2 * A - 3) / 4)) {
    f.caja(M.barandilla, s, lejos * (B + 0.25), z + H - 0.95, z + H - 0.88, 0.05, 0.5);
    f.caja(M.puerta, s, lejos * (B + 0.5), z + H - 1.05, z + H - 0.82, 0.42, 0.42, 0.2, 0.2);
  }
  for (const a of [-1, 1]) for (const y of [1.4, 2.9]) f.caja(M.puerta, a * (A + 0.01), -lejos * B * 0.3, z + y, z + y + 0.38, 0.06, 0.38);
  // Logotipo de Adif en la fachada de las puertas, arriba
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.94), materialLogo());
  const [lx, lz] = f.p(-A * 0.05, lejos * (B + 0.03));
  const nx = -E.uz * lejos, nz = E.ux * lejos;
  logo.position.set(lx, z + H - 0.95, lz);
  logo.rotation.y = Math.atan2(nx, nz);
  return logo;
}

/**
 * Construye el centro. `ct.tipo` es ATI, ATF o SUB. Devuelve las mallas sueltas (logotipo) que hay que añadir a la escena.
 */
export function construirCentroTraccion(M, ct, R, Ed, z, via, vallar) {
  const extra = [];
  const fR = enMarco(R);
  const esSub = ct.tipo === 'SUB';
  // Explanada de grava a nivel en todo el recinto (con su talud por si el terreno cae)
  fR.caja(M.grava, 0, 0, z - 2.5, z + 0.05, 2 * R.A, 2 * R.B, 2 * R.A, 2 * R.B);
  if (!ct.recintoCarto) vallar(R);

  // Lado del edificio que da a la vía (+1 o -1 en su eje corto) y el contrario, donde van las puertas
  const nEx = -Ed.uz, nEz = Ed.ux;
  const haciaVia = Math.sign(nEx * via[0] + nEz * via[1]) || 1;
  const H = esSub ? 5.2 : 4.3;
  extra.push(edificio(M, Ed, z, H, -haciaVia));

  // Pórticos de celosía en fila junto a la fachada que da a la vía
  const fE = enMarco(Ed);
  const nP = esSub ? 4 : ct.tipo === 'ATF' ? 3 : 2;
  const paso = Math.min(4.6, (2 * Ed.A - 1.5) / nP);
  const tP = haciaVia * (Ed.B + 2.6);
  for (let i = 0; i < nP; i++) {
    const s = (i - (nP - 1) / 2) * paso;
    torreCelosia(M, fE, s, tP, z, esSub ? 11.5 : 9.6, 0.72, haciaVia);
  }
  // Canalización de cables entre pórticos y edificio
  fE.caja(M.hormigon, 0, haciaVia * (Ed.B + 1.4), z - 0.1, z + 0.12, nP * paso, 0.6);

  if (!esSub) {
    // Autotransformador en su foso, entre muros de bloque, junto al testero del edificio (si cabe en el recinto); si se
    // midió en el PNOA, en el testero de ese lado
    const tr0 = ct.trafosLoc?.[0];
    const sT = (tr0 ? Math.sign((tr0[0] - Ed.cx) * Ed.ux + (tr0[1] - Ed.cz) * Ed.uz) || 1 : 1) * (Ed.A + 4.2);
    const [tx, tz] = fE.p(sT, 0);
    const dentro = Math.abs((tx - R.cx) * R.ux + (tz - R.cz) * R.uz) < R.A - 2.6 && Math.abs((tx - R.cx) * -R.uz + (tz - R.cz) * R.ux) < R.B - 2.6;
    const sTr = dentro ? sT : -sT;
    const lado = Math.sign(sTr);
    fE.caja(M.bloque, sTr + lado * 2.6, 0, z, z + 3.2, 0.3, 5.2);
    fE.caja(M.bloque, sTr, -haciaVia * 2.5, z, z + 3.2, 5.2, 0.3);
    fE.caja(M.bloque, sTr, haciaVia * 2.5, z, z + 1.2, 5.2, 0.3);
    transformador(M, fE, sTr, 0, z, 2.4, 1.6, 2.3);
    return extra;
  }

  // ---- Subestación: transformadores de potencia, aparamenta y pórticos de entrada de línea ----
  for (const [E, N] of ct.trafosLoc || []) {
    const sL = (E - R.cx) * R.ux + (N - R.cz) * R.uz, tL = (E - R.cx) * -R.uz + (N - R.cz) * R.ux;
    transformador(M, fR, sL, tL, z, 4.2, 2.6, 3.2);
  }
  // Zona de intemperie: del lado contrario a la vía, desde los transformadores hasta la valla del fondo
  const ladoLejos = -(Math.sign(-R.uz * via[0] + R.ux * via[1]) || 1);
  const tFondo = ladoLejos * (R.B - 5);
  // Dos pórticos de entrada de línea (dos columnas de celosía y dintel)
  for (const a of [-1, 1]) {
    const s0 = a * R.A * 0.45;
    for (const b of [-1, 1]) torreCelosia(M, fR, s0 + b * 5, tFondo, z, 14, 1.0, -ladoLejos, false);
    fR.caja(M.acero, s0, tFondo, z + 13.2, z + 14, 10.6, 0.9);
    for (let k = -5; k <= 5; k += 0.6) fR.caja(M.acero, s0 + k, tFondo, z + 13.2, z + 14, 0.05, 0.92);
    for (const d of [-3, 0, 3]) fR.caja(M.aisladorGris, s0 + d, tFondo, z + 11.6, z + 13.2, 0.16, 0.16);
  }
  // Filas de aparamenta (seccionadores, interruptores y transformadores de medida en grupos de tres fases)
  for (let fila = 0; fila < 3; fila++) {
    const tF = tFondo - ladoLejos * (6 + fila * 5.5);
    for (let s = -R.A + 6; s < R.A - 5; s += 5.5) {
      for (const d of [-1.5, 0, 1.5]) {
        fR.caja(M.acero, s + d, tF, z, z + 2.5, 0.3, 0.3);
        fR.caja(M.aislador, s + d, tF, z + 2.5, z + 4.4, 0.24, 0.24, 0.16, 0.16);
        for (let k = 0; k < 6; k++) fR.caja(M.aislador, s + d, tF, z + 2.6 + k * 0.28, z + 2.65 + k * 0.28, 0.4, 0.4);
        if (fila !== 1) fR.caja(M.acero, s + d, tF, z + 4.4, z + 4.5, 0.15, 1.4);
      }
    }
  }
  return extra;
}
