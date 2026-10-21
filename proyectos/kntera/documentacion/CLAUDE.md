<!-- Copia automatica de la documentacion de Kntera (2026-10-21). El original se edita en el equipo de trabajo; no edites esta copia. -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

KNTERA: aplicación para entrenadores y clubes de fútbol base, en español. Réplica ampliada de Club2You. La
referencia visual y funcional son las capturas de `Capturas ejemplos funcionalidades/`, inventariadas en
[INVENTARIO-CAPTURAS.md](INVENTARIO-CAPTURAS.md) con su estado (✅ hecho / Ola N pendiente).

**Regla de producto que no se negocia: no hay funciones de pago.** Lo que en la app de referencia lleva etiqueta
PRO aquí va abierto. No introduzcas planes, límites ni funciones bloqueadas —**y tampoco lo anuncies**: la
interfaz no dice en ningún sitio que la aplicación sea gratis. Iván lo pidió expresamente el 6 sep 2026; si
vuelve a aparecer un «todo gratis» en una pantalla, es un error.

## Comandos

**No hay tests.** La verificación de cada iteración es `typecheck` + `build` + comprobarlo en el navegador.

```bash
npm run typecheck
```

```bash
npm run build
```

**`npm run lint` está roto y no merece la pena intentarlo**: el script sigue siendo `next lint`, que Next 16
retiró, y falla con «Invalid project directory provided». No hay ESLint configurado. Si hace falta análisis
estático, hay que montarlo primero.

Publicar en https://kntera.web.app (proyecto de Firebase `kntera`):

```bash
npm run build && npx firebase deploy --only hosting
```

Las reglas de Firestore van aparte y solo hay que subirlas cuando cambia `firestore.rules`:

```bash
npx firebase deploy --only firestore:rules
```

El servidor de desarrollo se arranca con la herramienta de preview (`.claude/launch.json`, nombre `kntera`,
puerto 3000), **nunca `npm run dev` por Bash**.

### Trampas del entorno

- **Las rutas de detalle dan error 500 en `npm run dev` con un identificador real** (`/convocatorias/par_3`).
  Es `output: "export"`: en desarrollo Next exige que el parámetro esté en `generateStaticParams`. Para probarlas
  en local usa el centinela (`/convocatorias/_`) o compruébalas directamente en la web publicada, donde los
  `rewrites` de Firebase hacen su trabajo. No es un fallo de la aplicación.
- **No uses `Set-Content`/`Out-File` de PowerShell sobre fuentes con acentos**: PowerShell 5.1 los lee como ANSI
  y los reescribe mal (`ó` → `Ã³`). Usa las herramientas Write/Edit, o un script Node con `fs.writeFileSync(p, s,
  "utf8")`.
- Los `node -e` con expresiones regulares o plantillas se pelean con el shell, y los *heredoc* de bash (`<<'FIN'`)
  revientan si el texto lleva acentos y comillas mezcladas. Lo que sí funciona para un reemplazo grande en
  fuentes: escribir el script Node **a un fichero** del scratchpad con Write y ejecutarlo, comparando cadenas
  exactas y abortando si no encuentra el trozo.
- `tsc --noEmit` incluye `.next/dev/types/**`, que el dev server puede dejar a medias. Si aparece un error
  extraño en `validator.ts`, borra `.next/dev/types` y repite.
- **El dev server no recarga siempre lo que acabas de editar.** Si un cambio en un componente no se ve, la culpa
  suele ser del módulo viejo que dejó el Fast Refresh, no del código: navega con la URL cambiada
  (`?v=` y la hora) antes de dar por malo el arreglo. Los errores de consola tampoco se limpian al navegar —para
  leer una consola de verdad, abre una pestaña nueva.

## Arquitectura

Next.js 16 (App Router) + React 19 + Tailwind v4. **Todas las páginas son `"use client"`**: no hay servidor, no
hay API routes, no hay `fetch`.

**Se publica como sitio estático** (`output: "export"` en `next.config.ts`), así que una ruta dinámica no se
puede resolver en el servidor. El patrón es: `page.tsx` es un componente de servidor que solo exporta
`generateStaticParams` con un identificador centinela (`_`) y renderiza `vista.tsx`, que es el cliente de
verdad; el identificador real lo lee `useIdRuta()` de `src/lib/ruta.ts` del `pathname`, **no de `useParams`**,
porque el HTML servido es el del centinela. Los `rewrites` de `firebase.json` mandan `/plantilla/lo-que-sea` a
ese fichero. Al añadir una ruta dinámica hay que hacer las tres cosas: `page.tsx`, `vista.tsx` y el rewrite.

**La ficha para compartir vive en `layout.tsx`.** Al pegar el enlace en WhatsApp se ve el `openGraph` de la
raíz: título «KNTERA» a secas, la descripción y `public/og.png` (1200 × 630, el escudo del club sobre fondo de
marca). El escudo salió de `conejito.png` —que es un JPEG con fondo blanco— recortándole el fondo por
inundación desde los bordes, para no agujerear el destello blanco de dentro; el resultado transparente está en
`public/escudo.png`. Si se rehace la imagen hay que mantener el tamaño y volver a comprobarla, porque los
rastreadores no reintentan.

