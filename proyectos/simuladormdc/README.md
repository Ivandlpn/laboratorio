# Simulador MDC

Simulador 3D de la oficina para recorrerla libremente en primera o tercera persona.

**Página:** https://ivandlpn.github.io/laboratorio/simuladormdc/

Pensado para ordenador, con teclado y ratón. La primera carga puede tardar unos veinte segundos.

## Qué se puede hacer

- Elegir protagonista (él o ella), con chaleco reflectante, y jugar en **Modo Libre** o en **Modo Jornada**, con tareas del día.
- Abrir puertas, armarios, cajones y ventanas; leer, triturar o archivar papeles.
- Usar los ordenadores, las tablets SIOS, los teléfonos, la impresora y las cámaras de vigilancia.
- Coger, apilar, lanzar y guardar objetos con física real; sentarse, trepar a las mesas y gatear por debajo.
- Atender a las visitas, al cartero y al repartidor de agua.
- Salir al aparcamiento: desbloquear el coche, subir, encender los faros y la radio.
- Cambiar la hora del día y las luces, y hacer capturas con el modo foto.

## Controles

| Tecla | Acción |
|---|---|
| W A S D | Moverse (con Mayús, correr) |
| Ratón (arrastrar y rueda) | Girar la cámara y acercar |
| Espacio | Saltar o trepar |
| C / Ctrl | Agacharse |
| E, F, X | Interactuar |
| Q | Cambiar de elemento señalado |
| Clic / G | Lanzar / colocar |
| B y 1–6 | Guardar y sacar del bolsillo |
| V | Primera o tercera persona |
| T | Hora del día |
| P | Modo foto |
| M | Sonido |
| R | Volver al inicio |
| Tab | Ver u ocultar la ayuda |
| Esc | Pausa |

## Cómo está hecho

Un único `index.html` que funciona sin servidor: [three.js](https://threejs.org) para el 3D y [Rapier](https://rapier.rs) para la física (licencias en `docs/simuladormdc/LICENCIAS.txt`).

Para que vaya fluido con calidad alta y fija, sin selector:

- La luz está precalculada.
- La geometría fija se funde en pocas mallas y solo se dibuja lo que entra en cámara.
- Los coches y los personajes secundarios tienen una versión ligera que se usa a distancia.
- Los shaders se compilan en paralelo durante la carga.

El código fuente vive en el equipo del autor, no en este repositorio. Para actualizar la copia: `npm run build` en la carpeta del juego y copiar `Oficina.html` a `docs/simuladormdc/index.html`.

## Avisos

- La página lleva `noindex`: no aparece en buscadores.
- El mobiliario, los nombres de los puestos y las capturas de pantalla proceden de una oficina real. Antes de difundir el enlace conviene confirmar que su uso es el autorizado.
- Los textos de documentos, correos y llamadas del juego son inventados.
- El sonido, el mando y el uso en un móvil no se han comprobado en equipos reales.
