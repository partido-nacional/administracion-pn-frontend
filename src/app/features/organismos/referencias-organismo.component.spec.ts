import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ReferenciasOrganismoComponent } from './referencias-organismo.component';
import { OrganismosService } from '../../core/services/organismos.service';
import { ReferenciaOrganismo } from '../../core/models/organismos';

/** Feature 035: las referencias del organismo suman las calculadas desde integrantes finalizados. */
describe('ReferenciasOrganismoComponent', () => {
  let svc: jasmine.SpyObj<OrganismosService>;

  const guardada: ReferenciaOrganismo = { id: 5, contactoId: 1, nombres: 'Ana Alfa', rol: 'Presidente', art44: true, origen: 'Referencia' };
  const calculada: ReferenciaOrganismo = { id: 0, contactoId: 2, nombres: 'Juan Zeta', rol: 'Convencional', art44: false,
    origen: 'Integrante', integranteId: 77, fechaDesignacion: '10/08/2019' };

  function montar(items: ReferenciaOrganismo[]): ComponentFixture<ReferenciasOrganismoComponent> {
    svc = jasmine.createSpyObj('OrganismosService', ['getReferenciasDeOrganismo', 'editarReferencia']);
    svc.getReferenciasDeOrganismo.and.returnValue(of(items));
    TestBed.configureTestingModule({
      imports: [ReferenciasOrganismoComponent],
      providers: [
        provideRouter([]),   // antes del stub: provideRouter también registra ActivatedRoute
        { provide: OrganismosService, useValue: svc },
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
});
