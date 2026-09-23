import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReferenciasContactoComponent } from './referencias-contacto.component';
import { ContactosService, ReferenciaPartidaria } from '../agenda/contactos.service';
import { OrganismosService } from '../../core/services/organismos.service';

/**
 * Feature 028 (bug #3): las referencias partidarias no se podían editar. El endpoint
 * PUT /organismos/referencias/{id} ya existía en el backend; la vista era solo lectura
 * (0 botones), así que el operador veía el histórico pero no podía corregirlo.
 */
describe('ReferenciasContactoComponent', () => {
  let contactosSpy: jasmine.SpyObj<ContactosService>;
  let organismosSpy: jasmine.SpyObj<OrganismosService>;

  const referencia: ReferenciaPartidaria = {
    id: 42, contactoId: 7, organismoId: 394, rol: 'Vocal',
    nombreOrganismo: 'Comisión Departamental', periodo: '2020-2025',
    fechaDesignacion: '01/03/2020', fechaCese: '22/09/2026',
    art44: false, notas: 'una nota',
  };

  beforeEach(() => {
    contactosSpy = jasmine.createSpyObj('ContactosService', ['referenciasPartidarias']);
    contactosSpy.referenciasPartidarias.and.returnValue(of([referencia]));
    organismosSpy = jasmine.createSpyObj('OrganismosService', ['editarReferencia']);
    organismosSpy.editarReferencia.and.returnValue(of({}));

    TestBed.configureTestingModule({
      imports: [ReferenciasContactoComponent],
      providers: [
        { provide: ContactosService, useValue: contactosSpy },
        { provide: OrganismosService, useValue: organismosSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '7' } } } },
      ],
    });
  });

  function montar(): ComponentFixture<ReferenciasContactoComponent> {
    const f = TestBed.createComponent(ReferenciasContactoComponent);
    f.detectChanges();
    return f;
  }

  const botonEditar = (f: ComponentFixture<ReferenciasContactoComponent>): HTMLButtonElement =>
    f.nativeElement.querySelector('tbody button');

  it('AC-1: cada fila ofrece una acción Editar', () => {
    const f = montar();
    expect(botonEditar(f)).toBeTruthy();
    expect(botonEditar(f).textContent!.trim()).toBe('Editar');
  });

  it('AC-2: el modal se abre con los valores de la fila', () => {
    const f = montar();

    botonEditar(f).click();
    f.detectChanges();

    const e = f.componentInstance.editando();
    expect(e).toBeTruthy();
    expect(e!.rol).toBe('Vocal');
    expect(e!.periodo).toBe('2020-2025');
    // El backend manda dd/MM/yyyy y <input type="date"> necesita yyyy-MM-dd.
    expect(e!.fechaDesignacion).toBe('2020-03-01');
    expect(e!.fechaCese).toBe('2026-09-22');
  });

  it('AC-3: guardar llama al PUT con los campos editados', () => {
    const f = montar();
    botonEditar(f).click();
    f.detectChanges();

    f.componentInstance.editando()!.rol = 'Presidente';
    f.componentInstance.guardar();

    expect(organismosSpy.editarReferencia).toHaveBeenCalledTimes(1);
    const [id, input] = organismosSpy.editarReferencia.calls.mostRecent().args;
    expect(id).toBe(42);
    expect(input).toEqual(jasmine.objectContaining({
      contactoId: 7, organismoId: 394, rol: 'Presidente', art44: false,
    }));
  });

  it('AC-3: tras guardar se recarga el listado y se cierra el modal', () => {
    const f = montar();
    botonEditar(f).click();
    f.detectChanges();

    f.componentInstance.guardar();

    expect(f.componentInstance.editando()).toBeNull();
    expect(contactosSpy.referenciasPartidarias).toHaveBeenCalledTimes(2);   // carga inicial + recarga
  });

  it('AC-4: cancelar descarta los cambios y no toca la fila', () => {
    const f = montar();
    botonEditar(f).click();
    f.detectChanges();
    f.componentInstance.editando()!.rol = 'Cambiado';

    f.componentInstance.cancelar();

    expect(f.componentInstance.editando()).toBeNull();
    expect(organismosSpy.editarReferencia).not.toHaveBeenCalled();
    expect(f.componentInstance.items()[0].rol).toBe('Vocal');   // la fila original intacta
  });

  it('AC-5: un error del backend se muestra sin perder lo escrito', () => {
    organismosSpy.editarReferencia.and.returnValue(
      throwError(() => ({ error: { message: 'El organismo debe ser partidario.' } })));
    const f = montar();
    botonEditar(f).click();
    f.detectChanges();
    f.componentInstance.editando()!.rol = 'Presidente';

    f.componentInstance.guardar();

    expect(f.componentInstance.error()).toBe('El organismo debe ser partidario.');
    expect(f.componentInstance.editando()).toBeTruthy();              // el modal sigue abierto
    expect(f.componentInstance.editando()!.rol).toBe('Presidente');   // y conserva lo escrito
  });
});
