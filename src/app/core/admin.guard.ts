import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/** Restringe rutas de administración (gestión de Usuarios/roles) al rol IT. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.session()?.rol === 'IT') return true;
  router.navigate(['/inicio']);
  return false;
};
