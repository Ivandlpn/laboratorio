# Kntera

Aplicación para la gestión y el seguimiento de equipos de fútbol base: entrenamientos, convocatorias, live de
partido y comunicación.

- **Aplicación publicada:** https://kntera.web.app
- **Dónde se desarrolla:** en un equipo de trabajo, con su propio proyecto de Firebase (`kntera`). Esta carpeta
  **no contiene el código**, solo la documentación.

## Documentación

Copia de la documentación del proyecto. Es una copia automática: **se edita en el original, no aquí**.

| Documento | Qué contiene |
|---|---|
| [documentacion/README.md](documentacion/README.md) | Qué hace la aplicación, módulos, rutas, guía de uso y datos. |
| [documentacion/CLAUDE.md](documentacion/CLAUDE.md) | Guía técnica para quien programa: arquitectura, convenciones, trampas del entorno y estado del proyecto. |
| [documentacion/INVENTARIO-CAPTURAS.md](documentacion/INVENTARIO-CAPTURAS.md) | Inventario de funcionalidades vistas en una aplicación de referencia y su estado en Kntera. |

## Qué no se publica

- **Datos personales.** Los párrafos que nombran a personas se sustituyen por un aviso
  (*«Párrafo omitido en la copia pública…»*).
- **Capturas de pantalla** de la aplicación de referencia (son de terceros, 48 imágenes) y el **código** de Kntera.

## Actualizar la copia

Cuando cambies la documentación en el original, desde esta carpeta:

```powershell
.\sincronizar-documentacion.ps1          # copia y deja los cambios sin subir
.\sincronizar-documentacion.ps1 -Subir   # copia, hace commit y push
```

El script busca el original en `C:\Users\ivan_\Desktop\Claude App\Kntera` (parámetro `-Origen` para cambiarlo).
Si existe el archivo local `.bloqueo-local.txt` en la raíz del repositorio (ignorado por git, un nombre por línea),
cualquier párrafo que contenga alguno de esos nombres se omite y, si aun así quedara alguno, el script se detiene.
