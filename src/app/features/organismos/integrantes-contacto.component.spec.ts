import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { IntegrantesContactoComponent } from './integrantes-contacto.component';
import { ContactosService, IntegranteOrganismo } from '../agenda/contactos.service';

// Feature 022: la grilla muestra todas las fichas; "Nuevo" se deshabilita si hay una activa;
// "Finalizar" solo aplica a las activas.
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

  it('con una ficha activa: hayActiva=true y "Nuevo" queda deshabilitado', () => {
    const f = setup([ficha(1, false), ficha(2, true)]);
    expect(f.componentInstance.hayActiva()).toBeTrue();
    expect(f.nativeElement.querySelector('button[disabled]')).toBeTruthy();
  });

  it('con todas finalizadas: hayActiva=false y "Nuevo" es un link habilitado', () => {
    const f = setup([ficha(1, false)]);
    expect(f.componentInstance.hayActiva()).toBeFalse();
    expect(f.nativeElement.querySelector('button[disabled]')).toBeNull();
    expect(f.nativeElement.innerHTML).toContain('Nuevo integrante organismo');
  });

  it('muestra todas las fichas (activas y finalizadas)', () => {
    const f = setup([ficha(1, true), ficha(2, false)]);
    expect(f.componentInstance.items().length).toBe(2);
    expect(f.nativeElement.innerHTML).toContain('Vigente');
    expect(f.nativeElement.innerHTML).toContain('Finalizada');
  });

  it('finalizar llama al service con el id', () => {
    const f = setup([ficha(1, true)]);
    spyOn(window, 'confirm').and.returnValue(true);
    f.componentInstance.finalizar(1);
    expect(svc.finalizarIntegranteOrganismo).toHaveBeenCalledWith(1);
  });
});
