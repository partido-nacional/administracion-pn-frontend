# Technical Specification: paginacion-organismos-frontend

**Status**: Draft
**Created**: 2026-07-08

## Architecture Overview

Adaptar la capa de service + el componente Organismos al patrón server-side existente
(`GridQuery` → `buildPagedParams` → `PagedResult<T>` → `<app-paginator>`). Se reutiliza el mismo
idiom que ya usan las otras grillas del proyecto (p.ej. agenda-listado). Sin nuevos patrones.

## API Contract (backend feature 007, en develop)

Todas las grillas aceptan `?page&pageSize&sort&order&all` + filtros y devuelven `PagedResult<T>`:
`{ items, total, page, pageSize }`.

| Grilla | Endpoint | Filtros (query) | Sort keys |
|--------|----------|-----------------|-----------|
| Todos | GET /organismos | ambito, nombre, departamento, art44 | id, nombre, ambito, departamento, ordenDpto |
| Info | GET /organismos/info | direccion, email | id |
| Referencias | GET /organismos/referencias | nombre, cargo | nombre, cargo |
| Integrantes inline | GET /organismos/{id}/integrantes | (apellidos, nombres) | apellidos, nombres |

## Cambios

### `core/services/organismos.service.ts`
- `getOrganismos(ambito?)` → `getOrganismos(query: GridQuery): Observable<PagedResult<OrganismoDto>>` (usa `buildPagedParams`; `ambito` pasa como filtro).
- `getInfo()` → `getInfo(query: GridQuery): Observable<PagedResult<InfoOrganizacionDto>>`.
- **Nuevo** `getReferencias(query: GridQuery): Observable<PagedResult<ReferenteResumenDto>>` (hoy el componente pega por http directo).
- `getIntegrantes(id)` → `getIntegrantes(id, query: GridQuery): Observable<PagedResult<IntegranteOrg>>`.
- Agregar modelo/re-export `ReferenteResumenDto` en `core/models/organismos.ts` (hoy es una interface local `RefPart` en el componente).

### `features/organismos/organismos.component.ts`
- Por cada tab (Todos/Info/Referencias): un `GridQuery` signal + `total` signal; método `loadX()` que llama al service y setea items+total; `onPage`/`onPageSize`/`onSort`/filtros → actualizan el `GridQuery` (reset page=1 en filtros/pageSize) y recargan.
- Reemplazar los `computed` de filtrado client-side (`organismosFiltrados`, `infoFiltrados`, `referenciasFiltradas`) por recarga server-side; los inputs de filtro pasan a `filters` del GridQuery. **Debounce ~300ms** al tipear antes de recargar (decisión UX), reseteando a page 1.
- Agregar `<app-paginator>` al pie de cada tab con `[total]/[page]/[pageSize]` + `(pageChange)/(pageSizeChange)`.
- Integrantes inline: `getIntegrantes(o.id, query)` → usar `.items`; mantener caché por id, loading y error. Traer una sola página grande (pageSize alto, sin paginator inline) — decisión de UX.
- Export CSV: usar `all: true` en el GridQuery para traer el dataset completo filtrado/ordenado antes de exportar.

### Modelos
- `core/models/paged.ts` ya provee `GridQuery`, `PagedResult`, `DEFAULT_PAGE_SIZE`, `PAGE_SIZE_OPTIONS`.
- `shared/components/paginator/paginator.component.ts` (`<app-paginator>`) se importa en el componente.

## Non-Functional Requirements

- **Verificación**: `ng build --configuration production` + `npm test --watch=false --browsers=ChromeHeadless`. Adaptar `organismos.service.spec.ts` y `organismos.component.spec.ts` (hoy esperan listas / firmas viejas).
- **Performance**: una request por cambio de página/filtro/orden; sin filtrado client-side de datasets completos.
- **Security**: sin cambios de auth; `rolesGuard` de la ruta intactos.

## Error Handling

| Code | Error | Description |
|------|-------|-------------|
| 4xx/5xx | - | Mensaje en la grilla (mismo manejo `extractError`); integrantes con reintento |
