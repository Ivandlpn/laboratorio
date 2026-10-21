<!-- Copia automatica de la documentacion de Kntera (2026-10-21). El original se edita en el equipo de trabajo; no edites esta copia. -->

# Inventario de funcionalidades vistas en las capturas

Todo lo marcado **PRO** en la app de referencia va abierto en KNTERA: no hay funciones de pago, y la interfaz
tampoco lo anuncia.

## Estado

| # | Funcionalidad | Estado |
| --- | --- | --- |
| 1 | Asistente de alta en 4 pasos (club → equipo → formato de juego → equipación) | ✅ `/alta` |
| 2 | Club: nombre, nombre abreviado, código federativo | ✅ `/equipo` |
| 3 | Equipo: categoría (Baby…Veterano), letra, división, composición | ✅ `/equipo` |
| 4 | Formato de juego: F11/F8/F7/F5, duración de mitad, máx. convocados, máx./mín. titulares | ✅ `/equipo` |
| 5 | Equipación 1ª/2ª/3ª con camiseta, pantalón y medias | ✅ `/equipo` |
| 6 | Plantilla agrupada por líneas con contadores POR/DEF/MED/DEL | ✅ `/plantilla` |
| 7 | PreJugador vs Jugador (a prueba / oficial, documento de identidad) | ✅ `/plantilla` |
| 8 | Posiciones detalladas (POR, LD, DFC, LI, CAD, PIV, CAI, MD, MC, MI, ED, MCO, EI, SDD, SD, SDI, DC) + carril | ✅ |
| 9 | Ficha de jugador: apodo, observaciones, documento, disponibilidad, tarjetas | ✅ `/plantilla/[id]` |
| 10 | Estadísticas del jugador: convocatorias, minutos medios, goles, asistencias | ✅ |
| 11 | Tiempo jugado por jugador con evolución partido a partido | ✅ |
| 12 | Deshabilitar jugador / seguidores | ✅ |
| 13 | Cuerpo técnico con roles | ✅ `/equipo` |
| 14 | Horarios semanales de entrenamiento | ✅ `/equipo` |
| 15 | Centro de control (pantalla «Más») | ✅ `/mas` |
| 16 | Excel de plantilla y campograma | ✅ |
| 17 | Tipo de partido y dificultad del rival | ✅ |
| 18 | Post-partido: resumen, MVP, valoración de jugadores, informe técnico | ✅ |
| 19 | Goles, asistencias, tarjetas y capitán por partido | ✅ |
| 20 | Estadísticas de equipo: liga, progresión, goles, local vs visitante | ✅ `/estadisticas` |
| 21 | Estadísticas de jugadores: convocatorias, goleadores, asistencias, disciplina | ✅ `/estadisticas` |
| 22 | Técnicos convocados y publicación de convocatoria | ✅ `/convocatorias/[id]` |
| 23 | Match result graphic (imagen del resultado para compartir) | ✅ `/convocatorias/[id]` |
| 24 | Pizarra con medidas reales, distancias en metros y superficie en m²/jugador | ✅ `/pizarra` |
| 25 | Pizarra: guías de carriles y zonas | ✅ `/pizarra` |
| 26 | Pizarra: animación por fotogramas | ✅ `/pizarra` |
| 27 | Modo «Entrenar»: ejecución de la sesión con cronómetro | ✅ `/sesiones/[id]/entrenar` |
| 28 | Distribución de tareas por categorías (donut) | ✅ `/sesiones` |
| 29 | Periodización y ciclos | ✅ `/sesiones` |
| 30 | Perfiles, permisos configurables y alta y baja de usuarios | ✅ `/usuarios` |
| 30b | Solicitud de acceso por perfil y validación por un entrenador | ✅ `/solicitar` + `/usuarios` |
| 30c | Equipos de temporadas anteriores e incorporación de jugadores al equipo nuevo | ✅ `/plantilla` |
| 42 | Live: seguimiento del partido en tiempo real | ✅ `/live` |
| 43 | Live: registro de eventos (goles, tarjetas, cambios, ocasiones, paradas, lesiones) | ✅ |
| 44 | Live: cronómetro por partes y tiempo de juego efectivo por jugador | ✅ |
| 45 | Live: alineación y formación sobre el campo | ✅ |
| 46 | Live: notas y observaciones durante el partido | ✅ |
| 47 | Live: compartir el resultado en vivo con las familias | ✅ |
| 48 | Live: cuaderno táctico y puntos de interés del partido | ✅ |
| 49 | Live: tarjetas al cuerpo técnico y banquillo del partido | ✅ |
| 50 | Tablón del equipo por perfil, con acuse de lectura y confirmación | ✅ `/comunicacion` |
| 51 | Calendario único: entrenamientos, partidos y eventos | ✅ `/comunicacion` |
| 52 | El jugador y la familia ven solo lo de su equipo | ✅ |
| 53 | El entrenador decide qué secciones ve cada perfil | ✅ `/usuarios` |
| 54 | Pantalla de acceso: correo, contraseña, alta y recuperación, con fondo animado | ✅ (sin validar, en pruebas) |
| 55 | Cerrar sesión | ✅ menú de usuario |
| 56 | Perfil de administrador, acumulable con el de entrenador | ✅ `/usuarios` |
| 57 | El administrador ve la app como la ve cada perfil | ✅ menú de usuario |
| 58 | Jugadores y familias sin acceso a datos personales de menores | ✅ permiso «Ver datos personales» |
| 59 | Burbuja de aviso cuando hay algo nuevo en el tablón | ✅ |
| 60 | El jugador edita su contacto y su biometría y decide si los comparte | ✅ ficha del jugador |
| 61 | Guía de uso de la versión mínima viable | ✅ `/guia` |
| 62 | Publicación en https://kntera.web.app | ✅ Firebase Hosting |
| 63 | Datos compartidos entre dispositivos, en directo | ✅ Firestore |
| 64 | Cuerpo técnico dentro de la plantilla | ✅ `/plantilla` |
| 65 | Cada módulo adaptado al perfil (no solo bloqueado) | ✅ |
| 66 | Guía de uso adaptada al perfil de quien la lee | ✅ `/guia` |
| 67 | Calendario de liga precargado antes del sorteo, con fecha orientativa | ✅ `/calendario` |
| 68 | Confirmar jornada a jornada rival, campo y horario | ✅ `/calendario` |
| 69 | Continuidad de la plantilla heredada al promocionar (sigue / no sigue) | ✅ `/plantilla` |
| 31 | Interfaz adaptada a móvil y tablet con barra inferior | ✅ |
| 32 | Zoom sobre el terreno en la pizarra | Ola 4 |
| 33 | Aspectos trabajados y coherencia metodológica | Ola 4 |
| 34 | Chat del equipo | Necesita backend (cifrado E2E) |
| 35 | Galería, documentos y fotos | Necesita backend |
| 36 | Eventos y agenda | ✅ `/comunicacion` |
| 37 | Seguidores (padres, madres) | ✅ perfil «responsable» + tablón por perfil |
| 38 | LOPIVI: canal confidencial | Necesita backend (identificación real) |
| 39 | Biométrica y tallaje | Ola 4 |
| 40 | Modelo de juego | Ola 4 |
| 41 | Análisis del partido: mapa de calor y puntos de interés | Ola 4 |
