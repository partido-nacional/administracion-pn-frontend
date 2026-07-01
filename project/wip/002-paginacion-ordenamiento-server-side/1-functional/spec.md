# Functional Specification: Paginación + Ordenamiento Server-Side

**Status**: Draft
**Created**: 2026-06-30

## Problem Statement

> Todas las grillas de la app hacen **GET-all**: el backend devuelve el dataset completo con
> `.ToListAsync()` sin paginar, y el front lo renderiza entero en el DOM, filtrando y
> ordenando client-side. La paginación visible en `listados` es **decorativa** (botones
> `1 2 3 ... 335` y textos "de 2,341 movimientos" hardcodeados en el HTML, sin handlers).
> Con volumen real esto hace la app lenta tanto por payload/query como por render.
>
> **Objetivo**: contrato uniforme de paginación + ordenamiento server-side (`page`,
> `pageSize`, `sort`, `order` + filtros) con envelope `{ items, total, page, pageSize }`,
> consumido por el front con controles de paginación reales, **preservando** los filtros y
> ordenamientos existentes y **sin romper** ninguna vista.

Relacionado: backlog **TODO-004** (paginación decorativa), **TODO-005** (contactos client-side),
**DEBT-006** (capa de services por dominio, donde vive el paginado tipado).

## Inventario (fuente de verdad del refactor)

**Grillas con DB real (EF Core, hoy sin paginar) — OBJETIVO de este refactor:**
- `contactos` (ya tiene `?q` y `?departamento`; falta page/pageSize/sort)
- `listados/movimientos` (auditoría), `listados/parlamentarias`, `listados/gobierno`,
  `listados/com-departamentales`, `listados/intendencias-nacionalistas`,
  `listados/intendencias-pn`, `listados/alcaldes`, `listados/jovenes`,
  `listados/convencionales`, `listados/directorio`
- `adhesiones/web`, `adhesiones/locales`
- `agrupaciones`, `agrupaciones-periodos`, `fichas-agrupacion`, `agrupaciones-pendientes`
- `productos`, `productos/movimientos`

**Stub en memoria (arrays hardcodeados, sin datos reales) — FUERA DE ALCANCE por ahora:**
- `agrupaciones/padron`, `convencionales/*` (nacionales, departamentales, listas, integrantes),
  `organismos/*` (info, integrantes, referencias), `ventas`, `donaciones`

**No aplican (detalle / agregados / no-grilla):** `/{id}`, `*/stats`, `contactos/duplicados`,
`dashboard/resumen`, `calendario/eventos`, `debitos/dashboard`.

## Objectives

- [ ] Contrato común de paginación/orden: query params `page`, `pageSize`, `sort`, `order` (+ filtros por endpoint) y envelope de respuesta `{ items, total, page, pageSize }`.
- [ ] Backend: cada endpoint de grilla con DB real aplica `Skip/Take` + `OrderBy` dinámico por whitelist en la query (no en memoria) y devuelve el total real.
- [ ] Frontend: grillas consumen paginado real; los controles de paginación pasan de decorativos a funcionales; contador "Mostrando X–Y de N" refleja el total del backend.
- [ ] Preservar filtros y ordenamientos actuales, mapeándolos 1:1 a query params server-side.
- [ ] Export a Excel: exporta el **dataset completo filtrado** (endpoint/consulta sin paginar con los filtros/orden aplicados), no solo la página visible.
- [ ] Rollout **piloto** (`movimientos` + `contactos`) validado antes de replicar al resto.
- [ ] Cero regresiones: comportamiento por defecto equivalente al actual en cada vista migrada.

## Out of Scope

- Endpoints stub en memoria (padrón, convencionales, organismos, ventas, donaciones) — quedan como deuda hasta tener datos reales.
- Migración completa a la capa de services de DEBT-006 (se hace lo mínimo para el paginado tipado; el resto sigue como deuda).
- Rediseño visual de las grillas más allá de volver funcionales los controles de paginación.
- Virtual scroll / infinite scroll (se opta por paginación clásica).
- Endpoints de detalle (`/{id}`), stats/agregados y dashboards.

## User Stories

### US-1: Navegar grillas grandes sin lentitud
**As a** usuario de administración
**I want to** ver las grillas con DB real paginadas de a página
**So that** la app cargue y responda rápido aunque haya miles de registros

#### Acceptance Criteria
- AC-1: Al abrir la grilla se carga solo la primera página (`pageSize` por defecto = 25), no todo el dataset.
- AC-2: Los controles `<`, números, `>` navegan páginas reales pidiendo datos al backend.
- AC-3: El contador "Mostrando X–Y de N" usa el `total` devuelto por el backend.
- AC-4: Hay un selector de tamaño de página con opciones 25 / 50 / 100 (default 25).

### US-2: Filtrar contra el servidor
**As a** usuario
**I want to** que los filtros apliquen sobre todo el dataset, no solo la página cargada
**So that** los resultados sean correctos y completos

#### Acceptance Criteria
- AC-1: Aplicar/cambiar un filtro reinicia a página 1 y pide al backend con los filtros como query params.
- AC-2: El input de texto aplica con debounce (no una request por tecla).
- AC-3: Los filtros que hoy existen en cada grilla se preservan (mismos criterios, ahora server-side).

### US-3: Ordenar contra el servidor
**As a** usuario
**I want to** ordenar por columna sobre el dataset completo
**So that** el orden sea correcto y no solo dentro de la página visible

#### Acceptance Criteria
- AC-1: Ordenar por una columna manda `sort=<campo>&order=asc|desc` al backend.
- AC-2: Solo se permiten ordenar campos de una whitelist por endpoint.
- AC-3: `sort` + `order` + filtros + `page` se combinan en una sola request coherente.

### US-4: Exportar a Excel el resultado completo
**As a** usuario
**I want to** que Exportar a Excel incluya todo el resultado filtrado, no solo la página visible
**So that** el archivo refleje el conjunto completo que estoy consultando

#### Acceptance Criteria
- AC-1: Exportar aplica los mismos filtros/orden activos pero sobre el dataset completo (sin paginar).
- AC-2: El export no depende de qué página esté viendo el usuario.

## Business Rules

- BR-1: Contrato uniforme en todos los endpoints migrados (mismos nombres de params y misma forma de respuesta `{ items, total, page, pageSize }`).
- BR-2: Defaults seguros: sin params, el backend aplica `page=1`, `pageSize=25`; `pageSize` se capea a un máximo (100).
- BR-3: `sort` acepta solo campos de una whitelist por endpoint; campo inválido → se ignora (fallback al orden por defecto del endpoint), sin 500.
- BR-4: El orden por defecto de cada endpoint se conserva (p. ej. movimientos por fecha desc) cuando no se especifica `sort`.

## Edge Cases

- EC-1: `page` mayor al total de páginas → items vacíos + `total` real (no error).
- EC-2: `pageSize` excesivo o inválido → capeado al máximo / default.
- EC-3: `sort` con campo fuera de whitelist → ignorar y usar orden por defecto.
- EC-4: Dataset vacío → estado vacío, contador "0–0 de 0".
- EC-5: Compatibilidad: llamadas sin params siguen funcionando (default acotado, no "todo").

## Success Metrics

- Carga inicial de grillas grandes reducida (payload de 1 página vs dataset completo).
- Sin regresiones funcionales en filtros/orden/export de las vistas migradas.

## Feature Dependencies

- Backend `administracion-pn-backend` (.NET 8, EF Core) accesible localmente.
- Filtros/orden existentes en el front (hoy client-side) a mapear a params server-side.
