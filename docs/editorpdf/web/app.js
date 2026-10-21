// Interfaz del conversor PDF a DXF. Todo ocurre en el navegador: el PDF no se sube a ningun servidor.
import { crearZip } from "./zip.js";

const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...hijos) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...hijos);
  return n;
};
const mb = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");

// ---- ajustes recordados (solo en este navegador)
const CLAVE = "editorpdf.ajustes.v1";
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; } };
const guardar = (o) => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch { /* sin almacenamiento */ } };

// ---- estado
const estado = { archivo: null, paginas: [], seleccion: new Set(), minis: new Map(), vistas: new Map(), colaMinis: [], pidiendoMini: false, trabajando: false, vistaActual: null, resultado: null };
let worker = null;

const compatible = typeof Worker !== "undefined" && typeof WebAssembly !== "undefined";

// ---- elementos
const zona = $("#zona"), entrada = $("#archivo"), nombreArchivo = $("#nombre-archivo");
const pasoPaginas = $("#paso-paginas"), pasoOpciones = $("#paso-opciones"), pasoConvertir = $("#paso-convertir");
const rejilla = $("#rejilla"), contador = $("#contador"), rangoTxt = $("#rango"), papel = $("#papel"), tituloVista = $("#titulo-vista");
const modoUnir = $("#modo-unir"), subUnir = $("#sub-unir"), columnasSel = $("#columnas"), etiquetar = $("#etiquetar");
const botonConvertir = $("#convertir"), botonCancelar = $("#cancelar"), barra = $("#barra > i"), estadoTxt = $("#estado"), resultado = $("#resultado");

// ---- trabajador
let trabajadorListo = false;
let pendientes = [];
function nuevoTrabajador() {
  if (worker) worker.terminate();
  trabajadorListo = false;
  pendientes = [];
  worker = new Worker(new URL("./conversor.worker.js", import.meta.url), { type: "module" });
  worker.onmessage = (ev) => alMensaje(ev.data);
  worker.onerror = (e) => mostrarError("No se pudo cargar el motor de conversión: " + (e.message || "error desconocido"));
}
// El motor tarda un momento en arrancar: lo que se envie antes de que avise «listo» se guarda en cola.
function enviar(mensaje, transferibles = []) {
  if (trabajadorListo) worker.postMessage(mensaje, transferibles);
  else pendientes.push([mensaje, transferibles]);
}

function alMensaje(m) {
  switch (m.tipo) {
    case "listo": trabajadorListo = true; for (const [msg, tr] of pendientes) worker.postMessage(msg, tr); pendientes = []; return;
    case "abierto": return crearTarjetas(m.paginas);
    case "pagina": return actualizarTarjeta(m.n, m.info);
    case "analizado": return arrancarMiniaturas();
    case "miniatura": return recibirMiniatura(m);
    case "avance": estadoTxt.textContent = m.texto; barra.style.width = Math.round(m.fraccion * 100) + "%"; return;
    case "fin": return mostrarResultado(m);
    case "cancelado": terminarTrabajo(); estadoTxt.textContent = "Conversión cancelada. No se creó ningún archivo."; barra.style.width = "0"; return;
    case "error": return mostrarError(m.mensaje);
  }
}

function mostrarError(texto) {
  terminarTrabajo();
  estadoTxt.textContent = "";
  resultado.replaceChildren(el("div", { className: "cartel mal" }, el("strong", { textContent: "No se pudo completar" }), el("span", { textContent: texto })));
}

// ---- elegir el PDF
zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("sobre"); });
zona.addEventListener("dragleave", () => zona.classList.remove("sobre"));
zona.addEventListener("drop", (e) => {
  e.preventDefault();
  zona.classList.remove("sobre");
  const f = [...e.dataTransfer.files].find((x) => /\.pdf$/i.test(x.name) || x.type === "application/pdf");
  if (f) cargar(f); else alert("Ese archivo no es un PDF.");
});
entrada.addEventListener("change", () => { if (entrada.files[0]) cargar(entrada.files[0]); });
$("#ejemplo").addEventListener("click", async () => {
  try {
    const r = await fetch(new URL("./ejemplo.pdf", import.meta.url));
    cargar(new File([await r.blob()], "plano_de_ejemplo.pdf", { type: "application/pdf" }));
  } catch { alert("No se pudo cargar el plano de ejemplo."); }
});

