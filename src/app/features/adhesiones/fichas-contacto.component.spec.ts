import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FichasContactoComponent } from './fichas-contacto.component';
import { ContactosService, FichaAdhesionDetalle } from '../agenda/contactos.service';
import { AdhesionesService } from './adhesiones.service';
import { PageTitleService } from '../../core/page-title.service';
import { CatalogosService } from '../../core/catalogos.service';

function detalleBase(over: Partial<FichaAdhesionDetalle> = {}): FichaAdhesionDetalle {
  return {
    id: 1,
    contactoId: 10,
    aporteConfirmado: true,
    art46: false,
    aporteTodoAlPartido: false,
    departamental: false,
    ...over,
  };
}

describe('FichasContactoComponent — onConfirmadoChange', () => {
  let cmp: FichasContactoComponent;

  beforeEach(() => {
    const svc = jasmine.createSpyObj('ContactosService', ['fichasAdhesion']);
    svc.fichasAdhesion.and.returnValue(of([]));
    const cat = jasmine.createSpyObj('CatalogosService', ['sectores']);
    cat.sectores.and.returnValue(of([]));
    const title = jasmine.createSpyObj('PageTitleService', ['set']);

    TestBed.configureTestingModule({
      imports: [FichasContactoComponent],
      providers: [
        { provide: ContactosService, useValue: svc },
        { provide: CatalogosService, useValue: cat },
        { provide: PageTitleService, useValue: title },
        { provide: AdhesionesService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    });
    cmp = TestBed.createComponent(FichasContactoComponent).componentInstance;
  });

  // AC-1/AC-2: baja sin fecha previa prellena la fecha de salida (sin window.prompt)
  it('baja (false) setea aporteConfirmado=false y prellena fechaSalida', () => {
    cmp.detalle.set(detalleBase({ aporteConfirmado: true, fechaSalida: undefined }));
    cmp.onConfirmadoChange(false);
    const d = cmp.detalle()!;
    expect(d.aporteConfirmado).toBeFalse();
    expect(d.fechaSalida).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // AC-4: activa limpia la fecha de salida
  it('activa (true) limpia fechaSalida', () => {
    cmp.detalle.set(detalleBase({ aporteConfirmado: false, fechaSalida: '2020-01-01' }));
    cmp.onConfirmadoChange(true);
    const d = cmp.detalle()!;
    expect(d.aporteConfirmado).toBeTrue();
    expect(d.fechaSalida).toBeUndefined();
  });

  // AC-4: pendiente limpia la fecha de salida
  it('pendiente (null) limpia fechaSalida', () => {
    cmp.detalle.set(detalleBase({ aporteConfirmado: false, fechaSalida: '2020-01-01' }));
    cmp.onConfirmadoChange(null);
    const d = cmp.detalle()!;
    expect(d.aporteConfirmado).toBeNull();
    expect(d.fechaSalida).toBeUndefined();
  });

  // AC-3: el cambio SIEMPRE re-emite el signal (nueva referencia) → el <select>
  // se mantiene sincronizado con el modelo, sin "Baja fantasma".
  it('re-emite el signal con nueva referencia en cada cambio', () => {
    const first = detalleBase({ aporteConfirmado: true });
    cmp.detalle.set(first);
    cmp.onConfirmadoChange(false);
    expect(cmp.detalle()).not.toBe(first);
  });
});
