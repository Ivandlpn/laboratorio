// Perfil longitudinal interactivo de 164,2 km (silueta real LiDAR + rasante Adif)
//
// Fondo cacheado en un lienzo aparte (terreno, rasante coloreada por pendiente, túneles, viaductos, estaciones,
// rejilla de cotas y kilómetros) y, encima, cada fotograma solo la posición actual y el puntero.
// El fondo se rehace al cambiar de tamaño o cada pocos segundos, porque el relieve LiDAR llega por bloques.

const COL_RAMPA = [
  [10, '#10b981'], // < 10 ‰: suave
  [20, '#f59e0b'], // 10-20 ‰: rampa
  [Infinity, '#ef4444'], // > 20 ‰: rampa fuerte
];
const colorPend = (p) => COL_RAMPA.find(([lim]) => Math.abs(p) < lim)[1];

export function crearPerfil({ cvPerfil, Eje3D, MdtCorredor, token, onSaltarPk }) {
  const ctxP = cvPerfil.getContext('2d');
  const fondo = document.createElement('canvas');
  const ctxF = fondo.getContext('2d');

  let zMinP = Infinity, zMaxP = -Infinity;
  for (let i = 0; i < Eje3D.n; i++) {
    if (Eje3D.Z[i] < zMinP) zMinP = Eje3D.Z[i];
    if (Eje3D.Z[i] > zMaxP) zMaxP = Eje3D.Z[i];
  }
  zMinP = Math.max(0, Math.floor((zMinP - 20) / 100) * 100);
  zMaxP = Math.ceil((zMaxP + 60) / 100) * 100;

  const estaciones = Eje3D.edificios
    .filter((e) => e.cat === 'estacion')
    .map((e) => ({ pk: e.pk, nombre: e.nombre.replace(/^Estación\s+/i, '').replace(/-Los Llanos|-Terminal| AV$/g, '') }));
  const cumbre = (Eje3D.saltos || []).find((s) => s.id === 'cumbre');

  let hoverPk = null;
  let ultimoPkActual = Eje3D.pkIni;
  let claveFondo = '', tFondo = 0;

  const tip = document.createElement('div');
  tip.id = 'perfilTooltip';
  tip.hidden = true;
  cvPerfil.parentElement?.appendChild(tip);

  function fmtPkCorto(pk) {
    const m = Math.round(pk);
    return `${Math.floor(m / 1000)}+${String(m % 1000).padStart(3, '0')}`;
  }

  function hitoCercano(pk) {
    const t = Eje3D.tuneles.find((x) => pk >= x.pkIni && pk <= x.pkFin);
    if (t) return t.nombre || 'Túnel';
    const vi = Eje3D.buscarViaductoInfo?.(pk);
    if (vi) return vi.nombre || 'Viaducto';
    if (Eje3D.viaductos.some(([a, b]) => pk >= a && pk <= b)) return 'Viaducto';
    let mejor = null, dMin = 1800;
    for (const s of (Eje3D.saltos || [])) {
      const d = Math.abs(s.pk - pk);
      if (d < dMin) { dMin = d; mejor = s.nombre; }
    }
    return mejor;
  }

  // Geometría común del dibujo (márgenes: cotas a la izquierda, kilómetros y estructuras abajo, estaciones arriba)
  function marco(w, h) {
    const izq = 30, der = 4, arriba = 13, abajo = 15;
    const L = Eje3D.pkFin - Eje3D.pkIni;
    const xDePk = (pk) => izq + ((pk - Eje3D.pkIni) / L) * (w - izq - der);
    const pkDeX = (x) => Eje3D.pkIni + ((x - izq) / (w - izq - der)) * L;
    const base = h - abajo;
    const yDeZ = (z) => base - ((Math.min(zMaxP, Math.max(zMinP, z)) - zMinP) / (zMaxP - zMinP)) * (base - arriba);
    return { izq, der, arriba, abajo, base, xDePk, pkDeX, yDeZ };
  }

  function dibujarFondo(w, h, dpr) {
    fondo.width = Math.round(w * dpr); fondo.height = Math.round(h * dpr);
    const c = ctxF;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const { izq, der, arriba, base, xDePk, pkDeX, yDeZ } = marco(w, h);
    const muted = token('--muted') || '#889690';
    const linea = token('--line') || 'rgba(148,163,184,.3)';
    const mono = '"IBM Plex Mono", monospace';

    // Rejilla de cotas cada 100 m (etiquetas cada 200 m si el lienzo es bajo)
    c.font = `500 9px ${mono}`;
    c.textAlign = 'right'; c.textBaseline = 'middle';
    const pasoEtq = (base - arriba) / ((zMaxP - zMinP) / 100) < 11 ? 200 : 100;
    for (let z = zMinP; z <= zMaxP; z += 100) {
      const y = Math.round(yDeZ(z)) + 0.5;
      c.strokeStyle = linea; c.globalAlpha = 0.55; c.lineWidth = 1;
      c.setLineDash([2, 3]);
      c.beginPath(); c.moveTo(izq, y); c.lineTo(w - der, y); c.stroke();
      c.setLineDash([]); c.globalAlpha = 1;
      if (z % pasoEtq === 0) { c.fillStyle = muted; c.fillText(String(z), izq - 4, y); }
    }

    // Muestreo: una muestra por columna de píxel
    const nCol = Math.max(2, Math.round(w - izq - der));
    const muestras = new Array(nCol + 1);
    for (let k = 0; k <= nCol; k++) {
      const x = izq + k;
      const pk = Math.min(Eje3D.pkFin, Math.max(Eje3D.pkIni, pkDeX(x)));
      const i = Math.min(Eje3D.n - 1, Math.max(0, Math.round((pk - Eje3D.pkIni) / Eje3D.paso)));
      const zTer = MdtCorredor.cotaRegional(Eje3D.E[i], Eje3D.N[i]);
      muestras[k] = { x, pk, zR: Eje3D.Z[i], zT: zTer ?? Eje3D.Z[i] };
    }

    // Terreno (silueta LiDAR/MDT a lo largo del eje)
    const gradT = c.createLinearGradient(0, arriba, 0, base);
    gradT.addColorStop(0, 'rgba(163, 140, 104, 0.55)');
    gradT.addColorStop(1, 'rgba(163, 140, 104, 0.10)');
    c.beginPath();
    c.moveTo(izq, base);
    for (const m of muestras) c.lineTo(m.x, yDeZ(m.zT));
    c.lineTo(w - der, base);
    c.closePath();
    c.fillStyle = gradT; c.fill();
    c.beginPath();
    muestras.forEach((m, k) => (k ? c.lineTo(m.x, yDeZ(m.zT)) : c.moveTo(m.x, yDeZ(m.zT))));
    c.strokeStyle = 'rgba(140, 118, 86, 0.75)'; c.lineWidth = 1; c.stroke();

    // Túneles: monte por encima de la rasante, en azul
    c.fillStyle = 'rgba(14, 165, 233, 0.32)';
    for (const t of Eje3D.tuneles) {
      const ms = muestras.filter((m) => m.pk >= t.pkIni && m.pk <= t.pkFin);
      if (ms.length < 1) {
        const x = xDePk((t.pkIni + t.pkFin) / 2), zr = Eje3D.enPk((t.pkIni + t.pkFin) / 2).Z;
        c.fillRect(x - 1, yDeZ(zr) - 6, 2, 6);
        continue;
      }
      c.beginPath();
      ms.forEach((m, k) => (k ? c.lineTo(m.x, Math.min(yDeZ(m.zT), yDeZ(m.zR) - 4)) : c.moveTo(m.x, Math.min(yDeZ(m.zT), yDeZ(m.zR) - 4))));
      for (let k = ms.length - 1; k >= 0; k--) c.lineTo(ms[k].x, yDeZ(ms[k].zR));
      c.closePath(); c.fill();
    }

    // Viaductos: tablero sobre el valle con pilas hasta el terreno
    c.strokeStyle = 'rgba(16, 185, 129, 0.45)'; c.lineWidth = 1;
    for (const [va, vb] of Eje3D.viaductos) {
      const ms = muestras.filter((m) => m.pk >= va && m.pk <= vb);
      for (let k = 0; k < ms.length; k += 2) {
        const m = ms[k];
        if (m.zR - m.zT < 2) continue;
        c.beginPath(); c.moveTo(m.x + 0.5, yDeZ(m.zR)); c.lineTo(m.x + 0.5, yDeZ(m.zT)); c.stroke();
      }
    }

    // Rasante coloreada por pendiente media en 1 km (tramos de igual color en un solo trazo)
    const zEje = (pk) => Eje3D.Z[Math.min(Eje3D.n - 1, Math.max(0, Math.round((pk - Eje3D.pkIni) / Eje3D.paso)))];
    const pendMedia = (pk) => ((zEje(pk + 500) - zEje(pk - 500)) / 1000) * 1000;
    c.lineWidth = 2; c.lineJoin = 'round'; c.lineCap = 'round';
    let colAct = null;
    for (let k = 1; k < muestras.length; k++) {
      const a = muestras[k - 1], b = muestras[k];
      const pend = pendMedia((a.pk + b.pk) / 2);
      const col = colorPend(pend);
      if (col !== colAct) {
        if (colAct) c.stroke();
        c.beginPath(); c.moveTo(a.x, yDeZ(a.zR)); c.strokeStyle = col; colAct = col;
      }
      c.lineTo(b.x, yDeZ(b.zR));
    }
    if (colAct) c.stroke();

    // Franja de estructuras bajo el eje (viaductos, túneles, subestaciones)
    const yB = base + 2;
    c.fillStyle = '#10b981';
    for (const [va, vb] of Eje3D.viaductos) c.fillRect(xDePk(va), yB, Math.max(2, xDePk(vb) - xDePk(va)), 3);
    c.fillStyle = '#0ea5e9';
    for (const t of Eje3D.tuneles) c.fillRect(xDePk(t.pkIni), yB, Math.max(3, xDePk(t.pkFin) - xDePk(t.pkIni)), 3);
    c.fillStyle = '#f59e0b';
    for (const [sa, sb] of Eje3D.subestaciones) c.fillRect(xDePk((sa + sb) * 0.5) - 1.5, yB - 1, 3, 5);

    // Kilómetros
    c.fillStyle = muted; c.font = `500 9px ${mono}`; c.textBaseline = 'bottom';
    const pasoKm = w < 520 ? 40 : w < 900 ? 20 : 10;
    c.textAlign = 'center';
    for (let km = Math.ceil(Eje3D.pkIni / 1000 / pasoKm) * pasoKm; km * 1000 < Eje3D.pkFin - 3000; km += pasoKm) {
      if (km * 1000 - Eje3D.pkIni < 4000) continue;
      const x = xDePk(km * 1000);
      c.fillText(String(km), x, h);
      c.fillRect(Math.round(x), yB + 4, 1, 2);
    }
    c.textAlign = 'left'; c.fillText(String(Math.round(Eje3D.pkIni / 1000)), izq, h);
    c.textAlign = 'right'; c.fillText(String(Math.round(Eje3D.pkFin / 1000)), w - der, h);

    // Estaciones y cota máxima, arriba
    const fg = token('--fg') || '#e6ece9';
    c.font = `600 9.5px ${mono}`; c.textBaseline = 'top';
    for (const e of estaciones) {
      const x = xDePk(e.pk), y = yDeZ(Eje3D.enPk(e.pk).Z);
      c.strokeStyle = fg; c.globalAlpha = 0.5; c.setLineDash([1, 2]);
      c.beginPath(); c.moveTo(Math.round(x) + 0.5, 11); c.lineTo(Math.round(x) + 0.5, y - 3); c.stroke();
      c.setLineDash([]); c.globalAlpha = 1;
      c.fillStyle = fg;
      c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill();
      c.textAlign = x < izq + 40 ? 'left' : x > w - 50 ? 'right' : 'center';
      c.fillText(e.nombre, x + (c.textAlign === 'left' ? -2 : c.textAlign === 'right' ? 2 : 0), 0);
    }
    if (cumbre && w > 420) {
      const x = xDePk(cumbre.pk), y = yDeZ(Eje3D.enPk(cumbre.pk).Z);
      c.fillStyle = muted; c.font = `500 9px ${mono}`; c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText(`▲ ${Math.round(Eje3D.enPk(cumbre.pk).Z)} m`, x + 4, y - 2);
    }
  }

  function dibujarPerfil(pkActual) {
    ultimoPkActual = pkActual;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(240, cvPerfil.clientWidth), h = Math.max(40, cvPerfil.clientHeight);
    if (cvPerfil.width !== Math.round(w * dpr) || cvPerfil.height !== Math.round(h * dpr)) {
      cvPerfil.width = Math.round(w * dpr); cvPerfil.height = Math.round(h * dpr);
    }
    const ahora = performance.now();
    const clave = `${w}x${h}@${dpr}|${document.documentElement.dataset.theme || ''}|${document.documentElement.dataset.noche || ''}`;
    if (clave !== claveFondo || ahora - tFondo > 3000) {
      dibujarFondo(w, h, dpr);
      claveFondo = clave; tFondo = ahora;
    }
    ctxP.setTransform(1, 0, 0, 1, 0, 0);
    ctxP.clearRect(0, 0, cvPerfil.width, cvPerfil.height);
    ctxP.drawImage(fondo, 0, 0);
    ctxP.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { arriba, base, xDePk, yDeZ } = marco(w, h);

    // Zona activa en 3D (±2 km) y posición actual
    const xc = xDePk(pkActual), pAct = Eje3D.enPk(pkActual), yc = yDeZ(pAct.Z);
    const x0 = xDePk(pkActual - 2000), x1 = xDePk(pkActual + 2000);
    ctxP.fillStyle = 'rgba(244, 63, 94, 0.10)';
    ctxP.fillRect(x0, arriba - 2, Math.max(3, x1 - x0), base - arriba + 2);
    ctxP.strokeStyle = '#f43f5e'; ctxP.lineWidth = 1.5;
    ctxP.beginPath(); ctxP.moveTo(xc, arriba - 2); ctxP.lineTo(xc, base); ctxP.stroke();
    ctxP.fillStyle = '#f43f5e';
    ctxP.beginPath(); ctxP.arc(xc, yc, 4, 0, Math.PI * 2); ctxP.fill();
    ctxP.strokeStyle = 'rgba(255,255,255,.9)'; ctxP.lineWidth = 1.2; ctxP.stroke();

    if (hoverPk !== null) {
      const xh = xDePk(hoverPk), yh = yDeZ(Eje3D.enPk(hoverPk).Z);
      ctxP.save();
      ctxP.setLineDash([3, 3]);
      ctxP.strokeStyle = token('--fg') || 'rgba(248, 250, 252, 0.72)';
      ctxP.globalAlpha = 0.7; ctxP.lineWidth = 1.1;
      ctxP.beginPath(); ctxP.moveTo(xh, arriba - 2); ctxP.lineTo(xh, base); ctxP.stroke();
      ctxP.restore();
      ctxP.fillStyle = token('--fg') || '#f8fafc';
      ctxP.beginPath(); ctxP.arc(xh, yh, 3, 0, Math.PI * 2); ctxP.fill();
    }
  }

  let arrastrandoPerfil = false;
  function pkDesdeEvento(ev) {
    const r = cvPerfil.getBoundingClientRect();
    const { pkDeX } = marco(r.width || 1, r.height || 1);
    const pk = Math.max(Eje3D.pkIni, Math.min(Eje3D.pkFin, pkDeX(ev.clientX - r.left)));
    return { pk, u: (ev.clientX - r.left) / (r.width || 1), r };
  }
  function actualizarTooltip(ev) {
    const { pk, u } = pkDesdeEvento(ev);
    hoverPk = pk;
    const p = Eje3D.enPk(pk);
    const hito = hitoCercano(pk);
    const pend = `${p.pend >= 0 ? '+' : ''}${p.pend.toFixed(1)} ‰`;
    tip.textContent = `PK ${fmtPkCorto(pk)} · ${p.Z.toFixed(0)} m · ${pend}${hito ? ' · ' + hito : ''}`;
    tip.style.left = `${Math.max(8, Math.min(92, u * 100)).toFixed(1)}%`;
    tip.hidden = false;
    dibujarPerfil(ultimoPkActual);
  }
  function saltarDesdeEventoPerfil(ev) {
    onSaltarPk(pkDesdeEvento(ev).pk);
  }
  cvPerfil.addEventListener('pointerdown', (e) => { arrastrandoPerfil = true; cvPerfil.setPointerCapture(e.pointerId); saltarDesdeEventoPerfil(e); actualizarTooltip(e); });
  cvPerfil.addEventListener('pointermove', (e) => { actualizarTooltip(e); if (arrastrandoPerfil) saltarDesdeEventoPerfil(e); });
  cvPerfil.addEventListener('pointerup', () => { arrastrandoPerfil = false; });
  cvPerfil.addEventListener('pointerleave', () => { arrastrandoPerfil = false; hoverPk = null; tip.hidden = true; dibujarPerfil(ultimoPkActual); });

  return { dibujarPerfil };
}
