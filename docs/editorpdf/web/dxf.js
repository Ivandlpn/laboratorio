// Escritor de DXF (R2004, color RGB) sin dependencias.
// La cabecera, las tablas y los objetos vienen de una plantilla generada con ezdxf (dxf_plantilla.js);
// aqui solo se escriben las capas y las entidades (LINE, LWPOLYLINE, HATCH, TEXT).
import { MODEL_OWNER, ANTES, DESPUES, SUFIJO } from "./dxf_plantilla.js";

const num = (v) => {
  const s = (Math.round(v * 1000) / 1000).toString();
  return s.includes(".") || s.includes("e") ? s : s + ".0";
};
const hex = (n) => n.toString(16).toUpperCase();
const lt = (t) => (t ? `  6\n${t}\n` : "");
const rgbInt = (r, g, b) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);

export class Dxf {
  // unidades: codigo $INSUNITS de AutoCAD (4 = mm, 5 = cm, 6 = m)
  constructor({ unidades = 4 } = {}) {
    this.unidades = unidades;
    this.tiposLinea = new Map(); // patron -> {nombre, patron, handle}
    this.vistos = new Set(); // firmas de entidades ya escritas (para quitar duplicados)
    this.capas = new Map(); // nombre -> handle
    this.siguienteCapa = 0x10000;
    this.siguienteEntidad = 0x100000;
    this.trozos = [];
    this.entidades = 0;
  }

  // Tipo de linea discontinuo: patron = [trazo, hueco, trazo, hueco...] en unidades del dibujo. Devuelve su nombre.
  tipoLinea(patron) {
    const clave = patron.map((v) => Math.round(v * 1000) / 1000).join(",");
    if (!this.tiposLinea.has(clave)) this.tiposLinea.set(clave, { nombre: `PDF_DISCONTINUA_${this.tiposLinea.size + 1}`, patron, handle: hex(0x30000 + this.tiposLinea.size) });
    return this.tiposLinea.get(clave).nombre;
  }

  _tiposLineaDxf() {
    let s = "";
    for (const { nombre, patron, handle } of this.tiposLinea.values()) {
      const total = patron.reduce((a, v) => a + v, 0);
      s += `  0\nLTYPE\n  5\n${handle}\n330\n2\n100\nAcDbSymbolTableRecord\n100\nAcDbLinetypeTableRecord\n  2\n${nombre}\n 70\n0\n  3\nTrazo discontinuo del PDF\n 72\n65\n 73\n${patron.length}\n 40\n${num(total)}\n`;
      patron.forEach((v, i) => { s += ` 49\n${num(i % 2 ? -v : v)}\n 74\n0\n`; });
    }
    return s;
  }

  // true la primera vez que se ve una firma; false si ya existia (entidad duplicada)
  nueva(firma) {
    if (this.vistos.has(firma)) return false;
    this.vistos.add(firma);
    return true;
  }

  capa(nombre) {
    if (!this.capas.has(nombre)) this.capas.set(nombre, hex(this.siguienteCapa++));
    return nombre;
  }

  _cabecera(tipo, capa, extra = "") {
    this.entidades++;
    return `  0\n${tipo}\n  5\n${hex(this.siguienteEntidad++)}\n330\n${MODEL_OWNER}\n100\nAcDbEntity\n  8\n${this.capa(capa)}\n${extra}`;
  }

  linea(capa, x1, y1, x2, y2, color, grosor, tipo = "") {
    this.trozos.push(
      this._cabecera("LINE", capa, `${lt(tipo)}370\n${grosor}\n420\n${rgbInt(...color)}\n`) +
        `100\nAcDbLine\n 10\n${num(x1)}\n 20\n${num(y1)}\n 30\n0.0\n 11\n${num(x2)}\n 21\n${num(y2)}\n 31\n0.0\n`
    );
  }

  circulo(capa, cx, cy, radio, color, grosor, tipo = "") {
    this.trozos.push(
      this._cabecera("CIRCLE", capa, `${lt(tipo)}370
${grosor}
420
${rgbInt(...color)}
`) +
        `100
AcDbCircle
 10
${num(cx)}
 20
${num(cy)}
 30
0.0
 40
${num(radio)}
`
    );
  }

