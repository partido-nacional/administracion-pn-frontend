import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface IntNac {
  cortesia: string; apellidos: string; nombre: string; telTrabajo: string;
  posOrganismo: string; nombreOrganismo: string; departamento: string;
}

@Component({
  selector: 'app-listados-int-nac',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th style="width:60px">Cortesia</th>
              <th style="min-width:110px">Apellidos</th>
              <th style="min-width:90px">Nombre</th>
              <th style="min-width:95px">Tel. Trabajo</th>
              <th style="min-width:130px">Posicion Organismo</th>
              <th style="min-width:140px">Nombre Organismo</th>
              <th style="min-width:100px">Departamento</th>
            </tr>
            <tr class="filter-row">
              <th>
                <select class="column-filter" [ngModel]="fCortesia()" (ngModelChange)="fCortesia.set($event)">
                  <option value="">Todos</option>
                  <option>Sr.</option><option>Sra.</option><option>Dr.</option><option>Dra.</option>
                  <option>Ing.</option><option>Lic.</option><option>Cr.</option>
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fApellidos()" (ngModelChange)="fApellidos.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fTel()" (ngModelChange)="fTel.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fPos()" (ngModelChange)="fPos.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fOrg()" (ngModelChange)="fOrg.set($event)"></th>
              <th>
                <select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event)">
                  <option value="">Todos</option>
                  @for (d of deptos(); track d) { <option>{{ d }}</option> }
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (i of filtrados(); track $index) {
              <tr>
                <td>{{ i.cortesia }}</td>
                <td><strong>{{ i.apellidos }}</strong></td>
                <td><strong>{{ i.nombre }}</strong></td>
                <td>{{ i.telTrabajo }}</td>
                <td>{{ i.posOrganismo }}</td>
                <td>{{ i.nombreOrganismo }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
              </tr>
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 8 intendencias nacionalistas</span>
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
export class IntendenciasNacComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  data = signal<IntNac[]>([]);
  fCortesia = signal(''); fApellidos = signal(''); fNombre = signal(''); fTel = signal('');
  fPos = signal(''); fOrg = signal(''); fDepto = signal('');

  deptos = computed(() =>
    [...new Set(this.data().map(i => i.departamento).filter(Boolean))].sort()
  );

  filtrados = computed(() => this.data().filter(i => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    const e = (s: string, f: string) => !f || s === f;
    return e(i.cortesia, this.fCortesia()) && t(i.apellidos, this.fApellidos()) && t(i.nombre, this.fNombre())
      && t(i.telTrabajo, this.fTel()) && t(i.posOrganismo, this.fPos())
      && t(i.nombreOrganismo, this.fOrg()) && e(i.departamento, this.fDepto());
  }));

  constructor() {
    this.titleSvc.set('Listados — Intendencias Nacionalistas');
    this.http.get<IntNac[]>(`${environment.apiUrl}/listados/intendencias-nacionalistas`).subscribe(x => this.data.set(x));
  }
}
