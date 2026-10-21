<!-- Copia automatica de la documentacion de Kntera (2026-10-21). El original se edita en el equipo de trabajo; no edites esta copia. -->

# KNTERA

**Publicada en https://kntera.web.app** (Firebase Hosting, proyecto `kntera`). Se despliega con
`npm run build && firebase deploy --only hosting`.

Plataforma para entrenadores y clubes de fútbol base. Módulos **Entrenamientos**, **Convocatorias**,
**Live de partido** y **Comunicación**, completos y funcionando.

La K del logotipo es un futbolista: cabeza y tronco forman el asta vertical, el brazo elevado la diagonal
superior y la pierna de golpeo la inferior. Paleta morado + verde, en tonos suaves, tomada de la bandera de Málaga.

## Arrancar

```bash
npm install
```

```bash
npm run dev
```

Abre `http://localhost:3000`. No hace falta ninguna cuenta, clave ni servicio externo.

## Qué hay construido

| Funcionalidad | Dónde |
| --- | --- |
| Sesiones planificadas, cronograma y estados | `/sesiones`, `/sesiones/[id]` |
| Generador automático de sesiones | Botón **Asistente** en `/sesiones/nueva` |
| Biblioteca de tareas: plantillas, categorías y niveles | `/tareas` |
| Pizarra táctica con medidas reales, guías y jugada animada | `/pizarra` |
| Control de asistencia | Pestaña *Asistencia* de cada sesión |
| Control de material e inventario | `/material` y pestaña *Material* |
| Valoración de entrenamientos (global e individual) | Pestaña *Valoración* |
| Plantilla de jugadores y estadísticas de asistencia | `/plantilla` |
| Calendario de liga precargado, con las jornadas pendientes de confirmar | `/calendario` |
| Convocatorias con citación, equipación y navegación | `/convocatorias`, `/convocatorias/[id]` |
| Confirmaciones sí/no y control de tiempos de juego | Pestañas *Confirmaciones* y *Minutos* del partido |
| Cuerpo técnico convocado y publicación de la convocatoria | Pestaña *El partido* |
| Live: cronómetro, eventos, alineación, cuaderno táctico y acta | `/live`, `/convocatorias/[id]/live` |
| Tablón del equipo con acuse de lectura y agenda unificada | `/comunicacion` |
| Qué secciones ve cada perfil, configurable por el entrenador | Pestaña *Qué ve cada perfil* de `/usuarios` |
| Perfiles, permisos y alta y baja de usuarios | `/usuarios` |
| Solicitud de acceso y validación por el entrenador | `/solicitar`, pestaña *Solicitudes* de `/usuarios` |
| Equipos de temporadas anteriores y traspaso de jugadores | Selector de equipo · **Más → Incorporar de otro equipo** en `/plantilla` |
| Continuidad de la plantilla heredada: quién sigue y quién no | Aviso de `/plantilla` · pestaña *Por confirmar* |
| Modo Entrenar: la sesión en el campo con cronómetro | `/sesiones/[id]/entrenar` |
| Periodización y distribución de tareas por categoría | Pestaña *Periodización* de `/sesiones` |
| Copia de seguridad, importación y reinicio | `/ajustes` |

## Guía de uso

