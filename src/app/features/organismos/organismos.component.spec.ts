import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { OrganismosComponent } from './organismos.component';
import { OrganismosService } from '../../core/services/organismos.service';
import { OrganismoDto, InfoOrganizacionDto, IntegranteOrg } from '../../core/models/organismos';
import { PagedResult } from '../../core/models/paged';

const paged = <T>(items: T[]): PagedResult<T> => ({ items, total: items.length, page: 1, pageSize: 25 });

describe('OrganismosComponent', () => {
  let fixture: ComponentFixture<OrganismosComponent>;
  let cmp: OrganismosComponent;
  let svc: jasmine.SpyObj<OrganismosService>;

  const orgEstatal: OrganismoDto = { id: 3, nombre: 'Min. X', tipoOrganizacionId: 2, organizacionEstatalId: 1, organizacionEstatalNombre: 'Presidencia', art44: false, ordenDpto: 1 };
  const orgPart: OrganismoDto = { id: 4, nombre: 'Comité Y', tipoOrganizacionId: 5, organizacionPartidariaId: 9, organizacionPartidariaNombre: 'Comisión Departamental', art44: true, ordenDpto: 0 };
  const orgAmbas: OrganismoDto = { id: 40, nombre: 'AFE', tipoOrganizacionId: 2, organizacionEstatalId: 4, organizacionEstatalNombre: 'Entes Autónomos',
    organizacionPartidariaId: 6, organizacionPartidariaNombre: 'Agrupación de Gobierno', infoOrganizacionId: 131, art44: true, ordenDpto: 0 };
  const orgSinClasif: OrganismoDto = { id: 583, nombre: 'Seccional de Atlántida', tipoOrganizacionId: null, art44: false, ordenDpto: 0 };
  const info: InfoOrganizacionDto = { id: 8, tipoOrganizacionId: 2, direccion: 'Calle 1', telefono: '099', email: 'a@b.com', observaciones: null };
  const integrante: IntegranteOrg = { idContacto: 99, credCivica: 'ABC12345', apellidos: 'Pérez', nombres: 'Juan', celular: '099', mail: 'j@x.com', posicion: 'Titular', organismo: 'Min. X', departamento: 'Montevideo' };

  beforeEach(() => {
    svc = jasmine.createSpyObj('OrganismosService', [
      'getOrganismos', 'getInfo', 'getReferencias', 'getTipos', 'getIntegrantes',
      'getOrganizacionesEstatales', 'getOrganizacionesPartidarias',
      'createOrganismo', 'updateOrganismo', 'createInfo', 'updateInfo',
    ]);
    svc.getOrganismos.and.returnValue(of(paged([orgEstatal, orgPart, orgAmbas, orgSinClasif])));
    svc.getOrganizacionesEstatales.and.returnValue(of([{ id: 4, tipoOrganizacionId: 2, nombre: 'Entes Autónomos' }]));
    svc.getOrganizacionesPartidarias.and.returnValue(of([{ id: 6, tipoOrganizacionId: 1, nombre: 'Agrupación de Gobierno' }]));
    svc.getInfo.and.returnValue(of(paged([info])));
    svc.getReferencias.and.returnValue(of(paged([])));
    svc.getTipos.and.returnValue(of([{ id: 2, nombre: 'Ministerio' }, { id: 5, nombre: 'Comité' }]));
    svc.getIntegrantes.and.returnValue(of(paged([integrante])));
    svc.createOrganismo.and.returnValue(of(orgEstatal));
    svc.updateOrganismo.and.returnValue(of(orgPart));
    svc.createInfo.and.returnValue(of(info));
    svc.updateInfo.and.returnValue(of(info));

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

  it('carga la primera página de organismos en el constructor', () => {
    expect(svc.getOrganismos).toHaveBeenCalled();
    expect(cmp.organismos().length).toBe(4);
    expect(cmp.orgTotal()).toBe(4);
  });

  it('carga tipos para el select en el constructor', () => {
    expect(svc.getTipos).toHaveBeenCalled();
    expect(cmp.tipos().length).toBe(2);
  });

  it('carga los catálogos de organizaciones para los selects (AC-5)', () => {
    expect(cmp.orgEstatales()[0].nombre).toBe('Entes Autónomos');
    expect(cmp.orgPartidarias()[0].nombre).toBe('Agrupación de Gobierno');
  });

  it('columna Clasificación: badges estatal y partidaria; sin clasificación → "—" (AC-1, EC-1)', () => {
    const filas: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('tbody tr.clickable'));
    const clasif = (i: number) => (filas[i].querySelector('td.clasif') as HTMLElement).textContent!.replace(/\s+/g, ' ').trim();
    expect(clasif(2)).toContain('Entes Autónomos');
    expect(clasif(2)).toContain('Agrupación de Gobierno');
    expect(filas[2].querySelectorAll('td.clasif .badge').length).toBe(2);
    expect(clasif(3)).toBe('—');
  });

  it('abrirNuevoOrganismo() abre el modal sin clasificación ni info', () => {
    cmp.abrirNuevoOrganismo();
    expect(cmp.modalKind()).toBe('organismo');
    expect(cmp.modalMode()).toBe('nueva');
    expect(cmp.form.organizacionEstatalId).toBeNull();
    expect(cmp.form.organizacionPartidariaId).toBeNull();
    expect(cmp.form.infoOrganizacionId).toBeNull();
    expect(cmp.form.ambito).toBeUndefined();
  });

  it('abrirEditarOrganismo() toma clasificaciones e info de la fila', () => {
    cmp.abrirEditarOrganismo(orgAmbas);
    expect(cmp.form.organizacionEstatalId).toBe(4);
    expect(cmp.form.organizacionPartidariaId).toBe(6);
    expect(cmp.form.infoOrganizacionId).toBe(131);
    expect(cmp.editId()).toBe(40);
  });

  it('alta de organismo manda clasificaciones e info, sin ámbito (BR-1)', () => {
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = 'Nuevo';
    cmp.form.organizacionEstatalId = 4;
    cmp.form.organizacionPartidariaId = 6;
    cmp.form.infoOrganizacionId = '131';
    cmp.guardar();
    expect(svc.createOrganismo).toHaveBeenCalledWith(jasmine.objectContaining({
      nombre: 'Nuevo', organizacionEstatalId: 4, organizacionPartidariaId: 6, infoOrganizacionId: 131, tipoOrganizacionId: null,
    }));
    expect((svc.createOrganismo.calls.mostRecent().args[0] as any).ambito).toBeUndefined();
    expect(cmp.modalKind()).toBeNull();
  });

  it('edición de organismo llama updateOrganismo con id y el mismo payload (sin ámbito)', () => {
    cmp.abrirEditarOrganismo(orgEstatal);
    cmp.guardar();
    expect(svc.updateOrganismo).toHaveBeenCalledWith(3, jasmine.objectContaining({ nombre: 'Min. X', organizacionEstatalId: 1, organizacionPartidariaId: null }));
    const arg = svc.updateOrganismo.calls.mostRecent().args[1] as any;
    expect(arg.ambito).toBeUndefined();
  });

  it('el tipo de organización es opcional (AC-7)', () => {
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = 'Sin tipo';
    cmp.form.tipoOrganizacionId = null;
    cmp.guardar();
    expect(svc.createOrganismo).toHaveBeenCalledWith(jasmine.objectContaining({ nombre: 'Sin tipo', tipoOrganizacionId: null }));
  });

  it('el nombre sigue siendo obligatorio', () => {
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = '  ';
    cmp.guardar();
    expect(svc.createOrganismo).not.toHaveBeenCalled();
    expect(cmp.modalError()).toContain('nombre');
  });

  it('filtro de clasificación manda ?ambito (AC-2)', (done) => {
    svc.getOrganismos.calls.reset();
    cmp.setOrgFilter(cmp.fOrgAmb, 'Partidario');
    setTimeout(() => {
      expect(svc.getOrganismos).toHaveBeenCalledWith(jasmine.objectContaining({ filters: jasmine.objectContaining({ ambito: 'Partidario' }) }));
      done();
    }, 350);
  });

  it('error del backend deja el modal abierto y muestra el mensaje', () => {
    svc.createOrganismo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Tipo inválido' } })));
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = 'X';
    cmp.form.tipoOrganizacionId = 99;
    cmp.guardar();
    expect(cmp.modalKind()).toBe('organismo');
    expect(cmp.modalError()).toBe('Tipo inválido');
  });

  it('alta de info llama createInfo sin organismoId y refresca (AC-8)', () => {
    svc.getInfo.calls.reset();
    cmp.abrirNuevaInfo();
    cmp.form.direccion = 'Nueva dir';
    cmp.guardar();
    expect(svc.createInfo).toHaveBeenCalledTimes(1);
    expect('organismoId' in (svc.createInfo.calls.mostRecent().args[0] as any)).toBeFalse();
    expect(cmp.modalKind()).toBeNull();
    expect(svc.getInfo).toHaveBeenCalled();
  });

  // ── Paginación ────────────────────────────────────────────
  it('onOrgPage() recarga con la página pedida y refleja el echo del server', () => {
    svc.getOrganismos.calls.reset();
    svc.getOrganismos.and.returnValue(of({ items: [orgEstatal], total: 30, page: 2, pageSize: 25 }));
    cmp.onOrgPage(2);
    expect(svc.getOrganismos).toHaveBeenCalledWith(jasmine.objectContaining({ page: 2 }));
    expect(cmp.orgPage()).toBe(2); // el componente adopta el page devuelto por el backend
  });

  it('cambiar filtro resetea a page 1 y recarga (debounced)', (done) => {
    cmp.onOrgPage(3);
    svc.getOrganismos.calls.reset();
    cmp.setOrgFilter(cmp.fOrgNom, 'min');
    expect(cmp.orgPage()).toBe(1); // reset inmediato
    setTimeout(() => {
      expect(svc.getOrganismos).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1, filters: jasmine.objectContaining({ nombre: 'min' }) }));
      done();
    }, 350);
  });

  it('export CSV pide el dataset completo (all=true)', () => {
    svc.getOrganismos.calls.reset();
    cmp.exportarCsvTab();
    expect(svc.getOrganismos).toHaveBeenCalledWith(jasmine.objectContaining({ all: true }));
  });

  // ── Integrantes inline (por organismo) ────────────────────
  it('ya no existe la pestaña "Integrantes" en la barra de tabs', () => {
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('.tabs .tab')).map((t: any) => t.textContent.trim());
    expect(tabs).not.toContain('Integrantes');
    expect(tabs).toContain('Todos los Organismos');
    // Feature 028: la pestaña "Ref. Partidarias" se quitó (referencias ahora por contacto/organismo).
    expect(tabs).not.toContain('Ref. Partidarias');
  });

  it('toggleOrg() expande y carga integrantes por id (PagedResult.items)', () => {
    cmp.toggleOrg(orgEstatal);
    expect(cmp.isExpanded(orgEstatal)).toBeTrue();
    expect(svc.getIntegrantes).toHaveBeenCalledWith(3, jasmine.anything());
    expect(cmp.integrantesDe(orgEstatal)).toEqual([integrante]);
  });

  it('toggleOrg() de nuevo colapsa el mismo organismo', () => {
    cmp.toggleOrg(orgEstatal);
    cmp.toggleOrg(orgEstatal);
    expect(cmp.isExpanded(orgEstatal)).toBeFalse();
  });

  it('acordeón: expandir otro organismo colapsa el anterior', () => {
    cmp.toggleOrg(orgEstatal);
    cmp.toggleOrg(orgPart);
    expect(cmp.isExpanded(orgEstatal)).toBeFalse();
    expect(cmp.isExpanded(orgPart)).toBeTrue();
    expect(svc.getIntegrantes).toHaveBeenCalledWith(4, jasmine.anything());
  });

  it('caché: colapsar y re-expandir no dispara una nueva petición', () => {
    cmp.toggleOrg(orgEstatal);            // carga
    cmp.toggleOrg(orgEstatal);            // colapsa
    cmp.toggleOrg(orgEstatal);            // re-expande desde caché
    expect(svc.getIntegrantes).toHaveBeenCalledTimes(1);
  });

  it('estado vacío: organismo sin integrantes', () => {
    svc.getIntegrantes.and.returnValue(of(paged([])));
    cmp.toggleOrg(orgPart);
    expect(cmp.integrantesDe(orgPart)).toEqual([]);
    expect(cmp.orgError()[orgPart.id]).toBeUndefined();
  });

  it('estado de error: fallo al cargar integrantes setea el mensaje de error', () => {
    svc.getIntegrantes.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Boom' } })));
    cmp.toggleOrg(orgPart);
    expect(cmp.orgError()[orgPart.id]).toBe('Boom');
    expect(cmp.orgLoading()[orgPart.id]).toBeFalse();
  });

  it('reintento tras error vuelve a llamar getIntegrantes', () => {
    svc.getIntegrantes.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    cmp.toggleOrg(orgPart);
    svc.getIntegrantes.and.returnValue(of(paged([integrante])));
    cmp.loadIntegrantes(orgPart);
    expect(cmp.integrantesDe(orgPart)).toEqual([integrante]);
    expect(cmp.orgError()[orgPart.id]).toBeUndefined();
  });
});
