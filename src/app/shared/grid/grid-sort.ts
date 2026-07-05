import { WritableSignal } from '@angular/core';
import { SortOrder } from '../../core/models/paged';

/**
 * Lógica de ordenamiento por columna compartida por las grillas de agrupaciones
 * (y reutilizable por otras). Evita duplicar el mismo toggle/flecha en cada componente.
 */

/**
 * Alterna el orden al clickear una columna: si es la columna ya activa invierte
 * asc↔desc; si es otra, la activa en `asc`. Opera sobre las signals del componente.
 */
export function toggleSort(
  sort: WritableSignal<string | undefined>,
  order: WritableSignal<SortOrder>,
  field: string,
): void {
  if (sort() === field) order.set(order() === 'asc' ? 'desc' : 'asc');
  else { sort.set(field); order.set('asc'); }
}

/**
 * Flecha indicadora del orden para la columna `field`: `▲` (asc), `▼` (desc) o `''`
 * cuando esa columna no es la activa.
 */
export function sortArrow(sort: string | undefined, order: SortOrder, field: string): string {
  return sort !== field ? '' : (order === 'asc' ? '▲' : '▼');
}