Está dentro de la propia aplicación, en **[/guia](https://kntera.web.app/guia)**, y se lee sin haber entrado.

**Se adapta a quien la lee.** A una familia no le sirve saber cómo se cierra un acta: solo le añade ruido. Así
que los apartados y los pasos se arman a partir de los permisos del perfil activo — el entrenador ve once
apartados con el detalle de cómo convocar, publicar y anotar; un jugador ve diez, y en «Partidos» lee cómo
confirmar su asistencia en lugar de cómo montar la convocatoria.

Las muestras de interfaz son los mismos componentes que usan las pantallas de verdad, no capturas que se quedan
viejas.

## Entrar y salir

`/` muestra la **pantalla de acceso** —correo, contraseña, crear cuenta y recuperar contraseña— con un fondo
animado por detrás. Dentro de la aplicación, **Cerrar sesión** está en el menú de usuario de la barra superior.

**En periodo de pruebas no se valida nada**: cualquier correo entra, y si coincide con una cuenta del club se
entra con ella. La pantalla incluye además un botón por cada persona de prueba, con su nombre y su perfil:

> *(Parrafo omitido en la copia publica del repositorio: contenia datos personales.)*

Toda la comprobación real vive detrás de una única función, `iniciarSesion` en `src/store/app-store.tsx`: es lo
único que hay que sustituir cuando exista servidor, sin tocar la pantalla.

## Perfiles y permisos

Cuatro perfiles: **administrador**, **entrenador**, **jugador** y **responsable** — que cubre a quien ejerce la
patria potestad o la tutela: madre, padre, tutor legal o familia de acogida.

El **administrador** gestiona la aplicación del club: usuarios, permisos y secciones. No es un cargo del campo,
así que **se es administrador además de otra cosa**: lo normal es que el entrenador principal lo sea. Sus
permisos y secciones se **suman** a los de su perfil, nunca le quitan nada.

Además, el administrador puede **ver la aplicación como la ve cualquier otro perfil**, desde el menú de usuario:
sin salir de su cuenta, la app se pinta con los permisos y las secciones de un jugador o de una familia, con una
barra permanente arriba recordándolo. Es la manera de comprobar qué información está ofreciendo la aplicación a
cada uno sin tener que crear cuentas falsas.

- Los permisos son **17 y configurables**; los cambios se aplican al instante a todos los usuarios de ese perfil.
- El permiso «Gestionar usuarios» del entrenador no se puede quitar: si se quitara, nadie podría volver a entrar.
- Dar de baja conserva el histórico; eliminar lo borra.
- Cada jugador y cada familia se vincula a una o varias fichas de jugador.

### Cada uno ve lo suyo

Dos filtros distintos, y hacen falta los dos:

- **Secciones**: qué pantallas ve cada perfil. El entrenador las abre y las cierra desde la pestaña *Qué ve cada
  perfil* de `/usuarios`. Lo que cierre desaparece del menú, de la barra inferior y del centro de control, y
  quien entre por la dirección directa se encuentra un aviso claro en vez de una pantalla vacía. El entrenador
  no puede cerrarse a sí mismo Inicio, Usuarios ni Ajustes: se quedaría fuera sin manera de volver.
- **Permisos**: qué puede hacer dentro de las pantallas que sí ve (17, en la otra pestaña). Todos filtran de
  verdad: quitar «ver fichas de otros jugadores» deja al perfil con la suya y con los recuentos de su propia
  ficha; quitar «ver estadísticas» cierra la pantalla; «confirmar asistencia» deja responder **solo por la
  ficha propia o la de sus hijos**, no por la de los demás.

Una convocatoria sin publicar es un borrador del entrenador: no aparece en la lista de jugadores y familias ni
se abre por su dirección. Lo mismo con el directo mientras no se publica.

### Los datos del jugador son suyos

Un jugador —o su responsable— tiene en su ficha una tarjeta **Mis datos** donde rellena su teléfono, su correo,
su altura y su peso **aunque no pueda editar la plantilla**, y decide con dos interruptores si el resto de
jugadores y familias los ven. De fábrica no los ve nadie salvo el cuerpo técnico, que responde del equipo y
necesita poder llamar a la familia.

### Nada personal fuera del cuerpo técnico

Jugadores y responsables ven **lo mismo de su equipo**: la plantilla entera, el calendario, las convocatorias y
las estadísticas. Lo que **no** ven es nada personal de los menores — fecha de nacimiento, edad, documento,
número de ficha federativa ni teléfonos. Son datos que no hacen falta para seguir al equipo, y son de menores.

Lo controla el permiso **«Ver datos personales»**, apagado de fábrica para jugador y responsable. Con él
apagado, una ficha muestra dorsal, demarcación, pie, minutos, goles y tarjetas, y nada más.

Y por encima de todo, **el equipo**. Un jugador o un responsable no elige equipo: ve el de la ficha a la que
está vinculado. Si el entrenador del cadete planifica un entrenamiento o convoca un partido, le aparece a los
jugadores del cadete y a sus familias, y solo a ellos. El selector de equipo de la barra superior únicamente
aparece cuando hay más de uno entre los que elegir.

### Nadie entra por su cuenta

Quien quiere entrar pide acceso desde `/solicitar` eligiendo perfil. Se crea su usuario, pero **sin acceso a
ninguna pantalla**: hasta que un entrenador ya dado de alta lo valida desde la pestaña *Solicitudes* de
`/usuarios`, lo único que ve es la pantalla de espera. El entrenador puede validar, rechazar con motivo, o
validar más tarde una solicitud rechazada. Las altas que hace el propio entrenador nacen ya validadas.

Todavía no hay contraseñas: el alta define perfiles, permisos y quién tiene acceso, y el selector de la barra
superior permite entrar como cualquier usuario validado para comprobar cómo ve la app. El acceso con
credenciales llega con el backend.

## En móvil y tablet

- Barra inferior con los cinco accesos de uso diario por debajo de 1024 px; barra lateral completa por encima.
- Menú lateral desplegable en móvil y tablet, con todo el árbol de navegación.
- Áreas táctiles de 36-44 px, campos a 16 px para que iOS no haga zoom al escribir, y respeto de las zonas
  seguras (`env(safe-area-inset-*)`) en la cabecera y en la barra inferior.
- Ninguna pantalla desborda en horizontal a 375 px; las tablas anchas hacen scroll dentro de su tarjeta.

Lo que queda del módulo de Comunicación —chat, contactos, tallaje y canal LOPIVI— tiene su ficha de alcance en
`/proximamente/comunicacion`, pero todavía no está construido.

## La pizarra trabaja con medidas reales

Cada terreno declara cuántos metros representa (105 × 68 m el campo completo, 68 × 52,5 m el medio campo…), así que:

- Los trazos muestran su **distancia real en metros**.
- Cada zona muestra su **superficie en m²** y los **m² por jugador** contando quién hay dentro.
- Las guías de carriles y de zonas ayudan a colocar con criterio.
- Capturando fotogramas se monta la **jugada animada**, que se reproduce en bucle.

## Cómo funciona el módulo de Convocatorias

- **Convocar en segundos.** «Convocar por mí» arma 16 convocados (1 portero titular, otro suplente) priorizando a
  quien menos ha jugado; el reparto de minutos deja de depender de la memoria del entrenador.
- **Avisos.** KNTERA **no envía mensajes por su cuenta todavía**: compone el texto de la convocatoria, lo deja
  listo para copiar o compartir desde el móvil del entrenador y registra a cuántas personas se ha avisado. El envío
  automático va con el módulo de Comunicación, que necesita backend.
- **Confirmaciones.** Sí / No / sin responder por jugador, con motivo, y recordatorio para quien falta.
- **Navegación guiada.** Enlace a la app de mapas del dispositivo, con coordenadas exactas si el campo las tiene y
  por dirección escrita si no.
- **Tiempos de juego.** Minutos por jugador cuadrados contra los minutos reales sobre el campo
  (duración × 11), más el acumulado de la temporada y la brecha entre quien más y quien menos juega.

## Cómo funciona el Live de partido

Se abre desde la propia convocatoria (`/convocatorias/[id]/live`) o desde `/live`, que lleva de un toque al
partido que se está jugando. Al abrirlo, el once que hayas marcado como titular aparece ya colocado sobre el
campo.

- **La cronología es la verdad.** El marcador, los minutos de cada jugador y las tarjetas no se teclean: se
  calculan a partir de los eventos anotados. Anotar mal se arregla con **deshacer**, que también devuelve al
  campo a quien había salido en un cambio.
- **Cronómetro por partes**, con arranque, pausa, descanso y final. El reloj se guarda como instante de
  arranque, así que puedes bloquear el móvil o recargar la página y sigue en hora.
- **Anotar en un toque:** gol (con asistencia), gol del rival, amarilla, roja, cambio, ocasión a favor o en
  contra, parada del portero, lesión y nota libre. Los dorsales salen en rejilla porque en la banda se acierta
  antes con el número que con el nombre.
- **Cuerpo técnico incluido.** Eliges quién va al banquillo y, si el árbitro amonesta al delegado, la tarjeta se
  anota a su nombre y le cuenta a él, no a un jugador.
- **Cuaderno táctico.** Tocas el campo para marcar el punto exacto de la jugada y el evento se queda ahí; lo
  marcado con ⭐ es lo que hay que repasar el martes.
- **Compartir con las familias.** Prepara el resumen del directo listo para copiar. Como en las convocatorias,
  KNTERA no envía nada por su cuenta.
- **Cerrar el acta** vuelca minutos, goles, asistencias y tarjetas sobre la convocatoria y pasa el partido a
  *jugado*. Es idempotente: cerrarla dos veces no duplica nada.

## Cómo funciona el módulo de Comunicación

En `/comunicacion`, con dos piezas que hoy viven en un grupo de mensajería y se pierden:

- **Tablón.** El entrenador publica avisos con tipo (urgente, organización, administrativo, felicitación),
  elige **a qué perfiles van dirigidos** y puede fijarlos arriba. Ve cuánta gente lo ha abierto y, si pidió
  confirmación, quién ha dado el «enterado». Abrir un aviso cuenta como leerlo; confirmar es un acto aparte.
- **Agenda.** Reuniones, torneos, viajes y convivencias, con confirmación de asistencia. Se muestran en un
  **calendario único** junto a los entrenamientos y los partidos: una familia no distingue módulos, quiere ver
  qué hay esta semana.

Cuando hay algo sin leer, aparece una **burbuja** abajo con el último aviso: se toca para ir al tablón, se cierra
con la X y no vuelve a molestar en esa visita. No es un modal y no bloquea nada.

Lo que **no** se hace, y se dice en la propia pantalla: chat privado, documentos, galería y canal LOPIVI. Todo
eso exige identificar de verdad a las personas y cifrado extremo a extremo; simularlo en local sería engañoso.
El tablón y la agenda funcionan sin servidor porque no son conversaciones privadas.

## Cómo funciona el generador de sesiones

No llama a ningún servicio externo. Puntúa cada tarea de la biblioteca contra lo que pide el entrenador
(`src/lib/generador.ts`):

- **Categoría de edad** — el filtro con más peso; una tarea fuera de categoría queda descartada de facto.
- **Fase de la sesión** — activación, parte principal, aplicación o vuelta a la calma.
- **Objetivo del día** — técnica, táctica, físico, portero…
- **Nivel** — se admite el adyacente para no dejar huecos.
- **Número de jugadores** disponible frente al rango de la tarea.
- **Material** del inventario; si falta algo, penaliza y avisa, pero no descarta.
- **Palabras clave** libres del entrenador.
- **Perfil de carga** — suave, equilibrada o exigente; ajusta el reparto de minutos por fase.

Toda la propuesta se devuelve con su razonamiento (`explicacion`) y sus avisos, para que el entrenador pueda
corregirla antes de guardarla. El punto de enganche para sustituir el motor por una llamada a un modelo real
es la función `generarSesion`: mismo contrato de entrada y salida.

## El equipo del club

El club de pruebas tiene un equipo, el **Cadete A** de la temporada en curso, con su plantilla real en
`src/lib/db/seed-roster.ts` (`PLANTILLA_CLUB`): nombre, dorsal, demarcación y fecha de nacimiento de cada uno.

Cuando quieras empezar en serio: **Ajustes → Vaciar la temporada**. Borra sesiones, partidos, tablón y agenda de
ejemplo de la temporada en curso, y deja intactos la plantilla, el cuerpo técnico, los horarios, la biblioteca
de tareas y el material.

Hasta el 19 sep 2026 el club de pruebas tenía un segundo equipo, el **Infantil B 2025/26**, con su temporada
cerrada reconstruida jornada a jornada a partir de los totales reales de la federación. Se retiró a petición
del club; el fichero que lo montaba (`seed-historico.ts`) sigue disponible en el historial de git si hace falta
recuperar el patrón para un histórico futuro.

Para montar el equipo del año siguiente: **Más → Incorporar de otro equipo** en `/plantilla` copia los jugadores
que elijas a un equipo nuevo, reasignando los dorsales que ya estén ocupados y sin tocar el equipo de origen.

## Dónde viven los datos

**El club comparte un mismo estado en la nube.** Lo que anota el entrenador en la banda le aparece al jugador y
a su familia **sin recargar**: la base de datos es Firestore y la aplicación escucha los cambios en directo. En
la barra superior hay un indicador —*Al día*, *Sincronizando*, *Sin conexión*— para saber si lo que ves está
compartido.

Sin conexión la aplicación sigue funcionando contra la copia del dispositivo, y sube los cambios al recuperarla.

Lo único que **no** viaja son las preferencias de cada dispositivo: con qué usuario entras, qué equipo tienes
seleccionado, el tema claro u oscuro y la sesión. Si viajaran, el entrenador le cambiaría el equipo a las
familias cada vez que cambiara el suyo.

> **En pruebas la base de datos está abierta.** Todavía no hay identificación real, así que cualquiera que
> llegue a la dirección puede leer y escribir el estado del club. Es aceptable para probar entre tres personas
> conocidas; no lo es para abrirlo al público. El siguiente paso es Firebase Authentication y reglas que
> comprueben quién eres.

## Copia local

Todo se guarda en `localStorage`, bajo la clave `kntera.db.v1`. La capa de persistencia está aislada en
`src/lib/db/storage.ts` con cuatro funciones (`cargarDB`, `guardarDB`, `exportarDB`, `importarDB`), así que
migrar a una API real no obliga a tocar ni un componente.

El esquema tiene versión (`DB_VERSION` en `src/lib/db/seed.ts`) y migraciones incrementales en `storage.ts`: al
añadir un módulo se sube la versión y se escribe su paso de migración, de modo que nadie pierde lo que ya tenía
guardado.

Consecuencias de esta versión, que conviene tener presentes:

- Los datos son **por navegador y por dispositivo**. No hay sincronización.
- Borrar los datos del navegador borra la aplicación. Exporta la copia desde `/ajustes`.
- **No metas datos personales reales de menores.** Los requisitos de RGPD y LOPIVI (consentimiento con doble
  firma, canal confidencial con la persona delegada de protección del menor, cifrado extremo a extremo) van con
  el módulo de Comunicación, que necesita backend con autenticación.

## Estructura

```
src/
  app/                 rutas (App Router, todo cliente)
  components/
    brand/             logotipo
    convocatorias/     formulario de partido, convocatoria, confirmaciones, minutos y aviso
    layout/            barra lateral, cabecera, tema
    live/              campo del directo, cronología y anotación de eventos
    pizarra/           lienzo táctico y definición de campos
    sesiones/          asistente, editor de bloques y paneles de la sesión
    tareas/            tarjeta, formulario y selector de tareas
    ui/                primitivas, formularios y overlays
  lib/
    db/                semillas, persistencia y migraciones
    generador.ts       motor de propuestas de sesión
    sesiones.ts        cronograma, material, asistencia y carga
    convocatorias.ts   convocatoria, minutos, navegación y texto del aviso
    live.ts            cronómetro, eventos, marcador, minutos y cierre del acta
    comunicacion.ts    tablón, acuse de lectura y agenda unificada
    secciones.ts       catálogo de pantallas y qué ve cada perfil
    estadisticas.ts    agregados por jugador y por equipo
    labels.ts          etiquetas y colores del dominio
    types.ts           modelo de datos
  store/               contexto de aplicación y selectores
```

## Comprobaciones

```bash
npm run typecheck
```

```bash
npm run build
```

## Siguiente paso

**Comunicación privada**: chat con las familias, contactos y canal LOPIVI. Necesita autenticación real y cifrado
extremo a extremo, así que va detrás del backend.
