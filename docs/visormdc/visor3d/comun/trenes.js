/* Libreas de los trenes de los visores 3D: Renfe (AVE), Ouigo, Iryo y Avlo (modelo genérico de cada visor, repintado).
   `aplicar(tren, marca, { mBlanco, mBanda, coches })` recolorea la carrocería, la franja baja y añade los dibujos laterales con el
   logotipo de cada operador: «renfe» morado, círculo magenta de OUIGO y «iryo» (en blanco sobre el rojo del tren).
   Los logotipos se dibujan con su color y su forma (no se piden imágenes de logotipos).
   `espaciar(trenes, hueco)` reparte la salida de los trenes para que en una misma vía no circulen dos a la vez. */
(function () {
  let T = null;
  const cache = {};

  const MARCAS = {
    renfe: { nombre: 'Renfe AVE', cuerpo: '#f3f4f6', banda: '#70205a' },
    ouigo: { nombre: 'Ouigo', cuerpo: '#f4f5f6', banda: '#e6007e' },
    iryo: { nombre: 'Iryo', cuerpo: '#c8102e', banda: '#8e949a' },
    avlo: { nombre: 'Avlo', cuerpo: '#8a2c86', banda: '#2ec4e8' }
  };
  const COLOR = { renfe: '#70205a', ouigo: '#e6007e', iryo: '#d7141f' };

  /** Logotipo de la marca centrado en (cx, cy) con altura h. `blanco` lo dibuja en blanco (sobre fondo de color). */
  function logo(x, marca, cx, cy, h, blanco, im) {
    x.save(); x.textAlign = 'center'; x.textBaseline = 'middle';
    if (im) {
      const k = h * (marca === 'ouigo' ? 1.15 : 1.0) / im.height, w = im.width * k, hh = im.height * k;
      if (blanco) { x.filter = 'brightness(0) invert(1)'; }
      x.drawImage(im, cx - w / 2, cy - hh / 2, w, hh); x.restore(); return;
    }
    if (marca === 'renfe') {
      // Palabra en minúsculas, gruesa y con los remates inclinados del logotipo de Renfe
      x.translate(cx, cy); x.transform(1, 0, -0.2, 1, 0, 0);
      x.fillStyle = blanco ? '#ffffff' : COLOR.renfe; x.font = `800 ${h}px "Segoe UI", "Trebuchet MS", Arial, sans-serif`;
      try { x.letterSpacing = `${-h * 0.03}px`; } catch (e) { /* sin letterSpacing */ }
      x.fillText('renfe', 0, h * 0.04);
    } else if (marca === 'ouigo') {
      // Círculo magenta con OUIGO en blanco
      x.fillStyle = COLOR.ouigo; x.beginPath(); x.arc(cx, cy, h * 0.58, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.font = `800 ${h * 0.34}px "Arial Rounded MT Bold", "Segoe UI", Arial, sans-serif`;
      try { x.letterSpacing = `${-h * 0.01}px`; } catch (e) { /* */ }
      x.fillText('OUIGO', cx, cy + h * 0.02);
    } else if (marca === 'iryo') {
      x.fillStyle = blanco ? '#ffffff' : COLOR.iryo; x.font = `900 ${h}px "Segoe UI Black", "Arial Black", "Segoe UI", Arial, sans-serif`;
      try { x.letterSpacing = `${-h * 0.06}px`; } catch (e) { /* */ }
      x.fillText('iryo', cx, cy);
    }
    x.restore();
  }

  function lienzo(ancho, alto, marca, dibujar) {
    const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
    const x = c.getContext('2d'); dibujar(x, ancho, alto, null);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    return new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.4, metalness: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  }
  // El lienzo cubre 3,2 m de alto: y = 0 es la cota 3,5 m del coche y y = alto el suelo (0,3 m)
  const mz = (h, m) => h * (3.5 - m) / 3.2;

  function dibujoCoche(marca, cabeza) {
    return lienzo(cabeza ? 560 : 1000, 180, marca, (x, w, h, im) => {
      const L = cabeza ? 10 : 18, px = (m) => m / L * w, py = (m) => mz(h, m), cx = px(cabeza ? L * 0.62 : L / 2);
      if (marca === 'renfe') {
        // Renfe AVE: zócalo gris, filete morado, logotipo «renfe» y «AVE»
        x.fillStyle = '#9aa0a8'; x.fillRect(0, py(0.95), w, py(0.3) - py(0.95));
        x.fillStyle = COLOR.renfe; x.fillRect(0, py(1.2), w, h * 0.016);
        logo(x, 'renfe', cx, py(3.02), h * 0.17, false, im);
        x.fillStyle = COLOR.renfe; x.font = `800 ${h * 0.1}px "Segoe UI", Arial, sans-serif`; x.textAlign = 'center'; x.fillText('AVE', cx, py(0.62));
      } else if (marca === 'ouigo') {
        // Grandes círculos turquesa en las puertas, puertas magenta y el círculo de OUIGO
        x.fillStyle = '#1fb7c9';
        for (const c of (cabeza ? [2.4] : [2.2, 15.8])) { x.beginPath(); x.arc(px(c), py(1.6), px(1.25), 0, 7); x.fill(); }
        x.fillStyle = COLOR.ouigo; for (const c of (cabeza ? [2.4] : [2.2, 15.8])) x.fillRect(px(c - 0.45), py(2.6), px(0.9), py(0.4) - py(2.6));
        logo(x, 'ouigo', cx, py(2.55), h * 0.36, false, im);
      } else if (marca === 'iryo') {
        // Zócalo plateado, filete blanco y logotipo en blanco sobre el rojo
        x.fillStyle = '#c9ced3'; x.fillRect(0, py(0.95), w, py(0.3) - py(0.95));
        x.fillStyle = '#ffffff'; x.fillRect(0, py(1.2), w, h * 0.012);
        logo(x, 'iryo', cx, py(3.0), h * 0.2, true, im);
      } else {
        // Avlo: olas turquesa, naranja y blanca bajo las ventanas y rótulo
        const ola = (color, ancho, dy) => { x.strokeStyle = color; x.lineWidth = h * ancho; x.beginPath(); x.moveTo(0, py(1.0 + dy)); x.bezierCurveTo(w * 0.3, py(1.55 + dy), w * 0.55, py(0.4 + dy), w, py(1.0 + dy)); x.stroke(); };
        ola('#2ec4e8', 0.05, 0.0); ola('#f7941d', 0.035, -0.12); ola('#ffffff', 0.02, -0.22);
        x.fillStyle = '#ffffff'; x.font = `800 ${h * 0.14}px "Segoe UI", Arial, sans-serif`; x.textAlign = 'center';
        x.fillText('avlo', px(cabeza ? L * 0.55 : L / 2), py(3.0));
      }
    });
  }

  window.Trenes3D = {
    MARCAS, logo,
    init(THREE) { T = THREE; },
    aplicar(tren, marca, o) {
      const m = MARCAS[marca]; if (!m || !T) return;
      o.mBlanco.color.set(m.cuerpo); o.mBanda.color.set(m.banda);
      const W = 2.9, y0 = 0.3 + 1.6, alto = 3.2, L = 18, nC = o.coches;
      const coche = (cache[marca + 'c'] ||= dibujoCoche(marca, false)), cab = (cache[marca + 'h'] ||= dibujoCoche(marca, true));
      const plano = (cx, ancho, mat, lado) => {
        const p = new T.Mesh(new T.PlaneGeometry(ancho, alto), mat);
        p.position.set(cx, y0, lado * (W / 2 + 0.03)); if (lado < 0) p.rotation.y = Math.PI; tren.add(p);
      };
      for (const lado of [-1, 1]) {
        plano(15, 10, cab, lado);                                   // cabeza delantera: parte plana entre 10 y 20 m
        for (let k = 0; k < nC; k++) plano(20.5 + k * 18.5 + L / 2, L, coche, lado);
        plano(20.5 + nC * 18.5 + 5, 10, cab, lado);                 // cola: parte plana de la cabeza trasera
      }
      window.Rend3D?.fusionar(tren);
    },
    /**
     * Horario de paso: los trenes salen uno tras otro alternando vía (cada uno siempre por la suya) y en una misma vía no entra
     * un tren hasta `hueco` segundos después de que el anterior haya salido de la escena. Todos con la misma velocidad y tramo.
     * trenes: [{ e, largo, t, k }]; ajusta e.pausa, t (desfase) y k (vía) de cada uno.
     */
    espaciar(trenes, hueco = 18, arranque = 0.35) {
      if (!trenes.length) return;
      const n = trenes.length, vias = trenes[0].e.vias.length;
      const visible = Math.max(...trenes.map((tr) => (tr.e.x[1] - tr.e.x[0] + tr.largo) / tr.e.velocidad));
      const intervalo = (visible + hueco) / vias, ciclo = intervalo * n;
      trenes.forEach((tr, i) => {
        tr.e.pausa = ciclo - (tr.e.x[1] - tr.e.x[0] + tr.largo) / tr.e.velocidad;
        tr.t = ((visible * arranque - i * intervalo) % ciclo + ciclo) % ciclo; tr.k = i % vias; tr.fijo = true;
      });
      return { intervalo, ciclo, visible };
    }
  };
})();
