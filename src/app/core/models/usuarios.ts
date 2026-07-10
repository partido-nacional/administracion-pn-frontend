/**
 * Modelos del dominio Usuarios (gestión de cuentas del sistema).
 * Contrato espejo del backend (UsuariosController / AuthController, feature 010).
 */

/** Roles asignables por un admin. `Pendiente` (auto-registro) NO es asignable, solo se muestra. */
export type RolUsuario = 'Secretaria' | 'Comunicaciones' | 'Hacienda' | 'IT';

export const ROLES_USUARIO: RolUsuario[] = ['Secretaria', 'Comunicaciones', 'Hacienda', 'IT'];

/** Usuario tal cual lo devuelve el backend (nunca incluye la clave). */
export interface UsuarioDto {
  id: number;
  usuario: string;
  nombre: string;
  rol: RolUsuario | 'Pendiente';
  activo: boolean;
  email?: string | null;
  emailVerificado?: boolean;
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
