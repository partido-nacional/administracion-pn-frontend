import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, LoginResponse } from '../../core/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let cmp: LoginComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let resetValue: string | null;

  const ok: LoginResponse = { token: 't', usuario: 'admin', rol: 'IT' };
  const msgOk = { message: 'listo' };

  beforeEach(() => {
    resetValue = null;
    authSpy = jasmine.createSpyObj('AuthService',
      ['login', 'register', 'verificarEmail', 'reenviarCodigo', 'recuperar', 'resetear']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const route = { snapshot: { queryParamMap: { get: (_: string) => resetValue } } };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Login ──────────────────────────────────────────────────
  it('login OK navega a /inicio', () => {
    authSpy.login.and.returnValue(of(ok));
    cmp.usuario = 'admin'; cmp.clave = 'x';
    cmp.doLogin();
    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/inicio']);
    expect(cmp.loading()).toBeFalse();
  });

  it('login 401 genérico → mensaje inválido', () => {
    authSpy.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    cmp.doLogin();
    expect(cmp.error()).toBe('Usuario o clave inválidos');
    expect(cmp.ofrecerVerificar()).toBeFalse();
  });

  it('login 401 por email sin verificar → ofrece verificar', () => {
    authSpy.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Verificá tu email antes de ingresar.' } })));
    cmp.doLogin();
    expect(cmp.ofrecerVerificar()).toBeTrue();
    expect(cmp.error()).toContain('Verificá');
  });

  it('sin credenciales demo precargadas', () => {
    expect(cmp.usuario).toBe('');
    expect(cmp.clave).toBe('');
    expect(fixture.nativeElement.innerHTML).not.toContain('admin123');
  });

  // ── Registro + verificación ───────────────────────────────
  it('registro OK pasa al modo verificar', () => {
    authSpy.register.and.returnValue(of(msgOk));
    cmp.ir('registro'); cmp.usuario = 'nuevo'; cmp.email = 'n@x.com'; cmp.clave = 'clave123';
    cmp.doRegistro();
    expect(authSpy.register).toHaveBeenCalledWith('nuevo', 'clave123', 'n@x.com');
    expect(cmp.modo()).toBe('verificar');
  });

  it('verificar OK vuelve al login con mensaje', () => {
    authSpy.verificarEmail.and.returnValue(of(msgOk));
    cmp.ir('verificar'); cmp.usuario = 'nuevo'; cmp.codigo = '123456';
    cmp.doVerificar();
    expect(authSpy.verificarEmail).toHaveBeenCalledWith('nuevo', '123456');
    expect(cmp.modo()).toBe('login');
    expect(cmp.mensaje()).toBe('listo');
  });

  // ── Recuperación / reseteo ────────────────────────────────
  it('recuperar muestra mensaje neutro', () => {
    authSpy.recuperar.and.returnValue(of({ message: 'Si el email existe, te enviamos un enlace.' }));
    cmp.ir('recuperar'); cmp.email = 'a@b.com';
    cmp.doRecuperar();
    expect(authSpy.recuperar).toHaveBeenCalledWith('a@b.com');
    expect(cmp.mensaje()).toContain('enlace');
  });

  it('?reset=<token> abre el modo resetear con el token', () => {
    resetValue = 'tok-123';
    const f = TestBed.createComponent(LoginComponent);
    expect(f.componentInstance.modo()).toBe('resetear');
    expect(f.componentInstance.token).toBe('tok-123');
  });

  it('resetear OK vuelve al login', () => {
    authSpy.resetear.and.returnValue(of(msgOk));
    cmp.token = 'tok'; cmp.nuevaClave = 'nueva123'; cmp.modo.set('resetear');
    cmp.doResetear();
    expect(authSpy.resetear).toHaveBeenCalledWith('tok', 'nueva123');
    expect(cmp.modo()).toBe('login');
  });
});
