import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { imprimirAgrupacion } from './imprimir-agrupacion';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { GridQuery, PagedResult, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { buildPagedParams } from '../../core/services/paged';
import { toggleSort, sortArrow } from '../../shared/grid/grid-sort';

interface AgrupacionPendiente {
  id: number;
  fichaAgrupacionOrigenId?: number;
  nombre: string;
  codAgrup?: string; codDepto?: string; pendiente: boolean; tipo?: string; solic: number; depto?: string;
  clasificacion?: string; solicita?: string; sector?: string;
  fechaSolicitud?: string; codAnt?: string; sublemaRenunciado?: string; nombreAnt?: string;
  domicilioLegal?: string; ciudad?: string;
  tel1?: string; tel2?: string; fax?: string; email?: string;
  formaRepresentacion?: string; representante?: string; delegadoCE?: string; formaActuacion?: string;
  fechaIngComis?: string; fechaRecAgrup?: string; fechaEntrCE?: string; fechaCircCE?: string;
  observaciones?: string; obsCE?: string; nota?: string;
  antecedentes?: string; resolucionComision?: string;
  sublema1?: string; sublema2?: string; sublema3?: string; sublema4?: string; sublema5?: string;
}

const DEPARTAMENTOS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
  'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
  'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres', 'Nacional'
];

