import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Type } from '@angular/core';
import { of } from 'rxjs';
import { DEPARTAMENTOS, normDepto } from '../core/departamentos';
import { ContactosService } from './agenda/contactos.service';
import { ParlamentariasComponent } from './listados/parlamentarias.component';
import { JovenesComponent } from './listados/jovenes.component';
import { IntendentesPnComponent } from './listados/intendentes-pn.component';
import { OrganismosComponent } from './organismos/organismos.component';
import { AgrupacionesComponent } from './agrupaciones/agrupaciones.component';
import { AgrupacionesPendientesComponent } from './agrupaciones/agrupaciones-pendientes.component';
import { FichasAgrupacionComponent } from './agrupaciones/fichas-agrupacion.component';
import { AgrupacionesPorPeriodoComponent } from './agrupaciones/agrupaciones-por-periodo.component';
import { AdhesionesListadoComponent } from './adhesiones/adhesiones-listado.component';
import { ConvencionalesComponent } from './convencionales/convencionales.component';

/**
 * Feature 030 — US-2 (departamento en todas las grillas) y US-3 (Nombre/Código/ID en
 * agrupaciones). Monta cada grilla contra HttpTestingController y verifica las opciones del
 * dropdown y los query params que llegan al backend.
 */
describe('Filtros de grillas (feature 030)', () => {
  let http: HttpTestingController;
  const PAGED = { items: [], total: 0, page: 1, pageSize: 20 };

  /** Respuesta genérica según la forma que espera cada endpoint. */
  function responder(req: TestRequest) {
    const url = req.request.url;
    if (url.includes('/opciones')) return req.flush({ periodos: [], deptos: [] });
    if (url.includes('/stats')) return req.flush({});
    if (url.includes('/convencionales') || url.includes('/catalogos') || url.includes('/tipos')
        || url.includes('anuales-por-vencer')) return req.flush([]);
    return req.flush(PAGED);
  }
  const flushTodo = () => http.match(() => true).forEach(responder);

  function montar<T>(cmp: Type<T>): T {
    const contactos = jasmine.createSpyObj('ContactosService', ['listado']);
    contactos.listado.and.returnValue(of(PAGED));
    TestBed.configureTestingModule({
      imports: [cmp],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ContactosService, useValue: contactos }],
    });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(cmp);
    f.detectChanges();
    flushTodo();
    f.detectChanges();
    (montar as any).fixture = f;
    return f.componentInstance;
  }
  const el = (): HTMLElement => (montar as any).fixture.nativeElement;
  const opcionesDepto = (): string[] => {
    const sel = Array.from(el().querySelectorAll<HTMLSelectElement>('thead select.column-filter'))
      .find(s => Array.from(s.options).some(o => o.textContent?.trim() === 'Paysandú'))!;
    return Array.from(sel.options).map(o => o.textContent!.trim());
  };
  /** Último GET al endpoint (tras el debounce) y lo responde. */
  function ultimoGet(path: string) {
    const reqs = http.match(r => r.method === 'GET' && r.url.includes(path));
    expect(reqs.length).toBeGreaterThan(0);
    const last = reqs[reqs.length - 1];
    reqs.forEach(responder);
    return last.request.params;
  }

  // http solo existe si el test montó una grilla (el de normDepto no): sin esto el
  // afterEach rompe cuando el orden aleatorio de Jasmine lo corre primero.
  beforeEach(() => { http = undefined as unknown as HttpTestingController; });
  afterEach(() => { if (http) { flushTodo(); http.verify(); } });

  it('normDepto: trim, minúsculas, sin tildes, preserva ñ (BR-2)', () => {
    expect(normDepto('  PAYSANDÚ ')).toBe('paysandu');
    expect(normDepto('Río Negro')).toBe('rio negro');
    expect(normDepto('Ñandú')).toBe('ñandu');
    expect(normDepto(null)).toBe('');
  });

  // ---------- Listados ----------

  it('Parlamentarias ofrece los 19 departamentos (antes 6)', () => {
    montar(ParlamentariasComponent);
    expect(opcionesDepto()).toEqual(['Todos', ...DEPARTAMENTOS]);
  });

  it('Jóvenes muestra la columna Departamento y manda el filtro (AC-11)', fakeAsync(() => {
    const c = montar(JovenesComponent) as any;
    expect(Array.from(el().querySelectorAll('thead th')).some(th => th.textContent?.trim() === 'Departamento')).toBeTrue();
    c.fDepartamento = 'Rocha'; c.onFilter(); tick(300);
    expect(ultimoGet('/listados/jovenes').get('departamento')).toBe('Rocha');
  }));

  it('Intendentes PN tiene filtro de departamento (AC-12)', fakeAsync(() => {
    const c = montar(IntendentesPnComponent) as any;
    expect(opcionesDepto()).toEqual(['Todos', ...DEPARTAMENTOS]);
    c.fDepto = 'Flores'; c.onFilter(); tick(300);
    expect(ultimoGet('/listados/intendentes-pn').get('depto')).toBe('Flores');
  }));

  // ---------- Organismos / Por Período ----------

  it('Organismos usa la lista canónica + Nacional (EC-5)', () => {
    const c = montar(OrganismosComponent) as any;
    expect(c.departamentos).toEqual([...DEPARTAMENTOS, 'Nacional']);
  });

  it('Por Período: dropdown canónico y filtros Id / Id Agr. (AC-16)', fakeAsync(() => {
    const c = montar(AgrupacionesPorPeriodoComponent) as any;
    expect(opcionesDepto()).toEqual(['Todos', ...DEPARTAMENTOS]);
    c.fId.set('7'); c.fAgrId.set('12'); c.onFilter(); tick(300);
    const p = ultimoGet('/agrupaciones-periodos');
    expect(p.get('id')).toBe('7');
    expect(p.get('agrId')).toBe('12');
  }));

  // ---------- Agrupaciones ----------

  it('Todas: filtros ID / Código / Nombre / Depto y la grilla sigue visible sin resultados (AC-14)', fakeAsync(() => {
    const c = montar(AgrupacionesComponent) as any;
    c.fId.set('5'); c.fCod.set('12'); c.fNombre.set('etica'); c.fDepto.set('Salto');
    c.onFiltroTodas(); tick(300);
    const p = ultimoGet('/agrupaciones');
    expect([p.get('id'), p.get('cod'), p.get('nombre'), p.get('depto')]).toEqual(['5', '12', 'etica', 'Salto']);
    expect(p.get('page')).toBe('1');
    (montar as any).fixture.detectChanges();
    expect(el().querySelector('tr.filter-row')).withContext('fila de filtros visible con 0 resultados').toBeTruthy();
    expect(el().textContent).toContain('Sin resultados para los filtros');
  }));

  it('Pendientes: filtros ID / Código / Nombre / Depto (AC-14)', fakeAsync(() => {
    const c = montar(AgrupacionesPendientesComponent) as any;
    c.fId.set('3'); c.fCod.set('7'); c.fNombre.set('lista'); c.fDepto.set('Rocha');
    c.onFilter(); tick(300);
    const p = ultimoGet('/agrupaciones-pendientes');
    expect([p.get('id'), p.get('cod'), p.get('nombre'), p.get('depto')]).toEqual(['3', '7', 'lista', 'Rocha']);
    (montar as any).fixture.detectChanges();
    expect(el().querySelector('tr.filter-row')).toBeTruthy();
  }));

  it('Fichas Web: filtros ID / Nombre / Departamento (AC-15)', fakeAsync(() => {
    const c = montar(FichasAgrupacionComponent) as any;
    c.fId.set('9'); c.fNombre.set('corriente'); c.fDepto.set('Durazno');
    c.onFilter(); tick(300);
    const p = ultimoGet('/fichas-agrupacion');
    expect([p.get('id'), p.get('nombre'), p.get('departamento')]).toEqual(['9', 'corriente', 'Durazno']);
    (montar as any).fixture.detectChanges();
    expect(el().querySelector('tr.filter-row')).toBeTruthy();
  }));

  // ---------- Adhesiones / Convencionales ----------

  it('Adhesiones web manda departamento', () => {
    const c = montar(AdhesionesListadoComponent) as any;
    c.fDeptoWeb.set('Artigas'); c.webPage.set(1); c.reloadWeb();
    expect(ultimoGet('/adhesiones/web').get('departamento')).toBe('Artigas');
  });

  it('Convencionales filtra en el cliente ignorando tildes, mayúsculas y espacios', () => {
    const c = montar(ConvencionalesComponent) as any;
    c.nacionales.set([
      { id: 1, departamento: 'RÍO NEGRO ' }, { id: 2, departamento: 'Salto' }, { id: 3, departamento: null },
    ]);
    c.fDepto = 'Río Negro';
    expect(c.filtrarNacionales().map((x: any) => x.id)).toEqual([1]);
    c.fDepto = '';
    expect(c.filtrarNacionales().length).toBe(3);
  });
});
