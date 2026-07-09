# Functional Specification: paginacion-organismos-frontend

**Status**: Draft
**Created**: 2026-07-08

## Problem Statement

Espejo del backend **feature 007**: los endpoints de la sección Organismos ahora devuelven
`PagedResult<T>` (paginación server-side) en vez de listas planas. El frontend todavía consume listas
y filtra/pagina client-side, así que queda roto contra el backend nuevo. Esta feature adapta las
grillas de Organismos al patrón server-side ya usado en el resto del front (`GridQuery`,
`buildPagedParams`, `<app-paginator>`, feature 002).

## Objectives

- [ ] Consumir `PagedResult<T>` en las grillas de Organismos vía el service (con `GridQuery`).
- [ ] Paginar con `<app-paginator>` (page/pageSize) las 3 tabs: Todos, Info, Referencias.
- [ ] Pasar los filtros por columna a query params server-side (hoy son client-side).
- [ ] Ordenar server-side por las columnas soportadas (whitelist del backend).
- [ ] Integrantes inline: consumir `PagedResult` (desempaquetar `.items`).

## Out of Scope

- Cambios de backend (feature 007 ya en develop).
- Paginador dentro de la sublista inline de integrantes (se trae una página grande; ver decisión).
- Tabs/vistas nuevas.

## User Stories

### US-1: Grilla "Todos los Organismos" paginada server-side
**As a** usuario
**I want to** navegar los organismos por página, con orden y filtros aplicados en el server
**So that** la grilla no trae todo de una y escala

#### Acceptance Criteria
- AC-1: La grilla carga desde `GET /organismos` con `page/pageSize` y muestra `<app-paginator>` con el `total` del backend.
- AC-2: Los filtros de columna (ámbito, nombre, departamento, art44) se mandan como query params y recargan la página (reset a page 1).
- AC-3: El orden por columna soportada se hace server-side (sort/order); columnas no soportadas no rompen.
- AC-4: Cambiar page o pageSize recarga desde el server.

### US-2: Tabs Info y Referencias paginadas
#### Acceptance Criteria
- AC-5: La tab Info carga `GET /organismos/info` paginado con su paginator; filtros dirección/email server-side.
- AC-6: La tab Referencias carga `GET /organismos/referencias` paginado (vía service, no http directo); filtros nombre/cargo server-side.

### US-3: Integrantes inline sobre PagedResult
#### Acceptance Criteria
- AC-7: Al desplegar un organismo, la sublista de integrantes lee `PagedResult.items` del endpoint `/{id}/integrantes`.
- AC-8: Sin integrantes → mismo mensaje de vacío; error → mismo manejo con reintento; caché por organismo se mantiene.

### US-4: Export CSV coherente
#### Acceptance Criteria
- AC-9: El export CSV de cada tab usa `all=true` (dataset completo filtrado/ordenado) o la página actual — decisión documentada; sin romper.

## Business Rules

- BR-1: Al cambiar filtros o pageSize, se resetea a `page = 1`.
- BR-2: El `GridQuery` de cada tab es independiente (Todos / Info / Referencias).

## Edge Cases

- EC-1: Página vacía (total 0) → paginator muestra "Sin resultados"; grilla vacía.
- EC-2: Filtro sin coincidencias → total 0, page 1.

## Success Metrics

- Las grillas de Organismos funcionan paginadas contra el backend 007; `ng build` + tests verdes.

## Feature Dependencies

- Backend feature 007 (paginacion-organismos) — en `develop`.
- Infra de paginación del front (feature 002): `GridQuery`, `buildPagedParams`, `PagedResult`, `<app-paginator>`.
