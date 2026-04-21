import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface DirEntry {
  apellidos: string; nombres: string; celular: string; mail: string; posOrganismo: string;
}

@Component({
  selector: 'app-listados-directorio',
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
            @for (d of filtrados(); track $index) {
              <tr>
                <td><strong>{{ d.apellidos }}</strong></td>
                <td><strong>{{ d.nombres }}</strong></td>
                <td>{{ d.celular }}</td>
                <td>{{ d.mail }}</td>
                <td>{{ d.posOrganismo }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="pagination" style="padding:16px 24px">
          <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de 15 integrantes del directorio</span>
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
export class DirectorioComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  data = signal<DirEntry[]>([]);
  fApellidos = ''; fNombres = ''; fCel = ''; fMail = ''; fPos = '';

  filtrados = computed(() => this.data().filter(d => {
    const t = (s: string, f: string) => !f || (s ?? '').toLowerCase().includes(f.toLowerCase());
    return t(d.apellidos, this.fApellidos) && t(d.nombres, this.fNombres)
      && t(d.celular, this.fCel) && t(d.mail, this.fMail) && t(d.posOrganismo, this.fPos);
  }));

  constructor() {
    this.titleSvc.set('Listados — Directorio');
    this.http.get<DirEntry[]>(`${environment.apiUrl}/listados/directorio`).subscribe(x => this.data.set(x));
  }
}
