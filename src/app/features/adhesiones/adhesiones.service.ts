import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FichaAdhesionDetalle } from '../agenda/contactos.service';
import { GridQuery, PagedResult } from '../../core/models/paged';
import { buildPagedParams } from '../../core/services/paged';

export interface SincronizacionResult {
  nuevas: number;
  duplicadasIgnoradas: number;
  desde: string;
  ultimaSincronizacion: string | null;
}

export interface AdhesionWebDto {
  id: number; nombre: string; apellido: string; cedula?: string; credCivica?: string;
  email?: string; telefono?: string; celular?: string; departamento?: string;
  fechaNacimiento?: string; fechaSistema?: string; sistContrib?: string;
  importe?: number; observaciones?: string; estado: string;
}

export interface AdhesionLocalDto {
  id: number; idContacto: number; nombre: string; apellido: string; cedula?: string;
  sector?: string; sistContrib?: string; aporte?: number;
  fechaAlta?: string; fechaSalida?: string;
  aporteConfirmado: boolean | null; art46: boolean;
  titularResp?: string; observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class AdhesionesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/adhesiones`;

  getLocal(id: number) { return this.http.get<FichaAdhesionDetalle>(`${this.base}/locales/${id}`); }
  updateLocal(f: FichaAdhesionDetalle) { return this.http.put<void>(`${this.base}/locales/${f.id}`, f); }
  createLocal(f: Partial<FichaAdhesionDetalle>) { return this.http.post<FichaAdhesionDetalle>(`${this.base}/locales`, f); }

  sincronizarWeb() { return this.http.post<SincronizacionResult>(`${this.base}/web/sincronizar`, {}); }

  web(query: GridQuery): Observable<PagedResult<AdhesionWebDto>> {
    return this.http.get<PagedResult<AdhesionWebDto>>(`${this.base}/web`, { params: buildPagedParams(query) });
  }
  locales(query: GridQuery): Observable<PagedResult<AdhesionLocalDto>> {
    return this.http.get<PagedResult<AdhesionLocalDto>>(`${this.base}/locales`, { params: buildPagedParams(query) });
  }
}
