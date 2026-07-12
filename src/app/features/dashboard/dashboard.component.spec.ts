import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

/**
 * Edición de eventos del calendario (feature 012). Se prueba el prellenado del form
 * al abrir "Editar" y que guardarEdicion haga el PUT correcto y muestre el mensaje de
 * error del backend.
 */
describe('DashboardComponent — editar evento', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let cmp: DashboardComponent;
  let http: HttpTestingController;

  const evento = {
    id: 5, titulo: 'Reunión', fechaInicio: '2026-03-10T18:30:00',
    fechaFin: undefined, descripcion: 'notas', tipo: 'Reunion',
    creadorNombre: 'admin', esPublico: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    cmp = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    // El constructor dispara dos GET iniciales (resumen + eventos); los resolvemos.
    http.expectOne(r => r.url.includes('/dashboard/resumen')).flush({});
    http.expectOne(r => r.url.includes('/calendario/eventos')).flush([]);
  });

  afterEach(() => http.verify());

  it('abrirEditar prellena el form y entra en modo editar', () => {
    cmp.abrirEditar(evento as any);
    expect(cmp.modal()).toBe('editar');
    expect(cmp.editId()).toBe(5);
    expect(cmp.form.titulo).toBe('Reunión');
    expect(cmp.form.fecha).toBe('2026-03-10');
    expect(cmp.form.hora).toBe('18:30');
    expect(cmp.form.tipo).toBe('Reunion');
    expect(cmp.form.descripcion).toBe('notas');
    expect(cmp.form.esPublico).toBeFalse();
  });

  it('la tarjeta de contactos enruta a /agenda; las restringidas se ocultan sin rol', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a.stat-card[href="/agenda"]')).toBeTruthy();
    // sin sesión/rol, adhesiones (Hacienda/IT) y ventas (Secretaria/Hacienda/IT) no se muestran
    expect(el.querySelector('a.stat-card[href="/adhesiones"]')).toBeNull();
    expect(el.querySelector('a.stat-card[href="/productos"]')).toBeNull();
  });

  it('puedeVer respeta la matriz de roles', () => {
    spyOn(cmp['auth'], 'session').and.returnValue({ rol: 'IT' } as any);
    expect(cmp.puedeVer(['Hacienda', 'IT'])).toBeTrue();
    expect(cmp.puedeVer(['Secretaria'])).toBeFalse();
  });

  it('guardarEdicion hace PUT al evento con el body correcto y cierra el modal', () => {
    cmp.abrirEditar(evento as any);
    cmp.form.titulo = 'Reunión editada';
    cmp.guardarEdicion();

    const req = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/calendario/eventos/5'));
    expect(req.request.body.titulo).toBe('Reunión editada');
    expect(req.request.body.fechaInicio).toBe('2026-03-10T18:30:00');
    req.flush({});
    // Tras guardar recarga los eventos.
    http.expectOne(r => r.url.includes('/calendario/eventos')).flush([]);

    expect(cmp.modal()).toBeNull();
    expect(cmp.busy()).toBeFalse();
  });

  it('guardarEdicion muestra el mensaje de error del backend', () => {
    cmp.abrirEditar(evento as any);
    cmp.guardarEdicion();

    const req = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/calendario/eventos/5'));
    req.flush({ message: 'El título es obligatorio.' }, { status: 400, statusText: 'Bad Request' });

    expect(cmp.modalError()).toBe('El título es obligatorio.');
    expect(cmp.busy()).toBeFalse();
    expect(cmp.modal()).toBe('editar'); // sigue abierto para corregir
  });

  it('guardarEdicion valida el título en el cliente sin llamar al backend', () => {
    cmp.abrirEditar(evento as any);
    cmp.form.titulo = '   ';
    cmp.guardarEdicion();

    http.expectNone(r => r.method === 'PUT');
    expect(cmp.modalError()).toBe('El título es obligatorio.');
  });
});
