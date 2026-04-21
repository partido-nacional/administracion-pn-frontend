import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Joven {
  apellidos: string; nombres: string; celular: string; mail: string; posOrganismo: string;
}

@Component({
  selector: 'app-listados-jovenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body" style="padding:0">
        <table class="table">
          <thead>
            <tr>
              <th style="min-width:130px">Apellidos</th>
              <th style="min-width:110px">Nombres</th>
              <th style="min-width:110px">Celular</th>
              <th style="min-width:180px">Mail</th>
              <th style="min-width:150px">Posicion Organismo</th>
            </tr>
            <tr class="filter-row">
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fApellidos"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fNombres"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fCel"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fMail"></th>
              <th><input type="text" class="column-filter" placeholder="Filtrar..." [(ngModel)]="fPos"></th>
            </tr>
          </thead>
          <tbody>
            @for (j of filtrados(); track $index) {
              <tr>
                <td><strong>{{ j.apellidos }}</strong></td>
                <td><strong>{{ j.nombres }}</strong></td>
                <td>{{ j.celular }}</td>
                <td>{{ j.mail }}</td>
                <td>{{ j.posOrganismo }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 42 integrantes</span>
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
export class JovenesComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  data = signal<Joven[]>([]);
  fApellidos = ''; fNombres = ''; fCel = ''; fMail = ''; fPos = '';

  filtrados = computed(() => this.data().filter(j => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    return t(j.apellidos, this.fApellidos) && t(j.nombres, this.fNombres)
      && t(j.celular, this.fCel) && t(j.mail, this.fMail) && t(j.posOrganismo, this.fPos);
  }));

  constructor() {
    this.titleSvc.set('Listados — Com. Jovenes');
    this.http.get<Joven[]>(`${environment.apiUrl}/listados/jovenes`).subscribe(x => this.data.set(x));
  }
}
