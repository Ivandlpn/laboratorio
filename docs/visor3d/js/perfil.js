// Perfil longitudinal interactivo de 164,2 km (silueta real LiDAR + rasante Adif)

export function crearPerfil({ cvPerfil, Eje3D, MdtCorredor, token, onSaltarPk }) {
  const ctxP = cvPerfil.getContext('2d');
  let zMinP = Infinity, zMaxP = -Infinity;
  for (let i = 0; i < Eje3D.n; i++) {
    if (Eje3D.Z[i] < zMinP) zMinP = Eje3D.Z[i];
    if (Eje3D.Z[i] > zMaxP) zMaxP = Eje3D.Z[i];
  }
  zMinP = Math.max(0, zMinP - 25); zMaxP += 75;

  let hoverPk = null;
  let ultimoPkActual = Eje3D.pkIni;

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
    const v = Eje3D.viaductos.find(([a, b]) => pk >= a && pk <= b);
    if (v) return 'Viaducto';
    let mejor = null, dMin = 1800;
    for (const s of (Eje3D.saltos || [])) {
      const d = Math.abs(s.pk - pk);
      if (d < dMin) { dMin = d; mejor = s.nombre; }
    }
    return mejor;
  }

  function dibujarPerfil(pkActual) {
    ultimoPkActual = pkActual;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(240, cvPerfil.clientWidth), h = Math.max(36, cvPerfil.clientHeight);
    if (cvPerfil.width !== Math.round(w * dpr) || cvPerfil.height !== Math.round(h * dpr)) {
      cvPerfil.width = Math.round(w * dpr); cvPerfil.height = Math.round(h * dpr);
    }
    ctxP.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxP.clearRect(0, 0, w, h);
    const L_PK = Eje3D.pkFin - Eje3D.pkIni;
    const xDePk = (pk) => ((pk - Eje3D.pkIni) / L_PK) * w;
    const yDeZ = (z) => h - 12 - ((Math.min(zMaxP, Math.max(zMinP, z)) - zMinP) / (zMaxP - zMinP)) * (h - 17);

    ctxP.beginPath();
    const pasoM = Math.max(1, Math.floor(Eje3D.n / 300));
    ctxP.moveTo(0, h - 12);
    for (let i = 0; i < Eje3D.n; i += pasoM) {
      const zTer = MdtCorredor.cotaRegional(Eje3D.E[i], Eje3D.N[i]) ?? Eje3D.Z[i];
      ctxP.lineTo(xDePk(Eje3D.pkIni + i * Eje3D.paso), yDeZ(zTer));
    }
    ctxP.lineTo(w, h - 12);
    ctxP.closePath();
    ctxP.fillStyle = 'rgba(148, 163, 184, 0.20)';
    ctxP.fill();

    ctxP.beginPath();
    ctxP.moveTo(0, h - 12);
    for (let i = 0; i < Eje3D.n; i += pasoM) ctxP.lineTo(xDePk(Eje3D.pkIni + i * Eje3D.paso), yDeZ(Eje3D.Z[i]));
    ctxP.lineTo(w, yDeZ(Eje3D.Z[Eje3D.n - 1]));
    ctxP.lineTo(w, h - 12);
    ctxP.closePath();
    const grad = ctxP.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.34)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.04)');
    ctxP.fillStyle = grad;
    ctxP.fill();

    ctxP.beginPath();
    for (let i = 0; i < Eje3D.n; i += pasoM) {
      const px = xDePk(Eje3D.pkIni + i * Eje3D.paso), py = yDeZ(Eje3D.Z[i]);
      if (i === 0) ctxP.moveTo(px, py); else ctxP.lineTo(px, py);
    }
    ctxP.strokeStyle = '#10b981';
    ctxP.lineWidth = 1.6;
    ctxP.stroke();

    ctxP.fillStyle = '#10b981';
    for (const [va, vb] of Eje3D.viaductos) ctxP.fillRect(xDePk(va), h - 10, Math.max(2, xDePk(vb) - xDePk(va)), 3);
    ctxP.fillStyle = '#0ea5e9';
    for (const t of Eje3D.tuneles) ctxP.fillRect(xDePk(t.pkIni), h - 10, Math.max(3, xDePk(t.pkFin) - xDePk(t.pkIni)), 3);
    ctxP.fillStyle = '#f59e0b';
    for (const [sa, sb] of Eje3D.subestaciones) ctxP.fillRect(xDePk((sa + sb) * 0.5) - 1.5, h - 11, 3, 5);

    ctxP.fillStyle = token('--muted') || '#889690';
    ctxP.font = '500 9.5px "IBM Plex Mono", monospace';
    ctxP.textBaseline = 'bottom';
    ctxP.textAlign = 'left'; ctxP.fillText('Albacete 322', 2, h);
    ctxP.textAlign = 'right'; ctxP.fillText('486 Alicante', w - 2, h);
    ctxP.textAlign = 'center';
    const hitosEje = w < 460 ? [405] : [355, 380, 405, 430, 455];
    for (const kmM of hitosEje) ctxP.fillText(String(kmM), xDePk(kmM * 1000), h);

    const xc = xDePk(pkActual), pAct = Eje3D.enPk(pkActual), yc = yDeZ(pAct.Z);
    ctxP.strokeStyle = '#f43f5e';
    ctxP.lineWidth = 1.5;
    ctxP.beginPath(); ctxP.moveTo(xc, 2); ctxP.lineTo(xc, h - 10); ctxP.stroke();
    ctxP.fillStyle = '#f43f5e';
    ctxP.beginPath(); ctxP.arc(xc, yc, 3.6, 0, Math.PI * 2); ctxP.fill();

    if (hoverPk !== null) {
      const xh = xDePk(hoverPk);
      ctxP.save();
      ctxP.setLineDash([3, 3]);
      ctxP.strokeStyle = 'rgba(248, 250, 252, 0.72)';
      ctxP.lineWidth = 1.1;
      ctxP.beginPath(); ctxP.moveTo(xh, 2); ctxP.lineTo(xh, h - 10); ctxP.stroke();
      ctxP.restore();
    }
  }

  let arrastrandoPerfil = false;
  function pkDesdeEvento(ev) {
    const r = cvPerfil.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (ev.clientX - r.left) / (r.width || 1)));
    return { pk: Eje3D.pkIni + u * (Eje3D.pkFin - Eje3D.pkIni), u, r };
  }
  function actualizarTooltip(ev) {
    const { pk, u } = pkDesdeEvento(ev);
    hoverPk = pk;
    const p = Eje3D.enPk(pk);
    const hito = hitoCercano(pk);
    tip.textContent = `PK ${fmtPkCorto(pk)} · ${p.Z.toFixed(0)} m${hito ? ' · ' + hito : ''}`;
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
