// Escritor de DXF (R2004, color RGB) sin dependencias.
// La cabecera, las tablas y los objetos vienen de una plantilla generada con ezdxf (dxf_plantilla.js);
// aqui solo se escriben las capas y las entidades (LINE, LWPOLYLINE, HATCH, TEXT).
import { MODEL_OWNER, ANTES, DESPUES, SUFIJO } from "./dxf_plantilla.js";

const num = (v) => {
  const s = (Math.round(v * 1000) / 1000).toString();
  return s.includes(".") || s.includes("e") ? s : s + ".0";
};
const hex = (n) => n.toString(16).toUpperCase();
const rgbInt = (r, g, b) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);

export class Dxf {
  constructor() {
    this.capas = new Map(); // nombre -> handle
    this.siguienteCapa = 0x10000;
    this.siguienteEntidad = 0x100000;
    this.trozos = [];
    this.entidades = 0;
  }

  capa(nombre) {
    if (!this.capas.has(nombre)) this.capas.set(nombre, hex(this.siguienteCapa++));
    return nombre;
  }

  _cabecera(tipo, capa, extra = "") {
    this.entidades++;
    return `  0\n${tipo}\n  5\n${hex(this.siguienteEntidad++)}\n330\n${MODEL_OWNER}\n100\nAcDbEntity\n  8\n${this.capa(capa)}\n${extra}`;
  }

  linea(capa, x1, y1, x2, y2, color, grosor) {
    this.trozos.push(
      this._cabecera("LINE", capa, `370\n${grosor}\n420\n${rgbInt(...color)}\n`) +
        `100\nAcDbLine\n 10\n${num(x1)}\n 20\n${num(y1)}\n 30\n0.0\n 11\n${num(x2)}\n 21\n${num(y2)}\n 31\n0.0\n`
    );
  }

  polilinea(capa, puntos, cerrada, color, grosor) {
    let s = this._cabecera("LWPOLYLINE", capa, `370\n${grosor}\n420\n${rgbInt(...color)}\n`);
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
    return [
      ANTES.replace("@@SEMILLA@@", semilla),
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