> *(Parrafo omitido en la copia publica del repositorio: contenia datos personales.)*

La ficha del jugador tiene campos **opcionales** para documento, teléfono, correo, dirección y familiares. Se
crearon vacíos y así se quedan en la semilla: son datos de menores, solo los ve quien tenga
`verDatosContacto` —o la propia familia—, y no se rellenan con ejemplos inventados.

### El dato manda

Todo el estado vive en un único objeto `KnteraDB` (`src/lib/types.ts`). Cuatro capas:

1. **`src/lib/db/storage.ts`** — copia del dispositivo en `localStorage` bajo `kntera.db.v1`, y las migraciones.
   Única puerta a la persistencia local (`cargarDB`, `guardarDB`, `exportarDB`, `importarDB`, `migrarDB`).
2. **`src/lib/db/nube.ts`** — sincronización con Firestore.
3. **`src/store/app-store.tsx`** — contexto `AppProvider` con el `KnteraDB` en un `useState`, todas las acciones
   CRUD y los selectores (`useJugadoresEquipo`, `usePartidosEquipo`, `useTareaMap`…). Cada acción reemplaza el
   objeto entero; un `useEffect` lo guarda en local al momento y lo sube a la nube con 600 ms de respiro.
4. **Componentes** — solo consumen `useApp()` y los selectores.

**El club comparte un único estado, y la nube manda.** `nube.ts` guarda **un documento por colección** bajo
`clubes/club_1/estado/{parte}`: así el estado no crece hacia el límite de 1 MiB de un documento y dos personas
que tocan cosas distintas no se pisan. Lo que llega por `onSnapshot` **sustituye** a lo local y pasa por
`migrarDB` antes de aplicarse, porque puede haberlo escrito una versión anterior. Si la nube está vacía, el
primer dispositivo que entra la siembra.

**`ajustes` no se sincroniza nunca.** El usuario activo, el equipo elegido, el tema, la sesión y la vista previa
son de cada dispositivo. Si viajaran, el entrenador le cambiaría el equipo a las familias al cambiar el suyo.
Si añades un campo de preferencia, va en `ajustes`; si añades datos del club, va en su colección y en
`PARTES_SINCRONIZADAS`.

**Abrir una pantalla de detalle recarga la aplicación entera.** Como el sitio es estático, el router de Next
no encuentra el RSC de `/tareas/lo-que-sea`, avisa por consola («Failed to fetch RSC payload… Falling back to
browser navigation») y hace una navegación de navegador. Es decir: **cada vez que se guarda algo y se salta a
su ficha, la pestaña se muere**. De ahí la regla que sigue.

**Un cambio no se da por guardado hasta que la nube lo confirma.** La subida lleva 600 ms de respiro, así que
la recarga de arriba la mataba: la tarea recién creada se quedaba solo en `localStorage`, el `onSnapshot`
traía la versión anterior de la nube, la pisaba, y la pantalla decía «Tarea no encontrada». Ahora, en cuanto
cambia una parte se apunta en `kntera.pendientes.v1` (`marcarPendientes` de `nube.ts`) **antes** de esperar
al respiro, y eso gobierna dos cosas:

- mientras una parte está pendiente, **lo que llegue de la nube para ella se descarta**: es más viejo;
- al arrancar, lo que quedara pendiente **se sube antes de escuchar nada**.

Solo se borra de la lista cuando la escritura termina bien. Si tocas la sincronización, respeta el orden de
los efectos de `app-store.tsx`: recuperar pendientes va antes que `escucharNube`.

**El indicador de la barra no puede mentir.** `EstadoNube` dice «Guardando» mientras quede algo por subir y
«Sin espacio» si `guardarDB` devuelve `false` (cuota de `localStorage` llena, normalmente una escena de
pizarra enorme). Nunca debe decir «Al día» con cambios pendientes.

**El servidor de desarrollo escribe en la Firestore de producción.** Para probar sin que el club lo vea en su
móvil, arranca contra otro espacio con `NEXT_PUBLIC_CLUB_ID` en un `.env.local` y bórralo al terminar.

Firestore no admite `undefined` y el modelo usa campos opcionales por todas partes: `nube.ts` los limpia al
subir y los restaura al bajar. No escribas código que distinga `null` de `undefined` en datos sincronizados.

**Migraciones.** `DB_VERSION` está en `src/lib/db/seed.ts` y los pasos incrementales en `migrar()` de
`storage.ts`. Al añadir un módulo: sube la versión, escribe su paso y añade la colección a `normaliza()`. Si el
cambio de modelo es tan grande que no se puede convertir, el paso regenera la semilla, pero eso **borra los
datos del usuario**: avísalo explícitamente en la respuesta.

Las semillas están troceadas en `src/lib/db/seed-*.ts` y son deliberadamente ricas (50 tareas, 9 escenas de
pizarra y **20 fichas de jugador** del Cadete A, con partidos, minutos y goles) para que ninguna pantalla se vea
vacía. Las fechas y las edades se calculan **relativas a hoy**, no fijas.

