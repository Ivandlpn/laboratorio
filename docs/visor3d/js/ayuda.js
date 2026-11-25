/*
 * Ayuda de teclado (tecla «?»): lista de atajos y el interruptor de los de una sola letra (WCAG 2.1.4: se pueden desactivar).
 * El interruptor lo aplica index.html con un oyente en captura que corta las teclas de letra sin modificador.
 */
const GRUPOS = [
  ['Buscar y moverse', [['Ctrl K  ·  /', 'Buscar un PK, un lugar, una coordenada o dar una orden'], ['← → ↑ ↓', 'Girar e inclinar la cámara'], ['Q  ·  E', 'Girar a un lado u otro'], ['+  ·  −', 'Acercar y alejar (en cabina y dron, la velocidad)'], ['Espacio', 'Pausar o seguir el recorrido'], ['R', 'Volver a centrar la cámara en el recorrido']]],
  ['Herramientas', [['D', 'Medir distancia y desnivel'], ['C', 'Capa de confianza (origen de cada dato)'], ['S', 'Sección transversal en el PK de la cámara'], ['P', 'Captura PNG'], ['M', 'Radar de vía (minimapa)']]],
  ['Escena', [['N', 'Noche o día'], ['H', 'Modo cine (oculta la interfaz)'], ['L  ·  B', 'Faros y bocina del tren (en cabina)'], ['Esc', 'Cerrar ficha, medición o menú']]],
];

export function crearAyudaAtajos({ activos, alCambiar }) {
  const el = document.createElement('div');
  el.id = 'ayudaAtajos';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'ayudaAtajosTit');
  el.innerHTML = `<div class="aa-caja"><div class="f-cab"><h2 id="ayudaAtajosTit">Atajos de teclado</h2>
    <button type="button" class="f-btn" data-aa="cerrar" aria-label="Cerrar la ayuda (Esc)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>
    ${GRUPOS.map(([t, filas]) => `<h3>${t}</h3><dl>${filas.map(([k, d]) => `<dt><kbd>${k.replace(/  ·  /g, '</kbd> <kbd>')}</kbd></dt><dd>${d}</dd>`).join('')}</dl>`).join('')}
    <label class="aa-interruptor"><input type="checkbox" data-aa="letras"> Atajos de una sola letra</label>
    <p class="aa-nota">Si usas reconocimiento de voz o un lector de pantalla, desactívalos para que no se disparen sin querer. Ctrl K, «/», «?», Espacio, + − y las flechas siguen activos.</p></div>`;
  document.body.appendChild(el);
  const chk = el.querySelector('[data-aa="letras"]');
  let previo = null;
  function cerrar() {
    if (el.hidden) return false;
    el.hidden = true;
    if (previo?.isConnected) previo.focus({ preventScroll: true });
    previo = null;
    return true;
  }
  function abrir() {
    previo = document.activeElement;
    chk.checked = activos();
    el.hidden = false;
    el.querySelector('[data-aa="cerrar"]').focus({ preventScroll: true });
  }
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-aa="cerrar"]')) cerrar(); });
  chk.addEventListener('change', () => alCambiar(chk.checked));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
    // Foco dentro del cuadro mientras está abierto
    if (e.key === 'Tab') {
      const f = [...el.querySelectorAll('button, input')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  return { abrir, cerrar, get abierta() { return !el.hidden; } };
}
