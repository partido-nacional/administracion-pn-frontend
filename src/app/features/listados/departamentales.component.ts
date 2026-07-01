import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PageTitleService } from '../../core/page-title.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ListadosService, ComDep } from '../../core/services/listados.service';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { exportarCSV } from '../../core/exportar-csv';

const DEPTOS = ['Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida','Lavalleja','Maldonado','Montevideo','Paysandu','Rio Negro','Rivera','Rocha','Salto','San Jose','Soriano','Tacuarembo','Treinta y Tres'];

@Component({
  selector: 'app-listados-departamentales',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1400px">
          <thead>
            <tr>
              <th style="width:60px">Cortesia</th>
              <th style="min-width:110px" class="sortable" (click)="sortBy('apellidos')">Apellidos {{ arrow('apellidos') }}</th>
              <th style="min-width:90px" class="sortable" (click)="sortBy('nombre')">Nombre {{ arrow('nombre') }}</th>
              <th style="min-width:95px">Telefono</th>
              <th style="min-width:95px">Celular</th>
              <th style="min-width:150px">Mail</th>
              <th style="min-width:130px">Posicion Organismo</th>
              <th style="min-width:100px">Departamento</th>
              <th style="min-width:160px">Dir. Organizacion</th>
              <th style="min-width:120px">Ciudad Organizacion</th>
            </tr>
            <tr class="filter-row">
              <th>
                <select class="column-filter" [(ngModel)]="fCortesia" (ngModelChange)="onFilter()">
                  <option value="">Todos</option>
                  <option>Sr.</option><option>Sra.</option><option>Dr.</option><option>Dra.</option>
                  <option>Ing.</option><option>Lic.</option><option>Cr.</option>
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombre" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fTel" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fCel" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fMail" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fPos" (ngModelChange)="onFilter()"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fDepto" (ngModelChange)="onFilter()">
                  <option value="">Todos</option>
                  @for (d of deptos; track d) { <option>{{ d }}</option> }
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fDir" (ngModelChange)="onFilter()"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fCiudad" (ngModelChange)="onFilter()"></th>
            </tr>
          </thead>
          <tbody>
            @for (c of items(); track $index) {
              <tr>
                <td>{{ c.cortesia }}</td>
                <td><strong>{{ c.apellidos }}</strong></td>
                <td><strong>{{ c.nombre }}</strong></td>
                <td>{{ c.telefono }}</td>
                <td>{{ c.celular }}</td>
                <td>{{ c.mail }}</td>
                <td>{{ c.posOrganismo }}</td>
                <td><span class="badge dept">{{ c.departamento }}</span></td>
                <td>{{ c.dirOrganizacion }}</td>
                <td>{{ c.ciudadOrganizacion }}</td>
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
export class DepartamentalesComponent implements OnInit {
  private svc = inject(ListadosService);
  private titleSvc = inject(PageTitleService);
  deptos = DEPTOS;

  items = signal<ComDep[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loading = signal(false);
  exporting = signal(false);

  fCortesia = ''; fApellidos = ''; fNombre = ''; fTel = ''; fCel = '';
  fMail = ''; fPos = ''; fDepto = ''; fDir = ''; fCiudad = '';

  private filter$ = new Subject<void>();

  constructor() {
    this.titleSvc.set('Listados — Com. Departamentales');
    this.filter$.pipe(debounceTime(300)).subscribe(() => { this.page.set(1); this.load(); });
  }

  ngOnInit() { this.load(); }

  private query(all = false): GridQuery {
    return {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(), all,
      filters: {
        cortesia: this.fCortesia, apellidos: this.fApellidos, nombre: this.fNombre,
        tel: this.fTel, cel: this.fCel, mail: this.fMail, pos: this.fPos,
        depto: this.fDepto, dir: this.fDir, ciudad: this.fCiudad,
      },
    };
  }

  private load() {
    this.loading.set(true);
    this.svc.comDepartamentales(this.query()).subscribe({
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
    this.svc.comDepartamentales(this.query(true)).subscribe({
      next: r => {
        exportarCSV(r.items, [
          { get: 'cortesia', label: 'Cortesia' }, { get: 'apellidos', label: 'Apellidos' },
          { get: 'nombre', label: 'Nombre' }, { get: 'telefono', label: 'Telefono' },
          { get: 'celular', label: 'Celular' }, { get: 'mail', label: 'Mail' },
          { get: 'posOrganismo', label: 'Posicion Organismo' }, { get: 'departamento', label: 'Departamento' },
          { get: 'dirOrganizacion', label: 'Dir. Organizacion' }, { get: 'ciudadOrganizacion', label: 'Ciudad Organizacion' },
        ], 'com-departamentales.csv');
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }
}
