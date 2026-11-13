// Utilidad para hacer los contenedores de información arrastrables por toda la pantalla y contraíbles/expandibles.

export function activarVentanaFlotante(el, { asa = null, botonPlegar = true, clave = null } = {}) {
  if (!el || el.dataset.ventanaLista) return;
  el.dataset.ventanaLista = '1';
  el.classList.add('ventana-flotante');

  const handle = asa || el.querySelector('header, .insp-cab, .perfil-cab') || el;
  handle.classList.add('ventana-asa');

  if (botonPlegar) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-plegar-ventana';
    btn.title = 'Contraer / expandir';
    btn.setAttribute('aria-label', 'Contraer o expandir contenedor');
    btn.textContent = '−';
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const plegada = el.classList.toggle('ventana-plegada');
      btn.textContent = plegada ? '+' : '−';
      btn.setAttribute('aria-expanded', String(!plegada));
      if (clave) { try { sessionStorage.setItem('win.fold.' + clave, plegada ? '1' : '0'); } catch {} }
    });
    if (clave) {
      try {
        if (sessionStorage.getItem('win.fold.' + clave) === '1') {
          el.classList.add('ventana-plegada');
          btn.textContent = '+';
          btn.setAttribute('aria-expanded', 'false');
        }
      } catch {}
    }
    if (handle === el) el.prepend(btn);
    else handle.appendChild(btn);
  }

  let drag = null;
  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, input, select, textarea, a, canvas, label')) return;
    const r = el.getBoundingClientRect();
    el.style.left = `${r.left}px`;
    el.style.top = `${r.top}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.transform = 'none';
    drag = {
      id: e.pointerId,
      ox: e.clientX - r.left,
      oy: e.clientY - r.top,
      w: r.width,
      h: r.height,
    };
    handle.setPointerCapture(e.pointerId);
    el.classList.add('arrastrando');
    e.preventDefault();
  });

  handle.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const maxL = Math.max(8, window.innerWidth - Math.min(drag.w, window.innerWidth - 16) - 8);
    const maxT = Math.max(8, window.innerHeight - Math.min(drag.h, window.innerHeight - 16) - 8);
    const nl = Math.max(8, Math.min(maxL, e.clientX - drag.ox));
    const nt = Math.max(8, Math.min(maxT, e.clientY - drag.oy));
    el.style.left = `${nl}px`;
    el.style.top = `${nt}px`;
  });

  const soltar = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    el.classList.remove('arrastrando');
  };
  handle.addEventListener('pointerup', soltar);
  handle.addEventListener('pointercancel', soltar);
}
