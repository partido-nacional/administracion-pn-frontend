import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { RolUsuario } from './models/usuarios';

/**
 * Factory de guard por rol: restringe una ruta a los roles indicados. Si el rol actual no
 * está permitido, redirige a /inicio. La autorización real la aplica el backend (feature 003);
 * este guard es de UX (evita entrar a una sección sin acceso).
 *
 * Uso: `canActivate: [rolesGuard('Secretaria', 'Hacienda', 'IT')]`
 */
export function rolesGuard(...roles: RolUsuario[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const rol = auth.session()?.rol as RolUsuario | undefined;
    if (rol && roles.includes(rol)) return true;
    router.navigate(['/inicio']);
    return false;
  };
}
