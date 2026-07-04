import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PageTitleService } from '../../core/page-title.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ListadosService, Alcalde } from '../../core/services/listados.service';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { exportarCSV } from '../../core/exportar-csv';

@Component({
  selector: 'app-listados-alcaldes',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead>
            <tr>
              <th style="width:60px">Cortesia</th>
              <th style="min-width:110px" class="sortable" (click)="sortBy('apellidos')">Apellidos {{ arrow('apellidos') }}</th>
              <th style="min-width:90px" class="sortable" (click)="sortBy('nombres')">Nombres {{ arrow('nombres') }}</th>
              <th style="min-width:95px">Tel. Trabajo</th>
              <th style="min-width:95px">Celular</th>
              <th style="min-width:150px">Mail</th>
              <th style="min-width:130px">Posicion Organismo</th>
              <th style="min-width:140px">Nombre Organismo</th>
              <th style="min-width:100px">Departamento</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombres" (ngModelChange)="onFilter()"></th>
              <th></th>
              <th></th>
              <th></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fPos" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fOrg" (ngModelChange)="onFilter()"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fDepto" (ngModelChange)="onFilter()">
                  <option value="">Todos</option>
                  <option>Canelones</option><option>Colonia</option><option>Maldonado</option>
                  <option>Montevideo</option><option>Paysandu</option><option>Salto</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (a of items(); track $index) {
              <tr>
                <td>{{ a.cortesia }}</td>
                <td><strong>{{ a.apellidos }}</strong></td>
                <td><strong>{{ a.nombres }}</strong></td>
                <td>{{ a.telTrabajo }}</td>
                <td>{{ a.celular }}</td>
                <td>{{ a.mail }}</td>
                <td>{{ a.posOrganismo }}</td>
                <td>{{ a.nombreOrganismo }}</td>
                <td><span class="badge dept">{{ a.departamento }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="9" style="text-align:center; padding:24px; color:var(--gray-500)">
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
export class AlcaldesComponent implements OnInit {
  private svc = inject(ListadosService);
  private titleSvc = inject(PageTitleService);

  items = signal<Alcalde[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loading = signal(false);
  exporting = signal(false);

  fApellidos = ''; fNombres = ''; fPos = ''; fOrg = ''; fDepto = '';

  private filter$ = new Subject<void>();

  constructor() {
    this.titleSvc.set('Listados — Alcaldes');
    this.filter$.pipe(debounceTime(300)).subscribe(() => { this.page.set(1); this.load(); });
  }

  ngOnInit() { this.load(); }

  private query(all = false): GridQuery {
    return {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(), all,
      filters: {
        apellidos: this.fApellidos, nombres: this.fNombres, pos: this.fPos,
        org: this.fOrg, depto: this.fDepto,
      },
    };
  }

  private load() {
    this.loading.set(true);
    this.svc.alcaldes(this.query()).subscribe({
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
    this.svc.alcaldes(this.query(true)).subscribe({
      next: r => {
        exportarCSV(r.items, [
          { get: 'cortesia', label: 'Cortesia' }, { get: 'apellidos', label: 'Apellidos' },
          { get: 'nombres', label: 'Nombres' }, { get: 'telTrabajo', label: 'Tel. Trabajo' },
          { get: 'celular', label: 'Celular' }, { get: 'mail', label: 'Mail' },
          { get: 'posOrganismo', label: 'Posicion Organismo' }, { get: 'nombreOrganismo', label: 'Nombre Organismo' },
          { get: 'departamento', label: 'Departamento' },
        ], 'alcaldes.csv');
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }
}
