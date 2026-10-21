# Laboratorio

Pequeñas herramientas y pruebas web. Cada proyecto tiene su código en `proyectos/` y su página en `docs/`.

**Sitio:** https://ivandlpn.github.io/laboratorio/

## Proyectos

| Proyecto | Página | Qué es |
|---|---|---|
| [Editor PDF a DWG](proyectos/editorpdf) | [/editorpdf](https://ivandlpn.github.io/laboratorio/editorpdf/) | Programa para Windows que convierte planos en PDF a DXF y DWG editables. |
| [Kntera](proyectos/kntera) | [kntera.web.app](https://kntera.web.app) | Aplicación para la gestión y el seguimiento de equipos de fútbol base. Vive en su propio proyecto de Firebase; aquí está su [documentación](proyectos/kntera/documentacion) (sin el código). |

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
