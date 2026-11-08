/* Visita automática de los visores 3D: al abrir el entorno la cámara recorre sus vistas, cambiando cada pocos segundos con un
   movimiento lento y suave; cada vista se mantiene 5 s. El botón de arriba a la derecha la pausa y la reanuda, y también se
   detiene en cuanto la persona toca el entorno (arrastrar, rueda, teclas, botones del panel).
   Uso: Carrusel3D.iniciar({ ids: ['general', ...], irA(id, duracionMs), intervalo: 5000, duracion: 2600 }). */
(function () {
  window.Carrusel3D = {
    activo: false,
    iniciar(o) {
      const ids = o.ids.slice(), intervalo = Math.max(5000, o.intervalo || 5000), duracion = o.duracion || 2600;
      let i = Math.max(0, ids.indexOf(o.inicio || ids[0])), timer = null, vivo = false;
      const boton = document.createElement('button');
      boton.id = 'btnCarrusel'; boton.type = 'button';
      boton.style.cssText = 'position:fixed;top:calc(12px + env(safe-area-inset-top,0px));right:calc(12px + env(safe-area-inset-right,0px));z-index:9;display:flex;align-items:center;gap:8px;min-height:38px;padding:0 14px;border-radius:12px;border:1px solid var(--line,rgba(255,255,255,.25));background:var(--panel,rgba(20,24,28,.82));color:var(--fg,#fff);font:600 12.5px/1 var(--sans,system-ui,sans-serif);cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:var(--sombra,0 6px 20px rgba(0,0,0,.35))';
      document.body.appendChild(boton);
      const pintar = () => { boton.innerHTML = vivo ? '<span style="width:9px;height:9px;border-radius:50%;background:#2bd96a;box-shadow:0 0 8px #2bd96a"></span>Visita automática<span style="display:inline-flex;align-items:center;gap:4px;margin-left:4px;padding:3px 7px;border-radius:7px;background:rgba(229,53,42,.9);color:#fff;font-size:11px">❚❚ Parar</span>' : '<span style="font-size:11px">▶</span>Reanudar visita automática'; boton.setAttribute('aria-pressed', String(vivo)); boton.title = vivo ? 'Parar la visita automática' : 'Reanudar la visita automática'; };
      const paso = () => { i = (i + 1) % ids.length; o.irA(ids[i], duracion); };
      const parar = () => { if (!vivo) return; vivo = false; window.Carrusel3D.activo = false; clearInterval(timer); pintar(); };
      const arrancar = () => { if (vivo) return; vivo = true; window.Carrusel3D.activo = true; clearInterval(timer); timer = setInterval(paso, intervalo); pintar(); };
      window.Carrusel3D.parar = parar; window.Carrusel3D.reanudar = () => { arrancar(); paso(); };
      boton.addEventListener('click', (e) => { e.stopPropagation(); if (vivo) parar(); else { arrancar(); paso(); } });
      // Cualquier gesto sobre el entorno o el panel detiene la visita (el botón de la visita se trata aparte)
      for (const ev of ['pointerdown', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, (e) => { if (e.target === boton || boton.contains(e.target)) return; if (ev === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return; parar(); }, { capture: true, passive: true });
      if (!o.sinArranque && !matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(() => { if (!vivo && !o.yaTocado?.()) arrancar(); }, o.retraso ?? 1500); else pintar();
      pintar();
    }
  };
})();
