# Functional Specification: Sincronización de Adhesiones Web

**Status**: Draft
**Created**: 2026-07-01

## Problem Statement

> Feature con parte backend (principal) y parte frontend (más sencilla). En "Adhesiones Pendientes en Web", el botón **Sincronizar Nube** debe llamar a un **nuevo endpoint de backend**, el cual a su vez llama al endpoint externo del sitio del Partido Nacional:
>
> `https://partidonacional.org.uy/admin/index.php/app/retornarValoresFormularioAdhesionFechaHora?password=MiPn.2024`
>
> El endpoint externo recibe (por GET) un campo `fecha_hora` en formato `'2026-05-22 00:00:00'` y retorna un JSON con las adhesiones a partir de esa fecha. Esto implica **borrar la data mockeada** que hoy alimenta el botón sincronizar. El botón debe traer toda la data desde la **última sincronización** (guardando esa fecha-hora en base u otro lado). Si esa fecha es nula (primer arranque del sistema), traer los **últimos 3 días**.

## Hallazgos de la prueba del endpoint (2026-07-01)

Se probó el endpoint externo en vivo antes de especificar. Resultados:

- ✅ **El `password` SÍ se valida.** Con password incorrecto retorna:
  `{"respuesta":[],"error":1,"mensaje":"Error de credenciales"}`.
- 🔴 **CRÍTICO — el parámetro `fecha_hora` es IGNORADO por el endpoint externo.** Se probaron múltiples valores (`2020-01-01`, `2026-06-30`, fecha futura `2030-01-01`, sin parámetro) y variantes de nombre (`fechaHora`, `fecha`). **Todas devuelven idéntico**: 1107 filas / 67 formularios distintos, rango fijo `2026-05-22 17:14:10 → 2026-06-30 11:30:48` (aprox. últimos ~40 días). El endpoint no filtra server-side.
- **Forma de la respuesta (éxito):** `{"respuesta": [ {...}, ... ]}` — array plano de filas EAV (entidad-atributo-valor). NO viene agrupado por adhesión.
- **Estructura de cada fila:**
  ```json
  {
    "identificador_formulario": "04xTlVdZ4QPFxKQlYZ7n",
    "fecha_hora_registro": "2026-06-30 09:25:58",
    "nombre_campo": "Nombre completo: ",
    "valor_campo": "Tania  Alicia "
  }
  ```
- Cada **adhesión** = todas las filas con el mismo `identificador_formulario` (~17-19 campos por formulario).
- Ojo con los datos: los `nombre_campo` tienen **espacios/dos puntos** (ej. `"Nombre completo: "`, `"Cédula de Identidad Nro:"`); hay una fila con `nombre_campo: null` y `valor_campo: "votar_internas"` (marcador); y hay claves **`Departamento:` duplicadas** (una es el departamento real, otra viene `"0"`).

**Implicancia de diseño:** como el endpoint externo NO filtra por fecha, el **filtrado incremental por última-sincronización debe hacerse en el nuevo backend**: se trae la ventana completa y se filtra en memoria por `fecha_hora_registro >= ultima_sincronizacion` (o últimos 3 días si es null), se agrupa por `identificador_formulario`, se deduplica contra lo ya guardado, y se persisten solo las adhesiones nuevas. El default de "últimos 3 días" también se resuelve backend-side.

## Objectives

- [ ] Nuevo endpoint de backend que sincroniza adhesiones web desde el endpoint externo del PN.
- [ ] Persistir la marca de **última sincronización** (fecha-hora) y usarla como punto de partida incremental.
- [ ] Al primer arranque (última sincronización null): traer los últimos 3 días.
- [ ] Mapear el EAV externo → `AdhesionWebDto` y deduplicar permanentemente por `identificador_formulario`.
- [ ] Frontend: el botón **Sincronizar Nube** invoca el nuevo endpoint (POST), muestra estado de carga, un resumen del resultado, y luego recarga el listado + stats.
- [ ] Eliminar la data mockeada que hoy alimenta `/adhesiones/web`.

## Out of Scope

