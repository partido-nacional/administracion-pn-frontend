# Functional Specification: Sort de grilla compartido (agrupaciones)

**Status**: Draft
**Created**: 2026-07-04

## Problem Statement

> Ítem 24: en agrupaciones, lógica de sort/filtro repetida entre tres componentes.

El toggle de ordenamiento por columna (invertir asc/desc si es la misma columna,
o resetear a asc si es otra) y la flecha indicadora `▲/▼` están **copiados idénticos**
en varios componentes de agrupaciones. Al investigar se encontraron **cuatro** (no tres):
`agrupaciones`, `agrupaciones-pendientes`, `agrupaciones-por-periodo` y `fichas-agrupacion`.
La duplicación dificulta el mantenimiento (un cambio de criterio hay que replicarlo en 4 lugares).

## Objectives

- [ ] Extraer el toggle de sort y la flecha indicadora a un helper compartido reutilizable.
- [ ] Eliminar la duplicación en los 4 componentes.
- [ ] No cambiar el comportamiento observable (mismo orden, misma flecha, mismo reload).

## Out of Scope

- Cambiar el criterio de ordenamiento o el estilo de las flechas.
- Refactorizar el filtro cliente (`padronFiltrado`) — solo existe en un componente, no está duplicado.
- Backend / contrato de paginación (ya usa `GridQuery`/`buildPagedParams`).

## User Stories

### US-1: Mantener el sort en un solo lugar
**As a** desarrollador
**I want to** que la lógica de sort viva en un helper compartido
**So that** un cambio se haga una sola vez y no se repita entre componentes

#### Acceptance Criteria
- AC-1: Clic en una columna nueva ordena asc; clic repetido invierte a desc y vuelve.
- AC-2: La flecha muestra ▲ para asc, ▼ para desc, y vacío en columnas no activas.
- AC-3: El comportamiento (orden, flecha, reset de página, recarga) es idéntico al previo en los 4 componentes.
- AC-4: La lógica de toggle/flecha no queda duplicada: vive en un único helper.

## Business Rules

- BR-1: Cada componente conserva su propio reload (`cargar`/`load`/`loadTodas`) y el reset de página; solo se comparte el cálculo de sort/flecha.

## Edge Cases

- EC-1: `sort` sin definir (undefined) → ninguna columna muestra flecha.

## Success Metrics

- Duplicación del toggle de sort eliminada; `ng test`/`ng build` verdes; sin cambios visibles de UX.

## Feature Dependencies

- `core/models/paged.ts` (`SortOrder`) — reutilizado por el helper.
