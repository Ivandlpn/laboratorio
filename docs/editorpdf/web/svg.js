// Escritor de SVG con la misma interfaz que Dxf: el motor de conversion no distingue entre uno y otro.
// El dibujo se agrupa por capas (<g> que Inkscape reconoce como capas). Cuatro unidades de dibujo = las del DXF.
const num = (v) => (Math.round(v * 1000) / 1000).toString();
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;
const UNIDAD = { 4: "mm", 5: "cm", 6: "m" };
const POR_MM = { 4: 1, 5: 10, 6: 1000 }; // mm por unidad de dibujo

export class Svg {
  constructor({ unidades = 4 } = {}) {
    this.unidades = unidades;
    this.vistos = new Set();
    this.capas = new Map(); // nombre -> trozos
    this.tiposLinea = new Map();
    this.entidades = 0;
    this.min = [Infinity, Infinity];
    this.max = [-Infinity, -Infinity];
  }

  nueva(firma) {
    if (this.vistos.has(firma)) return false;
    this.vistos.add(firma);
    return true;
  }

  capa(nombre) {
    if (!this.capas.has(nombre)) this.capas.set(nombre, []);
    return nombre;
  }

  tipoLinea(patron) {
    const clave = patron.map((v) => num(v)).join(",");
    if (!this.tiposLinea.has(clave)) this.tiposLinea.set(clave, clave);
    return clave;
  }

  _punto(x, y) {
    if (x < this.min[0]) this.min[0] = x;
    if (x > this.max[0]) this.max[0] = x;
    if (-y < this.min[1]) this.min[1] = -y;
    if (-y > this.max[1]) this.max[1] = -y;
  }

  _estilo(color, grosor, tipo) {
    const sw = Math.max(grosor / 100, 0.05) / POR_MM[this.unidades];
    return `fill="none" stroke="${rgb(color)}" stroke-width="${num(sw)}" stroke-linecap="butt"${tipo ? ` stroke-dasharray="${tipo}"` : ""}`;
  }

  _añade(capa, trozo) {
    this.entidades++;
    this.capas.get(this.capa(capa)).push(trozo);
  }

  linea(capa, x1, y1, x2, y2, color, grosor, tipo = "") {
    this._punto(x1, y1); this._punto(x2, y2);
    this._añade(capa, `<line x1="${num(x1)}" y1="${num(-y1)}" x2="${num(x2)}" y2="${num(-y2)}" ${this._estilo(color, grosor, tipo)}/>`);
  }

  circulo(capa, cx, cy, radio, color, grosor, tipo = "") {
    this._punto(cx - radio, cy - radio); this._punto(cx + radio, cy + radio);
    this._añade(capa, `<circle cx="${num(cx)}" cy="${num(-cy)}" r="${num(radio)}" ${this._estilo(color, grosor, tipo)}/>`);
  }

  polilinea(capa, puntos, cerrada, color, grosor, tipo = "") {
    for (const [x, y] of puntos) this._punto(x, y);
    const d = puntos.map(([x, y], i) => `${i ? "L" : "M"}${num(x)} ${num(-y)}`).join("") + (cerrada ? "Z" : "");
    this._añade(capa, `<path d="${d}" ${this._estilo(color, grosor, tipo)}/>`);
  }

  relleno(capa, rutas, color) {
    let d = "";
    for (const ruta of rutas) {
      for (const [x, y] of ruta) this._punto(x, y);
      d += ruta.map(([x, y], i) => `${i ? "L" : "M"}${num(x)} ${num(-y)}`).join("") + "Z";
    }
    this._añade(capa, `<path d="${d}" fill="${rgb(color)}" fill-rule="evenodd" stroke="none"/>`);
  }

  texto(capa, contenido, x, y, alto, rotacion, ancho, color) {
    this._punto(x, y); this._punto(x + alto * String(contenido).length * 0.6 * ancho, y + alto);
    const giro = rotacion ? ` rotate(${num(-rotacion)})` : "";
    const esc_ = ancho !== 1 ? ` scale(${num(ancho)} 1)` : "";
    this._añade(capa, `<text transform="translate(${num(x)} ${num(-y)})${giro}${esc_}" font-family="Arial, Helvetica, sans-serif" font-size="${num(alto / 0.72)}" fill="${rgb(color)}" xml:space="preserve">${esc(String(contenido).replace(/[\r\n]+/g, " "))}</text>`);
  }

  partes() {
    const ok = Number.isFinite(this.min[0]);
    const m = ok ? Math.max(this.max[0] - this.min[0], this.max[1] - this.min[1]) * 0.01 : 0;
    const [x0, y0] = ok ? [this.min[0] - m, this.min[1] - m] : [0, 0];
    const an = ok ? this.max[0] - this.min[0] + 2 * m : 100, al = ok ? this.max[1] - this.min[1] + 2 * m : 100;
    const u = UNIDAD[this.unidades];
    const partes = [
      `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${num(an)}${u}" height="${num(al)}${u}" viewBox="${num(x0)} ${num(y0)} ${num(an)} ${num(al)}">\n`,
    ];
    for (const [nombre, trozos] of this.capas) {
      if (!trozos.length) continue;
      partes.push(`<g inkscape:groupmode="layer" inkscape:label="${esc(nombre)}" id="${esc("capa_" + nombre.replace(/[^\w-]+/g, "_"))}">\n`, trozos.join("\n"), "\n</g>\n");
    }
    partes.push("</svg>\n");
    return partes;
  }

  blob() {
    return new Blob(this.partes(), { type: "image/svg+xml" });
  }
}
