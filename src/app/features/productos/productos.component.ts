import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Producto {
  id: number; nombre: string; descripcion?: string; precio: number; categoria?: string; activo: boolean;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="toolbar">
      <div class="toolbar-left"><h3 style="font-size:14px;color:var(--gray-600)">{{ productos().length }} productos</h3></div>
      <button class="btn btn-primary" (click)="nuevo()">+ Nuevo Producto</button>
    </div>

    @if (editando()) {
      <div class="card">
        <div class="card-header"><h2 class="card-title">{{ formP.id ? 'Editar' : 'Nuevo' }} producto</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Nombre *</label><input class="form-input" name="n" [(ngModel)]="formP.nombre"></div>
            <div class="form-group"><label class="form-label">Categoría</label><input class="form-input" name="c" [(ngModel)]="formP.categoria"></div>
            <div class="form-group"><label class="form-label">Precio *</label><input class="form-input" type="number" step="0.01" name="p" [(ngModel)]="formP.precio"></div>
            <div class="form-group full-width"><label class="form-label">Descripción</label><textarea class="form-textarea" name="d" [(ngModel)]="formP.descripcion"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="guardar()">Guardar</button>
            <button class="btn btn-secondary" (click)="editando.set(false)">Cancelar</button>
          </div>
        </div>
      </div>
    }

    <div class="card">
      <div class="card-body" style="overflow-x:auto">
        <table class="table">
          <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Activo</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (p of productos(); track p.id) {
              <tr>
                <td>{{ p.nombre }}</td>
                <td>{{ p.categoria || '—' }}</td>
                <td>\${{ p.precio }}</td>
                <td><span class="badge" [class.status-active]="p.activo" [class.status-rejected]="!p.activo">{{ p.activo ? 'Sí' : 'No' }}</span></td>
                <td class="action-group">
                  <a class="action-link" (click)="editar(p)">Editar</a>
                  <a class="action-link" style="color:var(--danger)" (click)="eliminar(p)">Eliminar</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5"><div class="empty-state"><div class="empty-state-text">Sin productos</div></div></td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ProductosComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  productos = signal<Producto[]>([]);
  editando = signal(false);
  formP: Partial<Producto> = { activo: true, precio: 0 };

  constructor() {
    this.titleSvc.set('Productos');
    this.reload();
  }

  reload() { this.http.get<Producto[]>(`${environment.apiUrl}/productos`).subscribe(x => this.productos.set(x)); }

  nuevo() { this.formP = { activo: true, precio: 0 }; this.editando.set(true); }
  editar(p: Producto) { this.formP = { ...p }; this.editando.set(true); }

  guardar() {
    const req = this.formP.id
      ? this.http.put(`${environment.apiUrl}/productos/${this.formP.id}`, this.formP)
      : this.http.post(`${environment.apiUrl}/productos`, this.formP);
    req.subscribe(() => { this.editando.set(false); this.reload(); });
  }

  eliminar(p: Producto) {
    if (!confirm(`Eliminar "${p.nombre}"?`)) return;
    this.http.delete(`${environment.apiUrl}/productos/${p.id}`).subscribe(() => this.reload());
  }
}
