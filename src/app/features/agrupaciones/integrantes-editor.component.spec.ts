import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IntegranteEditable, IntegrantesEditorComponent, integrantesParaGuardar } from './integrantes-editor.component';
import { ToastService } from '../../core/services/toast.service';
import { ContactosService } from '../agenda/contactos.service';

/** Editor de integrantes compartido por el alta de una agrupación y la edición de una pendiente. */
describe('IntegrantesEditorComponent', () => {
  const ana: any = { id: 1, nombre: 'Ana', apellido: 'Pérez', cedula: '12345672', adherente: true };
  const luis: any = { id: 2, nombre: 'Luis', apellido: 'Gómez', adherente: false, adhesion: 'Baja' };
  let f: ComponentFixture<IntegrantesEditorComponent>;
  let c: IntegrantesEditorComponent;
  let toast: jasmine.SpyObj<ToastService>;
  let emitidas: IntegranteEditable[][];

  beforeEach(() => {
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    const contactos = jasmine.createSpyObj('ContactosService', ['listado']);
    contactos.listado.and.returnValue(of({ items: [], total: 0, page: 1, pageSize: 8 }));
    TestBed.configureTestingModule({
      imports: [IntegrantesEditorComponent],
      providers: [{ provide: ToastService, useValue: toast }, { provide: ContactosService, useValue: contactos }],
    });
    f = TestBed.createComponent(IntegrantesEditorComponent);
    c = f.componentInstance;
    emitidas = [];
    c.integrantesChange.subscribe(l => emitidas.push(l));
    f.detectChanges();
  });

  const html = () => f.nativeElement as HTMLElement;

  it('agrega con la fecha de hoy, evita repetidos y quita', () => {
    c.agregar(ana);
    c.agregar(luis);
    c.agregar(ana);
    expect(c.integrantes.map(i => i.contacto.id)).toEqual([1, 2]);
    expect(c.integrantes[0].fechaIngreso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toast.error).toHaveBeenCalledWith('Pérez, Ana (12345672) ya está en la lista.');
    c.quitar(1);
    expect(emitidas.at(-1)!.map(i => i.contacto.id)).toEqual([2]);
  });

  it('Adh. marcado solo para los adheridos, aviso en los que no y resumen', () => {
    c.agregar(ana);
    c.agregar(luis);
    f.detectChanges();
    const checks = Array.from(html().querySelectorAll<HTMLInputElement>('input.adh'));
    expect(checks.map(x => x.checked)).toEqual([true, false]);
    expect(checks.every(x => x.disabled)).toBeTrue();   // sale del contacto, no se tilda a mano
    expect(Array.from(html().querySelectorAll('.aviso-adh')).map(e => e.textContent?.trim())).toEqual(['No adherido (Baja)']);
    expect(html().querySelector('.ie-resumen')?.textContent?.trim()).toBe('Adheridos: 1 de 2');
  });

  it('Cargo es un desplegable con las 8 opciones y conserva un cargo viejo', () => {
    c.integrantes = [{ contacto: ana, cargo: 'Secretario General', fechaIngreso: '' }];
    f.detectChanges();
    const select = html().querySelector('select[aria-label="Cargo"]') as HTMLSelectElement;
    expect(Array.from(select.options).map(o => o.textContent?.trim())).toEqual([
      '—', 'Presidente', 'Vicepresidente', 'Tesorero', 'Sec. General', 'Vocal', 'Secretario', 'Protesorero', 'Prosecretario',
      'Secretario General',
    ]);
  });

  it('integrantesParaGuardar: cargo y fecha vacíos van como null', () => {
    expect(integrantesParaGuardar([
      { contacto: ana, cargo: ' Presidente ', fechaIngreso: '2026-10-01' },
      { contacto: luis, cargo: '', fechaIngreso: '' },
    ])).toEqual([
      { contactoId: 1, cargo: 'Presidente', fechaIngreso: '2026-10-01' },
      { contactoId: 2, cargo: null, fechaIngreso: null },
    ]);
  });
});
