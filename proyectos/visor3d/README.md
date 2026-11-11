# VISOR3D

Gemelo digital 3D continuo del corredor de alta velocidad **L042 Albacete–Alicante** (PK 322+000 a 486+200, 164 km),
con la imagen de Ineco.

**Copia publicada:** https://ivandlpn.github.io/laboratorio/visor3d/

## Qué es esta copia

- Una **copia de prueba** de solo lectura, sin servidor propio: página estática con three.js.
- Relieve LiDAR del IGN (5 m), ortofoto PNOA, cartografía 3D de Adif (postes, BTS y casetas, arquetas, armarios…),
  edificios de Catastro con su altura, arbolado medido, viaductos, ramales y pasos superiores con su DCO.
- La página lleva `noindex`: no aparece en buscadores.
- Los datos de infraestructura proceden de Adif. Antes de difundir este enlace conviene confirmar que su uso es el autorizado.
- El inventario de infraestructura **no** se publica en esta copia.

## La aplicación completa

El código y los scripts de datos viven en el equipo del autor (carpeta `Visor3D`). Para actualizar esta copia se copia su
carpeta `public/` a `docs/visor3d/` de este repositorio, sin `datos/inventario.json`.

## Limitaciones

- Carga three.js y la ortofoto del PNOA desde servidores externos: necesita conexión.
- Necesita una gráfica con WebGL 2; en equipos modestos conviene la calidad baja del panel.
