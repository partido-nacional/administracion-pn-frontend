/**
 * Modelos del dominio Usuarios (gestión de cuentas del sistema).
 * Contrato de backend aún no implementado — ver DEBT cross-repo en `project/backlog.md`.
 */

export type RolUsuario = 'Administrador' | 'Hacienda' | 'Comunicaciones' | 'Administrativo' | 'IT';

export const ROLES_USUARIO: RolUsuario[] = ['Administrador', 'Hacienda', 'Comunicaciones', 'Administrativo', 'IT'];

/** Usuario tal cual lo devuelve el backend (nunca incluye la clave). */
export interface UsuarioDto {
  id: number;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
}

/** Payload de alta/edición de un Usuario. `clave` solo se envía en el alta. */
export interface UsuarioInput {
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  clave?: string;
}

/** Respuesta al resetear la clave: el backend genera una temporal y la devuelve una única vez. */
export interface ResetearClaveResponse {
  claveTemporal: string;
}
