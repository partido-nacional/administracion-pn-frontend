import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Gobierno {
  cortesia: string; apellidos: string; nombre: string; telTrabajo: string; celular: string;
  mail: string; posOrganismo: string; nombreOrganismo: string; nombreCompania: string;
}

@Component({
  selector: 'app-listados-gobierno',
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
              <th style="min-width:95px">Tel. Trabajo</th>
              <th style="min-width:95px">Celular</th>
              <th style="min-width:150px">Mail</th>
              <th style="min-width:130px">Posicion Organismo</th>
              <th style="min-width:100px">Nombre Organismo</th>
              <th style="min-width:200px">Nombre Compania</th>
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
                <select class="column-filter" [(ngModel)]="fOrg">
                  <option value="">Todos</option>
                  <option>ANP</option><option>ANTEL</option><option>UTE</option>
                  <option>CORREO</option><option>OSE</option><option>ANCAP</option>
                </select>
              </th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fCompania"></th>
            </tr>
          </thead>
          <tbody>
            @for (g of filtrados(); track $index) {
              <tr>
                <td>{{ g.cortesia }}</td>
                <td><strong>{{ g.apellidos }}</strong></td>
                <td><strong>{{ g.nombre }}</strong></td>
                <td>{{ g.telTrabajo }}</td>
                <td>{{ g.celular }}</td>
                <td>{{ g.mail }}</td>
                <td>{{ g.posOrganismo }}</td>
                <td>{{ g.nombreOrganismo }}</td>
                <td>{{ g.nombreCompania }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 28 cargos de gobierno</span>
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
export class GobiernoComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  data = signal<Gobierno[]>([]);
  fCortesia = ''; fApellidos = ''; fNombre = ''; fTel = ''; fCel = '';
  fMail = ''; fPos = ''; fOrg = ''; fCompania = '';

  filtrados = computed(() => this.data().filter(g => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    const e = (s: string, f: string) => !f || s === f;
    return e(g.cortesia, this.fCortesia) && t(g.apellidos, this.fApellidos) && t(g.nombre, this.fNombre)
      && t(g.telTrabajo, this.fTel) && t(g.celular, this.fCel) && t(g.mail, this.fMail)
      && t(g.posOrganismo, this.fPos) && e(g.nombreOrganismo, this.fOrg) && t(g.nombreCompania, this.fCompania);
  }));

  constructor() {
    this.titleSvc.set('Listados — Agrup. de Gobierno');
    this.http.get<Gobierno[]>(`${environment.apiUrl}/listados/gobierno`).subscribe(x => this.data.set(x));
  }
}
