import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReferenciasOrganismoComponent } from './referencias-organismo.component';
import { OrganismosService } from '../../core/services/organismos.service';
import { OrganismoDto, ReferenciaOrganismo } from '../../core/models/organismos';
import { ContactosService } from '../agenda/contactos.service';

/** Feature 035: las referencias del organismo suman las calculadas desde integrantes finalizados. */
describe('ReferenciasOrganismoComponent', () => {
  let svc: jasmine.SpyObj<OrganismosService>;
  let contactos: jasmine.SpyObj<ContactosService>;
  const partidario: OrganismoDto = { id: 14, nombre: 'Convención Nacional', organizacionPartidariaId: 2, art44: false, ordenDpto: 0 };
  const estatal: OrganismoDto = { id: 14, nombre: 'Presidencia', organizacionEstatalId: 1, art44: false, ordenDpto: 0 };

  const guardada: ReferenciaOrganismo = { id: 5, contactoId: 1, nombres: 'Ana Alfa', rol: 'Presidente', art44: true, origen: 'Referencia' };
  const calculada: ReferenciaOrganismo = { id: 0, contactoId: 2, nombres: 'Juan Zeta', rol: 'Convencional', art44: false,
    origen: 'Integrante', integranteId: 77, fechaDesignacion: '10/08/2019' };

  function montar(items: ReferenciaOrganismo[], organismo: OrganismoDto = partidario): ComponentFixture<ReferenciasOrganismoComponent> {
    svc = jasmine.createSpyObj('OrganismosService', ['getReferenciasDeOrganismo', 'editarReferencia', 'getOrganismo', 'crearReferencia']);
    svc.getReferenciasDeOrganismo.and.returnValue(of(items));
    svc.getOrganismo.and.returnValue(of(organismo));
    svc.crearReferencia.and.returnValue(of({}));
    contactos = jasmine.createSpyObj('ContactosService', ['listado']);
    contactos.listado.and.returnValue(of({ items: [
      { id: 33, nombre: 'Ana', apellido: 'Pérez', cedula: '1234567', adherente: false, tieneFicha: false } as any,
    ], total: 1, page: 1, pageSize: 8 }));
    TestBed.configureTestingModule({
      imports: [ReferenciasOrganismoComponent],
      providers: [
        provideRouter([]),   // antes del stub: provideRouter también registra ActivatedRoute
        { provide: OrganismosService, useValue: svc },
        { provide: ContactosService, useValue: contactos },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '14' } } } },
      ],
    });
    const f = TestBed.createComponent(ReferenciasOrganismoComponent);
    f.detectChanges();
    return f;
  }

  it('pide las referencias del organismo de la ruta', () => {
    montar([]);
    expect(svc.getReferenciasDeOrganismo).toHaveBeenCalledWith(14);
  });

  it('muestra guardadas y calculadas; la calculada marcada y sin Editar', () => {
    const f = montar([guardada, calculada]);
    const filas: HTMLElement[] = Array.from(f.nativeElement.querySelectorAll('tbody tr'));
    expect(filas.length).toBe(2);
    expect(filas[0].querySelector('button')!.textContent!.trim()).toBe('Editar');
    expect(filas[0].querySelector('.badge-calc')).toBeNull();
    expect(filas[1].textContent).toContain('Juan Zeta');
    expect(filas[1].querySelector('.badge-calc')!.textContent).toContain('Desde integrante');
    expect(filas[1].querySelector('button')).toBeNull();
  });

  it('sin filas → estado vacío', () => {
    const f = montar([]);
    expect(f.nativeElement.textContent).toContain('no tiene referencias partidarias');
  });

  // ── Feature 036: alta manual ──
  const botonCrear = (f: ComponentFixture<ReferenciasOrganismoComponent>) =>
    Array.from(f.nativeElement.querySelectorAll('.topbar-inline button')).find((b: any) => b.textContent.includes('Crear referencia'));

  it('feature 036: el título muestra el nombre del organismo y el botón aparece si es partidario', () => {
    const f = montar([]);
    expect(f.nativeElement.querySelector('h2').textContent).toContain('Convención Nacional');
    expect(botonCrear(f)).toBeTruthy();
  });

  it('feature 036: organismo no partidario → sin botón de alta', () => {
    const f = montar([], estatal);
    expect(botonCrear(f)).toBeUndefined();
  });

  it('feature 036: buscar y elegir contacto, y crear con el organismo de la ruta', (done) => {
    const f = montar([]);
    const c = f.componentInstance;
    c.abrirAlta();
    c.onBuscarContacto({ target: { value: 'perez' } } as any);
    setTimeout(() => {
      expect(contactos.listado).toHaveBeenCalledWith(jasmine.objectContaining({ pageSize: 8, filters: { q: 'perez' } }));
      expect(c.resultados().length).toBe(1);
      c.seleccionarContacto(c.resultados()[0]);
      c.nueva()!.rol = 'Convencional';
      svc.getReferenciasDeOrganismo.calls.reset();
      c.crear();
      expect(svc.crearReferencia).toHaveBeenCalledWith(jasmine.objectContaining({ contactoId: 33, organismoId: 14, rol: 'Convencional' }));
      expect(c.nueva()).toBeNull();
      expect(svc.getReferenciasDeOrganismo).toHaveBeenCalled();
      done();
    }, 300);
  });

  it('feature 036: sin contacto no se envía', () => {
    const f = montar([]);
    const c = f.componentInstance;
    c.abrirAlta();
    c.nueva()!.rol = 'Vocal';
    c.crear();
    expect(svc.crearReferencia).not.toHaveBeenCalled();
    expect(c.error()).toContain('contacto');
  });

  it('feature 036: error del backend queda en el formulario', () => {
    const f = montar([]);
    svc.crearReferencia.and.returnValue(throwError(() => ({ error: { message: 'ContactoId 33 no existe.' } })));
    const c = f.componentInstance;
    c.abrirAlta();
    c.seleccionarContacto({ id: 33, nombre: 'Ana', apellido: 'Pérez' } as any);
    c.nueva()!.rol = 'Vocal';
    c.crear();
    expect(c.nueva()).not.toBeNull();
    expect(c.error()).toBe('ContactoId 33 no existe.');
  });
});
