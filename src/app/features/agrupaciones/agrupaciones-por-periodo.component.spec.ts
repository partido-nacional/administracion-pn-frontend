import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AgrupacionesPorPeriodoComponent } from './agrupaciones-por-periodo.component';
import { ContactosService } from '../agenda/contactos.service';
import { environment } from '../../../environments/environment';

// Feature 023: alta/baja de integrantes en la vista Por Período.
describe('AgrupacionesPorPeriodoComponent — integrantes', () => {
  let fixture: ComponentFixture<AgrupacionesPorPeriodoComponent>;
  let cmp: AgrupacionesPorPeriodoComponent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const contactosSvc = jasmine.createSpyObj('ContactosService', ['listado']);
    contactosSvc.listado.and.returnValue(of({ items: [], total: 0, page: 1, pageSize: 8 } as any));
    TestBed.configureTestingModule({
      imports: [AgrupacionesPorPeriodoComponent],
      providers: [
        { provide: ContactosService, useValue: contactosSvc },
        provideHttpClient(), provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(AgrupacionesPorPeriodoComponent);
    cmp = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    // constructor: GET /opciones + GET /agrupaciones-periodos
    httpMock.match(() => true).forEach(req =>
      req.flush(req.request.url.includes('/opciones')
        ? { periodos: [], deptos: [] }
        : { items: [], total: 0, page: 1, pageSize: 20 }));
  });

  afterEach(() => httpMock.verify());

  function flushReload() {
    httpMock.expectOne(r => r.url.includes('/agrupaciones-periodos') && r.method === 'GET')
      .flush({ items: [], total: 0, page: 1, pageSize: 20 });
  }

  it('guardarIntegrante hace POST con el body correcto y refresca', () => {
    cmp.abrirAgregar(5);
    cmp.seleccionarContacto({ id: 42, nombre: 'Ana', apellido: 'Lopez' } as any);
    cmp.cargoNuevo = 'Vocal';
    cmp.fechaIngresoNuevo = '2026-07-12';
    cmp.guardarIntegrante(5);

    const post = httpMock.expectOne(`${environment.apiUrl}/agrupacion-integrantes`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ contactoId: 42, agrupacionPeriodoId: 5, cargo: 'Vocal', fechaIngreso: '2026-07-12' });
    post.flush({});
    flushReload();
    expect(cmp.agregando()).toBeFalse();
  });

  it('no guarda sin contacto seleccionado', () => {
    cmp.abrirAgregar(5);
    cmp.guardarIntegrante(5);
    httpMock.expectNone(`${environment.apiUrl}/agrupacion-integrantes`);
    expect(cmp.guardando()).toBeFalse();
  });

  it('quitarIntegrante confirma y hace DELETE + refresca', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    cmp.quitarIntegrante({ id: 9, contactoId: 1, nombre: 'Ana', apellido: 'Lopez' } as any);

    const del = httpMock.expectOne(`${environment.apiUrl}/agrupacion-integrantes/9`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
    flushReload();
  });

  it('quitarIntegrante cancelado no hace DELETE', () => {
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    cmp.quitarIntegrante({ id: 9, contactoId: 1, nombre: 'Ana', apellido: 'Lopez' } as any);
    httpMock.expectNone(`${environment.apiUrl}/agrupacion-integrantes/9`);
    expect(confirmSpy).toHaveBeenCalled();
  });
});
