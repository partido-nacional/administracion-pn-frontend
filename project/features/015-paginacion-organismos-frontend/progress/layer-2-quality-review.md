# Layer 2 — Quality Review (feature 015 frontend)

Estado: ✅ COMPLETO. Build prod verde, 142 tests verdes. Sin cambios de código requeridos.

## TASK-004 — Code Review
- **Consistente con el patrón del proyecto**: `GridQuery` → `buildPagedParams` → `PagedResult` →
  `<app-paginator>` + `toggleSort`/`sortArrow` compartidos (igual que las grillas de agrupaciones/agenda).
- **Sin filtrado client-side residual**: se eliminaron los `computed` `organismosFiltrados`/`infoFiltrados`/
  `referenciasFiltradas` y el `orgKey`; el filtrado/orden es server-side.
- **Sin código muerto**: se quitaron el `interface RefPart` local y las inyecciones `HttpClient`/
  `environment` (Referencias ahora usa `svc.getReferencias`). `ReferenteResumenDto` vive en `core/models`.
- **GridQuery por tab independiente** (Todos/Info/Referencias), cada una con sus signals de page/pageSize/filtros.

## TASK-005 — Performance Review
- **Una request por interacción**: page/pageSize/sort recargan de inmediato; los filtros recargan con
  **debounce 300ms** (reset a page 1), evitando spamear el backend al tipear.
- **Sin traer datasets completos** para filtrar en memoria (lo hace el server).
- **Caché de integrantes inline** por id (`if (!(o.id in integrantesPorOrg()))`): colapsar y re-expandir
  no dispara nueva petición (cubierto por test). La sublista pide una página grande (pageSize 100).

## TASK-006 — Security Review
- **AuthZ**: `rolesGuard('Secretaria','Hacienda','IT')` en la ruta `/organismos` intacto (app.routes.ts).
- **Sin exposición nueva**: las grillas muestran los mismos campos; el paginador solo agrega total/página.
- **Manejo de error** (`extractError`) solo muestra `error.message`/`errorCode`/`message` del backend.
