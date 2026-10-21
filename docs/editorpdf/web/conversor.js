// Convierte paginas de un PDF vectorial en entidades DXF.
// Logica del programa de Windows (pdf_a_dxf.py) para el navegador, con mejoras inspiradas en proyectos publicos
// como darkneoss/pdf2dxf (unir segmentos, circulos, capas por tipo o color) y leoleonel-jf/PdfToDxf (escala y unidades).
// "mupdf" se recibe como parametro para que funcione igual en el navegador y en pruebas con Node.
const PT_MM = 25.4 / 72;
const CAPA_SIN_NOMBRE = "SIN_CAPA_PDF";
const CAPA_TEXTO = "Textos";
const GROSORES = [0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211];
const BEZIER_PASOS = 8;
const SEPARACION_MM = 60;

export const OPCIONES_BASE = {
  capas: "pdf",          // pdf | color | tipo | una
  unirSegmentos: true,   // junta segmentos contiguos en polilineas
  circulos: true,        // detecta circulos y los escribe como CIRCLE
  quitarDuplicados: true,
  rellenos: true,
  textos: true,
  quitarBlancos: false, // descarta rellenos blancos (mascaras)
  discontinuas: true, // trazos discontinuos del PDF como tipos de linea del DXF
  factor: 1,             // unidades de salida por mm de papel (escala / unidad)
};

