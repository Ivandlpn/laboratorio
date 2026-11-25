/*
 * Sección transversal esquemática en un PK (perpendicular al eje de la línea). Dibuja, a escala 1:1:
 *   · el terreno que se ve en el visor (cartografía de Adif junto a la vía y LiDAR del IGN fuera), muestreado cada 0,5 m;
 *   · las dos vías, con la cabeza de carril a la cota del eje y el entreeje del trazado;
 *   · el hilo de contacto a 5,30 m sobre el carril, con su descentramiento de ±20 cm en ese PK;
 *   · el tablero, si el PK está en un viaducto con ficha (ancho medido).
 * NO incluye la plataforma, la canaleta ni los postes: no hay una sección medida de ellos. Cada trazo dice su origen.
 * Sigue el PK de la cámara; con «Fijar» se queda en un PK y se mueve de 10 en 10 m.
 */
const ANCHO_VIA = 1.435, CABEZA = 0.0, ALTO_HILO = 5.3, SEMI = 32;   // semiancho de la sección (m)
const COLOR = { adif: '#2563eb', fuente: '#0d9488', deducido: '#7c3aed', supuesto: '#d97706' };

export function crearSeccion({ Eje3D, cotaTerrenoUTM, Catenaria, fmtPk, viaductoReal, origen }) {
  let activa = false, fijo = false, pkFijo = 0, pkDibujado = -1, tUltimo = 0;
  const tarjeta = document.createElement('aside');
  tarjeta.id = 'seccion';
  tarjeta.hidden = true;
  tarjeta.setAttribute('aria-label', 'Sección transversal');
  tarjeta.innerHTML = `
    <div class="f-cab"><strong>Sección transversal · <span data-s="pk">PK</span></strong>
      <button type="button" class="f-btn" data-s="cerrar" aria-label="Cerrar la sección" title="Cerrar"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>
    <canvas width="640" height="340" role="img" aria-label="Sección transversal esquemática del PK"></canvas>
    <p class="s-lectura" aria-live="off">Pasa el cursor por el dibujo para leer distancia al eje y altura sobre el carril.</p>
    <div class="acciones"><label class="s-fijar"><input type="checkbox" data-s="fijar"> Fijar PK</label>
      <button type="button" data-s="menos" disabled aria-label="10 m hacia Albacete">−10 m</button><button type="button" data-s="mas" disabled aria-label="10 m hacia Alicante">+10 m</button></div>
    <p class="s-nota">Esquema calculado con el terreno del visor, las vías y el hilo de contacto. No incluye plataforma, canaleta ni postes.</p>`;
  document.body.appendChild(tarjeta);
  const cv = tarjeta.querySelector('canvas'), ctx = cv.getContext('2d');
  const lectura = tarjeta.querySelector('.s-lectura');
  let geo = null;   // { x0, y0, k, zBase } para pasar de pantalla a metros

  function muestrear(pk) {
    const m = Eje3D.enPk(pk);
    const suelo = [];
    for (let o = -SEMI; o <= SEMI + 1e-6; o += 0.5) {
      const E = m.E - m.ty * o, N = m.N + m.tx * o;
      suelo.push([o, cotaTerrenoUTM(E, N) - m.Z]);   // altura del terreno sobre la cabeza de carril del eje
    }
    return { m, suelo };
  }

  function dibujar(pk) {
    pkDibujado = pk;
    tarjeta.querySelector('[data-s="pk"]').textContent = `PK ${fmtPk(pk)}`;
    const { m, suelo } = muestrear(pk);
    const vi = m.viaductoInfo ? viaductoReal(m.viaductoInfo) : null;
    const css = getComputedStyle(tarjeta);
    const fg = css.color, muted = css.getPropertyValue('--muted') || '#888';
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const zs = suelo.map((s) => s[1]);
    const zMin = Math.min(...zs, -2.5) - 1, zMax = Math.max(...zs, ALTO_HILO + 1.2) + 0.8;
    const k = Math.min(W / (2 * SEMI), (H - 26) / (zMax - zMin));          // píxeles por metro (escala 1:1)
    const x0 = W / 2, y0 = H - 14 + zMin * k;                               // y de la cabeza de carril (z = 0)
    geo = { x0, y0, k };
    const X = (o) => x0 + o * k, Y = (z) => y0 - z * k;
    // Reja de referencia cada 10 m (lateral) y 5 m (altura)
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(128,128,128,.22)'; ctx.fillStyle = muted; ctx.font = '11px IBM Plex Mono, monospace';
    for (let o = -30; o <= 30; o += 10) { ctx.beginPath(); ctx.moveTo(X(o), 6); ctx.lineTo(X(o), H - 12); ctx.stroke(); ctx.fillText(`${o}`, X(o) - 8, H - 1); }
    for (let z = Math.ceil(zMin / 5) * 5; z <= zMax; z += 5) { ctx.beginPath(); ctx.moveTo(8, Y(z)); ctx.lineTo(W - 8, Y(z)); ctx.stroke(); ctx.fillText(`${z}`, 10, Y(z) - 2); }
    // Terreno
    ctx.beginPath();
    suelo.forEach(([o, z], i) => (i ? ctx.lineTo(X(o), Y(z)) : ctx.moveTo(X(o), Y(z))));
    ctx.lineTo(X(SEMI), H - 12); ctx.lineTo(X(-SEMI), H - 12); ctx.closePath();
    ctx.fillStyle = 'rgba(13,148,136,.16)'; ctx.fill();
    ctx.strokeStyle = COLOR.fuente; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.stroke(); ctx.setLineDash([]);
    // Tablero del viaducto (ancho medido; canto no medido: solo su cara superior)
    if (vi?.ancho) {
      ctx.strokeStyle = COLOR.fuente; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(-vi.ancho / 2), Y(-0.9)); ctx.lineTo(X(vi.ancho / 2), Y(-0.9)); ctx.stroke();
    }
    // Vías e hilo de contacto
    for (const s of [1, -1]) {
      const c = s * m.sep * 0.5;
      ctx.strokeStyle = COLOR.deducido; ctx.fillStyle = COLOR.deducido; ctx.lineWidth = 2.4;
      for (const d of [-ANCHO_VIA / 2, ANCHO_VIA / 2]) ctx.fillRect(X(c + d) - 2.5, Y(CABEZA + 0.17), 5, 0.17 * k + 3);
      ctx.beginPath(); ctx.moveTo(X(c - ANCHO_VIA / 2 - 0.4), Y(-0.16)); ctx.lineTo(X(c + ANCHO_VIA / 2 + 0.4), Y(-0.16)); ctx.stroke();
      const desc = Catenaria ? Catenaria.descentramiento(pk, s) : 0;
      ctx.beginPath(); ctx.arc(X(c + desc), Y(ALTO_HILO), 4, 0, 7); ctx.fill();
      ctx.strokeStyle = COLOR.deducido; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(X(c + desc), Y(ALTO_HILO)); ctx.lineTo(X(c + desc), Y(CABEZA)); ctx.stroke(); ctx.setLineDash([]);
    }
    // Eje de la línea y entreeje
    ctx.strokeStyle = fg; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.setLineDash([8, 4]);
    ctx.beginPath(); ctx.moveTo(X(0), Y(zMax)); ctx.lineTo(X(0), H - 12); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.fillStyle = fg; ctx.font = '12px IBM Plex Mono, monospace';
    const entre = m.sep.toFixed(2).replace('.', ',');
    ctx.fillText(`entreeje ${entre} m · hilo a 5,30 m sobre el carril${m.enTunel ? ' · EN TÚNEL: el terreno dibujado es el monte' : ''}`, 12, 16);
    ctx.fillStyle = muted; ctx.font = '11px IBM Plex Mono, monospace';
    ctx.fillText('izq.', 12, H - 14); ctx.fillText('der.', W - 34, H - 14);
    ctx.fillText(`origen · ${origen.terreno}`, 12, 30);
    ctx.strokeStyle = COLOR.fuente; ctx.setLineDash([6, 3]); ctx.beginPath(); ctx.moveTo(W - 100, 24); ctx.lineTo(W - 70, 24); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillText('terreno', W - 64, 28);
    ctx.fillStyle = COLOR.deducido; ctx.fillRect(W - 100, 36, 30, 3); ctx.fillStyle = muted; ctx.fillText('calculado', W - 64, 42);
  }

  cv.addEventListener('pointermove', (e) => {
    if (!geo) return;
    const r = cv.getBoundingClientRect(), sc = cv.width / r.width;
    const o = ((e.clientX - r.left) * sc - geo.x0) / geo.k, z = (geo.y0 - (e.clientY - r.top) * sc) / geo.k;
    lectura.textContent = `${Math.abs(o).toFixed(1).replace('.', ',')} m a la ${o >= 0 ? 'izquierda' : 'derecha'} del eje · ${z >= 0 ? '+' : '−'}${Math.abs(z).toFixed(1).replace('.', ',')} m sobre el carril`;
  });
  tarjeta.addEventListener('change', (e) => {
    if (e.target.dataset.s !== 'fijar') return;
    fijo = e.target.checked;
    for (const b of tarjeta.querySelectorAll('[data-s="menos"],[data-s="mas"]')) b.disabled = !fijo;
    if (fijo) pkFijo = pkDibujado;
  });
  tarjeta.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-s]');
    if (!b) return;
    if (b.dataset.s === 'cerrar') activar(false);
    else if (b.dataset.s === 'menos' || b.dataset.s === 'mas') {
      pkFijo = Math.max(Eje3D.pkIni, Math.min(Eje3D.pkFin, pkFijo + (b.dataset.s === 'mas' ? 10 : -10)));
      dibujar(pkFijo);
    }
  });

  function activar(on, pk) {
    activa = typeof on === 'boolean' ? on : !activa;
    tarjeta.hidden = !activa;
    document.body.classList.toggle('con-seccion', activa);
    if (activa && pk != null) dibujar(pk);
    return activa;
  }
  return {
    get activa() { return activa; },
    activar,
    /** Cada fotograma: redibuja si la cámara ha avanzado ≥ 2 m (como mucho cuatro veces por segundo). */
    actualizar(pk) {
      if (!activa || fijo) return;
      const t = performance.now();
      if (Math.abs(pk - pkDibujado) < 2 || t - tUltimo < 250) return;
      tUltimo = t;
      dibujar(pk);
    },
  };
}
