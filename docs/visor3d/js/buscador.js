/*
 * Buscador universal del visor: un solo cuadro para ir a un PK, una coordenada, un lugar, una arqueta, un tren en directo
 * o para dar una orden («noche», «vista cabina», «capa catenaria»). Sin dependencias.
 *
 *   const indice = crearIndice({ dinamicos: () => [...] });   // los dinámicos (trenes en directo) se piden en cada búsqueda
 *   indice.agregar(items);                                    // item = { tipo, titulo, sub?, extra?, pkTexto?, accion }
 *   indice.buscar('villnea', 14);                             // tolera erratas: ranking por coincidencia
 *
 * Una consulta numérica se interpreta antes de buscar texto: «437+020», «km 437,5», «38.5729, -0.8702» o «685534 4271534».
 */

export const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const ETIQUETA_TIPO = {
  pk: 'Ir a', coordenada: 'Ir a', comando: 'Orden', capa: 'Capa', lugar: 'Lugar', hito: 'Hito', arqueta: 'Arqueta', tren: 'Tren en directo',
};
// Orden de aparición a igualdad de puntos: lo que se pide por su nombre antes que las órdenes
const PESO_TIPO = { pk: 0, coordenada: 0, lugar: 1, hito: 1, tren: 2, arqueta: 3, comando: 4, capa: 5 };

/** Distancia de edición (con transposiciones) acotada: devuelve `max + 1` si la supera. */
function distancia(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + coste);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < minFila) minFila = v;
    }
    if (minFila > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}

/** Puntos de un token contra un elemento: 0 = no coincide. */
function puntosToken(token, it) {
  if (it.clave.includes(token)) {
    const empieza = it.palabras.some((p) => p.startsWith(token));
    const enTitulo = it.tituloN.includes(token);
    return 2 + (empieza ? 2 : 0) + (enTitulo ? 1 : 0);
  }
  if (token.length < 4) return 0;
  const tol = token.length >= 8 ? 2 : 1;
  for (const p of it.palabras) {
    if (p.length >= 3 && distancia(token, p.slice(0, token.length + tol), tol) <= tol) return 1;   // la errata también vale en el comienzo de una palabra
  }
  return 0;
}

export function crearIndice({ dinamicos = () => [] } = {}) {
  const fijos = [];
  const preparar = (it) => {
    const tituloN = normalizar(it.titulo);
    const clave = normalizar(`${it.titulo} ${it.sub || ''} ${it.extra || ''} ${it.pkTexto || ''} ${ETIQUETA_TIPO[it.tipo] || ''}`);
    return { ...it, tituloN, clave, palabras: clave.split(/[^a-z0-9+.]+/).filter(Boolean) };
  };
  return {
    agregar(lista) { for (const it of lista) fijos.push(preparar(it)); },
    vaciar() { fijos.length = 0; },
    get tamano() { return fijos.length; },
    buscar(q, max = 14) {
      const tokens = normalizar(q).split(/\s+/).filter(Boolean);
      if (!tokens.length) return [];
      const salida = [];
      for (const it of [...fijos, ...dinamicos().map(preparar)]) {
        let total = 0;
        for (const t of tokens) {
          const p = puntosToken(t, it);
          if (!p) { total = 0; break; }
          total += p;
        }
        if (total) salida.push({ it, total });
      }
      salida.sort((a, b) => b.total - a.total || PESO_TIPO[a.it.tipo] - PESO_TIPO[b.it.tipo] || (a.it.pk ?? 0) - (b.it.pk ?? 0));
      return salida.slice(0, max).map((s) => s.it);
    },
  };
}

/**
 * Interpreta una consulta numérica: PK, coordenada geográfica o UTM 30N.
 * Devuelve { tipo: 'pk' | 'coordenada', pk, titulo, sub } o null si no es un número.
 */
export function interpretarNumero(q, { parsearPk, lonlatAUTM, proyUTM, pkIni, pkFin, fmtPk }) {
  let s = String(q).trim().replace(/^(?:p\.?\s*k\.?|km|punto kilom[eé]trico)\s*/i, '');
  if (!s) return null;
  // Dos números: latitud, longitud (decimales) o X, Y (UTM 30N)
  const dos = /^(-?\d+(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d+(?:[.,]\d+)?)$/.exec(s);
  if (dos && !/^\d{3}\s*\+/.test(s)) {
    const a = Number(dos[1].replace(',', '.')), b = Number(dos[2].replace(',', '.'));
    let E = null, N = null;
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180 && /[.,]/.test(`${dos[1]}${dos[2]}`)) [E, N] = lonlatAUTM(b, a);   // lat, lon → UTM
    else if (a > 1e5 && a < 1e6 && b > 3e6 && b < 5e6) [E, N] = [a, b];
    if (E !== null) {
      const p = proyUTM(E, N);
      const lejos = p.d > 1500;
      return {
        tipo: 'coordenada', pk: p.pk,
        titulo: `Ir a la coordenada · PK ${fmtPk(p.pk)}`,
        sub: lejos ? `a ${(p.d / 1000).toFixed(1)} km de la línea: se va al PK más próximo` : `${Math.round(p.d)} m del eje`,
      };
    }
  }
  if (!/^[\d+.,\s]+$/.test(s)) return null;
  // Un número suelto solo es un PK si cae dentro de la línea (322-486 km o 322000-486200 m); con «+» siempre lo es
  const n = Number(s.replace(',', '.'));
  if (!s.includes('+') && !(n >= pkIni / 1000 - 0.5 && n <= pkFin / 1000 + 0.5) && !(n >= pkIni - 500 && n <= pkFin + 500)) return null;
  const v = parsearPk(s, pkIni, pkFin);
  if (v === null) return null;
  return { tipo: 'pk', pk: v, titulo: `Ir al PK ${fmtPk(v)}`, sub: 'Punto kilométrico de la línea L042' };
}
