import { Component, inject, signal } from '@angular/core';
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
interface Integrante {
  id: number;
  contactoId: number;
  nombre: string;
  apellido: string;
  cedula?: string;
  credencial?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  agrupacionPeriodoId: number;
  periodo: string;
  periodoPendiente: boolean;
  agrupacionId: number;
  agrupacion: string;
  sector?: string;
  depto?: string;
  cargo?: string;
  fechaIngreso?: string;
}
interface PadronItem { serie: string; nro: number; primerNombre: string; segundoNombre: string; primerApellido: string; segundoApellido: string; }

type Tab = 'todas' | 'pendientes' | 'fichas' | 'periodo' | 'integrantes' | 'padron';

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
      <a class="tab" [class.active]="tab()==='integrantes'" (click)="setTab('integrantes')">Integrantes por Agrupación</a>
      <a class="tab" [class.active]="tab()==='padron'"      (click)="setTab('padron')">Padrón Electoral</a>
    </div>

    @if (tab()==='todas') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th style="width:34px"></th>
              <th>Id</th><th>Cod. Agrup.</th><th>Cod. Depto.</th><th>Pendiente</th>
              <th>Tipo</th><th>Solic.</th><th>Nombre</th><th>Depto.</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of agrupaciones(); track a.id) {
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

    @if (tab()==='integrantes') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead>
            <tr>
              <th>Id</th>
              <th>Id C.</th>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Credencial</th>
              <th>Teléfono</th>
              <th>Celular</th>
              <th>Agrupación</th>
              <th>Período</th>
              <th>Sector</th>
              <th>Depto.</th>
              <th>Cargo</th>
              <th>Fecha Ingreso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (i of integrantes(); track i.id) {
              <tr>
                <td>{{ i.id }}</td>
                <td>{{ i.contactoId }}</td>
                <td><strong>{{ i.apellido }}, {{ i.nombre }}</strong></td>
                <td>{{ i.cedula || '—' }}</td>
                <td>{{ i.credencial || '—' }}</td>
                <td>{{ i.telefono || '—' }}</td>
                <td>{{ i.celular || '—' }}</td>
                <td>{{ i.agrupacion }}</td>
                <td>
                  <span class="badge periodo">{{ i.periodo }}</span>
                  @if (i.periodoPendiente) { <span class="badge st-pend">pend.</span> }
                </td>
                <td>{{ i.sector || '—' }}</td>
                <td><span class="badge dept">{{ i.depto || '—' }}</span></td>
                <td>{{ i.cargo || '—' }}</td>
                <td>{{ i.fechaIngreso || '—' }}</td>
                <td>
                  <button class="btn btn-sm btn-danger" (click)="eliminarIntegrante(i.id)">Eliminar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="14"><div class="empty-state"><div class="empty-state-text">Sin integrantes</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='padron') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Serie</th><th>Nro.</th><th>Primer Nombre</th><th>Segundo Nombre</th><th>Primer Apellido</th><th>Segundo Apellido</th></tr>
          </thead>
          <tbody>
            @for (p of padron(); track $index) {
              <tr>
                <td>{{ p.serie }}</td>
                <td>{{ p.nro }}</td>
                <td>{{ p.primerNombre }}</td>
                <td>{{ p.segundoNombre }}</td>
                <td><strong>{{ p.primerApellido }}</strong></td>
                <td>{{ p.segundoApellido }}</td>
              </tr>
            }
          </tbody>
        </table>
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
  `]
})
export class AgrupacionesComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  tab = signal<Tab>('todas');
  agrupaciones = signal<Agrupacion[]>([]);
  integrantes = signal<Integrante[]>([]);
  padron = signal<PadronItem[]>([]);
  expandido = signal<number | null>(null);

  toggleRow(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  constructor() {
    this.titleSvc.set('Agrupaciones');
    this.loadTodas();
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'integrantes' && this.integrantes().length === 0) this.loadIntegrantes();
    if (t === 'padron' && this.padron().length === 0) this.loadPadron();
    const label =
      t === 'todas' ? 'Agrupaciones' :
      t === 'pendientes' ? 'Agrupaciones — Pendientes' :
      t === 'fichas' ? 'Agrupaciones — Fichas Web' :
      t === 'periodo' ? 'Agrupaciones — Por Período' :
      t === 'integrantes' ? 'Agrupaciones — Integrantes' :
      'Agrupaciones — Padrón Electoral';
    this.titleSvc.set(label);
  }

  abrirNueva() {
    alert('Nueva agrupacion (formulario proximamente)');
  }

  loadTodas() { this.http.get<Agrupacion[]>(`${environment.apiUrl}/agrupaciones`).subscribe(x => this.agrupaciones.set(x)); }
  loadIntegrantes() { this.http.get<Integrante[]>(`${environment.apiUrl}/agrupaciones/integrantes`).subscribe(x => this.integrantes.set(x)); }
  eliminarIntegrante(id: number) {
    if (!confirm('¿Eliminar este integrante de la agrupación-período?')) return;
    this.http.delete(`${environment.apiUrl}/agrupacion-integrantes/${id}`).subscribe(() => {
      this.integrantes.set([]);
      this.loadIntegrantes();
    });
  }
  loadPadron() { this.http.get<PadronItem[]>(`${environment.apiUrl}/agrupaciones/padron`).subscribe(x => this.padron.set(x)); }
}
