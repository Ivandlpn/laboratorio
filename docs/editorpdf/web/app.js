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
const estado = { archivo: null, paginas: [], seleccion: new Set(), minis: new Map(), vistas: new Map(), colaMinis: [], pidiendoMini: false, trabajando: false, vistaActual: null };
let worker = null;
const compatible = typeof Worker !== "undefined" && typeof WebAssembly !== "undefined";

// ---- elementos
const hoja = $("#hoja"), zona = $("#zona"), entrada = $("#archivo");
const indice = $("#indice"), vista = $("#vista"), rejilla = $("#rejilla"), contador = $("#contador"), rangoTxt = $("#rango");
const papel = $("#papel"), tituloVista = $("#titulo-vista"), datosVista = $("#datos-vista");
const nombreArchivo = $("#nombre-archivo"), detalleArchivo = $("#detalle-archivo"), cambiar = $("#cambiar");
const modoUnir = $("#modo-unir"), subUnir = $("#sub-unir"), columnasSel = $("#columnas"), etiquetar = $("#etiquetar");
const botonConvertir = $("#convertir"), botonCancelar = $("#cancelar"), trazo = $("#barra"), barra = $("#barra > i"), estadoTxt = $("#estado"), resultado = $("#resultado");

const progreso = (f) => { barra.style.width = Math.round(f * 100) + "%"; trazo.setAttribute("aria-valuenow", String(Math.round(f * 100))); };

// ---- trabajador (el motor tarda un momento en arrancar: lo enviado antes se guarda en cola)
let trabajadorListo = false;
let pendientes = [];
function nuevoTrabajador() {
  if (worker) worker.terminate();
  trabajadorListo = false;
  pendientes = [];
  worker = new Worker(new URL("./conversor.worker.js?v=2", import.meta.url), { type: "module" });
  worker.onmessage = (ev) => alMensaje(ev.data);
  worker.onerror = (e) => mostrarError("No se pudo cargar el motor de conversión", e.message || "Recarga la página e inténtalo de nuevo.");
}
function enviar(mensaje, transferibles = []) {
  if (trabajadorListo) worker.postMessage(mensaje, transferibles);
  else pendientes.push([mensaje, transferibles]);
}

function alMensaje(m) {
  switch (m.tipo) {
    case "listo": trabajadorListo = true; for (const [msg, tr] of pendientes) worker.postMessage(msg, tr); pendientes = []; return;
    case "abierto": return crearHojas(m.paginas);
    case "pagina": return actualizarHoja(m.n, m.info);
    case "analizado": return alAnalizar();
    case "miniatura": return recibirMiniatura(m);
    case "avance": estadoTxt.textContent = m.texto; progreso(m.fraccion); return;
    case "fin": return mostrarResultado(m);
    case "cancelado": terminarTrabajo(); estadoTxt.textContent = "Conversión cancelada. No se creó ningún archivo."; progreso(0); return;
    case "error": return mostrarError("No se pudo completar la conversión", m.mensaje);
  }
}

function mostrarError(titulo, detalle) {
  terminarTrabajo();
  estadoTxt.textContent = "";
  resultado.replaceChildren(el("section", { className: "entrega mal" }, el("header", {}, el("h2", { textContent: titulo }), el("p", { textContent: detalle }))));
}

// ---- elegir el PDF (se puede soltar en cualquier parte de la lamina)
hoja.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("sobre"); });
hoja.addEventListener("dragleave", (e) => { if (!hoja.contains(e.relatedTarget)) zona.classList.remove("sobre"); });
hoja.addEventListener("drop", (e) => {
  e.preventDefault();
  zona.classList.remove("sobre");
  const f = [...e.dataTransfer.files].find((x) => /\.pdf$/i.test(x.name) || x.type === "application/pdf");
  if (f) cargar(f); else mostrarError("Ese archivo no es un PDF", "Suelta un archivo con extensión .pdf.");
});
entrada.addEventListener("change", () => { if (entrada.files[0]) cargar(entrada.files[0]); entrada.value = ""; });
cambiar.addEventListener("click", () => entrada.click());
$("#ejemplo").addEventListener("click", async (e) => {
  e.preventDefault(); e.stopPropagation();
  try {
    const r = await fetch(new URL("./ejemplo.pdf", import.meta.url));
    cargar(new File([await r.blob()], "plano_de_ejemplo.pdf", { type: "application/pdf" }));
  } catch { mostrarError("No se pudo cargar el plano de ejemplo", "Comprueba tu conexión e inténtalo de nuevo."); }
});

