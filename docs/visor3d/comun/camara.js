/* Manejo de la cámara de los visores 3D al estilo de Google Maps (sin dependencias propias):
   - arrastrar con el botón izquierdo (o un dedo) desplaza el entorno: el punto que agarras sigue al cursor,
   - botón derecho o Ctrl/Cmd + arrastrar (o dos dedos) gira e inclina,
   - la rueda acerca y aleja hacia el punto que señala el cursor, no hacia el centro,
   - doble clic acerca al punto señalado (Mayús + doble clic, aleja),
   - teclado: Q/E giran, + / − acercan y alejan (las flechas y Re Pág/Av Pág las atiende cada visor),
   - la cámara no se aleja del entorno más de `limite` metros.
   Uso: Camara3D.configurar(THREE, orbita, { camara, escena, dom, limite }) justo después de crear los OrbitControls. */
(function () {
  window.Camara3D = {
    configurar(THREE, orbita, o) {
      const { camara, escena, dom } = o, limite = o.limite || 900;
      orbita.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
      orbita.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
      orbita.screenSpacePanning = true; orbita.zoomToCursor = true;
      orbita.enableDamping = true; orbita.dampingFactor = 0.09;
      orbita.rotateSpeed = 0.75; orbita.zoomSpeed = 1.15; orbita.panSpeed = 1;

      // Cursor de mano, como el mapa
      dom.style.cursor = 'grab';
      dom.addEventListener('pointerdown', (e) => { if (orbita.enabled) dom.style.cursor = e.button === 2 || e.ctrlKey || e.metaKey ? 'move' : 'grabbing'; });
      addEventListener('pointerup', () => { dom.style.cursor = orbita.enabled ? 'grab' : ''; });

      // El entorno no se puede perder de vista arrastrando sin fin
      orbita.addEventListener('change', () => {
        const t = orbita.target, d = Math.hypot(t.x, t.z);
        if (d > limite) { const k = limite / d; camara.position.x -= t.x * (1 - k); camara.position.z -= t.z * (1 - k); t.x *= k; t.z *= k; }
      });

      // Doble clic: acerca (o aleja con Mayús) hacia el punto señalado
      const rayo = new THREE.Raycaster(), v2 = new THREE.Vector2();
      let tween = null;
      dom.addEventListener('dblclick', (e) => {
        if (!orbita.enabled) return;
        const r = dom.getBoundingClientRect();
        v2.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
        rayo.setFromCamera(v2, camara); rayo.camera = camara;
        const hit = rayo.intersectObjects(escena.children, true).find((h) => {
          if (!h.object.isMesh || h.object.material.side === THREE.BackSide || h.distance > orbita.maxDistance * 3) return false;
          for (let p = h.object; p; p = p.parent) if (!p.visible) return false;
          return true;
        });
        if (!hit) return;
        const dir = e.shiftKey ? -0.6 : 0.5, p0 = camara.position.clone(), t0 = orbita.target.clone(), t1 = hit.point.clone();
        // Nueva posición: la cámara se acerca a medio camino del punto y el objetivo pasa a ser ese punto
        const dest = dir > 0 ? p0.clone().lerp(t1, dir) : p0.clone().add(p0.clone().sub(t1).multiplyScalar(-dir));
        if (dest.distanceTo(t1) < Math.max(orbita.minDistance, 0.5)) return;
        const t00 = performance.now(), dur = 420;
        tween = { t00, dur };
        const paso = () => {
          if (!tween || tween.t00 !== t00) return;
          const k = Math.min(1, (performance.now() - t00) / dur), s = k * k * (3 - 2 * k);
          camara.position.lerpVectors(p0, dest, s); orbita.target.lerpVectors(t0, t1, s); orbita.update();
          if (k < 1) requestAnimationFrame(paso); else tween = null;
        };
        requestAnimationFrame(paso);
      });
      for (const ev of ['pointerdown', 'wheel']) dom.addEventListener(ev, () => { tween = null; }, { passive: true });

      // Teclado: Q/E giran y + / − acercan o alejan mientras se mantienen pulsadas
      const teclas = new Set();
      addEventListener('keydown', (e) => { if (e.ctrlKey || e.metaKey || e.altKey || (e.target && e.target.closest && e.target.closest('input,textarea,select'))) return; const k = e.key.toLowerCase(); if (['q', 'e', '+', '=', '-', '_'].includes(k)) teclas.add(k); });
      addEventListener('keyup', (e) => teclas.delete(e.key.toLowerCase()));
      addEventListener('blur', () => teclas.clear());
      let previo = performance.now();
      const bucle = (ahora) => {
        const dt = Math.min(0.1, (ahora - previo) / 1000); previo = ahora;
        if (orbita.enabled && teclas.size && !document.hidden) {
          const off = camara.position.clone().sub(orbita.target);
          const giro = ((teclas.has('q') ? 1 : 0) - (teclas.has('e') ? 1 : 0)) * 1.1 * dt;
          if (giro) off.applyAxisAngle(new THREE.Vector3(0, 1, 0), giro);
          const zoom = ((teclas.has('+') || teclas.has('=') ? 1 : 0) - (teclas.has('-') || teclas.has('_') ? 1 : 0)) * 1.3 * dt;
          if (zoom) off.setLength(Math.max(orbita.minDistance, Math.min(orbita.maxDistance, off.length() * Math.exp(-zoom))));
          camara.position.copy(orbita.target).add(off);
        }
        requestAnimationFrame(bucle);
      };
      requestAnimationFrame(bucle);

      // Texto de ayuda de la vista de órbita
      const ayuda = document.getElementById('ayuda');
      if (ayuda) ayuda.textContent = ayuda.textContent.replace('Arrastra para girar, rueda o pellizco para acercar.', 'Arrastra para mover el entorno, como en Google Maps; botón derecho o Ctrl + arrastrar para girar e inclinar; la rueda acerca hacia el cursor y el doble clic acerca al punto. Q/E giran y +/− acercan.');
    }
  };
})();
