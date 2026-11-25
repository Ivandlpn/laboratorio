/*
 * Iconos propios del visor: trazo de 1,8 px sobre una rejilla de 24, en `currentColor`, así siguen el tema y el estado del botón
 * (los emojis cambian con el sistema operativo y no se pueden colorear). Uso: icono('luna') devuelve el <svg> como texto;
 * botonIcono(el, 'luna', 'Noche') pinta icono + rótulo en un botón.
 */
const T = {
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
  amanecer: '<path d="M4 18h16M7 18a5 5 0 0110 0M12 6v3M5.6 10.6l1.6 1.6M18.4 10.6l-1.6 1.6M2.5 14.5h2M19.5 14.5h2"/>',
  atardecer: '<path d="M4 18h16M7 18a5 5 0 0110 0M12 5v4M9.5 7.5L12 10l2.5-2.5M3 21h18"/>',
  luna: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  despejado: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
  bruma: '<path d="M4 9h16M3 13h14M6 17h15"/>',
  nublado: '<path d="M7 18a4 4 0 01-.5-7.97A5.5 5.5 0 0117 9.5 4.25 4.25 0 0117.5 18z"/>',
  lluvia: '<path d="M7 14a4 4 0 01-.5-7.97A5.5 5.5 0 0117 5.5 4.25 4.25 0 0117.5 14zM8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
  nieve: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5L12 6.5l2.5-2M9.5 19.5l2.5-2 2.5 2"/>',
  tormenta: '<path d="M7 14a4 4 0 01-.5-7.97A5.5 5.5 0 0117 5.5 4.25 4.25 0 0117.5 14zM12.5 12l-3 4h3l-1.5 4"/>',
  tren: '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12M9 20l-2 2M15 20l2 2M9.5 14.5h.01M14.5 14.5h.01"/>',
  obras: '<path d="M3 21h18M5 21l2-9h10l2 9M8.5 12L9 7h6l.5 5M7 16.5h10"/>',
  vivo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
  rayosx: '<path d="M2 20l6.5-10 4 5 3-3.5L22 20zM8.5 10l1.8 2.5"/>',
  audio: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>',
  silencio: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5"/>',
  cine: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M8 6l-2 4M13 6l-2 4M18 6l-2 4"/>',
  mandos: '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 10v4M6 12h4M15.5 11h.01M18 13h.01"/>',
  perfil: '<path d="M3 18l4.5-7 3.5 4 3-6 6 9"/><path d="M3 21h18"/>',
  hitos: '<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 000 8.4M16.2 7.8a6 6 0 010 8.4M5 5a10 10 0 000 14M19 5a10 10 0 010 14"/>',
  ambiente: '<circle cx="9" cy="9" r="3"/><path d="M9 3v1.5M3 9h1.5M4.8 4.8l1 1M13.2 4.8l-1 1M8 20a3.5 3.5 0 01-.3-7 4.5 4.5 0 018.6 1.3A3 3 0 0116.5 20z"/>',
  medir: '<path d="M3 17l14-14 4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2"/>',
  seccion: '<path d="M3 12h18M12 3v18M4 18c4-1 5-5 8-5s4 4 8 5M12 12V5"/>',
  confianza: '<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>',
  enlace: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  captura: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>',
  buscar: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.5M12 17h.01"/>',
  girar: '<path d="M20 12a8 8 0 11-2.6-5.9M20 4v4.5h-4.5"/>',
  inclinar: '<path d="M4 17c3-7 13-7 16 0M12 8v-3M9.5 6.5l2.5-2.5 2.5 2.5"/>',
};

export function icono(nombre, clase = 'ico') {
  const d = T[nombre];
  return d ? `<svg class="${clase}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>` : '';
}

/** Pone icono + rótulo en un botón sin tocar sus atributos; con `soloIcono` el rótulo va solo en aria-label. */
export function botonIcono(el, nombre, rotulo, { soloIcono = false } = {}) {
  if (!el) return;
  el.innerHTML = soloIcono ? icono(nombre) : `${icono(nombre)}<span>${rotulo}</span>`;
  if (soloIcono) el.setAttribute('aria-label', rotulo);
}

export const NOMBRES_ICONO = Object.keys(T);
