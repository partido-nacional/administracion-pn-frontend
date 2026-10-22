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
