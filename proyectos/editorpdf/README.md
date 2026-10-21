# Editor PDF a DWG

Programa de escritorio para Windows (Python + tkinter) que convierte planos vectoriales en PDF a **DXF** y **DWG**,
conservando capas, colores, grosores y textos.

- Página de descarga: https://ivandlpn.github.io/laboratorio/editorpdf/
- Programa ya construido: [Release «editorpdf»](https://github.com/Ivandlpn/laboratorio/releases/tag/editorpdf) (`PDF_a_DWG.zip`)

## Versión web (DXF en el navegador)

La misma conversión, sin instalar nada: https://ivandlpn.github.io/laboratorio/editorpdf/ . Vive en
`docs/editorpdf/web/` y todo ocurre en el navegador (el PDF no se sube a ningún servidor).

| Archivo | Para qué sirve |
|---|---|
| `conversor.js` | Lee el PDF con MuPDF (WebAssembly) y lo traduce a entidades: la misma lógica que `pdf_a_dxf.py`. |
| `dxf.js` + `dxf_plantilla.js` | Escribe el DXF R2004; la plantilla fija sale de un archivo de referencia hecho con ezdxf. |
| `conversor.worker.js` | Trabajador en segundo plano: abre, dibuja miniaturas y convierte sin bloquear la página. |
| `app.js`, `herramienta.css`, `zip.js` | Interfaz, estilo y creación del .zip. |
| `vendor/mupdf/` | MuPDF compilado a WebAssembly (AGPL, Artifex). |

Límites respecto al programa de Windows: no crea DWG (necesita ODA File Converter, un programa de Windows) y todavía
no reconoce letras dibujadas.

## Cómo está hecho (programa de Windows)

| Archivo | Para qué sirve |
|---|---|
| `app/pdf_a_dxf.py` | Lee el PDF con PyMuPDF y escribe el DXF con ezdxf (capas, colores, polilíneas, rellenos, textos). |
| `app/dxf_a_dwg.py` | Convierte DXF a DWG con la línea de comandos de ODA File Converter. |
| `app/ocr_letras.py` | Opcional y experimental: reconoce letras dibujadas con el OCR que trae Windows (es-ES). |
| `app/motor.py` | Junta lo anterior: páginas sueltas o unidas en un archivo, cancelar, resumen. |
| `app/app.py` | La ventana (tkinter + sv-ttk + tkinterdnd2). |
| `empaquetado/construir.ps1` | Construye `PDF_a_DWG.zip` (PyInstaller). |
| `ejemplo/Plano_de_ejemplo.pdf` | Plano inventado para probar. |

## Usarlo desde el código

```powershell
cd proyectos\editorpdf
.\Instalar requisitos (una sola vez).bat
.\Abrir PDF a DWG.bat
```

Para crear DWG hace falta [ODA File Converter](https://www.opendesign.com/guestfiles/oda_file_converter)
(gratis solo para uso no comercial): instálalo, o extráelo en `proyectos/editorpdf/herramientas/ODA/`.
Sin él, el programa solo crea DXF.

## Construir el .exe

```powershell
cd proyectos\editorpdf\empaquetado
.\construir.ps1
```

Deja `PDF_a_DWG.zip` en `proyectos/editorpdf/empaquetado/salida/`. Súbelo como archivo de una Release nueva
(sin ODA File Converter dentro, no se puede redistribuir).

## Límites conocidos

- Solo PDF vectoriales (no escaneados). No conserva transparencias ni degradados.
- El reconocimiento de letras dibujadas acierta cerca de 9 de cada 10 textos en la prueba hecha; revisa el resultado.
