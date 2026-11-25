/*
 * Uso en campo: «Estoy aquí» lleva la vista al PK más próximo a la posición GPS del dispositivo y «Seguir» la acompaña mientras
 * se camina o se viaja. La posición se usa solo en este navegador: no se envía ni se guarda en ningún sitio.
 * Necesita HTTPS (la copia publicada lo es) o localhost, y el permiso de ubicación del navegador.
 */
const MAX_DIST_M = 3000;   // más lejos de la línea, no se mueve la vista: solo se informa

export function crearCampo({ lonlatAUTM, Eje3D, fmtPk, irAPk, anunciar }) {
  let vigilante = null, ultimoPk = -1e9;
  const toast = document.createElement('div');
  toast.id = 'toastCampo';
  toast.hidden = true;
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  let tToast = 0;
  function aviso(t, ms = 6000) {
    toast.textContent = t; toast.hidden = false; anunciar?.(t);
    clearTimeout(tToast); tToast = setTimeout(() => { toast.hidden = true; }, ms);
  }
  const errores = { 1: 'Permiso de ubicación denegado: actívalo en el navegador para este sitio.', 2: 'No se pudo determinar la posición (¿sin GPS o sin cobertura?).', 3: 'La posición tarda demasiado: sal a cielo abierto y reintenta.' };

  function proyectar(pos) {
    const [E, N] = lonlatAUTM(pos.coords.longitude, pos.coords.latitude);
    return { ...Eje3D.proyUTM(E, N), prec: pos.coords.accuracy };
  }
  function tratar(pos, { silencioso = false } = {}) {
    const p = proyectar(pos);
    if (p.d > MAX_DIST_M) {
      if (!silencioso) aviso(`Estás a ${(p.d / 1000).toFixed(1).replace('.', ',')} km de la línea (PK más próximo: ${fmtPk(p.pk)}). La vista no se mueve.`);
      return false;
    }
    if (silencioso && Math.abs(p.pk - ultimoPk) < 15) return true;
    ultimoPk = p.pk;
    irAPk(p.pk);
    aviso(`PK ${fmtPk(p.pk)} · a ${Math.round(p.d)} m del eje · precisión ±${Math.round(p.prec)} m`, silencioso ? 2500 : 6000);
    return true;
  }
  function estoyAqui() {
    if (!navigator.geolocation) { aviso('Este navegador no ofrece ubicación.'); return; }
    aviso('Buscando tu posición…', 15000);
    navigator.geolocation.getCurrentPosition((pos) => tratar(pos), (e) => aviso(errores[e.code] || 'No se pudo obtener la ubicación.'), { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
  }
  function seguir(on) {
    if (on === undefined) on = vigilante === null;
    if (vigilante !== null) { navigator.geolocation.clearWatch(vigilante); vigilante = null; }
    if (on && navigator.geolocation) {
      vigilante = navigator.geolocation.watchPosition((pos) => tratar(pos, { silencioso: true }), (e) => { aviso(errores[e.code] || 'Se perdió la ubicación.'); seguir(false); alAlternar?.(false); }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 });
      aviso('Siguiendo tu posición. Pulsa de nuevo para dejar de seguir.');
    } else if (on) aviso('Este navegador no ofrece ubicación.');
    return vigilante !== null;
  }
  let alAlternar = null;
  return { estoyAqui, seguir, get siguiendo() { return vigilante !== null; }, alAlternar: (f) => { alAlternar = f; } };
}
