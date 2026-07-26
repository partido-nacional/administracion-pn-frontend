import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { IntegrantesContactoComponent } from './integrantes-contacto.component';
import { ContactosService, IntegranteOrganismo } from '../agenda/contactos.service';

// Feature 026: el listado muestra solo fichas vigentes; "Nuevo" siempre habilitado
// (un contacto puede tener varias fichas vigentes); "Finalizar" pide una fecha editable.
describe('IntegrantesContactoComponent', () => {
  let svc: jasmine.SpyObj<ContactosService>;

  function setup(items: IntegranteOrganismo[]): ComponentFixture<IntegrantesContactoComponent> {
    svc = jasmine.createSpyObj('ContactosService', ['integrantesOrganismo', 'finalizarIntegranteOrganismo']);
    svc.integrantesOrganismo.and.returnValue(of(items));
    svc.finalizarIntegranteOrganismo.and.returnValue(of(void 0));
    TestBed.configureTestingModule({
      imports: [IntegrantesContactoComponent],
      providers: [
        { provide: ContactosService, useValue: svc },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '7' } } } },
        provideHttpClient(), provideHttpClientTesting(),
      ],
    });
    const fixture = TestBed.createComponent(IntegrantesContactoComponent);
    fixture.detectChanges();
    return fixture;
  }

  const ficha = (id: number, activo: boolean): IntegranteOrganismo =>
    ({ id, contactoId: 7, nombres: 'Ana Lopez', activo });

  it('"Nuevo integrante organismo" es siempre un link habilitado (sin botón deshabilitado)', () => {
    const f = setup([ficha(1, true)]);
    expect(f.nativeElement.querySelector('button[disabled]')).toBeNull();
    expect(f.nativeElement.innerHTML).toContain('Nuevo integrante organismo');
  });

  it('renderiza las fichas vigentes', () => {
    const f = setup([ficha(1, true)]);
    expect(f.componentInstance.items().length).toBe(1);
    expect(f.nativeElement.innerHTML).toContain('Vigente');
  });

  it('abrirFinalizar precarga la fecha de hoy y abre el diálogo', () => {
    const f = setup([ficha(1, true)]);
    f.componentInstance.abrirFinalizar(1);
    expect(f.componentInstance.finalizarId()).toBe(1);
    expect(f.componentInstance.fechaFin()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('confirmarFinalizar llama al service con el id y la fecha ingresada', () => {
    const f = setup([ficha(1, true)]);
    f.componentInstance.abrirFinalizar(1);
    f.componentInstance.fechaFin.set('2026-03-15');
    f.componentInstance.confirmarFinalizar();
    expect(svc.finalizarIntegranteOrganismo).toHaveBeenCalledWith(1, '2026-03-15');
  });

  it('confirmarFinalizar sin fecha no llama al service', () => {
    const f = setup([ficha(1, true)]);
    f.componentInstance.abrirFinalizar(1);
    f.componentInstance.fechaFin.set('');
    f.componentInstance.confirmarFinalizar();
    expect(svc.finalizarIntegranteOrganismo).not.toHaveBeenCalled();
  });
});
