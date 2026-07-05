# Feature 011 — Sort de grilla compartido (agrupaciones)

**Estado**: Completada · **Tipo**: production · **Fecha**: 2026-07-04

## Qué se hizo

Se eliminó la duplicación del toggle de ordenamiento por columna (invertir asc/desc +
flecha ▲/▼) que estaba copiado idéntico en 4 componentes de agrupaciones. Origen:
ítem 24 ("lógica de sort/filtro repetida entre tres componentes").

## Cambios

- **Nuevo** `src/app/shared/grid/grid-sort.ts` — `toggleSort(sort, order, field)` y
  `sortArrow(sort, order, field)` (funciones puras que operan sobre las signals del componente).
- Refactorizados para usar el helper:
  - `agrupaciones.component.ts` (`onSort`/`indicador`)
  - `agrupaciones-por-periodo.component.ts` (`onSort`/`indicador`)
  - `agrupaciones-pendientes.component.ts` (`sortBy`/`arrow`)
  - `fichas-agrupacion.component.ts` (`sortBy`/`arrow`)
- Cada componente conserva su nombre de método, su `page.set(1)` y su reload propio.

## Notas de alcance

- La nota decía "tres componentes"; se encontraron **cuatro** y se refactorizaron los cuatro.
- El filtro cliente (`padronFiltrado`) quedó fuera: sólo existe en un componente, no estaba duplicado.
- Refactor puro: sin cambios de template ni de comportamiento observable.

## Verificación

`ng build` OK · `ng test` (ChromeHeadless) → 109/109 (incluye `grid-sort.spec.ts`, 8 casos).

## Entrega

- Commit `4c7c701`.
- PR #57 → merge a `develop` (merge commit `f586e0e`).
