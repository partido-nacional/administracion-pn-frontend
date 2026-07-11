/**
 * Modelos del dominio Convencionales.
 * Contrato espejo del backend (ver docs/INTEGRACION-FRONTEND.md §7.9 en administracion-pn-backend).
 * Los GET devuelven la entidad cruda (Dto); los POST/PUT reciben el Input (sin id).
 */

export type ConvencionalTipo = 'Nacional' | 'Departamental';
export type ListaTipo = 'ODN' | 'ODD';

/** Convencional tal cual lo devuelve el backend. */
export interface ConvencionalDto {
  id: number;
  contactoId: number;
  tipo: ConvencionalTipo | string;
  departamento?: string | null;
  condicion?: string | null;
  adherente: boolean;
  nombreOrganismo?: string | null;
  posicion?: string | null;
  fechaInicio: string;          // ISO 8601
  fechaFin?: string | null;
}

/** Payload de alta/edición de un Convencional. */
export interface ConvencionalInput {
  contactoId: number;
  tipo: ConvencionalTipo | string;
  departamento?: string | null;
  condicion?: string | null;
  adherente: boolean;
  nombreOrganismo?: string | null;
  posicion?: string | null;
  fechaInicio: string;          // ISO 8601
  fechaFin?: string | null;
}

/** Lista (ODN/ODD) tal cual la devuelve el backend. */
export interface ListaDto {
  id: number;
  nombre: string;
  tipo: ListaTipo | string;
  agrupacionId?: number | null;
  // Datos electorales ODN (feature 021)
  departamento?: string | null;
  sublema?: string | null;
  presidente?: string | null;
  sector?: string | null;
  votos?: number | null;
  codAgrup?: number | null;
}

/** Payload de alta/edición de una Lista. */
export interface ListaInput {
  nombre: string;
  tipo: ListaTipo | string;
  agrupacionId?: number | null;
  departamento?: string | null;
  sublema?: string | null;
  presidente?: string | null;
  sector?: string | null;
  votos?: number | null;
  codAgrup?: number | null;
}

/** Contadores del tablero de Convencionales. */
export interface ConvencionalStats {
  nacionales: number;
  departamentales: number;
  listasOdn: number;
}