**En la pizarra, `x` e `y` son el centro de la pieza, no su esquina.** Vale para todo, zonas incluidas: una
`zona` con `x: 50, y: 44, w: 60` ocupa del 20 % al 80 % del ancho, no del 50 % al 110 %. Y `w`/`h` van en
porcentaje de un lienzo de referencia de 1000 × 650 escalado al campo elegido, así que `h` no es el porcentaje
del alto real. Al escribir escenas a mano en `seed-escenas.ts`, ábrelas después en `/pizarra` y míralas: no hay
nada que avise de que una pieza se ha salido del campo.

Una escena se engancha a una tarea por `tareaId`, y la ficha de la tarea la pinta debajo de la descripción
(busca por `tarea.escenaId` **o** por `escena.tareaId`). Es la forma de que un ejercicio se explique con el
dibujo y no solo con el texto.

**El club de pruebas tiene un equipo: el Cadete A** de la temporada en curso. Su plantilla vive en
`seed-roster.ts` (`PLANTILLA_CLUB`), con nombre, dorsal, demarcación y fecha de nacimiento de cada uno. Si
añades o quitas a alguien, hazlo ahí. No metas equipos de relleno.

**El Infantil B 2025/26 se retiró el 19 sep 2026** (Iván no lo quiere en la app): era la temporada cerrada de la
que promocionaba esta misma plantilla, con su propio histórico reconstruido a partir de los totales reales de
la federación. Se quitó con una migración versionada (`DB_VERSION` 15 → 16 en `storage.ts`) que borra el
equipo, su plantilla, su cuerpo técnico, sus partidos y sus tarjetas por `teamId`, y —como la nube no guarda la
versión— `completaSemilla` lleva además una comprobación por contenido: cada colección (`teams`, `players`,
`tecnicos`, `partidos`, `sedes`) se revisa **por separado**, porque sincronizan en documentos distintos
(`PARTES_SINCRONIZADAS`) y pueden llegar sueltas y en cualquier orden por `onSnapshot` — comprobar solo `teams`
no basta si `players` vuelve stale por su cuenta. `seed-historico.ts`, que reconstruía ese histórico partido a
partido con un algoritmo voraz, se borró entero: si hace falta traer de vuelta un histórico de otra temporada,
el patrón a seguir es ese fichero, recuperable del historial de git.

### La liga

**El calendario es el de verdad, no uno generado.** El Cadete A juega la **4ª Cadete Málaga, Grupo 5**, y sus
veintiséis jornadas están en `seed-partidos.ts` con la fecha y el campo que publica la federación. La **hora
no**: la RFAF la da unos días antes, así que va un 11:00 orientativo y cada partido lo dice en sus notas.

**Cambio de categoría el 18 sep 2026.** El equipo bajó de la 3ª Andaluza (Grupo 1, 16 equipos, 30 jornadas) a
esta 4ª Cadete Málaga (Grupo 5, 14 equipos, 26 jornadas). Se hizo con una migración versionada (`DB_VERSION`
14 → 15 en `storage.ts`) que quita las jornadas viejas y siembra las nuevas reconociéndolas por el patrón de id
`par_jNN` —exclusivo de las jornadas oficiales—, así que un amistoso creado a mano nunca se confunde con una.
Como **la nube no guarda la versión**, `completaSemilla` lleva además una comprobación por contenido
(`calendarioObsoleto`): si algún dispositivo sin actualizar sube de vuelta el calendario de la 3ª Andaluza, se
detecta por el rival de cada id y se vuelve a sustituir entero. Si cambia la categoría otra vez, el patrón a
seguir es este, no el de tocar `completaSemilla` a mano por partido.

Los catorce equipos del grupo, con su escudo y su campo, están en `src/lib/liga.ts`, junto a los enlaces a las
fichas de la RFAF. **La clasificación y los goleadores no se copian**: una tabla copiada envejece en cuanto se
juega la jornada siguiente, así que la sección **RFAF** (`/rfaf`) enlaza a la federación, que es el dato bueno,
y a su lado enseña lo único estable de la temporada: los catorce del grupo y dónde juegan. Es una sección del
catálogo como cualquier otra —clave `rfaf`, abierta a todos los perfiles—, no una tarjeta suelta: `/calendario`
solo deja un atajo hacia ella.

**Los cuatro enlaces de `/rfaf` son provisionales.** Apuntan al buscador general de competiciones de la RFAF, no
a la ficha exacta del grupo: hacen falta los códigos (`codcompeticion`, `codgrupo`) de esta competición nueva, y
no se han podido traer solos —hay que pegarlos desde el enlace del calendario en rfaf.es—. En cuanto Iván los
pase, sustituir las cuatro URLs de `LIGA.urls` (y el cuerpo de `urlJornadaRFAF`) por el patrón exacto que usaba
la 3ª Andaluza: se conserva en el historial de `liga.ts`.

El rival de un partido es texto libre —se pueden crear amistosos contra cualquiera—, así que el escudo se busca
por nombre con `escudoDeRival()`, tolerando acentos, puntos y comillas. Si el rival no es de la liga, no se
pinta escudo: ni hueco reservado ni silueta gris. El campo `escudo` de `EquipoLiga` es opcional por eso mismo.

