import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrganismosService } from './organismos.service';
import { OrganismoInput, InfoOrganizacionInput } from '../models/organismos';

const BASE = 'http://localhost:5000/api/organismos';

const organismo = (): OrganismoInput => ({
  nombre: 'Org 1', tipoOrganismoId: 3, art44: false, ordenDpto: 0,
});

describe('OrganismosService', () => {
  let svc: OrganismosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrganismosService, provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(OrganismosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getTodos() → GET /todos', () => {
    svc.getTodos().subscribe();
    const req = http.expectOne(`${BASE}/todos`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getInfo() → GET /info', () => {
    svc.getInfo().subscribe();
    expect(http.expectOne(`${BASE}/info`).request.method).toBe('GET');
  });

  it('getTipos() → GET /tipos', () => {
    svc.getTipos().subscribe();
    expect(http.expectOne(`${BASE}/tipos`).request.method).toBe('GET');
  });

  it('createOrganismo("Estatal") → POST /estatales', () => {
    svc.createOrganismo('Estatal', organismo()).subscribe();
    const req = http.expectOne(`${BASE}/estatales`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, ambito: 'Estatal', ...organismo() });
  });

  it('createOrganismo("Partidario") → POST /partidarios (ruta por ámbito)', () => {
    svc.createOrganismo('Partidario', organismo()).subscribe();
    const req = http.expectOne(`${BASE}/partidarios`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, ambito: 'Partidario', ...organismo() });
  });

  it('updateOrganismo("Estatal", id) → PUT /estatales/{id}', () => {
    svc.updateOrganismo('Estatal', 5, organismo()).subscribe();
    const req = http.expectOne(`${BASE}/estatales/5`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 5, ambito: 'Estatal', ...organismo() });
  });

  it('createInfo() → POST /info', () => {
    const input: InfoOrganizacionInput = { tipoOrganismoId: 1, direccion: 'x' };
    svc.createInfo(input).subscribe();
    const req = http.expectOne(`${BASE}/info`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ id: 1, ...input });
  });

  it('updateInfo() → PUT /info/{id}', () => {
    const input: InfoOrganizacionInput = { email: 'a@b.com' };
    svc.updateInfo(8, input).subscribe();
    expect(http.expectOne(`${BASE}/info/8`).request.method).toBe('PUT');
  });

  it('propaga el error 400 FK_INVALID (tipoOrganismoId inexistente)', () => {
    let status = 0;
    svc.createOrganismo('Estatal', organismo()).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${BASE}/estatales`).flush({ errorCode: 'FK_INVALID' }, { status: 400, statusText: 'Bad Request' });
    expect(status).toBe(400);
  });

  it('propaga el error 404 (update inexistente)', () => {
    let status = 0;
    svc.updateOrganismo('Partidario', 999, organismo()).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${BASE}/partidarios/999`).flush({ errorCode: 'NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });
});
