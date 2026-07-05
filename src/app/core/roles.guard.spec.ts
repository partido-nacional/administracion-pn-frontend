import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { rolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { RolUsuario } from './models/usuarios';

describe('rolesGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  function setup(rol: RolUsuario | undefined) {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authStub = { session: () => (rol ? { token: 't', usuario: 'u', rol } : null) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: routerSpy },
      ],
    });
  }

  function run(...roles: RolUsuario[]): boolean {
    return TestBed.runInInjectionContext(
      () => rolesGuard(...roles)({} as any, {} as any) as boolean,
    );
  }

  it('permite el acceso si el rol está en la lista', () => {
    setup('Hacienda');
    expect(run('Hacienda', 'IT')).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('bloquea y redirige a /inicio si el rol no está permitido', () => {
    setup('Secretaria');
    expect(run('Hacienda', 'IT')).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/inicio']);
  });

  it('bloquea si no hay sesión (sin rol)', () => {
    setup(undefined);
    expect(run('Secretaria', 'Hacienda', 'IT')).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/inicio']);
  });

  it('Comunicaciones no accede a secciones administrativas', () => {
    setup('Comunicaciones');
    expect(run('Secretaria', 'Hacienda', 'IT')).toBeFalse();
  });
});
