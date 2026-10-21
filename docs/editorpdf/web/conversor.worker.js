// Trabajador en segundo plano: abre el PDF, dibuja miniaturas y convierte, sin bloquear la ventana.
import * as mupdf from "./vendor/mupdf/mupdf.js";
import { Dxf } from "./dxf.js";
import { analizarPagina, convertirPagina, columnasPorDefecto, posicionEnCuadricula, SEPARACION_MM } from "./conversor.js";

const LIMITE_ENTIDADES = 450000; // por archivo unido; pasado esto se parte en varios
let doc = null;
let cancelado = false;
const pausa = () => new Promise((r) => setTimeout(r, 0));
const liberar = (o) => { try { o.destroy(); } catch { /* ya liberado */ } };

async function abrir(buffer) {
  doc = mupdf.Document.openDocument(new Uint8Array(buffer), "application/pdf");
  if (doc.needsPassword && doc.needsPassword()) throw new Error("El PDF está protegido con contraseña; este conversor no puede abrirlo.");
  const n = doc.countPages();
  postMessage({ tipo: "abierto", paginas: n });
  for (let i = 0; i < n; i++) {
    const p = doc.loadPage(i);
    const info = analizarPagina(mupdf, p);
    liberar(p);
    postMessage({ tipo: "pagina", n: i + 1, info });
    await pausa();
  }
  postMessage({ tipo: "analizado" });
}

function miniatura(n, ancho, id) {
  const p = doc.loadPage(n - 1);
  const [x0, , x1] = p.getBounds();
  const z = ancho / (x1 - x0);
  const pix = p.toPixmap(mupdf.Matrix.scale(z, z), mupdf.ColorSpace.DeviceRGB, false, true);
  const png = pix.asPNG();
  liberar(pix);
  liberar(p);
  const copia = png.slice().buffer;
  postMessage({ tipo: "miniatura", n, id, png: copia }, [copia]);
}

async function convertir({ paginas, unir, columnas, etiquetar, base, reconocidas }) {
  cancelado = false;
  const infos = new Map();
  for (const n of paginas) {
    const p = doc.loadPage(n - 1);
    infos.set(n, analizarPagina(mupdf, p));
    liberar(p);
  }
  const utiles = paginas.filter((n) => !infos.get(n).escaneada);
  const omitidas = paginas.filter((n) => infos.get(n).escaneada);
  const cols = columnas || columnasPorDefecto(utiles.length);
  const celdaAncho = Math.max(...utiles.map((n) => infos.get(n).ancho_mm)) + SEPARACION_MM;
  const celdaAlto = Math.max(...utiles.map((n) => infos.get(n).alto_mm)) + SEPARACION_MM;

  const archivos = [];
  const resultados = [];
  let dxfUnido = null;
  let kParte = 0;
  const partesUnidas = [];

  for (let k = 0; k < utiles.length; k++) {
    if (cancelado) throw Object.assign(new Error("cancelado"), { cancelado: true });
    const n = utiles[k];
    postMessage({ tipo: "avance", texto: `Convirtiendo la página ${n} (${k + 1} de ${utiles.length})…`, fraccion: k / (utiles.length + 1) });
    await pausa();
    const p = doc.loadPage(n - 1);
    let r;
    if (unir) {
      if (!dxfUnido) dxfUnido = new Dxf();
      if (kParte && dxfUnido.entidades >= LIMITE_ENTIDADES) {
        partesUnidas.push(dxfUnido);
        dxfUnido = new Dxf();
        kParte = 0;
      }
      const { dx, dy } = posicionEnCuadricula(kParte, cols, celdaAncho, celdaAlto);
      r = convertirPagina(mupdf, p, dxfUnido, { dx, dy });
      if (etiquetar) dxfUnido.texto("Etiquetas_paginas", `Hoja ${n}`, dx, dy + r.alto_mm + 6, 6, 0, 1, [0, 0, 255]);
      r.parte = partesUnidas.length + 1;
      kParte++;
    } else {
      const dxf = new Dxf();
      r = convertirPagina(mupdf, p, dxf);
      archivos.push({ nombre: `${base}_p${n}.dxf`, blob: dxf.blob() });
      r.archivo = `${base}_p${n}.dxf`;
    }
    liberar(p);
    r.pagina = n;
    r.textosEnPdf = infos.get(n).textos;
    resultados.push(r);
  }
  if (unir && dxfUnido) {
    partesUnidas.push(dxfUnido);
    postMessage({ tipo: "avance", texto: "Guardando el archivo unido…", fraccion: utiles.length / (utiles.length + 1) });
    await pausa();
    const una = partesUnidas.length === 1;
    partesUnidas.forEach((d, i) => {
      const nombre = una ? `${base}_unido.dxf` : `${base}_unido_${i + 1}.dxf`;
      archivos.push({ nombre, blob: d.blob() });
      for (const r of resultados) if (r.parte === i + 1) r.archivo = nombre;
    });
  }
  postMessage({ tipo: "fin", archivos, resultados, omitidas, unido: unir, partes: partesUnidas.length, columnas: cols });
}

onmessage = async (ev) => {
  const m = ev.data;
  try {
    if (m.tipo === "abrir") await abrir(m.buffer);
    else if (m.tipo === "miniatura") miniatura(m.n, m.ancho, m.id);
    else if (m.tipo === "convertir") await convertir(m);
    else if (m.tipo === "cancelar") cancelado = true;
  } catch (e) {
    if (e.cancelado) postMessage({ tipo: "cancelado" });
    else postMessage({ tipo: "error", mensaje: String(e.message || e), donde: m.tipo });
  }
};
postMessage({ tipo: "listo" });
