import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface ContactoListado {
  id: number; nombre: string; apellido: string; cedula?: string;
  departamento?: string; telefono?: string; email?: string; adhesion?: string;
}

type Tab = 'todos' | 'padron' | 'duplicados' | 'exportar';

@Component({
  selector: 'app-agenda-listado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="topbar-inline">
      <a routerLink="/agenda/nuevo" class="btn btn-primary">+ Nuevo Contacto</a>
    </div>

    <div class="tabs">
      <a class="tab" [class.active]="tab()==='todos'"      (click)="tab.set('todos')">Todos los contactos</a>
      <a class="tab" [class.active]="tab()==='padron'"     (click)="tab.set('padron')">Padron Electoral</a>
      <a class="tab" [class.active]="tab()==='duplicados'" (click)="tab.set('duplicados')">Duplicados</a>
      <a class="tab" [class.active]="tab()==='exportar'"   (click)="tab.set('exportar')">Exportar</a>
    </div>

    @if (tab() === 'todos') {
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input class="search-input" placeholder="Buscar por nombre, cedula, telefono..."
                   [(ngModel)]="q" (keyup.enter)="reload()">
          </div>
          <div class="filter-bar">
            @for (d of deptos; track d) {
              <span class="filter-chip" [class.active]="depto()===d" (click)="setDepto(d)">{{ d || 'Todos' }}</span>
            }
          </div>
        </div>
        <button class="btn btn-secondary">Exportar</button>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Cedula</th>
                <th>Departamento</th>
                <th>Telefono</th>
                <th>Email</th>
                <th>Adhesion</th>
                <th></th>
              </tr>
              <tr class="filter-row">
                <th><input class="column-filter" [ngModel]="fId()"     (ngModelChange)="fId.set($event)"     placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event)" placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fCedula()" (ngModelChange)="fCedula.set($event)" placeholder="Filtrar..."></th>
                <th>
                  <select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event)">
                    <option value="">Todos</option>
                    @for (d of deptos; track d) { @if (d) { <option>{{ d }}</option> } }
                  </select>
                </th>
                <th><input class="column-filter" [ngModel]="fTel()"   (ngModelChange)="fTel.set($event)"   placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fEmail()" (ngModelChange)="fEmail.set($event)" placeholder="Filtrar..."></th>
                <th>
                  <select class="column-filter" [ngModel]="fAdh()" (ngModelChange)="fAdh.set($event)">
                    <option value="">Todas</option>
                    <option>Activa</option>
                    <option>Pendiente</option>
                    <option>Baja</option>
                  </select>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of filtrados(); track c.id) {
                <tr>
                  <td>{{ c.id }}</td>
                  <td><strong>{{ c.apellido }}, {{ c.nombre }}</strong></td>
                  <td>{{ c.cedula || '—' }}</td>
                  <td>
                    @if (c.departamento) {
                      <span class="badge dept">{{ c.departamento }}</span>
                    } @else { — }
                  </td>
                  <td>{{ c.telefono || '—' }}</td>
                  <td>{{ c.email || '—' }}</td>
                  <td>
                    @if (c.adhesion === 'Activa') {
                      <span class="badge status-active">Activa</span>
                    } @else if (c.adhesion === 'Pendiente') {
                      <span class="badge status-pending">Pendiente</span>
                    } @else if (c.adhesion === 'Baja') {
                      <span class="badge status-rejected">Baja</span>
                    } @else { -- }
                  </td>
                  <td>
                    <div class="action-group">
                      <a [routerLink]="['/agenda', c.id]" class="action-link">Ver</a>
                      <a [routerLink]="['/agenda', c.id]" class="action-link">Editar</a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8"><div class="empty-state"><div class="empty-state-text">Sin contactos</div></div></td></tr>
              }
            </tbody>
          </table>
          <div class="pagination" style="padding:16px 24px">
            <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de {{ contactos().length }} contactos</span>
            <div class="pagination-buttons">
              <button class="page-btn">&lt;</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'padron') {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Padron Electoral — proximamente</div></div></div></div>
    }
    @if (tab() === 'duplicados') {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Duplicados — proximamente</div></div></div></div>
    }
    @if (tab() === 'exportar') {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Exportar — proximamente</div></div></div></div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
  `]
})
export class AgendaListadoComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  tab = signal<Tab>('todos');
  q = '';
  depto = signal<string>('');
  deptos = ['', 'Montevideo', 'Canelones', 'Maldonado', 'Salto'];
  contactos = signal<ContactoListado[]>([]);

  fId = signal('');
  fNombre = signal('');
  fCedula = signal('');
  fDepto = signal('');
  fTel = signal('');
  fEmail = signal('');
  fAdh = signal('');

  filtrados = computed(() => {
    const norm = (s: any) => (s ?? '').toString().toLowerCase();
    const m = (val: any, q: string) => !q || norm(val).includes(q.toLowerCase());
    const fId = this.fId(), fNom = this.fNombre(), fCed = this.fCedula(),
          fDep = this.fDepto(), fTel = this.fTel(), fMail = this.fEmail(), fAdh = this.fAdh();
    return this.contactos().filter(c =>
      m(c.id, fId) &&
      m(`${c.apellido}, ${c.nombre}`, fNom) &&
      m(c.cedula, fCed) &&
      (!fDep || c.departamento === fDep) &&
      m(c.telefono, fTel) &&
      m(c.email, fMail) &&
      (!fAdh || (c.adhesion ?? '') === fAdh)
    );
  });

  constructor() {
    this.titleSvc.set('Agenda');
    this.reload();
  }

  setDepto(d: string) { this.depto.set(d); this.reload(); }

  reload() {
    const params: any = {};
    if (this.q) params.q = this.q;
    if (this.depto()) params.departamento = this.depto();
    this.http.get<ContactoListado[]>(`${environment.apiUrl}/contactos`, { params })
      .subscribe(x => this.contactos.set(x));
  }
}
