// Interfaz del conversor PDF a DXF. Todo ocurre en el navegador: el PDF no se sube a ningun servidor.
import { crearZip } from "./zip.js";

const $ = (s) => document.querySelector(s);
const SPRITE = new URL("../../assets/iconos.svg", import.meta.url).href;
const NS = "http://www.w3.org/2000/svg";
const icono = (id, clase = "ico") => {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("class", clase);
  s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS(NS, "use");
  u.setAttribute("href", `${SPRITE}#${id}`);
  s.append(u);
  return s;
};
const el = (tag, props = {}, ...hijos) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...hijos);
  return n;
};
const mb = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
const miles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// ---- ajustes recordados (solo en este navegador)
const CLAVE = "editorpdf.ajustes.v2";
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; } };
const guardar = (o) => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch { /* sin almacenamiento */ } };

const PERFILES = {
  editable: { unir: true, circulos: true, dup: true, rellenos: true, textos: true, blancos: false },
  fiel: { unir: false, circulos: false, dup: false, rellenos: true, textos: true, blancos: false },
  ligero: { unir: true, circulos: true, dup: true, rellenos: false, textos: true, blancos: false },
};
const DIVISOR = { 4: 1, 5: 10, 6: 1000 }; // mm de papel por unidad de salida, segun $INSUNITS
const NOMBRE_UNIDAD = { 4: "milímetros", 5: "centímetros", 6: "metros" };

// ---- estado
const estado = { archivo: null, paginas: [], seleccion: new Set(), minis: new Map(), vistas: new Map(), colaMinis: [], pidiendoMini: false, trabajando: false, vistaActual: null, midiendo: false, puntos: [], mmMedidos: 0, excluidas: new Set() };
let worker = null;
const compatible = typeof Worker !== "undefined" && typeof WebAssembly !== "undefined";

// ---- elementos
const estudio = $("#estudio"), zona = $("#zona"), entrada = $("#archivo"), trabajo = $("#trabajo"), accion = $("#accion");
const rejilla = $("#rejilla"), contador = $("#contador"), rangoTxt = $("#rango");
const papel = $("#papel"), tituloVista = $("#titulo-vista"), datosVista = $("#datos-vista");
const nombreArchivo = $("#nombre-archivo"), detalleArchivo = $("#detalle-archivo"), cambiar = $("#cambiar");
const modoUnir = $("#modo-unir"), subUnir = $("#sub-unir"), columnasSel = $("#columnas"), etiquetar = $("#etiquetar");
const botonConvertir = $("#convertir"), botonCancelar = $("#cancelar"), trazo = $("#barra"), barra = $("#barra > i"), estadoTxt = $("#estado"), resultado = $("#resultado");
const selCapas = $("#capas"), selEscala = $("#escala"), selUnidades = $("#unidades"), otraCaja = $("#otra-caja"), otra = $("#otra"), notaEscala = $("#escala-nota");
const OPC = { unir: $("#o-unir"), circulos: $("#o-circulos"), dup: $("#o-dup"), rellenos: $("#o-rellenos"), textos: $("#o-textos"), blancos: $("#o-blancos") };

const progreso = (f) => { barra.style.width = Math.round(f * 100) + "%"; trazo.setAttribute("aria-valuenow", String(Math.round(f * 100))); };

// ---- pasos
function marcarPaso(n, hechoHasta = n - 1) {
  document.querySelectorAll("#pasos .paso").forEach((p) => {
    const k = Number(p.dataset.paso);
    p.classList.toggle("activo", k === n);
    p.classList.toggle("hecho", k <= hechoHasta);
  });
}

// ---- trabajador (el motor tarda un momento en arrancar: lo enviado antes se guarda en cola)
let trabajadorListo = false;
let pendientes = [];
function nuevoTrabajador() {
  if (worker) worker.terminate();
  trabajadorListo = false;
  pendientes = [];
  worker = new Worker(new URL("./conversor.worker.js?v=4", import.meta.url), { type: "module" });
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
  const s = el("section", { className: "entrega mal" }, el("header", {}, icono("i-alert"), el("div", {}, el("h2", { textContent: titulo }), el("p", { textContent: detalle }))));
  resultado.replaceChildren(s);
}

