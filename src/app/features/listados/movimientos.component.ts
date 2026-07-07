import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PageTitleService } from '../../core/page-title.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ListadosService, Movimiento } from '../../core/services/listados.service';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { exportarCSV } from '../../core/exportar-csv';

@Component({
  selector: 'app-listados-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0">
        <table class="table">
          <thead>
            <tr class="filter-row">
              <th><input type="text" class="column-filter" placeholder="dd/mm/aaaa" [(ngModel)]="fFecha" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fUsuario" (ngModelChange)="onFilter()"></th>
              <th></th>
              <th>
                <select class="column-filter" [(ngModel)]="fModulo" (ngModelChange)="onFilter()">
                  <option value="">Todos</option>
                  <option>Agenda</option>
                  <option>Adhesiones</option>
                  <option>Agrupaciones</option>
                  <option>Convencionales</option>
                  <option>Organismos</option>
                  <option>Productos</option>
                </select>
              </th>
              <th></th>
            </tr>
            <tr>
              <th class="sortable" (click)="sortBy('fecha')">Fecha/Hora {{ arrow('fecha') }}</th>
              <th class="sortable" (click)="sortBy('usuario')">Usuario {{ arrow('usuario') }}</th>
              <th class="sortable" (click)="sortBy('accion')">Accion {{ arrow('accion') }}</th>
              <th class="sortable" (click)="sortBy('modulo')">Modulo {{ arrow('modulo') }}</th>
              <th class="sortable" (click)="sortBy('detalle')">Detalle {{ arrow('detalle') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (m of items(); track $index) {
              <tr>
                <td>{{ formatFecha(m.fechaHora) }}</td>
                <td><strong>{{ m.usuario }}</strong></td>
                <td><span class="badge" [ngClass]="badgeAccion(m.accion)">{{ m.accion }}</span></td>
                <td>{{ m.modulo }}</td>
                <td>{{ m.detalle }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5" style="text-align:center; padding:24px; color:var(--gray-500)">
                {{ loading() ? 'Cargando…' : 'Sin movimientos' }}
              </td></tr>
            }
          </tbody>
        </table>

        <div style="display:flex; align-items:center; justify-content:flex-end; padding:12px 24px 0">
          <button class="btn btn-export btn-sm" (click)="exportar()" [disabled]="exporting()">
            {{ exporting() ? 'Exportando…' : '📄 Exportar a Excel' }}
          </button>
        </div>

        <app-paginator
          [total]="total()" [page]="page()" [pageSize]="pageSize()"
          (pageChange)="onPage($event)" (pageSizeChange)="onPageSize($event)" />
      </div>
    </div>
  `,
  styles: [`.sortable { cursor: pointer; user-select: none; }`]
})
export class MovimientosComponent implements OnInit {
  private svc = inject(ListadosService);
  private titleSvc = inject(PageTitleService);

  items = signal<Movimiento[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loading = signal(false);
  exporting = signal(false);

  fFecha = '';
  fUsuario = '';
  fModulo = '';

  private filter$ = new Subject<void>();

  constructor() {
    this.titleSvc.set('Listados — Mov. de Sistema');
    this.filter$.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  ngOnInit() { this.load(); }

  private query(all = false): GridQuery {
    return {
      page: this.page(),
      pageSize: this.pageSize(),
      sort: this.sort(),
      order: this.order(),
      all,
      filters: {
        usuario: this.fUsuario,
        modulo: this.fModulo,
        fecha: this.toIsoDate(this.fFecha),
      },
    };
  }

  private load() {
    this.loading.set(true);
    this.svc.movimientos(this.query()).subscribe({
      next: r => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  onFilter() { this.filter$.next(); }

  onPage(p: number) { this.page.set(p); this.load(); }
  onPageSize(size: number) { this.pageSize.set(size); this.page.set(1); this.load(); }

  sortBy(field: string) {
    if (this.sort() === field) {
      this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sort.set(field);
      this.order.set('asc');
    }
    this.page.set(1);
    this.load();
  }

  arrow(field: string) {
    if (this.sort() !== field) return '';
    return this.order() === 'asc' ? '▲' : '▼';
  }

  exportar() {
    this.exporting.set(true);
    this.svc.movimientos(this.query(true)).subscribe({
      next: r => {
        exportarCSV(r.items, [
          { get: m => this.formatFecha(m.fechaHora), label: 'Fecha/Hora' },
          { get: 'usuario', label: 'Usuario' },
          { get: 'accion', label: 'Accion' },
          { get: 'modulo', label: 'Modulo' },
          { get: 'detalle', label: 'Detalle' },
        ], 'movimientos.csv');
        this.exporting.set(false);
      },
      error: () => { this.exporting.set(false); },
    });
  }

  /** dd/mm/aaaa -> yyyy-mm-dd (undefined si no es una fecha completa válida). */
  private toIsoDate(s: string): string | undefined {
    const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
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
