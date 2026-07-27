import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { GridQuery, PagedResult } from '../../core/models/paged';
import { buildPagedParams } from '../../core/services/paged';

export interface Contacto {
  id: number;
  cortesia?: string;
  nombre: string;
  apellido: string;
  documento?: string;
  credencialCivica?: string;
  fechaNacimiento?: string;
  sexo?: string;
  estadoCivil?: string;
  telefono?: string;
  celular?: string;
  celular2?: string;
  email?: string;
  departamento?: string;
  departamentoCredencial?: string;
  ciudad?: string;
  direccion?: string;
  situacion?: string;
  ocupacion?: string;
  empresa?: string;
  organismo?: string;
  cargoLaboral?: string;
  telefonoTrabajo?: string;
  interno?: string;
  datosSecretaria?: string;
  departamentoLaboral?: string;
  mailTrabajo?: string;
  observaciones?: string;
  fechaCreado?: string;
  fechaUltimaModificacion?: string;
  activo: boolean;
  adherente?: boolean;
}

export interface IntegranteOrganismo {
  id: number;
  contactoId: number;
  nombres: string;
  nombreCompania?: string;
  nombreOrganismo?: string;
  partidoSectorId?: number;
  partidoSectorCodigo?: string;
  partidoSectorDescripcion?: string;
  posicionOrganismo?: string;
  orden?: number;
  condicion?: string;
  nota?: string;
  fechaFin?: string;
  fechaDesignacion?: string;
  activo?: boolean;
}

/** Body para crear una ficha de integrante de organismo (POST /organismos/integrantes). */
export interface IntegranteOrganismoInput {
  contactoId: number;
  organismoId?: number | null;
  partidoSectorId?: number | null;
  posicionOrganismo?: string | null;
  orden?: number | null;
  nota?: string | null;
  condicion?: string | null;
  fechaDesignacion?: string | null;
  activo: boolean;
}

export interface FichaAdhesion {
  id: number;
  sector?: string;
  sistContrib?: string;
  aporte?: number;
  fechaAdhesion?: string;
  fechaSalida?: string;
  aporteConfirmado: boolean | null;
  art46: boolean;
  titularResponsable?: string;
  observaciones?: string;
  aporteTodoAlPartido: boolean;
}

export interface FichaAdhesionDetalle {
  id: number;
  contactoId: number;
  contactoNombre?: string;
  sector?: string;
  sistContrib?: string;
  aporte?: number;
  fechaAdhesion?: string;
  fechaSalida?: string;
  aporteConfirmado: boolean | null;
  art46: boolean;
  titularResponsable?: string;
  observaciones?: string;
  aporteTodoAlPartido: boolean;
  aporteSecretariaAgrupacion?: string;
  aporteAgrupacion?: string;
  departamentoAgrupacion?: string;
  departamental: boolean;
  cedulaResponsable?: string;
  codigoAgrupacion?: string;
  telefonoAntel?: string;
  fechaVencimiento?: string;
  fechaUltimoPago?: string;
  carnetEntregado?: string;
}

/** Fila del listado de contactos (endpoint paginado /contactos). */
export interface ContactoListado {
  id: number; nombre: string; apellido: string; cedula?: string; credencial?: string;
  departamento?: string; celular?: string; celular2?: string; email?: string; adhesion?: string;
  adherente?: boolean; tieneFicha?: boolean; tieneIntegranteOrganismo?: boolean;
  tieneReferenciaPartidaria?: boolean;
}

/** Referencia partidaria de un contacto (solo lectura, feature 028). */
export interface ReferenciaPartidaria {
  id: number;
  contactoId: number;
  rol?: string;
  nombreOrganismo?: string;
  periodo?: string;
  fechaDesignacion?: string;
  fechaCese?: string;
  art44: boolean;
  notas?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/contactos`;
  /** Listado paginado + orden + filtros server-side. */
  listado(query: GridQuery): Observable<PagedResult<ContactoListado>> {
    return this.http.get<PagedResult<ContactoListado>>(this.base, { params: buildPagedParams(query) });
  }
  get(id: number) { return this.http.get<Contacto>(`${this.base}/${id}`); }
  create(c: Partial<Contacto>) { return this.http.post<Contacto>(this.base, c); }
  update(c: Contacto) { return this.http.put<void>(`${this.base}/${c.id}`, c); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
  fichasAdhesion(id: number) { return this.http.get<FichaAdhesion[]>(`${this.base}/${id}/fichas-adhesion`); }
  integrantesOrganismo(id: number) { return this.http.get<IntegranteOrganismo[]>(`${this.base}/${id}/integrantes-organismo`); }
  /** Referencias partidarias del contacto (solo lectura, feature 028). */
  referenciasPartidarias(id: number) { return this.http.get<ReferenciaPartidaria[]>(`${this.base}/${id}/referencias-partidarias`); }
  crearIntegranteOrganismo(input: IntegranteOrganismoInput) { return this.http.post<IntegranteOrganismo>(`${environment.apiUrl}/organismos/integrantes`, input); }
  /** "Finalizar" una ficha: envía la fecha (editable) que persiste el backend + Activo=false (feature 026). */
  finalizarIntegranteOrganismo(id: number, fechaFin: string) {
    return this.http.delete<void>(`${environment.apiUrl}/integrantes-organismo/${id}`, { params: { fechaFin } });
  }
  duplicados() { return this.http.get<DuplicadoPar[]>(`${this.base}/duplicados`); }
  /**
   * Fusiona dos contactos duplicados de forma transaccional en el backend:
   * reasigna los registros relacionados del eliminado al conservado, borra el
   * duplicado y actualiza el conservado con los valores fusionados.
   */
  merge(keepId: number, removeId: number, contacto: Contacto) {
    return this.http.post<void>(`${this.base}/${keepId}/merge`, { removeId, contacto });
  }
}

export interface DuplicadoPar {
  a: Contacto;
  b: Contacto;
  matches: string[];
}
