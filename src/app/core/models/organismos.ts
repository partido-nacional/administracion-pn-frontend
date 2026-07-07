/**
 * Modelos del dominio Organismos.
 * Contrato espejo del backend (ver docs/INTEGRACION-FRONTEND.md §7.10 en administracion-pn-backend).
 * Los GET devuelven la entidad cruda (Dto); los POST/PUT reciben el Input (sin id).
 */

/** Ámbito de un organismo: determina la ruta estatales|partidarios. */
export type Ambito = 'Estatal' | 'Partidario';

/** Organismo (estatal o partidario) tal cual lo devuelve el backend. */
export interface OrganismoDto {
  id: number;
  nombre: string;
  nombreCompania?: string | null;
  tipoOrganismoId: number;
  categoria?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  departamento?: string | null;
  pais?: string | null;
  art44: boolean;
  ordenDpto: number;
  observaciones?: string | null;
}

/** Item de GET /organismos/todos: Organismo + ámbito (unión estatales+partidarios). */
export interface OrganismoTodosDto extends OrganismoDto {
  ambito: Ambito;
}

/** Payload de alta/edición de un Organismo (mismo shape estatal/partidario). */
export interface OrganismoInput {
  nombre: string;
  nombreCompania?: string | null;
  tipoOrganismoId: number;
  categoria?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  departamento?: string | null;
  pais?: string | null;
  art44: boolean;
  ordenDpto: number;
  observaciones?: string | null;
}

/** Tipo de organismo (para poblar el select del form). */
export interface TipoOrganismoDto {
  id: number;
  nombre: string;
}

/**
 * Integrante de un organismo (solo lectura), tal cual lo devuelve
 * GET /organismos/{estatales|partidarios}/{id}/integrantes.
 * `organismo` (nombre) se conserva por compatibilidad de shape con el backend,
 * aunque la grilla inline no lo muestra (es redundante en ese contexto).
 */
export interface IntegranteOrg {
  idContacto: number;
  credCivica: string;
  apellidos: string;
  nombres: string;
  celular: string;
  mail: string;
  posicion: string;
  organismo: string;
  departamento: string;
}

/** Info de organización tal cual la devuelve el backend. */
export interface InfoOrganizacionDto {
  id: number;
  tipoOrganismoId?: number | null;
  organismoEstatalId?: number | null;
  organismoPartidarioId?: number | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  observaciones?: string | null;
}

/** Payload de alta/edición de InfoOrganización. */
export interface InfoOrganizacionInput {
  tipoOrganismoId?: number | null;
  organismoEstatalId?: number | null;
  organismoPartidarioId?: number | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  observaciones?: string | null;
}