// ---- elegir el PDF (se puede soltar en cualquier parte del estudio)
estudio.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("sobre"); });
estudio.addEventListener("dragleave", (e) => { if (!estudio.contains(e.relatedTarget)) zona.classList.remove("sobre"); });
estudio.addEventListener("drop", (e) => {
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
  salirDeMedir();
  estado.excluidas = new Set();
  estudio.dataset.estado = "abriendo";
  nombreArchivo.textContent = archivo.name;
  detalleArchivo.textContent = `${mb(archivo.size)} · abriendo…`;
  rejilla.replaceChildren();
  resultado.replaceChildren();
  progreso(0); estadoTxt.textContent = "";
  $("#contenido").hidden = true;
  papel.replaceChildren(el("span", { className: "cargando" }));
  zona.hidden = true; trabajo.hidden = false; accion.hidden = false;
  botonConvertir.disabled = true;
  marcarPaso(2, 1);
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
  estudio.dataset.estado = "listo";
  marcarPaso(3, 2);
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
  salirDeMedir();
  const info = estado.paginas[n - 1]?.info;
  tituloVista.textContent = `Hoja ${n} de ${estado.paginas.length}`;
  datosVista.textContent = info ? `${info.ancho_mm} × ${info.alto_mm} mm` : "";
  document.querySelectorAll(".item").forEach((it) => it.removeAttribute("aria-current"));
  $("#it" + n)?.setAttribute("aria-current", "true");
  pintarContenido(n);
  if (estado.vistas.has(n)) return ponerVista(estado.vistas.get(n), n);
  papel.replaceChildren(el("span", { className: "cargando" }));
  enviar({ tipo: "miniatura", n, ancho: 1400, id: "p" + n });
}
function ponerVista(url, n) {
  const img = el("img", { src: url, alt: `Vista previa de la hoja ${n}`, draggable: false });
  const lienzo = el("div", { className: "lienzo", id: "lienzo" }, img);
  lienzo.addEventListener("click", alClicLienzo);
  papel.replaceChildren(lienzo);
  if (estado.midiendo) lienzo.classList.add("midiendo");
}

// ---- contenido de la hoja: capas del PDF o colores principales (se pueden desmarcar para no exportarlos)
function chipConmutable(clave, marca, nombre, cant) {
  const ck = el("input", { type: "checkbox", checked: !estado.excluidas.has(clave) });
  ck.setAttribute("aria-label", `Incluir ${nombre}`);
  const chip = el("label", { className: "cap", title: "Desmarca para no exportar esto" }, ck, marca, nombre, ...(typeof cant === "number" ? [el("small", { textContent: miles(cant) })] : []));
  ck.addEventListener("change", () => { ck.checked ? estado.excluidas.delete(clave) : estado.excluidas.add(clave); chip.classList.toggle("fuera", !ck.checked); actualizarExcluidas(); });
  chip.classList.toggle("fuera", !ck.checked);
  return chip;
}
function actualizarExcluidas() {
  const n = estado.excluidas.size;
  $("#excluidas").hidden = n === 0;
  $("#excluidas-n").textContent = n ? `${n} sin exportar` : "";
}
$("#incluir-todo").addEventListener("click", () => { estado.excluidas.clear(); if (estado.vistaActual) pintarContenido(estado.vistaActual); actualizarExcluidas(); });
function pintarContenido(n) {
  const info = estado.paginas[n - 1]?.info;
  const caja = $("#contenido"), lista = $("#capas-lista");
  if (!info || info.escaneada) { caja.hidden = true; return; }
  lista.replaceChildren();
  const capas = Object.entries(info.capas || {});
  if (capas.length) {
    $("#contenido-tit").textContent = `${capas.length} ${capas.length === 1 ? "capa" : "capas"} en esta hoja`;
    for (const [nombre, cant] of capas.sort((a, b) => a[0].localeCompare(b[0]))) {
      lista.append(chipConmutable("capa:" + nombre, el("span", { className: "cap-ico" }, icono("i-layers")), nombre, cant));
    }
  } else {
    $("#contenido-tit").textContent = "Sin capas en el PDF · colores principales";
    for (const [hex, cant] of info.colores || []) {
      const c = el("i"); c.style.background = hex[0] === "#" ? hex : "#" + hex;
      lista.append(chipConmutable("color:" + hex.replace("#", "").toUpperCase(), c, hex.toUpperCase(), cant));
    }
  }
  caja.hidden = !lista.children.length;
}

// ---- medir y calibrar la escala sobre la vista previa
const medir = $("#medir"), calibra = $("#calibra"), calibraTxt = $("#calibra-txt"), real = $("#real"), realU = $("#real-u"), aplicarEscala = $("#aplicar-escala");
function salirDeMedir() {
  estado.midiendo = false; estado.puntos = [];
  medir.setAttribute("aria-pressed", "false");
  calibra.hidden = true; real.hidden = true; realU.hidden = true; aplicarEscala.hidden = true;
  $("#lienzo")?.classList.remove("midiendo");
  $("#lienzo svg.medida")?.remove();
  $("#lienzo .consejo")?.remove();
}
medir.addEventListener("click", () => {
  if (estado.midiendo) return salirDeMedir();
  if (!$("#lienzo")) return;
  estado.midiendo = true; estado.puntos = [];
  medir.setAttribute("aria-pressed", "true");
  calibra.hidden = false;
  calibraTxt.textContent = "Marca dos puntos del plano cuya distancia real conozcas (por ejemplo, una cota).";
  $("#lienzo").classList.add("midiendo");
});
$("#cancelar-medida").addEventListener("click", salirDeMedir);
function alClicLienzo(e) {
  if (!estado.midiendo) return;
  const img = e.currentTarget.querySelector("img");
  const r = img.getBoundingClientRect();
  if (estado.puntos.length >= 2) estado.puntos = [];
  estado.puntos.push([(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]);
  dibujarMedida();
  if (estado.puntos.length === 2) {
    const info = estado.paginas[estado.vistaActual - 1].info;
    const [[x1, y1], [x2, y2]] = estado.puntos;
    estado.mmMedidos = Math.hypot((x2 - x1) * info.ancho_mm, (y2 - y1) * info.alto_mm);
    calibraTxt.textContent = `En el papel hay ${estado.mmMedidos.toFixed(1)} mm. ¿Cuánto mide en la realidad?`;
    real.hidden = false; realU.hidden = false; aplicarEscala.hidden = false;
    real.focus();
  } else {
    calibraTxt.textContent = "Ahora marca el segundo punto.";
    real.hidden = true; realU.hidden = true; aplicarEscala.hidden = true;
  }
}
function dibujarMedida() {
  const lienzo = $("#lienzo");
  lienzo.querySelector("svg.medida")?.remove();
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("class", "medida");
  const marca = (p) => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", p[0] * 100 + "%"); c.setAttribute("cy", p[1] * 100 + "%"); c.setAttribute("r", "6");
    c.setAttribute("fill", "#27b6f0"); c.setAttribute("stroke", "#fff"); c.setAttribute("stroke-width", "2");
    return c;
  };
  if (estado.puntos.length === 2) {
    const l = document.createElementNS(NS, "line");
    const [a, b] = estado.puntos;
    l.setAttribute("x1", a[0] * 100 + "%"); l.setAttribute("y1", a[1] * 100 + "%"); l.setAttribute("x2", b[0] * 100 + "%"); l.setAttribute("y2", b[1] * 100 + "%");
    l.setAttribute("stroke", "#1b61e4"); l.setAttribute("stroke-width", "3"); l.setAttribute("stroke-linecap", "round");
    s.append(l);
  }
  estado.puntos.forEach((p) => s.append(marca(p)));
  lienzo.append(s);
}
aplicarEscala.addEventListener("click", () => {
  const v = parseFloat(real.value);
  if (!(v > 0) || !(estado.mmMedidos > 0)) { real.setCustomValidity("Escribe la medida real."); real.reportValidity(); return; }
  real.setCustomValidity("");
  const n = (v * Number(realU.value)) / estado.mmMedidos;
  const cercano = [...selEscala.options].find((o) => o.value !== "otra" && Math.abs(Number(o.value) - n) / n < 0.01);
  if (cercano) selEscala.value = cercano.value;
  else { selEscala.value = "otra"; otra.value = String(Math.round(n * 1000) / 1000); }
  actualizarEscala(); guardarAjustes();
  salirDeMedir();
});

// ---- opciones
const escalaN = () => (selEscala.value === "otra" ? Math.max(0.001, parseFloat(otra.value) || 1) : Number(selEscala.value));
const factor = () => escalaN() / DIVISOR[selUnidades.value];
function actualizarEscala() {
  otraCaja.hidden = selEscala.value !== "otra";
  const n = escalaN(), u = selUnidades.value;
  const porMm = n / DIVISOR[u];
  const txt = Number(porMm.toPrecision(4)).toLocaleString("es-ES", { maximumFractionDigits: 6 });
  notaEscala.textContent = n === 1 && u === "4"
    ? "El dibujo sale en tamaño de papel (1 mm de papel = 1 mm)."
    : `Escala 1:${Number(n.toPrecision(5))} en ${NOMBRE_UNIDAD[u]}: 1 mm de papel = ${txt} ${u === "4" ? "mm" : u === "5" ? "cm" : "m"} en el DXF.`;
}
function aplicarPerfil(nombre) {
  const p = PERFILES[nombre];
  for (const k of Object.keys(p)) OPC[k].checked = p[k];
}
function opciones() {
  return {
    capas: selCapas.value, unirSegmentos: OPC.unir.checked, circulos: OPC.circulos.checked, quitarDuplicados: OPC.dup.checked,
    rellenos: OPC.rellenos.checked, textos: OPC.textos.checked, quitarBlancos: OPC.blancos.checked, factor: factor(), excluir: [...estado.excluidas],
  };
}
function guardarAjustes() {
  const perfil = document.querySelector('input[name="perfil"]:checked')?.value || null;
  guardar({
    formato: document.querySelector('input[name="formato"]:checked')?.value, perfil, unir: modoUnir.checked, columnas: columnasSel.value, etiquetar: etiquetar.value, capas: selCapas.value,
    escala: selEscala.value, otra: otra.value, unidades: selUnidades.value,
    o: Object.fromEntries(Object.entries(OPC).map(([k, c]) => [k, c.checked])),
  });
}
function ajustes() {
  const a = leer();
  if (a.unir) modoUnir.checked = true;
  const fr = a.formato && document.querySelector(`input[name="formato"][value="${a.formato}"]`);
  if (fr) fr.checked = true;
  if (a.columnas) columnasSel.value = a.columnas;
  if (a.etiquetar) etiquetar.value = a.etiquetar;
  botonConvertir.lastChild.textContent = a.formato === "svg" ? "Convertir a SVG" : "Convertir a DXF";
  if (a.capas) selCapas.value = a.capas;
  if (a.escala && [...selEscala.options].some((o) => o.value === a.escala)) selEscala.value = a.escala;
  if (a.otra) otra.value = a.otra;
  if (a.unidades && [...selUnidades.options].some((o) => o.value === a.unidades)) selUnidades.value = a.unidades;
  if (a.o) for (const k of Object.keys(OPC)) if (typeof a.o[k] === "boolean") OPC[k].checked = a.o[k];
  const radio = a.perfil && document.querySelector(`input[name="perfil"][value="${a.perfil}"]`);
  if (radio) radio.checked = true; else if (a.perfil === null) document.querySelectorAll('input[name="perfil"]').forEach((r) => (r.checked = false));
  subUnir.hidden = !modoUnir.checked;
  actualizarEscala();
}
document.querySelectorAll('input[name="perfil"]').forEach((r) => r.addEventListener("change", () => { aplicarPerfil(r.value); guardarAjustes(); }));
for (const c of Object.values(OPC)) c.addEventListener("change", () => { document.querySelectorAll('input[name="perfil"]').forEach((r) => (r.checked = false)); guardarAjustes(); });
document.querySelectorAll('input[name="modo"]').forEach((r) => r.addEventListener("change", () => { subUnir.hidden = !modoUnir.checked; guardarAjustes(); }));
document.querySelectorAll('input[name="formato"]').forEach((r) => r.addEventListener("change", () => { botonConvertir.lastChild.textContent = r.value === "svg" ? "Convertir a SVG" : "Convertir a DXF"; guardarAjustes(); }));
for (const c of [columnasSel, etiquetar, selCapas]) c.addEventListener("change", guardarAjustes);
for (const c of [selEscala, selUnidades, otra]) c.addEventListener("change", () => { actualizarEscala(); guardarAjustes(); });

// ---- convertir
botonConvertir.addEventListener("click", () => {
  if (estado.trabajando || !estado.seleccion.size) return;
  estado.trabajando = true;
  botonConvertir.disabled = true;
  botonCancelar.hidden = false; botonCancelar.disabled = false;
  trazo.hidden = false; trazo.classList.add("activo");
  resultado.replaceChildren();
  progreso(0);
  estadoTxt.textContent = "Preparando…";
  marcarPaso(4, 3);
  const base = estado.archivo.name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "_");
  enviar({
    tipo: "convertir", paginas: [...estado.seleccion].sort((a, b) => a - b), unir: modoUnir.checked,
    columnas: columnasSel.value === "auto" ? null : Number(columnasSel.value), etiquetar: etiquetar.value === "1", base,
    opciones: opciones(), unidades: Number(selUnidades.value), formato: document.querySelector('input[name="formato"]:checked').value,
  });
});
botonCancelar.addEventListener("click", () => { botonCancelar.disabled = true; estadoTxt.textContent = "Cancelando al terminar la hoja en curso…"; enviar({ tipo: "cancelar" }); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (estado.trabajando) botonCancelar.click(); else if (estado.midiendo) salirDeMedir(); } });
function terminarTrabajo() { estado.trabajando = false; botonCancelar.hidden = true; trazo.classList.remove("activo"); trazo.hidden = true; actualizarContador(); }