export const nombreCapa = (n) => {
  const limpio = String(n || "").replace(/[<>/\\":;?*|=`]/g, "_").trim();
  return limpio || CAPA_SIN_NOMBRE;
};

const grosorDxf = (anchoPt) => {
  const c = (anchoPt || 0) * PT_MM * 100;
  return GROSORES.reduce((mejor, g) => (Math.abs(g - c) < Math.abs(mejor - c) ? g : mejor), GROSORES[0]);
};

// ---- color
export function aRgb(cs, color) {
  const n = color.length;
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  if (n === 1) return [c(color[0]), c(color[0]), c(color[0])];
  if (n === 3) return [c(color[0]), c(color[1]), c(color[2])];
  if (n === 4) {
    const k = 1 - color[3];
    return [c((1 - color[0]) * k), c((1 - color[1]) * k), c((1 - color[2]) * k)];
  }
  return [0, 0, 0];
}
export const hexColor = ([r, g, b]) => [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

export function nombreColor([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const v = max / 255, s = max ? d / max : 0;
  if (s < 0.14) return v < 0.2 ? "Negro" : v > 0.92 ? "Blanco" : "Gris";
  let h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 345) return "Rojo";
  if (h < 40) return v < 0.62 ? "Marron" : "Naranja";
  if (h < 70) return "Amarillo";
  if (h < 160) return "Verde";
  if (h < 200) return "Cian";
  if (h < 255) return "Azul";
  if (h < 290) return "Violeta";
  return "Magenta";
}

// ---- texto: algunos PDF de AutoCAD guardan el indice de glifo en lugar de la letra
let macRoman = null;
const decodificaGlifo = (g) => {
  if (g >= 3 && g <= 97) return String.fromCharCode(g + 29);
  if (g >= 98 && g <= 225) {
    macRoman = macRoman || new TextDecoder("macintosh");
    return macRoman.decode(Uint8Array.of(g + 30));
  }
  return "?";
};
const VOCALES = "aeiouáéíóúü";
export function textoLegible(unis, gids) {
  const crudo = unis.map((u) => (u > 31 && u !== 0xfffd ? String.fromCodePoint(u) : "�")).join("");
  const candidato = gids.map(decodificaGlifo).join("");
  if (/[\u0000-\u001f�]/.test(crudo)) return { texto: candidato, corregido: true };
  const letras = [...candidato].filter((ch) => ch.toLowerCase() !== ch.toUpperCase());
  const vocales = letras.filter((ch) => VOCALES.includes(ch.toLowerCase())).length;
  const sinVocales = ![...crudo].some((ch) => "aeiouáéíóú".includes(ch.toLowerCase()));
  if (sinVocales && letras.length && vocales / letras.length >= 0.3) return { texto: candidato, corregido: true };
  return { texto: crudo, corregido: false };
}

// ---- trazados: lista de subtrazados [{pts:[[x,y]...], cerrado}] ya en coordenadas de pagina
function subtrazados(path, ctm) {
  const [a, b, c, d, e, f] = ctm;
  const T = (x, y) => [a * x + c * y + e, b * x + d * y + f];
  const subs = [];
  let act = null;
  let inicio = null;
  const empuja = () => { if (act && act.pts.length > 1) subs.push(act); };
  path.walk({
    moveTo(x, y) { empuja(); inicio = T(x, y); act = { pts: [inicio], cerrado: false }; },
    lineTo(x, y) {
      if (!act || act.cerrado) { empuja(); act = { pts: [inicio || T(x, y)], cerrado: false }; }
      act.pts.push(T(x, y));
    },
    curveTo(x1, y1, x2, y2, x3, y3) {
      if (!act || act.cerrado) { empuja(); act = { pts: [inicio || T(x1, y1)], cerrado: false }; }
      const p0 = act.pts[act.pts.length - 1];
      const p1 = T(x1, y1), p2 = T(x2, y2), p3 = T(x3, y3);
      for (let i = 1; i <= BEZIER_PASOS; i++) {
        const t = i / BEZIER_PASOS, u = 1 - t;
        act.pts.push([
          u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ]);
      }
    },
    closePath() { if (act) act.cerrado = true; },
  });
  empuja();
  return subs;
}

const igual = (p, q) => Math.abs(p[0] - q[0]) < 1e-3 && Math.abs(p[1] - q[1]) < 1e-3;

// ---- circulos: poligono cerrado con todos sus vertices a la misma distancia del centro
export function ajustarCirculo(pts) {
  const n = pts.length;
  if (n < 12) return null;
  let cx = 0, cy = 0;
  for (const [x, y] of pts) { cx += x; cy += y; }
  cx /= n; cy /= n;
  let suma = 0, min = Infinity, max = 0;
  const radios = pts.map(([x, y]) => Math.hypot(x - cx, y - cy));
  for (const r of radios) { suma += r; if (r < min) min = r; if (r > max) max = r; }
  const radio = suma / n;
  if (radio < 0.05 || (max - min) / radio > 0.012) return null;
  // los vertices deben dar la vuelta completa en un solo sentido, sin saltos grandes
  let giro = 0, signo = 0, maxPaso = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.atan2(pts[i][1] - cy, pts[i][0] - cx), b = Math.atan2(pts[(i + 1) % n][1] - cy, pts[(i + 1) % n][0] - cx);
    let paso = b - a;
    while (paso > Math.PI) paso -= 2 * Math.PI;
    while (paso < -Math.PI) paso += 2 * Math.PI;
    if (!signo) signo = Math.sign(paso);
    if (Math.sign(paso) !== signo) return null;
    giro += Math.abs(paso); maxPaso = Math.max(maxPaso, Math.abs(paso));
  }
  if (Math.abs(giro - 2 * Math.PI) > 0.05 || maxPaso > Math.PI / 4) return null;
  return { cx, cy, radio };
}

// ---- union de segmentos: cadenas abiertas que comparten extremo (solo donde se encuentran exactamente dos)
const kp = (p) => Math.round(p[0] * 100) + "," + Math.round(p[1] * 100);
export function unirCadenas(cadenas) {
  const extremos = new Map();
  const anota = (k, i, e) => { const l = extremos.get(k); if (l) l.push({ i, e }); else extremos.set(k, [{ i, e }]); };
  cadenas.forEach((c, i) => { anota(kp(c[0]), i, 0); anota(kp(c[c.length - 1]), i, 1); });
  const usada = new Uint8Array(cadenas.length);
  const salida = [];
  for (let i = 0; i < cadenas.length; i++) {
    if (usada[i]) continue;
    usada[i] = 1;
    let cad = cadenas[i].slice();
    let cerrada = false;
    // crecer por el final y por el principio
    for (const alFinal of [true, false]) {
      for (;;) {
        const punta = alFinal ? cad[cad.length - 1] : cad[0];
        const l = extremos.get(kp(punta));
        if (!l || l.length !== 2) break;
        const otro = l.find((o) => !usada[o.i]);
        if (!otro) {
          if (alFinal && l.every((o) => o.i === i) && cad.length > 2) cerrada = true;
          break;
        }
        usada[otro.i] = 1;
        let seg = cadenas[otro.i];
        // el segmento debe empezar donde acaba (al final) o acabar donde empieza (al principio)
        const empiezaAqui = kp(seg[0]) === kp(punta);
        if (alFinal) { cad = cad.concat((empiezaAqui ? seg : seg.slice().reverse()).slice(1)); }
        else { cad = (empiezaAqui ? seg.slice().reverse() : seg).slice(0, -1).concat(cad); }
      }
    }
    if (!cerrada && cad.length > 2 && kp(cad[0]) === kp(cad[cad.length - 1])) { cad.pop(); cerrada = true; }
    salida.push({ pts: cad, cerrada });
  }
  return salida;
}

// ---- analisis rapido de una pagina: texto, imagenes, trazados, capas y colores
export function analizarPagina(mupdf, pagina) {
  const r = { textos: 0, imagenes: 0, trazados: 0 };
  const capas = {};
  const colores = new Map();
  const pila = [];
  const nota = (cs, color) => { const h = hexColor(aRgb(cs, color)); colores.set(h, (colores.get(h) || 0) + 1); };
  const cuentaCapa = () => { const n = pila.length ? nombreCapa(pila[pila.length - 1]) : ""; if (n) capas[n] = (capas[n] || 0) + 1; };
  const dev = new mupdf.Device({
    beginLayer(n) { pila.push(n); }, endLayer() { pila.pop(); },
    fillPath(p, eo, ctm, cs, color) { r.trazados++; cuentaCapa(); nota(cs, color); },
    strokePath(p, st, ctm, cs, color) { r.trazados++; cuentaCapa(); nota(cs, color); },
    fillText() { r.textos++; },
    fillImage() { r.imagenes++; },
    fillImageMask() { r.imagenes++; },
  });
  pagina.run(dev, mupdf.Matrix.identity);
  const [x0, y0, x1, y1] = pagina.getBounds();
  return {
    ancho_mm: Math.round((x1 - x0) * PT_MM),
    alto_mm: Math.round((y1 - y0) * PT_MM),
    textos: r.textos,
    trazados: r.trazados,
    escaneada: r.imagenes > 0 && r.trazados < 200,
    capas,
    colores: [...colores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

// ---- conversion de una pagina dentro de un Dxf (con desplazamiento para unir varias)
export function convertirPagina(mupdf, pagina, dxf, { dx = 0, dy = 0, opciones = {} } = {}) {
  const op = { ...OPCIONES_BASE, ...opciones };
  const f = op.factor;
  const [bx0, by0, bx1, by1] = pagina.getBounds();
  const altoPt = by1 - by0;
  const D = ([x, y]) => [(x - bx0) * PT_MM * f + dx, (altoPt - (y - by0)) * PT_MM * f + dy];
  const pila = [];
  const st = {
    capas: {}, info: {},
    conteo: { lineas: 0, polilineas: 0, circulos: 0, rellenos: 0, textos: 0, textos_corregidos: 0, rellenos_sin_area_omitidos: 0, duplicados: 0, unidos: 0 },
  };
  const cuenta = (nombre, color) => {
    st.capas[nombre] = (st.capas[nombre] || 0) + 1;
    if (!st.info[nombre]) st.info[nombre] = { n: 0, color };
    st.info[nombre].n++;
  };
  const capaDe = (tipo, rgb) => {
    switch (op.capas) {
      case "una": return "0";
      case "tipo": return tipo === "texto" ? "PDF_Textos" : tipo === "relleno" ? "PDF_Rellenos" : "PDF_Geometria";
      case "color": return `${nombreColor(rgb)} ${hexColor(rgb)}`;
      default: return tipo === "texto" ? CAPA_TEXTO : nombreCapa(pila.length ? pila[pila.length - 1] : "");
    }
  };
  // elementos que el usuario ha desmarcado: capas del PDF ("capa:NOMBRE") o colores ("color:RRGGBB")
  const excl = new Set(op.excluir || []);
  const excluida = (rgb) => excl.size > 0 && ((pila.length > 0 && excl.has("capa:" + nombreCapa(pila[pila.length - 1]))) || excl.has("color:" + hexColor(rgb)));
  const tiposDedup = op.tiposDuplicados || "LPHCT";
  const nueva = (firma) => (op.quitarDuplicados && tiposDedup.includes(firma[0]) ? (dxf.nueva(firma) ? true : (st.conteo.duplicados++, false)) : true);
  const f3 = (n) => Math.round(n * 1000);

  // segmentos abiertos pendientes de unir: clave capa|color|grosor -> {capa, rgb, grosor, cadenas[]}
  const cubos = new Map();
  // trazo discontinuo del PDF -> tipo de linea del DXF (patron en unidades del dibujo)
  const tipoDeTrazo = (stroke, escala) => {
    let d;
    try { d = stroke.getDashes(); } catch { return ""; }
    if (!d || !d.length) return "";
    if (d.length % 2) d = d.concat(d);
    const k = escala * PT_MM * f;
    const patron = d.map((v) => Math.max(0, v) * k);
    if (patron.every((v) => v <= 0) || patron.reduce((a, v) => a + v, 0) < 0.02 * f) return "";
    return dxf.tipoLinea(patron.map((v) => Math.max(v, 0.001)));
  };
  const emiteLinea = (capa, pts, rgb, grosor, tipo = "") => {
    const [a, b] = pts;
    const firma = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? `L|${capa}|${rgb}|${grosor}|${tipo}|${f3(a[0])},${f3(a[1])},${f3(b[0])},${f3(b[1])}` : `L|${capa}|${rgb}|${grosor}|${tipo}|${f3(b[0])},${f3(b[1])},${f3(a[0])},${f3(a[1])}`;
    if (!nueva(firma)) return;
    dxf.linea(capa, a[0], a[1], b[0], b[1], rgb, grosor, tipo);
    st.conteo.lineas++; cuenta(capa, rgb);
  };
  const emitePolilinea = (capa, pts, cerrada, rgb, grosor, tipo = "") => {
    if (nueva(`P|${capa}|${rgb}|${grosor}|${tipo}|${cerrada ? 1 : 0}|${pts.map((p) => f3(p[0]) + "," + f3(p[1])).join(";")}`)) {
      dxf.polilinea(capa, pts, cerrada, rgb, grosor, tipo);
      st.conteo.polilineas++; cuenta(capa, rgb);
    }
  };
  const emiteCadena = (capa, pts, cerrada, rgb, grosor, tipo = "") => {
    if (pts.length === 2 && !cerrada) emiteLinea(capa, pts, rgb, grosor, tipo);
    else emitePolilinea(capa, pts, cerrada, rgb, grosor, tipo);
  };
  const volcar = () => {
    for (const c of cubos.values()) {
      const unidas = unirCadenas(c.cadenas);
      st.conteo.unidos += c.cadenas.length - unidas.length;
      for (const u of unidas) emiteCadena(c.capa, u.pts, u.cerrada, c.rgb, c.grosor, c.tipo);
    }
    cubos.clear();
  };

  const dev = new mupdf.Device({
    beginLayer(nombre) { pila.push(nombre); },
    endLayer() { pila.pop(); },

    fillPath(path, evenOdd, ctm, cs, color) {
      if (!op.rellenos) return;
      const rgb = aRgb(cs, color);
      if (excluida(rgb)) return;
      if (op.quitarBlancos && rgb[0] > 250 && rgb[1] > 250 && rgb[2] > 250) return;
      const nombre = capaDe("relleno", rgb);
      const rutas = [];
      for (const s of subtrazados(path, ctm)) {
        const pts = s.pts.slice();
        if (pts.length > 1 && igual(pts[0], pts[pts.length - 1])) pts.pop();
        if (pts.length >= 3) rutas.push(pts.map(D));
      }
      if (!rutas.length) { st.conteo.rellenos_sin_area_omitidos++; return; }
      if (!nueva(`H|${nombre}|${rgb}|${rutas.map((r) => r.map((p) => f3(p[0]) + "," + f3(p[1])).join(";")).join("/")}`)) return;
      dxf.relleno(nombre, rutas, rgb);
      st.conteo.rellenos++; cuenta(nombre, rgb);
      // un relleno blanco tapa lo anterior: lo que se repita despues puede volver a verse, asi que no es un duplicado
      if (rgb[0] > 250 && rgb[1] > 250 && rgb[2] > 250) dxf.vistos.clear();
    },

    strokePath(path, stroke, ctm, cs, color) {
      const rgb = aRgb(cs, color);
      if (excluida(rgb)) return;
      const nombre = capaDe("geometria", rgb);
      const escala = Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]));
      const grosor = grosorDxf(stroke.getLineWidth() * escala);
      const tipo = op.discontinuas ? tipoDeTrazo(stroke, escala) : "";
      for (const s of subtrazados(path, ctm)) {
        let pts = s.pts.slice();
        let cerrado = s.cerrado;
        if (pts.length > 2 && igual(pts[0], pts[pts.length - 1])) { pts.pop(); cerrado = true; }
        if (pts.length < 2) continue;
        pts = pts.map(D);
        if (cerrado && op.circulos) {
          const c = ajustarCirculo(pts);
          if (c) {
            if (nueva(`C|${nombre}|${rgb}|${grosor}|${tipo}|${f3(c.cx)},${f3(c.cy)},${f3(c.radio)}`)) {
              dxf.circulo(nombre, c.cx, c.cy, c.radio, rgb, grosor, tipo);
              st.conteo.circulos++; cuenta(nombre, rgb);
            }
            continue;
          }
        }
        if (!cerrado && op.unirSegmentos) {
          const clave = `${nombre}|${rgb}|${grosor}|${tipo}`;
          let cubo = cubos.get(clave);
          if (!cubo) { cubo = { capa: nombre, rgb, grosor, tipo, cadenas: [] }; cubos.set(clave, cubo); }
          cubo.cadenas.push(pts);
        } else {
          emiteCadena(nombre, pts, cerrado, rgb, grosor, tipo);
        }
      }
    },

    fillText(text, ctm, cs, color) {
      if (!op.textos) return;
      const unis = [], gids = [];
      let primero = null;
      text.walk({ showGlyph(font, trm, gid, uni) { if (!primero) primero = trm; unis.push(uni); gids.push(gid); } });
      if (!primero || !gids.length) return;
      const { texto, corregido } = textoLegible(unis, gids);
      if (!texto.trim()) return;
      const [ta, tb, tc, td, te, tf] = primero;
      const [ca, cb, cc, cd, ce, cf] = ctm;
      // matriz del glifo en la pagina = trm x ctm
      const a = ta * ca + tb * cc, b = ta * cb + tb * cd;
      const c = tc * ca + td * cc, d = tc * cb + td * cd;
      const e = te * ca + tf * cc + ce, ff = te * cb + tf * cd + cf;
      const tamPt = Math.hypot(c, d);
      const angulo = (Math.atan2(-b, a) * 180) / Math.PI; // eje y invertido respecto al DXF
      const ancho = tamPt > 0 ? Math.max(0.2, Math.min(3, Math.hypot(a, b) / tamPt)) : 1; // compresion horizontal del texto
      const [x, y] = D([e, ff]);
      const rgb = aRgb(cs, color);
      if (excluida(rgb)) return;
      const nombre = capaDe("texto", rgb);
      if (!nueva(`T|${nombre}|${rgb}|${texto}|${f3(x)},${f3(y)}|${f3(angulo)}|${f3(tamPt * f)}|${f3(ancho)}`)) return;
      dxf.texto(nombre, texto, x, y, tamPt * PT_MM * 0.72 * f, angulo, ancho, rgb);
      st.conteo.textos++; cuenta(nombre, rgb);
      if (corregido) st.conteo.textos_corregidos++;
    },
  });
  pagina.run(dev, mupdf.Matrix.identity);
  volcar();
  return { ...st, ancho_mm: (bx1 - bx0) * PT_MM, alto_mm: altoPt * PT_MM };
}

export const columnasPorDefecto = (n) => Math.max(1, Math.min(n, n <= 16 ? 4 : 5));

export function posicionEnCuadricula(k, columnas, anchoCelda, altoCelda) {
  return { dx: (k % columnas) * anchoCelda, dy: -Math.floor(k / columnas) * altoCelda };
}
export { SEPARACION_MM, PT_MM, CAPA_TEXTO };