async function cargar(archivo) {
  if (!compatible) return;
  estado.archivo = archivo;
  estado.paginas = [];
  estado.seleccion = new Set();
  for (const u of estado.minis.values()) URL.revokeObjectURL(u);
  for (const u of estado.vistas.values()) URL.revokeObjectURL(u);
  estado.minis = new Map(); estado.vistas = new Map(); estado.colaMinis = []; estado.pidiendoMini = false; estado.vistaActual = null;
  nombreArchivo.textContent = `${archivo.name} · ${mb(archivo.size)} · abriendo…`;
  rejilla.replaceChildren();
  resultado.replaceChildren();
  barra.style.width = "0"; estadoTxt.textContent = "";
  papel.replaceChildren("Aquí verás la página que señales con el ratón.");
  for (const p of [pasoPaginas, pasoOpciones, pasoConvertir]) p.hidden = false;
  botonConvertir.disabled = true;
  nuevoTrabajador();
  const buffer = await archivo.arrayBuffer();
  enviar({ tipo: "abrir", buffer }, [buffer]);
}

// ---- tarjetas de pagina
function crearTarjetas(n) {
  nombreArchivo.textContent = `${estado.archivo.name} · ${mb(estado.archivo.size)} · ${n} página(s)`;
  for (let i = 1; i <= n; i++) {
    const b = el("button", { type: "button", className: "tarjeta-pagina", id: "pg" + i, disabled: true, ariaPressed: "false" });
    b.append(el("div", { className: "mini" }, el("div", { className: "cargando" })), el("div", { className: "pie" }, el("i", { className: "punto" }), el("b", { textContent: "Pág. " + i }), el("small", { textContent: "…" })));
    b.addEventListener("click", () => { alternar(i); mostrarVista(i); });
    b.addEventListener("mouseenter", () => vistaConRetraso(i));
    b.addEventListener("focus", () => vistaConRetraso(i));
    rejilla.append(b);
  }
  estado.paginas = Array.from({ length: n }, (_, k) => ({ n: k + 1, info: null }));
  actualizarContador();
}

function actualizarTarjeta(n, info) {
  estado.paginas[n - 1].info = info;
  const b = $("#pg" + n);
  const punto = b.querySelector(".punto"), nota = b.querySelector("small");
  if (info.escaneada) { punto.className = "punto mal"; nota.textContent = "escaneada"; b.title = "Es una imagen escaneada: no se puede convertir."; }
  else { b.disabled = false; estado.seleccion.add(n); punto.className = "punto " + (info.textos ? "ok" : "aviso"); nota.textContent = info.textos ? "con texto" : "letras dibujadas"; }
  marcarTarjeta(n);
  actualizarContador();
}

function marcarTarjeta(n) {
  const b = $("#pg" + n);
  const m = estado.seleccion.has(n);
  b.classList.toggle("marcada", m);
  b.setAttribute("aria-pressed", String(m));
}
function alternar(n) {
  const info = estado.paginas[n - 1].info;
  if (!info || info.escaneada || estado.trabajando) return;
  estado.seleccion.has(n) ? estado.seleccion.delete(n) : estado.seleccion.add(n);
  marcarTarjeta(n); actualizarContador();
}
function actualizarContador() {
  const total = estado.paginas.length;
  contador.textContent = `${estado.seleccion.size} de ${total} seleccionadas`;
  botonConvertir.disabled = estado.trabajando || estado.seleccion.size === 0;
}
$("#todas").addEventListener("click", () => { estado.paginas.forEach((p) => { if (p.info && !p.info.escaneada) estado.seleccion.add(p.n); marcarTarjeta(p.n); }); actualizarContador(); });
$("#ninguna").addEventListener("click", () => { estado.seleccion.clear(); estado.paginas.forEach((p) => marcarTarjeta(p.n)); actualizarContador(); });

function interpretarRango(texto, maximo) {
  const res = new Set();
  for (const t of texto.trim().split(/[,;\s]+/).filter(Boolean)) {
    const m = t.match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
    if (!m) throw new Error(`No entiendo «${t}»`);
    let a = +m[1], b = +(m[2] || m[1]);
    if (a > b) [a, b] = [b, a];
    if (a < 1 || b > maximo) throw new Error(`El PDF tiene ${maximo} páginas; «${t}» se sale`);
    for (let i = a; i <= b; i++) res.add(i);
  }
  if (!res.size) throw new Error("Escribe un rango, por ejemplo 1-3, 8");
  return res;
}
function aplicarRango() {
  try {
    const r = interpretarRango(rangoTxt.value, estado.paginas.length);
    estado.seleccion.clear();
    estado.paginas.forEach((p) => { if (r.has(p.n) && p.info && !p.info.escaneada) estado.seleccion.add(p.n); marcarTarjeta(p.n); });
    actualizarContador();
  } catch (e) { alert(e.message); }
}
$("#aplicar-rango").addEventListener("click", aplicarRango);
rangoTxt.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); aplicarRango(); } });

