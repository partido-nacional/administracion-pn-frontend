import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PageTitleService } from '../../core/page-title.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ListadosService, Joven } from '../../core/services/listados.service';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { exportarCSV } from '../../core/exportar-csv';

@Component({
  selector: 'app-listados-jovenes',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0">
        <table class="table">
          <thead>
            <tr>
              <th style="min-width:130px" class="sortable" (click)="sortBy('apellidos')">Apellidos {{ arrow('apellidos') }}</th>
              <th style="min-width:110px" class="sortable" (click)="sortBy('nombres')">Nombres {{ arrow('nombres') }}</th>
              <th style="min-width:110px">Celular</th>
              <th style="min-width:180px">Mail</th>
              <th style="min-width:150px">Posicion Organismo</th>
            </tr>
            <tr class="filter-row">
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombres" (ngModelChange)="onFilter()"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fDepartamento" (ngModelChange)="onFilter()">
                  <option value="">Todos los departamentos</option>
                  @for (d of departamentos; track d) {
                    <option [value]="d">{{ d }}</option>
                  }
                </select>
              </th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (j of items(); track $index) {
              <tr>
                <td><strong>{{ j.apellidos }}</strong></td>
                <td><strong>{{ j.nombres }}</strong></td>
                <td>{{ j.celular }}</td>
                <td>{{ j.mail }}</td>
                <td>{{ j.posOrganismo }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5" style="text-align:center; padding:24px; color:var(--gray-500)">
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
export class JovenesComponent implements OnInit {
  private svc = inject(ListadosService);
  private titleSvc = inject(PageTitleService);

  items = signal<Joven[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loading = signal(false);
  exporting = signal(false);

  fApellidos = ''; fNombres = ''; fDepartamento = '';

  readonly departamentos = [
    'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
    'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
    'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres',
  ];

  private filter$ = new Subject<void>();

  constructor() {
    this.titleSvc.set('Listados — Com. Jovenes');
    this.filter$.pipe(debounceTime(300)).subscribe(() => { this.page.set(1); this.load(); });
  }

  ngOnInit() { this.load(); }

  private query(all = false): GridQuery {
    return {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(), all,
      filters: {
        apellidos: this.fApellidos, nombres: this.fNombres,
        departamento: this.fDepartamento,
      },
    };
  }

  private load() {
    this.loading.set(true);
    this.svc.jovenes(this.query()).subscribe({
      next: r => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilter() { this.filter$.next(); }
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
    this.svc.jovenes(this.query(true)).subscribe({
      next: r => {
        exportarCSV(r.items, [
          { get: 'apellidos', label: 'Apellidos' }, { get: 'nombres', label: 'Nombres' },
          { get: 'celular', label: 'Celular' }, { get: 'mail', label: 'Mail' },
          { get: 'posOrganismo', label: 'Posicion Organismo' },
        ], 'jovenes.csv');
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }
}
