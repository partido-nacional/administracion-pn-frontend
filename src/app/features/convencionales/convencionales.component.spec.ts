import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ConvencionalesComponent } from './convencionales.component';
import { ConvencionalesService } from '../../core/services/convencionales.service';
import { ConvencionalDto, ListaDto } from '../../core/models/convencionales';

// Feature 019: Convencionales es solo lectura (join). Se quitó el alta/edición de convencionales;
// el modal solo edita Listas ODN.
describe('ConvencionalesComponent', () => {
  let fixture: ComponentFixture<ConvencionalesComponent>;
  let cmp: ConvencionalesComponent;
  let svc: jasmine.SpyObj<ConvencionalesService>;

  const conv: ConvencionalDto = { id: 10, contactoId: 7, tipo: 'Nacional', departamento: 'Montevideo', adherente: true, fechaInicio: '2026-01-01', condicion: 'Titular', nombreOrganismo: 'X', posicion: '1' };
  const lista: ListaDto = { id: 5, nombre: 'Lista A', tipo: 'ODN', agrupacionId: null };

  beforeEach(() => {
    svc = jasmine.createSpyObj('ConvencionalesService', [
      'getStats', 'getNacionales', 'getListas', 'createLista', 'updateLista',
    ]);
    svc.getStats.and.returnValue(of({ nacionales: 1, departamentales: 0, listasOdn: 0 }));
    svc.getNacionales.and.returnValue(of([conv]));
    svc.getListas.and.returnValue(of([lista]));
    svc.createLista.and.returnValue(of(lista));
    svc.updateLista.and.returnValue(of(lista));

    TestBed.configureTestingModule({
      imports: [ConvencionalesComponent],
      providers: [
        { provide: ConvencionalesService, useValue: svc },
        provideHttpClient(), provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(ConvencionalesComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('arranca en la tab "Todos" y carga Nacionales al abrir esa tab (lazy)', () => {
    // Tab por defecto = todos (listado embebido). Nacionales se carga on-demand.
    expect(cmp.tab()).toBe('todos');
    cmp.setTab('nacionales');
    expect(svc.getNacionales).toHaveBeenCalled();
    expect(cmp.nacionales().length).toBe(1);
    expect(fixture.nativeElement.innerHTML).not.toContain('no implementado');
  });

  it('no ofrece alta de convencional (solo lectura)', () => {
    expect(fixture.nativeElement.innerHTML).not.toContain('Nuevo Convencional');
  });

  it('alta de lista ODN llama createLista', () => {
    cmp.setTab('odn');
    cmp.abrirNuevaLista();
    expect(cmp.form.tipo).toBe('ODN');
    cmp.form.nombre = 'Nueva';
    cmp.guardar();
    expect(svc.createLista).toHaveBeenCalledWith(jasmine.objectContaining({ nombre: 'Nueva', tipo: 'ODN' }));
  });
});
