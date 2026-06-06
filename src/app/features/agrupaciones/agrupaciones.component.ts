import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { FichasAgrupacionComponent } from './fichas-agrupacion.component';
import { AgrupacionesPendientesComponent } from './agrupaciones-pendientes.component';
import { AgrupacionesPorPeriodoComponent } from './agrupaciones-por-periodo.component';

interface Agrupacion {
  id: number; codAgrup: string; codDepto: string; pendiente: boolean; tipo: string; solic: number;
  nombre: string; depto: string;
  clasificacion?: string; solicita?: string; sector?: string;
  fechaSolicitud?: string; codAnt?: string; sublemaRenunciado?: string;
  nombreAnt?: string; domicilioLegal?: string; ciudad?: string;
  tel1?: string; tel2?: string; fax?: string; email?: string;
  formaRepresentacion?: string; representante?: string; delegadoCE?: string; formaActuacion?: string;
  fechaIngComis?: string; fechaRecAgrup?: string; fechaEntrCE?: string; fechaCircCE?: string;
  observaciones?: string; obsCE?: string; nota?: string;
  antecedentes?: string; resolucionComision?: string;
  sublema1?: string; sublema2?: string; sublema3?: string; sublema4?: string; sublema5?: string;
}
interface PadronItem { serie: string; nro: number; primerNombre: string; segundoNombre: string; primerApellido: string; segundoApellido: string; }

type Tab = 'todas' | 'pendientes' | 'fichas' | 'periodo' | 'padron';