**Los escudos viven en `public/escudos` en minúscula.** Firebase Hosting distingue mayúsculas y Windows no: una
carpeta `public/Escudos` se despliega como `/Escudos/` y todas las rutas del código dan 404. Eso sí, los
**ficheros** dentro de `public/escudos` pueden llevar mayúsculas en su nombre (`Alhaurino.png`, `SanJulian.jpg`):
lo que no puede cambiar de caja es la carpeta. Los catorce del grupo anterior que ya no compiten se guardaron en
`public/escudos/otros/`, por si hicieran falta; los originales que aportó el club siguen fuera de `public/`, en
`escudos-originales/`, para no publicarlos dos veces.

### La convocatoria

**Avisar publica.** Marcar el aviso como enviado deja el partido en `convocatoria-enviada` **y** pone
`publicada: true`. Antes eran dos cosas separadas y el resultado era el peor posible: el entrenador daba por
avisado el partido y la familia abría Partidos y no encontraba nada. El interruptor de la ficha sigue estando
para volver a ocultarla.

**Publicar el directo publica también el partido**, por el mismo motivo (fallo real detectado el 19 sep 2026):
`usePartido`/`usePartidosEquipo` ocultan por completo un partido con `publicada: false` a quien no tiene
`crearConvocatorias`, así que un amistoso o una convocatoria sin avisar seguía sin existir para las familias
aunque el entrenador le diera a «Publicar» dentro del Live —esa acción solo tocaba `live.publicado`—. El botón
de la ficha del directo ahora sube los dos campos a la vez; ocultar el directo de nuevo no vuelve a ocultar el
partido.

**El calendario de la federación nace publicado.** No es un borrador del entrenador: si no lo estuviera,
Calendario enseñaría las treinta jornadas y Partidos aparecería vacío para las familias. `completaSemilla`
publica por contenido las jornadas oficiales que nadie haya empezado a preparar (sin convocados y sin avisos),
porque la nube no guarda la versión y una migración numerada no llegaría.

**Los avisos de «Revisa la convocatoria» son solo para el cuerpo técnico.** «Todavía no has convocado a nadie»
o «la convocatoria aún no se ha enviado» son recordatorios de trabajo, no datos del partido: a la familia no le
dicen nada que pueda hacer y solo siembran la duda de si algo va mal. `EditorConvocados` los oculta por completo
cuando `editable` es `false` (fallo real detectado el 19 sep 2026: una familia podía ver un partido ya publicado
—liga o amistoso, nace o no publicado— antes de que el entrenador avisara, y se encontraba el aviso del
entrenador en su pantalla).

**Los minutos que hay que repartir son los que se jugaron**, no los reglamentarios:
`minutosJugadosDelPartido()` lee el último evento `fin` del directo. Un partido cortado en el 41' reparte
41 × jugadores en campo, y eso es lo que ve la pantalla y lo que guarda el acta.

**El tope de convocados es el del formato** (`equipo.formato.maxConvocados`), y se aplica al tocar, no solo se
avisa: un acta con diecinueve nombres no la admite el árbitro. El tope de titulares ya lo hacía.

**La convocatoria automática no llama a quien ha dicho que no.** Los que rechazaron se conservan en la lista
—su respuesta es parte de la historia del partido— pero no vuelven al once.

**El reparto de minutos no penaliza una boda.** `minutosPorJugador` descarta las convocatorias rechazadas sin
minutos: si contaran, quien avisó de que no podía ir aparecería con 0 % y la brecha del equipo mentiría.

**Un partido pasado sin cerrar se avisa.** `partidoPorCerrar()` los detecta y la lista los saca en una banda
ámbar; si no, desaparecían de «Próximos» y se quedaban en el histórico sin minutos ni resultado.

### El partido

**Los minutos se cuentan desde el once que salió, no desde los titulares de la convocatoria.** Son dos cosas
distintas: en la convocatoria se puede marcar más gente de la que cabe en el campo, y los que sobran no juegan.
`crearLive` congela el once en `live.once` y `minutosPorJugadorLive` cuenta desde ahí; sin eso, catorce
titulares para un partido de once daban cuarenta minutos a tres jugadores que no se levantaron del banquillo.
Las convocatorias anteriores a `once` siguen contando por los titulares, que es lo único que tienen.

**El acta guarda exactamente lo que enseña la pantalla.** El minuto de cierre lo decide el evento `fin`
(`minutoFinal`), no la duración reglamentaria: un partido cortado en el 68' reparte 68 minutos, y eso es lo
que se ve en la pestaña «Minutos» y lo que se escribe en la convocatoria. Si cambias uno, cambia el otro.

**Los cambios son ilimitados y revocables.** Es fútbol base: el chaval que sale vuelve a entrar cuando haga
falta, y otra vez fuera si toca. `disponiblesParaEntrar` solo descuenta al **expulsado**; el banquillo son
todos los convocados que no están jugando. `minutosPorJugadorLive` suma **un tramo por cada vez que pisa el
campo**, así que rotar no falsea los minutos, y `tramosPorJugador` cuenta esas entradas para decidir a quién
le toca. Los expulsados se enseñan tachados aparte, para que no parezca que se han perdido de la convocatoria.

