import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConvencionalesService } from './convencionales.service';
import { ConvencionalInput, ListaInput } from '../models/convencionales';

const BASE = 'http://localhost:5000/api/convencionales';

describe('ConvencionalesService', () => {
  let svc: ConvencionalesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConvencionalesService, provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(ConvencionalesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getNacionales() → GET /nacionales', () => {
    svc.getNacionales().subscribe();
    const req = http.expectOne(`${BASE}/nacionales`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getListas("ODN") → GET /listas/odn (tipo en minúscula)', () => {
    svc.getListas('ODN').subscribe();
    const req = http.expectOne(`${BASE}/listas/odn`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createConvencional() → POST /convencionales con el body', () => {
    const input: ConvencionalInput = { contactoId: 7, tipo: 'Nacional', adherente: true, fechaInicio: '2026-07-04' };
    svc.createConvencional(input).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ id: 1, ...input });
  });

  it('updateConvencional() → PUT /convencionales/{id}', () => {
    const input: ConvencionalInput = { contactoId: 7, tipo: 'Nacional', adherente: false, fechaInicio: '2026-07-04' };
    svc.updateConvencional(42, input).subscribe();
    const req = http.expectOne(`${BASE}/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(input);
    req.flush({ id: 42, ...input });
  });

  it('createLista() → POST /listas', () => {
    const input: ListaInput = { nombre: 'Lista 1', tipo: 'ODN', agrupacionId: null };
    svc.createLista(input).subscribe();
    const req = http.expectOne(`${BASE}/listas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ id: 1, ...input });
  });

  it('updateLista() → PUT /listas/{id}', () => {
    const input: ListaInput = { nombre: 'Lista 1', tipo: 'ODD' };
    svc.updateLista(9, input).subscribe();
    const req = http.expectOne(`${BASE}/listas/9`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 9, ...input });
  });

  it('propaga el error 400 FK_INVALID al subscriber', () => {
    let status = 0;
    const input: ConvencionalInput = { contactoId: 999, tipo: 'Nacional', adherente: false, fechaInicio: '2026-07-04' };
    svc.createConvencional(input).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(BASE).flush({ errorCode: 'FK_INVALID', message: 'ContactoId 999 no existe.' }, { status: 400, statusText: 'Bad Request' });
    expect(status).toBe(400);
  });

  it('propaga el error 404 al subscriber (update inexistente)', () => {
    let status = 0;
    const input: ListaInput = { nombre: 'x', tipo: 'ODN' };
    svc.updateLista(123, input).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${BASE}/listas/123`).flush({ errorCode: 'NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });
});
