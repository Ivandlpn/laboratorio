// Crea un .zip (sin compresion, "store") a partir de varios Blob. Sin dependencias.
const TABLA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLA[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function fechaDos(d) {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return [hora, dia];
}

export async function crearZip(archivos) {
  const codif = new TextEncoder();
  const [hora, dia] = fechaDos(new Date());
  const partes = [];
  const central = [];
  let desplazamiento = 0;
  for (const { nombre, blob } of archivos) {
    const datos = new Uint8Array(await blob.arrayBuffer());
    const nom = codif.encode(nombre);
    const crc = crc32(datos);
    const cab = new DataView(new ArrayBuffer(30));
    cab.setUint32(0, 0x04034b50, true);
    cab.setUint16(4, 20, true);
    cab.setUint16(6, 0x0800, true); // nombres en UTF-8
    cab.setUint16(8, 0, true); // sin compresion
    cab.setUint16(10, hora, true);
    cab.setUint16(12, dia, true);
    cab.setUint32(14, crc, true);
    cab.setUint32(18, datos.length, true);
    cab.setUint32(22, datos.length, true);
    cab.setUint16(26, nom.length, true);
    cab.setUint16(28, 0, true);
    partes.push(cab.buffer, nom, datos);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, hora, true);
    cen.setUint16(14, dia, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, datos.length, true);
    cen.setUint32(24, datos.length, true);
    cen.setUint16(28, nom.length, true);
    cen.setUint32(42, desplazamiento, true);
    central.push(cen.buffer, nom);
    desplazamiento += 30 + nom.length + datos.length;
  }
  const tamCentral = central.reduce((s, p) => s + (p.byteLength ?? p.length), 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamCentral, true);
  fin.setUint32(16, desplazamiento, true);
  return new Blob([...partes, ...central, fin.buffer], { type: "application/zip" });
}
