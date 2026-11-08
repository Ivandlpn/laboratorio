# VISOR MDC

Visor de apoyo al mantenimiento de la **base de Monforte del Cid** (líneas 042, 046 y 048 de alta velocidad), con la imagen de Ineco.

**Copia publicada:** https://ivandlpn.github.io/laboratorio/visormdc/

## Qué es esta copia

- Es una **copia de prueba** de solo lectura, sin servidor propio: mapa, lista de emplazamientos (211), puntos de riesgo, clima, entornos 3D y una sección de tiras en pruebas.
- **Los avisos oficiales de AEMET y los servicios que necesitan una clave no están activos** en esta copia: las secciones lo indican con «configuración pendiente». Las claves no se publican.
- La página lleva `noindex`: no aparece en buscadores.
- Los datos de infraestructura proceden de Adif. Antes de difundir este enlace conviene confirmar que su uso es el autorizado.

## La aplicación completa

El código fuente vive en el equipo del autor, no en este repositorio. Esta carpeta solo documenta la copia publicada.

Para actualizar la copia, desde la carpeta de la aplicación:

```
npm run build:publico
```

y copiar el contenido de `dist` a `docs/visormdc/` de este repositorio. El comando compila con todas las claves vacías y falla si encuentra una clave, un correo o un enlace interno en el resultado.

## Limitaciones

- Las escenas 3D cargan la librería gráfica desde un servidor externo, así que necesitan conexión.
- La sección Tiras está en pruebas y puede cambiar.
