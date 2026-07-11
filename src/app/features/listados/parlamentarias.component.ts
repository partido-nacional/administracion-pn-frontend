import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PageTitleService } from '../../core/page-title.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ListadosService, Parlamentario } from '../../core/services/listados.service';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { exportarCSV } from '../../core/exportar-csv';

@Component({
  selector: 'app-listados-parlamentarias',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1600px">
          <thead>
            <tr class="filter-row">
              <th></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombre" (ngModelChange)="onFilter()"></th>
              <th></th>
              <th></th>
              <th>
                <select class="column-filter" [(ngModel)]="fDepartamento" (ngModelChange)="onFilter()">
                  <option value="">Todos</option>
                  <option>Montevideo</option><option>Canelones</option><option>Maldonado</option>
                  <option>Salto</option><option>Colonia</option><option>Paysandu</option>
                </select>
              </th>
              <th></th>
              <th></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fPos" (ngModelChange)="onFilter()"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fOrg" (ngModelChange)="onFilter()">
                  <option value="">Todos</option>
                  <option>Camara de Representantes</option>
                  <option>Camara de Senadores</option>
                </select>
              </th>
              <th>
                <select class="column-filter" [(ngModel)]="fCondicion" (ngModelChange)="onFilter()">
                  <option value="">Todas</option>
                  <option>Titular</option>
                  <option>Suplente</option>
                </select>
              </th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
            <tr>
              <th style="width:60px">Cortesia</th>
              <th style="min-width:110px" class="sortable" (click)="sortBy('apellidos')">Apellidos {{ arrow('apellidos') }}</th>
              <th style="min-width:90px" class="sortable" (click)="sortBy('nombre')">Nombre {{ arrow('nombre') }}</th>
              <th style="min-width:140px">Direccion</th>
              <th style="min-width:140px">Domicilio</th>
              <th style="min-width:100px" class="sortable" (click)="sortBy('departamento')">Departamento {{ arrow('departamento') }}</th>
              <th style="min-width:95px">Tel. Movil</th>
              <th style="min-width:150px">Mail Partido</th>
              <th style="min-width:140px">Posicion Organismo</th>
              <th style="min-width:140px">Nombre Organismo</th>
              <th style="min-width:95px" class="sortable" (click)="sortBy('condicion')">Condicion {{ arrow('condicion') }}</th>
              <th style="min-width:85px" class="sortable" (click)="sortBy('credcivica')">Cred. Civica {{ arrow('credcivica') }}</th>
              <th style="min-width:95px" class="sortable" (click)="sortBy('cedulaid')">Cedula Id. {{ arrow('cedulaid') }}</th>
              <th style="min-width:200px">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of items(); track $index) {
              <tr>
                <td>{{ p.cortesia }}</td>
                <td><strong>{{ p.apellidos }}</strong></td>
                <td><strong>{{ p.nombre }}</strong></td>
                <td>{{ p.direccion }}</td>
                <td>{{ p.domicilio }}</td>
                <td><span class="badge dept">{{ p.departamento }}</span></td>
                <td>{{ p.telMovil }}</td>
                <td>{{ p.mailPartido }}</td>
                <td>{{ p.posOrganismo }}</td>
                <td>{{ p.nombreOrganismo }}</td>
                <td><span class="badge">{{ p.condicion }}</span></td>
                <td>{{ p.credCivica }}</td>
                <td>{{ p.cedulaId }}</td>
                <td>{{ p.observaciones }}</td>
              </tr>
            } @empty {
              <tr><td colspan="14" style="text-align:center; padding:24px; color:var(--gray-500)">
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
export class ParlamentariasComponent implements OnInit {
  private svc = inject(ListadosService);
  private titleSvc = inject(PageTitleService);

  items = signal<Parlamentario[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loading = signal(false);
  exporting = signal(false);

  fApellidos = ''; fNombre = ''; fDepartamento = ''; fPos = ''; fOrg = ''; fCondicion = '';

  private filter$ = new Subject<void>();

  constructor() {
    this.titleSvc.set('Listados — Agrup. Parlamentarias');
    this.filter$.pipe(debounceTime(300)).subscribe(() => { this.page.set(1); this.load(); });
  }

  ngOnInit() { this.load(); }

  private query(all = false): GridQuery {
    return {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(), all,
      filters: {
        apellidos: this.fApellidos, nombre: this.fNombre,
        departamento: this.fDepartamento, pos: this.fPos, org: this.fOrg, condicion: this.fCondicion,
      },
    };
  }

  private load() {
    this.loading.set(true);
    this.svc.parlamentarias(this.query()).subscribe({
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
    this.svc.parlamentarias(this.query(true)).subscribe({
      next: r => {
        exportarCSV(r.items, [
          { get: 'cortesia', label: 'Cortesia' }, { get: 'apellidos', label: 'Apellidos' },
          { get: 'nombre', label: 'Nombre' }, { get: 'direccion', label: 'Direccion' },
          { get: 'domicilio', label: 'Domicilio' }, { get: 'departamento', label: 'Departamento' },
          { get: 'telMovil', label: 'Tel. Movil' }, { get: 'mailPartido', label: 'Mail Partido' },
          { get: 'posOrganismo', label: 'Posicion Organismo' }, { get: 'nombreOrganismo', label: 'Nombre Organismo' },
          { get: 'condicion', label: 'Condicion' },
          { get: 'credCivica', label: 'Cred. Civica' }, { get: 'cedulaId', label: 'Cedula Id.' },
          { get: 'observaciones', label: 'Observaciones' },
        ], 'parlamentarias.csv');
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }
}