async function cargar(archivo) {
  if (!compatible) return;
  estado.archivo = archivo;
  estado.paginas = [];
  estado.seleccion = new Set();
  for (const u of [...estado.minis.values(), ...estado.vistas.values()]) URL.revokeObjectURL(u);
  estado.minis = new Map(); estado.vistas = new Map(); estado.colaMinis = []; estado.pidiendoMini = false; estado.vistaActual = null;
  hoja.dataset.estado = "abriendo";
  nombreArchivo.textContent = archivo.name;
  detalleArchivo.textContent = `${mb(archivo.size)} · abriendo…`;
  cambiar.hidden = false;
  rejilla.replaceChildren();
  resultado.replaceChildren();
  progreso(0); estadoTxt.textContent = "";
  papel.replaceChildren("Dibujando la primera hoja…");
  indice.hidden = false; vista.hidden = false; zona.hidden = true;
  botonConvertir.disabled = true;
  nuevoTrabajador();
  const buffer = await archivo.arrayBuffer();
  enviar({ tipo: "abrir", buffer }, [buffer]);
}

// ---- indice de hojas
function crearHojas(n) {
  detalleArchivo.textContent = `${mb(estado.archivo.size)} · ${n} ${n === 1 ? "hoja" : "hojas"}`;
  for (let i = 1; i <= n; i++) {
    const casilla = el("input", { type: "checkbox", className: "casilla", id: "ck" + i, disabled: true });
    casilla.setAttribute("aria-label", `Incluir la hoja ${i}`);
    casilla.addEventListener("change", () => cambiarSeleccion(i, casilla.checked));
    const boton = el("button", { type: "button", className: "miniatura", id: "pg" + i });
    boton.append(el("span", { className: "mini" }, el("span", { className: "cargando" })), el("span", { className: "pie" }, el("b", { textContent: "Hoja " + i }), el("i", { className: "punto" }), el("small", { textContent: "…" })));
    boton.addEventListener("click", () => mostrarVista(i));
    rejilla.append(el("li", { className: "item", id: "it" + i }, boton, casilla));
  }
  estado.paginas = Array.from({ length: n }, (_, k) => ({ n: k + 1, info: null }));
  actualizarContador();
}

function actualizarHoja(n, info) {
  estado.paginas[n - 1].info = info;
  const it = $("#it" + n), ck = $("#ck" + n);
  const punto = it.querySelector(".punto"), nota = it.querySelector("small");
  if (info.escaneada) {
    punto.className = "punto mal"; nota.textContent = "escaneada"; it.classList.add("escaneada");
    it.title = "Es una imagen escaneada: no se puede convertir.";
  } else {
    ck.disabled = false; ck.checked = true; estado.seleccion.add(n);
    punto.className = "punto " + (info.textos ? "ok" : "aviso"); nota.textContent = info.textos ? "con texto" : "letras dibujadas";
    it.title = info.textos ? "Tiene texto editable" : "Las letras son dibujo: se verán igual, pero no son texto editable";
  }
  marcar(n);
  actualizarContador();
}

function alAnalizar() {
  detalleArchivo.textContent = `${mb(estado.archivo.size)} · ${estado.paginas.length} ${estado.paginas.length === 1 ? "hoja" : "hojas"}`;
  hoja.dataset.estado = "listo";
  const primera = estado.paginas.find((p) => p.info && !p.info.escaneada) || estado.paginas[0];
  mostrarVista(primera.n);
  estado.colaMinis = estado.paginas.map((p) => p.n);
  siguienteMini();
}

function marcar(n) {
  const m = estado.seleccion.has(n);
  $("#it" + n).classList.toggle("marcada", m);
  const ck = $("#ck" + n);
  if (ck) ck.checked = m;
}
function cambiarSeleccion(n, valor) {
  const info = estado.paginas[n - 1].info;
  if (!info || info.escaneada || estado.trabajando) { marcar(n); return; }
  valor ? estado.seleccion.add(n) : estado.seleccion.delete(n);
  marcar(n); actualizarContador();
}
function actualizarContador() {
  const total = estado.paginas.length;
  contador.textContent = total ? `${estado.seleccion.size} de ${total} hojas` : "Hojas";
  botonConvertir.disabled = estado.trabajando || estado.seleccion.size === 0;
}
$("#todas").addEventListener("click", () => { estado.paginas.forEach((p) => { if (p.info && !p.info.escaneada) estado.seleccion.add(p.n); marcar(p.n); }); actualizarContador(); });
$("#ninguna").addEventListener("click", () => { estado.seleccion.clear(); estado.paginas.forEach((p) => marcar(p.n)); actualizarContador(); });

