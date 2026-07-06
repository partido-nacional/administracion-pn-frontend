import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PageTitleService } from '../../core/page-title.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ListadosService, ConvL } from '../../core/services/listados.service';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { exportarCSV } from '../../core/exportar-csv';

@Component({
  selector: 'app-listados-convencionales',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1350px">
          <thead>
            <tr class="filter-row">
              <th></th>
              <th></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombres" (ngModelChange)="onFilter()"></th>
              <th></th>
              <th></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fPos" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fOrg" (ngModelChange)="onFilter()"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fCondicion" (ngModelChange)="onFilter()">
                  <option value="">Todos</option>
                  <option>Titular</option>
                  <option>Suplente</option>
                </select>
              </th>
              <th>
                <select class="column-filter" [(ngModel)]="fAdherente" (ngModelChange)="onFilter()">
                  <option value="">Todos</option>
                  <option value="si">Si</option>
                  <option value="no">No</option>
                </select>
              </th>
            </tr>
            <tr>
              <th style="width:70px" class="sortable" (click)="sortBy('id')">ID Contacto {{ arrow('id') }}</th>
              <th style="min-width:85px">Cred. Civica</th>
              <th style="min-width:110px" class="sortable" (click)="sortBy('apellidos')">Apellidos {{ arrow('apellidos') }}</th>
              <th style="min-width:90px" class="sortable" (click)="sortBy('nombres')">Nombres {{ arrow('nombres') }}</th>
              <th style="min-width:95px">Celular</th>
              <th style="min-width:160px">Mail</th>
              <th style="min-width:130px">Posicion Organismo</th>
              <th style="min-width:140px">Nombre Organismo</th>
              <th style="min-width:100px">Condicion</th>
              <th style="min-width:70px; text-align:center">Adherente</th>
            </tr>
          </thead>
          <tbody>
            @for (c of items(); track c.idContacto) {
              <tr>
                <td>{{ c.idContacto }}</td>
                <td>{{ c.credCivica }}</td>
                <td><strong>{{ c.apellidos }}</strong></td>
                <td><strong>{{ c.nombres }}</strong></td>
                <td>{{ c.celular }}</td>
                <td>{{ c.mail }}</td>
                <td>{{ c.posOrganismo }}</td>
                <td>{{ c.nombreOrganismo }}</td>
                <td>{{ c.condicion }}</td>
                <td style="text-align:center">{{ c.adherente ? '☑' : '☐' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="10" style="text-align:center; padding:24px; color:var(--gray-500)">
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
export class ConvencionalesListadoComponent implements OnInit {
  private svc = inject(ListadosService);
  private titleSvc = inject(PageTitleService);

  items = signal<ConvL[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loading = signal(false);
  exporting = signal(false);

  fApellidos = ''; fNombres = ''; fPos = ''; fOrg = ''; fCondicion = ''; fAdherente = '';

  private filter$ = new Subject<void>();

  constructor() {
    this.titleSvc.set('Listados — Convencionales');
    this.filter$.pipe(debounceTime(300)).subscribe(() => { this.page.set(1); this.load(); });
  }

  ngOnInit() { this.load(); }

  private query(all = false): GridQuery {
    const adherente = this.fAdherente === 'si' ? 'true' : this.fAdherente === 'no' ? 'false' : '';
    return {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(), all,
      filters: {
        apellidos: this.fApellidos, nombres: this.fNombres,
        pos: this.fPos, org: this.fOrg,
        condicion: this.fCondicion, adherente,
      },
    };
  }

  private load() {
    this.loading.set(true);
    this.svc.convencionales(this.query()).subscribe({
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
    this.svc.convencionales(this.query(true)).subscribe({
      next: r => {
        exportarCSV(r.items, [
          { get: 'idContacto', label: 'ID Contacto' }, { get: 'credCivica', label: 'Cred. Civica' },
          { get: 'apellidos', label: 'Apellidos' }, { get: 'nombres', label: 'Nombres' },
          { get: 'celular', label: 'Celular' }, { get: 'mail', label: 'Mail' },
          { get: 'posOrganismo', label: 'Posicion Organismo' }, { get: 'nombreOrganismo', label: 'Nombre Organismo' },
          { get: 'condicion', label: 'Condicion' }, { get: 'adherente', label: 'Adherente' },
        ], 'convencionales.csv');
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }
}
