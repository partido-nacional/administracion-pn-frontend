import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { OrganismosComponent } from './organismos.component';
import { OrganismosService } from '../../core/services/organismos.service';
import { OrganismoDto, InfoOrganizacionDto, IntegranteOrg } from '../../core/models/organismos';
import { GridQuery, PagedResult } from '../../core/models/paged';

const paged = <T>(items: T[], total = items.length): PagedResult<T> => ({ items, total, page: 1, pageSize: 25 });

/** Feature 033: pantalla info → organismos → integrantes con buscador por nombre de organismo. */
describe('OrganismosComponent', () => {
  let fixture: ComponentFixture<OrganismosComponent>;
  let cmp: OrganismosComponent;
  let svc: jasmine.SpyObj<OrganismosService>;

  const afe: OrganismoDto = { id: 40, nombre: 'AFE', tipoOrganizacionId: 2, organizacionEstatalId: 4, organizacionEstatalNombre: 'Entes Autónomos',
    organizacionPartidariaId: 6, organizacionPartidariaNombre: 'Agrupación de Gobierno', infoOrganizacionId: 131, art44: true, ordenDpto: 0 };
  const ancap: OrganismoDto = { id: 41, nombre: 'ANCAP', organizacionEstatalId: 4, organizacionEstatalNombre: 'Entes Autónomos', infoOrganizacionId: 131, art44: false, ordenDpto: 0 };
  const man: OrganismoDto = { id: 460, nombre: 'MAN - Movimiento Afro Nacionalista', infoOrganizacionId: null, art44: false, ordenDpto: 0 };
  const gob: InfoOrganizacionDto = { id: 131, nombre: 'Agrupación de Gobierno', cantidadOrganismos: 2, tipoOrganizacionId: 2, direccion: 'Calle 1' };
  const vacia: InfoOrganizacionDto = { id: 250, nombre: null, cantidadOrganismos: 0, direccion: 'Andes 1521' };
  const integrante: IntegranteOrg = { idContacto: 99, credCivica: 'ABC12345', apellidos: 'Pérez', nombres: 'Juan', celular: '099', mail: 'j@x.com', posicion: 'Director', organismo: 'AFE', departamento: 'Montevideo' };

  /** getOrganismos responde según los filtros: sinInfo → [man]; infoOrganizacionId → [afe, ancap]. */
  const organismosSegun = (q: GridQuery) => {
    const f = q.filters ?? {};
    if (f['sinInfo']) return of(paged([man]));
    if (f['infoOrganizacionId'] === 131) return of(paged(f['nombre'] ? [afe] : [afe, ancap]));
    return of(paged([]));
  };

  beforeEach(() => {
    svc = jasmine.createSpyObj('OrganismosService', [
      'getOrganismos', 'getInfo', 'getTipos', 'getIntegrantes',
      'getOrganizacionesEstatales', 'getOrganizacionesPartidarias',
      'createOrganismo', 'updateOrganismo', 'createInfo', 'updateInfo',
    ]);
    svc.getOrganismos.and.callFake(organismosSegun);
    svc.getInfo.and.returnValue(of(paged([gob, vacia])));
    svc.getTipos.and.returnValue(of([{ id: 2, nombre: 'GOBIERNO NACIONAL' }]));
    svc.getOrganizacionesEstatales.and.returnValue(of([{ id: 4, tipoOrganizacionId: 2, nombre: 'Entes Autónomos' }]));
    svc.getOrganizacionesPartidarias.and.returnValue(of([{ id: 6, tipoOrganizacionId: 1, nombre: 'Agrupación de Gobierno' }]));
    svc.getIntegrantes.and.returnValue(of(paged([integrante])));
    svc.createOrganismo.and.returnValue(of(afe));
    svc.updateOrganismo.and.returnValue(of(afe));
    svc.createInfo.and.returnValue(of(gob));
    svc.updateInfo.and.returnValue(of(gob));

    TestBed.configureTestingModule({
      imports: [OrganismosComponent],
      providers: [
        { provide: OrganismosService, useValue: svc },
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      ],
    });
    fixture = TestBed.createComponent(OrganismosComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  const texto = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');

  // ── Estructura ────────────────────────────────────────────
  it('AC-1: ya no hay pestañas; la pantalla es la lista de infos', () => {
    expect(fixture.nativeElement.querySelectorAll('.tabs .tab').length).toBe(0);
    expect(svc.getInfo).toHaveBeenCalled();
    expect(cmp.info().length).toBe(2);
  });

  it('AC-2/AC-3: nombre derivado; sin organismos → "Info #id"', () => {
    expect(cmp.nombreInfo(gob)).toBe('Agrupación de Gobierno');
    expect(cmp.nombreInfo(vacia)).toBe('Info #250');
    expect(texto()).toContain('Info #250');
  });

  it('AC-12: fila "Sin info de organización" cuando hay organismos sin info', () => {
    expect(cmp.sinInfoTotal()).toBe(1);
    expect(texto()).toContain('Sin info de organización');
  });

  it('AC-12: sin organismos sin info no aparece la fila especial', () => {
    svc.getOrganismos.and.returnValue(of(paged([], 0)));
    cmp.setBusqueda('zzz');
    return new Promise<void>(res => setTimeout(() => {
      fixture.detectChanges();
      expect(cmp.mostrarSinInfo()).toBeFalse();
      expect(texto()).not.toContain('Sin info de organización');
      res();
    }, 350));
  });

  // ── Nivel 1: organismos de una info ──────────────────────
  it('AC-4: desplegar una info pide todos sus organismos (infoOrganizacionId, all=true)', () => {
    cmp.toggleInfo(131, gob);
    expect(svc.getOrganismos).toHaveBeenCalledWith(jasmine.objectContaining({
      all: true, filters: jasmine.objectContaining({ infoOrganizacionId: 131 }),
    }));
    expect(cmp.organismosDe(131).map(o => o.nombre)).toEqual(['AFE', 'ANCAP']);
  });

  it('AC-5: la fila de organismo tiene la estructura de la vieja grilla (clasificación, editar, referencias)', () => {
    cmp.toggleInfo(131, gob);
    fixture.detectChanges();
    const fila = fixture.nativeElement.querySelector('.org-table tbody tr.clickable') as HTMLElement;
    expect(fila.querySelectorAll('td').length).toBe(12);
    expect(fila.querySelectorAll('td.clasif .badge').length).toBe(2);
    expect(fila.querySelector('.btn-pencil')).toBeTruthy();
    expect(fila.textContent).toContain('Referencias partidarias');
  });

  it('caché: colapsar y re-desplegar la info no vuelve a pedir', () => {
    cmp.toggleInfo(131, gob);
    cmp.toggleInfo(131, gob);
    cmp.toggleInfo(131, gob);
    const llamadas = svc.getOrganismos.calls.allArgs().filter(a => a[0].filters?.['infoOrganizacionId'] === 131);
    expect(llamadas.length).toBe(1);
  });

  it('AC-3: una info sin organismos no se despliega', () => {
    cmp.toggleInfo(250, vacia);
    expect(cmp.isInfoExpanded(250)).toBeFalse();
  });

  it('fila "Sin info" despliega los organismos sin info (sinInfo=true)', () => {
    cmp.toggleInfo('sin');
    expect(svc.getOrganismos).toHaveBeenCalledWith(jasmine.objectContaining({ all: true, filters: jasmine.objectContaining({ sinInfo: true }) }));
    expect(cmp.organismosDe('sin')).toEqual([man]);
  });

  it('acordeón: desplegar otra info colapsa la anterior', () => {
    cmp.toggleInfo(131, gob);
    cmp.toggleInfo('sin');
    expect(cmp.isInfoExpanded(131)).toBeFalse();
    expect(cmp.isInfoExpanded('sin')).toBeTrue();
  });

  it('EC-2: error al cargar organismos → mensaje y reintento', () => {
    svc.getOrganismos.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Boom' } })));
    cmp.toggleInfo(131, gob);
    expect(cmp.orgsError()['131']).toBe('Boom');
    svc.getOrganismos.and.callFake(organismosSegun);
    cmp.loadOrganismos(131);
    expect(cmp.orgsError()['131']).toBeUndefined();
    expect(cmp.organismosDe(131).length).toBe(2);
  });

  // ── Nivel 2: integrantes ─────────────────────────────────
  it('AC-6: desplegar un organismo carga sus integrantes', () => {
    cmp.toggleInfo(131, gob);
    cmp.toggleOrg(afe);
    expect(svc.getIntegrantes).toHaveBeenCalledWith(40, jasmine.anything());
    expect(cmp.integrantesDe(afe)).toEqual([integrante]);
  });

  it('error de integrantes → mensaje; reintento lo recupera', () => {
    svc.getIntegrantes.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Falla' } })));
    cmp.toggleOrg(afe);
    expect(cmp.orgError()[40]).toBe('Falla');
    svc.getIntegrantes.and.returnValue(of(paged([integrante])));
    cmp.loadIntegrantes(afe);
    expect(cmp.integrantesDe(afe)).toEqual([integrante]);
  });

  // ── Buscador ─────────────────────────────────────────────
  it('AC-8/AC-9/AC-11: el buscador filtra infos y organismos, vuelve a página 1 y colapsa', (done) => {
    cmp.toggleInfo(131, gob);
    cmp.onInfoPage(2);
    svc.getInfo.calls.reset();
    cmp.setBusqueda('afe');
    expect(cmp.infoPage()).toBe(1);
    setTimeout(() => {
      expect(svc.getInfo).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1, filters: jasmine.objectContaining({ nombreOrganismo: 'afe' }) }));
      expect(cmp.expandedInfo()).toBeNull();
      cmp.toggleInfo(131, gob);
      expect(svc.getOrganismos).toHaveBeenCalledWith(jasmine.objectContaining({ filters: jasmine.objectContaining({ infoOrganizacionId: 131, nombre: 'afe' }) }));
      expect(cmp.organismosDe(131).map(o => o.nombre)).toEqual(['AFE']);
      done();
    }, 350);
  });

  it('filtro por nombre de info: manda ?nombre, vuelve a página 1 y colapsa', (done) => {
    cmp.toggleInfo(131, gob);
    svc.getInfo.calls.reset();
    cmp.setInfoFilter(cmp.fInfNom, 'parlamentaria');
    expect(cmp.infoPage()).toBe(1);
    setTimeout(() => {
      expect(svc.getInfo).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1, filters: jasmine.objectContaining({ nombre: 'parlamentaria' }) }));
      expect(cmp.expandedInfo()).toBeNull();
      done();
    }, 350);
  });

  // ── Alta / edición ───────────────────────────────────────
  it('AC-13: guardar un organismo recarga la lista y descarta los desplegables', () => {
    cmp.toggleInfo(131, gob);
    svc.getInfo.calls.reset();
    cmp.abrirEditarOrganismo(afe);
    cmp.guardar();
    expect(svc.updateOrganismo).toHaveBeenCalledWith(40, jasmine.objectContaining({ nombre: 'AFE', infoOrganizacionId: 131 }));
    expect(svc.getInfo).toHaveBeenCalled();
    expect(cmp.expandedInfo()).toBeNull();
    expect(cmp.organismosDe(131)).toEqual([]);
  });

  it('alta de organismo manda clasificaciones e info, sin ámbito', () => {
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = 'Nuevo';
    cmp.form.organizacionEstatalId = 4;
    cmp.form.infoOrganizacionId = '131';
    cmp.guardar();
    const arg = svc.createOrganismo.calls.mostRecent().args[0] as any;
    expect(arg).toEqual(jasmine.objectContaining({ nombre: 'Nuevo', organizacionEstatalId: 4, infoOrganizacionId: 131, tipoOrganizacionId: null }));
    expect(arg.ambito).toBeUndefined();
  });

  it('el nombre del organismo es obligatorio', () => {
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = ' ';
    cmp.guardar();
    expect(svc.createOrganismo).not.toHaveBeenCalled();
    expect(cmp.modalError()).toContain('nombre');
  });

  it('alta de info llama createInfo sin organismoId y recarga', () => {
    svc.getInfo.calls.reset();
    cmp.abrirNuevaInfo();
    cmp.form.direccion = 'Nueva dir';
    cmp.guardar();
    expect(svc.createInfo).toHaveBeenCalledTimes(1);
    expect('organismoId' in (svc.createInfo.calls.mostRecent().args[0] as any)).toBeFalse();
    expect(svc.getInfo).toHaveBeenCalled();
  });

  it('feature 034: la info guarda su nombre propio', () => {
    cmp.abrirEditarInfo(gob);
    expect(cmp.form.nombre).toBe('Agrupación de Gobierno');
    cmp.form.nombre = '  PARTIDO NACIONAL - Agrupación Parlamentaria ';
    cmp.guardar();
    expect(svc.updateInfo).toHaveBeenCalledWith(131, jasmine.objectContaining({ nombre: 'PARTIDO NACIONAL - Agrupación Parlamentaria' }));
  });

  it('feature 034: el organismo no manda nombreCompania (el nombre es de la info)', () => {
    cmp.abrirEditarOrganismo(afe);
    cmp.guardar();
    expect('nombreCompania' in (svc.updateOrganismo.calls.mostRecent().args[1] as any)).toBeFalse();
  });

  it('error del backend deja el modal abierto con el mensaje', () => {
    svc.createOrganismo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Info inválida' } })));
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = 'X';
    cmp.guardar();
    expect(cmp.modalKind()).toBe('organismo');
    expect(cmp.modalError()).toBe('Info inválida');
  });

  // ── Paginación y CSV ─────────────────────────────────────
  it('AC-7: paginar infos adopta el page del server y colapsa', () => {
    cmp.toggleInfo(131, gob);
    svc.getInfo.and.returnValue(of({ items: [gob], total: 30, page: 2, pageSize: 25 }));
    cmp.onInfoPage(2);
    expect(cmp.infoPage()).toBe(2);
    expect(cmp.expandedInfo()).toBeNull();
    expect(cmp.mostrarSinInfo()).toBeFalse();   // la fila especial solo va en la página 1
  });

  it('AC-14: el CSV pide todas las infos con el buscador aplicado', () => {
    cmp.busqueda.set('afe');
    svc.getInfo.calls.reset();
    cmp.exportarCsv();
    expect(svc.getInfo).toHaveBeenCalledWith(jasmine.objectContaining({ all: true, filters: jasmine.objectContaining({ nombreOrganismo: 'afe' }) }));
  });
});
