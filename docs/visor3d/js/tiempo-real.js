import { lonlatAUTM } from './proyeccion.js';

/*
 * Trenes de Renfe en tiempo real sobre la traza del corredor Albacete–Alicante.
 *
 * Fuente: feeds GTFS-RT públicos de Renfe (Alta Velocidad y Larga Distancia), los mismos que usa VisorLAV:
 *   https://gtfsrt.renfe.com/vehicle_positions_LD.json   (posición GPS de cada tren, ~30 s)
 *   https://gtfsrt.renfe.com/trip_updates_LD.json        (retraso de cada viaje)
 * Renfe no manda cabeceras CORS, así que desde el navegador se piden por el Apps Script del equipo (el mismo proxy
 * de VisorLAV, que solo reenvía dominios permitidos). Los horarios (origen, destino, paradas y horas) salen del GTFS
 * estático, filtrado al corredor en datos/renfe/horarios-albali.json (scripts/importar-horarios-renfe.py).
 *
 * Cada posición se proyecta sobre el eje (PK y distancia): solo se listan los trenes que están sobre la traza
 * (a menos de DIST_MAX m del eje entre el PK inicial y el final). Entre dos lecturas el tren avanza a la velocidad
 * medida entre sus dos últimas posiciones distintas (o, al principio, la que pide su horario para llegar a la próxima
 * parada) y se corrige suavemente al llegar la siguiente lectura.
 */
const BASE = 'https://gtfsrt.renfe.com';
const URL_POS = `${BASE}/vehicle_positions_LD.json`;
const URL_RET = `${BASE}/trip_updates_LD.json`;
const PROXY = 'https://script.google.com/macros/s/AKfycbzDxlYwolyEMPwvyBMWTl2MU0mcybqj5PKxVWh6m_M5sPPaXHbzu7pmtCvcy_dUPHLVdQ/exec';
const CADA_POS_MS = 30000, CADA_RET_MS = 90000, PLAZO_MS = 15000;
const DIST_MAX = 350;          // m del eje para considerar que el tren va por la línea
const DIST_PARADA = 2500;      // m del eje para considerar que una estación está en el corredor
const V_MAX = 92;              // m/s (330 km/h)
const PARADO_S = 100;          // s sin moverse para darlo por detenido

const TIPOS = { 'AVE': 'ave', 'AVLO': 'avlo', 'AVE Euromed': 'ave', 'Euromed': 'ave', 'AVANT': 'avant', 'Avant': 'avant' };

// Siempre por el proxy: Renfe no manda cabeceras CORS (pedirlo directo solo llena la consola de errores)
async function pedir(url) {
  const plazo = () => { const c = new AbortController(); setTimeout(() => c.abort(), PLAZO_MS); return c.signal; };
  // El Apps Script falla de vez en cuando (arranque en frío, cuota por segundo): un reintento antes de rendirse
  let ultimo = null;
  for (let intento = 0; intento < 2; intento++) {
    if (intento) await new Promise((res) => setTimeout(res, 2000));
    try {
      const r = await fetch(`${PROXY}?action=proxy&url=${encodeURIComponent(url)}`, { signal: plazo() });
      if (!r.ok) throw new Error(`El proxy respondió ${r.status}`);
      const j = await r.json();
      if (!j || !Array.isArray(j.entity)) throw new Error(j?.error || 'Respuesta sin datos');
      return j;
    } catch (err) { ultimo = err; }
  }
  throw ultimo;
}