**Un cambio puede tener una sola mitad.** El apunte `cambio` lleva `playerId` (el que sale),
`playerRelacionadoId` (el que entra) o los dos: en la banda se saca a uno mientras se le atiende y se mete a
otro después, y eso son dos movimientos. `aplicarEvento`, `deshacerUltimoEvento`, la cronología y el texto
para compartir contemplan los tres casos. Antes del pitido inicial los apuntes van al minuto 0, para que
retocar la alineación no le regale un minuto a quien no llegó a jugar.

**La rejilla de «Anotar» dice cuánto lleva jugando cada uno.** Un entrenador que acaba de anotar un cambio no
distinguía al que acababa de entrar del resto: los botones solo llevaban dorsal y nombre. En una banda real (caso
real del 19 sep 2026, revisado sobre el partido de producción) eso llevó a deshacer sin querer el cambio que se
acababa de hacer, porque el que acababa de saltar al campo parecía uno más de los once. `ModalEvento` recibe
ahora los minutos de cada jugador y los pinta bajo el dorsal en toda rejilla de campo o banquillo.

**El portero se distingue con un 🧤, siempre.** Se confunde con cualquier otro dorsal en una tarjeta o en un
cambio, y en «Parada del portero» el error es peor: antes se podía elegir a cualquiera de los once. Ahora
`guion("parada")` filtra a quien tenga `posicion === "POR"` **dentro del campo** —con el resto como reserva si
ningún portero está jugando, para no dejar al entrenador sin poder anotar la parada por un dato incompleto—, y
si solo hay un candidato se marca solo. Un aviso propio (`avisoPortero` en `vista.tsx`, solo para el cuerpo
técnico) avisa si hay dos porteros sobre el campo a la vez o ninguno: es la alineación la que decide, y sin este
aviso el error se descubre tarde.

**Tocar «Sale» obliga a decir quién entra, y al revés solo si hace falta.** Antes «Sale» aplicaba el cambio al
instante, sin preguntar por el sustituto: es exactamente el patrón que llevó a la confusión del 19 sep 2026 (ver
más abajo). Ahora tocar «Sale» o «Entra» en «Campo y banquillo» **siempre** abre el formulario de cambio con ese
jugador ya elegido; el otro lado es obligatorio salvo dos casos con salida explícita, nunca silenciosa:
- **Entrar con sitio libre** no obliga a decir quién sale (`inicial.salidaOpcional` en `vista.tsx`, calculado por
  `campoLleno`): añadir uno sin quitar a nadie es válido mientras no se pase del formato.
- **Sacar sin sustituto** («Sacar sin meter a nadie (atención médica)», siempre visible en el cambio) es la única
  forma de dejar el campo con menos jugadores: cubre a quien se atiende una lesión y vuelve a entrar después.

Como red de seguridad, `anotar` en `vista.tsx` recalcula el campo resultante antes de guardar un cambio y lo
rechaza si se pasa de `equipo.formato.jugadoresEnCampo`, por si algo se cuela por otra vía.

**La segunda amarilla expulsa sola.** `aplicarEvento` en `live.ts` cuenta las amarillas previas del jugador al
anotar una nueva y, si es la segunda, añade también una roja automática con la nota «Doble amarilla»: sale del
campo y cuenta para la sanción sin que el entrenador tenga que tocar nada más. Las dos tarjetas quedan como
apuntes independientes en la cronología —se pueden corregir o borrar cada una por su lado, igual que cualquier
otro apunte, ver más abajo—.

**El campo es un valor derivado, no un contador que se parchea.** `enCampoDesdeEventos(once, eventos)` en
`live.ts` recalcula quién está jugando repitiendo la cronología entera desde el once inicial, en vez de sumar o
restar sobre `live.enCampo` evento a evento. Es lo que permite borrar o corregir un apunte que no sea el último
—o que la doble amarilla expulse sola— sin dejar el campo desincronizado de lo que realmente cuenta la
cronología. `aplicarEvento`, `eliminarEvento` y `deshacerUltimoEvento` pasan siempre por aquí.

**Cualquier apunte se puede corregir o borrar, no solo el último.** `editarEvento` cambia el minuto o la nota de
un apunte ya guardado —nunca a quién señala, eso cambiaría el resultado o el campo— y `eliminarEvento` lo quita
entero, esté donde esté en la cronología. `Cronologia` pinta un lápiz y una papelera en cada línea, solo para
quien puede registrar el directo: un error a mitad de partido no se queda clavado en el acta hasta el final.

**Las tarjetas al rival llevan control aparte.** `amarilla-rival` y `roja-rival` no tienen ficha que enlazar
—el rival no está en la plantilla—, así que el dorsal es texto libre (`dorsalRival` en `EventoLive`): un
cuadro de número más una rejilla de atajos, y en blanco si no se ha visto bien. No tocan el marcador ni el
campo propio, y aparecen en la cronología igual que cualquier otro apunte.