  polilinea(capa, puntos, cerrada, color, grosor, tipo = "") {
    let s = this._cabecera("LWPOLYLINE", capa, `${lt(tipo)}370\n${grosor}\n420\n${rgbInt(...color)}\n`);
    s += `100\nAcDbPolyline\n 90\n${puntos.length}\n 70\n${cerrada ? 1 : 0}\n`;
    for (const [x, y] of puntos) s += ` 10\n${num(x)}\n 20\n${num(y)}\n`;
    this.trozos.push(s);
  }

  // rutas: lista de listas de puntos [x, y] (cada una cerrada)
  relleno(capa, rutas, color) {
    const [r, g, b] = color;
    let s = this._cabecera("HATCH", capa, ` 62\n7\n420\n${rgbInt(r, g, b)}\n`);
    s += `100\nAcDbHatch\n 10\n0.0\n 20\n0.0\n 30\n0.0\n210\n0.0\n220\n0.0\n230\n1.0\n  2\nSOLID\n 70\n1\n 71\n0\n 91\n${rutas.length}\n`;
    for (const ruta of rutas) {
      s += ` 92\n3\n 72\n0\n 73\n1\n 93\n${ruta.length}\n`;
      for (const [x, y] of ruta) s += ` 10\n${num(x)}\n 20\n${num(y)}\n`;
      s += ` 97\n0\n`;
    }
    s += ` 75\n1\n 76\n1\n 98\n0\n`;
    this.trozos.push(s);
  }

  texto(capa, contenido, x, y, alto, rotacion, ancho, color) {
    const limpio = String(contenido).replace(/[\r\n]+/g, " ");
    this.trozos.push(
      this._cabecera("TEXT", capa, `420\n${rgbInt(...color)}\n`) +
        `100\nAcDbText\n 10\n${num(x)}\n 20\n${num(y)}\n 30\n0.0\n 40\n${num(alto)}\n  1\n${limpio}\n 50\n${num(rotacion)}\n 41\n${num(ancho)}\n100\nAcDbText\n`
    );
  }

  _tablaCapas() {
    const nombres = ["0", "Defpoints", ...[...this.capas.keys()].filter((n) => n !== "0" && n !== "Defpoints")];
    let s = `  0\nTABLE\n  2\nLAYER\n  5\n1\n330\n0\n100\nAcDbSymbolTable\n 70\n${nombres.length}\n`;
    const registro = (nombre, handle, extra = "") =>
      `  0\nLAYER\n  5\n${handle}\n330\n1\n100\nAcDbSymbolTableRecord\n100\nAcDbLayerTableRecord\n  2\n${nombre}\n 70\n0\n 62\n7\n  6\nContinuous\n${extra}370\n-3\n390\n13\n`;
    s += registro("0", "27");
    s += registro("Defpoints", "28", "290\n0\n");
    for (const n of nombres.slice(2)) s += registro(n, this.capas.get(n));
    return s + "  0\nENDTAB\n";
  }

  // Devuelve las partes del archivo (cadenas); sirven directamente para new Blob(partes)
  partes() {
    const semilla = hex(this.siguienteEntidad + 0x1000);
    let antes = ANTES.replace("@@SEMILLA@@", semilla).replace("$INSUNITS\n 70\n4\n", `$INSUNITS\n 70\n${this.unidades}\n`);
    if (this.tiposLinea.size) {
      // anade los tipos de linea discontinuos al final de la tabla LTYPE y corrige su contador
      const cab = "TABLE\n  2\nLTYPE\n  5\n2\n330\n0\n100\nAcDbSymbolTable\n 70\n3\n";
      const i = antes.indexOf(cab), fin = antes.indexOf("  0\nENDTAB\n", i);
      antes = antes.slice(0, i) + cab.replace(" 70\n3\n", ` 70\n${3 + this.tiposLinea.size}\n`) + antes.slice(i + cab.length, fin) + this._tiposLineaDxf() + antes.slice(fin);
    }
    return [
      antes,
      this._tablaCapas(),
      DESPUES,
      "  0\nSECTION\n  2\nENTITIES\n",
      ...this.trozos,
      "  0\nENDSEC\n",
      SUFIJO,
    ];
  }

  blob() {
    return new Blob(this.partes(), { type: "application/dxf" });
  }
}
