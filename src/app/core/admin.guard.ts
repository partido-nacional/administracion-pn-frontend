import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/** Restringe rutas administrativas (ej. gestión de Usuarios) al rol Administrador. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.session()?.rol === 'Administrador') return true;
  router.navigate(['/inicio']);
  return false;
};