**El dibujo del campo también lleva la amarilla.** `conAmarillaEnCampo(live)` en `live.ts` dice quién tiene una
amonestación enseñada y sigue en el campo —la segunda ya no cuenta ahí, porque expulsa—, y `CampoLive` la pinta
junto al dorsal. El banquillo tiene su propio dibujo, `BanquilloLive`, con el mismo lenguaje visual que el campo,
justo al lado del cuerpo técnico: no es una lista más, es parte del mismo cuaderno.

**Nada de onces fijos de once.** Cuántos juegan a la vez sale de `equipo.formato.jugadoresEnCampo`: el tope de
titulares, la convocatoria automática, los avisos y los minutos que hay que repartir. En fútbol 7 son siete.

**Cerrar el acta es idempotente**: recalcula convocados, resultado y tarjetas desde los eventos, así que se
puede cerrar las veces que haga falta para corregir sin duplicar nada.

### Imágenes que salen de la aplicación

**El acta y la tarjeta del jugador se dibujan a mano sobre un lienzo** (`src/lib/lienzo.ts` + `acta.ts` +
`tarjeta.ts`), no se captura la pantalla ni se usa ninguna librería. Motivo: salen igual en cualquier móvil, no
dependen de la tipografía del sistema ni del tema, y `toBlob` funciona sin problemas de lienzo contaminado
porque todo lo que se pinta es del propio sitio o un `data:`.

Las herramientas de `lienzo.ts` son las que hacen que nada se salga: `texto()` **encoge la letra hasta que
cabe y, si aún no cabe, parte en varias líneas —nunca recorta con puntos suspensivos**, porque un apellido a
medias en un acta no vale para nada; `cubrir()` recorta la foto como `object-fit: cover` en vez de
deformarla. Si añades un bloque nuevo, mide antes con `altoParrafo` y súmalo al alto del lienzo: el canvas no
crece solo y lo que se salga se pierde sin avisar.

**Compartir lo pone el sistema.** `comparteImagen()` usa `navigator.share` con el fichero cuando el
dispositivo lo admite —ahí salen WhatsApp, correo y lo que cada uno tenga— y, si no, descarga la imagen. No hay
integración con ninguna aplicación concreta ni la habrá: no hace falta.

**El acta no lleva lo interno por defecto.** Las notas del partido y el informe del cuerpo técnico solo se
añaden si quien la genera enciende el interruptor, que además solo ve quien tiene `registrarResultados`.

### La tarjeta del jugador

La decora **solo él** —o su familia, que comparte ficha—: la tarjeta aparece en `/plantilla/<suyo>` cuando
`usuarioActivo.playerIds` incluye la ficha. El cuerpo técnico no la ve ni la toca.

**La foto no se sincroniza.** El diseño vive en `ajustes.tarjetas[playerId]`, y `ajustes` es lo único que no
viaja a la nube. Es deliberado por dos motivos: son fotos de menores y a la base de datos entra cualquiera con
el enlace; y veinte fotos en el documento de `players` reventarían el límite de 1 MiB de Firestore y la
sincronización del club entero dejaría de funcionar en silencio. `encogeFoto()` además la reduce a 720 px
antes de guardarla.

### Copias de seguridad

`src/lib/db/copias.ts` aparta el estado entero cada seis horas en **IndexedDB**, no en `localStorage`: ahí
caben varios megas sin competir con el hueco que la aplicación necesita para funcionar, y si el almacenamiento
normal se llena las copias siguen intactas. Se guardan ocho como mucho, y la última copia manual no se borra
nunca aunque le toque.

El efecto que las dispara está en `app-store.tsx` y espera **veinte segundos** tras arrancar: copiar antes de
que llegue el primer `onSnapshot` guardaría una foto vieja del club.

Restaurar una copia pasa por `importarDatos`, así que el efecto de persistencia marca todas las partes como
pendientes y **la restauración llega al resto del equipo**. Eso la hace peligrosa: avísalo siempre en la
interfaz, como hace la tarjeta de Ajustes.

### Perfiles y permisos

Cuatro perfiles: `administrador`, `entrenador`, `jugador`, `responsable` (padre, madre, tutor legal o familia de
acogida). El catálogo de 18 permisos y sus valores de fábrica están en `src/lib/permisos.ts`; los valores
vigentes en `db.permisos[rol]`, editables desde `/usuarios`.

**`administrador` se acumula, no sustituye.** Un usuario tiene un `rol` y, aparte, `esAdministrador`. Nunca leas
`db.permisos[rol]` a pelo: usa `permisosDe(usuario, db.permisos, vistaPreviaRol)` y `seccionesDe(...)`, que
suman lo del perfil y lo de administrador, y respetan la **vista previa** (el administrador mirando la app con
los ojos de otro perfil). En los componentes basta con `permisos` y `verSeccion()` del store, que ya lo hacen.

**Jugadores y responsables ven lo mismo de su equipo, y nada personal.** La plantilla entera sí; fechas de
nacimiento, edad, documento, ficha federativa y teléfonos no. Lo decide `verDatosPersonales`. Si añades un campo
a la ficha, decide en qué lado cae antes de pintarlo.

