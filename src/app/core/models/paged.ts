/**
 * Modelos compartidos para paginación + ordenamiento server-side.
 * Contrato espejo del backend: PagedResult<T> = { items, total, page, pageSize }.
 */

export type SortOrder = 'asc' | 'desc';

/** Envelope de respuesta paginada devuelto por los endpoints de grilla. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Estado de consulta de una grilla: paginación + orden + filtros. */
export interface GridQuery {
  page: number;
  pageSize: number;
  sort?: string;
  order?: SortOrder;
  /** Filtros por endpoint (ej. { q, departamento, modulo }). Valores vacíos se omiten. */
  filters?: Record<string, string | number | boolean | undefined | null>;
  /** Solo export: pide el dataset completo filtrado/ordenado (ignora paginación). */
  all?: boolean;
}

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
