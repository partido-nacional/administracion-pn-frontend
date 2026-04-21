import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface ConvL {
  idContacto: number; credCivica: string; apellidos: string; nombres: string; celular: string;
  mail: string; posOrganismo: string; nombreOrganismo: string; condicion: string; adherente: boolean;
}

@Component({
  selector: 'app-listados-convencionales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table" style="min-width:1350px">
          <thead>
            <tr>
              <th style="width:70px">ID Contacto</th>
              <th style="min-width:85px">Cred. Civica</th>
              <th style="min-width:110px">Apellidos</th>
              <th style="min-width:90px">Nombres</th>
              <th style="min-width:95px">Celular</th>
              <th style="min-width:160px">Mail</th>
              <th style="min-width:130px">Posicion Organismo</th>
              <th style="min-width:140px">Nombre Organismo</th>
              <th style="min-width:100px">Condicion</th>
              <th style="min-width:70px; text-align:center">Adherente</th>
            </tr>
            <tr class="filter-row">
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fId"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fCred"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombres"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fCel"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fMail"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fPos"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fOrg"></th>
              <th>
                <select class="column-filter" [(ngModel)]="fCondicion">
                  <option value="">Todos</option>
                  <option>Titular</option>
                  <option>Suplente</option>
                </select>
              </th>
              <th>
                <select class="column-filter" [(ngModel)]="fAdherente">
                  <option value="">Todos</option>
                  <option value="si">Si</option>
                  <option value="no">No</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtrados(); track c.idContacto) {
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
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 500 convencionales</span>
          <button class="btn btn-export btn-sm">📄 Exportar a Excel</button>
          <div class="pagination-buttons">
            <button class="page-btn">&lt;</button>
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">3</button>
            <button class="page-btn">...</button>
            <button class="page-btn">100</button>
            <button class="page-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConvencionalesListadoComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  data = signal<ConvL[]>([]);
  fId = ''; fCred = ''; fApellidos = ''; fNombres = ''; fCel = '';
  fMail = ''; fPos = ''; fOrg = ''; fCondicion = ''; fAdherente = '';

  filtrados = computed(() => this.data().filter(c => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    if (this.fId && !String(c.idContacto).includes(this.fId)) return false;
    if (this.fCondicion && c.condicion !== this.fCondicion) return false;
    if (this.fAdherente === 'si' && !c.adherente) return false;
    if (this.fAdherente === 'no' && c.adherente) return false;
    return t(c.credCivica, this.fCred) && t(c.apellidos, this.fApellidos) && t(c.nombres, this.fNombres)
      && t(c.celular, this.fCel) && t(c.mail, this.fMail)
      && t(c.posOrganismo, this.fPos) && t(c.nombreOrganismo, this.fOrg);
  }));

  constructor() {
    this.titleSvc.set('Listados — Convencionales');
    this.http.get<ConvL[]>(`${environment.apiUrl}/listados/convencionales`).subscribe(x => this.data.set(x));
  }
}
