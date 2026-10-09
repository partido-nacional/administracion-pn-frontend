import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { UsuariosComponent } from './usuarios.component';
import { UsuariosService } from '../../core/services/usuarios.service';
import { UsuarioDto } from '../../core/models/usuarios';

describe('UsuariosComponent', () => {
  let fixture: ComponentFixture<UsuariosComponent>;
  let cmp: UsuariosComponent;
  let svc: jasmine.SpyObj<UsuariosService>;

  const user: UsuarioDto = { id: 1, usuario: 'jperez', nombre: 'Juan Pérez', rol: 'Hacienda', activo: true };

  beforeEach(() => {
    svc = jasmine.createSpyObj('UsuariosService', [
      'getUsuarios', 'crear', 'actualizar', 'cambiarEstado', 'resetearClave',
    ]);
    svc.getUsuarios.and.returnValue(of([user]));
    svc.crear.and.returnValue(of(user));
    svc.actualizar.and.returnValue(of(user));
    svc.cambiarEstado.and.returnValue(of({ ...user, activo: false }));
    svc.resetearClave.and.returnValue(of({ claveTemporal: 'Temp1234!' }));

    TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [
        { provide: UsuariosService, useValue: svc },
        provideHttpClient(), provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(UsuariosComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga el listado al iniciar', () => {
    expect(svc.getUsuarios).toHaveBeenCalled();
    expect(cmp.usuarios().length).toBe(1);
  });

  it('abrirNuevo() abre el modal vacío en modo alta', () => {
    cmp.abrirNuevo();
    expect(cmp.modalOpen()).toBeTrue();
    expect(cmp.modalMode()).toBe('nueva');
    expect(cmp.editId()).toBeNull();
    expect(cmp.form.usuario).toBe('');
  });

  it('guardar() en alta rechaza claves de menos de 8 caracteres sin llamar al backend', () => {
    cmp.abrirNuevo();
    cmp.form.usuario = 'nuevo'; cmp.form.nombre = 'Nuevo'; cmp.form.clave = '1234567';
    cmp.guardar();
    expect(svc.crear).not.toHaveBeenCalled();
    expect(cmp.modalError()).toContain('8 caracteres');
  });

  it('abrirEditar() precarga el form y el id, sin clave', () => {
    cmp.abrirEditar(user);
    expect(cmp.modalMode()).toBe('editar');
    expect(cmp.editId()).toBe(1);
    expect(cmp.form.usuario).toBe('jperez');
    expect(cmp.form.rol).toBe('Hacienda');
    expect(cmp.form.clave).toBe('');
  });

  it('guardar (alta) valida campos obligatorios y no llama al service', () => {
    cmp.abrirNuevo();
    cmp.guardar();
    expect(svc.crear).not.toHaveBeenCalled();
    expect(cmp.modalError()).toContain('usuario');
  });

  it('guardar (alta) llama crear con la clave inicial, cierra y refresca', () => {
    cmp.abrirNuevo();
    cmp.form.usuario = 'nuevo';
    cmp.form.nombre = 'Nuevo Usuario';
    cmp.form.clave = 'clave123';
    svc.getUsuarios.calls.reset();
    cmp.guardar();
    expect(svc.crear).toHaveBeenCalledWith(jasmine.objectContaining({ usuario: 'nuevo', clave: 'clave123' }));
    expect(cmp.modalOpen()).toBeFalse();
    expect(svc.getUsuarios).toHaveBeenCalled();
  });

  it('guardar (edición) llama actualizar con el id y sin clave', () => {
    cmp.abrirEditar(user);
    cmp.guardar();
    expect(svc.actualizar).toHaveBeenCalledWith(1, jasmine.objectContaining({ usuario: 'jperez' }));
    expect(svc.actualizar.calls.mostRecent().args[1].clave).toBeUndefined();
  });

  it('error del backend deja el modal abierto y muestra el mensaje', () => {
    svc.crear.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Usuario ya existe' } })));
    cmp.abrirNuevo();
    cmp.form.usuario = 'dup';
    cmp.form.nombre = 'Dup';
    cmp.form.clave = 'clave123';
    cmp.guardar();
    expect(cmp.modalOpen()).toBeTrue();
    expect(cmp.modalError()).toBe('Usuario ya existe');
    expect(cmp.modalBusy()).toBeFalse();
  });

  it('confirmarResetearClave() pide confirmación y muestra la clave generada', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    cmp.confirmarResetearClave(user);
    expect(svc.resetearClave).toHaveBeenCalledWith(1);
    expect(cmp.claveGenerada()).toBe('Temp1234!');
  });

  it('confirmarResetearClave() no llama al service si se cancela la confirmación', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    cmp.confirmarResetearClave(user);
    expect(svc.resetearClave).not.toHaveBeenCalled();
  });

  it('confirmarCambiarEstado() invierte el estado activo', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    cmp.confirmarCambiarEstado(user);
    expect(svc.cambiarEstado).toHaveBeenCalledWith(1, false);
  });

  it('filtrados() filtra por usuario, nombre o rol', () => {
    cmp.q = 'hacienda';
    expect(cmp.filtrados().length).toBe(1);
    cmp.q = 'inexistente';
    expect(cmp.filtrados().length).toBe(0);
  });
});
