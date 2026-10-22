# VisorRack

Visor de racks y equipos de red para los emplazamientos de alta velocidad ferroviaria. Línea 042 (ALBALI): 147 emplazamientos, con los racks, equipos, puertos y planos de sala cargados desde los planos «as built» de 2013.

**Copia publicada:** https://ivandlpn.github.io/laboratorio/visorrack/

## Qué es esta copia

- Es una **copia de prueba totalmente funcional**: se puede consultar, buscar, ver los racks (frente y trasera), el mapa, el inventario y el historial, exportar PDF y PNG, y también añadir, mover, conectar y borrar. Los cambios se guardan solo en el navegador de cada persona; hay un botón para restaurar los datos publicados.
- No hay servidor: la página lleva su propia base de datos (SQLite en el navegador, `data/visorrack.db`). La fecha de la copia sale arriba a la derecha. Antes de abrirla pide una palabra clave.
- Las direcciones llevan `#` (por ejemplo `.../visorrack/#/racks/2`), porque GitHub Pages no tiene servidor que reenvíe las rutas.

## La aplicación completa

La aplicación de verdad (con base de datos SQLite y edición) vive en el equipo del autor, no en este repositorio. Esta carpeta solo documenta la copia publicada.

Para actualizar la copia, desde la carpeta de la aplicación y con ella en marcha:

```
node scripts/build-static.ts --api=http://localhost:3300/api --out=dist-static
```

y copiar el contenido de `dist-static` a `docs/visorrack/` de este repositorio.

## Limitaciones

- Los planos son de diciembre de 2013 y pueden no reflejar el estado actual.
- Algunas posiciones y alturas están leídas del dibujo con ±1U y así se indica en las notas de cada equipo.
