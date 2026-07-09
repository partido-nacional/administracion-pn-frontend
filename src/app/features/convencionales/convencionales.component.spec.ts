import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ConvencionalesComponent } from './convencionales.component';
import { ConvencionalesService } from '../../core/services/convencionales.service';
import { ConvencionalDto, ListaDto } from '../../core/models/convencionales';

describe('ConvencionalesComponent', () => {
  let fixture: ComponentFixture<ConvencionalesComponent>;
  let cmp: ConvencionalesComponent;
  let svc: jasmine.SpyObj<ConvencionalesService>;

  const conv: ConvencionalDto = { id: 10, contactoId: 7, tipo: 'Nacional', departamento: 'Montevideo', adherente: true, fechaInicio: '2026-01-01', condicion: 'Titular', nombreOrganismo: 'X', posicion: '1' };
  const lista: ListaDto = { id: 5, nombre: 'Lista A', tipo: 'ODN', agrupacionId: null };

  beforeEach(() => {
    svc = jasmine.createSpyObj('ConvencionalesService', [
      'getStats', 'getNacionales', 'getListas',
      'createConvencional', 'updateConvencional', 'createLista', 'updateLista',
    ]);
    svc.getStats.and.returnValue(of({ nacionales: 1, departamentales: 0, listasOdn: 0 }));
    svc.getNacionales.and.returnValue(of([conv]));
    svc.getListas.and.returnValue(of([lista]));
    svc.createConvencional.and.returnValue(of(conv));
    svc.updateConvencional.and.returnValue(of(conv));
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

  it('no renderiza botones "no implementado"', () => {
    expect(fixture.nativeElement.innerHTML).not.toContain('no implementado');
  });

  it('abrirNuevoConvencional() abre el modal vacío', () => {
    cmp.abrirNuevoConvencional();
    expect(cmp.modalKind()).toBe('convencional');
    expect(cmp.modalMode()).toBe('nueva');
    expect(cmp.editId()).toBeNull();
    expect(cmp.form.contactoId).toBeNull();
  });

  it('abrirEditarConvencional() precarga el form y el id', () => {
    cmp.abrirEditarConvencional(conv);
    expect(cmp.modalKind()).toBe('convencional');
    expect(cmp.modalMode()).toBe('editar');
    expect(cmp.editId()).toBe(10);
    expect(cmp.form.contactoId).toBe(7);
    expect(cmp.form.adherente).toBeTrue();
  });

  it('guardar (alta convencional) llama createConvencional, cierra y refresca', () => {
    cmp.abrirNuevoConvencional();
    cmp.form.contactoId = 7;
    cmp.form.fechaInicio = '2026-07-04';
    svc.getNacionales.calls.reset();
    cmp.guardar();
    expect(svc.createConvencional).toHaveBeenCalledTimes(1);
    expect(cmp.modalKind()).toBeNull();               // modal cerrado
    expect(svc.getNacionales).toHaveBeenCalled();      // refetch
  });

  it('guardar (edición) llama updateConvencional con el id', () => {
    cmp.abrirEditarConvencional(conv);
    cmp.guardar();
    expect(svc.updateConvencional).toHaveBeenCalledWith(10, jasmine.objectContaining({ contactoId: 7 }));
  });

  it('valida contactoId obligatorio y no llama al service', () => {
    cmp.abrirNuevoConvencional();
    cmp.guardar();
    expect(svc.createConvencional).not.toHaveBeenCalled();
    expect(cmp.modalError()).toContain('Contacto');
    expect(cmp.modalKind()).toBe('convencional');      // sigue abierto
  });

  it('error del backend deja el modal abierto y muestra el mensaje', () => {
    svc.createConvencional.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'ContactoId inválido' } })));
    cmp.abrirNuevoConvencional();
    cmp.form.contactoId = 999;
    cmp.form.fechaInicio = '2026-07-04';
    cmp.guardar();
    expect(cmp.modalKind()).toBe('convencional');
    expect(cmp.modalError()).toBe('ContactoId inválido');
    expect(cmp.modalBusy()).toBeFalse();
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
