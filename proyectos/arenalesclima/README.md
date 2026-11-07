# 🌊 Arenales Clima · Arenales del Sol (Elche)

Aplicación web meteorológica interactiva y minimalista en tonos claros y azulados, diseñada para ordenador (PC) y dispositivos móviles, dedicada a la climatología en tiempo real y previsión de **Arenales del Sol, Elche (Alicante)**.

![Arenales Clima Preview](favicon.svg)

---

## 🌟 Características Principales

1. **Observación Actual en Tiempo Real**:
   - Temperatura y Sensación Térmica en tiempo real.
   - Rosa de los vientos con brisa litoral mediterránea (Levante, Garbí, Poniente) y ráfagas.
   - Nubosidad por capas (bajas, medias y altas) y visibilidad en kilómetros.
   - Presión barométrica al nivel del mar y punto de rocío.
   - Radiación Ultravioleta (Índice UV) y horas solares (amanecer / atardecer).

2. **Previsión por Horas y Gráfica Interactiva (48h)**:
   - Curva suave Bézier de temperatura con mapa de calor y relleno gradiente azul.
   - Barras de precipitación acumulada por horas y porcentaje de probabilidad.
   - Tabla detallada hora por hora con visor interactivo (*scrubber* táctil y cursor).

3. **Previsión Semanal (7 días)**:
   - Tarjetas interactivas con desglose desplegable para cada día (máximas, mínimas, rachas de viento, radiación UV y lluvia).

4. **Radar de Tormentas y Detección de Inestabilidad (DANA)**:
   - Radar interactivo centrado en el litoral de Elche, Santa Pola e Isla de Tabarca.
   - Detección de actividad convectiva y energía CAPE (Convective Available Potential Energy).
   - Animación de avance temporal y simulador de ecos de precipitación.

5. **Estado de la Playa y Mar (Arenales del Sol / Carabassí / Clot de Galvany)**:
   - Bandera del estado del mar (Verde / Amarilla / Roja) calculada según oleaje, viento y tormenta.
   - Altura de ola y período de oleaje en tiempo real (vía Open-Meteo Marine).
   - Estimación de temperatura del agua del Mediterráneo.

6. **Sistema de Alertas Meteorológicas**:
   - Monitor de avisos y umbrales de seguridad AEMET / Protección Civil para la comarca del Baix Vinalopó.

7. **Diseño Visual & Experiencia**:
   - Paleta clara y azulada (estilo mediterráneo, nubes, mar y cielo).
   - Iconografía SVG limpia y escalable.
   - Interfaz 100% responsiva (móviles, tablets y pantallas de escritorio).
   - Cambio rápido de unidades (°C / °F y km/h / nudos).

---

## 🚀 Despliegue en GitHub Pages

Este proyecto ya incluye el workflow oficial `.github/workflows/deploy.yml` para desplegarse automáticamente en GitHub Pages en cuanto se sube a tu repositorio.

### Pasos para conectar a tu repositorio de GitHub:

1. Crea un repositorio en tu cuenta de GitHub (por ejemplo, `arenales-clima`).
2. Añade el repositorio remoto:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/arenales-clima.git
   ```
3. Sube la rama principal:
   ```bash
   git branch -M main
   git push -u origin main
   ```
4. En GitHub, entra en **Settings > Pages** y asegúrate de que **Source** esté configurado en **GitHub Actions**. ¡Tu web estará online al instante!

---

*Desarrollado con datos abiertos de Open-Meteo API y AEMET.*
