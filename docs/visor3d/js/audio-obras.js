// Sonido de las obras nocturnas (tren de trabajo, inspección y energía): Web Audio sintetizado y posicional
//
// Una sola instancia por página (crearAudioObras). Cada máquina o persona crea sus «fuentes» con una posición en la
// escena (PannerNode HRTF: se oyen más o menos según la distancia y a izquierda o derecha según la cámara) y ajusta sus
// parámetros cada fotograma. Además hay sonidos de ambiente sin posición (viento) y golpes puntuales (pasos en el
// balasto, chispa de la pértiga, bocina, clac hidráulico).
//
// Generadores:
//   diesel      motor de máquina: rpm (600–2000) y carga (0–1)
//   hidraulica  silbido de bombas y cilindros: nivel (0–1) y tono (0–1)
//   vibracion   bates o estabilizador a ~35 Hz con piedra rozando: nivel (0–1), frec (Hz)
//   cepillo     rugido del cepillo de la perfiladora y piedra golpeando: nivel (0–1)
//   generador   grupo electrógeno de una torre de luz (zumbido de 50 Hz y motor pequeño)
//   motor       motor de turismo o furgoneta al ralentí: nivel (0–1)
//   zumbido     zumbido eléctrico de la catenaria (25 kV): nivel (0–1)
// El navegador solo deja arrancar el audio tras un gesto del usuario: asegurar() se llama al pulsar el botón del modo.

import * as THREE from 'three';