// ---- miniaturas y vista previa (se piden de una en una para no atascar al trabajador)
function arrancarMiniaturas() {
  estado.colaMinis = estado.paginas.map((p) => p.n);
  siguienteMini();
}
function siguienteMini() {
  if (estado.pidiendoMini || !estado.colaMinis.length || !worker) return;
  const n = estado.colaMinis.shift();
  estado.pidiendoMini = true;
  enviar({ tipo: "miniatura", n, ancho: 220, id: "t" + n });
}
function recibirMiniatura(m) {
  const url = URL.createObjectURL(new Blob([m.png], { type: "image/png" }));
  if (m.id[0] === "t") {
    estado.pidiendoMini = false;
    estado.minis.set(m.n, url);
    const caja = $("#pg" + m.n)?.querySelector(".mini");
    if (caja) caja.replaceChildren(el("img", { src: url, alt: "Miniatura de la página " + m.n }));
    siguienteMini();
  } else {
    estado.vistas.set(m.n, url);
    if (estado.vistaActual === m.n) ponerVista(url, m.n);
  }
}
let citaVista = null;
function vistaConRetraso(n) { clearTimeout(citaVista); citaVista = setTimeout(() => mostrarVista(n), 220); }
function mostrarVista(n) {
  estado.vistaActual = n;
  tituloVista.textContent = `Página ${n} de ${estado.paginas.length}`;
  if (estado.vistas.has(n)) return ponerVista(estado.vistas.get(n), n);
  papel.replaceChildren("Dibujando la página…");
  enviar({ tipo: "miniatura", n, ancho: 700, id: "p" + n });
}
function ponerVista(url, n) { papel.replaceChildren(el("img", { src: url, alt: "Vista previa de la página " + n })); }

// ---- opciones
function ajustes() {
  const a = leer();
  if (a.unir) modoUnir.checked = true;
  if (a.columnas) columnasSel.value = a.columnas;
  if (a.etiquetar === false) etiquetar.checked = false;
  subUnir.hidden = !modoUnir.checked;
}
function guardarAjustes() { guardar({ unir: modoUnir.checked, columnas: columnasSel.value, etiquetar: etiquetar.checked }); }
document.querySelectorAll('input[name="modo"]').forEach((r) => r.addEventListener("change", () => { subUnir.hidden = !modoUnir.checked; guardarAjustes(); }));
columnasSel.addEventListener("change", guardarAjustes);
etiquetar.addEventListener("change", guardarAjustes);

// ---- convertir
botonConvertir.addEventListener("click", () => {
  if (estado.trabajando || !estado.seleccion.size) return;
  estado.trabajando = true;
  botonConvertir.disabled = true;
  botonCancelar.hidden = false; botonCancelar.disabled = false;
  resultado.replaceChildren();
  barra.style.width = "0";
  estadoTxt.textContent = "Preparando…";
  const base = estado.archivo.name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "_");
  enviar({
    tipo: "convertir", paginas: [...estado.seleccion].sort((a, b) => a - b), unir: modoUnir.checked,
    columnas: columnasSel.value === "auto" ? null : Number(columnasSel.value), etiquetar: etiquetar.checked, base,
  });
});
botonCancelar.addEventListener("click", () => { botonCancelar.disabled = true; estadoTxt.textContent = "Cancelando al terminar la página en curso…"; enviar({ tipo: "cancelar" }); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && estado.trabajando) botonCancelar.click(); });
function terminarTrabajo() { estado.trabajando = false; botonCancelar.hidden = true; actualizarContador(); }

// ---- resultado
const iconoDxf = () => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.8"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.innerHTML = '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 14h6M9 17h4"/>'; return s; };

