# MDC_VI

Simulador 3D interactivo de la oficina con estética renovada, iluminación PBR, fidelidad fotográfica real y Modo Jornada.

**Página:** https://ivandlpn.github.io/laboratorio/mdc_vi/

## Qué se puede hacer

- Elegir protagonista (él o ella) en la portada estilo Vice Noir y seleccionar perfil gráfico (`Rendimiento`, `Equilibrado` o `Realista` con Bloom), hora del día y modo (`Libre` o `Jornada`).
- Recorrer la oficina real en primera o tercera persona, abrir puertas, armarios, cajones y ventanas con lamas que modulan la luz solar, y controlar interruptores por zonas o el cuadro eléctrico del pasillo.
- Usar los 12 ordenadores con escritorios personalizados por puesto, cámaras **CCTV** en directo y aplicaciones; contestar llamadas con el teléfono en la oreja y subtítulos; ponerse auriculares/cascos en la cabeza; preparar y beber café o agua; triturar documentos; y subir al volante del coche exterior con radio y luces.
- Activar el **Modo Foto (`P`)** para capturas limpias sin HUD, con autoguardado local automático.

## Cómo está hecho

Un único `index.html` autocontenido que funciona sin servidor: [three.js](https://threejs.org) para el 3D y [Rapier](https://rapier.rs) para la física (licencias en `docs/mdc_vi/LICENCIAS.txt`). La luz está precalculada en vertex lightmaps y combinada con sombras dinámicas, cubemaps por zona y audio procedural WebAudio con paneo estéreo.

El código fuente vive en el equipo del autor, no en este repositorio. Para actualizar la copia: `npm run build` en la carpeta `juego/` y copiar `dist/index.html` a `docs/mdc_vi/index.html`.

## Avisos

- La página lleva `noindex`: no aparece en buscadores.
- El mobiliario, los nombres de los puestos y las capturas de pantalla proceden de una oficina real. Antes de difundir el enlace conviene confirmar que su uso es el autorizado.
- Los textos de documentos, correos y llamadas del juego son inventados.
