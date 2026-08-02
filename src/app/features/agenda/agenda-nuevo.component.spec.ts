import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { AgendaNuevoComponent } from './agenda-nuevo.component';
import { ContactosService, Contacto } from './contactos.service';

// Copia independiente del catálogo: si alguien toca CORTESIAS en el componente,
// este test lo detecta en lugar de acompañar el cambio en silencio.
const CATALOGO = [
  'Arq.', 'Cnel.', 'Cnel. (R)', 'Cr.', 'Cra.', 'Dr.', 'Dr. Esc.', 'Dra.', 'Dra. Esc.',
  'Ec.', 'Ec. Cr.', 'Esc.', 'Gral.', 'Gral. (R)', 'Ing.', 'Ing. Agr.', 'Ing. Agrim.',
  'Lic.', 'Mag.', 'Mtra.', 'Mtro.', 'Prof.', 'Psic.', 'QF.', 'Soc.', 'Sr.', 'Sra.',
  'Tte. Gral.'
];

describe('AgendaNuevoComponent', () => {
  let svcSpy: jasmine.SpyObj<ContactosService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let paramId: string | null;

  const base: Partial<Contacto> = { id: 7, nombre: 'Luis', apellido: 'Perez', activo: true };

  beforeEach(() => {
    paramId = null;
    svcSpy = jasmine.createSpyObj('ContactosService', ['get', 'create', 'update']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const route = { snapshot: { paramMap: { get: (_: string) => paramId } } };

    TestBed.configureTestingModule({
      imports: [AgendaNuevoComponent],
      providers: [
        { provide: ContactosService, useValue: svcSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
  });

  /** Monta el componente en alta (sin id) o en edición con el contacto ya resuelto. */
  function montar(contacto?: Partial<Contacto>): ComponentFixture<AgendaNuevoComponent> {
    if (contacto) {
      paramId = String(contacto.id ?? 7);
      svcSpy.get.and.returnValue(of(contacto as Contacto));
    }
    const f = TestBed.createComponent(AgendaNuevoComponent);
    f.detectChanges();
    return f;
  }

  function opciones(f: ComponentFixture<AgendaNuevoComponent>, name: string): string[] {
    const nodes = f.nativeElement.querySelectorAll(`select[name=${name}] option`);
    return Array.from(nodes).map((o: any) => o.textContent.trim());
  }

  function selectDepCred(f: ComponentFixture<AgendaNuevoComponent>): HTMLSelectElement {
    return f.nativeElement.querySelector('select[name=depCred]');
  }

  /** Simula el (input) de la credencial sin depender del DOM real. */
  function credencialEvent(valor: string): Event {
    const input = document.createElement('input');
    input.value = valor;
    return { target: input } as unknown as Event;
  }

  // ── US-1: catálogo de cortesías ────────────────────────────
  it('AC-1/AC-2: el select lista el vacío + los 28 valores del catálogo, sin Srta.', () => {
    const f = montar();
    const opts = opciones(f, 'cortesia');
    expect(opts.length).toBe(29);
    expect(opts[0]).toBe('—');
    expect(opts.slice(1)).toEqual(CATALOGO);
    expect(opts).not.toContain('Srta.');
  });

  it('AC-3: cortesía dentro del catálogo queda seleccionada y no agrega opción extra', fakeAsync(() => {
    const f = montar({ ...base, cortesia: 'Dr.' });
    tick();
    f.detectChanges();
    expect(opciones(f, 'cortesia').length).toBe(29);
    const select: HTMLSelectElement = f.nativeElement.querySelector('select[name=cortesia]');
    expect(select.selectedOptions[0].textContent!.trim()).toBe('Dr.');
  }));

  it('AC-4: cortesía fuera del catálogo se ofrece como opción extra al final y queda seleccionada', fakeAsync(() => {
    const f = montar({ ...base, cortesia: 'Srta.' });
    tick();
    f.detectChanges();
    const opts = opciones(f, 'cortesia');
    expect(opts.length).toBe(30);
    expect(opts[opts.length - 1]).toBe('Srta.');
    const select: HTMLSelectElement = f.nativeElement.querySelector('select[name=cortesia]');
    expect(select.selectedOptions[0].textContent!.trim()).toBe('Srta.');
    expect(f.componentInstance.c.cortesia).toBe('Srta.');
  }));

  it('AC-5: al elegir un valor del catálogo, la opción legacy desaparece', () => {
    const f = montar({ ...base, cortesia: 'Srta.' });
    expect(opciones(f, 'cortesia')).toContain('Srta.');

    f.componentInstance.c.cortesia = 'Sra.';
    f.detectChanges();

    const opts = opciones(f, 'cortesia');
    expect(opts.length).toBe(29);
    expect(opts).not.toContain('Srta.');
  });

  // ── US-2: bloqueo del depto credencial ─────────────────────
  it('AC-7/AC-11: sin credencial el select está habilitado', fakeAsync(() => {
    const f = montar();
    tick();
    f.detectChanges();
    expect(f.componentInstance.depCredBloqueado()).toBeFalse();
    expect(selectDepCred(f).disabled).toBeFalse();
  }));

  it('AC-10/EC-2: en edición queda bloqueado apenas llega el contacto, sin tocar la credencial', fakeAsync(() => {
    const llega = new Subject<Contacto>();
    paramId = '7';
    svcSpy.get.and.returnValue(llega.asObservable());

    const f = TestBed.createComponent(AgendaNuevoComponent);
    f.detectChanges();
    tick();
    expect(f.componentInstance.depCredBloqueado()).toBeFalse();
    expect(selectDepCred(f).disabled).toBeFalse();

    llega.next({ ...base, credencialCivica: 'ABC123456', departamentoCredencial: 'Montevideo' } as Contacto);
    f.detectChanges();
    tick();
    f.detectChanges();

    expect(f.componentInstance.depCredBloqueado()).toBeTrue();
    expect(selectDepCred(f).disabled).toBeTrue();
  }));

  it('AC-8: un solo carácter en la credencial ya bloquea el campo', fakeAsync(() => {
    const f = montar();
    f.componentInstance.onCredencialInput(credencialEvent('A'));
    f.detectChanges();
    tick();
    f.detectChanges();
    expect(f.componentInstance.depCredBloqueado()).toBeTrue();
    expect(selectDepCred(f).disabled).toBeTrue();
  }));

  it('AC-9: la primera letra deriva el departamento (E → Rocha)', () => {
    const f = montar();
    f.componentInstance.onCredencialInput(credencialEvent('ebc123'));
    expect(f.componentInstance.c.credencialCivica).toBe('EBC123');
    expect(f.componentInstance.c.departamentoCredencial).toBe('Rocha');
  });

  it('AC-12/BR-5: borrar la credencial desbloquea y retiene el departamento', fakeAsync(() => {
    const f = montar({ ...base, credencialCivica: 'ABC123', departamentoCredencial: 'Montevideo' });
    tick();
    f.detectChanges();
    expect(f.componentInstance.depCredBloqueado()).toBeTrue();
    expect(selectDepCred(f).disabled).toBeTrue();

    f.componentInstance.onCredencialInput(credencialEvent(''));
    f.detectChanges();
    tick();
    f.detectChanges();

    expect(f.componentInstance.depCredBloqueado()).toBeFalse();
    expect(f.componentInstance.c.departamentoCredencial).toBe('Montevideo');
    expect(selectDepCred(f).disabled).toBeFalse();
  }));

  it('EC-4: letra fuera de credencialMap bloquea y limpia el departamento', () => {
    const f = montar();
    f.componentInstance.c.departamentoCredencial = 'Rocha';
    f.componentInstance.onCredencialInput(credencialEvent('UAB123'));
    expect(f.componentInstance.depCredBloqueado()).toBeTrue();
    expect(f.componentInstance.c.departamentoCredencial).toBe('');
  });

  it('AC-13: el departamento se envía al backend aunque el control esté deshabilitado', fakeAsync(() => {
    svcSpy.create.and.returnValue(of({} as Contacto));
    const f = montar();
    const cmp = f.componentInstance;

    cmp.c = { ...base, id: undefined, credencialCivica: 'ABC123', departamentoCredencial: 'Montevideo' };
    f.detectChanges();
    tick();
    f.detectChanges();

    expect(selectDepCred(f).disabled).toBeTrue();

    const form = f.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
    cmp.guardar(form);
    tick();

    expect(svcSpy.create).toHaveBeenCalledTimes(1);
    expect(svcSpy.create.calls.mostRecent().args[0])
      .toEqual(jasmine.objectContaining({ departamentoCredencial: 'Montevideo' }));
  }));
});
