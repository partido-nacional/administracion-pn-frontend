import { HttpParams } from '@angular/common/http';
import { GridQuery } from '../models/paged';

/**
 * Arma los HttpParams para un endpoint paginado a partir de un GridQuery.
 * - Omite filtros vacíos (undefined | null | '').
 * - Con `all: true` (export) no envía page/pageSize.
 */
export function buildPagedParams(q: GridQuery): HttpParams {
  let params = new HttpParams();

  if (q.all) {
    params = params.set('all', 'true');
  } else {
    params = params
      .set('page', String(q.page))
      .set('pageSize', String(q.pageSize));
  }

  if (q.sort) {
    params = params.set('sort', q.sort);
    params = params.set('order', q.order ?? 'asc');
  }

  if (q.filters) {
    for (const [key, value] of Object.entries(q.filters)) {
      if (value === undefined || value === null) continue;
      const s = String(value);
      if (s.trim() === '') continue;
      params = params.set(key, s);
    }
  }

  return params;
}
