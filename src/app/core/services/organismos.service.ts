import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Ambito, OrganismoDto, OrganismoInput, OrganismoUpdateInput,
  TipoOrganizacionDto, InfoOrganizacionDto, InfoOrganizacionInput,
  IntegranteOrg,
} from '../models/organismos';

/**
 * Service por dominio para Organismos. Contrato unificado (backend feature 006):
 * recurso único /organismos con ámbito. Encapsula las llamadas HTTP tipadas; no
 * transforma errores (los propaga para que el componente/interceptor los maneje).
 */
@Injectable({ providedIn: 'root' })
export class OrganismosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organismos`;

  // ── Lecturas ──────────────────────────────────────────────
  /** Lista organismos; filtro opcional por ámbito (sin ámbito = todos). */
  getOrganismos(ambito?: Ambito): Observable<OrganismoDto[]> {
    const params = ambito ? new HttpParams().set('ambito', ambito) : undefined;
    return this.http.get<OrganismoDto[]>(this.base, { params });
  }

  getInfo(): Observable<InfoOrganizacionDto[]> {
    return this.http.get<InfoOrganizacionDto[]>(`${this.base}/info`);
  }

  getTipos(): Observable<TipoOrganizacionDto[]> {
    return this.http.get<TipoOrganizacionDto[]>(`${this.base}/tipos`);
  }

  /** Integrantes de un organismo puntual, por id (contrato por FK unificada). */
  getIntegrantes(id: number): Observable<IntegranteOrg[]> {
    return this.http.get<IntegranteOrg[]>(`${this.base}/${id}/integrantes`);
  }

  // ── Organismo: alta / edición ─────────────────────────────
  createOrganismo(input: OrganismoInput): Observable<OrganismoDto> {
    return this.http.post<OrganismoDto>(this.base, input);
  }

  updateOrganismo(id: number, input: OrganismoUpdateInput): Observable<OrganismoDto> {
    return this.http.put<OrganismoDto>(`${this.base}/${id}`, input);
  }

  // ── InfoOrganización: alta / edición ──────────────────────
  createInfo(input: InfoOrganizacionInput): Observable<InfoOrganizacionDto> {
    return this.http.post<InfoOrganizacionDto>(`${this.base}/info`, input);
  }

  updateInfo(id: number, input: InfoOrganizacionInput): Observable<InfoOrganizacionDto> {
    return this.http.put<InfoOrganizacionDto>(`${this.base}/info/${id}`, input);
  }
}
