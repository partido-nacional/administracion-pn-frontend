import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContactoBuscadorComponent, detalleContacto, etiquetaContacto } from './contacto-buscador.component';
import { ContactosService, ContactoListado } from '../../../features/agenda/contactos.service';

describe('ContactoBuscadorComponent', () => {
  const ana: ContactoListado = { id: 1, nombre: 'Ana', apellido: 'Pérez', cedula: '12345672' };
  let svc: jasmine.SpyObj<ContactosService>;

  function montar() {
    svc = jasmine.createSpyObj('ContactosService', ['listado']);
    TestBed.configureTestingModule({
      imports: [ContactoBuscadorComponent],
      providers: [{ provide: ContactosService, useValue: svc }],
    });
    const f = TestBed.createComponent(ContactoBuscadorComponent);
    f.detectChanges();
    return f.componentInstance;
  }

  const tipear = (c: ContactoBuscadorComponent, v: string) => c.onInput({ target: { value: v } } as any);

  it('etiqueta = "Apellido, Nombre (cédula)"', () => {
    expect(etiquetaContacto(ana)).toBe('Pérez, Ana (12345672)');
    expect(etiquetaContacto({ ...ana, cedula: undefined })).toBe('Pérez, Ana');
  });

  it('cada resultado muestra ID y credencial para distinguir homónimos', () => {
    expect(detalleContacto({ ...ana, credencial: 'BAA27057' })).toBe('#1 · Cred. BAA27057');
    expect(detalleContacto(ana)).toBe('#1');
  });

  it('busca con debounce, una sola vez, con el texto final', fakeAsync(() => {
    const c = montar();
    svc.listado.and.returnValue(of({ items: [ana], total: 1, page: 1, pageSize: 8 }));
    tipear(c, 'pe'); tick(100);
    tipear(c, 'perez'); tick(250);
    expect(svc.listado).toHaveBeenCalledTimes(1);
    expect(svc.listado.calls.mostRecent().args[0].filters).toEqual({ q: 'perez' });
    expect(c.resultados()).toEqual([ana]);
  }));

  it('manda el texto tal cual (nombre y apellido juntos, cédula con puntos, #ID): lo interpreta el backend', fakeAsync(() => {
    const c = montar();
    svc.listado.and.returnValue(of({ items: [], total: 0, page: 1, pageSize: 8 }));
    for (const q of ['Ana Pérez', '1.234.567-2', '#45']) {
      tipear(c, q); tick(250);
      expect(svc.listado.calls.mostRecent().args[0].filters).toEqual({ q });
    }
  }));

  it('elegir emite el contacto y limpia el combo', fakeAsync(() => {
    const c = montar();
    svc.listado.and.returnValue(of({ items: [ana], total: 1, page: 1, pageSize: 8 }));
    const emitido = spyOn(c.seleccionar, 'emit');
    tipear(c, 'ana'); tick(250);
    c.elegir(ana);
    tick(250);
    expect(emitido).toHaveBeenCalledWith(ana);
    expect(c.q()).toBe('');
    expect(c.resultados()).toEqual([]);
  }));

  it('avisa sin coincidencias y un error de red no corta la búsqueda', fakeAsync(() => {
    const c = montar();
    svc.listado.and.returnValues(
      of({ items: [], total: 0, page: 1, pageSize: 8 }),
      throwError(() => new Error('red')),
      of({ items: [ana], total: 1, page: 1, pageSize: 8 }),
    );
    tipear(c, 'zzz'); tick(250);
    expect(c.sinResultados()).toBeTrue();
    tipear(c, 'falla'); tick(250);
    expect(c.resultados()).toEqual([]);
    tipear(c, 'ana'); tick(250);
    expect(c.resultados()).toEqual([ana]);
  }));
});
