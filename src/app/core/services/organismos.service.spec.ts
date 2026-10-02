import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrganismosService } from './organismos.service';
import { OrganismoInput, InfoOrganizacionInput } from '../models/organismos';
import { GridQuery, PagedResult } from '../models/paged';

const BASE = 'http://localhost:5000/api/organismos';

const organismo = (): OrganismoInput => ({
  nombre: 'AFE', tipoOrganizacionId: 3, organizacionEstatalId: 4, organizacionPartidariaId: 6,
  infoOrganizacionId: 131, art44: false, ordenDpto: 0,
});
const organismoUpd = organismo;
const q = (filters?: GridQuery['filters']): GridQuery => ({ page: 1, pageSize: 25, filters });
const paged = <T>(items: T[]): PagedResult<T> => ({ items, total: items.length, page: 1, pageSize: 25 });

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

  it('getOrganismos(query) → GET /organismos con page/pageSize', () => {
    svc.getOrganismos(q()).subscribe();
    const req = http.expectOne((r) => r.url === BASE && r.params.get('page') === '1' && r.params.get('pageSize') === '25');
    expect(req.request.method).toBe('GET');
    req.flush(paged([]));
  });

  it('getOrganismos con filtro ámbito ("tiene organización partidaria") → ?ambito=Partidario', () => {
    svc.getOrganismos(q({ ambito: 'Partidario' })).subscribe();
    const req = http.expectOne((r) => r.url === BASE && r.params.get('ambito') === 'Partidario');
    expect(req.request.method).toBe('GET');
    req.flush(paged([]));
  });

  it('getInfo(query) → GET /info', () => {
    svc.getInfo(q()).subscribe();
    expect(http.expectOne((r) => r.url === `${BASE}/info`).request.method).toBe('GET');
  });

  it('getReferencias(query) → GET /referencias', () => {
    svc.getReferencias(q()).subscribe();
    expect(http.expectOne((r) => r.url === `${BASE}/referencias`).request.method).toBe('GET');
  });

  it('getOrganizacionesEstatales() → GET /organizaciones-estatales', () => {
    let recibido: any[] = [];
    svc.getOrganizacionesEstatales().subscribe((x) => (recibido = x));
    const req = http.expectOne(`${BASE}/organizaciones-estatales`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 4, tipoOrganizacionId: 2, nombre: 'Entes Autónomos' }]);
    expect(recibido[0].nombre).toBe('Entes Autónomos');
  });

  it('getOrganizacionesPartidarias() → GET /organizaciones-partidarias', () => {
    svc.getOrganizacionesPartidarias().subscribe();
    expect(http.expectOne(`${BASE}/organizaciones-partidarias`).request.method).toBe('GET');
  });

  it('getTipos() → GET /tipos', () => {
    svc.getTipos().subscribe();
    expect(http.expectOne(`${BASE}/tipos`).request.method).toBe('GET');
  });

  it('getIntegrantes(id, query) → GET /organismos/{id}/integrantes', () => {
    svc.getIntegrantes(7, q()).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/7/integrantes`);
    expect(req.request.method).toBe('GET');
    req.flush(paged([]));
  });

  it('getIntegrantes() emite el PagedResult recibido', () => {
    let recibido: PagedResult<any> | undefined;
    svc.getIntegrantes(1, q()).subscribe((x) => (recibido = x));
    http.expectOne((r) => r.url === `${BASE}/1/integrantes`).flush(paged([
      { idContacto: 99, credCivica: 'ABC12345', apellidos: 'Pérez', nombres: 'Juan',
        celular: '099', mail: 'j@x.com', posicion: 'Titular', organismo: 'Org 1', departamento: 'Montevideo' },
    ]));
    expect(recibido!.items.length).toBe(1);
    expect(recibido!.items[0].idContacto).toBe(99);
  });

  it('createOrganismo() → POST /organismos con clasificaciones e info (sin ámbito)', () => {
    svc.createOrganismo(organismo()).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.ambito).toBeUndefined();
    expect(req.request.body.organizacionEstatalId).toBe(4);
    expect(req.request.body.organizacionPartidariaId).toBe(6);
    expect(req.request.body.infoOrganizacionId).toBe(131);
    req.flush({ id: 1, ...organismo() });
  });

  it('updateOrganismo(id) → PUT /organismos/{id} con el mismo payload que el alta', () => {
    svc.updateOrganismo(5, organismoUpd()).subscribe();
    const req = http.expectOne(`${BASE}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(organismo());
    req.flush({ id: 5, ...organismoUpd() });
  });

  it('createInfo() → POST /info', () => {
    const input: InfoOrganizacionInput = { tipoOrganizacionId: 1, direccion: 'x' };
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
