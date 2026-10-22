import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FichasAgrupacionComponent } from './fichas-agrupacion.component';
import { ToastService } from '../../core/services/toast.service';

/** Feature 039: el botón Sincronizar trae las solicitudes de agrupación de la web. */
describe('FichasAgrupacionComponent — sincronizar', () => {
  let http: HttpTestingController;
  let toast: jasmine.SpyObj<ToastService>;
  const vacio = { items: [], total: 0, page: 1, pageSize: 25 };

  function montar() {
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      imports: [FichasAgrupacionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ToastService, useValue: toast }],
    });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(FichasAgrupacionComponent);
    f.detectChanges();
    http.expectOne(r => r.url.endsWith('/fichas-agrupacion')).flush(vacio);   // carga inicial
    return f;
  }

  afterEach(() => http.verify());

  describe('editar autoridades', () => {
    const ficha: any = {
      id: 3, nombreAgrupacion: 'Lista Web', tipo: 'DEPARTAMENTAL', sublema1: 'S1',
      autoridades: [
        { id: 1, nombre: 'Ana', apellido: 'Pérez', ci: '12345672', rol: 'Presidente', orden: 1 },
        { id: 2, nombre: 'Luis', apellido: 'Gómez', ci: '45678901', rol: 'Secretaria General', orden: 2 },
      ],
    };

    function rolSelects(f: any): HTMLSelectElement[] {
      return Array.from((f.nativeElement as HTMLElement).querySelectorAll('select[aria-label="Rol"]'));
    }

    it('el Rol usa las 8 opciones de cargo y conserva un rol viejo que no está en la lista', () => {
      const f = montar();
      f.componentInstance.abrirEditar(ficha);
      f.detectChanges();
      const [pres, viejo] = rolSelects(f).map(s => Array.from(s.options).map(o => o.textContent?.trim()));
      expect(pres).toEqual(['Presidente', 'Vicepresidente', 'Tesorero', 'Sec. General', 'Vocal', 'Secretario', 'Protesorero', 'Prosecretario']);
      expect(viejo).toEqual(['Presidente', 'Vicepresidente', 'Tesorero', 'Sec. General', 'Vocal', 'Secretario', 'Protesorero', 'Prosecretario', 'Secretaria General']);
    });

    it('una autoridad nueva arranca como Vocal', () => {
      const c = montar().componentInstance;
      c.abrirEditar(ficha);
      c.agregarAutoridad();
      expect(c.edit.autoridades[2].rol).toBe('Vocal');
    });
  });

  it('POST /sincronizar, avisa cuántas fichas nuevas, muestra la última y recarga', () => {
    const f = montar();
    const c = f.componentInstance;
    c.sincronizar();
    expect(c.syncing()).toBeTrue();
    const req = http.expectOne(r => r.url.endsWith('/fichas-agrupacion/sincronizar'));
    expect(req.request.method).toBe('POST');
    req.flush({ nuevas: 3, duplicadasIgnoradas: 1, desde: '2020-01-01 00:00:00', ultimaSincronizacion: '2026-10-05 18:20:00' });

    expect(toast.success).toHaveBeenCalledWith('3 fichas nuevas.');
    expect(c.syncing()).toBeFalse();
    expect(c.ultimaSincronizacion()).toBe('2026-10-05 18:20:00');
    http.expectOne(r => r.url.endsWith('/fichas-agrupacion')).flush(vacio);   // recarga
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Última solicitud traída: 2026-10-05 18:20:00');
  });

  it('sin novedades → "No hay fichas nuevas."', () => {
    const c = montar().componentInstance;
    c.sincronizar();
    http.expectOne(r => r.url.endsWith('/sincronizar')).flush({ nuevas: 0, duplicadasIgnoradas: 2, desde: 'x', ultimaSincronizacion: null });
    expect(toast.success).toHaveBeenCalledWith('No hay fichas nuevas.');
    http.expectOne(r => r.url.endsWith('/fichas-agrupacion')).flush(vacio);
  });

  it('error de la web → libera el botón, sin aviso de éxito ni recarga (el error lo muestra el interceptor)', () => {
    const c = montar().componentInstance;
    c.sincronizar();
    http.expectOne(r => r.url.endsWith('/sincronizar'))
      .flush({ message: 'La web bloqueó el acceso (403)' }, { status: 502, statusText: 'Bad Gateway' });
    expect(c.syncing()).toBeFalse();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('no dispara dos sincronizaciones a la vez', () => {
    const c = montar().componentInstance;
    c.sincronizar();
    c.sincronizar();
    const reqs = http.match(r => r.url.endsWith('/sincronizar'));
    expect(reqs.length).toBe(1);
    reqs[0].flush({ nuevas: 1, duplicadasIgnoradas: 0, desde: 'x', ultimaSincronizacion: null });
    expect(toast.success).toHaveBeenCalledWith('1 ficha nueva.');
    http.expectOne(r => r.url.endsWith('/fichas-agrupacion')).flush(vacio);
  });
});
