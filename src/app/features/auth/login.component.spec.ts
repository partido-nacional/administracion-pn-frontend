import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, LoginResponse } from '../../core/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let cmp: LoginComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const ok: LoginResponse = { token: 't', usuario: 'admin', rol: 'Administrador' };

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('éxito: navega a /inicio y resetea loading', () => {
    authSpy.login.and.returnValue(of(ok));
    cmp.submit();
    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/inicio']);
    expect(cmp.loading()).toBeFalse();
    expect(cmp.error()).toBeNull();
  });

  // AC-4/5/6/7 + AC-3: cada status produce su mensaje y deja loading en false
  function errorCase(status: number, expected: string) {
    authSpy.login.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
    cmp.submit();
    expect(cmp.error()).toBe(expected);
    expect(cmp.loading()).toBeFalse();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }

  it('401 → "Usuario o clave inválidos"', () =>
    errorCase(401, 'Usuario o clave inválidos'));

  it('status 0 → mensaje de sin conexión', () =>
    errorCase(0, 'No hay conexión con el servidor. Verificá tu conexión e intentá de nuevo.'));

  it('status 500 → mensaje de error de servidor', () =>
    errorCase(500, 'Ocurrió un error en el servidor. Intentá de nuevo más tarde.'));

  it('otro status (404) → fallback genérico', () =>
    errorCase(404, 'No se pudo iniciar sesión. Intentá de nuevo.'));

  // AC-8: el error viejo se limpia al reintentar
  it('limpia el error previo al reintentar el submit', () => {
    authSpy.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    cmp.submit();
    expect(cmp.error()).toBe('Usuario o clave inválidos');

    authSpy.login.and.returnValue(of(ok));
    cmp.submit();
    expect(cmp.error()).toBeNull();
  });

  // AC-10: form precargado (admin/admin123) es válido → botón habilitado
  it('botón habilitado con el form válido', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBeFalse();
  });

  // AC-9: campos vacíos → form inválido → botón deshabilitado
  it('botón deshabilitado con campos vacíos', fakeAsync(() => {
    // Fixture fresco con los campos vacíos desde el arranque: los controles se
    // registran ya inválidos (required), evitando la transición válido→vacío.
    const f = TestBed.createComponent(LoginComponent);
    f.componentInstance.usuario = '';
    f.componentInstance.clave = '';
    f.detectChanges();  // registra los NgModel con valores vacíos
    tick();             // drena el registro async del NgForm
    f.detectChanges();  // re-evalúa [disabled] con f.invalid = true
    const btn: HTMLButtonElement = f.nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
  }));

  // AC-2: spinner visual visible solo mientras loading está activo
  it('muestra el spinner mientras loading está activo', () => {
    expect(fixture.nativeElement.querySelector('.spinner')).toBeNull();
    cmp.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.spinner')).not.toBeNull();
    cmp.loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.spinner')).toBeNull();
  });
});