let instancia = null;
export function crearAudioObras() {
  if (instancia) return instancia;
  let ctx = null, master = null, ruidoBuf = null, silencio = false, activo = false;
  const fuentes = new Set();

  function asegurar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  const ruido = () => { const n = ctx.createBufferSource(); n.buffer = ruidoBuf; n.loop = true; n.loopStart = Math.random(); n.start(0, Math.random() * 2); return n; };
  const filtro = (tipo, f, q = 1) => { const b = ctx.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; return b; };
  const osc = (tipo, f) => { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f; o.start(); return o; };
  const ganancia = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const T = (p, v, tau = 0.08) => p.setTargetAtTime(v, ctx.currentTime, tau);

  function aplicarVolumen() {
    if (master) T(master.gain, activo && !silencio ? 0.9 : 0, 0.25);
  }

  // ---- Generadores ----
  const GEN = {
    diesel() {
      const sal = ganancia(0.5), lp = filtro('lowpass', 220, 0.7);
      const o1 = osc('sawtooth', 30), o2 = osc('square', 60), g2 = ganancia(0.22);
      const n = ruido(), nf = filtro('lowpass', 300), gn = ganancia(0.4);
      // Golpeteo de los cilindros: el ruido se modula a la frecuencia de encendido
      const am = ganancia(0.5), lfo = osc('square', 15), lg = ganancia(0.35);
      lfo.connect(lg); lg.connect(am.gain);
      o1.connect(lp); o2.connect(g2); g2.connect(lp); n.connect(nf); nf.connect(am); am.connect(gn); gn.connect(lp); lp.connect(sal);
      return {
        sal,
        set({ rpm = 900, carga = 0.3 }) {
          const f = rpm / 60 * 2;                  // 4 tiempos, 4 cilindros: 2 explosiones por vuelta
          T(o1.frequency, f); T(o2.frequency, f * 2); T(lfo.frequency, f / 2);
          T(lp.frequency, 160 + 380 * carga + rpm * 0.05); T(sal.gain, 0.32 + 0.35 * carga);
        },
      };
    },
    hidraulica() {
      const sal = ganancia(0), bp = filtro('bandpass', 900, 7), o = osc('sawtooth', 480);
      const n = ruido(), hp = filtro('highpass', 1800), gn = ganancia(0.15);
      o.connect(bp); n.connect(hp); hp.connect(gn); gn.connect(bp); bp.connect(sal);
      return { sal, set({ nivel = 0, tono = 0.5 }) { T(sal.gain, nivel * 0.45, 0.04); T(o.frequency, 380 + 700 * tono, 0.05); T(bp.frequency, 700 + 900 * tono, 0.05); } };
    },
    vibracion() {
      const sal = ganancia(0), o = osc('square', 35), lp = filtro('lowpass', 380), n = ruido(), bp = filtro('bandpass', 2300, 0.9), gn = ganancia(0.6);
      // La piedra suena «a golpes» a la frecuencia de vibración
      const am = ganancia(0.4), mod = osc('sine', 35), mg = ganancia(0.6);
      mod.connect(mg); mg.connect(am.gain);
      o.connect(lp); lp.connect(sal); n.connect(bp); bp.connect(am); am.connect(gn); gn.connect(sal);
      return { sal, set({ nivel = 0, frec = 35 }) { T(sal.gain, nivel * 0.6, 0.03); T(o.frequency, frec); T(mod.frequency, frec); } };
    },
    cepillo() {
      const sal = ganancia(0), n = ruido(), bp = filtro('bandpass', 700, 0.6), n2 = ruido(), hp = filtro('bandpass', 3200, 2.5);
      const am = ganancia(0.3), lfo = osc('sawtooth', 9), lg = ganancia(0.3), g2 = ganancia(0.35);
      lfo.connect(lg); lg.connect(am.gain);
      n.connect(bp); bp.connect(sal); n2.connect(hp); hp.connect(am); am.connect(g2); g2.connect(sal);
      return { sal, set({ nivel = 0 }) { T(sal.gain, nivel * 0.55, 0.2); } };
    },
    generador() {
      const sal = ganancia(0.18), o = osc('sawtooth', 50), lp = filtro('lowpass', 260), o2 = osc('sine', 100), g2 = ganancia(0.3);
      const n = ruido(), nf = filtro('bandpass', 180, 1.2), gn = ganancia(0.35);
      o.connect(lp); o2.connect(g2); g2.connect(lp); n.connect(nf); nf.connect(gn); gn.connect(lp); lp.connect(sal);
      return { sal, set({ nivel = 1 }) { T(sal.gain, 0.18 * nivel, 0.3); } };
    },
    motor() {
      const sal = ganancia(0), o = osc('sawtooth', 26), lp = filtro('lowpass', 180), n = ruido(), nf = filtro('lowpass', 240), gn = ganancia(0.3);
      o.connect(lp); n.connect(nf); nf.connect(gn); gn.connect(lp); lp.connect(sal);
      return { sal, set({ nivel = 0.5, rpm = 800 }) { T(sal.gain, nivel * 0.3, 0.2); T(o.frequency, rpm / 60 * 2); } };
    },
    // Soplete de precalentamiento: rugido de la llama a presión
    soplete() {
      const sal = ganancia(0), n = ruido(), bp = filtro('bandpass', 900, 0.5), hp = filtro('highpass', 3500), n2 = ruido(), g2 = ganancia(0.25), lp = filtro('lowpass', 160), n3 = ruido(), g3 = ganancia(0.6);
      n.connect(bp); bp.connect(sal); n2.connect(hp); hp.connect(g2); g2.connect(sal); n3.connect(lp); lp.connect(g3); g3.connect(sal);
      return { sal, set({ nivel = 0 }) { T(sal.gain, nivel * 0.5, 0.15); } };
    },
    // Disco de tronzadora o muela de la esmeriladora: chirrido agudo con el acero
    disco() {
      const sal = ganancia(0), o = osc('sawtooth', 2900), bp = filtro('bandpass', 3200, 4), n = ruido(), nb = filtro('bandpass', 5200, 1.5), gn = ganancia(0.5);
      const m = osc('sine', 7), mg = ganancia(180); m.connect(mg); mg.connect(o.frequency);
      o.connect(bp); bp.connect(sal); n.connect(nb); nb.connect(gn); gn.connect(sal);
      return { sal, set({ nivel = 0, tono = 0.5 }) { T(sal.gain, nivel * 0.35, 0.05); T(o.frequency, 2200 + 1600 * tono, 0.1); T(bp.frequency, 2400 + 1800 * tono, 0.1); } };
    },
    // Reacción aluminotérmica: hervor burbujeante y siseo del humo
    reaccion() {
      const sal = ganancia(0), n = ruido(), bp = filtro('bandpass', 420, 0.8), am = ganancia(0.5), lfo = osc('square', 11), lg = ganancia(0.5), n2 = ruido(), hp = filtro('highpass', 2500), g2 = ganancia(0.3);
      lfo.connect(lg); lg.connect(am.gain); n.connect(bp); bp.connect(am); am.connect(sal); n2.connect(hp); hp.connect(g2); g2.connect(sal);
      return { sal, set({ nivel = 0 }) { T(sal.gain, nivel * 0.6, 0.1); T(lfo.frequency, 8 + Math.random() * 7, 0.05); } };
    },
    zumbido() {
      const sal = ganancia(0), o = osc('sine', 100), o2 = osc('square', 50), g2 = ganancia(0.08), n = ruido(), hp = filtro('highpass', 4000), gn = ganancia(0.04);
      o.connect(sal); o2.connect(g2); g2.connect(sal); n.connect(hp); hp.connect(gn); gn.connect(sal);
      return { sal, set({ nivel = 0 }) { T(sal.gain, nivel * 0.12, 0.3); } };
    },
  };

  /** Fuente posicional. pos: THREE.Vector3 en coordenadas de escena. */
  function fuente(tipo, { ref = 6, caida = 1.1 } = {}) {
    const f = { tipo, pos: new THREE.Vector3(), params: {}, gen: null, panner: null, vivo: true };
    f.set = (p) => { Object.assign(f.params, p); f.gen?.set(f.params); return f; };
    f.colocar = (v) => { f.pos.copy(v); return f; };
    f.parar = () => { f.vivo = false; try { f.panner?.disconnect(); } catch { /* ya desconectada */ } fuentes.delete(f); };
    f._crear = () => {
      if (f.gen || !ctx) return;
      f.gen = GEN[tipo]();
      f.panner = new PannerNode(ctx, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: ref, rolloffFactor: caida, maxDistance: 600 });
      f.gen.sal.connect(f.panner); f.panner.connect(master);
      f.gen.set(f.params);
    };
    fuentes.add(f);
    if (ctx) f._crear();
    return f;
  }

  // ---- Ambiente: viento con ráfagas (sin posición) ----
  let viento = null, fuerzaViento = 0;
  function crearViento() {
    if (viento || !ctx) return;
    const n = ruido(), lp = filtro('lowpass', 500, 0.6), bp = filtro('bandpass', 380, 0.7), g = ganancia(0), silb = ruido(), sb = filtro('bandpass', 1400, 9), gs = ganancia(0);
    n.connect(lp); lp.connect(bp); bp.connect(g); g.connect(master);
    silb.connect(sb); sb.connect(gs); gs.connect(master);
    viento = { lp, bp, g, gs, sb, t: Math.random() * 100 };
  }
  function actualizarViento(dt) {
    if (!viento) return;
    viento.t += dt;
    const t = viento.t;
    // Ráfagas: suma de senos lentos
    const r = 0.55 + 0.25 * Math.sin(t * 0.21) + 0.15 * Math.sin(t * 0.53 + 1.3) + 0.08 * Math.sin(t * 1.7 + 0.4);
    T(viento.g.gain, fuerzaViento * 0.32 * r, 0.6);
    T(viento.lp.frequency, 300 + 700 * r * fuerzaViento, 0.6);
    T(viento.bp.frequency, 250 + 320 * r, 0.8);
    T(viento.gs.gain, fuerzaViento * 0.018 * Math.max(0, r - 0.6), 0.5);
    T(viento.sb.frequency, 1000 + 900 * r, 0.8);
  }

  // ---- Golpes puntuales ----
  function golpe(pos, { tipo = 'paso', nivel = 1 } = {}) {
    if (!ctx || !activo || silencio) return;
    const t0 = ctx.currentTime;
    const p = new PannerNode(ctx, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: tipo === 'paso' ? 1.5 : 5, rolloffFactor: 1.3, maxDistance: 300, positionX: pos.x, positionY: pos.y, positionZ: pos.z });
    p.connect(master);
    const g = ctx.createGain(); g.connect(p);
    const n = ctx.createBufferSource(); n.buffer = ruidoBuf; n.start(t0, Math.random() * 2);
    let dur = 0.12;
    if (tipo === 'paso') {
      // Pisada en el balasto: crujido de piedra
      const bp = filtro('bandpass', 1500 + Math.random() * 1500, 1.4); n.connect(bp); bp.connect(g);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.35 * nivel, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
      dur = 0.2;
    } else if (tipo === 'chispa') {
      const hp = filtro('highpass', 2500); n.connect(hp); hp.connect(g);
      const o = osc('sawtooth', 100); const go = ganancia(0.25); o.connect(go); go.connect(g); o.stop(t0 + 0.35);
      g.gain.setValueAtTime(0.9 * nivel, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      dur = 0.4;
    } else if (tipo === 'clac') {
      const bp = filtro('bandpass', 600, 2); n.connect(bp); bp.connect(g);
      g.gain.setValueAtTime(0.6 * nivel, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    } else if (tipo === 'bocina') {
      n.stop(t0);
      for (const f of [311, 370]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const bp = filtro('bandpass', f * 2, 2); o.connect(bp); bp.connect(g); o.start(t0); o.stop(t0 + 0.9); }
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.35 * nivel, t0 + 0.05); g.gain.setValueAtTime(0.35 * nivel, t0 + 0.75); g.gain.linearRampToValueAtTime(0, t0 + 0.9);
      dur = 1;
    }
    setTimeout(() => { try { p.disconnect(); } catch { /* fin */ } }, (dur + 0.3) * 1000);
  }

  const _f = new THREE.Vector3(), _u = new THREE.Vector3();
  /** Cada fotograma: oyente en la cámara y posición de las fuentes. */
  function actualizar(camara, dt = 0.016) {
    if (!ctx || !activo) return;
    const L = ctx.listener, t = ctx.currentTime;
    camara.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(camara.quaternion);
    if (L.positionX) {
      L.positionX.setTargetAtTime(camara.position.x, t, 0.02); L.positionY.setTargetAtTime(camara.position.y, t, 0.02); L.positionZ.setTargetAtTime(camara.position.z, t, 0.02);
      L.forwardX.setTargetAtTime(_f.x, t, 0.02); L.forwardY.setTargetAtTime(_f.y, t, 0.02); L.forwardZ.setTargetAtTime(_f.z, t, 0.02);
      L.upX.setTargetAtTime(_u.x, t, 0.02); L.upY.setTargetAtTime(_u.y, t, 0.02); L.upZ.setTargetAtTime(_u.z, t, 0.02);
    } else { L.setPosition(camara.position.x, camara.position.y, camara.position.z); L.setOrientation(_f.x, _f.y, _f.z, _u.x, _u.y, _u.z); }
    for (const f of fuentes) {
      if (!f.panner) continue;
      f.panner.positionX.setTargetAtTime(f.pos.x, t, 0.03); f.panner.positionY.setTargetAtTime(f.pos.y, t, 0.03); f.panner.positionZ.setTargetAtTime(f.pos.z, t, 0.03);
    }
    actualizarViento(dt);
  }

  instancia = {
    /** Arranca el audio (llamar desde un clic) y crea las fuentes pendientes. */
    activar(on = true) {
      if (on && !asegurar()) return false;
      activo = on;
      if (on) { for (const f of fuentes) f._crear(); crearViento(); }
      aplicarVolumen();
      if (!on && ctx) setTimeout(() => { if (!activo) ctx.suspend(); }, 600);
      return activo;
    },
    alternarSilencio(forzar) { silencio = typeof forzar === 'boolean' ? forzar : !silencio; aplicarVolumen(); return silencio; },
    get silencio() { return silencio; }, get activo() { return activo; },
    fuente, golpe, actualizar,
    /** Fuerza del viento de ambiente (0 = sin viento, 1 = fuerte). */
    viento(f) { fuerzaViento = f; },
  };
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden && ctx.state === 'running') ctx.suspend();
    else if (!document.hidden && activo && !silencio && ctx.state === 'suspended') ctx.resume();
  });

  return instancia;
}
