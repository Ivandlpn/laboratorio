/*
 * Guía de la cámara para la primera visita: tres tarjetas animadas (desplazar, girar, acercar) con el gesto del ratón
 * en el PC o de los dedos en el móvil, según los controles reales del visor (comun/camara.js):
 *   PC   · botón izquierdo arrastrar = desplazar · botón derecho (o Ctrl + arrastrar) = girar e inclinar · rueda = zoom
 *   móvil· un dedo = desplazar · dos dedos girando = girar · pellizcar = zoom
 * Se muestra una sola vez (localStorage); ?guia la fuerza para revisarla.
 */
const CLAVE = 'visor3d.guiaCamara.v1';

const RATON = (boton) => `
    <rect x="20" y="8" width="24" height="40" rx="12" class="g-cuerpo"/>
    <path d="M32 8 V22 M20 22 H44" class="g-linea"/>
    ${boton === 'izq' ? '<path d="M20 22 V20 A12 12 0 0 1 32 8 V22 Z" class="g-activo"/>' : ''}
    ${boton === 'der' ? '<path d="M44 22 V20 A12 12 0 0 0 32 8 V22 Z" class="g-activo"/>' : ''}
    ${boton === 'rueda' ? '<rect x="29.5" y="11" width="5" height="9" rx="2.5" class="g-activo g-rueda"/>' : ''}`;

const DEDO = (x, y, cls = '') => `<g class="g-dedo ${cls}"><circle cx="${x}" cy="${y}" r="7" class="g-yema"/><circle cx="${x}" cy="${y}" r="12" class="g-onda"/></g>`;

const TARJETAS = {
  pc: [
    { t: 'Desplazar', d: 'Arrastra con el <b>botón izquierdo</b>', svg: `${RATON('izq')}<g class="g-anim g-mover"><path d="M8 54 H56 M50 49 L56 54 L50 59 M14 49 L8 54 L14 59" class="g-flecha"/></g>` },
    { t: 'Girar e inclinar', d: 'Arrastra con el <b>botón derecho</b> o <b>Ctrl</b> + arrastrar', svg: `${RATON('der')}<g class="g-anim g-girar"><path d="M10 40 A22 22 0 0 0 54 40" class="g-flecha"/><path d="M48 36 L54 40 L56 33" class="g-flecha"/></g>` },
    { t: 'Acercar y alejar', d: 'Gira la <b>rueda</b> · doble clic acerca al punto', svg: `${RATON('rueda')}<g class="g-anim g-zoom"><circle cx="50" cy="50" r="7" class="g-flecha"/><path d="M55 55 L60 60 M47 50 H53 M50 47 V53" class="g-flecha"/></g>` },
  ],
  tactil: [
    { t: 'Desplazar', d: 'Arrastra con <b>un dedo</b>', svg: `<rect x="14" y="4" width="36" height="56" rx="6" class="g-cuerpo"/><g class="g-anim g-mover">${DEDO(32, 34)}</g>` },
    { t: 'Girar e inclinar', d: 'Gira o arrastra con <b>dos dedos</b>', svg: `<rect x="14" y="4" width="36" height="56" rx="6" class="g-cuerpo"/><g class="g-anim g-girar" style="transform-origin:32px 32px">${DEDO(24, 32)}${DEDO(40, 32)}</g>` },
    { t: 'Acercar y alejar', d: '<b>Pellizca</b> o separa dos dedos', svg: `<rect x="14" y="4" width="36" height="56" rx="6" class="g-cuerpo"/><g class="g-anim g-pinza-a">${DEDO(26, 38)}</g><g class="g-anim g-pinza-b">${DEDO(38, 26)}</g>` },
  ],
};

export function mostrarGuiaCamara({ forzar = false, retraso = 900 } = {}) {
  let vista = false;
  try { vista = localStorage.getItem(CLAVE) === '1'; } catch { /* sin almacenamiento */ }
  if (vista && !forzar) return;
  const tactil = matchMedia('(pointer: coarse)').matches;
  const el = document.createElement('div');
  el.id = 'guiaCamara';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Cómo mover la cámara');
  el.innerHTML = `
    <div class="g-caja">
      <p class="g-pre">${tactil ? 'Con los dedos' : 'Con el ratón'}</p>
      <h2>Mueve la cámara a tu gusto</h2>
      <div class="g-tarjetas">
        ${TARJETAS[tactil ? 'tactil' : 'pc'].map((c) => `
          <div class="g-tarjeta">
            <div class="g-ilus"><svg viewBox="0 0 64 64" class="g-dispositivo" aria-hidden="true">${c.svg}</svg></div>
            <strong>${c.t}</strong><span>${c.d}</span>
          </div>`).join('')}
      </div>
      <p class="g-nota">El dron graba el tren solo. Al tocar la escena tomas el mando; <b>🎥 Auto</b> lo devuelve al vuelo de cine.</p>
      <button type="button" class="g-ok">Entendido</button>
    </div>`;
  const cerrar = () => {
    try { localStorage.setItem(CLAVE, '1'); } catch { /* sin almacenamiento */ }
    el.classList.add('g-fuera');
    setTimeout(() => el.remove(), 350);
  };
  el.querySelector('.g-ok').addEventListener('click', cerrar);
  el.addEventListener('click', (e) => { if (e.target === el) cerrar(); });
  addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { cerrar(); removeEventListener('keydown', esc); } });
  setTimeout(() => { document.body.appendChild(el); el.querySelector('.g-ok').focus({ preventScroll: true }); }, retraso);
}
