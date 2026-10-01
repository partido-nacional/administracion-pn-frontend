import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlcaldesComponent } from './alcaldes.component';
import { ComisionesDirectorioComponent } from './comisiones-directorio.component';
import { ListadosService, ComisionDirEntry } from '../../core/services/listados.service';
import { DEPARTAMENTOS } from '../../core/departamentos';
import { PagedResult } from '../../core/models/paged';

/** Feature 029: fixes de listados reportados (Alcaldes depto + Comisiones Directorio). */
describe('Listados — fixes agenda (feature 029)', () => {
  let svcSpy: jasmine.SpyObj<ListadosService>;

  const paged = <T>(items: T[]): PagedResult<T> => ({ items, total: items.length, page: 1, pageSize: 20 });

  beforeEach(() => {
    svcSpy = jasmine.createSpyObj('ListadosService', ['alcaldes', 'comisionesDirectorio']);
    svcSpy.alcaldes.and.returnValue(of(paged([])));
    svcSpy.comisionesDirectorio.and.returnValue(of(paged<ComisionDirEntry>([])));
    TestBed.configureTestingModule({
      imports: [AlcaldesComponent, ComisionesDirectorioComponent],
      providers: [{ provide: ListadosService, useValue: svcSpy }],
    });
  });

  it('Alcaldes ofrece los 19 departamentos en el filtro', () => {
    const f = TestBed.createComponent(AlcaldesComponent);
    f.detectChanges();
    const opciones = Array.from(
      (f.nativeElement as HTMLElement).querySelectorAll<HTMLOptionElement>('thead select.column-filter option'),
    ).map(o => o.value);
    expect(opciones).toEqual(['', ...DEPARTAMENTOS]);
  });

  it('Comisiones Directorio carga y muestra la comisión de cada integrante', () => {
    svcSpy.comisionesDirectorio.and.returnValue(of(paged<ComisionDirEntry>([
      { comision: 'Comisión de Ética', apellidos: 'Perez', nombres: 'Ana', celular: '', mail: '', posOrganismo: 'Miembro' },
    ])));
    const f = TestBed.createComponent(ComisionesDirectorioComponent);
    f.detectChanges();
    expect(svcSpy.comisionesDirectorio).toHaveBeenCalled();
    const celdas = Array.from((f.nativeElement as HTMLElement).querySelectorAll('tbody td')).map(td => td.textContent?.trim());
    expect(celdas).toContain('Comisión de Ética');
    expect(celdas).toContain('Perez');
  });
});
