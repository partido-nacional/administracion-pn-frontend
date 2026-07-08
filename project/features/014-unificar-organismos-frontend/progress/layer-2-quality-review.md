# Layer 2 — Quality Review (feature 014 frontend)

Estado: ✅ COMPLETO. Build prod verde, 138 tests verdes.

## TASK-006 — Code Review
- **Sin residuos del contrato viejo**: grep de `tipoOrganismoId|organismoEstatalId|organismoPartidarioId|
  OrganismoTodosDto|TipoOrganismoDto|getTodos|ambitoPath|.localidad|telefono2|telefonoTrabajo2` en
  `src/app` (excepto `fichas-agrupacion`, otra entidad) → 0 resultados.
- **Naming consistente**: `tipoOrganizacionId`, `ambito`, `organismoId`, `ciudad` en models, service,
  componente, specs y agenda.
- **Hallazgo (resuelto)**: `OrganismoInput` quedó importado sin uso en `organismos.component.ts` (el alta
  usa un objeto inline `{ ambito, ...comun }`). Se quitó del import.
- **Estructura**: se respetó `core/models` + `core/services`; sin nuevos patrones.

## TASK-007 — Performance Review
- `getOrganismos()` hace **un solo** GET; el filtro de ámbito es **client-side** sobre la lista ya
  cargada (`organismosFiltrados` computed) → sin round-trips por filtro.
- Integrantes: carga **lazy** por organismo con **caché** por id (`if (!(key in integrantesPorOrg()))`);
  colapsar y re-expandir no dispara nueva petición (cubierto por test).
- Ids globales → `orgKey = String(o.id)` (antes `ambito:id`); sin cambios de complejidad.

## TASK-008 — Security Review
- `rolesGuard('Secretaria','Hacienda','IT')` en la ruta `/organismos` **intacto** (app.routes.ts).
- No se exponen datos nuevos sensibles; la grilla muestra los mismos campos.
- El manejo de error del modal (`extractError`) solo muestra `error.message`/`errorCode`/`message` del
  backend, sin volcar stack ni detalles internos.

## Corrección de contexto
El CLAUDE.md indicaba "no hay tests todavía (DEBT-001)", pero el repo **sí** tiene karma/jasmine y 138
tests. Los specs de organismos se adaptaron al contrato nuevo. Conviene actualizar el CLAUDE.md
(fuera del alcance de esta feature).
