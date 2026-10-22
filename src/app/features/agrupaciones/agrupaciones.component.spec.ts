import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AgrupacionesComponent } from './agrupaciones.component';
import { ToastService } from '../../core/services/toast.service';

/** Alta con código correlativo propuesto, N° Trámite y eliminar con cartel de confirmación. */
describe('AgrupacionesComponent', () => {
  let http: HttpTestingController;
  let toast: jasmine.SpyObj<ToastService>;
  const agrup: any = { id: 7, nombre: 'Lista X', codAgrup: '6324', pendiente: false, solic: 0, codDepto: '', tipo: '' };
  const pagina = { items: [agrup], total: 1, page: 1, pageSize: 25 };

  function montar() {
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      imports: [AgrupacionesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ToastService, useValue: toast }],
    });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(AgrupacionesComponent);
    f.detectChanges();
    http.expectOne(r => r.url.endsWith('/agrupaciones')).flush(pagina);   // carga inicial
    f.detectChanges();
    return f;
  }

  afterEach(() => http.verify());

  describe('Nueva agrupación', () => {
    it('propone el siguiente código y no muestra Solic. ni Fecha Circ. C.E.', () => {
      const f = montar();
      const c = f.componentInstance;
      c.abrirNueva();
      http.expectOne(r => r.url.endsWith('/agrupaciones/siguiente-codigo')).flush({ codigo: '6325' });
      f.detectChanges();

      expect(c.nuevoForm.codAgrup).toBe('6325');
      const labels = Array.from((f.nativeElement as HTMLElement).querySelectorAll('.nv-modal label')).map(l => l.textContent?.trim());
      expect(labels).toContain('N° Trámite');
      expect(labels).not.toContain('Solic.');
      expect(labels).not.toContain('Fecha Circ. C.E.');
    });

    it('no pisa un código que el operador ya escribió', () => {
      const f = montar();
      const c = f.componentInstance;
      c.abrirNueva();
      c.nuevoForm.codAgrup = '9000';
      http.expectOne(r => r.url.endsWith('/agrupaciones/siguiente-codigo')).flush({ codigo: '6325' });
      expect(c.nuevoForm.codAgrup).toBe('9000');
    });

    it('si falla el pedido del código queda vacío (lo asigna el backend)', () => {
      const f = montar();
      const c = f.componentInstance;
      c.abrirNueva();
      http.expectOne(r => r.url.endsWith('/agrupaciones/siguiente-codigo')).flush(null, { status: 500, statusText: 'Error' });
      expect(c.nuevoForm.codAgrup).toBe('');
    });
  });

  describe('Editar', () => {
    it('reenvía la Fecha Circ. C.E. guardada aunque ya no tenga campo', () => {
      const f = montar();
      const c = f.componentInstance;
      c.abrirEditar({ ...agrup, fechaCircCE: '01/05/2020', nroTramite: '15' });
      c.nuevoForm.nombre = 'Lista X';
      c.guardarNueva();
      const req = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/agrupaciones/7'));
      expect(req.request.body.fechaCircCE).toBe('2020-05-01');
      expect(req.request.body.nroTramite).toBe('15');
      req.flush(null);
      http.expectOne(r => r.url.endsWith('/agrupaciones')).flush(pagina);
    });
  });

  describe('Eliminar', () => {
    it('el botón Eliminar abre el cartel y no borra nada todavía', () => {
      const f = montar();
      const btn = Array.from((f.nativeElement as HTMLElement).querySelectorAll('button'))
        .find(b => b.textContent?.trim() === 'Eliminar') as HTMLButtonElement;
      btn.click();
      f.detectChanges();

      expect(f.componentInstance.aEliminar()).toEqual(agrup);
      const dialog = (f.nativeElement as HTMLElement).querySelector('app-confirm-dialog');
      expect(dialog?.textContent).toContain('Lista X');
      expect(dialog?.textContent).toContain('no se puede deshacer');
      http.expectNone(r => r.method === 'DELETE');
    });

    it('cancelar cierra el cartel sin llamar al backend', () => {
      const f = montar();
      const c = f.componentInstance;
      c.pedirEliminar(agrup);
      c.cancelarEliminar();
      expect(c.aEliminar()).toBeNull();
      http.expectNone(r => r.method === 'DELETE');
    });

    it('confirmar hace DELETE, avisa y recarga la grilla', () => {
      const f = montar();
      const c = f.componentInstance;
      c.pedirEliminar(agrup);
      c.confirmarEliminar();
      expect(c.eliminarBusy()).toBeTrue();
      http.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/agrupaciones/7')).flush(null);

      expect(c.aEliminar()).toBeNull();
      expect(toast.success).toHaveBeenCalledWith('Agrupación "Lista X" eliminada.');
      http.expectOne(r => r.url.endsWith('/agrupaciones')).flush({ ...pagina, items: [], total: 0 });
    });

    it('si el backend falla, el cartel queda abierto con el error', () => {
      const f = montar();
      const c = f.componentInstance;
      c.pedirEliminar(agrup);
      c.confirmarEliminar();
      http.expectOne(r => r.method === 'DELETE').flush({ message: 'Sin permiso' }, { status: 403, statusText: 'Forbidden' });

      expect(c.aEliminar()).toEqual(agrup);
      expect(c.eliminarBusy()).toBeFalse();
      expect(c.eliminarError()).toBe('Sin permiso');
    });
  });
  describe('Integrantes en el alta', () => {
    const ana: any = { id: 1, nombre: 'Ana', apellido: 'Pérez', cedula: '12345672' };
    const luis: any = { id: 2, nombre: 'Luis', apellido: 'Gómez' };

    function abrir() {
      const f = montar();
      const c = f.componentInstance;
      c.abrirNueva();
      http.expectOne(r => r.url.endsWith('/agrupaciones/siguiente-codigo')).flush({ codigo: '6325' });
      f.detectChanges();
      return { f, c };
    }

    it('agrega, evita repetidos y quita', () => {
      const { c } = abrir();
      c.agregarIntegrante(ana);
      c.agregarIntegrante(luis);
      c.agregarIntegrante(ana);
      expect(c.integrantesNuevos().map(i => i.contacto.id)).toEqual([1, 2]);
      expect(toast.error).toHaveBeenCalled();
      c.quitarIntegrante(1);
      expect(c.integrantesNuevos().map(i => i.contacto.id)).toEqual([2]);
    });

    it('el alta manda los integrantes con cargo y fecha', () => {
      const { c } = abrir();
      c.nuevoForm.nombre = 'Lista Nueva';
      c.agregarIntegrante(ana);
      c.integrantesNuevos()[0].cargo = 'Presidente';
      c.integrantesNuevos()[0].fechaIngreso = '2026-10-01';
      c.agregarIntegrante(luis);
      c.integrantesNuevos()[1].fechaIngreso = '';
      c.guardarNueva();

      const req = http.expectOne(r => r.method === 'POST' && r.url.endsWith('/agrupaciones-pendientes/nueva'));
      expect(req.request.body.integrantes).toEqual([
        { contactoId: 1, cargo: 'Presidente', fechaIngreso: '2026-10-01' },
        { contactoId: 2, cargo: null, fechaIngreso: null },
      ]);
      req.flush({ agrupacionId: 9, periodoId: 9, nombre: 'Lista Nueva', integrantes: 2 });
    });

    it('Cargo es un desplegable con las 8 opciones', () => {
      const { f, c } = abrir();
      c.agregarIntegrante(ana);
      f.detectChanges();
      const select = (f.nativeElement as HTMLElement).querySelector('.int-alta-table select') as HTMLSelectElement;
      expect(select).toBeTruthy();
      expect(Array.from(select.options).map(o => o.textContent?.trim())).toEqual([
        '—', 'Presidente', 'Vicepresidente', 'Tesorero', 'Sec. General', 'Vocal', 'Secretario', 'Protesorero', 'Prosecretario',
      ]);
      expect((f.nativeElement as HTMLElement).querySelector('.int-alta-table input[placeholder="Cargo"]')).toBeNull();
    });

    it('al reabrir la lista arranca vacía y editar no manda integrantes', () => {
      const { c } = abrir();
      c.agregarIntegrante(ana);
      c.cerrarNueva();
      c.abrirNueva();
      http.expectOne(r => r.url.endsWith('/agrupaciones/siguiente-codigo')).flush({ codigo: '6325' });
      expect(c.integrantesNuevos()).toEqual([]);

      c.cerrarNueva();
      c.abrirEditar(agrup);
      c.guardarNueva();
      const req = http.expectOne(r => r.method === 'PUT');
      expect(req.request.body.integrantes).toBeUndefined();
      req.flush(null);
      http.expectOne(r => r.url.endsWith('/agrupaciones')).flush(pagina);
    });
  });
});
