import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConvencionalesService } from './convencionales.service';
import { ListaInput } from '../models/convencionales';

const BASE = 'http://localhost:5000/api/convencionales';

// Feature 019: Convencionales pasó a ser solo lectura (join). El service ya no expone
// create/update de convencional; se conservan lecturas + CRUD de Listas ODN.
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

  it('createLista() → POST /listas', () => {
    const input: ListaInput = { nombre: 'Lista 1', tipo: 'ODN', agrupacionId: null };
    svc.createLista(input).subscribe();
    const req = http.expectOne(`${BASE}/listas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ id: 1, ...input });
  });

  it('updateLista() → PUT /listas/{id}', () => {
    const input: ListaInput = { nombre: 'Lista 1', tipo: 'ODN' };
    svc.updateLista(9, input).subscribe();
    const req = http.expectOne(`${BASE}/listas/9`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 9, ...input });
  });

  it('propaga el error 404 al subscriber (update inexistente)', () => {
    let status = 0;
    const input: ListaInput = { nombre: 'x', tipo: 'ODN' };
    svc.updateLista(123, input).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${BASE}/listas/123`).flush({ errorCode: 'NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });
});
