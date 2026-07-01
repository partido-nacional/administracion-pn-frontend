import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GridQuery, PagedResult } from '../models/paged';
import { buildPagedParams } from './paged';

export interface Movimiento {
  fechaHora: string;
  usuario: string;
  accion: string;
  modulo: string;
  detalle: string;
}

/**
 * Service por dominio para los listados (feature `listados`).
 * Todas las llamadas devuelven PagedResult<T> (paginado/orden server-side).
 */
@Injectable({ providedIn: 'root' })
export class ListadosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/listados`;

  movimientos(query: GridQuery): Observable<PagedResult<Movimiento>> {
    return this.http.get<PagedResult<Movimiento>>(
      `${this.base}/movimientos`,
      { params: buildPagedParams(query) },
    );
  }
}
