/**
 * Arenales Clima - Interactive Weather Application
 * Location: Arenales del Sol, Elche (Alicante) [38.2514° N, 0.5236° W]
 */

(function () {
  'use strict';

  // Constants & Coordinates
  const ARENALES_LAT = 38.2514;
  const ARENALES_LON = -0.5236;
  const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${ARENALES_LAT}&longitude=${ARENALES_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,cape&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&timezone=Europe%2FMadrid&forecast_days=7`;
  const MARINE_API_URL = `https://marine-api.open-meteo.com/v1/marine?latitude=${ARENALES_LAT}&longitude=${ARENALES_LON}&current=wave_height,wave_direction,wave_period`;

  // Application State
  const state = {
    unit: 'C', // 'C' or 'F'
    weatherData: null,
    marineData: null,
    activeTab: 'tab-overview',
    radarPlaying: false,
    radarInterval: null,
    radarFrame: 6,
    radarMode: 'radar' // 'radar' or 'sat'
  };

  // SVG Weather Icons Dictionary
  const ICONS = {
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><circle cx="12" cy="12" r="5" fill="#f59e0b" stroke="#d97706"/><path stroke="#f59e0b" stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#38bdf8" stroke="#0284c7"/></svg>`,
    cloudSun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><circle cx="10" cy="10" r="4" fill="#f59e0b" stroke="#d97706"/><path d="M17.5 19H9a5 5 0 0 1 0-10c.34 0 .67.04 1 .1A6 6 0 0 1 20 14.5a4.5 4.5 0 0 1-2.5 4.5Z" fill="#bae6fd" stroke="#0284c7"/></svg>`,
    cloudMoon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="#38bdf8" stroke="#0284c7"/><path d="M17.5 19H9a5 5 0 0 1 0-10c.34 0 .67.04 1 .1A6 6 0 0 1 20 14.5a4.5 4.5 0 0 1-2.5 4.5Z" fill="#bae6fd" stroke="#0284c7"/></svg>`,
    cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="#e0f2fe" stroke="#0284c7"/></svg>`,
    fog: `<svg viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" class="weather-svg"><path d="M5 9h14M3 13h18M6 17h12M9 21h6"/></svg>`,
    rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><path d="M17.5 16H9a5 5 0 0 1 0-10c.34 0 .67.04 1 .1A6 6 0 0 1 20 11.5a4.5 4.5 0 0 1-2.5 4.5Z" fill="#bae6fd" stroke="#0284c7"/><path stroke="#0ea5e9" stroke-linecap="round" d="M8 19v2M12 19v2M16 19v2"/></svg>`,
    heavyRain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><path d="M17.5 15H9a6 6 0 0 1 0-12c.34 0 .67.04 1 .1A7 7 0 0 1 20 9.5a5.5 5.5 0 0 1-2.5 5.5Z" fill="#7dd3fc" stroke="#0369a1"/><path stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" d="M8 18l-2 3M12 18l-2 3M16 18l-2 3"/></svg>`,
    thunder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><path d="M17.5 15H9a6 6 0 0 1 0-12c.34 0 .67.04 1 .1A7 7 0 0 1 20 9.5a5.5 5.5 0 0 1-2.5 5.5Z" fill="#94a3b8" stroke="#475569"/><polygon points="13 13 9 19 13 19 11 23 17 16 13 16 13 13" fill="#f59e0b" stroke="#d97706"/></svg>`,
    snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="weather-svg"><path d="M17.5 16H9a5 5 0 0 1 0-10c.34 0 .67.04 1 .1A6 6 0 0 1 20 11.5a4.5 4.5 0 0 1-2.5 4.5Z" fill="#e0f2fe" stroke="#0284c7"/><path stroke="#38bdf8" stroke-linecap="round" d="M8 19h.01M12 19h.01M16 19h.01M10 21h.01M14 21h.01"/></svg>`
  };

  // Weather Code mappings (WMO standard)
  function getWeatherMeta(code, isDay = 1) {
    switch (code) {
      case 0:
        return { desc: 'Cielo despejado', icon: isDay ? ICONS.sun : ICONS.moon, type: 'clear' };
      case 1:
        return { desc: 'Mayormente despejado', icon: isDay ? ICONS.sun : ICONS.moon, type: 'clear' };
      case 2:
        return { desc: 'Parcialmente nublado', icon: isDay ? ICONS.cloudSun : ICONS.cloudMoon, type: 'part-cloud' };
      case 3:
        return { desc: 'Nublado', icon: ICONS.cloud, type: 'cloud' };
      case 45:
      case 48:
        return { desc: 'Niebla o bruma costera', icon: ICONS.fog, type: 'fog' };
      case 51:
      case 53:
      case 55:
        return { desc: 'Llovizna dispersa', icon: ICONS.rain, type: 'drizzle' };
      case 61:
      case 63:
        return { desc: 'Lluvia moderada', icon: ICONS.rain, type: 'rain' };
      case 65:
        return { desc: 'Lluvia fuerte', icon: ICONS.heavyRain, type: 'heavyRain' };
      case 80:
      case 81:
      case 82:
        return { desc: 'Chubascos costeros', icon: ICONS.heavyRain, type: 'heavyRain' };
      case 95:
        return { desc: 'Tormenta con aparato eléctrico', icon: ICONS.thunder, type: 'thunder' };
      case 96:
      case 99:
        return { desc: 'Tormenta severa con granizo', icon: ICONS.thunder, type: 'thunder' };
      default:
        return { desc: 'Cielo variable', icon: isDay ? ICONS.cloudSun : ICONS.cloud, type: 'cloud' };
    }
  }

  // Mediterranean Wind Direction Names
  function getWindName(deg) {
    if (deg >= 337.5 || deg < 22.5) return 'Tramuntana (N)';
    if (deg >= 22.5 && deg < 67.5) return 'Gregal (NE)';
    if (deg >= 67.5 && deg < 112.5) return 'Levante (E) · Brisa marina';
    if (deg >= 112.5 && deg < 157.5) return 'Siroco / Xaloc (SE)';
    if (deg >= 157.5 && deg < 202.5) return 'Migjorn (S)';
    if (deg >= 202.5 && deg < 247.5) return 'Garbí / Lebeche (SO)';
    if (deg >= 247.5 && deg < 292.5) return 'Poniente (O) · Viento de tierra';
    return 'Maestral (NO)';
  }

  // Format Temperature
  function fmtTemp(val) {
    if (val === null || val === undefined) return '--°';
    if (state.unit === 'F') {
      const f = (val * 9) / 5 + 32;
      return `${Math.round(f)}°F`;
    }
    return `${Math.round(val)}°C`;
  }

  function fmtSpeed(val) {
    if (val === null || val === undefined) return '--';
    if (state.unit === 'F') {
      const kts = val * 0.539957;
      return `${Math.round(kts)} kt`;
    }
    return `${Math.round(val)} km/h`;
  }

  // Robust Fallback Data for Arenales del Sol (in case of network failure)
  function getFallbackData() {
    const now = new Date();
    const hourlyTimes = [];
    const hourlyTemps = [];
    const hourlyRains = [];
    const hourlyProbs = [];
    const hourlyWinds = [];
    const hourlyCodes = [];
    const hourlyClouds = [];
    const hourlyUVs = [];

    for (let i = 0; i < 48; i++) {
      const d = new Date(now.getTime() + i * 3600000);
      hourlyTimes.push(d.toISOString());
      const hour = d.getHours();
      // Natural Mediterranean temperature curve (coolest at 6am, warmest at 3pm)
      const baseTemp = 20 + 5 * Math.sin(((hour - 8) / 24) * 2 * Math.PI);
      hourlyTemps.push(parseFloat(baseTemp.toFixed(1)));
      hourlyRains.push(hour === 16 ? 0.3 : 0.0);
      hourlyProbs.push(hour >= 15 && hour <= 18 ? 20 : 5);
      hourlyWinds.push(Math.round(14 + 6 * Math.sin((hour / 24) * 2 * Math.PI)));
      hourlyCodes.push(hour >= 14 && hour <= 17 ? 2 : 1);
      hourlyClouds.push(hour >= 13 && hour <= 18 ? 35 : 10);
      hourlyUVs.push(hour >= 11 && hour <= 16 ? 5.2 : 0.1);
    }

    return {
      current: {
        time: now.toISOString(),
        temperature_2m: 21.4,
        apparent_temperature: 21.8,
        relative_humidity_2m: 64,
        precipitation: 0.0,
        rain: 0.0,
        weather_code: 1,
        cloud_cover: 18,
        pressure_msl: 1016.4,
        wind_speed_10m: 16.2,
        wind_direction_10m: 85, // Levante
        wind_gusts_10m: 24.0,
        is_day: now.getHours() >= 7 && now.getHours() < 19 ? 1 : 0
      },
      hourly: {
        time: hourlyTimes,
        temperature_2m: hourlyTemps,
        apparent_temperature: hourlyTemps.map(t => t + 0.4),
        precipitation: hourlyRains,
        precipitation_probability: hourlyProbs,
        wind_speed_10m: hourlyWinds,
        wind_direction_10m: hourlyTimes.map(() => 85),
        weather_code: hourlyCodes,
        cloud_cover: hourlyClouds,
        cloud_cover_low: hourlyClouds.map(c => Math.round(c * 0.4)),
        cloud_cover_mid: hourlyClouds.map(c => Math.round(c * 0.3)),
        cloud_cover_high: hourlyClouds.map(c => Math.round(c * 0.3)),
        visibility: hourlyTimes.map(() => 25000),
        uv_index: hourlyUVs,
        cape: hourlyTimes.map(() => 140)
      },
      daily: {
        time: [0, 1, 2, 3, 4, 5, 6].map(offset => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          return d.toISOString().split('T')[0];
        }),
        weather_code: [1, 2, 0, 1, 2, 80, 0],
        temperature_2m_max: [23.5, 24.1, 22.8, 23.0, 22.4, 20.8, 22.0],
        temperature_2m_min: [15.2, 16.0, 14.8, 15.0, 14.5, 13.9, 14.2],
        apparent_temperature_max: [24.0, 24.8, 23.2, 23.5, 22.8, 20.5, 22.2],
        apparent_temperature_min: [15.0, 15.8, 14.2, 14.8, 14.0, 13.5, 14.0],
        sunrise: ['07:38', '07:39', '07:40', '07:41', '07:42', '07:43', '07:44'],
        sunset: ['18:02', '18:01', '18:00', '17:59', '17:58', '17:57', '17:56'],
        uv_index_max: [5.2, 5.0, 5.4, 5.1, 4.8, 3.9, 5.3],
        precipitation_sum: [0.0, 0.0, 0.0, 0.2, 0.0, 3.4, 0.0],
        precipitation_probability_max: [10, 15, 5, 20, 10, 65, 5],
        wind_speed_10m_max: [18.5, 21.0, 16.0, 19.5, 22.0, 32.0, 15.0],
        wind_gusts_10m_max: [28.0, 32.0, 24.0, 29.0, 34.0, 48.0, 22.0]
      }
    };
  }

  // Fetch Weather Data
  async function loadData() {
    const livePill = document.getElementById('livePill');
    const liveText = document.getElementById('liveText');
    
    try {
      liveText.textContent = 'Actualizando...';
      const [wRes, mRes] = await Promise.allSettled([
        fetch(API_URL),
        fetch(MARINE_API_URL)
      ]);

      if (wRes.status === 'fulfilled' && wRes.value.ok) {
        state.weatherData = await wRes.value.json();
      } else {
        console.warn('Usando dataset alternativo para Arenales');
        state.weatherData = getFallbackData();
      }

      if (mRes.status === 'fulfilled' && mRes.value.ok) {
        state.marineData = await mRes.value.json();
      } else {
        state.marineData = {
          current: { wave_height: 0.35, wave_period: 6.8, wave_direction: 78 }
        };
      }

      liveText.textContent = 'En directo';
      livePill.classList.remove('offline');
    } catch (err) {
      console.warn('Error fetching weather data, using fallback', err);
      state.weatherData = getFallbackData();
      state.marineData = { current: { wave_height: 0.35, wave_period: 6.8, wave_direction: 78 } };
      liveText.textContent = 'Modo local';
    }

    renderAll();
  }

  // Master Render Function
  function renderAll() {
    if (!state.weatherData) return;
    renderCurrentObservation();
    renderHourlyRibbon();
    renderMetrics();
    renderInteractiveChart();
    renderDailyForecast();
    renderRadarEchos();
    renderBeachState();
    renderAlerts();
  }

  // 1. Current Observation Banner
  function renderCurrentObservation() {
    const cur = state.weatherData.current;
    const meta = getWeatherMeta(cur.weather_code, cur.is_day);

    document.getElementById('conditionText').textContent = meta.desc;
    document.getElementById('currentTemp').textContent = fmtTemp(cur.temperature_2m);
    document.getElementById('currentWeatherIcon').innerHTML = meta.icon;
    document.getElementById('feelsLikeTemp').textContent = fmtTemp(cur.apparent_temperature);

    const todayMin = state.weatherData.daily.temperature_2m_min[0];
    const todayMax = state.weatherData.daily.temperature_2m_max[0];
    document.getElementById('tempMin').textContent = fmtTemp(todayMin);
    document.getElementById('tempMax').textContent = fmtTemp(todayMax);

    // Update timestamp
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdated').textContent = `Actualizado: ${timeStr}`;

    // Stat boxes on the right
    document.getElementById('windSpeed').textContent = fmtSpeed(cur.wind_speed_10m);
    document.getElementById('windDirection').textContent = getWindName(cur.wind_direction_10m);

    document.getElementById('cloudCover').textContent = `${Math.round(cur.cloud_cover)}%`;
    let cloudText = 'Despejado';
    if (cur.cloud_cover > 75) cloudText = 'Cielo muy cubierto';
    else if (cur.cloud_cover > 45) cloudText = 'Nuboso';
    else if (cur.cloud_cover > 20) cloudText = 'Intervalos nubosos';
    document.getElementById('cloudBase').textContent = cloudText;

    document.getElementById('humidityVal').textContent = `${Math.round(cur.relative_humidity_2m)}%`;
    // Dew point calculation approximation
    const T = cur.temperature_2m;
    const RH = cur.relative_humidity_2m;
    const dew = T - (100 - RH) / 5;
    document.getElementById('dewPoint').textContent = `Rocío: ${fmtTemp(dew)}`;
  }

  // 2. Quick 24h Hourly Ribbon
  function renderHourlyRibbon() {
    const container = document.getElementById('quickHourlyRibbon');
    container.innerHTML = '';

    const hourly = state.weatherData.hourly;
    const now = new Date();
    const currentHourIndex = hourly.time.findIndex(t => new Date(t) >= now) || 0;

    for (let i = currentHourIndex; i < currentHourIndex + 24; i++) {
      if (!hourly.time[i]) break;
      const date = new Date(hourly.time[i]);
      const hourStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const isDay = date.getHours() >= 7 && date.getHours() < 20 ? 1 : 0;
      const meta = getWeatherMeta(hourly.weather_code[i], isDay);
      const isNow = i === currentHourIndex;

      const chip = document.createElement('div');
      chip.className = `hourly-chip ${isNow ? 'current' : ''}`;
      chip.innerHTML = `
        <span class="h-time">${isNow ? 'Ahora' : hourStr}</span>
        <div class="h-icon">${meta.icon}</div>
        <span class="h-temp">${fmtTemp(hourly.temperature_2m[i])}</span>
        <span class="h-rain">${hourly.precipitation_probability[i] || 0}%</span>
      `;
      container.appendChild(chip);
    }
  }

  // 3. Detailed Metrics Cards
  function renderMetrics() {
    const cur = state.weatherData.current;
    const hourly = state.weatherData.hourly;
    const daily = state.weatherData.daily;

    // Cloud layers breakdown
    const cloudCover = cur.cloud_cover;
    document.getElementById('cloudCoverBig').textContent = `${Math.round(cloudCover)}%`;
    const low = hourly.cloud_cover_low ? hourly.cloud_cover_low[0] : Math.round(cloudCover * 0.4);
    const mid = hourly.cloud_cover_mid ? hourly.cloud_cover_mid[0] : Math.round(cloudCover * 0.35);
    const high = hourly.cloud_cover_high ? hourly.cloud_cover_high[0] : Math.round(cloudCover * 0.25);

    document.getElementById('cloudLowBar').style.width = `${low}%`;
    document.getElementById('cloudLowVal').textContent = `${low}%`;
    document.getElementById('cloudMidBar').style.width = `${mid}%`;
    document.getElementById('cloudMidVal').textContent = `${mid}%`;
    document.getElementById('cloudHighBar').style.width = `${high}%`;
    document.getElementById('cloudHighVal').textContent = `${high}%`;

    const vis = (hourly.visibility && hourly.visibility[0]) ? Math.round(hourly.visibility[0] / 1000) : 25;
    document.getElementById('visibilityText').textContent = `Visibilidad costera: ${vis >= 15 ? 'Excelente (>15 km)' : vis + ' km'}`;

    // Rain & Precipitation
    const rainSum = daily.precipitation_sum ? daily.precipitation_sum[0] : 0;
    const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
    document.getElementById('rainSum').textContent = `${rainSum.toFixed(1)} mm`;
    document.getElementById('rainChanceBadge').textContent = `Probabilidad: ${rainProb}% hoy`;

    let intensityLabel = 'Seco';
    let gaugeWidth = 5;
    if (cur.precipitation > 5) { intensityLabel = 'Torrencial'; gaugeWidth = 100; }
    else if (cur.precipitation > 2) { intensityLabel = 'Fuerte'; gaugeWidth = 75; }
    else if (cur.precipitation > 0.5) { intensityLabel = 'Moderada'; gaugeWidth = 45; }
    else if (cur.precipitation > 0) { intensityLabel = 'Débil / Llovizna'; gaugeWidth = 20; }
    document.getElementById('rainIntensityLabel').textContent = intensityLabel;
    document.getElementById('rainGaugeFill').style.width = `${gaugeWidth}%`;

    // Storm & CAPE
    const cape = (hourly.cape && hourly.cape[0]) ? Math.round(hourly.cape[0]) : 120;
    document.getElementById('capeVal').textContent = `${cape} J/kg`;
    let stormLabel = 'Bajo';
    let stormDesc = 'Atmósfera costera estable sin células convectivas';
    let lightning = 'Mínimo';
    if (cape > 1500) {
      stormLabel = 'Muy Alto (Riesgo Severo)';
      stormDesc = 'Alta energía convectiva. Posible formación de tormentas súbitas';
      lightning = 'Elevado (>70%)';
    } else if (cape > 800) {
      stormLabel = 'Moderado';
      stormDesc = 'Inestabilidad moderada en la bahía de Alicante';
      lightning = 'Moderado';
    }
    document.getElementById('stormRiskLabel').textContent = stormLabel;
    document.getElementById('stormAdvice').textContent = stormDesc;
    document.getElementById('lightningRisk').textContent = lightning;

    // Wind Compass & Readouts
    const windDeg = cur.wind_direction_10m || 90;
    const needle = document.getElementById('compassNeedle');
    if (needle) needle.style.transform = `rotate(${windDeg}deg)`;
    document.getElementById('windSpeedDetail').textContent = fmtSpeed(cur.wind_speed_10m);
    document.getElementById('windName').textContent = getWindName(windDeg);
    document.getElementById('windGusts').textContent = fmtSpeed(cur.wind_gusts_10m);

    // UV Index
    const uv = daily.uv_index_max ? daily.uv_index_max[0] : 4.5;
    document.getElementById('uvIndexVal').textContent = uv.toFixed(1);
    let uvBadge = 'Moderado';
    let uvText = 'Se recomienda protección solar en horas punta';
    if (uv >= 8) { uvBadge = 'Muy Alto / Extremo'; uvText = 'Evitar exposición prolongada. Imprescindible fotoprotección SPF50+'; }
    else if (uv >= 6) { uvBadge = 'Alto'; uvText = 'Protección solar y gafas recomendadas en la playa'; }
    else if (uv <= 2) { uvBadge = 'Bajo'; uvText = 'No se precisa protección especial'; }
    document.getElementById('uvBadge').textContent = uvBadge;
    document.getElementById('uvAdvice').textContent = uvText;

    // Sunrise & Sunset
    if (daily.sunrise && daily.sunrise[0]) {
      const sr = new Date(daily.sunrise[0]);
      document.getElementById('sunriseTime').textContent = sr.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (daily.sunset && daily.sunset[0]) {
      const ss = new Date(daily.sunset[0]);
      document.getElementById('sunsetTime').textContent = ss.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    // Barometric Pressure
    const pres = cur.pressure_msl || 1016;
    document.getElementById('pressureVal').textContent = `${Math.round(pres)} hPa`;
  }

  // 4. Interactive SVG Temperature & Rain Chart (Tab 2)
  function renderInteractiveChart() {
    const svg = document.getElementById('hourlyChartSvg');
    const tableBody = document.getElementById('hourlyTableBody');
    if (!svg || !state.weatherData) return;

    svg.innerHTML = '';
    tableBody.innerHTML = '';

    const hourly = state.weatherData.hourly;
    const pointsCount = 24; // next 24 hours
    const times = hourly.time.slice(0, pointsCount);
    const temps = hourly.temperature_2m.slice(0, pointsCount);
    const rains = hourly.precipitation.slice(0, pointsCount);
    const probs = hourly.precipitation_probability.slice(0, pointsCount);
    const winds = hourly.wind_speed_10m.slice(0, pointsCount);
    const clouds = hourly.cloud_cover.slice(0, pointsCount);
    const uvs = hourly.uv_index.slice(0, pointsCount);

    const minTemp = Math.floor(Math.min(...temps)) - 2;
    const maxTemp = Math.ceil(Math.max(...temps)) + 2;
    const maxRain = Math.max(2.0, ...rains);

    const width = 800;
    const height = 240;
    const padding = { top: 25, right: 30, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Build SVG Grid lines
    let gridHtml = '';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const tVal = maxTemp - ((maxTemp - minTemp) / 4) * i;
      gridHtml += `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="4,4"/>
        <text x="${padding.left - 8}" y="${y + 4}" fill="#94a3b8" font-size="10" text-anchor="end">${Math.round(tVal)}°</text>
      `;
    }

    // Generate Points & Bézier Path for Temperature
    const points = temps.map((t, i) => {
      const x = padding.left + (chartW / (pointsCount - 1)) * i;
      const y = padding.top + chartH - ((t - minTemp) / (maxTemp - minTemp)) * chartH;
      return { x, y, temp: t, rain: rains[i], prob: probs[i], wind: winds[i], time: times[i] };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Precipitation bars
    let rainBarsHtml = '';
    points.forEach((p, i) => {
      if (p.rain > 0.05) {
        const barH = (p.rain / maxRain) * (chartH * 0.4);
        const barY = padding.top + chartH - barH;
        rainBarsHtml += `
          <rect x="${p.x - 6}" y="${barY}" width="12" height="${barH}" fill="#38bdf8" opacity="0.75" rx="2"/>
        `;
      }
      // Time labels every 3 hours
      const date = new Date(p.time);
      if (i % 3 === 0 || i === pointsCount - 1) {
        const hourStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        rainBarsHtml += `
          <text x="${p.x}" y="${height - 12}" fill="#64748b" font-size="11" text-anchor="middle">${hourStr}</text>
        `;
      }
    });

    // Interactive hover circles and vertical guide line
    let dotsHtml = '';
    points.forEach((p, idx) => {
      dotsHtml += `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#ffffff" stroke="#0284c7" stroke-width="2.5" class="chart-point" data-index="${idx}"/>
      `;
    });

    svg.innerHTML = `
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridHtml}
      ${rainBarsHtml}
      <path d="${areaD}" fill="url(#chartGradient)"/>
      <path d="${pathD}" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
      <line id="chartScrubber" x1="0" y1="${padding.top}" x2="0" y2="${padding.top + chartH}" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2,2" class="hidden"/>
      ${dotsHtml}
    `;

    // Tooltip interaction
    const tooltip = document.getElementById('chartTooltip');
    const scrubber = document.getElementById('chartScrubber');

    function showTooltip(p) {
      if (!tooltip || !p) return;
      tooltip.classList.remove('hidden');
      const d = new Date(p.time);
      document.getElementById('tooltipTime').textContent = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', weekday: 'short' });
      document.getElementById('tooltipTemp').textContent = fmtTemp(p.temp);
      document.getElementById('tooltipRain').textContent = `${p.rain.toFixed(1)} mm (${p.prob}%)`;
      document.getElementById('tooltipWind').textContent = fmtSpeed(p.wind);

      if (scrubber) {
        scrubber.classList.remove('hidden');
        scrubber.setAttribute('x1', p.x);
        scrubber.setAttribute('x2', p.x);
      }
    }

    svg.onmousemove = function (e) {
      const rect = svg.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const ratio = clientX / rect.width;
      const targetIndex = Math.min(pointsCount - 1, Math.max(0, Math.round(ratio * (pointsCount - 1))));
      showTooltip(points[targetIndex]);
    };

    svg.onmouseleave = function () {
      if (tooltip) tooltip.classList.add('hidden');
      if (scrubber) scrubber.classList.add('hidden');
    };

    // Populate Table
    points.forEach((p, i) => {
      const d = new Date(p.time);
      const isDay = d.getHours() >= 7 && d.getHours() < 20 ? 1 : 0;
      const meta = getWeatherMeta(hourly.weather_code[i], isDay);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong></td>
        <td><div style="display:flex;align-items:center;gap:6px"><span style="width:20px;height:20px;display:inline-block">${meta.icon}</span><span>${meta.desc}</span></div></td>
        <td><strong>${fmtTemp(p.temp)}</strong></td>
        <td>${fmtTemp(hourly.apparent_temperature[i])}</td>
        <td>${p.rain.toFixed(1)} mm (${p.prob}%)</td>
        <td>${clouds[i]}%</td>
        <td>${fmtSpeed(p.wind)}</td>
        <td>${uvs[i] ? uvs[i].toFixed(1) : 0}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // 5. 7-Day Daily Forecast (Tab 3)
  function renderDailyForecast() {
    const list = document.getElementById('dailyForecastList');
    if (!list || !state.weatherData) return;
    list.innerHTML = '';

    const daily = state.weatherData.daily;
    const count = daily.time.length;

    // Find min and max for temperature bars
    const allMin = Math.min(...daily.temperature_2m_min);
    const allMax = Math.max(...daily.temperature_2m_max);
    const range = allMax - allMin || 1;

    for (let i = 0; i < count; i++) {
      const date = new Date(daily.time[i]);
      const dayName = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : date.toLocaleDateString('es-ES', { weekday: 'long' });
      const capDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

      const meta = getWeatherMeta(daily.weather_code[i], 1);
      const tMin = daily.temperature_2m_min[i];
      const tMax = daily.temperature_2m_max[i];
      const rainSum = daily.precipitation_sum ? daily.precipitation_sum[i] : 0;
      const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
      const windMax = daily.wind_speed_10m_max ? daily.wind_speed_10m_max[i] : 15;
      const uvMax = daily.uv_index_max ? daily.uv_index_max[i] : 4;

      const barLeft = ((tMin - allMin) / range) * 100;
      const barWidth = ((tMax - tMin) / range) * 100;

      const item = document.createElement('div');
      item.className = 'daily-item';
      item.innerHTML = `
        <div class="daily-item-row">
          <div class="daily-date-col">
            <span class="d-name">${capDayName}</span>
            <span class="d-date">${dateStr}</span>
          </div>
          <div class="daily-icon">${meta.icon}</div>
          <div class="d-summary">${meta.desc}</div>
          <div class="daily-temp-bar-wrap">
            <span class="t-min">${fmtTemp(tMin)}</span>
            <div class="t-bar-bg">
              <div class="t-bar-fill" style="left: ${barLeft}%; width: ${Math.max(12, barWidth)}%;"></div>
            </div>
            <span class="t-max">${fmtTemp(tMax)}</span>
          </div>
          <div class="daily-rain-badge">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            <span>${rainProb}%</span>
          </div>
          <div class="daily-chevron">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="daily-details-drawer">
          <div class="drawer-stat">
            <span class="ds-label">Lluvia estimada</span>
            <span class="ds-val">${rainSum.toFixed(1)} mm</span>
          </div>
          <div class="drawer-stat">
            <span class="ds-label">Racha máxima de viento</span>
            <span class="ds-val">${fmtSpeed(windMax)}</span>
          </div>
          <div class="drawer-stat">
            <span class="ds-label">Índice UV máximo</span>
            <span class="ds-val">${uvMax.toFixed(1)} (Protección)</span>
          </div>
          <div class="drawer-stat">
            <span class="ds-label">Sensación térmica</span>
            <span class="ds-val">${fmtTemp(daily.apparent_temperature_min[i])} / ${fmtTemp(daily.apparent_temperature_max[i])}</span>
          </div>
        </div>
      `;

      item.onclick = function () {
        item.classList.toggle('expanded');
      };

      list.appendChild(item);
    }
  }

  // 6. Radar & Echo Clusters (Tab 4)
  function renderRadarEchos() {
    const group = document.getElementById('radarEchoesGroup');
    if (!group) return;

    // Simulated storm/rain echoes moving across Mediterranean coast
    const offset = (state.radarFrame - 6) * 15;
    
    // Echo cells near Santa Pola bay and Alicante coast
    group.innerHTML = `
      <!-- Rain echo 1 (offshore Arenales) -->
      <g opacity="0.6" transform="translate(${offset}, ${offset * 0.4})">
        <ellipse cx="290" cy="180" rx="35" ry="22" fill="#38bdf8" opacity="0.5"/>
        <ellipse cx="295" cy="182" rx="20" ry="12" fill="#22c55e" opacity="0.6"/>
        <ellipse cx="298" cy="183" rx="8" ry="5" fill="#eab308" opacity="0.7"/>
      </g>
      <!-- Rain echo 2 (Inland near Elche) -->
      <g opacity="0.5" transform="translate(${offset * 1.2}, ${offset * 0.2})">
        <ellipse cx="90" cy="170" rx="28" ry="18" fill="#38bdf8" opacity="0.45"/>
        <ellipse cx="92" cy="172" rx="14" ry="9" fill="#22c55e" opacity="0.55"/>
      </g>
    `;
  }

  // 7. Beach State & Ocean Conditions (Tab 5)
  function renderBeachState() {
    const m = state.marineData?.current || { wave_height: 0.35, wave_period: 6.5 };
    const cur = state.weatherData?.current || { wind_speed_10m: 14 };

    const waveH = m.wave_height || 0.35;
    const waveP = m.wave_period || 6.5;
    const wind = cur.wind_speed_10m || 14;

    document.getElementById('waveHeightVal').textContent = `${waveH.toFixed(2)} m`;
    document.getElementById('wavePeriodVal').textContent = `${waveP.toFixed(1)} s`;

    // Sea temperature estimate based on seasonal Mediterranean cycle (18-26°C)
    const month = new Date().getMonth();
    const seaTemps = [15.2, 14.8, 15.5, 17.0, 19.5, 23.2, 26.5, 27.2, 25.8, 22.8, 19.4, 16.8];
    const estimatedSea = seaTemps[month] || 19.5;
    document.getElementById('seaTempVal').textContent = `${estimatedSea.toFixed(1)} °C`;

    // Flag logic
    const flagWrap = document.getElementById('beachFlagWrap');
    const flagText = document.getElementById('flagText');
    const beachTitle = document.getElementById('beachTitle');
    const beachDesc = document.getElementById('beachDesc');

    flagWrap.className = 'beach-flag-wrap';

    if (waveH > 1.5 || wind > 45 || cur.weather_code >= 95) {
      flagWrap.classList.add('red');
      flagText.textContent = 'Bandera Roja (Prohibido el baño)';
      beachTitle.textContent = 'Precaución extrema en el mar';
      beachDesc.textContent = 'Fuerte oleaje y resaca en las playas de Arenales del Sol y Carabassí. Se prohíbe el baño por seguridad.';
    } else if (waveH > 0.6 || wind > 28) {
      flagWrap.classList.add('yellow');
      flagText.textContent = 'Bandera Amarilla (Precaución)';
      beachTitle.textContent = 'Baño con precaución';
      beachDesc.textContent = 'Marejadilla activa con olas de hasta ' + waveH.toFixed(1) + ' m. Ideal para windsurf y deportes con cometa, pero mantenga vigilancia con niños.';
    } else {
      flagText.textContent = 'Bandera Verde (Mar en calma)';
      beachTitle.textContent = 'Condiciones idóneas para el baño y paseo';
      beachDesc.textContent = 'Viento flojo y mar en calma en la línea de costa de Arenales y Carabassí. Respete siempre las indicaciones del personal de socorrismo.';
    }
  }

  // 8. Alerts & Advisories System (Tab 6)
  function renderAlerts() {
    const cur = state.weatherData?.current;
    const daily = state.weatherData?.daily;
    const list = document.getElementById('alertsChecklist');
    const banner = document.getElementById('alertBanner');
    const overallPill = document.getElementById('alertsOverallPill');
    if (!list || !cur) return;

    list.innerHTML = '';

    const alerts = [
      {
        title: 'Fenómenos Costeros (Oleaje y Levante)',
        criteria: 'Olas > 2.5m o Viento > 50 km/h en mar',
        active: (cur.wind_speed_10m > 50 || cur.wind_gusts_10m > 70),
        level: cur.wind_speed_10m > 50 ? 'orange' : 'green',
        badge: cur.wind_speed_10m > 50 ? 'Aviso Naranja' : 'Normalidad Verde'
      },
      {
        title: 'Racha de Viento en Litoral',
        criteria: 'Rachas superiores a 70 km/h',
        active: cur.wind_gusts_10m > 70,
        level: cur.wind_gusts_10m > 70 ? 'yellow' : 'green',
        badge: cur.wind_gusts_10m > 70 ? 'Aviso Amarillo' : 'Normalidad Verde'
      },
      {
        title: 'Lluvias Torrenciales y DANA',
        criteria: 'Precipitación acumulada > 20 mm/1h',
        active: (cur.precipitation > 15 || (daily && daily.precipitation_sum[0] > 40)),
        level: 'green',
        badge: 'Normalidad Verde'
      },
      {
        title: 'Tormentas con Aparato Eléctrico',
        criteria: 'Actividad eléctrica detectada a < 25 km',
        active: cur.weather_code >= 95,
        level: cur.weather_code >= 95 ? 'orange' : 'green',
        badge: cur.weather_code >= 95 ? 'Aviso Naranja' : 'Normalidad Verde'
      },
      {
        title: 'Temperaturas Extremas (Calor / Frío)',
        criteria: 'Máxima > 36°C o Mínima < 0°C',
        active: (cur.temperature_2m > 36 || cur.temperature_2m < 2),
        level: 'green',
        badge: 'Normalidad Verde'
      }
    ];

    let hasActiveAlert = false;
    let highestAlert = null;

    alerts.forEach(a => {
      if (a.active) {
        hasActiveAlert = true;
        highestAlert = a;
      }

      const item = document.createElement('div');
      item.className = 'alert-check-item';
      item.innerHTML = `
        <div class="aci-left">
          <div class="aci-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="aci-texts">
            <strong>${a.title}</strong>
            <span>${a.criteria}</span>
          </div>
        </div>
        <div class="aci-badge ${a.level}">${a.badge}</div>
      `;
      list.appendChild(item);
    });

    if (hasActiveAlert && highestAlert) {
      banner.className = `alert-banner ${highestAlert.level}`;
      document.getElementById('alertTitle').textContent = highestAlert.title;
      document.getElementById('alertDesc').textContent = `Precaución en Arenales del Sol y litoral de Elche. ${highestAlert.criteria}`;
      overallPill.textContent = 'Avisos en vigor';
      overallPill.className = 'alerts-overall-pill warning';
    } else {
      banner.className = 'alert-banner hidden';
      overallPill.textContent = 'Sin avisos activos';
      overallPill.className = 'alerts-overall-pill';
    }
  }

  // Setup Event Listeners
  function setupEvents() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');

        document.querySelectorAll('.tab-pane').forEach(p => {
          p.classList.remove('active');
        });

        const targetPane = document.getElementById(targetTab);
        if (targetPane) targetPane.classList.add('active');

        // Re-render chart if switching to hourly to ensure SVG dimensions
        if (targetTab === 'tab-hourly') {
          setTimeout(renderInteractiveChart, 50);
        }
      });
    });

    // Alert Banner button jumps to alerts tab
    const alertBtn = document.getElementById('btnAlertDetails');
    if (alertBtn) {
      alertBtn.addEventListener('click', () => {
        const tabAlertsBtn = document.querySelector('[data-tab="tab-alerts"]');
        if (tabAlertsBtn) tabAlertsBtn.click();
      });
    }

    // Unit toggle (°C / °F)
    const unitBtn = document.getElementById('btnUnitToggle');
    if (unitBtn) {
      unitBtn.addEventListener('click', () => {
        state.unit = state.unit === 'C' ? 'F' : 'C';
        document.getElementById('unitText').textContent = state.unit === 'C' ? '°C · km/h' : '°F · kt';
        renderAll();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('btnRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.style.transform = 'rotate(360deg)';
        loadData();
        setTimeout(() => { refreshBtn.style.transform = 'none'; }, 600);
      });
    }

    // Radar Play / Pause
    const playBtn = document.getElementById('btnRadarPlay');
    const timeRange = document.getElementById('radarTimeRange');
    if (playBtn && timeRange) {
      playBtn.addEventListener('click', () => {
        state.radarPlaying = !state.radarPlaying;
        if (state.radarPlaying) {
          playBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <span>Pausar radar</span>
          `;
          state.radarInterval = setInterval(() => {
            state.radarFrame = (state.radarFrame + 1) % 7;
            timeRange.value = state.radarFrame;
            renderRadarEchos();
          }, 800);
        } else {
          playBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Animar radar</span>
          `;
          clearInterval(state.radarInterval);
        }
      });

      timeRange.addEventListener('input', (e) => {
        state.radarFrame = parseInt(e.target.value, 10);
        renderRadarEchos();
      });
    }

    // Radar Mode Toggles
    const btnRadar = document.getElementById('btnModeRadar');
    const btnSat = document.getElementById('btnModeSat');
    if (btnRadar && btnSat) {
      btnRadar.addEventListener('click', () => {
        btnRadar.classList.add('active');
        btnSat.classList.remove('active');
        state.radarMode = 'radar';
        renderRadarEchos();
      });
      btnSat.addEventListener('click', () => {
        btnSat.classList.add('active');
        btnRadar.classList.remove('active');
        state.radarMode = 'sat';
        renderRadarEchos();
      });
    }

    // Auto-refresh every 5 minutes
    setInterval(loadData, 300000);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    loadData();
  });

})();
