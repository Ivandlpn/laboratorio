// Interruptor de tema claro/oscuro compartido por las paginas del Laboratorio.
// El tema se recuerda solo en este navegador. Sin guardado, sigue al sistema.
const CLAVE = "laboratorio.tema";
const raiz = document.documentElement;
const SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>';
const LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';

const efectivo = () => raiz.dataset.tema || (matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro");

function pintar() {
  const b = document.querySelector(".tema");
  if (!b) return;
  const oscuro = efectivo() === "oscuro";
  b.innerHTML = oscuro ? SOL : LUNA;
  b.setAttribute("aria-label", oscuro ? "Usar el tema claro" : "Usar el tema oscuro");
  b.title = oscuro ? "Tema claro" : "Tema oscuro";
}

document.querySelector(".tema")?.addEventListener("click", () => {
  const nuevo = efectivo() === "oscuro" ? "claro" : "oscuro";
  raiz.dataset.tema = nuevo;
  try { localStorage.setItem(CLAVE, nuevo); } catch { /* sin almacenamiento */ }
  pintar();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", pintar);
pintar();
