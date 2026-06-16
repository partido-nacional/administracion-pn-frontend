import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Alcalde {
  cortesia: string; apellidos: string; nombres: string; telTrabajo: string; celular: string;
  mail: string; posOrganismo: string; nombreOrganismo: string; departamento: string;
}

@Component({
  selector: 'app-listados-alcaldes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead>
            <tr>
              <th style="width:60px">Cortesia</th>
              <th style="min-width:110px">Apellidos</th>
              <th style="min-width:90px">Nombres</th>
              <th style="min-width:95px">Tel. Trabajo</th>
              <th style="min-width:95px">Celular</th>
              <th style="min-width:150px">Mail</th>
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
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fNombres()" (ngModelChange)="fNombres.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fTel()" (ngModelChange)="fTel.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fCel()" (ngModelChange)="fCel.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fMail()" (ngModelChange)="fMail.set($event)"></th>
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
            @for (a of filtrados(); track $index) {
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
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 34 alcaldes</span>
          <button class="btn btn-export btn-sm">📄 Exportar a Excel</button>
          <div class="pagination-buttons">
            <button class="page-btn">&lt;</button>
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">3</button>
            <button class="page-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AlcaldesComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  data = signal<Alcalde[]>([]);
  fCortesia = signal(''); fApellidos = signal(''); fNombres = signal(''); fTel = signal(''); fCel = signal('');
  fMail = signal(''); fPos = signal(''); fOrg = signal(''); fDepto = signal('');

  deptos = computed(() =>
    [...new Set(this.data().map(a => a.departamento).filter(Boolean))].sort()
  );

  filtrados = computed(() => this.data().filter(a => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    const e = (s: string, f: string) => !f || s === f;
    return e(a.cortesia, this.fCortesia()) && t(a.apellidos, this.fApellidos()) && t(a.nombres, this.fNombres())
      && t(a.telTrabajo, this.fTel()) && t(a.celular, this.fCel()) && t(a.mail, this.fMail())
      && t(a.posOrganismo, this.fPos()) && t(a.nombreOrganismo, this.fOrg()) && e(a.departamento, this.fDepto());
  }));

  constructor() {
    this.titleSvc.set('Listados — Alcaldes');
    this.http.get<Alcalde[]>(`${environment.apiUrl}/listados/alcaldes`).subscribe(x => this.data.set(x));
  }
}