**Cada pantalla se adapta al perfil, no solo se le niega el acceso.** No basta con deshabilitar botones: lo que
es trabajo del cuerpo técnico —el reparto de minutos de todo el equipo, el informe del partido, la asistencia
del grupo, el material que hay que sacar, el interruptor de publicar— **no se le enseña** a quien no lo hace.
Una pantalla llena de cosas apagadas hace creer que la aplicación es más complicada de lo que es. La guía de uso
(`/guia`) sigue la misma regla: se arma a partir de los permisos de quien la lee.

**Ajustes no es solo preferencias.** Exportar, importar, vaciar la temporada y restaurar la semilla rehacen los
datos **de todo el club** y viajan a la nube: si un padre toca «Restaurar datos de ejemplo», el entrenador se
queda sin temporada en su móvil. Esa tarjeta va detrás de `editarClubEquipo`; lo único que ve todo el mundo en
`/ajustes` es el tema y el selector de equipo y usuario. Y ese selector filtra con `puedeAcceder`, como el de la
barra: ofrecer una cuenta sin validar solo lleva a la pantalla de espera.

En las pantallas **nunca compruebes el rol**: consulta el permiso concreto. Y un permiso que no filtra nada es
peor que no tenerlo: promete al entrenador un control que no existe. Si añades uno al catálogo, aplícalo en la
pantalla en la misma iteración.

```tsx
const { permisos } = useApp();
const editable = permisos.crearSesiones; // no: rolActivo === "entrenador"
```

El usuario activo (`db.ajustes.usuarioActivoId`) determina el rol y, con él, los permisos. El selector de la
barra superior permite entrar como cualquier usuario **validado** para probar cada perfil. `gestionarUsuarios`
del entrenador está bloqueado a propósito: si se pudiera quitar, nadie podría volver a entrar.

**El acceso es anterior a los permisos.** Un usuario nace `estado: "pendiente"` cuando pide entrar desde
`/solicitar` y no ve ninguna pantalla hasta que un entrenador lo valida. La única comprobación válida es
`puedeAcceder(usuario)` de `permisos.ts` (validado + activo); la aplica `AppShell`, así que las pantallas no
tienen que repetirla, pero cualquier lista de «usuarios que pueden entrar» debe filtrar con ella.

**Y antes del acceso, la sesión.** `AppShell` es la única puerta y encadena tres filtros en este orden: sin
`ajustes.sesionIniciada` solo se pinta `PantallaAcceso`; con sesión pero sin validar, la pantalla de espera; y
ya dentro, el filtro de secciones. `/solicitar` y `/guia` son **rutas públicas** y quedan fuera de los tres: no
están en `SECCIONES` y se leen sin haber entrado. En pruebas el acceso no valida nada; toda la comprobación real
vive detrás de `iniciarSesion` del store, que es lo único que habrá que sustituir cuando haya autenticación.

**Secciones y permisos son dos filtros distintos, y hacen falta los dos.** Las *secciones*
(`src/lib/secciones.ts`, valores en `db.secciones[rol]`) dicen qué pantallas ve cada perfil; los *permisos*,
qué puede hacer dentro de ellas. El entrenador configura ambos desde `/usuarios`. La navegación, la barra
inferior y el centro de control salen del catálogo de secciones —no de listas de rutas escritas a mano— y
`AppShell` corta el acceso directo por URL con `seccionDeRuta` + `puedeVerSeccion`. Al añadir una pantalla,
añádela a `SECCIONES`.

**El equipo no lo elige el jugador.** `equipoActivo` sale de `equiposDelUsuario`: el entrenador ve todos los del
club, pero un jugador o un responsable solo los de las fichas a las que está vinculado. Por eso a un jugador del
cadete le aparecen los entrenamientos, los partidos y el tablón del cadete y nada más, sin que ninguna pantalla
tenga que filtrar por su cuenta.

### Lógica de dominio

Fuera de los componentes, en `src/lib/`:

| Fichero | Qué resuelve |
| --- | --- |
| `generador.ts` | Motor de propuestas de sesión. Puntúa cada tarea contra lo que pide el entrenador y devuelve la propuesta **con su razonamiento y sus avisos**. Es el punto de enganche si algún día se conecta un modelo real: mismo contrato de entrada y salida. |
| `sesiones.ts` | Cronograma, material necesario (el **máximo** por bloque, no la suma: los bloques van seguidos), asistencia y carga. |
| `convocatorias.ts` | Convocatoria, minutos, equidad de reparto, navegación y el texto del aviso. |
| `live.ts` | Live de partido. La lista de eventos es la única verdad: marcador, minutos y tarjetas se **calculan** a partir de ella, y `aplicarLiveAlPartido` la vuelca sobre la convocatoria al cerrar el acta. Nunca escribas un marcador a mano. |
| `comunicacion.ts` | Tablón y agenda. Filtra siempre por equipo **y** por perfil destinatario, y unifica sesiones, partidos y eventos en un solo calendario. |
| `secciones.ts` | Catálogo de pantallas, qué ve cada perfil y a qué sección pertenece cada ruta. |
| `plantilla.ts` | Líneas del campo, resumen del jugador, campograma y CSV. |
| `estadisticas.ts` | Agregados de liga, progresión, goleadores y reparto de minutos. |
| `labels.ts` | Etiquetas, colores y órdenes de todo el dominio. **Nunca escribas una etiqueta de dominio a mano en un componente.** |

