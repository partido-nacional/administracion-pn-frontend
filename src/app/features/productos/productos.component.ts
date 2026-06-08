import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { AuthService } from '../../core/auth.service';

interface ProductoListado {
  id: number; nombre: string; descripcion?: string; precio: number;
  stock: number; estado: string; activo: boolean; categoria?: string;
}
interface Stats { productosActivos: number; unidadesStock: number; ventasMes: number; donacionesMes: number; }
interface Movimiento { fecha: string; producto: string; tipo: string; cantidad: number; motivo: string; observaciones: string; }
interface Venta { id: string; fecha: string; producto: string; cantidad: number; precioUnit: number; total: number; comprador: string; vendedor: string; metodoPago: string; nroRecibo: string; }
interface Donacion { id: string; fecha: string; producto: string; cantidad: number; destinatario: string; observaciones: string; }

type Tab = 'gestion' | 'listar' | 'ventas' | 'donaciones' | 'form';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tabs">
      <a class="tab" [class.active]="tab()==='gestion'"     (click)="tab.set('gestion')">Gestion Productos</a>
      <a class="tab" [class.active]="tab()==='listar'"      (click)="tab.set('listar')">Listar Productos</a>
      <a class="tab" [class.active]="tab()==='ventas'"      (click)="tab.set('ventas')">Listar Ventas</a>
      <a class="tab" [class.active]="tab()==='donaciones'"  (click)="tab.set('donaciones')">Listar Donaciones</a>
    </div>

    @if (tab() === 'gestion') {
      <div class="toolbar" style="flex-wrap:wrap; gap:12px">
        <div class="toolbar-left" style="gap:12px; flex-wrap:wrap; align-items:center">
          <label style="font-size:13px; font-weight:500; color:var(--gray-600)">Fecha desde</label>
          <input type="date" class="form-input" style="width:150px; padding:6px 10px; font-size:13px">
          <label style="font-size:13px; font-weight:500; color:var(--gray-600)">hasta</label>
          <input type="date" class="form-input" style="width:150px; padding:6px 10px; font-size:13px">
          <button class="btn btn-primary" style="padding:6px 16px; font-size:13px">Generar reporte para periodo</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">{{ stats()?.productosActivos ?? 0 }}</div><div class="stat-label">Productos Activos</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats()?.unidadesStock ?? 0 }}</div><div class="stat-label">Unidades en Stock</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats()?.ventasMes ?? 0 }}</div><div class="stat-label">Ventas este mes</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats()?.donacionesMes ?? 0 }}</div><div class="stat-label">Donaciones este mes</div></div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th><th>Observaciones</th>
              </tr>
              <tr class="filter-row">
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fmFecha"></th>
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fmProducto"></th>
                <th>
                  <select class="column-filter" [(ngModel)]="fmTipo">
                    <option value="">Todos</option><option>Alta</option><option>Baja</option>
                  </select>
                </th>
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fmCantidad"></th>
                <th>
                  <select class="column-filter" [(ngModel)]="fmMotivo">
                    <option value="">Todos</option><option>Ingreso</option><option>Venta</option><option>Donacion</option><option>Ajuste</option>
                  </select>
                </th>
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fmObs"></th>
              </tr>
            </thead>
            <tbody>
              @for (m of movimientosFiltrados(); track $index) {
                <tr>
                  <td>{{ m.fecha }}</td>
                  <td><strong>{{ m.producto }}</strong></td>
                  <td><span class="badge" [class.status-active]="m.tipo==='Alta'" [class.status-rejected]="m.tipo==='Baja'">{{ m.tipo }}</span></td>
                  <td>{{ m.cantidad }}</td>
                  <td>{{ m.motivo }}</td>
                  <td>{{ m.observaciones }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6"><div class="empty-state"><div class="empty-state-text">Sin movimientos</div></div></td></tr>
              }
            </tbody>
          </table>
          <div class="pagination" style="padding:16px 24px">
            <span class="pagination-info">Mostrando 1–{{ movimientosFiltrados().length }} de {{ movimientos().length }} movimientos</span>
            <div class="pagination-buttons">
              <button class="page-btn">&lt;</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'listar') {
      <div class="topbar-inline">
        <button class="btn btn-primary" (click)="nuevoProducto()">+ Nuevo Producto</button>
      </div>
      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table">
            <thead>
              <tr>
                <th>Id</th><th>Producto</th><th>Descripcion</th><th>Precio Unitario</th><th>Stock</th><th>Estado</th><th></th>
              </tr>
              <tr class="filter-row">
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fpId"></th>
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fpNombre"></th>
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fpDesc"></th>
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fpPrecio"></th>
                <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fpStock"></th>
                <th>
                  <select class="column-filter" [(ngModel)]="fpEstado">
                    <option value="">Todos</option><option>Disponible</option><option>Sin stock</option><option>Stock bajo</option>
                  </select>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of productosFiltrados(); track p.id) {
                <tr>
                  <td><strong>{{ p.id }}</strong></td>
                  <td>{{ p.nombre }}</td>
                  <td>{{ p.descripcion }}</td>
                  <td>\${{ p.precio }}</td>
                  <td>{{ p.stock }}</td>
                  <td>
                    <span class="badge"
                      [class.status-active]="p.estado==='Disponible'"
                      [class.status-rejected]="p.estado==='Sin stock'"
                      [class.status-pending]="p.estado==='Stock bajo'">{{ p.estado }}</span>
                  </td>
                  <td>
                    <div class="action-group">
                      <a class="action-link" (click)="editarProducto(p)">Editar</a>
                      <a class="action-link">Stock</a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7"><div class="empty-state"><div class="empty-state-text">Sin productos</div></div></td></tr>
              }
            </tbody>
          </table>
          <div class="pagination" style="padding:16px 24px">
            <span class="pagination-info">Mostrando 1–{{ productosFiltrados().length }} de {{ productos().length }} productos</span>
            <div class="pagination-buttons">
              <button class="page-btn">&lt;</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'ventas') {
      <div class="toolbar" style="flex-wrap:wrap; gap:12px">
        <div class="toolbar-left" style="gap:12px; flex-wrap:wrap; align-items:center">
          <label style="font-size:13px; font-weight:500; color:var(--gray-600)">Fecha desde</label>
          <input type="date" class="form-input" style="width:150px; padding:6px 10px; font-size:13px">
          <label style="font-size:13px; font-weight:500; color:var(--gray-600)">hasta</label>
          <input type="date" class="form-input" style="width:150px; padding:6px 10px; font-size:13px">
          <input type="text" class="form-input" placeholder="Filtrar por comprador..." style="width:220px; padding:6px 10px; font-size:13px" [(ngModel)]="fvComprador">
          <button class="btn btn-primary" style="padding:6px 16px; font-size:13px">Filtrar</button>
        </div>
        <button class="btn btn-primary" (click)="abrirNuevaVenta()">+ Nueva Venta</button>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table">
            <thead>
              <tr><th>ID</th><th>Fecha</th><th>Producto</th><th>Unidades</th><th>Precio Unit.</th><th>Recaudación</th><th>Nro. Recibo</th><th>Método Pago</th><th>Vendedor</th><th></th></tr>
            </thead>
            <tbody>
              @for (v of ventasFiltradas(); track v.id) {
                <tr>
                  <td>{{ v.id }}</td>
                  <td>{{ v.fecha }}</td>
                  <td><strong>{{ v.producto }}</strong></td>
                  <td>{{ v.cantidad }}</td>
                  <td>\${{ v.precioUnit }}</td>
                  <td><strong>\${{ v.total }}</strong></td>
                  <td>{{ v.nroRecibo || '—' }}</td>
                  <td>{{ v.metodoPago || '—' }}</td>
                  <td>{{ v.vendedor || '—' }}</td>
                  <td><a class="action-link" style="color:var(--danger)">Eliminar</a></td>
                </tr>
              } @empty {
                <tr><td colspan="10"><div class="empty-state"><div class="empty-state-text">Sin ventas</div></div></td></tr>
              }
            </tbody>
          </table>
          <div class="pagination" style="padding:16px 24px">
            <span class="pagination-info">Mostrando 1–{{ ventasFiltradas().length }} de {{ ventas().length }} ventas</span>
            <div class="pagination-buttons">
              <button class="page-btn">&lt;</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'donaciones') {
      <div class="toolbar" style="flex-wrap:wrap; gap:12px">
        <div class="toolbar-left" style="gap:12px; flex-wrap:wrap; align-items:center">
          <label style="font-size:13px; font-weight:500; color:var(--gray-600)">Fecha desde</label>
          <input type="date" class="form-input" style="width:150px; padding:6px 10px; font-size:13px">
          <label style="font-size:13px; font-weight:500; color:var(--gray-600)">hasta</label>
          <input type="date" class="form-input" style="width:150px; padding:6px 10px; font-size:13px">
          <input type="text" class="form-input" placeholder="Filtrar por destinatario..." style="width:220px; padding:6px 10px; font-size:13px" [(ngModel)]="fdDest">
          <button class="btn btn-primary" style="padding:6px 16px; font-size:13px">Filtrar</button>
        </div>
        <button class="btn btn-primary">+ Nueva Donacion</button>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table">
            <thead>
              <tr><th>ID</th><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Destinatario</th><th>Observaciones</th><th></th></tr>
            </thead>
            <tbody>
              @for (d of donacionesFiltradas(); track d.id) {
                <tr>
                  <td>{{ d.id }}</td>
                  <td>{{ d.fecha }}</td>
                  <td><strong>{{ d.producto }}</strong></td>
                  <td>{{ d.cantidad }}</td>
                  <td>{{ d.destinatario }}</td>
                  <td>{{ d.observaciones }}</td>
                  <td><a class="action-link" style="color:var(--danger)">Eliminar</a></td>
                </tr>
              } @empty {
                <tr><td colspan="7"><div class="empty-state"><div class="empty-state-text">Sin donaciones</div></div></td></tr>
              }
            </tbody>
          </table>
          <div class="pagination" style="padding:16px 24px">
            <span class="pagination-info">Mostrando 1–{{ donacionesFiltradas().length }} de {{ donaciones().length }} donaciones</span>
            <div class="pagination-buttons">
              <button class="page-btn">&lt;</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'form') {
      <div style="max-width:600px">
        <div class="card">
          <div class="card-header"><h2 class="card-title">{{ formP.id ? 'Editar' : 'Nuevo' }} producto</h2></div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Nombre *</label><input class="form-input" name="n" [(ngModel)]="formP.nombre"></div>
              <div class="form-group"><label class="form-label">Categoria</label><input class="form-input" name="c" [(ngModel)]="formP.categoria"></div>
              <div class="form-group"><label class="form-label">Precio *</label><input class="form-input" type="number" step="0.01" name="p" [(ngModel)]="formP.precio"></div>
              <div class="form-group full-width"><label class="form-label">Descripcion</label><textarea class="form-textarea" name="d" [(ngModel)]="formP.descripcion"></textarea></div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" (click)="guardar()">Guardar</button>
              <button class="btn btn-secondary" (click)="volver()">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (modalVenta()) {
      <div class="vm-backdrop" (click)="cerrarNuevaVenta()">
        <div class="vm" (click)="$event.stopPropagation()">
          <div class="vm-header">
            <div class="vm-title">Nueva Venta</div>
            <button class="vm-close" (click)="cerrarNuevaVenta()">×</button>
          </div>
          <div class="vm-body">
            <div class="vm-fg">
              <label>Producto *</label>
              <select [(ngModel)]="vForm.productoId" name="vProd">
                <option [ngValue]="null">— Seleccionar —</option>
                @for (p of productos(); track p.id) {
                  <option [ngValue]="p.id">{{ p.nombre }} (\${{ p.precio }})</option>
                }
              </select>
            </div>
            <div class="vm-row">
              <div class="vm-fg"><label>Unidades *</label><input type="number" min="1" [(ngModel)]="vForm.unidades" name="vUni"></div>
              <div class="vm-fg"><label>Recaudación * ($)</label><input type="number" min="0" step="0.01" [(ngModel)]="vForm.recaudacion" name="vRec"></div>
            </div>
            <div class="vm-fg"><label>Nro. de recibo</label><input [(ngModel)]="vForm.nroRecibo" name="vRec1"></div>
            <div class="vm-fg">
              <label>Método de pago *</label>
              <select [(ngModel)]="vForm.metodoPago" name="vMet">
                <option value="">— Seleccionar —</option>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta Débito</option>
                <option>Tarjeta Crédito</option>
                <option>Cheque</option>
                <option>MercadoPago</option>
                <option>Otro</option>
              </select>
            </div>
            <small class="vm-info">
              Se registra automáticamente: <strong>{{ ahora() }}</strong>
              · vendedor: <strong>{{ usuario() }}</strong>
            </small>
            @if (vError()) { <div class="vm-err">{{ vError() }}</div> }
          </div>
          <div class="vm-footer">
            <button class="btn btn-secondary" (click)="cerrarNuevaVenta()">Cancelar</button>
            <button class="btn btn-primary" (click)="guardarVenta()" [disabled]="vBusy()">
              {{ vBusy() ? 'Guardando…' : 'Guardar venta' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
    .vm-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.55);
      display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;
    }
    .vm {
      background:#fff; border-radius:10px; width:min(480px, 100%);
      display:flex; flex-direction:column; box-shadow:0 20px 50px rgba(0,0,0,.3);
      overflow:hidden;
    }
    .vm-header { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:#1e3a8a; color:#fff; }
    .vm-title { font-size:16px; font-weight:600; }
    .vm-close { background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; }
    .vm-body { padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
    .vm-row { display:flex; gap:12px; }
    .vm-row .vm-fg { flex:1; }
    .vm-fg { display:flex; flex-direction:column; gap:4px; }
    .vm-fg label { font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:.4px; }
    .vm-fg input, .vm-fg select {
      padding:8px 10px; font-size:13px; font-family:inherit;
      border:1px solid #cfd6e0; border-radius:5px; outline:none;
    }
    .vm-fg input:focus, .vm-fg select:focus { border-color:#1e3a8a; box-shadow:0 0 0 3px rgba(30,58,138,.12); }
    .vm-info { color:#666; font-size:12px; }
    .vm-err { background:#fdecea; color:#a8261b; padding:8px 10px; border-radius:5px; font-size:13px; }
    .vm-footer { padding:12px 18px; border-top:1px solid #eef1f5; background:#fafbfd; display:flex; gap:8px; justify-content:flex-end; }
  `]
})
export class ProductosComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  private auth = inject(AuthService);

  usuario = computed(() => this.auth.session()?.usuario ?? 'desconocido');
  ahora = signal('');

  modalVenta = signal(false);
  vBusy = signal(false);
  vError = signal('');
  vForm: { productoId: number | null; unidades: number | null; recaudacion: number | null; nroRecibo: string; metodoPago: string } = {
    productoId: null, unidades: null, recaudacion: null, nroRecibo: '', metodoPago: ''
  };

  abrirNuevaVenta() {
    this.vForm = { productoId: null, unidades: 1, recaudacion: null, nroRecibo: '', metodoPago: '' };
    this.vError.set('');
    this.ahora.set(new Date().toLocaleString('es-UY'));
    this.modalVenta.set(true);
  }

  cerrarNuevaVenta() {
    this.modalVenta.set(false);
    this.vError.set('');
  }

  guardarVenta() {
    if (!this.vForm.productoId) { this.vError.set('Seleccioná un producto.'); return; }
    if (!this.vForm.unidades || this.vForm.unidades <= 0) { this.vError.set('Las unidades deben ser mayores a 0.'); return; }
    if (!this.vForm.recaudacion || this.vForm.recaudacion <= 0) { this.vError.set('La recaudación debe ser mayor a 0.'); return; }
    if (!this.vForm.metodoPago) { this.vError.set('Seleccioná un método de pago.'); return; }

    this.vBusy.set(true);
    this.vError.set('');
    this.http.post(`${environment.apiUrl}/ventas/simple`, {
      productoId: this.vForm.productoId,
      unidades: this.vForm.unidades,
      recaudacion: this.vForm.recaudacion,
      nroRecibo: this.vForm.nroRecibo || null,
      metodoPago: this.vForm.metodoPago
    }).subscribe({
      next: () => {
        this.vBusy.set(false);
        this.cerrarNuevaVenta();
        this.reload();
      },
      error: (err) => {
        this.vBusy.set(false);
        this.vError.set(err?.error?.message || err?.message || 'No se pudo guardar la venta.');
      }
    });
  }

  tab = signal<Tab>('gestion');

  productos = signal<ProductoListado[]>([]);
  stats = signal<Stats | null>(null);
  movimientos = signal<Movimiento[]>([]);
  ventas = signal<Venta[]>([]);
  donaciones = signal<Donacion[]>([]);

  fmFecha = ''; fmProducto = ''; fmTipo = ''; fmCantidad = ''; fmMotivo = ''; fmObs = '';
  fpId = ''; fpNombre = ''; fpDesc = ''; fpPrecio = ''; fpStock = ''; fpEstado = '';
  fvComprador = '';
  fdDest = '';

  formP: Partial<ProductoListado> = { activo: true, precio: 0 };

  movimientosFiltrados = computed(() => this.movimientos().filter(m => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    const e = (s: string, f: string) => !f || s === f;
    return t(m.fecha, this.fmFecha) && t(m.producto, this.fmProducto)
      && e(m.tipo, this.fmTipo) && t(String(m.cantidad), this.fmCantidad)
      && e(m.motivo, this.fmMotivo) && t(m.observaciones, this.fmObs);
  }));

  productosFiltrados = computed(() => this.productos().filter(p => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    const e = (s: string, f: string) => !f || s === f;
    return t(String(p.id), this.fpId) && t(p.nombre, this.fpNombre)
      && t(p.descripcion ?? '', this.fpDesc) && t(String(p.precio), this.fpPrecio)
      && t(String(p.stock), this.fpStock) && e(p.estado, this.fpEstado);
  }));

  ventasFiltradas = computed(() => this.ventas().filter(v =>
    !this.fvComprador || v.comprador.toLowerCase().includes(this.fvComprador.toLowerCase())
  ));

  donacionesFiltradas = computed(() => this.donaciones().filter(d =>
    !this.fdDest || d.destinatario.toLowerCase().includes(this.fdDest.toLowerCase())
  ));

  constructor() {
    this.titleSvc.set('Productos');
    this.reload();
  }

  reload() {
    this.http.get<ProductoListado[]>(`${environment.apiUrl}/productos`).subscribe(x => this.productos.set(x));
    this.http.get<Stats>(`${environment.apiUrl}/productos/stats`).subscribe(x => this.stats.set(x));
    this.http.get<Movimiento[]>(`${environment.apiUrl}/productos/movimientos`).subscribe(x => this.movimientos.set(x));
    this.http.get<Venta[]>(`${environment.apiUrl}/ventas`).subscribe(x => this.ventas.set(x));
    this.http.get<Donacion[]>(`${environment.apiUrl}/donaciones`).subscribe(x => this.donaciones.set(x));
  }

  nuevoProducto() { this.formP = { activo: true, precio: 0 }; this.tab.set('form'); }
  editarProducto(p: ProductoListado) { this.formP = { ...p }; this.tab.set('form'); }
  volver() { this.tab.set('listar'); }

  guardar() {
    const body = { id: this.formP.id, nombre: this.formP.nombre, descripcion: this.formP.descripcion, precio: this.formP.precio, categoria: this.formP.categoria, activo: this.formP.activo ?? true };
    const req = this.formP.id
      ? this.http.put(`${environment.apiUrl}/productos/${this.formP.id}`, body)
      : this.http.post(`${environment.apiUrl}/productos`, body);
    req.subscribe(() => { this.tab.set('listar'); this.reload(); });
  }
}
