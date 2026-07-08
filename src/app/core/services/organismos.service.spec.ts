import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrganismosService } from './organismos.service';
import { OrganismoInput, OrganismoUpdateInput, InfoOrganizacionInput } from '../models/organismos';

const BASE = 'http://localhost:5000/api/organismos';

const organismo = (): OrganismoInput => ({
  ambito: 'Estatal', nombre: 'Org 1', tipoOrganizacionId: 3, art44: false, ordenDpto: 0,
});
const organismoUpd = (): OrganismoUpdateInput => ({
  nombre: 'Org 1', tipoOrganizacionId: 3, art44: false, ordenDpto: 0,
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

  it('getOrganismos() → GET /organismos (sin ámbito)', () => {
    svc.getOrganismos().subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('ambito')).toBeFalse();
    req.flush([]);
  });

  it('getOrganismos("Partidario") → GET /organismos?ambito=Partidario', () => {
    svc.getOrganismos('Partidario').subscribe();
    const req = http.expectOne((r) => r.url === BASE && r.params.get('ambito') === 'Partidario');
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

  it('getIntegrantes(id) → GET /organismos/{id}/integrantes (id global, sin ámbito)', () => {
    svc.getIntegrantes(7).subscribe();
    const req = http.expectOne(`${BASE}/7/integrantes`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getIntegrantes() emite el array de integrantes recibido', () => {
    let recibidos: any[] = [];
    svc.getIntegrantes(1).subscribe((x) => (recibidos = x));
    http.expectOne(`${BASE}/1/integrantes`).flush([
      { idContacto: 99, credCivica: 'ABC12345', apellidos: 'Pérez', nombres: 'Juan',
        celular: '099', mail: 'j@x.com', posicion: 'Titular', organismo: 'Org 1', departamento: 'Montevideo' },
    ]);
    expect(recibidos.length).toBe(1);
    expect(recibidos[0].idContacto).toBe(99);
  });

  it('createOrganismo() → POST /organismos (ámbito en el body)', () => {
    svc.createOrganismo(organismo()).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.ambito).toBe('Estatal');
    req.flush({ id: 1, ...organismo() });
  });

  it('updateOrganismo(id) → PUT /organismos/{id} (sin ámbito)', () => {
    svc.updateOrganismo(5, organismoUpd()).subscribe();
    const req = http.expectOne(`${BASE}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.ambito).toBeUndefined();
    req.flush({ id: 5, ambito: 'Estatal', ...organismoUpd() });
  });

  it('createInfo() → POST /info', () => {
    const input: InfoOrganizacionInput = { tipoOrganizacionId: 1, organismoId: 4, direccion: 'x' };
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

  it('propaga el error 400 FK_INVALID (tipoOrganizacionId inexistente)', () => {
    let status = 0;
    svc.createOrganismo(organismo()).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(BASE).flush({ errorCode: 'FK_INVALID' }, { status: 400, statusText: 'Bad Request' });
    expect(status).toBe(400);
  });

  it('propaga el error 404 (update inexistente)', () => {
    let status = 0;
    svc.updateOrganismo(999, organismoUpd()).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${BASE}/999`).flush({ errorCode: 'NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });
});
