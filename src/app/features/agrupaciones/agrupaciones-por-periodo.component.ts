import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AgrupacionPeriodoRow {
  periodoId: number;
  periodo: string;
  pendiente: boolean;
  fichaAgrupacionOrigenId?: number;
  agrupacionId: number;
  codAgrup?: string;
  codDepto?: string;
  tipo?: string;
  nombre: string;
  sigla?: string;
  descripcion?: string;
  depto?: string;
  solic: number;
  sector?: string;
  clasificacion?: string;
  solicita?: string;
  fechaSolicitud?: string;
  codAnt?: string;
  nombreAnt?: string;
  domicilioLegal?: string;
  ciudad?: string;
  tel1?: string; tel2?: string; fax?: string; email?: string;
  formaRepresentacion?: string;
  representante?: string;
  delegadoCE?: string;
  formaActuacion?: string;
  fechaIngComis?: string;
  fechaRecAgrup?: string;
  fechaEntrCE?: string;
  fechaCircCE?: string;
  observaciones?: string;
  obsCE?: string;
  nota?: string;
  antecedentes?: string;
  resolucionComision?: string;
  sublema1?: string;
  sublema2?: string;
  sublema3?: string;
  sublema4?: string;
  sublema5?: string;
  sublemaRenunciado?: string;
}