/** Minutos desde las 0:00 en hora peninsular española y fecha AAAA-MM-DD. */
function ahoraMadrid() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { min: Number(p.hour) * 60 + Number(p.minute) + Number(p.second) / 60, fecha: `${p.year}-${p.month}-${p.day}` };
}
const hhmm = (m) => { const x = Math.round(m) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

export function crearTrenesReales({ Eje3D, flota, crearTrenReal, quitarTren, posicionarTren, alCambiar = () => {} }) {
  const estado = { trenes: new Map(), ok: false, error: null, actualizado: null, cargando: true };
  let horarios = null;
  let retrasos = new Map();
  const pkParada = new Map();

  fetch('./datos/renfe/horarios-albali.json').then((r) => (r.ok ? r.json() : null)).then((h) => { horarios = h; }).catch(() => {});

  function paradaEnEje(id) {
    if (pkParada.has(id)) return pkParada.get(id);
    const s = horarios?.paradas?.[id];
    let pk = null;
    if (s) { const [E, N] = lonlatAUTM(s.lon, s.lat); const q = Eje3D.proyUTM(E, N); if (q.d < DIST_PARADA) pk = q.pk; }
    pkParada.set(id, pk);
    return pk;
  }
  const nombreParada = (id) => horarios?.paradas?.[id]?.n || (id ? `Estación ${id}` : '—');

  function horarioDe(tripId) {
    const lista = horarios?.viajes?.[tripId.slice(0, 6)];
    if (!lista?.length) return null;
    const fecha = tripId.slice(6), hoy = ahoraMadrid().fecha;
    return lista.find((v) => v.f.includes(fecha)) || lista.find((v) => v.f.includes(hoy)) || lista[0];
  }

  /** Paradas anterior y siguiente, origen, destino y horas con el retraso aplicado. */
  function infoViaje(t) {
    const h = horarioDe(t.tripId);
    const ret = t.retraso || 0, retMin = ret / 60;
    const ahora = ahoraMadrid().min;
    const out = { tipo: h?.tipo || '', retraso: ret, origen: null, destino: null, anterior: null, proxima: null };
    if (!h) return out;
    const P = h.p;
    out.origen = { nombre: nombreParada(P[0][0]), salida: hhmm(P[0][2]) };
    out.destino = { nombre: nombreParada(P[P.length - 1][0]), llegada: hhmm(P[P.length - 1][1]), llegadaReal: hhmm(P[P.length - 1][1] + retMin) };
    // Si el día de servicio empezó ayer (tren nocturno), las horas del horario pasan de 24 h
    const ref = P[0][2] > ahora + 720 ? ahora + 1440 : ahora;
    let iProx = t.stopId ? P.findIndex((p) => p[0] === t.stopId) : -1;
    if (iProx < 0) iProx = P.findIndex((p) => p[1] + retMin > ref);
    if (iProx < 0) iProx = P.length - 1;
    const parada = Boolean(t.detenido) && t.estado === 'STOPPED_AT';
    const iAnt = iProx - 1;
    if (iAnt >= 0) out.anterior = { nombre: nombreParada(P[iAnt][0]), salida: hhmm(P[iAnt][2]), salidaReal: hhmm(P[iAnt][2] + retMin) };
    const pr = P[iProx];
    out.proxima = { nombre: nombreParada(pr[0]), llegada: hhmm(pr[1]), llegadaReal: hhmm(pr[1] + retMin), salida: hhmm(pr[2]), salidaReal: hhmm(pr[2] + retMin), enEstacion: parada, id: pr[0], minLlegada: pr[1] + retMin - ref };
    out.iProx = iProx;
    out.paradas = P.map((p, i) => ({ nombre: nombreParada(p[0]), llegada: hhmm(p[1]), salida: hhmm(p[2]), pasada: i < iProx, actual: i === iProx }));
    return out;
  }

  /** Sentido de marcha (+1 hacia Alicante): por su movimiento, por el orden de sus paradas en la línea o por la próxima. */
  function sentidoDe(t) {
    if (Math.abs(t.v) > 2) return Math.sign(t.v);
    const h = horarioDe(t.tripId);
    if (h) {
      // La siguiente estación de la línea por la que va a pasar, o si no queda ninguna, la última que ha dejado atrás
      const P = h.p, iP = infoViaje(t).iProx ?? 0;
      for (let k = iP; k < P.length; k++) {
        const pk = paradaEnEje(P[k][0]);
        if (pk != null && Math.abs(pk - t.pkObs) > 300) return Math.sign(pk - t.pkObs);
      }
      for (let k = iP - 1; k >= 0; k--) {
        const pk = paradaEnEje(P[k][0]);
        if (pk != null && Math.abs(pk - t.pkObs) > 300) return Math.sign(t.pkObs - pk);
      }
      // Destino fuera de la línea: Madrid queda al lado de Albacete; Murcia, Elche y Alicante, al de Alicante
      const d = horarios.paradas[h.p[h.p.length - 1][0]];
      if (d) return d.lat > 39.05 || d.lon < -1.85 ? -1 : 1;
    }
    return t.sentido || 1;
  }

  /** Velocidad inicial: la que pide el horario para llegar a la próxima parada en la línea a su hora prevista. */
  function velocidadHorario(t) {
    if (t.detenido) return 0;
    const i = infoViaje(t);
    const pkProx = i.proxima ? paradaEnEje(i.proxima.id) : null;
    if (pkProx == null || !(i.proxima.minLlegada > 0.5)) return 0;
    const v = (pkProx - t.pkObs) / (i.proxima.minLlegada * 60);
    return Math.max(-V_MAX * 0.8, Math.min(V_MAX * 0.8, v));
  }

  async function leerRetrasos() {
    try {
      const j = await pedir(URL_RET);
      const m = new Map();
      for (const e of j.entity) {
        const tu = e.tripUpdate;
        if (!tu?.trip?.tripId) continue;
        const d = tu.delay ?? tu.stopTimeUpdate?.[0]?.arrival?.delay ?? tu.stopTimeUpdate?.[0]?.departure?.delay;
        if (d != null) m.set(tu.trip.tripId, Number(d));
      }
      retrasos = m;
      for (const t of estado.trenes.values()) {
        t.retraso = retrasos.get(t.tripId) ?? t.retraso;
        t.info = infoViaje(t);
        actualizarFicha(t);
      }
      alCambiar(estado);
    } catch { /* opcional: sin retrasos se muestra solo el horario */ }
  }

  async function leerPosiciones() {
    try {
      const j = await pedir(URL_POS);
      const ahora = performance.now() / 1000;
      const vistos = new Set();
      for (const e of j.entity) {
        const v = e.vehicle;
        const lat = v?.position?.latitude, lon = v?.position?.longitude;
        const num = v?.vehicle?.label || v?.vehicle?.id;
        if (lat == null || lon == null || !num || vistos.has(num)) continue;
        const [E, N] = lonlatAUTM(lon, lat);
        const q = Eje3D.proyUTM(E, N);
        if (q.d > DIST_MAX || q.pk < Eje3D.pkIni + 30 || q.pk > Eje3D.pkFin - 30) continue;
        vistos.add(num);
        let t = estado.trenes.get(num);
        const nuevo = !t;
        if (nuevo) t = { num, v: 0, sentido: 0, tr: null, tObs: ahora, pkObs: q.pk, tDistinta: ahora, pkDistinta: q.pk };
        t.tripId = v.trip?.tripId || t.tripId || '';
        t.stopId = v.stopId || null;
        t.estado = v.currentStatus || '';
        t.lat = lat; t.lon = lon; t.distEje = q.d;
        t.retraso = retrasos.get(t.tripId) ?? t.retraso ?? 0;
        const movido = !nuevo && Math.abs(q.pk - t.pkDistinta) > 15;
        if (movido) {
          // Velocidad entre las dos últimas posiciones distintas
          const dtObs = ahora - t.tDistinta;
          if (dtObs > 8) t.v = Math.max(-V_MAX, Math.min(V_MAX, (q.pk - t.pkDistinta) / dtObs));
          t.tDistinta = ahora; t.pkDistinta = q.pk;
        }
        t.pkObs = q.pk; t.tObs = ahora;
        // Renfe deja a veces «STOPPED_AT» en trenes que ya circulan: solo vale junto a la estación, o si el tren lleva
        // más de PARADO_S sin moverse
        const pkS = t.stopId ? paradaEnEje(t.stopId) : null;
        t.detenido = (t.estado === 'STOPPED_AT' && pkS != null && Math.abs(pkS - q.pk) < 700) || (!nuevo && ahora - t.tDistinta > PARADO_S);
        if (t.detenido) t.v = 0;
        else if (!movido && !t.v) t.v = velocidadHorario(t);   // aún sin dos lecturas distintas: la del horario
        t.sentido = sentidoDe(t);
        // Sin ninguna estimación: la velocidad de la línea en ese PK (la siguiente lectura la corrige)
        if (!t.detenido && !t.v) t.v = t.sentido * Math.min(250, Eje3D.velocidadLimite?.(q.pk) || 250) / 3.6 * 0.85;
        t.info = infoViaje(t);
        if (!t.tr) {
          const tipo = t.info.tipo || '';
          const modelo = TIPOS[tipo] || (/alvia|intercity/i.test(tipo) ? 'avant' : 'ave');
          t.tr = crearTrenReal({ tipo: modelo, nCoches: modelo === 'avant' ? 5 : 8, pk: q.pk, sentido: t.sentido });
          t.tr.tiempoReal = t;
          t.pkVis = q.pk;
        }
        t.nombre = `${t.info.tipo || 'Tren'} ${num}`;
        t.tr.nombre = t.nombre;
        t.tr.sentido = t.sentido;
        t.tr.viaSigno = t.sentido > 0 ? -1 : 1;
        estado.trenes.set(num, t);
      }
      // Los que ya no circulan por la línea se retiran
      for (const [num, t] of estado.trenes) {
        if (!vistos.has(num)) { if (t.tr) quitarTren(t.tr); estado.trenes.delete(num); }
      }
      estado.ok = true; estado.error = null; estado.actualizado = new Date();
    } catch (err) {
      estado.error = err?.message || String(err);
    }
    estado.cargando = false;
    for (const t of estado.trenes.values()) actualizarFicha(t);
    alCambiar(estado);
  }

  function actualizarFicha(t) {
    const i = t.info || {};
    const kmh = Math.round(Math.abs(t.v) * 3.6);
    const ret = Math.round((t.retraso || 0) / 60);
    const txt = [
      i.origen && i.destino ? `${i.origen.nombre} → ${i.destino.nombre}` : '',
      ret > 0 ? `retraso ${ret} min` : ret < 0 ? `adelanto ${-ret} min` : 'en hora',
      i.proxima ? `${i.proxima.enEstacion ? 'en' : 'próxima'} ${i.proxima.nombre} ${i.proxima.llegadaReal}` : '',
      t.detenido ? 'detenido' : `${kmh} km/h`,
    ].filter(Boolean).join(' · ');
    for (const c of t.tr?.modelo.coches || []) {
      Object.assign(c.userData, { capa: 'Tren en circulación (Renfe, tiempo real)', nombre: t.nombre, info: `${txt}. Posición GPS publicada por Renfe proyectada sobre la traza; el visor la interpola entre lecturas.`, tiempoReal: t.num });
    }
  }

  /** Cada fotograma: el tren avanza a su velocidad estimada y se corrige suavemente hacia la última lectura. */
  function actualizar(dt) {
    const ahora = performance.now() / 1000;
    for (const t of estado.trenes.values()) {
      if (!t.tr) continue;
      const pkObj = t.pkObs + t.v * Math.min(150, ahora - t.tObs);
      const err = pkObj - t.pkVis;
      if (Math.abs(err) > 3000) t.pkVis = pkObj;
      else t.pkVis += err * (1 - Math.exp(-dt * 0.6));
      t.pkVis = Math.max(Eje3D.pkIni + 40, Math.min(Eje3D.pkFin - 40, t.pkVis));
      t.tr.pk = t.pkVis;
      t.tr.velActual = Math.abs(t.v);
      t.tr.estadoTxt = t.detenido ? `Detenido en ${t.info?.proxima?.nombre || 'estación'}` : `En marcha · ${Math.round(Math.abs(t.v) * 3.6)} km/h`;
      if (t.tr.modelo.grupo.visible) posicionarTren(t.tr);
    }
  }

  // Sondeo solo con la pestaña visible; al volver a ella, lectura inmediata (una sola cadena de temporizadores viva)
  let tPos = null, tRet = null, gen = 0;
  function sondear() {
    clearTimeout(tPos); clearTimeout(tRet);
    const g = ++gen;
    const pos = async () => { if (!document.hidden) await leerPosiciones(); if (g === gen) tPos = setTimeout(pos, CADA_POS_MS); };
    const ret = async () => { if (!document.hidden) await leerRetrasos(); if (g === gen) tRet = setTimeout(ret, CADA_RET_MS); };
    pos(); setTimeout(ret, 3000);   // escalonadas: el proxy lleva mal dos peticiones a la vez
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sondear(); });
  sondear();

  const lista = () => [...estado.trenes.values()].filter((t) => t.tr).sort((a, b) => a.pkVis - b.pkVis);
  return { estado, actualizar, lista, refrescar: leerPosiciones, indiceEnFlota: (t) => flota.indexOf(t.tr) };
}
