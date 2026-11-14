// Audio ambiental procedimental ferroviario (Web Audio API): viento por altitud, rodadura ferroviaria,
// resonancia en túnel, cruces de trenes con efecto Doppler, juntas de dilatación y bocina reglamentaria.
// Silenciado por defecto; se activa con 1 clic desde la interfaz.

export function crearAudioAmbiental() {
  let ctx = null;
  let activo = false;
  let master = null;
  let windGain = null;
  let windFilter = null;
  let railGain = null;
  let railFilter = null;
  let lfoGain = null;
  let lfoOsc = null;
  let tunnelGain = null;
  let tunnelDelay = null;
  let noiseBuf = null;

  function iniciarNodos() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    const bufLen = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.16;
    }

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Canal 1: Viento atmosférico / silbido aerodinámico
    const srcWind = ctx.createBufferSource();
    srcWind.buffer = noiseBuf;
    srcWind.loop = true;
    windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 0.7;
    windGain = ctx.createGain();
    windGain.gain.value = 0.12;
    srcWind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    srcWind.start();

    // Canal 2: Rodadura ferroviaria / zumbido grave de carril soldado
    const srcRail = ctx.createBufferSource();
    srcRail.buffer = noiseBuf;
    srcRail.loop = true;
    railFilter = ctx.createBiquadFilter();
    railFilter.type = 'lowpass';
    railFilter.frequency.value = 180;
    railFilter.Q.value = 1.6;
    railGain = ctx.createGain();
    railGain.gain.value = 0;
    srcRail.connect(railFilter);

    // Canal 3: Resonancia y reverberación de túnel
    tunnelDelay = ctx.createDelay();
    tunnelDelay.delayTime.value = 0.085;
    const tunnelFb = ctx.createGain();
    tunnelFb.gain.value = 0.38;
    tunnelGain = ctx.createGain();
    tunnelGain.gain.value = 0;

    railFilter.connect(tunnelDelay);
    tunnelDelay.connect(tunnelFb);
    tunnelFb.connect(tunnelDelay);
    tunnelDelay.connect(tunnelGain);
    tunnelGain.connect(master);

    railFilter.connect(railGain);
    railGain.connect(master);
    srcRail.start();

    // Modulación sutil rítmica de bogies y traviesas
    lfoOsc = ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = 6.5;
    lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfoOsc.connect(lfoGain);
    lfoGain.connect(railGain.gain);
    lfoOsc.start();
  }

  function alternar(forzar) {
    const siguiente = typeof forzar === 'boolean' ? forzar : !activo;
    if (siguiente) {
      iniciarNodos();
      if (!ctx) return false;
      if (ctx.state === 'suspended') ctx.resume();
    }
    activo = siguiente && Boolean(ctx);
    if (master && ctx) {
      master.gain.setTargetAtTime(activo ? 0.58 : 0, ctx.currentTime, 0.18);
    }
    return activo;
  }

  function actualizar({ alturaSobreSuelo = 25, distEje = 50, velocidadKmh = 0, enCabina = false, enTunel = false } = {}) {
    if (!activo || !ctx || !master) return;
    const t = ctx.currentTime;
    // Viento aumenta con la altura o velocidad de cabina
    const kAltura = Math.min(1, Math.max(0, alturaSobreSuelo / 180));
    const kVel = Math.min(1, velocidadKmh / 300);
    const windG = (enCabina ? 0.08 + kVel * 0.28 : 0.06 + kAltura * 0.22);
    const windF = enTunel ? 210 : (260 + kAltura * 480 + kVel * 340);
    windGain.gain.setTargetAtTime(windG, t, 0.22);
    windFilter.frequency.setTargetAtTime(windF, t, 0.22);

    // Rodadura: audible en cabina o cuando la cámara se acerca a menos de 65 m de la vía
    const proxVia = Math.max(0, 1 - distEje / 65);
    const railG = enCabina ? (0.09 + kVel * 0.38) : proxVia * 0.24;
    const railF = enTunel ? 150 : (enCabina ? 250 + kVel * 210 : 190);
    railGain.gain.setTargetAtTime(railG, t, 0.18);
    railFilter.frequency.setTargetAtTime(railF, t, 0.18);

    // Reverberación de túnel
    if (tunnelGain) {
      tunnelGain.gain.setTargetAtTime(enTunel ? 0.26 : 0, t, 0.35);
    }
    if (lfoOsc) lfoOsc.frequency.setTargetAtTime(Math.max(2, Math.min(26, (velocidadKmh || 90) / 15)), t, 0.25);
  }

  function asegurarContexto() {
    iniciarNodos();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  // Clack-clack metálico de juntas de dilatación en estribos de viaductos o agujas de desvío
  function reproducirJunta() {
    if (!asegurarContexto()) return;
    const t0 = ctx.currentTime;
    for (const dt of [0, 0.11]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t0 + dt);
      osc.frequency.exponentialRampToValueAtTime(45, t0 + dt + 0.07);
      g.gain.setValueAtTime(0.24, t0 + dt);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dt + 0.08);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0 + dt);
      osc.stop(t0 + dt + 0.09);
    }
  }

  // Estruendo aerodinámico con efecto Doppler al cruzarse con un tren en vía contraria a 300 km/h
  function reproducirCruceTren() {
    if (!asegurarContexto() || !noiseBuf) return;
    const t0 = ctx.currentTime;
    const dur = 1.35;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.Q.value = 1.4;
    filt.frequency.setValueAtTime(560, t0);
    filt.frequency.exponentialRampToValueAtTime(190, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.01, t0);
    g.gain.linearRampToValueAtTime(0.55, t0 + 0.38);
    g.gain.exponentialRampToValueAtTime(0.005, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur);
  }

  // Bocina reglamentaria de dos tonos Adif (370 Hz / 440 Hz)
  function reproducirBocina() {
    if (!asegurarContexto()) return;
    const t0 = ctx.currentTime;
    const dur = 0.75;
    for (const f of [370, 440]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.24, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur);
    }
  }

  return {
    alternar,
    actualizar,
    reproducirJunta,
    reproducirCruceTren,
    reproducirBocina,
    get activo() { return activo; },
  };
}
