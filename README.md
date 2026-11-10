# Laboratorio

Pequeñas herramientas y pruebas web. Cada proyecto tiene su código en `proyectos/` y su página en `docs/`.

**Sitio:** https://ivandlpn.github.io/laboratorio/

## Proyectos

| Proyecto | Página | Qué es |
|---|---|---|
| [Editor PDF a DWG](proyectos/editorpdf) | [/editorpdf](https://ivandlpn.github.io/laboratorio/editorpdf/) | Conversor de planos PDF a DXF que funciona en el navegador (sin subir archivos) y programa para Windows que además crea DWG. |
| [Kntera](proyectos/kntera) | [kntera.web.app](https://kntera.web.app) | Aplicación para la gestión y el seguimiento de equipos de fútbol base. Vive en su propio proyecto de Firebase; aquí está su [documentación](proyectos/kntera/documentacion) (sin el código). |
| [VisorRack](proyectos/visorrack) | [/visorrack](https://ivandlpn.github.io/laboratorio/visorrack/) | Visor de racks y equipos de red de la línea Albacete-Alicante, en copia de solo lectura (mapa, racks por unidades, puertos, inventario e historial). |
| [VISOR MDC](proyectos/visormdc) | [/visormdc](https://ivandlpn.github.io/laboratorio/visormdc/) | Visor de apoyo al mantenimiento de la base de Monforte del Cid (líneas 042, 046 y 048), en copia de solo lectura (mapa, lista, riesgos, clima y entornos 3D). |
| [PauseBox Pro](proyectos/pausebox) | [/pausebox](https://ivandlpn.github.io/laboratorio/pausebox/) | Entrenador biomecánico en tiempo real para sentadillas con pausa (Pause Squats) con visión por IA, guía sonora y Coach IA con Gemini. |
| [Arenales Clima](proyectos/arenalesclima) | [/arenalesclima](https://ivandlpn.github.io/laboratorio/arenalesclima/) | Visualización climatológica y marítima interactiva de Arenales del Sol (Elche). Observación, gráfica 48h, radar de tormentas y estado de la playa. |
| [Regalo Solidario Ineco 2026](proyectos/regaloineco) | [/regaloineco](https://ivandlpn.github.io/laboratorio/regaloineco/) | Calendario de Adviento interactivo y visual del lote solidario de Ineco para el equipo de la Base de Mantenimiento de Alta Velocidad de Monforte del Cid (Alicante) con 9 regalos, sonidos, telemetría y cesta personalizada. |
| [Guardias Teleco LAV ESTE](proyectos/guardiasteleco) | [/guardiasteleco](https://ivandlpn.github.io/laboratorio/guardiasteleco/) | Calendario interactivo de turnos de guardia semanal para el equipo de Telecomunicaciones de la LAV Este (Ineco), con asignación y sincronización en tiempo real con Firebase. |

## Cómo está organizado

```
laboratorio/
├─ docs/                     lo que se publica en GitHub Pages
│  ├─ index.html             portada con la lista de proyectos
│  ├─ assets/estilo.css      estilo compartido
│  └─ editorpdf/             https://ivandlpn.github.io/laboratorio/editorpdf/
├─ proyectos/
│  ├─ editorpdf/             código, ejemplo y script para construir el .exe
│  └─ kntera/                solo documentación (copia automática)
```

## Añadir un proyecto nuevo

1. Crea `proyectos/<nombre>/` con el código y un `README.md`.
2. Crea `docs/<nombre>/index.html` (copia `docs/editorpdf/index.html` como base) y usa rutas relativas (`../assets/estilo.css`).
3. Añade su tarjeta en `docs/index.html`.
4. `git push`: GitHub Pages publica la carpeta `docs/` de la rama `main` en uno o dos minutos.

## Descargas

Los programas ya construidos (por ejemplo `PDF_a_DWG.zip`) **no** se guardan en el repositorio: van en
[Releases](https://github.com/Ivandlpn/laboratorio/releases). Cada proyecto tiene su propia Release con una etiqueta fija (por ejemplo `editorpdf`) y su archivo se reemplaza
en cada versión, así que el enlace `releases/download/<etiqueta>/<archivo>` no cambia.

## Licencia

AGPL-3.0 (ver `LICENSE`). El Editor PDF a DWG usa PyMuPDF, que es AGPL, y por eso el código de este repositorio
se publica con la misma licencia.
