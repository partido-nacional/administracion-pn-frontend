import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { FichasAgrupacionComponent } from './fichas-agrupacion.component';
import { AgrupacionesPendientesComponent } from './agrupaciones-pendientes.component';
import { AgrupacionesPorPeriodoComponent } from './agrupaciones-por-periodo.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ModalFormComponent } from '../../shared/components/modal-form/modal-form.component';
import { GridQuery, PagedResult, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { buildPagedParams } from '../../core/services/paged';

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
  imports: [CommonModule, FormsModule, FichasAgrupacionComponent, AgrupacionesPendientesComponent, AgrupacionesPorPeriodoComponent, PaginatorComponent, ModalFormComponent],
  template: `
    <div class="topbar-inline">
      <button class="btn btn-primary" (click)="abrirNueva()">+ Nueva Agrupación</button>
    </div>

    @if (modoModal()) {
      <app-modal-form
        [wide]="true"
        [title]="modoModal() === 'editar' ? 'Editar Agrupación' : 'Nueva Agrupación (entrará como pendiente)'"
        [busy]="nuevoBusy()"
        [error]="nuevoError()"
        [saveLabel]="modoModal() === 'editar' ? 'Guardar cambios' : 'Crear pendiente'"
        (save)="guardarNueva()" (cancel)="cerrarNueva()">
            @if (modoModal() === 'nueva') {
              <p class="nv-sub">
                Esta agrupación se creará y quedará en la pestaña <strong>Agrupaciones Pendientes</strong>
                para el período <strong>2025-2030</strong>. Solo <strong>Nombre</strong> es obligatorio;
                el resto se puede completar después.
              </p>
            } @else {
              <p class="nv-sub">
                Editás los datos maestros de la agrupación. Los sublemas y el flag AP viven en cada
                <strong>Agrupación por Período</strong> y se editan ahí.
              </p>
            }

            <h4 class="sec-h">Identificación</h4>
            <div class="nv-grid g3">
              <div class="fg full"><label>Nombre *</label><input [(ngModel)]="nuevoForm.nombre" name="n-nombre"></div>
              <div class="fg"><label>Sigla</label><input [(ngModel)]="nuevoForm.sigla" name="n-sigla"></div>
              <div class="fg"><label>Cod. Agrupación</label><input [(ngModel)]="nuevoForm.codAgrup" name="n-codAgrup"></div>
              <div class="fg"><label>Cod. Depto.</label><input [(ngModel)]="nuevoForm.codDepto" name="n-codDepto"></div>
              <div class="fg"><label>Tipo</label>
                <select [(ngModel)]="nuevoForm.tipo" name="n-tipo">
                  <option value="">—</option>
                  <option value="DEPARTAMENTAL">DEPARTAMENTAL</option>
                  <option value="NACIONAL">NACIONAL</option>
                </select>
              </div>
              <div class="fg"><label>Solic.</label><input type="number" [(ngModel)]="nuevoForm.solic" name="n-solic"></div>
              <div class="fg"><label>Departamento</label>
                <select [(ngModel)]="nuevoForm.depto" name="n-depto">
                  <option value="">—</option>
                  @for (d of departamentos; track d) { <option [ngValue]="d">{{ d }}</option> }
                </select>
              </div>
              <div class="fg"><label>Clasificación</label><input [(ngModel)]="nuevoForm.clasificacion" name="n-clasif"></div>
              <div class="fg"><label>Solicita</label><input [(ngModel)]="nuevoForm.solicita" name="n-solicita"></div>
              <div class="fg"><label>Sector</label><input [(ngModel)]="nuevoForm.sector" name="n-sector"></div>
              <div class="fg"><label>Fecha Solicitud</label><input type="date" [(ngModel)]="nuevoForm.fechaSolicitud" name="n-fSol"></div>
              <div class="fg"><label>Cod. Ant.</label><input [(ngModel)]="nuevoForm.codAnt" name="n-codAnt"></div>
              <div class="fg"><label>Nombre Ant.</label><input [(ngModel)]="nuevoForm.nombreAnt" name="n-nomAnt"></div>
            </div>

            <h4 class="sec-h">Domicilio y Contacto</h4>
            <div class="nv-grid g3">
              <div class="fg full"><label>Domicilio Legal</label><input [(ngModel)]="nuevoForm.domicilioLegal" name="n-dom"></div>
              <div class="fg"><label>Ciudad</label><input [(ngModel)]="nuevoForm.ciudad" name="n-ciudad"></div>
              <div class="fg"><label>Tel. 1</label><input [(ngModel)]="nuevoForm.tel1" name="n-tel1"></div>
              <div class="fg"><label>Tel. 2</label><input [(ngModel)]="nuevoForm.tel2" name="n-tel2"></div>
              <div class="fg"><label>Fax</label><input [(ngModel)]="nuevoForm.fax" name="n-fax"></div>
              <div class="fg"><label>Email</label><input [(ngModel)]="nuevoForm.email" name="n-email"></div>
            </div>

            <h4 class="sec-h">Comisión Electoral</h4>
            <div class="nv-grid g3">
              <div class="fg"><label>Forma Representación</label><input [(ngModel)]="nuevoForm.formaRepresentacion" name="n-fr"></div>
              <div class="fg"><label>Representante</label><input [(ngModel)]="nuevoForm.representante" name="n-rep"></div>
              <div class="fg"><label>Delegado C.E.</label><input [(ngModel)]="nuevoForm.delegadoCE" name="n-del"></div>
              <div class="fg"><label>Forma Actuación</label><input [(ngModel)]="nuevoForm.formaActuacion" name="n-fa"></div>
              <div class="fg"><label>Fecha Ing. Comis.</label><input type="date" [(ngModel)]="nuevoForm.fechaIngComis" name="n-fic"></div>
              <div class="fg"><label>Fecha Rec. Agrup.</label><input type="date" [(ngModel)]="nuevoForm.fechaRecAgrup" name="n-fra"></div>
              <div class="fg"><label>Fecha Entr. C.E.</label><input type="date" [(ngModel)]="nuevoForm.fechaEntrCE" name="n-fec"></div>
              <div class="fg"><label>Fecha Circ. C.E.</label><input type="date" [(ngModel)]="nuevoForm.fechaCircCE" name="n-fcc"></div>
            </div>

            @if (modoModal() === 'nueva') {
              <h4 class="sec-h">Sublemas (período 2025-2030)</h4>
              <div class="nv-grid g3">
                <div class="fg"><label>Sublema 1</label><input [(ngModel)]="nuevoForm.sublema1" name="n-s1"></div>
                <div class="fg"><label>Sublema 2</label><input [(ngModel)]="nuevoForm.sublema2" name="n-s2"></div>
                <div class="fg"><label>Sublema 3</label><input [(ngModel)]="nuevoForm.sublema3" name="n-s3"></div>
                <div class="fg"><label>Sublema 4</label><input [(ngModel)]="nuevoForm.sublema4" name="n-s4"></div>
                <div class="fg"><label>Sublema 5</label><input [(ngModel)]="nuevoForm.sublema5" name="n-s5"></div>
                <div class="fg full"><label>Sublema Renunciado</label><input [(ngModel)]="nuevoForm.sublemaRenunciado" name="n-sr"></div>
              </div>
            }

            <h4 class="sec-h">Observaciones</h4>
            <div class="nv-grid g3">
              <div class="fg full"><label>Antecedentes</label><textarea rows="2" [(ngModel)]="nuevoForm.antecedentes" name="n-ant"></textarea></div>
              <div class="fg full"><label>Resolución de la Comisión</label><textarea rows="2" [(ngModel)]="nuevoForm.resolucionComision" name="n-res"></textarea></div>
              <div class="fg"><label>Observaciones</label><input [(ngModel)]="nuevoForm.observaciones" name="n-obs"></div>
              <div class="fg"><label>Obs. C.E.</label><input [(ngModel)]="nuevoForm.obsCE" name="n-obsCE"></div>
              <div class="fg full"><label>Nota</label><input [(ngModel)]="nuevoForm.nota" name="n-nota"></div>
            </div>

      </app-modal-form>
    }

    <div class="tabs">
      <a class="tab" [class.active]="tab()==='todas'"       (click)="setTab('todas')">Todas</a>
      <a class="tab" [class.active]="tab()==='pendientes'"  (click)="setTab('pendientes')">Agrupaciones Pendientes</a>
      <a class="tab" [class.active]="tab()==='fichas'"      (click)="setTab('fichas')">Fichas de Agrupación Web</a>
      <a class="tab" [class.active]="tab()==='periodo'"     (click)="setTab('periodo')">Agrupaciones por Período</a>
      <a class="tab" [class.active]="tab()==='padron'"      (click)="setTab('padron')">Padrón Electoral</a>
    </div>

    @if (tab()==='todas') {
      <div class="sort-hint">
        💡 Click en una columna para ordenar (server-side).
      </div>
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th style="width:34px"></th>
              <th class="sortable" (click)="onSort('id')">Id <span class="ind">{{ indicador('id') }}</span></th>
              <th class="sortable" (click)="onSort('codagrup')">Cod. Agrup. <span class="ind">{{ indicador('codagrup') }}</span></th>
              <th class="sortable" (click)="onSort('coddepto')">Cod. Depto. <span class="ind">{{ indicador('coddepto') }}</span></th>
              <th class="sortable" (click)="onSort('pendiente')">Pendiente <span class="ind">{{ indicador('pendiente') }}</span></th>
              <th class="sortable" (click)="onSort('tipo')">Tipo <span class="ind">{{ indicador('tipo') }}</span></th>
              <th class="sortable" (click)="onSort('solic')">Solic. <span class="ind">{{ indicador('solic') }}</span></th>
              <th class="sortable" (click)="onSort('nombre')">Nombre <span class="ind">{{ indicador('nombre') }}</span></th>
              <th class="sortable" (click)="onSort('depto')">Depto. <span class="ind">{{ indicador('depto') }}</span></th>
              <th></th>
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
                <td (click)="$event.stopPropagation()">
                  <button class="btn-pencil" (click)="abrirEditar(a)" title="Editar">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                </td>
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
              <tr><td colspan="10"><div class="empty-state"><div class="empty-state-text">
                {{ loadingTodas() ? 'Cargando…' : 'Sin agrupaciones' }}
              </div></div></td></tr>
            }
          </tbody>
        </table>
        <app-paginator
          [total]="total()" [page]="page()" [pageSize]="pageSize()"
          (pageChange)="onPage($event)" (pageSizeChange)="onPageSize($event)" />
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

  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loadingTodas = signal(false);

  onSort(field: string) {
    if (this.sort() === field) this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    else { this.sort.set(field); this.order.set('asc'); }
    this.page.set(1);
    this.loadTodas();
  }

  indicador(field: string): string {
    return this.sort() !== field ? '' : (this.order() === 'asc' ? '▲' : '▼');
  }

  onPage(p: number) { this.page.set(p); this.loadTodas(); }
  onPageSize(size: number) { this.pageSize.set(size); this.page.set(1); this.loadTodas(); }

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

  modoModal = signal<'nueva' | 'editar' | null>(null);
  editandoId = signal<number | null>(null);
  // alias compat
  mostrarNueva = computed(() => this.modoModal() !== null);
  nuevoBusy = signal(false);
  nuevoError = signal('');
  nuevoForm: any = {};
  departamentos = [
    'Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida',
    'Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha',
    'Salto','San José','Soriano','Tacuarembó','Treinta y Tres','Nacional'
  ];

  private formVacio() {
    return {
      nombre: '', sigla: '', descripcion: '',
      codAgrup: '', codDepto: '', tipo: '', solic: null, depto: '',
      clasificacion: '', solicita: '', sector: '',
      fechaSolicitud: '', codAnt: '', nombreAnt: '',
      domicilioLegal: '', ciudad: '',
      tel1: '', tel2: '', fax: '', email: '',
      formaRepresentacion: '', representante: '', delegadoCE: '', formaActuacion: '',
      fechaIngComis: '', fechaRecAgrup: '', fechaEntrCE: '', fechaCircCE: '',
      observaciones: '', obsCE: '', nota: '',
      antecedentes: '', resolucionComision: '',
      sublema1: '', sublema2: '', sublema3: '', sublema4: '', sublema5: '',
      sublemaRenunciado: ''
    };
  }

  /** Convierte fechas dd/MM/yyyy -> yyyy-MM-dd (para input type=date) */
  private toInputDate(v: any): string {
    if (!v) return '';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
  }

  abrirNueva() {
    this.nuevoForm = this.formVacio();
    this.nuevoError.set('');
    this.editandoId.set(null);
    this.modoModal.set('nueva');
  }

  abrirEditar(a: Agrupacion) {
    this.nuevoForm = {
      ...this.formVacio(),
      nombre: a.nombre || '',
      codAgrup: a.codAgrup || '',
      codDepto: a.codDepto || '',
      tipo: a.tipo || '',
      solic: a.solic ?? null,
      depto: a.depto || '',
      clasificacion: a.clasificacion || '',
      solicita: a.solicita || '',
      sector: a.sector || '',
      fechaSolicitud: this.toInputDate(a.fechaSolicitud),
      codAnt: a.codAnt || '',
      nombreAnt: a.nombreAnt || '',
      domicilioLegal: a.domicilioLegal || '',
      ciudad: a.ciudad || '',
      tel1: a.tel1 || '', tel2: a.tel2 || '', fax: a.fax || '', email: a.email || '',
      formaRepresentacion: a.formaRepresentacion || '',
      representante: a.representante || '',
      delegadoCE: a.delegadoCE || '',
      formaActuacion: a.formaActuacion || '',
      fechaIngComis: this.toInputDate(a.fechaIngComis),
      fechaRecAgrup: this.toInputDate(a.fechaRecAgrup),
      fechaEntrCE: this.toInputDate(a.fechaEntrCE),
      fechaCircCE: this.toInputDate(a.fechaCircCE),
      observaciones: a.observaciones || '', obsCE: a.obsCE || '', nota: a.nota || '',
      antecedentes: a.antecedentes || '', resolucionComision: a.resolucionComision || ''
    };
    this.nuevoError.set('');
    this.editandoId.set(a.id);
    this.modoModal.set('editar');
  }

  cerrarNueva() {
    this.modoModal.set(null);
    this.editandoId.set(null);
    this.nuevoError.set('');
  }

  guardarNueva() {
    if (!this.nuevoForm.nombre?.trim()) {
      this.nuevoError.set('El nombre es obligatorio.');
      return;
    }
    this.nuevoBusy.set(true);
    this.nuevoError.set('');
    const body: any = {
      ...this.nuevoForm,
      nombre: this.nuevoForm.nombre.trim(),
      solic: this.nuevoForm.solic == null || this.nuevoForm.solic === '' ? 0 : Number(this.nuevoForm.solic),
      fechaSolicitud: this.nuevoForm.fechaSolicitud || null,
      fechaIngComis: this.nuevoForm.fechaIngComis || null,
      fechaRecAgrup: this.nuevoForm.fechaRecAgrup || null,
      fechaEntrCE: this.nuevoForm.fechaEntrCE || null,
      fechaCircCE: this.nuevoForm.fechaCircCE || null
    };

    const editId = this.editandoId();
    if (this.modoModal() === 'editar' && editId != null) {
      body.id = editId;
      this.http.put(`${environment.apiUrl}/agrupaciones/${editId}`, body).subscribe({
        next: () => {
          this.nuevoBusy.set(false);
          this.cerrarNueva();
          this.loadTodas();
        },
        error: (err) => {
          this.nuevoBusy.set(false);
          this.nuevoError.set(err?.error?.message || err?.message || 'No se pudo guardar.');
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/agrupaciones-pendientes/nueva`, body).subscribe({
        next: () => {
          this.nuevoBusy.set(false);
          this.cerrarNueva();
          this.setTab('pendientes');
        },
        error: (err) => {
          this.nuevoBusy.set(false);
          this.nuevoError.set(err?.error?.message || err?.message || 'No se pudo crear la agrupación.');
        }
      });
    }
  }

  loadTodas() {
    this.loadingTodas.set(true);
    const q: GridQuery = { page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order() };
    this.http.get<PagedResult<Agrupacion>>(`${environment.apiUrl}/agrupaciones`, { params: buildPagedParams(q) })
      .subscribe({
        next: r => { this.agrupaciones.set(r.items); this.total.set(r.total); this.loadingTodas.set(false); },
        error: () => this.loadingTodas.set(false),
      });
  }
  loadPadron() { this.http.get<PadronItem[]>(`${environment.apiUrl}/agrupaciones/padron`).subscribe(x => this.padron.set(x)); }
}
