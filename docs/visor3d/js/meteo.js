// Meteorología en tiempo real (Open-Meteo, sin API key) + posición solar astronómica exacta

const cacheMeteo = new Map();

export function calcularSolAstronomico(latDeg, lonDeg, fecha = new Date()) {
  const rad = Math.PI / 180;
  const start = new Date(fecha.getFullYear(), 0, 0);
  const diaAnio = Math.floor((fecha - start) / 86400000);
  const horaUtc = fecha.getUTCHours() + fecha.getUTCMinutes() / 60 + fecha.getUTCSeconds() / 3600;
  const gamma = ((2 * Math.PI) / 365) * (diaAnio - 1 + (horaUtc - 12) / 24);

  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));

  const tst = horaUtc * 60 + eqTime + 4 * lonDeg;
  const ha = ((tst / 4) - 180) * rad;
  const lat = latDeg * rad;

  const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAz = (Math.sin(decl) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(alt) + 1e-6);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az;

  const altDeg = alt / rad;
  // Sistema de mundo Three.js: +X = Este, +Y = Arriba, -Z = Norte (por tanto +Z = Sur)
  const r = 210;
  const cAlt = Math.max(0.08, Math.cos(alt));
  const x = r * cAlt * Math.sin(az);
  const z = -r * cAlt * Math.cos(az);
  const y = Math.max(18, r * Math.sin(Math.max(0.06, alt)));

  let horaSol = 'dia';
  if (altDeg < -2) horaSol = 'noche';
  else if (altDeg < 16) horaSol = Math.sin(az) >= 0 ? 'amanecer' : 'atardecer';

  return { elevacionDeg: altDeg, azimutDeg: az / rad, desvio: [x, y, z], horaSol, esDia: altDeg >= -2 };
}

function mapearClimaWmo(code, cloudCover, precip) {
  if (precip > 0.2 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return 'lluvia';
  if ([45, 48].includes(code)) return 'bruma';
  if (cloudCover >= 65 || [3].includes(code)) return 'nublado';
  if (cloudCover >= 30 || code === 2) return 'bruma';
  return 'despejado';
}

export async function consultarMeteoReal(lat, lon) {
  const clave = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  const ahora = Date.now();
  const prev = cacheMeteo.get(clave);
  if (prev && ahora - prev.ts < 300000) return prev.datos;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m,weather_code,is_day&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);
  const j = await r.json();
  const c = j.current || {};
  const clima = mapearClimaWmo(c.weather_code ?? 0, c.cloud_cover ?? 0, c.precipitation ?? 0);
  const datos = {
    clima,
    temp: c.temperature_2m ?? null,
    windKmh: c.wind_speed_10m ?? 0,
    windDir: c.wind_direction_10m ?? 0,
    cloudCover: c.cloud_cover ?? 0,
    precip: c.precipitation ?? 0,
    esDia: c.is_day !== 0,
  };
  cacheMeteo.set(clave, { ts: ahora, datos });
  return datos;
}
