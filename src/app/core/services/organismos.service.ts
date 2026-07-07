import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Ambito, OrganismoTodosDto, OrganismoInput,
  TipoOrganismoDto, InfoOrganizacionDto, InfoOrganizacionInput,
  IntegranteOrg,
} from '../models/organismos';

/**
 * Service por dominio para Organismos (feature `habilitar-botones-edicion`).
 * Encapsula las llamadas HTTP tipadas; no transforma errores (los propaga para
 * que el componente/interceptor los maneje). Ver docs/INTEGRACION-FRONTEND.md §7.10.
 */
@Injectable({ providedIn: 'root' })
export class OrganismosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organismos`;

  /** Ruta del recurso según el ámbito: Estatal → estatales, Partidario → partidarios. */
  private ambitoPath(ambito: Ambito): string {
    return ambito === 'Estatal' ? 'estatales' : 'partidarios';
  }

  // ── Lecturas ──────────────────────────────────────────────
  getTodos(): Observable<OrganismoTodosDto[]> {
    return this.http.get<OrganismoTodosDto[]>(`${this.base}/todos`);
  }

  getInfo(): Observable<InfoOrganizacionDto[]> {
    return this.http.get<InfoOrganizacionDto[]>(`${this.base}/info`);
  }

  getTipos(): Observable<TipoOrganismoDto[]> {
    return this.http.get<TipoOrganismoDto[]>(`${this.base}/tipos`);
  }

  /** Integrantes de un organismo puntual, por ámbito + id (contrato por FK, no por nombre). */
  getIntegrantes(ambito: Ambito, id: number): Observable<IntegranteOrg[]> {
    return this.http.get<IntegranteOrg[]>(`${this.base}/${this.ambitoPath(ambito)}/${id}/integrantes`);
  }

  // ── Organismo: alta / edición (según ámbito) ──────────────
  createOrganismo(ambito: Ambito, input: OrganismoInput): Observable<OrganismoTodosDto> {
    return this.http.post<OrganismoTodosDto>(`${this.base}/${this.ambitoPath(ambito)}`, input);
  }

  updateOrganismo(ambito: Ambito, id: number, input: OrganismoInput): Observable<OrganismoTodosDto> {
    return this.http.put<OrganismoTodosDto>(`${this.base}/${this.ambitoPath(ambito)}/${id}`, input);
  }

  // ── InfoOrganización: alta / edición ──────────────────────
  createInfo(input: InfoOrganizacionInput): Observable<InfoOrganizacionDto> {
    return this.http.post<InfoOrganizacionDto>(`${this.base}/info`, input);
  }

  updateInfo(id: number, input: InfoOrganizacionInput): Observable<InfoOrganizacionDto> {
    return this.http.put<InfoOrganizacionDto>(`${this.base}/info/${id}`, input);
  }
}
