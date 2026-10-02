import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GridQuery, PagedResult } from '../models/paged';
import { buildPagedParams } from './paged';
import {
  OrganismoDto, OrganismoInput, OrganizacionDto,
  TipoOrganizacionDto, InfoOrganizacionDto, InfoOrganizacionInput,
  ReferenteResumenDto, IntegranteOrg, ReferenciaOrganismo, ReferenciaEditInput } from '../models/organismos';

/**
 * Service por dominio para Organismos. Contrato unificado + paginado server-side
 * (backend features 006/007): las grillas devuelven PagedResult<T> y reciben GridQuery.
 * No transforma errores (los propaga para el componente/interceptor).
 */
@Injectable({ providedIn: 'root' })
export class OrganismosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organismos`;

  // ── Grillas paginadas ─────────────────────────────────────
  /**
   * Lista paginada. El filtro `ambito` (Estatal|Partidario) viaja dentro del GridQuery y significa
   * "tiene esa organización": un organismo con ambas aparece en los dos (backend 035).
   */
  getOrganismos(query: GridQuery): Observable<PagedResult<OrganismoDto>> {
    return this.http.get<PagedResult<OrganismoDto>>(this.base, { params: buildPagedParams(query) });
  }

  getInfo(query: GridQuery): Observable<PagedResult<InfoOrganizacionDto>> {
    return this.http.get<PagedResult<InfoOrganizacionDto>>(`${this.base}/info`, { params: buildPagedParams(query) });
  }

  getReferencias(query: GridQuery): Observable<PagedResult<ReferenteResumenDto>> {
    return this.http.get<PagedResult<ReferenteResumenDto>>(`${this.base}/referencias`, { params: buildPagedParams(query) });
  }
  /** Referencias partidarias de un organismo puntual. */
  getReferenciasDeOrganismo(id: number): Observable<ReferenciaOrganismo[]> {
    return this.http.get<ReferenciaOrganismo[]>(`${this.base}/${id}/referencias`);
  }

  /**
   * Edita una referencia partidaria (feature 028). El endpoint ya existia; lo que faltaba era
   * la UI — las dos vistas de referencias eran solo lectura.
   *
   * El PUT exige contactoId; si el organismo cambia, valida que sea partidario (tenga
   * organización partidaria, backend 035).
   */
  editarReferencia(id: number, input: ReferenciaEditInput): Observable<unknown> {
    return this.http.put(`${this.base}/referencias/${id}`, input);
  }

  /** Integrantes de un organismo puntual, por id (paginado; el inline pide una página grande). */
  getIntegrantes(id: number, query: GridQuery): Observable<PagedResult<IntegranteOrg>> {
    return this.http.get<PagedResult<IntegranteOrg>>(`${this.base}/${id}/integrantes`, { params: buildPagedParams(query) });
  }

  getTipos(): Observable<TipoOrganizacionDto[]> {
    return this.http.get<TipoOrganizacionDto[]>(`${this.base}/tipos`);
  }

  /** Catálogo de organizaciones estatales (solo lectura, backend 035). */
  getOrganizacionesEstatales(): Observable<OrganizacionDto[]> {
    return this.http.get<OrganizacionDto[]>(`${this.base}/organizaciones-estatales`);
  }

  /** Catálogo de organizaciones partidarias (solo lectura, backend 035). */
  getOrganizacionesPartidarias(): Observable<OrganizacionDto[]> {
    return this.http.get<OrganizacionDto[]>(`${this.base}/organizaciones-partidarias`);
  }

  // ── Organismo: alta / edición ─────────────────────────────
  createOrganismo(input: OrganismoInput): Observable<OrganismoDto> {
    return this.http.post<OrganismoDto>(this.base, input);
  }

  updateOrganismo(id: number, input: OrganismoInput): Observable<OrganismoDto> {
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