// ---- resultado
const NOMBRE_MODO = { pdf: "las del PDF", color: "una por color", tipo: "por tipo", una: "una sola" };
function resumenTexto(m) {
  const L = [];
  L.push(`Capas: ${NOMBRE_MODO[m.modoCapas] || m.modoCapas}. Unidades del DXF: ${NOMBRE_UNIDAD[m.unidades]}. Factor aplicado: ${Number(m.factor.toPrecision(6))}.`, "");
  if (m.unido) {
    L.push(m.partes > 1 ? `Todas las hojas, en ${m.partes} archivos unidos.` : "Todas las hojas, en un solo archivo.");
    L.push(`Van una junto a otra, en cuadrícula de ${m.columnas} columna(s). Cada una trae su rótulo «Hoja N» en la capa Etiquetas_paginas, que puedes apagar.`);
    if (m.partes > 1) L.push("Se hicieron varios archivos porque uno solo habría quedado demasiado pesado (más de 450.000 elementos).");
    L.push("");
  }
  for (const r of m.resultados) {
    const c = r.conteo;
    L.push(`Hoja ${r.pagina}` + (m.unido ? "" : `  →  ${r.archivo}`));
    L.push(`  Recuperado: ${miles(c.lineas)} líneas, ${miles(c.polilineas)} polilíneas, ${miles(c.circulos || 0)} círculos, ${miles(c.rellenos)} rellenos de color, ${miles(c.textos)} textos editables.`);
    if (c.unidos || c.duplicados) L.push(`  Ordenado: ${miles(c.unidos || 0)} segmentos unidos y ${miles(c.duplicados || 0)} elementos duplicados quitados.`);
    const capas = Object.keys(r.capas || {});
    L.push(capas.length ? `  Capas: ${capas.sort().join(", ")}` : "  Capas: ninguna con dibujo.");
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
  marcarPaso(4, 4);
  const avisos = [];
  for (const r of m.resultados) if (r.textosEnPdf === 0 && r.conteo.rellenos > 1000) avisos.push(`Hoja ${r.pagina}: las letras son dibujo y no quedan como texto editable.`);
  for (const n of m.omitidas) avisos.push(`Hoja ${n}: es una imagen escaneada y no se convirtió.`);
  if (m.partes > 1) avisos.push(`Se hicieron ${m.partes} archivos unidos porque uno solo habría quedado demasiado pesado.`);
  const nada = !m.archivos.length;
  const nivel = nada ? "mal" : avisos.length ? "aviso" : "";
  const secc = el("section", { className: "entrega " + nivel });
  secc.append(el("header", {}, icono(nada ? "i-x" : avisos.length ? "i-alert" : "i-check"), el("div", {},
    el("h2", { textContent: nada ? "No se creó ningún archivo" : m.archivos.length === 1 ? "1 archivo listo" : m.archivos.length + " archivos listos" }),
    el("p", { textContent: nada ? "Revisa las hojas elegidas." : `${m.resultados.length} ${m.resultados.length === 1 ? "hoja convertida" : "hojas convertidas"}${avisos.length ? ", con avisos a revisar" : " sin avisos"}.` }))));
  if (!nada) {
    const lista = el("ul", { className: "entregas" });
    for (const f of m.archivos) {
      const url = URL.createObjectURL(f.blob);
      lista.append(el("li", {}, el("span", { className: "chip-ico" }, icono(m.formato === "svg" ? "i-file" : "i-dxf")), el("span", { className: "nom", textContent: f.nombre }), el("span", { className: "tam", textContent: mb(f.blob.size) }),
        el("a", { className: "boton boton-chico", href: url, download: f.nombre }, icono("i-download"), "Descargar")));
    }
    // resumen de lo recuperado y capas creadas
    const t = { ent: 0, rel: 0, txt: 0, dup: 0, uni: 0, cir: 0 };
    const capas = new Map();
    for (const r of m.resultados) {
      const c = r.conteo;
      t.ent += c.lineas + c.polilineas + (c.circulos || 0); t.rel += c.rellenos; t.txt += c.textos; t.dup += c.duplicados || 0; t.uni += c.unidos || 0; t.cir += c.circulos || 0;
      for (const [nombre, d] of Object.entries(r.info || {})) { const prev = capas.get(nombre); capas.set(nombre, { n: (prev?.n || 0) + (d.n || 0), color: prev?.color || d.color }); }
    }
    const cifra = (v, e) => el("div", { className: "cifra" }, el("b", { textContent: miles(v) }), el("span", { textContent: e }));
    const lado = el("div", { className: "entrega-lado" },
      el("h3", {}, icono("i-wand"), "Lo recuperado"),
      el("div", { className: "cifras" }, cifra(t.ent, "trazos"), cifra(t.rel, "rellenos"), cifra(t.txt, "textos"), cifra(t.cir, "círculos"), cifra(t.uni, "segmentos unidos"), cifra(t.dup, "duplicados quitados")),
      el("h3", {}, icono("i-layers"), `${capas.size} ${capas.size === 1 ? "capa creada" : "capas creadas"}`));
    const cl = el("div", { className: "cap-lista" });
    [...capas.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 40).forEach(([nombre, d]) => {
      const sw = el("i");
      if (Array.isArray(d.color)) sw.style.background = `rgb(${d.color.join(",")})`; else if (typeof d.color === "string") sw.style.background = d.color;
      cl.append(el("span", { className: "cap" }, sw, nombre, el("small", { textContent: miles(d.n) })));
    });
    lado.append(cl);
    secc.append(el("div", { className: "entrega-cuerpo" }, lista, lado));
    if (m.archivos.length > 1) {
      const z = el("button", { type: "button", className: "boton" }, icono("i-zip"), "Descargar todo (zip)");
      z.addEventListener("click", async () => {
        z.disabled = true;
        const blob = await crearZip(m.archivos);
        const a = el("a", { href: URL.createObjectURL(blob), download: estado.archivo.name.replace(/\.pdf$/i, "") + "_dxf.zip" });
        document.body.append(a); a.click(); a.remove();
        z.disabled = false;
      });
      secc.append(el("div", { className: "pie-entrega" }, z));
    }
  }
  if (avisos.length) secc.append(el("ul", { className: "avisos" }, ...avisos.map((t) => el("li", { textContent: t }))));
  secc.append(el("details", {}, el("summary", {}, icono("i-info"), "Detalle de la conversión"), el("pre", { textContent: resumenTexto(m) })));
  resultado.replaceChildren(secc);
  secc.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---- arranque
ajustes();
if (!compatible) {
  zona.style.pointerEvents = "none";
  mostrarError("Tu navegador no es compatible", "Usa una versión reciente de Chrome, Edge, Firefox o Safari.");
}