@Component({
  selector: 'app-agrupaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, FichasAgrupacionComponent, AgrupacionesPendientesComponent, AgrupacionesPorPeriodoComponent],
  template: `
    <div class="topbar-inline">
      <button class="btn btn-primary" (click)="abrirNueva()">+ Nueva Agrupación</button>
    </div>

    <div class="tabs">
      <a class="tab" [class.active]="tab()==='todas'"       (click)="setTab('todas')">Todas</a>
      <a class="tab" [class.active]="tab()==='pendientes'"  (click)="setTab('pendientes')">Agrupaciones Pendientes</a>
      <a class="tab" [class.active]="tab()==='fichas'"      (click)="setTab('fichas')">Fichas de Agrupación Web</a>
      <a class="tab" [class.active]="tab()==='periodo'"     (click)="setTab('periodo')">Agrupaciones por Período</a>
      <a class="tab" [class.active]="tab()==='padron'"      (click)="setTab('padron')">Padrón Electoral</a>
    </div>

    @if (tab()==='todas') {
      <div class="sort-hint">
        💡 Click en una columna para ordenar. <strong>Shift+Click</strong> para agregarla como orden secundario.
      </div>
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th style="width:34px"></th>
              <th class="sortable" (click)="onSort('id', $event)">Id <span class="ind">{{ indicador('id') }}</span></th>
              <th class="sortable" (click)="onSort('codAgrup', $event)">Cod. Agrup. <span class="ind">{{ indicador('codAgrup') }}</span></th>
              <th class="sortable" (click)="onSort('codDepto', $event)">Cod. Depto. <span class="ind">{{ indicador('codDepto') }}</span></th>
              <th class="sortable" (click)="onSort('pendiente', $event)">Pendiente <span class="ind">{{ indicador('pendiente') }}</span></th>
              <th class="sortable" (click)="onSort('tipo', $event)">Tipo <span class="ind">{{ indicador('tipo') }}</span></th>
              <th class="sortable" (click)="onSort('solic', $event)">Solic. <span class="ind">{{ indicador('solic') }}</span></th>
              <th class="sortable" (click)="onSort('nombre', $event)">Nombre <span class="ind">{{ indicador('nombre') }}</span></th>
              <th class="sortable" (click)="onSort('depto', $event)">Depto. <span class="ind">{{ indicador('depto') }}</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of agrupacionesOrdenadas(); track a.id) {
              <tr class="clickable" [class.selected]="expandido() === a.id" (click)="toggleRow(a.id)">
                <td class="caret">{{ expandido() === a.id ? '▾' : '▸' }}</td>
                <td>{{ a.id }}</td>
                <td>{{ a.codAgrup }}</td>
                <td>{{ a.codDepto }}</td>
                <td>{{ a.pendiente ? '☑' : '☐' }}</td>
                <td>{{ a.tipo }}</td>
                <td>{{ a.solic }}</td>
                <td><strong>{{ a.nombre }}</strong></td>
                <td><span class="badge dept">{{ a.depto }}</span></td>
                <td (click)="$event.stopPropagation()"><a class="action-link">Editar</a></td>
              </tr>
              @if (expandido() === a.id) {
                <tr class="detalle-row">
                  <td colspan="10">
                    <div class="detalle-wrap">
                      <div class="seccion">
                        <div class="seccion-title">Datos de la Agrupación</div>
                        <div class="grid">
                          <div class="kv"><span class="k">ID Agrupación</span><span class="v">{{ a.id }}</span></div>
                          <div class="kv"><span class="k">Cod. Agrupación</span><span class="v">{{ a.codAgrup || '—' }}</span></div>
                          <div class="kv"><span class="k">Cod. Depto.</span><span class="v">{{ a.codDepto || '—' }}</span></div>
                          <div class="kv"><span class="k">Pendiente</span><span class="v">{{ a.pendiente ? 'Sí' : 'No' }}</span></div>
                          <div class="kv"><span class="k">Tipo</span><span class="v">{{ a.tipo === 'D' ? 'DEPARTAMENTAL' : a.tipo === 'N' ? 'NACIONAL' : a.tipo }}</span></div>
                          <div class="kv"><span class="k">Clasificación</span><span class="v">{{ a.clasificacion || '—' }}</span></div>
                          <div class="kv"><span class="k">Solicita</span><span class="v">{{ a.solicita || '—' }}</span></div>
                          <div class="kv"><span class="k">Sector</span><span class="v">{{ a.sector || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Solicitud</span><span class="v">{{ a.fechaSolicitud || '—' }}</span></div>
                          <div class="kv"><span class="k">Cod. Ant.</span><span class="v">{{ a.codAnt || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema Renunciado</span><span class="v">{{ a.sublemaRenunciado || '—' }}</span></div>
                          <div class="kv"><span class="k">Nombre Ant.</span><span class="v">{{ a.nombreAnt || '—' }}</span></div>
                        </div>
                      </div>

                      <div class="seccion">
                        <div class="seccion-title">Domicilio y Contacto</div>
                        <div class="grid">
                          <div class="kv"><span class="k">Departamento</span><span class="v">{{ a.depto || '—' }}</span></div>
                          <div class="kv"><span class="k">Ciudad</span><span class="v">{{ a.ciudad || '—' }}</span></div>
                          <div class="kv full"><span class="k">Domicilio Legal</span><span class="v">{{ a.domicilioLegal || '—' }}</span></div>
                          <div class="kv"><span class="k">Tel. 1</span><span class="v">{{ a.tel1 || '—' }}</span></div>
                          <div class="kv"><span class="k">Tel. 2</span><span class="v">{{ a.tel2 || '—' }}</span></div>
                          <div class="kv"><span class="k">Fax</span><span class="v">{{ a.fax || '—' }}</span></div>
                          <div class="kv full"><span class="k">Email</span><span class="v">{{ a.email || '—' }}</span></div>
                        </div>
                      </div>

                      <div class="seccion">
                        <div class="seccion-title">Comisión Electoral</div>
                        <div class="grid">
                          <div class="kv"><span class="k">Forma Representación</span><span class="v">{{ a.formaRepresentacion || '—' }}</span></div>
                          <div class="kv"><span class="k">Representante</span><span class="v">{{ a.representante || '—' }}</span></div>
                          <div class="kv"><span class="k">Delegado C.E.</span><span class="v">{{ a.delegadoCE || '—' }}</span></div>
                          <div class="kv"><span class="k">Forma de Actuación</span><span class="v">{{ a.formaActuacion || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Ing. Comis.</span><span class="v">{{ a.fechaIngComis || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Rec. Agrup.</span><span class="v">{{ a.fechaRecAgrup || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Entr. C.E.</span><span class="v">{{ a.fechaEntrCE || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Circ. C.E.</span><span class="v">{{ a.fechaCircCE || '—' }}</span></div>
                        </div>
                      </div>

                      <div class="seccion">
                        <div class="seccion-title">Sublemas</div>
                        <div class="grid">
                          <div class="kv"><span class="k">Sublema 1</span><span class="v">{{ a.sublema1 || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema 2</span><span class="v">{{ a.sublema2 || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema 3</span><span class="v">{{ a.sublema3 || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema 4</span><span class="v">{{ a.sublema4 || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema 5</span><span class="v">{{ a.sublema5 || '—' }}</span></div>
                        </div>
                      </div>

                      <div class="seccion">
                        <div class="seccion-title">Observaciones</div>
                        <div class="grid">
                          <div class="kv full"><span class="k">Antecedentes</span><span class="v">{{ a.antecedentes || '—' }}</span></div>
                          <div class="kv full"><span class="k">Resolución de la Comisión</span><span class="v">{{ a.resolucionComision || '—' }}</span></div>
                          <div class="kv"><span class="k">Observaciones</span><span class="v">{{ a.observaciones || '—' }}</span></div>
                          <div class="kv"><span class="k">Obs. C.E.</span><span class="v">{{ a.obsCE || '—' }}</span></div>
                          <div class="kv full"><span class="k">Nota</span><span class="v">{{ a.nota || '—' }}</span></div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            } @empty {
              <tr><td colspan="10"><div class="empty-state"><div class="empty-state-text">Sin agrupaciones</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='pendientes') {
      <app-agrupaciones-pendientes></app-agrupaciones-pendientes>
    }

    @if (tab()==='fichas') {
      <app-fichas-agrupacion></app-fichas-agrupacion>
    }

    @if (tab()==='periodo') {
      <app-agrupaciones-por-periodo></app-agrupaciones-por-periodo>
    }


    @if (tab()==='padron') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Serie</th><th>Nro.</th><th>Primer Nombre</th><th>Segundo Nombre</th><th>Primer Apellido</th><th>Segundo Apellido</th>
            </tr>
            <tr class="filter-row">
              <th>
                <select class="column-filter" [ngModel]="fPadSerie()" (ngModelChange)="fPadSerie.set($event)">
                  <option value="">Todas</option>
                  @for (s of padronSeries(); track s) { <option [ngValue]="s">{{ s }}</option> }
                </select>
              </th>
              <th><input class="column-filter" [ngModel]="fPadNro()"    (ngModelChange)="fPadNro.set($event)"    placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fPadPNom()"   (ngModelChange)="fPadPNom.set($event)"   placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fPadSNom()"   (ngModelChange)="fPadSNom.set($event)"   placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fPadPApe()"   (ngModelChange)="fPadPApe.set($event)"   placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fPadSApe()"   (ngModelChange)="fPadSApe.set($event)"   placeholder="Filtrar..."></th>
            </tr>
          </thead>
          <tbody>
            @for (p of padronFiltrado(); track $index) {
              <tr>
                <td>{{ p.serie }}</td>
                <td>{{ p.nro }}</td>
                <td>{{ p.primerNombre }}</td>
                <td>{{ p.segundoNombre }}</td>
                <td><strong>{{ p.primerApellido }}</strong></td>
                <td>{{ p.segundoApellido }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="empty-state"><div class="empty-state-text">No hay resultados para el filtro.</div></div></td></tr>
            }
          </tbody>
        </table>
        <div style="padding:12px 18px; font-size:13px; color:#666; border-top:1px solid #eef1f5">
          Mostrando {{ padronFiltrado().length }} de {{ padron().length }} entradas
        </div>
      </div></div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .caret { color:#888; font-weight:bold; }
    .detalle-wrap {
      padding:18px 22px; border-top:1px solid #d6dde6;
      display:flex; flex-direction:column; gap:16px;
    }
    .seccion { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:14px 18px; }
    .seccion-title {
      font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase;
      letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px;
      border-bottom:1px solid #eef1f5;
    }
    .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 24px; }
    @media (max-width: 900px) { .grid { grid-template-columns:repeat(2, 1fr); } }
    @media (max-width: 600px) { .grid { grid-template-columns:1fr; } }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv.full { grid-column:1 / -1; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }
    .badge.periodo { background:#eef5ff; color:#1a4f8a; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
    .badge.st-pend { background:#fff3cd; color:#856404; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; margin-left:4px; }
    .sort-hint {
      background:#f0f6ff; border:1px solid #d6e4f5; border-radius:5px;
      padding:6px 12px; margin-bottom:12px; font-size:12px; color:#3d4f6b;
    }
    th.sortable { cursor:pointer; user-select:none; }
    th.sortable:hover { background:#eef2f7; }
    th.sortable .ind {
      display:inline-block; min-width:18px; color:#1a4f8a; font-weight:700;
      margin-left:2px;
    }
  `]
})
export class AgrupacionesComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  tab = signal<Tab>('todas');
  agrupaciones = signal<Agrupacion[]>([]);
  padron = signal<PadronItem[]>([]);

  fPadSerie = signal(''); fPadNro = signal('');
  fPadPNom = signal('');  fPadSNom = signal('');
  fPadPApe = signal('');  fPadSApe = signal('');

  padronSeries = computed(() => Array.from(new Set(this.padron().map(p => p.serie).filter(Boolean))).sort());

  padronFiltrado = computed(() => {
    const norm = (s: any) => (s ?? '').toString().toLowerCase();
    const m = (val: any, q: string) => !q || norm(val).includes(q.toLowerCase());
    const fS = this.fPadSerie(), fN = this.fPadNro(),
          fPN = this.fPadPNom(), fSN = this.fPadSNom(),
          fPA = this.fPadPApe(), fSA = this.fPadSApe();
    return this.padron().filter(p =>
      (!fS || p.serie === fS) &&
      m(p.nro, fN) &&
      m(p.primerNombre, fPN) &&
      m(p.segundoNombre, fSN) &&
      m(p.primerApellido, fPA) &&
      m(p.segundoApellido, fSA)
    );
  });
  expandido = signal<number | null>(null);

  sortBy = signal<{col: keyof Agrupacion; dir: 'asc' | 'desc'}[]>([
    { col: 'nombre', dir: 'asc' }
  ]);

  agrupacionesOrdenadas = computed(() => {
    const sorts = this.sortBy();
    if (sorts.length === 0) return this.agrupaciones();
    return [...this.agrupaciones()].sort((a, b) => {
      for (const { col, dir } of sorts) {
        const av = (a as any)[col], bv = (b as any)[col];
        const c = this.cmp(av, bv);
        if (c !== 0) return dir === 'asc' ? c : -c;
      }
      return 0;
    });
  });

  onSort(col: keyof Agrupacion, ev: MouseEvent) {
    const current = [...this.sortBy()];
    const idx = current.findIndex(s => s.col === col);
    if (ev.shiftKey) {
      if (idx >= 0) {
        current[idx] = { col, dir: current[idx].dir === 'asc' ? 'desc' : 'asc' };
      } else {
        current.push({ col, dir: 'asc' });
      }
      this.sortBy.set(current);
    } else {
      if (idx === 0 && current.length === 1) {
        this.sortBy.set([{ col, dir: current[0].dir === 'asc' ? 'desc' : 'asc' }]);
      } else {
        this.sortBy.set([{ col, dir: 'asc' }]);
      }
    }
  }

  indicador(col: keyof Agrupacion): string {
    const sorts = this.sortBy();
    const idx = sorts.findIndex(s => s.col === col);
    if (idx < 0) return '';
    const arrow = sorts[idx].dir === 'asc' ? '▲' : '▼';
    return sorts.length > 1 ? `${arrow}${idx + 1}` : arrow;
  }

  private cmp(a: any, b: any): number {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true });
  }

  toggleRow(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  constructor() {
    this.titleSvc.set('Agrupaciones');
    this.loadTodas();
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'padron' && this.padron().length === 0) this.loadPadron();
    const label =
      t === 'todas' ? 'Agrupaciones' :
      t === 'pendientes' ? 'Agrupaciones — Pendientes' :
      t === 'fichas' ? 'Agrupaciones — Fichas Web' :
      t === 'periodo' ? 'Agrupaciones — Por Período' :
      'Agrupaciones — Padrón Electoral';
    this.titleSvc.set(label);
  }

  abrirNueva() {
    alert('Nueva agrupacion (formulario proximamente)');
  }

  loadTodas() { this.http.get<Agrupacion[]>(`${environment.apiUrl}/agrupaciones`).subscribe(x => this.agrupaciones.set(x)); }
  loadPadron() { this.http.get<PadronItem[]>(`${environment.apiUrl}/agrupaciones/padron`).subscribe(x => this.padron.set(x)); }
}