function resumenTexto(m) {
  const L = [];
  if (m.unido) {
    L.push(m.partes > 1 ? `Todas las páginas en ${m.partes} archivos unidos.` : "Todas las páginas en un solo archivo.");
    L.push(`Van una junto a otra, en cuadrícula de ${m.columnas} columna(s).` + " Cada una trae su rótulo «Página N» en la capa Etiquetas_paginas, que puedes apagar.");
    if (m.partes > 1) L.push("Se hicieron varios archivos porque uno solo habría quedado demasiado pesado (más de 450.000 elementos).");
    L.push("");
  }
  for (const r of m.resultados) {
    const c = r.conteo;
    L.push(`Página ${r.pagina}` + (m.unido ? "" : `  →  ${r.archivo}`));
    L.push(`  Recuperado: ${c.lineas + c.polilineas} líneas y polilíneas, ${c.rellenos} rellenos de color, ${c.textos} textos editables.`);
    const capas = Object.keys(r.capas).filter((k) => k !== "SIN_CAPA_PDF");
    L.push(capas.length ? `  Capas con dibujo: ${capas.sort().join(", ")}` + (c.textos ? " · los textos van en la capa Textos." : "") : "  Capas: este PDF no trae capas, todo el dibujo va en una sola capa (SIN_CAPA_PDF).");
    if (c.textos_corregidos) L.push(`  Se corrigieron las letras de ${c.textos_corregidos} textos que venían mal codificados.`);
    if (r.textosEnPdf === 0 && c.rellenos > 1000) L.push("  NO hay texto editable: en este PDF las letras son dibujo, no texto. Se ven igual, pero no se pueden editar como texto. (El programa de Windows puede intentar reconocerlas.)");
    if (c.rellenos_sin_area_omitidos) L.push(`  Se omitieron ${c.rellenos_sin_area_omitidos} rellenos sin área (no se veían).`);
    L.push("");
  }
  for (const n of m.omitidas) L.push(`Página ${n}: NO convertida. Es una imagen escaneada y este conversor solo convierte planos vectoriales.`);
  L.push("Lo que no se conserva: transparencias y degradados de color.");
  return L.join("\n");
}

function mostrarResultado(m) {
  terminarTrabajo();
  barra.style.width = "100%";
  estadoTxt.textContent = "";
  estado.resultado = m;
  const avisos = [];
  for (const r of m.resultados) if (r.textosEnPdf === 0 && r.conteo.rellenos > 1000) avisos.push(`página ${r.pagina}: las letras son dibujo, no texto editable`);
  for (const n of m.omitidas) avisos.push(`página ${n}: escaneada, no se convirtió`);
  if (m.partes > 1) avisos.push(`se hicieron ${m.partes} archivos unidos porque uno solo quedaría demasiado pesado`);
  const nada = !m.archivos.length;
  const cartel = el("div", { className: "cartel " + (nada ? "mal" : avisos.length ? "aviso" : "ok") },
    el("strong", { textContent: nada ? "No se creó ningún archivo" : `Listo: ${m.resultados.length} página(s) convertida(s) en ${m.archivos.length} archivo(s)` }),
    el("span", { textContent: avisos.length ? "A revisar: " + avisos.slice(0, 4).join("; ") + (avisos.length > 4 ? "…" : "") : nada ? "Revisa las páginas elegidas." : "Todo se recuperó sin avisos." }));
  const lista = el("div", { className: "archivos" });
  for (const f of m.archivos) {
    const url = URL.createObjectURL(f.blob);
    lista.append(el("div", { className: "archivo" }, iconoDxf(), el("div", {}, el("span", { className: "nombre", textContent: f.nombre }), el("small", { textContent: mb(f.blob.size) })),
      el("a", { className: "boton boton-claro", href: url, download: f.nombre, textContent: "Descargar" })));
  }
  const bloques = [cartel, lista];
  if (m.archivos.length > 1) {
    const z = el("button", { type: "button", className: "boton boton-primario", textContent: "Descargar todo (.zip)" });
    z.addEventListener("click", async () => {
      z.disabled = true; z.textContent = "Preparando el zip…";
      const blob = await crearZip(m.archivos);
      const a = el("a", { href: URL.createObjectURL(blob), download: estado.archivo.name.replace(/\.pdf$/i, "") + "_dxf.zip" });
      document.body.append(a); a.click(); a.remove();
      z.disabled = false; z.textContent = "Descargar todo (.zip)";
    });
    bloques.push(el("div", {}, z));
  }
  bloques.push(el("details", { className: "detalles" }, el("summary", { textContent: "Detalles de la conversión" }), el("pre", { textContent: resumenTexto(m) })));
  resultado.replaceChildren(...bloques);
  resultado.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---- arranque
ajustes();
if (!compatible) {
  zona.classList.add("deshabilitado");
  resultado.replaceChildren(el("div", { className: "cartel mal" }, el("strong", { textContent: "Tu navegador no es compatible" }), el("span", { textContent: "Hace falta un navegador reciente (Chrome, Edge, Firefox o Safari actualizados)." })));
}
