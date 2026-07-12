# Functional Specification: Manejo global de errores HTTP

**Status**: Draft
**Created**: 2026-07-11
**Backlog**: DEBT-002 (High)

## Problem Statement

Hoy el `httpErrorInterceptor` solo loguea a consola y re-emite el error; el `authInterceptor` maneja el 401 (logout + redirect). No hay UX de error: cuando el backend falla, la mayoría de los componentes no muestran nada y la pantalla queda en blanco o "congelada", sin que el usuario se entere de qué pasó. Tampoco hay confirmación visible cuando una acción sí funciona, ni estados consistentes de "cargando"/"sin datos" en los listados.

## Objectives

- [ ] Notificar globalmente los errores HTTP del backend con un toast, alimentado desde el interceptor (una sola fuente).
- [ ] Confirmar las acciones exitosas (guardar/eliminar) con un toast de éxito.
- [ ] Dar estados consistentes de **cargando / vacío / error** en las vistas de listado.
- [ ] Evitar mensajes duplicados donde ya hay manejo inline (opt-out por request).
- [ ] No romper el flujo de 401 (sigue siendo logout + redirect, sin toast).

## Out of Scope

- Reintentos automáticos / backoff de requests fallidos.
- Manejo offline / detección de red caída (más allá de mostrar el error).
- Rediseño de los formularios que ya validan inline (se respetan; solo se evita el doble mensaje).
- i18n de los mensajes (se usa el `message` del backend en español o un fallback).
- Cambiar el contrato de error del backend.

## User Stories

### US-1: Ver el error cuando el backend falla
**As a** usuario de la app
**I want to** ver una notificación clara cuando una operación falla
**So that** entiendo que algo salió mal y por qué, en vez de una pantalla en blanco

#### Acceptance Criteria
- AC-1: Ante cualquier respuesta HTTP de error **distinta de 401**, aparece un toast de error.
- AC-2: El texto del toast usa el `message` que devuelve el backend (ExceptionHandlingMiddleware); si no hay, usa un fallback por status (ej. 404 → "No encontrado", 5xx → "Error del servidor. Intentá de nuevo.").
- AC-3: El toast **no** muestra stack traces ni detalles internos.
- AC-4: Un **401** no genera toast (lo maneja `authInterceptor`: logout + redirect a /login).
- AC-5: El toast se auto-descarta a los ~5s y puede cerrarse manualmente.

### US-2: Confirmar que una acción funcionó
**As a** usuario que guarda o elimina algo
**I want to** ver una confirmación de que la operación se completó
**So that** tengo certeza sin tener que verificar manualmente

#### Acceptance Criteria
- AC-6: Al completar con éxito una mutación de los flujos alcanzados (guardar producto, nueva venta, nueva donación, pasar-a-local, crear/editar agrupación, eventos), aparece un toast de éxito con un mensaje corto ("Guardado", "Eliminado", etc.).
- AC-7: El toast de éxito usa un estilo distinto al de error (color/ícono).

### US-3: Saber si un listado está cargando o vacío
**As a** usuario que abre una vista de listado
**I want to** distinguir "cargando" de "no hay datos" de "hubo un error"
**So that** no confundo un listado vacío con una falla

#### Acceptance Criteria
- AC-8: Mientras se resuelve el GET de un listado alcanzado, se muestra un estado **cargando** (spinner/skeleton).
- AC-9: Si el GET devuelve 0 filas, se muestra un estado **vacío** ("Sin resultados") en vez de una tabla en blanco.
- AC-10: Si el GET falla, la vista muestra un estado **error** con opción de reintentar (además del toast global).
- AC-11: El patrón de estados es **reutilizable** (un componente/utility compartido), no copy-paste por vista.

### US-4: No recibir mensajes duplicados
**As a** usuario en una pantalla que ya muestra el error inline (modal de venta, pasar-a-local)
**I want to** ver el error una sola vez
**So that** la UI no repite el mismo mensaje dos veces

#### Acceptance Criteria
- AC-12: Un request puede pedir "no mostrar toast global de error" (opt-out) cuando el componente ya maneja el error inline.
- AC-13: Con el opt-out activo, el error llega igual al componente (el `throwError` se mantiene); solo se suprime el toast.

## Business Rules

- BR-1: El interceptor es la **única** fuente de toasts de error automáticos.
- BR-2: Orden de resolución del mensaje de error: `error.message` del backend → mensaje por status → genérico ("Ocurrió un error").
- BR-3: 401 nunca dispara toast (independiente del opt-out).
- BR-4: Los toasts se apilan (varios a la vez) y cada uno se descarta por separado.

## Edge Cases

- EC-1: Error de red / backend caído (status 0) → toast "No se pudo conectar con el servidor".
- EC-2: Ráfaga de varios errores (varios GET en paralelo fallan) → se apilan; se puede topear la cantidad visible.
- EC-3: Respuesta de error sin body / body no-JSON → cae al fallback por status.
- EC-4: Componente con opt-out que igual quiere feedback → lo da inline (comportamiento actual), sin toast.

## Success Metrics

- Ningún GET/mutación de las vistas alcanzadas falla "en silencio": todo error es visible (toast y/o estado de error en la vista).
- Los listados alcanzados distinguen cargando/vacío/error.
- Sin mensajes duplicados en los flujos con manejo inline preexistente.

## Feature Dependencies

- Backend `ExceptionHandlingMiddleware` — provee `message`/`errorCode` que el toast mapea.
- `authInterceptor` — mantiene el manejo del 401 (no se toca su responsabilidad).
