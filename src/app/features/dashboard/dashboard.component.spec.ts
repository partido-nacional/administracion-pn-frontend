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

/** Botón Imprimir del calendario (feature 030). */
describe('DashboardComponent — imprimir calendario', () => {
  let cmp: DashboardComponent;
  let http: HttpTestingController;
  let ventana: { document: any; onload: any; focus: jasmine.Spy; print: jasmine.Spy };
  let html = '';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    cmp = TestBed.createComponent(DashboardComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.includes('/dashboard/resumen')).flush({});
    http.expectOne(r => r.url.includes('/calendario/eventos')).flush([]);
    html = '';
    ventana = {
      document: { open: () => {}, write: (h: string) => (html = h), close: () => {} },
      onload: null, focus: jasmine.createSpy('focus'), print: jasmine.createSpy('print'),
    };
  });

  afterEach(() => http.verify());

  it('Mes usa los eventos ya cargados del mes visible, sin pedir nada al backend (AC-2)', () => {
    spyOn(window, 'open').and.returnValue(ventana as any);
    cmp.anio.set(2026); cmp.mes.set(9);
    cmp.eventos.set([{ id: 1, titulo: 'Acto', fechaInicio: '2026-10-12T18:00:00Z', esPublico: true } as any]);

    cmp.imprimir('mes');

    expect(window.open).toHaveBeenCalled();
    expect(html).toContain('Calendario — Octubre 2026');
    expect(html).toContain('Acto');
  });

  it('Semana pide desde/hasta como hora de pared con Z y respeta Solo privados (AC-3, AC-6)', () => {
    spyOn(window, 'open').and.returnValue(ventana as any);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 8, 30, 10, 0)); // miércoles 30/09/2026
    cmp.soloPrivados.set(true);

    cmp.imprimir('semana');
    const req = http.expectOne(r => r.url.includes('/calendario/eventos'));
    jasmine.clock().uninstall();

    expect(req.request.url).toContain('desde=2026-09-28T00:00:00Z');
    expect(req.request.url).toContain('hasta=2026-10-05T00:00:00Z');
    expect(req.request.url).toContain('soloPrivados=true');
    req.flush([]);
    expect(html).toContain('Semana del 28 de septiembre al 4 de octubre de 2026');
    expect(html).toContain('Solo eventos privados');
  });

  it('avisa si el navegador bloquea la ventana (AC-8)', () => {
    spyOn(window, 'open').and.returnValue(null);
    const err = spyOn(cmp['toast'], 'error');
    cmp.imprimir('mes');
    expect(err).toHaveBeenCalled();
  });
});

describe('DashboardComponent — menú imprimir', () => {
  it('se cierra con un click fuera del menú', () => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const f = TestBed.createComponent(DashboardComponent);
    const http = TestBed.inject(HttpTestingController);
    http.match(() => true).forEach(r => r.flush(r.request.url.includes('resumen') ? {} : []));
    f.componentInstance.menuImprimir.set(true);
    f.detectChanges();
    document.body.click();
    expect(f.componentInstance.menuImprimir()).toBeFalse();
    http.verify();
  });
});
