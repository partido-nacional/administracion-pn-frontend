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

export interface Parlamentario {
  cortesia: string; apellidos: string; nombre: string; direccion: string; domicilio: string;
  departamento: string; telMovil: string; mailPartido: string; posOrganismo: string;
  nombreOrganismo: string; credCivica: string; cedulaId: string; observaciones: string;
}

export interface IntPN {
  apellidos: string; nombres: string; telTrabajo1: string; telTrabajo2: string;
  telMovil: string; departamento: string; mailParticular: string; mailTrabajo: string;
}

export interface Joven {
  apellidos: string; nombres: string; celular: string; mail: string; posOrganismo: string;
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

  private paged<T>(path: string, query: GridQuery): Observable<PagedResult<T>> {
    return this.http.get<PagedResult<T>>(`${this.base}/${path}`, { params: buildPagedParams(query) });
  }

  parlamentarias(query: GridQuery) { return this.paged<Parlamentario>('parlamentarias', query); }
  intendenciasPn(query: GridQuery) { return this.paged<IntPN>('intendencias-pn', query); }
  jovenes(query: GridQuery)        { return this.paged<Joven>('jovenes', query); }
}
