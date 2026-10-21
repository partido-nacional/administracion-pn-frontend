import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProductosComponent } from './productos.component';

/**
 * El "Eliminar" de Ventas y Donaciones no tenía handler, y el form de producto dejaba guardar
 * sin nombre o con precio negativo. Se prueba el DELETE con el id numérico, la cancelación del
 * confirm y la validación previa al POST/PUT.
 */
describe('ProductosComponent — eliminar ventas/donaciones y validar producto', () => {
  let cmp: ProductosComponent;
  let http: HttpTestingController;

  /** reload() dispara los GET de productos, movimientos, ventas, donaciones y stats. */
  const flushGets = () => http.match(r => r.method === 'GET').forEach(r => r.flush(
    r.request.url.includes('/stats') ? {} : { items: [], total: 0, page: 1, pageSize: 25 }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    cmp = TestBed.createComponent(ProductosComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);
    flushGets();
  });

  afterEach(() => http.verify());

  it('eliminarVenta confirma y hace DELETE con el id numérico', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    cmp.eliminarVenta({ id: 'V-2926' } as any);
    const req = http.expectOne(r => r.method === 'DELETE');
    expect(req.request.url).toMatch(/\/ventas\/2926$/);
    req.flush(null);
    flushGets();
  });

  it('eliminarDonacion cancelado no llama al backend', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    cmp.eliminarDonacion({ id: 'D-214' } as any);
    http.expectNone(r => r.method === 'DELETE');
  });

  it('eliminarDonacion hace DELETE con el id numérico', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    cmp.eliminarDonacion({ id: 'D-007' } as any);
    const req = http.expectOne(r => r.method === 'DELETE');
    expect(req.request.url).toMatch(/\/donaciones\/7$/);
    req.flush(null);
    flushGets();
  });

  it('guardar sin nombre no envía nada', () => {
    cmp.formP = { nombre: '   ', precio: 100, activo: true };
    cmp.guardar();
    http.expectNone(r => r.method === 'POST' || r.method === 'PUT');
  });

  it('guardar con precio negativo no envía nada', () => {
    cmp.formP = { nombre: 'Bandera', precio: -5, activo: true };
    cmp.guardar();
    http.expectNone(r => r.method === 'POST' || r.method === 'PUT');
  });

  it('guardar válido hace POST', () => {
    cmp.formP = { nombre: 'Bandera', precio: 0, activo: true };
    cmp.guardar();
    http.expectOne(r => r.method === 'POST' && r.url.endsWith('/productos')).flush({});
    flushGets();
  });

  it('stockPreview acompaña lo que se tipea (no queda congelado)', () => {
    cmp.abrirStock({ id: 1, nombre: 'Bandera', stock: 10 } as any);
    expect(cmp.stockPreview()).toBe(11);          // valor inicial: Alta de 1
    cmp.sForm.cantidad = 4;
    expect(cmp.stockPreview()).toBe(14);
    cmp.sForm.operacion = 'Baja';
    expect(cmp.stockPreview()).toBe(6);
  });
});
