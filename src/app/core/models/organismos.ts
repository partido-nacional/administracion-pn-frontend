/**
 * Modelos del dominio Organismos.
 * Contrato espejo del backend (ver docs/INTEGRACION-FRONTEND.md §7.10 en administracion-pn-backend).
 * Los GET devuelven la entidad cruda (Dto); los POST/PUT reciben el Input (sin id).
 */

/**
 * Valores del filtro ?ambito de GET /organismos. Feature 032 (backend 035): ya no es un campo del
 * organismo; significa "tiene organización estatal / partidaria" (un organismo puede tener ambas).
 */
export type Ambito = 'Estatal' | 'Partidario';

/**
 * Organismo tal cual lo devuelve GET /organismos: uno por organismo del sistema viejo, con
 * clasificación estatal y/o partidaria opcionales (ej. AFE tiene ambas) e info de organización.
 */
export interface OrganismoDto {
  id: number;
  nombre: string;
  tipoOrganizacionId?: number | null;
  organizacionEstatalId?: number | null;
  organizacionEstatalNombre?: string | null;
  organizacionPartidariaId?: number | null;
  organizacionPartidariaNombre?: string | null;
  infoOrganizacionId?: number | null;
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

/** Payload de alta y edición de un Organismo (POST /organismos y PUT /organismos/{id}). */
export interface OrganismoInput {
  nombre: string;
  tipoOrganizacionId?: number | null;
  organizacionEstatalId?: number | null;
  organizacionPartidariaId?: number | null;
  infoOrganizacionId?: number | null;
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

/** Organización estatal o partidaria (catálogos de solo lectura del backend). */
export interface OrganizacionDto {
  id: number;
  tipoOrganizacionId: number;
  nombre: string;
}

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
  /** 0 en las calculadas (no hay referencia guardada). */
  id: number;
  /** 'Referencia' (guardada) | 'Integrante' (calculada desde un integrante finalizado sin referencia, feature 035). */
  origen?: 'Referencia' | 'Integrante';
  /** Id del integrante en las calculadas. */
  integranteId?: number | null;
  contactoId: number;
  nombres: string;
  rol?: string;
  periodo?: string;
  fechaDesignacion?: string;
  fechaCese?: string;
  art44: boolean;
  notas?: string;
}

/**
 * Info de organización (grupo compartido: varios organismos apuntan a la misma info).
 * `nombre` es el nombre propio de la info (feature 034 / backend 037), distinto del de sus organismos.
 * `cantidadOrganismos` respeta el filtro `nombreOrganismo` (backend 036).
 */
export interface InfoOrganizacionDto {
  id: number;
  nombre?: string | null;
  cantidadOrganismos: number;
  tipoOrganizacionId?: number | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  observaciones?: string | null;
}

/** Payload de alta/edición de InfoOrganización. */
export interface InfoOrganizacionInput {
  nombre?: string | null;
  tipoOrganizacionId?: number | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  observaciones?: string | null;
}

/** Payload de PUT /organismos/referencias/{id} (feature 028). */
export interface ReferenciaEditInput {
  contactoId: number;
  organismoId: number | null;
  rol?: string | null;
  periodo?: string | null;
  fechaDesignacion?: string | null;
  fechaCese?: string | null;
  art44: boolean;
  notas?: string | null;
}