import { DEPARTAMENTOS as DEPTOS_CANONICOS } from '../../core/departamentos';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-agrupaciones-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    @if (loading() && !cargado()) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando agrupaciones pendientes…</div></div></div></div>
    } @else if (items().length === 0 && !hayFiltros()) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">No hay agrupaciones pendientes. Promové una desde la pestaña Fichas de Agrupación Web.</div></div></div></div>
    } @else {
      <div class="card"><div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table">
          <thead>
            <tr class="filter-row">
              <th></th>
              <th><input class="column-filter" [ngModel]="fId()" (ngModelChange)="fId.set($event); onFilter()" placeholder="Id"></th>
              <th><input class="column-filter" [ngModel]="fCod()" (ngModelChange)="fCod.set($event); onFilter()" placeholder="Filtrar..."></th>
              <th></th><th></th>
              <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event); onFilter()" placeholder="Filtrar..."></th>
              <th><select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event); onFilter()"><option value="">Todos</option>@for (d of deptosFiltro; track d) { <option [ngValue]="d">{{ d }}</option> }</select></th>
              <th></th><th></th>
            </tr>
            <tr>
              <th style="width:34px"></th>
              <th class="sortable" (click)="sortBy('id')">Id {{ arrow('id') }}</th>
              <th class="sortable" (click)="sortBy('codagrup')">Cod. Agrup. {{ arrow('codagrup') }}</th>
              <th class="sortable" (click)="sortBy('coddepto')">Cod. Depto. {{ arrow('coddepto') }}</th>
              <th class="sortable" (click)="sortBy('tipo')">Tipo {{ arrow('tipo') }}</th>
              <th class="sortable" (click)="sortBy('nombre')">Nombre {{ arrow('nombre') }}</th>
              <th class="sortable" (click)="sortBy('depto')">Depto. {{ arrow('depto') }}</th>
              <th>Origen</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of items(); track a.id) {
              <tr class="clickable" [class.selected]="expandido() === a.id" (click)="toggle(a.id)">
                <td class="caret">{{ expandido() === a.id ? '▾' : '▸' }}</td>
                <td>{{ a.id }}</td>
                <td>{{ a.codAgrup || '—' }}</td>
                <td>{{ a.codDepto || '—' }}</td>
                <td>{{ a.tipo === 'DEPARTAMENTAL' ? 'D' : a.tipo === 'NACIONAL' ? 'N' : (a.tipo || '—') }}</td>
                <td><strong>{{ a.nombre }}</strong></td>
                <td><span class="badge dept">{{ a.depto || '—' }}</span></td>
                <td>{{ a.fichaAgrupacionOrigenId ? 'Ficha #' + a.fichaAgrupacionOrigenId : '—' }}</td>
                <td (click)="$event.stopPropagation()" style="white-space:nowrap">
                  <button class="btn-pencil" (click)="abrirModal(a, 'editar')" title="Editar">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                  <button class="btn btn-sm btn-success" (click)="abrirModal(a, 'aprobar')" style="margin-left:6px">Aprobar</button>
                  <button class="btn btn-sm btn-secondary" (click)="imprimir(a)" style="margin-left:6px" title="Imprimir / PDF">🖨</button>
                  <button class="btn btn-sm btn-danger" (click)="eliminar(a.id)" style="margin-left:6px">Eliminar</button>
                </td>
              </tr>
              @if (expandido() === a.id) {
                <tr class="detalle-row">
                  <td colspan="9">
                    <div class="detalle-wrap">
                      <div class="seccion">
                        <div class="seccion-title">Datos de la Agrupación</div>
                        <div class="grid">
                          <div class="kv"><span class="k">ID</span><span class="v">{{ a.id }}</span></div>
                          <div class="kv"><span class="k">Cod. Agrupación</span><span class="v">{{ a.codAgrup || '—' }}</span></div>
                          <div class="kv"><span class="k">Cod. Depto.</span><span class="v">{{ a.codDepto || '—' }}</span></div>
                          <div class="kv"><span class="k">Pendiente</span><span class="v">{{ a.pendiente ? 'Sí' : 'No' }}</span></div>
                          <div class="kv"><span class="k">Tipo</span><span class="v">{{ a.tipo || '—' }}</span></div>
                          <div class="kv"><span class="k">Clasificación</span><span class="v">{{ a.clasificacion || '—' }}</span></div>
                          <div class="kv"><span class="k">Solicita</span><span class="v">{{ a.solicita || '—' }}</span></div>
                          <div class="kv"><span class="k">Sector</span><span class="v">{{ a.sector || '—' }}</span></div>
                          <div class="kv"><span class="k">Solic.</span><span class="v">{{ a.solic }}</span></div>
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
              <tr><td colspan="9" style="text-align:center; padding:24px; color:var(--gray-500)">{{ loading() ? 'Cargando…' : 'Sin resultados' }}</td></tr>
            }
          </tbody>
        </table>
        <app-paginator
          [total]="total()" [page]="page()" [pageSize]="pageSize()"
          (pageChange)="onPage($event)" (pageSizeChange)="onPageSize($event)" />
      </div></div>
    }

    @if (modal()) {
      <div class="modal-backdrop" (click)="cerrarModal()">
        <div class="big-modal" (click)="$event.stopPropagation()">
          <div class="modal-header" [class.aprob]="modal() === 'aprobar'">
            <div class="modal-title">{{ modal() === 'aprobar' ? 'Aprobar Agrupación' : 'Editar Agrupación Pendiente' }}</div>
            <button class="modal-close" (click)="cerrarModal()">×</button>
          </div>
          <div class="modal-body">
            @if (modal() === 'aprobar') {
              <div class="hint-aprob">
                Para aprobar, todos los campos marcados con <strong>*</strong> deben estar completos.
                Al aprobar, la agrupación pasa a la pestaña <strong>Todas</strong> y se elimina de Pendientes.
              </div>
            }

            <h4 class="sec-h">Datos de la Agrupación</h4>
            <div class="grid">
              <div class="fg"><label>Nombre {{ req() }}</label><input [(ngModel)]="form.nombre" name="nombre"></div>
              <div class="fg"><label>Sigla</label><input [(ngModel)]="form.sigla" name="sigla"></div>
              <div class="fg"><label>Cod. Agrupación {{ req() }}</label><input [(ngModel)]="form.codAgrup" name="codAgrup"></div>
              <div class="fg"><label>Cod. Depto. {{ req() }}</label><input [(ngModel)]="form.codDepto" name="codDepto"></div>
              <div class="fg">
                <label>Tipo {{ req() }}</label>
                <select [(ngModel)]="form.tipo" name="tipo">
                  <option value="">—</option>
                  <option value="DEPARTAMENTAL">DEPARTAMENTAL</option>
                  <option value="NACIONAL">NACIONAL</option>
                </select>
              </div>
              <div class="fg"><label>Solic. {{ req() }}</label><input type="number" [(ngModel)]="form.solic" name="solic"></div>
              <div class="fg">
                <label>Departamento {{ req() }}</label>
                <select [(ngModel)]="form.depto" name="depto">
                  <option value="">—</option>
                  @for (d of deptos; track d) { <option [ngValue]="d">{{ d }}</option> }
                </select>
              </div>
              <div class="fg"><label>Clasificación {{ req() }}</label><input [(ngModel)]="form.clasificacion" name="clasificacion"></div>
              <div class="fg"><label>Solicita {{ req() }}</label><input [(ngModel)]="form.solicita" name="solicita"></div>
              <div class="fg"><label>Sector {{ req() }}</label><input [(ngModel)]="form.sector" name="sector"></div>
              <div class="fg"><label>Fecha Solicitud {{ req() }}</label><input type="date" [(ngModel)]="form.fechaSolicitud" name="fechaSolicitud"></div>
              <div class="fg"><label>Cod. Ant.</label><input [(ngModel)]="form.codAnt" name="codAnt"></div>
              <div class="fg"><label>Sublema Renunciado</label><input [(ngModel)]="form.sublemaRenunciado" name="sublemaRenunciado"></div>
              <div class="fg"><label>Nombre Ant.</label><input [(ngModel)]="form.nombreAnt" name="nombreAnt"></div>
            </div>

            <h4 class="sec-h">Domicilio y Contacto</h4>
            <div class="grid">
              <div class="fg full"><label>Domicilio Legal {{ req() }}</label><input [(ngModel)]="form.domicilioLegal" name="domicilioLegal"></div>
              <div class="fg"><label>Ciudad {{ req() }}</label><input [(ngModel)]="form.ciudad" name="ciudad"></div>
              <div class="fg"><label>Tel. 1 {{ req() }}</label><input [(ngModel)]="form.tel1" name="tel1"></div>
              <div class="fg"><label>Tel. 2</label><input [(ngModel)]="form.tel2" name="tel2"></div>
              <div class="fg"><label>Fax</label><input [(ngModel)]="form.fax" name="fax"></div>
              <div class="fg"><label>Email {{ req() }}</label><input [(ngModel)]="form.email" name="email"></div>
            </div>

            <h4 class="sec-h">Comisión Electoral</h4>
            <div class="grid">
              <div class="fg"><label>Forma Representación {{ req() }}</label><input [(ngModel)]="form.formaRepresentacion" name="formaRepresentacion"></div>
              <div class="fg"><label>Representante {{ req() }}</label><input [(ngModel)]="form.representante" name="representante"></div>
              <div class="fg"><label>Delegado C.E. {{ req() }}</label><input [(ngModel)]="form.delegadoCE" name="delegadoCE"></div>
              <div class="fg"><label>Forma Actuación {{ req() }}</label><input [(ngModel)]="form.formaActuacion" name="formaActuacion"></div>
              <div class="fg"><label>Fecha Ing. Comis. {{ req() }}</label><input type="date" [(ngModel)]="form.fechaIngComis" name="fechaIngComis"></div>
              <div class="fg"><label>Fecha Rec. Agrup. {{ req() }}</label><input type="date" [(ngModel)]="form.fechaRecAgrup" name="fechaRecAgrup"></div>
              <div class="fg"><label>Fecha Entr. C.E. {{ req() }}</label><input type="date" [(ngModel)]="form.fechaEntrCE" name="fechaEntrCE"></div>
              <div class="fg"><label>Fecha Circ. C.E. {{ req() }}</label><input type="date" [(ngModel)]="form.fechaCircCE" name="fechaCircCE"></div>
            </div>

            <h4 class="sec-h">Sublemas</h4>
            <div class="grid">
              <div class="fg"><label>Sublema 1 {{ req() }}</label><input [(ngModel)]="form.sublema1" name="sublema1"></div>
              <div class="fg"><label>Sublema 2</label><input [(ngModel)]="form.sublema2" name="sublema2"></div>
              <div class="fg"><label>Sublema 3</label><input [(ngModel)]="form.sublema3" name="sublema3"></div>
              <div class="fg"><label>Sublema 4</label><input [(ngModel)]="form.sublema4" name="sublema4"></div>
              <div class="fg"><label>Sublema 5</label><input [(ngModel)]="form.sublema5" name="sublema5"></div>
            </div>

            <h4 class="sec-h">Observaciones</h4>
            <div class="grid">
              <div class="fg full"><label>Antecedentes {{ req() }}</label><textarea rows="2" [(ngModel)]="form.antecedentes" name="antecedentes"></textarea></div>
              <div class="fg full"><label>Resolución de la Comisión {{ req() }}</label><textarea rows="2" [(ngModel)]="form.resolucionComision" name="resolucionComision"></textarea></div>
              <div class="fg"><label>Observaciones {{ req() }}</label><input [(ngModel)]="form.observaciones" name="observaciones"></div>
              <div class="fg"><label>Obs. C.E.</label><input [(ngModel)]="form.obsCE" name="obsCE"></div>
              <div class="fg full"><label>Nota</label><input [(ngModel)]="form.nota" name="nota"></div>
            </div>

            @if (faltantes().length > 0) {
              <div class="prom-err">
                <strong>Faltan campos obligatorios:</strong>
                <ul>@for (f of faltantes(); track f) { <li>{{ f }}</li> }</ul>
              </div>
            }
            @if (modalError()) { <div class="prom-err">{{ modalError() }}</div> }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
            @if (modal() === 'aprobar') {
              <button class="btn btn-success" (click)="confirmar()" [disabled]="busy() || faltantes().length > 0">
                {{ busy() ? 'Aprobando…' : 'Aprobar' }}
              </button>
            } @else {
              <button class="btn btn-primary" (click)="confirmar()" [disabled]="busy()">
                {{ busy() ? 'Guardando…' : 'Guardar cambios' }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    th.sortable { cursor:pointer; user-select:none; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .caret { color:#888; font-weight:bold; }
    .detalle-wrap { padding:18px 22px; border-top:1px solid #d6dde6; display:flex; flex-direction:column; gap:16px; }
    .seccion { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:14px 18px; }
    .seccion-title { font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #eef1f5; }
    .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 24px; }
    @media (max-width: 900px) { .grid { grid-template-columns:repeat(2, 1fr); } }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv.full { grid-column:1 / -1; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }

    .modal-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.55);
      display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;
    }
    .big-modal {
      background:#fff; border-radius:10px; width:min(960px, 100%);
      height:min(780px, 92vh); display:flex; flex-direction:column;
      box-shadow:0 20px 50px rgba(0,0,0,.3); overflow:hidden;
    }
    .modal-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 20px; background:#1e3a8a; color:#fff;
    }
    .modal-header.aprob { background:#1f6f3b; }
    .modal-title { font-size:16px; font-weight:600; }
    .modal-close { background:transparent; border:none; color:#fff; font-size:24px; cursor:pointer; }
    .modal-body { padding:18px 22px; overflow-y:auto; flex:1; }
    .modal-footer {
      padding:12px 20px; border-top:1px solid #eef1f5; background:#fafbfd;
      display:flex; gap:10px; justify-content:flex-end;
    }
    .hint-aprob {
      background:#e6f4ea; border:1px solid #b6e0c2; border-radius:6px;
      padding:10px 12px; font-size:13px; color:#1f6f3b; margin-bottom:14px;
    }
    .sec-h {
      margin:16px 0 8px 0; font-size:13px; font-weight:600; color:#4a5568;
      text-transform:uppercase; letter-spacing:.5px;
      padding-bottom:4px; border-bottom:1px solid #eef1f5;
    }
    .sec-h:first-of-type { margin-top:0; }
    .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 16px; }
    @media (max-width: 900px) { .grid { grid-template-columns:repeat(2, 1fr); } }
    .fg { display:flex; flex-direction:column; gap:4px; }
    .fg.full { grid-column:1 / -1; }
    .fg label { font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:.4px; }
    .fg input, .fg select, .fg textarea {
      padding:8px 10px; font-size:13px; font-family:inherit;
      border:1px solid #cfd6e0; border-radius:5px; outline:none;
    }
    .fg input:focus, .fg select:focus, .fg textarea:focus { border-color:#1e3a8a; box-shadow:0 0 0 3px rgba(30,58,138,.12); }
    .fg textarea { resize:vertical; }
    .prom-err {
      margin-top:12px; padding:8px 12px; background:#fdecea; color:#a8261b;
      border-radius:5px; font-size:13px;
    }
    .prom-err ul { margin:6px 0 0 0; padding-left:20px; }
    .btn:disabled, .btn[disabled] { opacity:.5; cursor:not-allowed; pointer-events:none; }
  `]
})
export class AgrupacionesPendientesComponent {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/agrupaciones-pendientes`;

  items = signal<AgrupacionPendiente[]>([]);
  loading = signal(true);
  expandido = signal<number | null>(null);

  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');

  modal = signal<'editar' | 'aprobar' | null>(null);
  editandoId = signal<number | null>(null);
  busy = signal(false);
  modalError = signal<string>('');
  form: any = {};
  deptos = DEPARTAMENTOS;

  // Filtros de la grilla (feature 030). Lista canónica + 'Nacional' (Depto 'X'/'NACIONAL').
  fId = signal(''); fCod = signal(''); fNombre = signal(''); fDepto = signal('');
  readonly deptosFiltro = [...DEPTOS_CANONICOS, 'Nacional'];
  private filter$ = new Subject<void>();
  onFilter() { this.filter$.next(); }
  hayFiltros = computed(() => !!(this.fId() || this.fCod() || this.fNombre() || this.fDepto()));
  // El aviso de "cargando"/"vacío" reemplaza la tabla entera: con filtros activos (o tras la
  // primera carga) se mantiene la tabla para no perder la fila de filtros (feature 030).
  cargado = signal(false);

  req(): string { return this.modal() === 'aprobar' ? '*' : ''; }

  constructor() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => { this.page.set(1); this.cargar(); });
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    const q: GridQuery = {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(),
      filters: { id: this.fId(), cod: this.fCod(), nombre: this.fNombre(), depto: this.fDepto() },
    };
    this.http.get<PagedResult<AgrupacionPendiente>>(this.base, { params: buildPagedParams(q) }).subscribe({
      next: (r) => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); this.cargado.set(true); },
      error: () => { this.items.set([]); this.loading.set(false); this.cargado.set(true); }
    });
  }

  onPage(p: number) { this.page.set(p); this.cargar(); }
  onPageSize(size: number) { this.pageSize.set(size); this.page.set(1); this.cargar(); }
  sortBy(field: string) {
    toggleSort(this.sort, this.order, field);
    this.page.set(1);
    this.cargar();
  }
  arrow(field: string) { return sortArrow(this.sort(), this.order(), field); }

  toggle(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  imprimir(a: AgrupacionPendiente) {
    imprimirAgrupacion({
      agrupacionId: a.id, periodoId: a.id, periodo: 'Pendiente',
      pendiente: true,
      nombre: a.nombre, codAgrup: a.codAgrup, codDepto: a.codDepto,
      tipo: a.tipo, depto: a.depto, solic: a.solic,
      clasificacion: a.clasificacion, solicita: a.solicita, sector: a.sector,
      fechaSolicitud: a.fechaSolicitud, codAnt: a.codAnt, nombreAnt: a.nombreAnt,
      domicilioLegal: a.domicilioLegal, ciudad: a.ciudad,
      tel1: a.tel1, tel2: a.tel2, fax: a.fax, email: a.email,
      formaRepresentacion: a.formaRepresentacion, representante: a.representante,
      delegadoCE: a.delegadoCE, formaActuacion: a.formaActuacion,
      fechaIngComis: a.fechaIngComis, fechaRecAgrup: a.fechaRecAgrup,
      fechaEntrCE: a.fechaEntrCE, fechaCircCE: a.fechaCircCE,
      observaciones: a.observaciones, obsCE: a.obsCE, nota: a.nota,
      antecedentes: a.antecedentes, resolucionComision: a.resolucionComision,
      sublema1: a.sublema1, sublema2: a.sublema2, sublema3: a.sublema3,
      sublema4: a.sublema4, sublema5: a.sublema5,
      sublemaRenunciado: a.sublemaRenunciado
    }, { firmas: true, titulo: 'Agrupación Pendiente' });
  }

  eliminar(id: number) {
    if (!confirm('Eliminar esta agrupación pendiente?')) return;
    this.http.delete(`${this.base}/${id}`).subscribe(() => {
      if (this.expandido() === id) this.expandido.set(null);
      this.cargar();
    });
  }

  abrirModal(a: AgrupacionPendiente, modo: 'editar' | 'aprobar') {
    this.editandoId.set(a.id);
    this.form = {
      id: a.id,
      fichaAgrupacionOrigenId: a.fichaAgrupacionOrigenId ?? null,
      nombre: a.nombre || '',
      sigla: '', descripcion: '',
      pendiente: true,
      codAgrup: a.codAgrup || '', codDepto: a.codDepto || '',
      tipo: a.tipo || '', solic: a.solic ?? 0, depto: a.depto || '',
      clasificacion: a.clasificacion || '', solicita: a.solicita || '', sector: a.sector || '',
      fechaSolicitud: this.toInputDate(a.fechaSolicitud),
      codAnt: a.codAnt || '', sublemaRenunciado: a.sublemaRenunciado || '', nombreAnt: a.nombreAnt || '',
      domicilioLegal: a.domicilioLegal || '', ciudad: a.ciudad || '',
      tel1: a.tel1 || '', tel2: a.tel2 || '', fax: a.fax || '', email: a.email || '',
      formaRepresentacion: a.formaRepresentacion || '', representante: a.representante || '',
      delegadoCE: a.delegadoCE || '', formaActuacion: a.formaActuacion || '',
      fechaIngComis: this.toInputDate(a.fechaIngComis),
      fechaRecAgrup: this.toInputDate(a.fechaRecAgrup),
      fechaEntrCE:   this.toInputDate(a.fechaEntrCE),
      fechaCircCE:   this.toInputDate(a.fechaCircCE),
      observaciones: a.observaciones || '', obsCE: a.obsCE || '', nota: a.nota || '',
      antecedentes: a.antecedentes || '', resolucionComision: a.resolucionComision || '',
      sublema1: a.sublema1 || '', sublema2: a.sublema2 || '',
      sublema3: a.sublema3 || '', sublema4: a.sublema4 || '', sublema5: a.sublema5 || ''
    };
    this.modalError.set('');
    this.modal.set(modo);
  }

  cerrarModal() {
    this.modal.set(null);
    this.editandoId.set(null);
    this.modalError.set('');
  }

  /** convierte "dd/MM/yyyy" o ISO a yyyy-MM-dd para el input type=date */
  private toInputDate(v?: string): string {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
  }

  faltantes(): string[] {
    if (this.modal() !== 'aprobar') return [];
    const f: string[] = [];
    const req = (label: string, v: any) => { if (!v || (typeof v === 'string' && !v.trim())) f.push(label); };
    req('Nombre', this.form.nombre);
    req('Cod. Agrupación', this.form.codAgrup);
    req('Cod. Depto.', this.form.codDepto);
    req('Tipo', this.form.tipo);
    if (!this.form.solic || +this.form.solic <= 0) f.push('Solic.');
    req('Departamento', this.form.depto);
    req('Clasificación', this.form.clasificacion);
    req('Solicita', this.form.solicita);
    req('Sector', this.form.sector);
    req('Fecha Solicitud', this.form.fechaSolicitud);
    req('Domicilio Legal', this.form.domicilioLegal);
    req('Ciudad', this.form.ciudad);
    req('Tel. 1', this.form.tel1);
    req('Email', this.form.email);
    req('Forma Representación', this.form.formaRepresentacion);
    req('Representante', this.form.representante);
    req('Delegado C.E.', this.form.delegadoCE);
    req('Forma Actuación', this.form.formaActuacion);
    req('Fecha Ing. Comis.', this.form.fechaIngComis);
    req('Fecha Rec. Agrup.', this.form.fechaRecAgrup);
    req('Fecha Entr. C.E.', this.form.fechaEntrCE);
    req('Fecha Circ. C.E.', this.form.fechaCircCE);
    req('Antecedentes', this.form.antecedentes);
    req('Resolución de la Comisión', this.form.resolucionComision);
    req('Observaciones', this.form.observaciones);
    req('Sublema 1', this.form.sublema1);
    return f;
  }

  confirmar() {
    const id = this.editandoId();
    if (!id) return;
    if (this.modal() === 'aprobar' && this.faltantes().length > 0) return;

    this.busy.set(true);
    this.modalError.set('');
    const body: any = {
      ...this.form,
      id,
      solic: this.form.solic == null || this.form.solic === '' ? 0 : Number(this.form.solic),
      fechaSolicitud: this.form.fechaSolicitud || null,
      fechaIngComis: this.form.fechaIngComis || null,
      fechaRecAgrup: this.form.fechaRecAgrup || null,
      fechaEntrCE: this.form.fechaEntrCE || null,
      fechaCircCE: this.form.fechaCircCE || null
    };

    const url = this.modal() === 'aprobar' ? `${this.base}/${id}/aprobar` : `${this.base}/${id}`;
    const req$ = this.modal() === 'aprobar'
      ? this.http.post(url, body)
      : this.http.put(url, body);

    req$.subscribe({
      next: () => {
        this.busy.set(false);
        this.cerrarModal();
        this.cargar();
      },
      error: (err) => {
        this.busy.set(false);
        const msg = err?.error?.message || err?.message || 'Operación fallida.';
        this.modalError.set(msg);
      }
    });
  }
}
