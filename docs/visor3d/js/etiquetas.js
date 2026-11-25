/*
 * Etiquetas 3D sin choques: de las que se solapan en pantalla se queda la de más prioridad (estación, energía, GSM-R, resto,
 * PK) y, a igualdad, la más cercana al centro de la vista; las demás se ocultan y la que gana lleva un «+n». Las que quedan
 * bajo un panel de la interfaz también se ocultan. Se recalcula unas 4 veces por segundo, no en cada fotograma.
 * No toca la posición ni el contenido de las etiquetas: solo la clase `etq-oculta` y el atributo `data-mas`.
 */
const PRIORIDAD = { estacion: 0, energia: 1, bts: 2, et: 2, base: 3, civil: 3 };
const OBSTACULOS = ['panel', 'ficha', 'cab', 'barraPerfil', 'islaRapida', 'panelEmplazamientos', 'badgePkLinea', 'medidor', 'seccion', 'leyendaConfianza', 'panelTrenesReales', 'mandosCamara', 'brujula'];

export function crearOrdenEtiquetas(raiz) {
  let t = 0;
  const solapa = (a, b, m = 3) => a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m;
  return {
    actualizar() {
      const ahora = performance.now();
      if (ahora - t < 250) return;
      t = ahora;
      const cx = innerWidth / 2, cy = innerHeight / 2;
      const huecos = OBSTACULOS.map((id) => document.getElementById(id)).filter((e) => e && !e.hidden && getComputedStyle(e).display !== 'none').map((e) => e.getBoundingClientRect());
      const lista = [];
      for (const el of raiz.querySelectorAll('.etq-edif, .etq')) {
        if (el.parentElement && el.parentElement.style.display === 'none') continue;
        const r = el.getBoundingClientRect();
        if (!r.width || r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) { el.classList.remove('etq-oculta'); el.removeAttribute('data-mas'); continue; }
        const prio = el.classList.contains('etq') ? 9 : (PRIORIDAD[el.dataset.cat] ?? (el.classList.contains('etq-emp') ? 4 : 5));
        lista.push({ el, r, prio, d: Math.hypot((r.left + r.right) / 2 - cx, (r.top + r.bottom) / 2 - cy) });
      }
      lista.sort((a, b) => a.prio - b.prio || a.d - b.d);
      const puestas = [];
      for (const it of lista) {
        const bajoPanel = huecos.some((h) => solapa(it.r, h, 0));
        const gana = bajoPanel ? null : puestas.find((p) => solapa(p.r, it.r));
        if (!bajoPanel && !gana) { puestas.push({ ...it, mas: 0 }); it.el.classList.remove('etq-oculta'); it.el.removeAttribute('data-mas'); }
        else { it.el.classList.add('etq-oculta'); if (gana) gana.mas++; }
      }
      for (const p of puestas) { if (p.mas) p.el.setAttribute('data-mas', String(p.mas)); else p.el.removeAttribute('data-mas'); }
    },
    /** Deja todas visibles (por ejemplo al desactivar las etiquetas). */
    limpiar() { for (const el of raiz.querySelectorAll('.etq-oculta')) el.classList.remove('etq-oculta'); },
  };
}