function interpretarRango(texto, maximo) {
  const res = new Set();
  for (const t of texto.trim().split(/[,;\s]+/).filter(Boolean)) {
    const m = t.match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
    if (!m) throw new Error(`No entiendo «${t}». Prueba con 1-5, 8.`);
    let a = +m[1], b = +(m[2] || m[1]);
    if (a > b) [a, b] = [b, a];
    if (a < 1 || b > maximo) throw new Error(`El PDF tiene ${maximo} hojas y «${t}» se sale.`);
    for (let i = a; i <= b; i++) res.add(i);
  }
  if (!res.size) throw new Error("Escribe un rango, por ejemplo 1-3, 8.");
  return res;
}
function aplicarRango() {
  try {
    const r = interpretarRango(rangoTxt.value, estado.paginas.length);
    estado.seleccion.clear();
    estado.paginas.forEach((p) => { if (r.has(p.n) && p.info && !p.info.escaneada) estado.seleccion.add(p.n); marcar(p.n); });
    actualizarContador();
    rangoTxt.setCustomValidity("");
  } catch (e) { rangoTxt.setCustomValidity(e.message); rangoTxt.reportValidity(); setTimeout(() => rangoTxt.setCustomValidity(""), 3000); }
}
$("#aplicar-rango").addEventListener("click", aplicarRango);
rangoTxt.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); aplicarRango(); } });

// ---- miniaturas y vista grande (se piden de una en una para no atascar al trabajador)
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
    if (caja) caja.replaceChildren(el("img", { src: url, alt: "" }));
    siguienteMini();
  } else {
    estado.vistas.set(m.n, url);
    if (estado.vistaActual === m.n) ponerVista(url, m.n);
  }
}
function mostrarVista(n) {
  estado.vistaActual = n;
  const info = estado.paginas[n - 1]?.info;
  tituloVista.textContent = `Hoja ${n} de ${estado.paginas.length}`;
  datosVista.textContent = info ? `${info.ancho_mm} × ${info.alto_mm} mm` : "";
  document.querySelectorAll(".item").forEach((it) => it.removeAttribute("aria-current"));
  $("#it" + n)?.setAttribute("aria-current", "true");
  if (estado.vistas.has(n)) return ponerVista(estado.vistas.get(n), n);
  papel.replaceChildren(el("span", { className: "cargando" }));
  enviar({ tipo: "miniatura", n, ancho: 1100, id: "p" + n });
}
function ponerVista(url, n) { papel.replaceChildren(el("img", { src: url, alt: `Vista previa de la hoja ${n}` })); }

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
  trazo.classList.add("activo");
  resultado.replaceChildren();
  progreso(0);
  estadoTxt.textContent = "Preparando…";
  const base = estado.archivo.name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "_");
  enviar({
    tipo: "convertir", paginas: [...estado.seleccion].sort((a, b) => a - b), unir: modoUnir.checked,
    columnas: columnasSel.value === "auto" ? null : Number(columnasSel.value), etiquetar: etiquetar.checked, base,
  });
});
botonCancelar.addEventListener("click", () => { botonCancelar.disabled = true; estadoTxt.textContent = "Cancelando al terminar la hoja en curso…"; enviar({ tipo: "cancelar" }); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && estado.trabajando) botonCancelar.click(); });
function terminarTrabajo() { estado.trabajando = false; botonCancelar.hidden = true; trazo.classList.remove("activo"); actualizarContador(); }

