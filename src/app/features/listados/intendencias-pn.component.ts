import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface IntPN {
  apellidos: string; nombres: string; telTrabajo1: string; telTrabajo2: string;
  telMovil: string; departamento: string; mailParticular: string; mailTrabajo: string;
}

@Component({
  selector: 'app-listados-int-pn',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead>
            <tr>
              <th style="min-width:110px">Apellidos</th>
              <th style="min-width:90px">Nombres</th>
              <th style="min-width:95px">Tel. Trabajo 1</th>
              <th style="min-width:95px">Tel. Trabajo 2</th>
              <th style="min-width:95px">Tel. Movil</th>
              <th style="min-width:100px">Departamento</th>
              <th style="min-width:160px">Mail Particular</th>
              <th style="min-width:160px">Mail Trabajo</th>
            </tr>
            <tr class="filter-row">
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombres"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fTel1"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fTel2"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fMovil"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fDepto">
                  <option value="">Todos</option>
                  <option>Canelones</option><option>Colonia</option><option>Maldonado</option>
                  <option>Paysandu</option><option>Salto</option><option>Soriano</option>
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fMailP"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fMailT"></th>
            </tr>
          </thead>
          <tbody>
            @for (i of filtrados(); track $index) {
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
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 8 intendencias PN</span>
          <button class="btn btn-export btn-sm">📄 Exportar a Excel</button>
          <div class="pagination-buttons">
            <button class="page-btn">&lt;</button>
            <button class="page-btn active">1</button>
            <button class="page-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class IntendenciasPnComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  data = signal<IntPN[]>([]);
  fApellidos = ''; fNombres = ''; fTel1 = ''; fTel2 = '';
  fMovil = ''; fDepto = ''; fMailP = ''; fMailT = '';

  filtrados = computed(() => this.data().filter(i => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    const e = (s: string, f: string) => !f || s === f;
    return t(i.apellidos, this.fApellidos) && t(i.nombres, this.fNombres)
      && t(i.telTrabajo1, this.fTel1) && t(i.telTrabajo2, this.fTel2) && t(i.telMovil, this.fMovil)
      && e(i.departamento, this.fDepto) && t(i.mailParticular, this.fMailP) && t(i.mailTrabajo, this.fMailT);
  }));

  constructor() {
    this.titleSvc.set('Listados — Intendencias PN');
    this.http.get<IntPN[]>(`${environment.apiUrl}/listados/intendencias-pn`).subscribe(x => this.data.set(x));
  }
}