### Componentes

`src/components/ui/` tiene las primitivas (`primitives.tsx`, `form.tsx`, `overlay.tsx`). Úsalas siempre: no
metas `<button>` ni `<input>` sueltos con clases propias.

El color se aplica con variables CSS semánticas (`var(--brand)`, `text-default`, `bg-surface`, `border-default`)
definidas en `src/app/globals.css`, que se recolorean solas en modo oscuro. Las escalas de marca (`grape`,
`pitch`, `ink`) están en el bloque `@theme`. Los colores de estado (verde `#26895d`, ámbar `#e8a33d`, rojo
`#d9534f`) van en `labels.ts`.

**Un color de dominio sirve para teñir, no para escribir.** Los hex de `labels.ts` están pensados sobre fondo
claro y no saben en qué tema estamos: el ámbar como texto sobre su propio tinte daba 1,95:1 y el gris `#5f5775`
sobre el fondo oscuro, 2,6:1. Por eso **nunca pongas `style={{ color: unColorDeDominio }}`**. Usa:

- `<Badge color={...}>`, que ya lo resuelve (`.badge-suave` / `.badge-contorno` / `.badge-solido`);
- o la utilidad `tono-dominio` para texto suelto: `className="tono-dominio" style={{ "--c": color }}`.

Las dos oscurecen el tono en claro y lo aclaran en oscuro, conservando el matiz —que es lo que distingue una
categoría de otra—. Y para texto **sobre** un color de ficha, `textoSobre(color)` de `utils.ts` elige blanco o
tinta por luminancia; el ámbar con iniciales blancas no se leía.

## Convenciones

- **Todo en español**: nombres de tipos, propiedades, variables, funciones, comentarios y textos de interfaz. El
  modelo de datos usa vocabulario de fútbol español (`convocado`, `microciclo`, `dorsal`, `demarcación`).
- Los comentarios explican **por qué**, no qué. Si el código ya lo dice, no lo comentes.
- Móvil primero: por debajo de `lg`, barra inferior con las cuatro primeras secciones que el perfil tenga
  abiertas (`PRIORIDAD_MOVIL` en `app-shell.tsx`) más «Más»; barra lateral completa por encima. Las barras de
  acción fijas van a `bottom-[3.4rem] lg:bottom-0` para no taparse con la nav inferior. Ninguna pantalla puede
  desbordar en horizontal a 375 px; lo ancho (tablas) hace scroll dentro de su tarjeta.
- **Toda columna de un `grid` o de un `flex` lleva `min-w-0`.** Sin eso su `min-width: auto` impide que
  encoja, el contenido se sale y `overflow-x: hidden` de `body` lo recorta **en silencio**: en el móvil se
  pierde media tarjeta sin que aparezca ninguna barra de scroll. Comprobarlo midiendo `getBoundingClientRect().right`
  de los elementos, no el `scrollWidth` del documento, que el recorte falsea.
- Datos personales: `seed-roster.ts` lleva los **nombres reales** de la plantilla del Cadete A, aportados por el
  club para su propia aplicación. La fecha de nacimiento de cada uno es aproximada y está marcada como tal. No
  añadas más datos personales de menores —fechas de nacimiento reales, documentos, teléfonos, direcciones— ni
  ahí ni en ningún otro ejemplo, y avisa antes de publicar el repositorio en un sitio abierto.
- Cuando algo no está construido, dilo en la interfaz («Pronto») en vez de fingir que funciona.

## Estado del proyecto

Construidos y en uso: **Entrenamientos**, **Convocatorias**, **Live de partido**, **Comunicación** (tablón y
agenda) y **RFAF**. El chat privado, los contactos, el tallaje y el canal LOPIVI necesitan identificación real y
cifrado, y por eso se dicen «Pronto» en vez de simularse.

**El módulo de Análisis se retiró el 6 sep 2026**, con sus tarjetas de «Modelo de juego», «Biometría»,
«Informes» y «Galería»: Iván no lo quiere en el producto. No lo devuelvas al catálogo ni a `/proximamente`
salvo que él lo pida.

Los módulos se entregan completos y verificados, uno por iteración. Al terminar uno, actualiza su estado en
`INVENTARIO-CAPTURAS.md` y la tabla del `README.md`.

**En pruebas la base de datos está abierta**: las reglas de `firestore.rules` acotan el sitio a `clubes/**`
pero no comprueban quién eres, porque todavía no hay autenticación. Es aceptable entre las cuatro cuentas que
están probando; deja de serlo en cuanto se comparta el enlace más allá. Si tocas algo de acceso, dilo en la
respuesta.

## Importar configuración de otros agentes

Hay configuración de Codex (`~/.codex/config.toml`) y de Gemini CLI (`~/.gemini/settings.json`) en este equipo.
Si quieres traer sus servidores MCP, comandos, subagentes o instrucciones a Claude Code, responde `/import` para
ver qué es importable y después `/import --yes=<digest>` para aplicarlo.
