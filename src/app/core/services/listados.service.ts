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

export interface Gobierno {
  cortesia: string; apellidos: string; nombre: string; telTrabajo: string; celular: string;
  mail: string; posOrganismo: string; nombreOrganismo: string; nombreCompania: string;
}

export interface ComDep {
  cortesia: string; apellidos: string; nombre: string; telefono: string; celular: string;
  mail: string; posOrganismo: string; departamento: string; dirOrganizacion: string; ciudadOrganizacion: string;
}

export interface IntNac {
  cortesia: string; apellidos: string; nombre: string; telTrabajo: string;
  posOrganismo: string; nombreOrganismo: string; departamento: string;
}

export interface Alcalde {
  cortesia: string; apellidos: string; nombres: string; telTrabajo: string; celular: string;
  mail: string; posOrganismo: string; nombreOrganismo: string; departamento: string;
}

export interface ConvL {
  idContacto: number; credCivica: string; apellidos: string; nombres: string; celular: string;
  mail: string; posOrganismo: string; nombreOrganismo: string; condicion: string; adherente: boolean;
}

export interface DirEntry {
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
  intendentesPn(query: GridQuery)  { return this.paged<IntPN>('intendentes-pn', query); }
  jovenes(query: GridQuery)        { return this.paged<Joven>('jovenes', query); }
  gobierno(query: GridQuery)       { return this.paged<Gobierno>('gobierno', query); }
  comDepartamentales(query: GridQuery) { return this.paged<ComDep>('com-departamentales', query); }
  intendenciasNac(query: GridQuery)    { return this.paged<IntNac>('intendencias-nacionalistas', query); }
  alcaldes(query: GridQuery)       { return this.paged<Alcalde>('alcaldes', query); }
  convencionales(query: GridQuery) { return this.paged<ConvL>('convencionales', query); }
  directorio(query: GridQuery)     { return this.paged<DirEntry>('directorio', query); }
}
