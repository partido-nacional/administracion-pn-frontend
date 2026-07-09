# Feature 015 — Paginación de Organismos (frontend)

Adapta las grillas de la sección Organismos a la paginación server-side del backend (feature 007),
usando el patrón del proyecto (`GridQuery` + `buildPagedParams` + `PagedResult` + `<app-paginator>`).

## Qué se construyó

- **Service** (`core/services/organismos.service.ts`): `getOrganismos(query)`, `getInfo(query)`,
  **`getReferencias(query)`** (nuevo; antes el componente pegaba por http directo) y
  `getIntegrantes(id, query)` reciben `GridQuery` y devuelven `PagedResult<T>`.
- **Modelos**: `ReferenteResumenDto` movido a `core/models/organismos.ts`.
- **OrganismosComponent**: por cada tab (Todos / Info / Referencias) hay `GridQuery` + `total` + paginator;
  filtros server-side con **debounce 300ms** (reset a page 1); **sort** por columna en "Todos"
  (`toggleSort`/`sortArrow`); **export CSV** con `all=true` (dataset completo). Integrantes inline
  consumen `PagedResult.items` (página grande, sin paginador propio) manteniendo caché/loading/error por id.

## Decisiones de UX

- Integrantes inline: una página grande (pageSize 100), sin paginador dentro del acordeón.
- Export CSV: `all=true` (todo el resultado filtrado/ordenado).
- Filtros por columna: debounce ~300ms al tipear.

## Verificación

- `ng build --configuration production` sin errores.
- **142 tests** verdes (specs de service + component adaptados a `PagedResult` + tests de
  paginación/filtro/export).

## Cross-repo

Espejo del backend **feature 007**. Se libera junto con el release del backend (breaking coordinado).
