import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Parlamentario {
  cortesia: string; apellidos: string; nombre: string; direccion: string; domicilio: string;
  departamento: string; telMovil: string; mailPartido: string; posOrganismo: string;
  nombreOrganismo: string; credCivica: string; cedulaId: string; observaciones: string;
}

@Component({
  selector: 'app-listados-parlamentarias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1600px">
          <thead>
            <tr>
              <th style="width:60px">Cortesia</th>
              <th style="min-width:110px">Apellidos</th>
              <th style="min-width:90px">Nombre</th>
              <th style="min-width:140px">Direccion</th>
              <th style="min-width:140px">Domicilio</th>
              <th style="min-width:100px">Departamento</th>
              <th style="min-width:95px">Tel. Movil</th>
              <th style="min-width:150px">Mail Partido</th>
              <th style="min-width:140px">Posicion Organismo</th>
              <th style="min-width:140px">Nombre Organismo</th>
              <th style="min-width:85px">Cred. Civica</th>
              <th style="min-width:95px">Cedula Id.</th>
              <th style="min-width:200px">Observaciones</th>
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
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fDireccion()" (ngModelChange)="fDireccion.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fDomicilio()" (ngModelChange)="fDomicilio.set($event)"></th>
              <th>
                <select class="column-filter" [ngModel]="fDepartamento()" (ngModelChange)="fDepartamento.set($event)">
                  <option value="">Todos</option>
                  @for (d of deptos(); track d) { <option>{{ d }}</option> }
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fTel()" (ngModelChange)="fTel.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fMail()" (ngModelChange)="fMail.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fPos()" (ngModelChange)="fPos.set($event)"></th>
              <th>
                <select class="column-filter" [ngModel]="fOrg()" (ngModelChange)="fOrg.set($event)">
                  <option value="">Todos</option>
                  @for (n of nombresOrganismo(); track n) { <option>{{ n }}</option> }
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fCred()" (ngModelChange)="fCred.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fCedula()" (ngModelChange)="fCedula.set($event)"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [ngModel]="fObs()" (ngModelChange)="fObs.set($event)"></th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtrados(); track $index) {
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
                <td>{{ p.credCivica }}</td>
                <td>{{ p.cedulaId }}</td>
                <td>{{ p.observaciones }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 12 agrupaciones parlamentarias</span>
          <button class="btn btn-export btn-sm">📄 Exportar a Excel</button>
          <div class="pagination-buttons">
            <button class="page-btn">&lt;</button>
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ParlamentariasComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  data = signal<Parlamentario[]>([]);
  fCortesia = signal(''); fApellidos = signal(''); fNombre = signal('');
  fDireccion = signal(''); fDomicilio = signal(''); fDepartamento = signal('');
  fTel = signal(''); fMail = signal(''); fPos = signal(''); fOrg = signal('');
  fCred = signal(''); fCedula = signal(''); fObs = signal('');

  deptos = computed(() =>
    [...new Set(this.data().map(p => p.departamento).filter(Boolean))].sort()
  );

  nombresOrganismo = computed(() =>
    [...new Set(this.data().map(p => p.nombreOrganismo).filter(Boolean))].sort()
  );

  filtrados = computed(() => this.data().filter(p => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    const e = (s: string, f: string) => !f || s === f;
    return e(p.cortesia, this.fCortesia()) && t(p.apellidos, this.fApellidos()) && t(p.nombre, this.fNombre())
      && t(p.direccion, this.fDireccion()) && t(p.domicilio, this.fDomicilio())
      && e(p.departamento, this.fDepartamento()) && t(p.telMovil, this.fTel()) && t(p.mailPartido, this.fMail())
      && t(p.posOrganismo, this.fPos()) && e(p.nombreOrganismo, this.fOrg())
      && t(p.credCivica, this.fCred()) && t(p.cedulaId, this.fCedula()) && t(p.observaciones, this.fObs());
  }));

  constructor() {
    this.titleSvc.set('Listados — Agrup. Parlamentarias');
    this.http.get<Parlamentario[]>(`${environment.apiUrl}/listados/parlamentarias`).subscribe(x => this.data.set(x));
  }
}
