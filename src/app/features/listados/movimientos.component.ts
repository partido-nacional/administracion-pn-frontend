import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Movimiento { fechaHora: string; usuario: string; accion: string; modulo: string; detalle: string; }

@Component({
  selector: 'app-listados-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Usuario</th>
              <th>Accion</th>
              <th>Modulo</th>
              <th>Detalle</th>
            </tr>
            <tr class="filter-row">
              <th><input type="text" class="column-filter" placeholder="dd/mm/aaaa" [(ngModel)]="fFecha"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fUsuario"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fAccion">
                  <option value="">Todas</option>
                  <option>Alta</option>
                  <option>Modificacion</option>
                  <option>Eliminacion</option>
                </select>
              </th>
              <th>
                <select class="column-filter" [(ngModel)]="fModulo">
                  <option value="">Todos</option>
                  <option>Agenda</option>
                  <option>Adhesiones</option>
                  <option>Agrupaciones</option>
                  <option>Convencionales</option>
                  <option>Organismos</option>
                  <option>Productos</option>
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fDetalle"></th>
            </tr>
          </thead>
          <tbody>
            @for (m of filtrados(); track $index) {
              <tr>
                <td>{{ formatFecha(m.fechaHora) }}</td>
                <td><strong>{{ m.usuario }}</strong></td>
                <td><span class="badge" [ngClass]="badgeAccion(m.accion)">{{ m.accion }}</span></td>
                <td>{{ m.modulo }}</td>
                <td>{{ m.detalle }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 2,341 movimientos</span>
          <button class="btn btn-export btn-sm">📄 Exportar a Excel</button>
          <div class="pagination-buttons">
            <button class="page-btn">&lt;</button>
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">3</button>
            <button class="page-btn">...</button>
            <button class="page-btn">335</button>
            <button class="page-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MovimientosComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  movs = signal<Movimiento[]>([]);
  fFecha = '';
  fUsuario = '';
  fAccion = '';
  fModulo = '';
  fDetalle = '';

  filtrados = computed(() => {
    return this.movs().filter(m => {
      if (this.fFecha && !this.formatFecha(m.fechaHora).includes(this.fFecha)) return false;
      if (this.fUsuario && !m.usuario.toLowerCase().includes(this.fUsuario.toLowerCase())) return false;
      if (this.fAccion && m.accion !== this.fAccion) return false;
      if (this.fModulo && m.modulo !== this.fModulo) return false;
      if (this.fDetalle && !m.detalle.toLowerCase().includes(this.fDetalle.toLowerCase())) return false;
      return true;
    });
  });

  constructor() {
    this.titleSvc.set('Listados — Mov. de Sistema');
    this.http.get<Movimiento[]>(`${environment.apiUrl}/listados/movimientos`).subscribe(x => this.movs.set(x));
  }

  formatFecha(s: string) {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}` : s;
  }

  badgeAccion(a: string) {
    if (a === 'Alta') return 'status-active';
    if (a === 'Modificacion') return 'status-pending';
    return 'status-rejected';
  }
}
