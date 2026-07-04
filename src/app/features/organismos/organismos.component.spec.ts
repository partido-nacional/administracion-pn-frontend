import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { OrganismosComponent } from './organismos.component';
import { OrganismosService } from '../../core/services/organismos.service';
import { OrganismoTodosDto, InfoOrganizacionDto } from '../../core/models/organismos';

describe('OrganismosComponent', () => {
  let fixture: ComponentFixture<OrganismosComponent>;
  let cmp: OrganismosComponent;
  let svc: jasmine.SpyObj<OrganismosService>;

  const orgEstatal: OrganismoTodosDto = { id: 3, ambito: 'Estatal', nombre: 'Min. X', tipoOrganismoId: 2, art44: false, ordenDpto: 1 };
  const orgPart: OrganismoTodosDto = { id: 4, ambito: 'Partidario', nombre: 'Comité Y', tipoOrganismoId: 5, art44: true, ordenDpto: 0 };
  const info: InfoOrganizacionDto = { id: 8, tipoOrganismoId: 2, organismoEstatalId: 3, organismoPartidarioId: null, direccion: 'Calle 1', telefono: '099', email: 'a@b.com', observaciones: null };

  beforeEach(() => {
    svc = jasmine.createSpyObj('OrganismosService', [
      'getTodos', 'getInfo', 'getTipos',
      'createOrganismo', 'updateOrganismo', 'createInfo', 'updateInfo',
    ]);
    svc.getTodos.and.returnValue(of([orgEstatal, orgPart]));
    svc.getInfo.and.returnValue(of([info]));
    svc.getTipos.and.returnValue(of([{ id: 2, nombre: 'Ministerio' }, { id: 5, nombre: 'Comité' }]));
    svc.createOrganismo.and.returnValue(of(orgEstatal));
    svc.updateOrganismo.and.returnValue(of(orgPart));
    svc.createInfo.and.returnValue(of(info));
    svc.updateInfo.and.returnValue(of(info));

    TestBed.configureTestingModule({
      imports: [OrganismosComponent],
      providers: [
        { provide: OrganismosService, useValue: svc },
        provideHttpClient(), provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(OrganismosComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no renderiza botones "no implementado"', () => {
    expect(fixture.nativeElement.innerHTML).not.toContain('no implementado');
  });

  it('carga tipos para el select en el constructor', () => {
    expect(svc.getTipos).toHaveBeenCalled();
    expect(cmp.tipos().length).toBe(2);
  });

  it('abrirNuevoOrganismo() abre el modal en ámbito Estatal', () => {
    cmp.abrirNuevoOrganismo();
    expect(cmp.modalKind()).toBe('organismo');
    expect(cmp.modalMode()).toBe('nueva');
    expect(cmp.form.ambito).toBe('Estatal');
  });

  it('abrirEditarOrganismo() toma el ámbito de la fila', () => {
    cmp.abrirEditarOrganismo(orgPart);
    expect(cmp.form.ambito).toBe('Partidario');
    expect(cmp.editId()).toBe(4);
  });

  it('alta de organismo usa el ámbito elegido (Partidario → update/createOrganismo con "Partidario")', () => {
    cmp.abrirNuevoOrganismo();
    cmp.form.ambito = 'Partidario';
    cmp.form.nombre = 'Nuevo';
    cmp.form.tipoOrganismoId = 5;
    cmp.guardar();
    expect(svc.createOrganismo).toHaveBeenCalledWith('Partidario', jasmine.objectContaining({ nombre: 'Nuevo', tipoOrganismoId: 5 }));
    expect(cmp.modalKind()).toBeNull();
  });

  it('edición de organismo llama updateOrganismo con ámbito + id', () => {
    cmp.abrirEditarOrganismo(orgEstatal);
    cmp.guardar();
    expect(svc.updateOrganismo).toHaveBeenCalledWith('Estatal', 3, jasmine.objectContaining({ nombre: 'Min. X' }));
  });

  it('valida tipoOrganismoId obligatorio', () => {
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = 'Sin tipo';
    cmp.form.tipoOrganismoId = null;
    cmp.guardar();
    expect(svc.createOrganismo).not.toHaveBeenCalled();
    expect(cmp.modalError()).toContain('tipo');
    expect(cmp.modalKind()).toBe('organismo');
  });

  it('error del backend deja el modal abierto y muestra el mensaje', () => {
    svc.createOrganismo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Tipo inválido' } })));
    cmp.abrirNuevoOrganismo();
    cmp.form.nombre = 'X';
    cmp.form.tipoOrganismoId = 99;
    cmp.guardar();
    expect(cmp.modalKind()).toBe('organismo');
    expect(cmp.modalError()).toBe('Tipo inválido');
  });

  it('alta de info llama createInfo y refresca', () => {
    svc.getInfo.calls.reset();
    cmp.abrirNuevaInfo();
    cmp.form.direccion = 'Nueva dir';
    cmp.guardar();
    expect(svc.createInfo).toHaveBeenCalledTimes(1);
    expect(cmp.modalKind()).toBeNull();
    expect(svc.getInfo).toHaveBeenCalled();
  });
});