@Component({
  selector: 'app-agrupaciones-por-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card"><div class="card-body" style="padding:0; overflow-x:auto">
      <table class="table">
        <thead>
          <tr>
            <th style="width:34px"></th>
            <th>Id Per.</th>
            <th>Período</th>
            <th>Estado</th>
            <th>Id Agr.</th>
            <th>Cod. Agrup.</th>
            <th>Cod. Depto.</th>
            <th>Tipo</th>
            <th>Nombre</th>
            <th>Depto.</th>
            <th>Sector</th>
            <th>Sublemas</th>
          </tr>
          <tr class="filter-row">
            <th></th>
            <th><input class="column-filter" [ngModel]="fId()"     (ngModelChange)="fId.set($event)"     placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fPeriodo()" (ngModelChange)="fPeriodo.set($event)">
                <option value="">Todos</option>
                @for (p of periodos(); track p) { <option [ngValue]="p">{{ p }}</option> }
              </select>
            </th>
            <th>
              <select class="column-filter" [ngModel]="fPend()" (ngModelChange)="fPend.set($event)">
                <option value="">Todos</option>
                <option value="si">Pendiente</option>
                <option value="no">Aprobada</option>
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fAgrId()"  (ngModelChange)="fAgrId.set($event)"  placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fCod()"    (ngModelChange)="fCod.set($event)"    placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fCodDep()" (ngModelChange)="fCodDep.set($event)" placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fTipo()" (ngModelChange)="fTipo.set($event)">
                <option value="">Todos</option>
                <option value="D">D</option>
                <option value="N">N</option>
                <option value="DEPARTAMENTAL">DEPARTAMENTAL</option>
                <option value="NACIONAL">NACIONAL</option>
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event)" placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event)">
                <option value="">Todos</option>
                @for (d of deptos(); track d) { <option [ngValue]="d">{{ d }}</option> }
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fSector()" (ngModelChange)="fSector.set($event)" placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fSublema()" (ngModelChange)="fSublema.set($event)" placeholder="Filtrar..."></th>
          </tr>
        </thead>
        <tbody>
          @for (r of filtrados(); track r.periodoId) {
            <tr class="clickable" [class.selected]="expandido() === r.periodoId" (click)="toggle(r.periodoId)">
              <td class="caret">{{ expandido() === r.periodoId ? '▾' : '▸' }}</td>
              <td>{{ r.periodoId }}</td>
              <td><span class="badge periodo">{{ r.periodo }}</span></td>
              <td>
                @if (r.pendiente) { <span class="badge st-pend">Pendiente</span> }
                @else { <span class="badge st-ok">Aprobada</span> }
              </td>
              <td>{{ r.agrupacionId }}</td>
              <td>{{ r.codAgrup || '—' }}</td>
              <td>{{ r.codDepto || '—' }}</td>
              <td>{{ r.tipo || '—' }}</td>
              <td><strong>{{ r.nombre }}</strong></td>
              <td><span class="badge dept">{{ r.depto || '—' }}</span></td>
              <td>{{ r.sector || '—' }}</td>
              <td>{{ joinSublemas(r) }}</td>
            </tr>
            @if (expandido() === r.periodoId) {
              <tr class="detalle-row">
                <td colspan="12">
                  <div class="detalle-wrap">
                    <div class="seccion">
                      <div class="seccion-title">Período</div>
                      <div class="grid">
                        <div class="kv"><span class="k">Id Período</span><span class="v">{{ r.periodoId }}</span></div>
                        <div class="kv"><span class="k">Período</span><span class="v">{{ r.periodo }}</span></div>
                        <div class="kv"><span class="k">Estado</span><span class="v">{{ r.pendiente ? 'Pendiente' : 'Aprobada' }}</span></div>
                        <div class="kv"><span class="k">Ficha origen</span><span class="v">{{ r.fichaAgrupacionOrigenId ? '#' + r.fichaAgrupacionOrigenId : '—' }}</span></div>
                      </div>
                    </div>

                    <div class="seccion">
                      <div class="seccion-title">Datos de la Agrupación</div>
                      <div class="grid">
                        <div class="kv"><span class="k">ID Agrupación</span><span class="v">{{ r.agrupacionId }}</span></div>
                        <div class="kv"><span class="k">Sigla</span><span class="v">{{ r.sigla || '—' }}</span></div>
                        <div class="kv full"><span class="k">Descripción</span><span class="v">{{ r.descripcion || '—' }}</span></div>
                        <div class="kv"><span class="k">Cod. Agrupación</span><span class="v">{{ r.codAgrup || '—' }}</span></div>
                        <div class="kv"><span class="k">Cod. Depto.</span><span class="v">{{ r.codDepto || '—' }}</span></div>
                        <div class="kv"><span class="k">Tipo</span><span class="v">{{ r.tipo === 'D' ? 'DEPARTAMENTAL' : r.tipo === 'N' ? 'NACIONAL' : (r.tipo || '—') }}</span></div>
                        <div class="kv"><span class="k">Clasificación</span><span class="v">{{ r.clasificacion || '—' }}</span></div>
                        <div class="kv"><span class="k">Solicita</span><span class="v">{{ r.solicita || '—' }}</span></div>
                        <div class="kv"><span class="k">Sector</span><span class="v">{{ r.sector || '—' }}</span></div>
                        <div class="kv"><span class="k">Solic.</span><span class="v">{{ r.solic ?? '—' }}</span></div>
                        <div class="kv"><span class="k">Fecha Solicitud</span><span class="v">{{ r.fechaSolicitud || '—' }}</span></div>
                        <div class="kv"><span class="k">Cod. Ant.</span><span class="v">{{ r.codAnt || '—' }}</span></div>
                        <div class="kv"><span class="k">Nombre Ant.</span><span class="v">{{ r.nombreAnt || '—' }}</span></div>
                      </div>
                    </div>

                    <div class="seccion">
                      <div class="seccion-title">Domicilio y Contacto</div>
                      <div class="grid">
                        <div class="kv"><span class="k">Departamento</span><span class="v">{{ r.depto || '—' }}</span></div>
                        <div class="kv"><span class="k">Ciudad</span><span class="v">{{ r.ciudad || '—' }}</span></div>
                        <div class="kv full"><span class="k">Domicilio Legal</span><span class="v">{{ r.domicilioLegal || '—' }}</span></div>
                        <div class="kv"><span class="k">Tel. 1</span><span class="v">{{ r.tel1 || '—' }}</span></div>
                        <div class="kv"><span class="k">Tel. 2</span><span class="v">{{ r.tel2 || '—' }}</span></div>
                        <div class="kv"><span class="k">Fax</span><span class="v">{{ r.fax || '—' }}</span></div>
                        <div class="kv full"><span class="k">Email</span><span class="v">{{ r.email || '—' }}</span></div>
                      </div>
                    </div>

                    <div class="seccion">
                      <div class="seccion-title">Comisión Electoral</div>
                      <div class="grid">
                        <div class="kv"><span class="k">Forma Representación</span><span class="v">{{ r.formaRepresentacion || '—' }}</span></div>
                        <div class="kv"><span class="k">Representante</span><span class="v">{{ r.representante || '—' }}</span></div>
                        <div class="kv"><span class="k">Delegado C.E.</span><span class="v">{{ r.delegadoCE || '—' }}</span></div>
                        <div class="kv"><span class="k">Forma de Actuación</span><span class="v">{{ r.formaActuacion || '—' }}</span></div>
                        <div class="kv"><span class="k">Fecha Ing. Comis.</span><span class="v">{{ r.fechaIngComis || '—' }}</span></div>
                        <div class="kv"><span class="k">Fecha Rec. Agrup.</span><span class="v">{{ r.fechaRecAgrup || '—' }}</span></div>
                        <div class="kv"><span class="k">Fecha Entr. C.E.</span><span class="v">{{ r.fechaEntrCE || '—' }}</span></div>
                        <div class="kv"><span class="k">Fecha Circ. C.E.</span><span class="v">{{ r.fechaCircCE || '—' }}</span></div>
                      </div>
                    </div>

                    <div class="seccion">
                      <div class="seccion-title">Sublemas (período {{ r.periodo }})</div>
                      <div class="grid">
                        <div class="kv"><span class="k">Sublema 1</span><span class="v">{{ r.sublema1 || '—' }}</span></div>
                        <div class="kv"><span class="k">Sublema 2</span><span class="v">{{ r.sublema2 || '—' }}</span></div>
                        <div class="kv"><span class="k">Sublema 3</span><span class="v">{{ r.sublema3 || '—' }}</span></div>
                        <div class="kv"><span class="k">Sublema 4</span><span class="v">{{ r.sublema4 || '—' }}</span></div>
                        <div class="kv"><span class="k">Sublema 5</span><span class="v">{{ r.sublema5 || '—' }}</span></div>
                        <div class="kv full"><span class="k">Sublema Renunciado</span><span class="v">{{ r.sublemaRenunciado || '—' }}</span></div>
                      </div>
                    </div>

                    <div class="seccion">
                      <div class="seccion-title">Observaciones</div>
                      <div class="grid">
                        <div class="kv full"><span class="k">Antecedentes</span><span class="v">{{ r.antecedentes || '—' }}</span></div>
                        <div class="kv full"><span class="k">Resolución de la Comisión</span><span class="v">{{ r.resolucionComision || '—' }}</span></div>
                        <div class="kv"><span class="k">Observaciones</span><span class="v">{{ r.observaciones || '—' }}</span></div>
                        <div class="kv"><span class="k">Obs. C.E.</span><span class="v">{{ r.obsCE || '—' }}</span></div>
                        <div class="kv full"><span class="k">Nota</span><span class="v">{{ r.nota || '—' }}</span></div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            }
          } @empty {
            <tr><td colspan="12"><div class="empty-state"><div class="empty-state-text">No hay agrupaciones por período que coincidan con el filtro.</div></div></td></tr>
          }
        </tbody>
      </table>
      <div class="footer">
        Mostrando {{ filtrados().length }} de {{ items().length }} agrupaciones-período
      </div>
    </div></div>
  `,
  styles: [`
    .badge.periodo { background:#eef5ff; color:#1a4f8a; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
    .badge.st-pend { background:#fff3cd; color:#856404; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
    .badge.st-ok   { background:#e6f4ea; color:#1f6f3b; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
    .footer { padding:12px 18px; font-size:13px; color:#666; border-top:1px solid #eef1f5; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .caret { color:#888; font-weight:bold; }
    .detalle-wrap { padding:18px 22px; border-top:1px solid #d6dde6; display:flex; flex-direction:column; gap:16px; }
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
  `]
})
export class AgrupacionesPorPeriodoComponent {
  private http = inject(HttpClient);

  items = signal<AgrupacionPeriodoRow[]>([]);
  expandido = signal<number | null>(null);

  toggle(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  fId = signal(''); fPeriodo = signal(''); fPend = signal('');
  fAgrId = signal(''); fCod = signal(''); fCodDep = signal('');
  fTipo = signal(''); fNombre = signal(''); fDepto = signal('');
  fSector = signal(''); fSublema = signal('');

  periodos = computed(() => Array.from(new Set(this.items().map(a => a.periodo).filter(Boolean))).sort());
  deptos   = computed(() => Array.from(new Set(this.items().map(a => a.depto).filter((d): d is string => !!d))).sort());

  joinSublemas(r: AgrupacionPeriodoRow): string {
    const s = [r.sublema1, r.sublema2, r.sublema3, r.sublema4, r.sublema5].filter(Boolean);
    return s.length ? s.join(', ') : '—';
  }

  filtrados = computed(() => {
    const norm = (s: any) => (s ?? '').toString().toLowerCase();
    const m = (val: any, q: string) => !q || norm(val).includes(q.toLowerCase());
    const fId = this.fId(), fPer = this.fPeriodo(), fPend = this.fPend(),
          fAgrId = this.fAgrId(), fCod = this.fCod(), fCodDep = this.fCodDep(),
          fTipo = this.fTipo(), fNom = this.fNombre(), fDep = this.fDepto(),
          fSec = this.fSector(), fSub = this.fSublema();
    return this.items().filter(r =>
      m(r.periodoId, fId) &&
      (!fPer || r.periodo === fPer) &&
      (!fPend || (fPend === 'si' ? r.pendiente : !r.pendiente)) &&
      m(r.agrupacionId, fAgrId) &&
      m(r.codAgrup, fCod) &&
      m(r.codDepto, fCodDep) &&
      (!fTipo || r.tipo === fTipo) &&
      m(r.nombre, fNom) &&
      (!fDep || r.depto === fDep) &&
      m(r.sector, fSec) &&
      m(this.joinSublemas(r), fSub)
    );
  });

  constructor() {
    this.http.get<AgrupacionPeriodoRow[]>(`${environment.apiUrl}/agrupaciones-periodos`).subscribe(x => this.items.set(x));
  }
}
