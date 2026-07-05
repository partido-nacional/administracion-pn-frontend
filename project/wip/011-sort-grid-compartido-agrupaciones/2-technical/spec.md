# Technical Specification: Sort de grilla compartido (agrupaciones)

**Status**: Draft
**Created**: 2026-07-04

## Architecture Overview

Se extraen dos funciones puras a `src/app/shared/grid/grid-sort.ts`:

```ts
import { WritableSignal } from '@angular/core';
import { SortOrder } from '../../core/models/paged';

/** Toggle de orden al clickear una columna: misma columna invierte asc/desc, otra resetea a 'asc'. */
export function toggleSort(
  sort: WritableSignal<string | undefined>,
  order: WritableSignal<SortOrder>,
  field: string,
): void {
  if (sort() === field) order.set(order() === 'asc' ? 'desc' : 'asc');
  else { sort.set(field); order.set('asc'); }
}

/** Flecha indicadora del orden para la columna `field`. */
export function sortArrow(sort: string | undefined, order: SortOrder, field: string): string {
  return sort !== field ? '' : (order === 'asc' ? '▲' : '▼');
}
```

El helper opera sobre las `WritableSignal` existentes de cada componente (no las
reemplaza), de modo que las plantillas y los builders de `GridQuery` no cambian.

## Archivos afectados

- **Nuevo** `src/app/shared/grid/grid-sort.ts`
- **Nuevo** `src/app/shared/grid/grid-sort.spec.ts`
- `agrupaciones.component.ts` — `onSort`/`indicador` usan el helper.
- `agrupaciones-por-periodo.component.ts` — idem.
- `agrupaciones-pendientes.component.ts` — `sortBy`/`arrow` usan el helper.
- `fichas-agrupacion.component.ts` — idem.

## Integración por componente (ejemplos)

```ts
// agrupaciones / agrupaciones-por-periodo
onSort(field: string) { toggleSort(this.sort, this.order, field); this.page.set(1); this.loadTodas(); }
indicador(field: string) { return sortArrow(this.sort(), this.order(), field); }

// agrupaciones-pendientes / fichas-agrupacion
sortBy(field: string) { toggleSort(this.sort, this.order, field); this.page.set(1); this.cargar(); }
arrow(field: string) { return sortArrow(this.sort(), this.order(), field); }
```

Se preservan los nombres de método (`onSort`/`indicador`, `sortBy`/`arrow`), el
`page.set(1)` y el reload específico de cada componente. Cambio interno únicamente.

## Error Handling

> N/A — funciones puras, sin nuevos caminos de error.

## Non-Functional Requirements

- Performance: sin impacto.
- Testing (production): `grid-sort.spec.ts` cubre toggleSort (invertir / resetear) y
  sortArrow (▲/▼/'' incluyendo sort undefined). Verificación: `ng build` + `ng test`.
- Sin cambios de comportamiento observable (refactor puro).
