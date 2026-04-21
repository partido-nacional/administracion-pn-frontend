import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Convencional { id: number; nombre: string; lista: string; codigoLrf: string; departamento: string; cargoLista: string; contacto: string; }
interface Lista { codigoLrf: string; nombre: string; departamento: string; titulares: number; suplentes: number; }
interface IntegranteLista { nombre: string; cedula: string; lista: string; codigoLrf: string; tipo: string; departamento: string; cargoLista: string; orden: number; contacto: string; }
interface Stats { nacionales: number; departamentales: number; listasOdn: number; listasOdd: number; }

type Tab = 'nacionales' | 'departamentales' | 'odn' | 'odd' | 'integrantes';

@Component({
  selector: 'app-convencionales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tabs">
      <a class="tab" [class.active]="tab()==='nacionales'"      (click)="setTab('nacionales')">Nacionales</a>
      <a class="tab" [class.active]="tab()==='departamentales'" (click)="setTab('departamentales')">Departamentales</a>
      <a class="tab" [class.active]="tab()==='odn'"             (click)="setTab('odn')">Listas ODN</a>
      <a class="tab" [class.active]="tab()==='odd'"             (click)="setTab('odd')">Listas ODD</a>
      <a class="tab" [class.active]="tab()==='integrantes'"     (click)="setTab('integrantes')">Integrantes de Lista</a>
    </div>

    @if (tab()==='nacionales') {
      <div class="stats-grid" style="margin-top:20px">
        <div class="stat-card"><div class="stat-value">{{ stats().nacionales }}</div><div class="stat-label">Conv. Nacionales</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats().departamentales }}</div><div class="stat-label">Conv. Departamentales</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats().listasOdn }}</div><div class="stat-label">Listas ODN</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats().listasOdd }}</div><div class="stat-label">Listas ODD</div></div>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input class="search-input" placeholder="Buscar por nombre, lista, departamento…" [(ngModel)]="q">
          </div>
        </div>
        <button class="btn btn-secondary">Exportar TSV</button>
      </div>

      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Lista ODN</th><th>Código LRF</th><th>Departamento</th><th>Cargo</th><th>Contacto</th><th></th></tr>
          </thead>
          <tbody>
            @for (c of filtrar(nacionales()); track c.id) {
              <tr>
                <td>{{ c.id }}</td>
                <td><strong>{{ c.nombre }}</strong></td>
                <td>{{ c.lista }}</td>
                <td>{{ c.codigoLrf }}</td>
                <td><span class="badge dept">{{ c.departamento }}</span></td>
                <td>{{ c.cargoLista }}</td>
                <td><a class="action-link">{{ c.contacto }}</a></td>
                <td class="action-group">
                  <a class="action-link">Detalle</a>
                  <a class="action-link">Editar</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='departamentales') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Lista ODD</th><th>Código LRF</th><th>Departamento</th><th>Cargo</th><th>Contacto</th></tr>
          </thead>
          <tbody>
            @for (c of departamentales(); track c.id) {
              <tr>
                <td>{{ c.id }}</td>
                <td><strong>{{ c.nombre }}</strong></td>
                <td>{{ c.lista }}</td>
                <td>{{ c.codigoLrf }}</td>
                <td><span class="badge dept">{{ c.departamento }}</span></td>
                <td>{{ c.cargoLista }}</td>
                <td><a class="action-link">{{ c.contacto }}</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='odn' || tab()==='odd') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Código LRF</th><th>Nombre de Lista</th><th>Departamento</th><th>Titulares</th><th>Suplentes</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            @for (l of (tab()==='odn' ? odn() : odd()); track l.codigoLrf) {
              <tr>
                <td><strong>{{ l.codigoLrf }}</strong></td>
                <td>{{ l.nombre }}</td>
                <td><span class="badge dept">{{ l.departamento }}</span></td>
                <td>{{ l.titulares }}</td>
                <td>{{ l.suplentes }}</td>
                <td>{{ l.titulares + l.suplentes }}</td>
                <td class="action-group">
                  <a class="action-link">Ver Integrantes</a>
                  <a class="action-link">Editar</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='integrantes') {
      <div class="toolbar">
        <div class="toolbar-left">
          <select class="form-select" [(ngModel)]="filtroTipo" style="min-width:160px">
            <option value="">— Tipo —</option><option>ODN</option><option>ODD</option>
          </select>
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input class="search-input" placeholder="Buscar integrante…" [(ngModel)]="q">
          </div>
        </div>
      </div>
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Nombre</th><th>Cédula</th><th>Lista</th><th>Código LRF</th><th>Tipo</th><th>Depto.</th><th>Cargo</th><th>Orden</th><th>Contacto</th></tr>
          </thead>
          <tbody>
            @for (i of filtrarInteg(); track $index) {
              <tr>
                <td><strong>{{ i.nombre }}</strong></td>
                <td>{{ i.cedula }}</td>
                <td>{{ i.lista }}</td>
                <td>{{ i.codigoLrf }}</td>
                <td>{{ i.tipo }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
                <td>{{ i.cargoLista }}</td>
                <td>{{ i.orden }}</td>
                <td><a class="action-link">{{ i.contacto }}</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }
  `
})
export class ConvencionalesComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  tab = signal<Tab>('nacionales');
  q = '';
  filtroTipo = '';

  nacionales = signal<Convencional[]>([]);
  departamentales = signal<Convencional[]>([]);
  odn = signal<Lista[]>([]);
  odd = signal<Lista[]>([]);
  integ = signal<IntegranteLista[]>([]);
  stats = signal<Stats>({ nacionales: 0, departamentales: 0, listasOdn: 0, listasOdd: 0 });

  constructor() {
    this.titleSvc.set('Convencionales');
    this.http.get<Stats>(`${environment.apiUrl}/convencionales/stats`).subscribe(s => this.stats.set(s));
    this.http.get<Convencional[]>(`${environment.apiUrl}/convencionales/nacionales`).subscribe(x => this.nacionales.set(x));
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'departamentales' && this.departamentales().length === 0)
      this.http.get<Convencional[]>(`${environment.apiUrl}/convencionales/departamentales`).subscribe(x => this.departamentales.set(x));
    if (t === 'odn' && this.odn().length === 0)
      this.http.get<Lista[]>(`${environment.apiUrl}/convencionales/listas/odn`).subscribe(x => this.odn.set(x));
    if (t === 'odd' && this.odd().length === 0)
      this.http.get<Lista[]>(`${environment.apiUrl}/convencionales/listas/odd`).subscribe(x => this.odd.set(x));
    if (t === 'integrantes' && this.integ().length === 0)
      this.http.get<IntegranteLista[]>(`${environment.apiUrl}/convencionales/integrantes`).subscribe(x => this.integ.set(x));
  }

  filtrar(arr: Convencional[]) {
    if (!this.q) return arr;
    const q = this.q.toLowerCase();
    return arr.filter(c => c.nombre.toLowerCase().includes(q) || c.lista.toLowerCase().includes(q) || c.departamento.toLowerCase().includes(q));
  }

  filtrarInteg() {
    let arr = this.integ();
    if (this.filtroTipo) arr = arr.filter(i => i.tipo === this.filtroTipo);
    if (this.q) {
      const q = this.q.toLowerCase();
      arr = arr.filter(i => i.nombre.toLowerCase().includes(q) || i.lista.toLowerCase().includes(q));
    }
    return arr;
  }
}
