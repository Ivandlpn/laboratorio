// Audio ambiental procedimental (Web Audio API): viento por altitud, rodadura ferroviaria y resonancia en túnel.
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

  function iniciarNodos() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    const bufLen = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
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

    // Canal 1: Viento atmosférico
    const srcWind = ctx.createBufferSource();
    srcWind.buffer = buffer;
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

    // Canal 2: Rodadura ferroviaria / zumbido grave
    const srcRail = ctx.createBufferSource();
    srcRail.buffer = buffer;
    srcRail.loop = true;
    railFilter = ctx.createBiquadFilter();
    railFilter.type = 'lowpass';
    railFilter.frequency.value = 180;
    railFilter.Q.value = 1.6;
    railGain = ctx.createGain();
    railGain.gain.value = 0;
    srcRail.connect(railFilter);
    railFilter.connect(railGain);
    railGain.connect(master);
    srcRail.start();

    // Modulación sutil rítmica de traviesas / juntas
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
      master.gain.setTargetAtTime(activo ? 0.55 : 0, ctx.currentTime, 0.18);
    }
    return activo;
  }

  function actualizar({ alturaSobreSuelo = 25, distEje = 50, velocidadKmh = 0, enCabina = false, enTunel = false } = {}) {
    if (!activo || !ctx || !master) return;
    const t = ctx.currentTime;
    // Viento aumenta con la altura o velocidad de cabina
    const kAltura = Math.min(1, Math.max(0, alturaSobreSuelo / 180));
    const kVel = Math.min(1, velocidadKmh / 300);
    const windG = (enCabina ? 0.08 + kVel * 0.24 : 0.06 + kAltura * 0.22);
    const windF = enTunel ? 210 : (260 + kAltura * 480 + kVel * 260);
    windGain.gain.setTargetAtTime(windG, t, 0.25);
    windFilter.frequency.setTargetAtTime(windF, t, 0.25);

    // Rodadura: audible en cabina o cuando la cámara se acerca a menos de 65 m de la vía
    const proxVia = Math.max(0, 1 - distEje / 65);
    const railG = enCabina ? (0.08 + kVel * 0.34) : proxVia * 0.22;
    const railF = enTunel ? 135 : (enCabina ? 240 + kVel * 190 : 190);
    railGain.gain.setTargetAtTime(railG, t, 0.2);
    railFilter.frequency.setTargetAtTime(railF, t, 0.2);
    if (lfoOsc) lfoOsc.frequency.setTargetAtTime(Math.max(2, Math.min(24, (velocidadKmh || 90) / 16)), t, 0.3);
  }

  return {
    alternar,
    actualizar,
    get activo() { return activo; },
  };
}