- No se toca el flujo de adhesiones **locales** ni "pasar a local".
- No se implementa filtrado por fecha en el endpoint externo (no es nuestro; está fuera de control).
- (A definir en /project.spec) Sincronización automática/programada — por ahora es manual vía botón.

## User Stories

### US-1: Sincronizar adhesiones web desde la nube
**As a** administrador del partido
**I want to** presionar "Sincronizar Nube" en Adhesiones Pendientes en Web
**So that** se traen las adhesiones nuevas registradas en el sitio del PN desde la última sincronización

#### Acceptance Criteria
- AC-1: Al presionar el botón, el FE llama al nuevo endpoint de sync del backend (no data mockeada).
- AC-2: El backend trae desde el endpoint externo y persiste solo adhesiones nuevas (dedupe por `identificador_formulario`).
- AC-3: Tras sincronizar, el listado y las stats se recargan mostrando las nuevas adhesiones.
- AC-4: Si nunca se sincronizó (marca null), se traen los últimos 3 días.
- AC-5: En sincronizaciones siguientes, se traen adhesiones con `fecha_hora_registro >= última marca guardada`.
- AC-6: Tras sincronizar, la UI muestra un **resumen** (ej. "12 nuevas, 55 ya existían") y el botón refleja estado de carga mientras la sync corre (deshabilitado + feedback).

### US-2: Persistir la última sincronización
**As a** sistema
**I want to** guardar la fecha-hora de la última sincronización exitosa
**So that** la próxima sync sea incremental y no reprocese/duplique adhesiones

#### Acceptance Criteria
- AC-7: Tras una sync exitosa, se guarda como marca de última sincronización el **`max(fecha_hora_registro)` efectivamente procesado** (no el instante del sync), para no perder adhesiones con fecha anterior al momento de sincronizar.
- AC-8: Si la sync falla (credenciales/timeout/error), la marca NO se actualiza.

### US-3: No reprocesar adhesiones ya descartadas o procesadas
**As a** administrador
**I want to** que las adhesiones que ya eliminé o pasé a local no vuelvan a aparecer al sincronizar
**So that** la ventana fija de ~40 días no me reinserte "zombies" que ya descarté

#### Acceptance Criteria
- AC-9: El sistema recuerda **permanentemente** todo `identificador_formulario` ya visto (incluso los eliminados o pasados a local) y **nunca lo reinserta** en adhesiones web.

## Business Rules

- BR-1: El filtrado incremental por fecha se hace en el backend (el endpoint externo ignora `fecha_hora`).
- BR-2: Default de 3 días solo cuando la marca de última sincronización es null.
- BR-3: Dedupe permanente por `identificador_formulario`: se lleva registro de todos los identificadores ya vistos (histórico), no solo de las adhesiones web activas. Nunca se reinserta un identificador ya conocido, aunque haya sido eliminado o pasado a local.
- BR-4: El `password` del endpoint externo (`MiPn.2024`) es un secreto → NO hardcodear en el repo; va por configuración/environment del backend (ver CLAUDE.md → Secrets).
- BR-5: La marca de última sincronización = `max(fecha_hora_registro)` de las filas procesadas en la corrida exitosa.

## Edge Cases

- EC-1: Respuesta de credenciales inválidas (`error:1`) → no persistir nada, no mover marca, informar error en UI.
- EC-2: Endpoint externo caído / timeout → manejar error y no mover la marca de última sincronización.
- EC-3: `nombre_campo: null` (marcador `votar_internas`) y claves `Departamento:` duplicadas (una real, otra `"0"`) → mapeo robusto.
- EC-4: Adhesión ya vista (reprocesada por la ventana fija de ~40 días, o previamente eliminada/pasada a local) → dedupe permanente, no insertar (BR-3).
- EC-5: Respuesta vacía → sync exitosa sin cambios; la marca no cambia.

## Success Metrics

- Cero adhesiones duplicadas tras syncs repetidas.
- El botón trae adhesiones reales (no mock) y refleja las nuevas desde la última marca.

## Feature Dependencies

- Espejo en el repo backend `administracion-pn-backend` (.NET 8): nuevo endpoint de sync + persistencia de marca de última sincronización + cliente HTTP al endpoint externo del PN. Referenciar ID espejo cuando se cree.
