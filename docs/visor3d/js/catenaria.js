// Descentramiento (zigzag) del hilo de contacto
//
// En cada apoyo (ménsula de un poste) el brazo de atirantado lleva el hilo de contacto ±20 cm a un lado y otro del eje
// de la vía, alternando, y entre dos apoyos el hilo va en línea recta (está tensado). Así barre las bandas de carbón del
// pantógrafo de lado a lado y las desgasta por igual, y gana rigidez frente al viento. Apoyos: los postes de la
// cartografía de Adif (datos/albali/catenaria.json, scripts/generar-apoyos-catenaria.py); donde faltan, vanos de 55 m.

export const DESCENTRAMIENTO = 0.2;   // m a cada lado del eje de la vía (EAC-350: ±0,20 m en recta)
const VANO_TIPO = 55;

/**
 * @param {object} Eje3D  eje del corredor (enPk)
 * @param {{izq:number[], der:number[]}|null} apoyos  PK de los apoyos de cada vía, ordenados
 */
export function crearCatenaria(Eje3D, apoyos) {
  const listas = { 1: apoyos?.izq || [], [-1]: apoyos?.der || [] };

  // Índice del vano (apoyo i ≤ pk < apoyo i+1) por búsqueda binaria; fuera de la lista, vanos tipo
  function vano(pk, s) {
    const l = listas[s];
    if (l.length < 2 || pk < l[0] || pk >= l[l.length - 1]) {
      const i = Math.floor(pk / VANO_TIPO);
      return { i, a: i * VANO_TIPO, b: (i + 1) * VANO_TIPO };
    }
    let lo = 0, hi = l.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (l[m] <= pk) lo = m; else hi = m; }
    return { i: lo, a: l[lo], b: l[lo + 1] };
  }
  // Lado del descentramiento en el apoyo i (+ hacia la izquierda del sentido creciente)
  const signoApoyo = (i, s) => ((i + (s > 0 ? 0 : 1)) % 2 === 0 ? 1 : -1);

  // Punto del eje de la vía s (+1 izquierda, −1 derecha) desplazado lateralmente «d»
  function enVia(pk, s, d = 0) {
    const m = Eje3D.enPk(pk), off = s * m.sep * 0.5 + d;
    return { E: m.E - m.ty * off, N: m.N + m.tx * off, Z: m.Z, m };
  }

  /** Desplazamiento lateral (m, + a la izquierda) del hilo de contacto respecto al eje de la vía s en el PK. */
  function descentramiento(pk, s) {
    const { i, a, b } = vano(pk, s);
    const u = (pk - a) / (b - a || 1);
    const A = enVia(a, s, signoApoyo(i, s) * DESCENTRAMIENTO), B = enVia(b, s, signoApoyo(i + 1, s) * DESCENTRAMIENTO);
    // En línea recta entre apoyos: en curva la cuerda se mete hacia dentro, como el hilo real
    const E = A.E + (B.E - A.E) * u, N = A.N + (B.N - A.N) * u;
    const T = enVia(pk, s);
    return (E - T.E) * -T.m.ty + (N - T.N) * T.m.tx;
  }

  /** PK de los apoyos de la vía s entre pkA y pkB (incluidos los vanos tipo donde no hay lista). */
  function apoyosEntre(pkA, pkB, s) {
    const out = [];
    let { i, a } = vano(pkA, s);
    let pk = a;
    for (let guard = 0; pk <= pkB && guard < 400; guard++) {
      if (pk >= pkA) out.push({ pk, lado: signoApoyo(i, s) });
      const v = vano(pk + 0.01, s);
      if (v.b <= pk) break;
      i = v.i + 1; pk = v.b;
    }
    return out;
  }

  return { descentramiento, apoyosEntre, vano, signoApoyo, DESCENTRAMIENTO };
}
