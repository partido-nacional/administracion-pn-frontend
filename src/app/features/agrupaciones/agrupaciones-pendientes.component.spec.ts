import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AgrupacionesPendientesComponent } from './agrupaciones-pendientes.component';
import { ToastService } from '../../core/services/toast.service';

/** Aprobar ya no exige Sector, fechas Ing./Rec./Entr., Antecedentes, Resolución ni Observaciones. */
describe('AgrupacionesPendientesComponent — campos obligatorios al aprobar', () => {
  let http: HttpTestingController;

  const opcionales = [
    'Sector', 'Fecha Ing. Comis.', 'Fecha Rec. Agrup.', 'Fecha Entr. C.E.',
    'Antecedentes', 'Resolución de la Comisión', 'Observaciones',
  ];

  const completo = {
    nombre: 'Lista X', codAgrup: '10', codDepto: '1', tipo: 'DEPARTAMENTAL', solic: 1,
    depto: 'Montevideo', clasificacion: 'Nueva', solicita: 'Reconocimiento', fechaSolicitud: '2026-10-01',
    domicilioLegal: 'Calle 1', ciudad: 'Montevideo', tel1: '24001234', email: 'lista@x.com',
    formaRepresentacion: 'Indistinta', representante: 'Ana', delegadoCE: 'Luis', formaActuacion: 'Conjunta',
    nroTramite: 'T-1', sublema1: 'S1',
  };

  function montar() {
    TestBed.configureTestingModule({
      imports: [AgrupacionesPendientesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) }],
    });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(AgrupacionesPendientesComponent);
    f.detectChanges();
    http.match(() => true).forEach(r => r.flush({ items: [], total: 0, page: 1, pageSize: 25 }));
    return f.componentInstance;
  }

  afterEach(() => http.verify());

  it('con los obligatorios cargados y los opcionales vacíos no falta nada', () => {
    const c = montar();
    c.modal.set('aprobar');
    c.form = { ...completo };
    expect(c.faltantes()).toEqual([]);
  });

  it('con el formulario vacío los opcionales no figuran como faltantes', () => {
    const c = montar();
    c.modal.set('aprobar');
    c.form = {};
    const faltan = c.faltantes();
    expect(faltan).toContain('N° Trámite');
    opcionales.forEach(o => expect(faltan).not.toContain(o));
  });
});

/** Una pendiente se edita en todo momento, integrantes incluidos, y se imprime con ellos. */
describe('AgrupacionesPendientesComponent — integrantes', () => {
  let http: HttpTestingController;

  const pendiente: any = {
    id: 7, nombre: 'Lista X', solic: 1, pendiente: true,
    integrantes: [
      { id: 1, contactoId: 10, nombre: 'Ana', apellido: 'Pérez', cedula: '12345672', cargo: 'Presidente', fechaIngreso: '01/10/2026', adherente: true },
      { id: 2, contactoId: 11, nombre: 'Luis', apellido: 'Gómez', cargo: 'Secretario General', adherente: false },
    ],
  };

  function montar() {
    TestBed.configureTestingModule({
      imports: [AgrupacionesPendientesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) }],
    });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(AgrupacionesPendientesComponent);
    f.detectChanges();
    http.match(() => true).forEach(r => r.flush({ items: [], total: 0, page: 1, pageSize: 25 }));
    return f;
  }

  afterEach(() => http.verify());

  it('editar carga los integrantes (con Adh.) y Guardar los manda con el resto', () => {
    const f = montar();
    const c = f.componentInstance;
    c.abrirModal(pendiente, 'editar');
    f.detectChanges();

    expect(c.integrantes().map(i => [i.contacto.id, i.cargo, i.fechaIngreso])).toEqual([
      [10, 'Presidente', '2026-10-01'],
      [11, 'Secretario General', ''],
    ]);
    const checks = Array.from((f.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('app-integrantes-editor input.adh'));
    expect(checks.map(x => x.checked)).toEqual([true, false]);

    c.integrantes.set(c.integrantes().filter(i => i.contacto.id !== 11));
    c.confirmar();
    const req = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/agrupaciones-pendientes/7'));
    expect(req.request.body.integrantes).toEqual([{ contactoId: 10, cargo: 'Presidente', fechaIngreso: '2026-10-01' }]);
    req.flush(null);
    http.match(() => true).forEach(r => r.flush({ items: [], total: 0, page: 1, pageSize: 25 }));
  });

  it('aprobar también manda los integrantes', () => {
    const c = montar().componentInstance;
    c.abrirModal(pendiente, 'aprobar');
    c.form = { ...c.form, codAgrup: '10', codDepto: '1', tipo: 'D', depto: 'Montevideo', clasificacion: 'Nueva',
      solicita: 'Reconocimiento', fechaSolicitud: '2026-10-01', domicilioLegal: 'C 1', ciudad: 'Mvd', tel1: '24001234',
      email: 'a@b.com', formaRepresentacion: 'Indistinta', representante: 'Ana', delegadoCE: 'Luis',
      formaActuacion: 'Conjunta', nroTramite: 'T-1', sublema1: 'S1' };
    c.confirmar();
    const req = http.expectOne(r => r.method === 'POST' && r.url.endsWith('/agrupaciones-pendientes/7/aprobar'));
    expect(req.request.body.integrantes.map((i: any) => i.contactoId)).toEqual([10, 11]);
    req.flush({});
    http.match(() => true).forEach(r => r.flush({ items: [], total: 0, page: 1, pageSize: 25 }));
  });

  it('si el backend no mandó integrantes, no los toca (no manda una lista vacía que los borraría)', () => {
    const f = montar();
    const c = f.componentInstance;
    const { integrantes, ...sinLista } = pendiente;
    c.abrirModal(sinLista, 'editar');
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelector('app-integrantes-editor')).toBeNull();
    c.confirmar();
    const req = http.expectOne(r => r.method === 'PUT');
    expect('integrantes' in req.request.body).toBeFalse();
    req.flush(null);
    http.match(() => true).forEach(r => r.flush({ items: [], total: 0, page: 1, pageSize: 25 }));
  });

  it('imprime con los integrantes y su adhesión', () => {
    const c = montar().componentInstance;
    let html = '';
    spyOn(window, 'open').and.returnValue({
      document: { open() {}, write(h: string) { html += h; }, close() {} }, focus() {}, print() {}, onload: null,
    } as any);
    c.imprimir(pendiente);
    expect(html).toContain('Integrantes de la Agrupación');
    expect(html).toContain('Pérez');
    expect(html).toContain('chk on');
    expect(html).toContain('Gloria Rodríguez');   // con firmas
  });
});