// ---- resultado
function resumenTexto(m) {
  const L = [];
  if (m.unido) {
    L.push(m.partes > 1 ? `Todas las hojas, en ${m.partes} archivos unidos.` : "Todas las hojas, en un solo archivo.");
    L.push(`Van una junto a otra, en cuadrícula de ${m.columnas} columna(s). Cada una trae su rótulo «Hoja N» en la capa Etiquetas_paginas, que puedes apagar.`);
    if (m.partes > 1) L.push("Se hicieron varios archivos porque uno solo habría quedado demasiado pesado (más de 450.000 elementos).");
    L.push("");
  }
  for (const r of m.resultados) {
    const c = r.conteo;
    L.push(`Hoja ${r.pagina}` + (m.unido ? "" : `  →  ${r.archivo}`));
    L.push(`  Recuperado: ${c.lineas + c.polilineas} líneas y polilíneas, ${c.rellenos} rellenos de color, ${c.textos} textos editables.`);
    const capas = Object.keys(r.capas).filter((k) => k !== "SIN_CAPA_PDF");
    L.push(capas.length ? `  Capas con dibujo: ${capas.sort().join(", ")}` + (c.textos ? " · los textos van en la capa Textos." : "") : "  Capas: este PDF no trae capas; todo el dibujo va en una sola (SIN_CAPA_PDF).");
    if (c.textos_corregidos) L.push(`  Se corrigieron las letras de ${c.textos_corregidos} textos que venían mal codificados.`);
    if (r.textosEnPdf === 0 && c.rellenos > 1000) L.push("  Sin texto editable: en este PDF las letras son dibujo. Se ven igual, pero no se pueden editar como texto (el programa para Windows puede intentar reconocerlas).");
    if (c.rellenos_sin_area_omitidos) L.push(`  Se omitieron ${c.rellenos_sin_area_omitidos} rellenos sin área (no se veían).`);
    L.push("");
  }
  for (const n of m.omitidas) L.push(`Hoja ${n}: no se convirtió. Es una imagen escaneada y este conversor solo admite planos vectoriales.`);
  L.push("No se conservan las transparencias ni los degradados de color.");
  return L.join("\n");
}

function mostrarResultado(m) {
  terminarTrabajo();
  progreso(1);
  estadoTxt.textContent = "";
  const avisos = [];
  for (const r of m.resultados) if (r.textosEnPdf === 0 && r.conteo.rellenos > 1000) avisos.push(`Hoja ${r.pagina}: las letras son dibujo y no quedan como texto editable.`);
  for (const n of m.omitidas) avisos.push(`Hoja ${n}: es una imagen escaneada y no se convirtió.`);
  if (m.partes > 1) avisos.push(`Se hicieron ${m.partes} archivos unidos porque uno solo habría quedado demasiado pesado.`);
  const nada = !m.archivos.length;
  const nivel = nada ? "mal" : avisos.length ? "aviso" : "";
  const secc = el("section", { className: "entrega " + nivel });
  secc.append(el("header", {}, el("h2", { textContent: nada ? "No se creó ningún archivo" : m.archivos.length === 1 ? "1 archivo listo" : m.archivos.length + " archivos listos" }),
    el("p", { textContent: nada ? "Revisa las hojas elegidas." : `${m.resultados.length} ${m.resultados.length === 1 ? "hoja convertida" : "hojas convertidas"}${avisos.length ? ", con avisos a revisar" : " sin avisos"}.` })));
  if (!nada) {
    const lista = el("ul", { className: "entregas" });
    for (const f of m.archivos) {
      const url = URL.createObjectURL(f.blob);
      lista.append(el("li", {}, el("span", { className: "nom", textContent: f.nombre }), el("span", { className: "tam", textContent: mb(f.blob.size) }),
        el("a", { className: "boton boton-claro boton-chico", href: url, download: f.nombre, textContent: "Descargar" })));
    }
    secc.append(lista);
    if (m.archivos.length > 1) {
      const z = el("button", { type: "button", className: "boton", textContent: "Descargar todo (zip)" });
      z.addEventListener("click", async () => {
        z.disabled = true; z.textContent = "Preparando el zip…";
        const blob = await crearZip(m.archivos);
        const a = el("a", { href: URL.createObjectURL(blob), download: estado.archivo.name.replace(/\.pdf$/i, "") + "_dxf.zip" });
        document.body.append(a); a.click(); a.remove();
        z.disabled = false; z.textContent = "Descargar todo (zip)";
      });
      secc.append(el("div", { className: "pie-entrega" }, z));
    }
  }
  if (avisos.length) secc.append(el("ul", { className: "avisos" }, ...avisos.map((t) => el("li", { textContent: t }))));
  secc.append(el("details", {}, el("summary", { textContent: "Detalle de la conversión" }), el("pre", { textContent: resumenTexto(m) })));
  resultado.replaceChildren(secc);
  secc.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---- arranque
ajustes();
if (!compatible) {
  zona.style.pointerEvents = "none";
  mostrarError("Tu navegador no es compatible", "Usa una versión reciente de Chrome, Edge, Firefox o Safari.");
}
