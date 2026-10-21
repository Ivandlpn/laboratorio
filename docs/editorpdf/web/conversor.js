// Convierte paginas de un PDF vectorial en entidades DXF.
// Es la misma logica que el programa de Windows (pdf_a_dxf.py), escrita para el navegador.
// "mupdf" se recibe como parametro para que funcione igual en el navegador y en pruebas con Node.
const PT_MM = 25.4 / 72;
const CAPA_SIN_NOMBRE = "SIN_CAPA_PDF";
const CAPA_TEXTO = "Textos";
const GROSORES = [0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211];
const BEZIER_PASOS = 8;
const SEPARACION_MM = 60;

export const nombreCapa = (n) => {
  const limpio = String(n || "").replace(/[<>/\\":;?*|=`]/g, "_").trim();
  return limpio || CAPA_SIN_NOMBRE;
};

const grosorDxf = (anchoPt) => {
  const c = (anchoPt || 0) * PT_MM * 100;
  return GROSORES.reduce((mejor, g) => (Math.abs(g - c) < Math.abs(mejor - c) ? g : mejor), GROSORES[0]);
};

// ---- color: cualquier espacio de color -> [r, g, b] 0..255
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
  const empuja = () => {
    if (act && act.pts.length > 1) subs.push(act);
  };
  path.walk({
    moveTo(x, y) {
      empuja();
      inicio = T(x, y);
      act = { pts: [inicio], cerrado: false };
    },
    lineTo(x, y) {
      if (!act || act.cerrado) {
        empuja();
        act = { pts: [inicio || T(x, y)], cerrado: false };
      }
      act.pts.push(T(x, y));
    },
    curveTo(x1, y1, x2, y2, x3, y3) {
      if (!act || act.cerrado) {
        empuja();
        act = { pts: [inicio || T(x1, y1)], cerrado: false };
      }
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
    closePath() {
      if (act) act.cerrado = true;
    },
  });
  empuja();
  return subs;
}

const igual = (p, q) => Math.abs(p[0] - q[0]) < 1e-3 && Math.abs(p[1] - q[1]) < 1e-3;

// ---- analisis rapido de una pagina: texto, imagenes y trazados
export function analizarPagina(mupdf, pagina) {
  const r = { textos: 0, imagenes: 0, trazados: 0 };
  const dev = new mupdf.Device({
    fillPath() { r.trazados++; },
    strokePath() { r.trazados++; },
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
  };
}

// ---- conversion de una pagina dentro de un Dxf (con desplazamiento para unir varias)
export function convertirPagina(mupdf, pagina, dxf, { dx = 0, dy = 0 } = {}) {
  const [bx0, by0, bx1, by1] = pagina.getBounds();
  const altoPt = by1 - by0;
  const D = ([x, y]) => [(x - bx0) * PT_MM + dx, (altoPt - (y - by0)) * PT_MM + dy];
  const pila = [];
  const capa = () => nombreCapa(pila.length ? pila[pila.length - 1] : "");
  const st = { capas: {}, conteo: { lineas: 0, polilineas: 0, rellenos: 0, textos: 0, textos_corregidos: 0, rellenos_sin_area_omitidos: 0 } };
  const cuenta = (nombre) => { st.capas[nombre] = (st.capas[nombre] || 0) + 1; };

  const dev = new mupdf.Device({
    beginLayer(nombre) { pila.push(nombre); },
    endLayer() { pila.pop(); },

    fillPath(path, evenOdd, ctm, cs, color) {
      const nombre = capa();
      cuenta(nombre);
      const rutas = [];
      for (const s of subtrazados(path, ctm)) {
        const pts = s.pts.slice();
        if (pts.length > 1 && igual(pts[0], pts[pts.length - 1])) pts.pop();
        if (pts.length >= 3) rutas.push(pts.map(D));
      }
      if (!rutas.length) { st.conteo.rellenos_sin_area_omitidos++; return; }
      dxf.relleno(nombre, rutas, aRgb(cs, color));
      st.conteo.rellenos++;
    },

    strokePath(path, stroke, ctm, cs, color) {
      const nombre = capa();
      cuenta(nombre);
      const escala = Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]));
      const grosor = grosorDxf(stroke.getLineWidth() * escala);
      const rgb = aRgb(cs, color);
      for (const s of subtrazados(path, ctm)) {
        let pts = s.pts.slice();
        let cerrado = s.cerrado;
        if (pts.length > 2 && igual(pts[0], pts[pts.length - 1])) { pts.pop(); cerrado = true; }
        if (pts.length < 2) continue;
        pts = pts.map(D);
        if (pts.length === 2 && !cerrado) {
          dxf.linea(nombre, pts[0][0], pts[0][1], pts[1][0], pts[1][1], rgb, grosor);
          st.conteo.lineas++;
        } else {
          dxf.polilinea(nombre, pts, cerrado, rgb, grosor);
          st.conteo.polilineas++;
        }
      }
    },

    fillText(text, ctm, cs, color) {
      const unis = [], gids = [];
      let primero = null;
      text.walk({
        showGlyph(font, trm, gid, uni) {
          if (!primero) primero = trm;
          unis.push(uni);
          gids.push(gid);
        },
      });
      if (!primero || !gids.length) return;
      const { texto, corregido } = textoLegible(unis, gids);
      if (!texto.trim()) return;
      const [ta, tb, tc, td, te, tf] = primero;
      const [ca, cb, cc, cd, ce, cf] = ctm;
      // matriz del glifo en la pagina = trm x ctm
      const a = ta * ca + tb * cc, b = ta * cb + tb * cd;
      const c = tc * ca + td * cc, d = tc * cb + td * cd;
      const e = te * ca + tf * cc + ce, f = te * cb + tf * cd + cf;
      const tamPt = Math.hypot(c, d);
      const angulo = (Math.atan2(-b, a) * 180) / Math.PI; // eje y invertido respecto al DXF
      const [x, y] = D([e, f]);
      dxf.texto(CAPA_TEXTO, texto, x, y, tamPt * PT_MM * 0.72, angulo, 1, aRgb(cs, color));
      st.conteo.textos++;
      if (corregido) st.conteo.textos_corregidos++;
    },
  });
  pagina.run(dev, mupdf.Matrix.identity);
  return { ...st, ancho_mm: (bx1 - bx0) * PT_MM, alto_mm: altoPt * PT_MM };
}

export const columnasPorDefecto = (n) => Math.max(1, Math.min(n, n <= 16 ? 4 : 5));

export function posicionEnCuadricula(k, columnas, anchoCelda, altoCelda) {
  return { dx: (k % columnas) * anchoCelda, dy: -Math.floor(k / columnas) * altoCelda };
}
export { SEPARACION_MM, PT_MM, CAPA_TEXTO };
