import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitleService } from '../../core/page-title.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ListadosService, IntPN } from '../../core/services/listados.service';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { exportarCSV } from '../../core/exportar-csv';

@Component({
  selector: 'app-listados-int-pn',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead>
            <tr>
              <th style="min-width:110px" class="sortable" (click)="sortBy('apellidos')">Apellidos {{ arrow('apellidos') }}</th>
              <th style="min-width:90px" class="sortable" (click)="sortBy('nombres')">Nombres {{ arrow('nombres') }}</th>
              <th style="min-width:95px">Tel. Trabajo 1</th>
              <th style="min-width:95px">Tel. Trabajo 2</th>
              <th style="min-width:95px">Tel. Movil</th>
              <th style="min-width:100px" class="sortable" (click)="sortBy('departamento')">Departamento {{ arrow('departamento') }}</th>
              <th style="min-width:160px">Mail Particular</th>
              <th style="min-width:160px">Mail Trabajo</th>
            </tr>
          </thead>
          <tbody>
            @for (i of items(); track $index) {
              <tr>
                <td><strong>{{ i.apellidos }}</strong></td>
                <td><strong>{{ i.nombres }}</strong></td>
                <td>{{ i.telTrabajo1 }}</td>
                <td>{{ i.telTrabajo2 }}</td>
                <td>{{ i.telMovil }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
                <td>{{ i.mailParticular }}</td>
                <td>{{ i.mailTrabajo }}</td>
              </tr>
            } @empty {
              <tr><td colspan="8" style="text-align:center; padding:24px; color:var(--gray-500)">
                {{ loading() ? 'Cargando…' : 'Sin resultados' }}
              </td></tr>
            }
          </tbody>
        </table>
        <div style="display:flex; justify-content:flex-end; padding:12px 24px 0">
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
export class IntendenciasPnComponent implements OnInit {
  private svc = inject(ListadosService);
  private titleSvc = inject(PageTitleService);

  items = signal<IntPN[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loading = signal(false);
  exporting = signal(false);

  constructor() {
    this.titleSvc.set('Listados — Intendencias PN');
  }

  ngOnInit() { this.load(); }

  private query(all = false): GridQuery {
    return {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(), all,
      filters: {},
    };
  }

  private load() {
    this.loading.set(true);
    this.svc.intendenciasPn(this.query()).subscribe({
      next: r => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(p: number) { this.page.set(p); this.load(); }
  onPageSize(size: number) { this.pageSize.set(size); this.page.set(1); this.load(); }

  sortBy(field: string) {
    if (this.sort() === field) this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    else { this.sort.set(field); this.order.set('asc'); }
    this.page.set(1);
    this.load();
  }
  arrow(field: string) { return this.sort() !== field ? '' : (this.order() === 'asc' ? '▲' : '▼'); }

  exportar() {
    this.exporting.set(true);
    this.svc.intendenciasPn(this.query(true)).subscribe({
      next: r => {
        exportarCSV(r.items, [
          { get: 'apellidos', label: 'Apellidos' }, { get: 'nombres', label: 'Nombres' },
          { get: 'telTrabajo1', label: 'Tel. Trabajo 1' }, { get: 'telTrabajo2', label: 'Tel. Trabajo 2' },
          { get: 'telMovil', label: 'Tel. Movil' }, { get: 'departamento', label: 'Departamento' },
          { get: 'mailParticular', label: 'Mail Particular' }, { get: 'mailTrabajo', label: 'Mail Trabajo' },
        ], 'intendencias-pn.csv');
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }
}
