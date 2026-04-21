import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface ComDep {
  cortesia: string; apellidos: string; nombre: string; telefono: string; celular: string;
  mail: string; posOrganismo: string; departamento: string; dirOrganizacion: string; ciudadOrganizacion: string;
}

const DEPTOS = ['Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida','Lavalleja','Maldonado','Montevideo','Paysandu','Rio Negro','Rivera','Rocha','Salto','San Jose','Soriano','Tacuarembo','Treinta y Tres'];

@Component({
  selector: 'app-listados-departamentales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1400px">
          <thead>
            <tr>
              <th style="width:60px">Cortesia</th>
              <th style="min-width:110px">Apellidos</th>
              <th style="min-width:90px">Nombre</th>
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
                <select class="column-filter" [(ngModel)]="fCortesia">
                  <option value="">Todos</option>
                  <option>Sr.</option><option>Sra.</option><option>Dr.</option><option>Dra.</option>
                  <option>Ing.</option><option>Lic.</option><option>Cr.</option>
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombre"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fTel"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fCel"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fMail"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fPos"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fDepto">
                  <option value="">Todos</option>
                  @for (d of deptos; track d) { <option>{{ d }}</option> }
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fDir"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fCiudad"></th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtrados(); track $index) {
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
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 19 comisiones departamentales</span>
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
export class DepartamentalesComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  deptos = DEPTOS;

  data = signal<ComDep[]>([]);
  fCortesia = ''; fApellidos = ''; fNombre = ''; fTel = ''; fCel = '';
  fMail = ''; fPos = ''; fDepto = ''; fDir = ''; fCiudad = '';

  filtrados = computed(() => this.data().filter(c => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    const e = (s: string, f: string) => !f || s === f;
    return e(c.cortesia, this.fCortesia) && t(c.apellidos, this.fApellidos) && t(c.nombre, this.fNombre)
      && t(c.telefono, this.fTel) && t(c.celular, this.fCel) && t(c.mail, this.fMail)
      && t(c.posOrganismo, this.fPos) && e(c.departamento, this.fDepto)
      && t(c.dirOrganizacion, this.fDir) && t(c.ciudadOrganizacion, this.fCiudad);
  }));

  constructor() {
    this.titleSvc.set('Listados — Com. Departamentales');
    this.http.get<ComDep[]>(`${environment.apiUrl}/listados/com-departamentales`).subscribe(x => this.data.set(x));
  }
}
