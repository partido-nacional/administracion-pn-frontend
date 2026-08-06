import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdhesionesListadoComponent } from './adhesiones-listado.component';
import { AdhesionesService, AdhesionWebDto, AdhesionLocalDto } from './adhesiones.service';

/**
 * Feature 027: las acciones de la grilla eran <a class="action-link"> —texto azul que sólo se
 * subraya al hover— y "Detalle" no tenía handler `(click)`: era markup muerto.
 *
 * El test que más importa acá es "ningún control de acción sin handler": el Detalle inerte pasó
 * inadvertido justamente porque un <a> sin href no se distingue de uno con comportamiento.
 */
describe('AdhesionesListadoComponent', () => {
  let svcSpy: jasmine.SpyObj<AdhesionesService>;

  const filaWeb: AdhesionWebDto = {
    id: 7, nombre: 'Ana', apellido: 'Gomez', cedula: '3684723', estado: 'Pendiente',
  };
  const filaLocal: AdhesionLocalDto = {
    id: 11, idContacto: 3, nombre: 'Luis', apellido: 'Perez',
    aporteConfirmado: true, art46: false,
  };

  beforeEach(() => {
    // `stats` es un signal del componente, no del servicio: lo alimenta HttpClient, que acá
    // absorbe provideHttpClientTesting.
    svcSpy = jasmine.createSpyObj('AdhesionesService',
      ['web', 'locales', 'anualesPorVencer', 'sincronizarWeb']);
    svcSpy.web.and.returnValue(of({ items: [], total: 0, page: 1, pageSize: 20 }));
    svcSpy.locales.and.returnValue(of({ items: [], total: 0, page: 1, pageSize: 20 }));
    svcSpy.anualesPorVencer.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AdhesionesListadoComponent],
      providers: [
        { provide: AdhesionesService, useValue: svcSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  function montar(tab: 'web' | 'locales'): ComponentFixture<AdhesionesListadoComponent> {
    const f = TestBed.createComponent(AdhesionesListadoComponent);
    f.detectChanges();
    f.componentInstance.tab.set(tab);
    if (tab === 'web') f.componentInstance.web.set([filaWeb]);
    else f.componentInstance.locales.set([filaLocal]);
    f.detectChanges();
    return f;
  }

  const acciones = (f: ComponentFixture<AdhesionesListadoComponent>): HTMLElement[] =>
    Array.from(f.nativeElement.querySelectorAll('tbody .action-group > *'));

  // ── US-1: acciones como botones ────────────────────────────
  it('AC-1: la pestaña Web renderiza las acciones como <button>, no <a>', () => {
    const f = montar('web');
    const els = acciones(f);

    expect(els.length).toBe(2);
    els.forEach(e => expect(e.tagName).toBe('BUTTON'));
    expect(f.nativeElement.querySelectorAll('tbody .action-group a').length).toBe(0);
  });

  it('AC-2/BR-3: la pestaña Locales renderiza Eliminar como <button> btn-danger', () => {
    const f = montar('locales');
    const els = acciones(f);

    expect(els.length).toBe(1);
    expect(els[0].tagName).toBe('BUTTON');
    expect(els[0].textContent!.trim()).toBe('Eliminar');
    expect(els[0].classList).toContain('btn-danger');
  });

  it('AC-3/BR-2: la acción destructiva se distingue de las demás', () => {
    const f = montar('web');
    const [pasar, eliminar] = acciones(f);

    expect(eliminar.classList).toContain('btn-danger');
    expect(pasar.classList).not.toContain('btn-danger');
  });

  it('AC-4: los botones usan el tamaño chico, consistente con el resto de la app', () => {
    const f = montar('web');
    acciones(f).forEach(e => {
      expect(e.classList).toContain('btn');
      expect(e.classList).toContain('btn-sm');
    });
  });

  // ── US-2: sin controles inertes ────────────────────────────
  it('AC-6: "Detalle" ya no existe en el DOM', () => {
    const f = montar('web');
    expect(f.nativeElement.textContent).not.toContain('Detalle');
  });

  it('AC-7/BR-1: ningún control de acción queda sin handler', () => {
    // El bug original: <a class="action-link">Detalle</a> sin (click). Angular expone los
    // listeners bindeados en el atributo de debug, asi que se verifica por DebugElement.
    for (const tab of ['web', 'locales'] as const) {
      const f = montar(tab);
      const controles = f.debugElement.nativeElement.querySelectorAll('tbody .action-group > *');
      expect(controles.length).toBeGreaterThan(0);

      const debugControles = f.debugElement.queryAll(
        ({ nativeElement }) => nativeElement?.closest?.('tbody .action-group') != null);
      const conClick = debugControles.filter(d => d.listeners.some(l => l.name === 'click'));
      expect(conClick.length)
        .withContext(`pestaña ${tab}: hay controles sin (click)`)
        .toBe(controles.length);
    }
  });

  // ── AC-5: comportamiento sin cambios ───────────────────────
  it('AC-5: "Pasar a Local" invoca pasar() con el id de la fila', () => {
    const f = montar('web');
    const spy = spyOn(f.componentInstance, 'pasar');

    acciones(f)[0].click();

    expect(spy).toHaveBeenCalledOnceWith(filaWeb.id);
  });

  it('AC-5: "Eliminar" invoca eliminarWeb() con el id de la fila', () => {
    const f = montar('web');
    const spy = spyOn(f.componentInstance, 'eliminarWeb');

    acciones(f)[1].click();

    expect(spy).toHaveBeenCalledOnceWith(filaWeb.id);
  });

  it('AC-5: en Locales, "Eliminar" invoca eliminarLocal() con el id de la fila', () => {
    const f = montar('locales');
    const spy = spyOn(f.componentInstance, 'eliminarLocal');

    acciones(f)[0].click();

    expect(spy).toHaveBeenCalledOnceWith(filaLocal.id);
  });
});
