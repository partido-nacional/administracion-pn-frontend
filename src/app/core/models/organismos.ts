/**
 * Modelos del dominio Organismos.
 * Contrato espejo del backend (ver docs/INTEGRACION-FRONTEND.md §7.10 en administracion-pn-backend).
 * Los GET devuelven la entidad cruda (Dto); los POST/PUT reciben el Input (sin id).
 */

/** Ámbito de un organismo (tabla unificada, feature 006). */
export type Ambito = 'Estatal' | 'Partidario';

/** Organismo unificado tal cual lo devuelve GET /organismos (incluye ámbito). */
export interface OrganismoDto {
  id: number;
  ambito: Ambito;
  nombre: string;
  nombreCompania?: string | null;
  tipoOrganizacionId: number;
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

/** Payload de ALTA de un Organismo (POST /organismos): el ámbito va en el body. */
export interface OrganismoInput {
  ambito: Ambito;
  nombre: string;
  nombreCompania?: string | null;
  tipoOrganizacionId: number;
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

/** Payload de EDICIÓN (PUT /organismos/{id}): sin ámbito (inmutable tras el alta). */
export type OrganismoUpdateInput = Omit<OrganismoInput, 'ambito'>;

/** Tipo de organización (ex TipoOrganismo) para poblar el select del form. */
export interface TipoOrganizacionDto {
  id: number;
  nombre: string;
}

/**
 * Integrante de un organismo (solo lectura), tal cual lo devuelve
 * GET /organismos/{id}/integrantes.
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

/** Fila de la grilla de Referencias Partidarias (joineada; solo lectura). `periodo` sin fuente aún. */
export interface ReferenteResumenDto {
  nombre: string;
  cargo: string | null;
  organismo: string | null;
  periodo: string | null;
}

/** Referencia partidaria de un organismo puntual (solo lectura, feature 028). */
export interface ReferenciaOrganismo {
  id: number;
  contactoId: number;
  nombres: string;
  rol?: string;
  periodo?: string;
  fechaDesignacion?: string;
  fechaCese?: string;
  art44: boolean;
  notas?: string;
}

/** Info de organización tal cual la devuelve el backend (FK única organismoId). */
export interface InfoOrganizacionDto {
  id: number;
  tipoOrganizacionId?: number | null;
  organismoId?: number | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  observaciones?: string | null;
}

/** Payload de alta/edición de InfoOrganización. */
export interface InfoOrganizacionInput {
  tipoOrganizacionId?: number | null;
  organismoId?: number | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  observaciones?: string | null;
}
