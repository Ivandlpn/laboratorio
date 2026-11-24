# Simulador MDC

Simulador 3D de la oficina para recorrerla libremente en primera o tercera persona.

**Página:** https://ivandlpn.github.io/laboratorio/simuladormdc/

## Qué se puede hacer

- Elegir protagonista (él o ella), con chaleco reflectante.
- Abrir puertas, armarios, cajones y ventanas; usar los ordenadores y los teléfonos; leer, triturar o archivar papeles.
- Coger, apilar, lanzar y guardar objetos con física real; sentarse, trepar a las mesas y gatear por debajo.
- Cambiar la hora del día y las luces.

## Cómo está hecho

Un único `index.html` que funciona sin servidor: [three.js](https://threejs.org) para el 3D y [Rapier](https://rapier.rs) para la física (licencias en `docs/simuladormdc/LICENCIAS.txt`). La luz está precalculada para que vaya fluido en gráficas integradas.

El código fuente vive en el equipo del autor, no en este repositorio. Para actualizar la copia: `npm run build` en la carpeta del juego y copiar `Oficina.html` a `docs/simuladormdc/index.html`.

## Avisos

- La página lleva `noindex`: no aparece en buscadores.
- El mobiliario, los nombres de los puestos y las capturas de pantalla proceden de una oficina real. Antes de difundir el enlace conviene confirmar que su uso es el autorizado.
- Los textos de documentos, correos y llamadas del juego son inventados.
