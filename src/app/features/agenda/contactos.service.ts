import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

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
  telefono2?: string;
  celular?: string;
  celular2?: string;
  email?: string;
  departamento?: string;
  departamentoCredencial?: string;
  localidad?: string;
  direccion?: string;
  situacion?: string;
  ocupacion?: string;
  empresa?: string;
  organismo?: string;
  cargoLaboral?: string;
  telefonoTrabajo?: string;
  telefonoTrabajo2?: string;
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
  partidoSector?: string;
  posicionOrganismo?: string;
  orden?: number;
  orden2?: number;
  cargo?: string;
  condicion?: string;
  nota?: string;
  fechaFin?: string;
  fechaDesignacion?: string;
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

@Injectable({ providedIn: 'root' })
export class ContactosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/contactos`;
  list(q?: string): Observable<Contacto[]> { return this.http.get<Contacto[]>(this.base, { params: q ? { q } : {} }); }
  get(id: number) { return this.http.get<Contacto>(`${this.base}/${id}`); }
  create(c: Partial<Contacto>) { return this.http.post<Contacto>(this.base, c); }
  update(c: Contacto) { return this.http.put<void>(`${this.base}/${c.id}`, c); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
  fichasAdhesion(id: number) { return this.http.get<FichaAdhesion[]>(`${this.base}/${id}/fichas-adhesion`); }
  integrantesOrganismo(id: number) { return this.http.get<IntegranteOrganismo[]>(`${this.base}/${id}/integrantes-organismo`); }
  eliminarIntegranteOrganismo(id: number) { return this.http.delete<void>(`${environment.apiUrl}/integrantes-organismo/${id}`); }
  duplicados() { return this.http.get<DuplicadoPar[]>(`${this.base}/duplicados`); }
}

export interface DuplicadoPar {
  a: Contacto;
  b: Contacto;
  matches: string[];
}
