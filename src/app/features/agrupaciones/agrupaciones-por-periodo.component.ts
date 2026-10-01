import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime } from 'rxjs';
import { environment } from '../../../environments/environment';
import { imprimirAgrupacion } from './imprimir-agrupacion';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { GridQuery, PagedResult, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { buildPagedParams } from '../../core/services/paged';
import { toggleSort, sortArrow } from '../../shared/grid/grid-sort';
import { ContactosService, ContactoListado } from '../agenda/contactos.service';
import { ToastService } from '../../core/services/toast.service';

interface IntegranteRow {
  id: number;
  contactoId: number;
  nombre: string;
  apellido: string;
  cedula?: string;
  credencial?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  cargo?: string;
  fechaIngreso?: string;
}

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
  asuntosPoliticos: boolean;
  integrantes: IntegranteRow[];
}

import { DEPARTAMENTOS } from '../../core/departamentos';

@Component({
  selector: 'app-agrupaciones-por-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="sort-hint">
      💡 Click en una columna para ordenar (server-side).
    </div>
    <div class="card"><div class="card-body" style="padding:0; overflow-x:auto">
      <table class="table">
        <thead>
          <tr class="filter-row">
            <th></th>
            <th><input class="column-filter" [ngModel]="fId()" (ngModelChange)="fId.set($event); onFilter()" placeholder="Id"></th>
            <th>
              <select class="column-filter" [ngModel]="fPeriodo()" (ngModelChange)="fPeriodo.set($event); onFilter()">
                <option value="">Todos</option>
                @for (p of periodos(); track p) { <option [ngValue]="p">{{ p }}</option> }
              </select>
            </th>
            <th>
              <select class="column-filter" [ngModel]="fPend()" (ngModelChange)="fPend.set($event); onFilter()">
                <option value="">Todos</option>
                <option value="si">Pendiente</option>
                <option value="no">Aprobada</option>
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fAgrId()" (ngModelChange)="fAgrId.set($event); onFilter()" placeholder="Id"></th>
            <th><input class="column-filter" [ngModel]="fCod()"    (ngModelChange)="fCod.set($event); onFilter()"    placeholder="Filtrar..."></th>
            <th></th>
            <th>
              <select class="column-filter" [ngModel]="fTipo()" (ngModelChange)="fTipo.set($event); onFilter()">
                <option value="">Todos</option>
                <option value="D">D</option>
                <option value="N">N</option>
                <option value="DEPARTAMENTAL">DEPARTAMENTAL</option>
                <option value="NACIONAL">NACIONAL</option>
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event); onFilter()" placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event); onFilter()">
                <option value="">Todos</option>
                @for (d of deptos; track d) { <option [ngValue]="d">{{ d }}</option> }
              </select>
            </th>
            <th></th>
            <th><input class="column-filter" [ngModel]="fSublema()" (ngModelChange)="fSublema.set($event); onFilter()" placeholder="Filtrar..."></th>
            <th></th>
            <th></th>
          </tr>
          <tr>
            <th style="width:34px"></th>
            <th class="sortable" (click)="onSort('id')">Id <span class="ind">{{ indicador('id') }}</span></th>
            <th class="sortable" (click)="onSort('periodo')">Período <span class="ind">{{ indicador('periodo') }}</span></th>
            <th class="sortable" (click)="onSort('pendiente')">Estado <span class="ind">{{ indicador('pendiente') }}</span></th>
            <th class="sortable" (click)="onSort('agrid')">Id Agr. <span class="ind">{{ indicador('agrid') }}</span></th>
            <th class="sortable" (click)="onSort('codagrup')">Cod. Agrup. <span class="ind">{{ indicador('codagrup') }}</span></th>
            <th class="sortable" (click)="onSort('coddepto')">Cod. Depto. <span class="ind">{{ indicador('coddepto') }}</span></th>
            <th class="sortable" (click)="onSort('tipo')">Tipo <span class="ind">{{ indicador('tipo') }}</span></th>
            <th class="sortable" (click)="onSort('nombre')">Nombre <span class="ind">{{ indicador('nombre') }}</span></th>
            <th class="sortable" (click)="onSort('depto')">Depto. <span class="ind">{{ indicador('depto') }}</span></th>
            <th class="sortable" (click)="onSort('sector')">Sector <span class="ind">{{ indicador('sector') }}</span></th>
            <th>Sublemas</th>
            <th class="sortable" (click)="onSort('ap')" title="Asuntos Políticos">AP <span class="ind">{{ indicador('ap') }}</span></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (r of items(); track r.periodoId) {
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
              <td (click)="$event.stopPropagation()" style="text-align:center">
                <input type="checkbox" [checked]="r.asuntosPoliticos"
                       (change)="toggleAP(r, $event)" title="Asuntos Políticos">
              </td>
              <td (click)="$event.stopPropagation()" style="white-space:nowrap">
                <button class="btn-pencil" (click)="abrirEditar(r)" title="Editar período" style="margin-right:6px">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                  </svg>
                </button>
                <button class="btn btn-sm btn-secondary" (click)="imprimir(r)" title="Imprimir / PDF">
                  🖨 Imprimir
                </button>
              </td>
            </tr>
            @if (expandido() === r.periodoId) {
              <tr class="detalle-row">
                <td colspan="14">
                  <div class="detalle-wrap">
                    <div class="seccion">
                      <div class="seccion-title">Período</div>
                      <div class="grid">
                        <div class="kv"><span class="k">Id</span><span class="v">{{ r.periodoId }}</span></div>
                        <div class="kv"><span class="k">Período</span><span class="v">{{ r.periodo }}</span></div>
                        <div class="kv"><span class="k">Estado</span><span class="v">{{ r.pendiente ? 'Pendiente' : 'Aprobada' }}</span></div>
                        <div class="kv"><span class="k">Ficha origen</span><span class="v">{{ r.fichaAgrupacionOrigenId ? '#' + r.fichaAgrupacionOrigenId : '—' }}</span></div>
                        <div class="kv"><span class="k">Asuntos Políticos</span><span class="v">{{ r.asuntosPoliticos ? 'Sí' : 'No' }}</span></div>
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
                        <div class="kv"><span class="k">Solic.</span><span class="v">{{ r.solic }}</span></div>
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

                    <div class="seccion">
                      <div class="seccion-title" style="display:flex; align-items:center; justify-content:space-between">
                        <span>Integrantes ({{ r.integrantes.length }})</span>
                        @if (!agregando()) {
                          <button class="btn btn-sm btn-primary" (click)="abrirAgregar(r.periodoId)">+ Agregar integrante</button>
                        }
                      </div>

                      @if (agregando() && agregandoPeriodo() === r.periodoId) {
                        <div class="add-int">
                          <div class="add-combo">
                            <label>Contacto *</label>
                            <div class="combo">
                              <input class="combo-input"
                                     [placeholder]="contactoSel() ? '' : 'Buscar por nombre o cédula…'"
                                     [value]="contactoSel() ? labelContacto(contactoSel()!) : qContacto()"
                                     (input)="onBuscarContacto($event)"
                                     (focus)="contactoSel.set(null)">
                              @if (contactoSel()) {
                                <button type="button" class="combo-clear" (click)="contactoSel.set(null); qContacto.set('')">×</button>
                              }
                              @if (!contactoSel() && resultados().length > 0) {
                                <div class="combo-list">
                                  @for (c of resultados(); track c.id) {
                                    <div class="combo-opt" (click)="seleccionarContacto(c)">{{ labelContacto(c) }}</div>
                                  }
                                </div>
                              }
                            </div>
                          </div>
                          <div class="add-fg"><label>Cargo</label><input [(ngModel)]="cargoNuevo" name="cargoNuevo"></div>
                          <div class="add-fg"><label>Fecha ingreso</label><input type="date" [(ngModel)]="fechaIngresoNuevo" name="fiNuevo"></div>
                          <div class="add-actions">
                            <button class="btn btn-sm btn-secondary" (click)="cerrarAgregar()">Cancelar</button>
                            <button class="btn btn-sm btn-primary" (click)="guardarIntegrante(r.periodoId)" [disabled]="!contactoSel() || guardando()">
                              {{ guardando() ? 'Guardando…' : 'Guardar' }}
                            </button>
                          </div>
                        </div>
                      }

                      @if (r.integrantes.length === 0) {
                        <div style="font-size:13px; color:#888">Sin integrantes registrados en este período.</div>
                      } @else {
                        <table class="int-table">
                          <thead>
                            <tr>
                              <th>Id C.</th>
                              <th>Nombre</th>
                              <th>Cédula</th>
                              <th>Credencial</th>
                              <th>Teléfono</th>
                              <th>Celular</th>
                              <th>Email</th>
                              <th>Cargo</th>
                              <th>Fecha Ingreso</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (i of r.integrantes; track i.id) {
                              <tr>
                                <td>{{ i.contactoId }}</td>
                                <td><strong>{{ i.apellido }}, {{ i.nombre }}</strong></td>
                                <td>{{ i.cedula || '—' }}</td>
                                <td>{{ i.credencial || '—' }}</td>
                                <td>{{ i.telefono || '—' }}</td>
                                <td>{{ i.celular || '—' }}</td>
                                <td>{{ i.email || '—' }}</td>
                                <td>{{ i.cargo || '—' }}</td>
                                <td>{{ i.fechaIngreso || '—' }}</td>
                                <td><button class="btn btn-sm btn-danger" (click)="quitarIntegrante(i)">Quitar</button></td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      }
                    </div>
                  </div>
                </td>
              </tr>
            }
          } @empty {
            <tr><td colspan="14"><div class="empty-state"><div class="empty-state-text">No hay agrupaciones por período que coincidan con el filtro.</div></div></td></tr>
          }
        </tbody>
      </table>
      <app-paginator
        [total]="total()" [page]="page()" [pageSize]="pageSize()"
        (pageChange)="onPage($event)" (pageSizeChange)="onPageSize($event)" />
    </div></div>

    @if (modalEditar()) {
      <div class="ed-backdrop" (click)="cerrarEditar()">
        <div class="ed-modal" (click)="$event.stopPropagation()">
          <div class="ed-header">
            <div class="ed-title">Editar período — {{ modalEditar()!.nombre }}</div>
            <button class="ed-close" (click)="cerrarEditar()">×</button>
          </div>
          <div class="ed-body">
            <p class="ed-sub">
              Estos campos son <strong>específicos del período</strong>. Para editar
              datos maestros (códigos, contacto, fechas C.E., etc.) abrí la agrupación
              desde la tab <strong>Todas</strong>.
            </p>

            <div class="ed-fg"><label>Período *</label><input [(ngModel)]="ed.periodo" name="ed-per"></div>

            <h4 class="sec-h">Sublemas</h4>
            <div class="ed-grid">
              <div class="ed-fg"><label>Sublema 1</label><input [(ngModel)]="ed.sublema1" name="ed-s1"></div>
              <div class="ed-fg"><label>Sublema 2</label><input [(ngModel)]="ed.sublema2" name="ed-s2"></div>
              <div class="ed-fg"><label>Sublema 3</label><input [(ngModel)]="ed.sublema3" name="ed-s3"></div>
              <div class="ed-fg"><label>Sublema 4</label><input [(ngModel)]="ed.sublema4" name="ed-s4"></div>
              <div class="ed-fg"><label>Sublema 5</label><input [(ngModel)]="ed.sublema5" name="ed-s5"></div>
              <div class="ed-fg full"><label>Sublema Renunciado</label><input [(ngModel)]="ed.sublemaRenunciado" name="ed-sr"></div>
            </div>
            @if (edError()) { <div class="ed-err">{{ edError() }}</div> }
          </div>
          <div class="ed-footer">
            <button class="btn btn-secondary" (click)="cerrarEditar()">Cancelar</button>
            <button class="btn btn-primary" (click)="guardarEditar()" [disabled]="edBusy()">
              {{ edBusy() ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </div>
      </div>
    }
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
    .int-table { width:100%; border-collapse:collapse; font-size:13px; }
    .int-table th, .int-table td { border-bottom:1px solid #eef1f5; padding:8px 10px; text-align:left; }
    .int-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }

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

    .ed-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.55);
      display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;
    }
    .ed-modal {
      background:#fff; border-radius:10px; width:min(640px, 100%);
      max-height:90vh; display:flex; flex-direction:column;
      box-shadow:0 20px 50px rgba(0,0,0,.3); overflow:hidden;
    }
    .ed-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 18px; background:#1e3a8a; color:#fff;
    }
    .ed-title { font-size:16px; font-weight:600; }
    .ed-close { background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; }
    .ed-body { padding:18px 20px; overflow-y:auto; flex:1; }
    .ed-sub {
      background:#f0f6ff; border:1px solid #d6e4f5; border-radius:6px;
      padding:10px 12px; font-size:13px; color:#3d4f6b; margin:0 0 14px 0;
    }
    .sec-h {
      margin:14px 0 8px 0; font-size:13px; font-weight:600; color:#4a5568;
      text-transform:uppercase; letter-spacing:.5px;
      padding-bottom:4px; border-bottom:1px solid #eef1f5;
    }
    .ed-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:10px 16px; }
    .ed-fg { display:flex; flex-direction:column; gap:4px; }
    .ed-fg.full { grid-column:1 / -1; }
    .ed-fg label { font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:.4px; }
    .ed-fg input {
      padding:8px 10px; font-size:13px; font-family:inherit;
      border:1px solid #cfd6e0; border-radius:5px; outline:none;
    }
    .ed-fg input:focus { border-color:#1e3a8a; box-shadow:0 0 0 3px rgba(30,58,138,.12); }
    .ed-err {
      margin-top:10px; padding:8px 12px; background:#fdecea; color:#a8261b;
      border-radius:5px; font-size:13px;
    }
    .ed-footer {
      padding:12px 18px; border-top:1px solid #eef1f5; background:#fafbfd;
      display:flex; gap:8px; justify-content:flex-end;
    }
    .add-int {
      display:flex; flex-wrap:wrap; align-items:flex-end; gap:12px;
      background:#f0f6ff; border:1px solid #d6e4f5; border-radius:6px;
      padding:12px 14px; margin:10px 0 14px;
    }
    .add-int label { display:block; font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:.4px; margin-bottom:4px; }
    .add-int input {
      padding:7px 10px; font-size:13px; font-family:inherit;
      border:1px solid #cfd6e0; border-radius:5px; outline:none;
    }
    .add-int input:focus { border-color:#1e3a8a; box-shadow:0 0 0 3px rgba(30,58,138,.12); }
    .add-combo { flex:1 1 260px; min-width:220px; }
    .add-fg { flex:0 0 auto; }
    .add-actions { display:flex; gap:8px; margin-left:auto; }
    .combo { position:relative; }
    .combo-input { width:100%; box-sizing:border-box; padding-right:28px; }
    .combo-clear {
      position:absolute; right:6px; top:50%; transform:translateY(-50%);
      background:transparent; border:none; font-size:16px; cursor:pointer; color:#888;
    }
    .combo-list {
      position:absolute; top:100%; left:0; right:0; z-index:20;
      max-height:200px; overflow-y:auto; background:#fff;
      border:1px solid #cfd6e0; border-radius:5px; margin-top:2px;
      box-shadow:0 6px 16px rgba(0,0,0,.12);
    }
    .combo-opt { padding:8px 12px; cursor:pointer; font-size:13px; border-bottom:1px solid #f0f3f7; }
    .combo-opt:last-child { border-bottom:none; }
    .combo-opt:hover { background:#eef5ff; }
  `]
})
export class AgrupacionesPorPeriodoComponent {
  private http = inject(HttpClient);
  private contactosSvc = inject(ContactosService);
  private toast = inject(ToastService);

  items = signal<AgrupacionPeriodoRow[]>([]);
  expandido = signal<number | null>(null);

  // Alta de integrante (feature 023)
  agregando = signal(false);
  agregandoPeriodo = signal<number | null>(null);
  qContacto = signal('');
  resultados = signal<ContactoListado[]>([]);
  contactoSel = signal<ContactoListado | null>(null);
  cargoNuevo = '';
  fechaIngresoNuevo = new Date().toISOString().slice(0, 10);
  guardando = signal(false);
  private buscarContacto$ = new Subject<string>();

  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  private filter$ = new Subject<void>();

  toggle(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
    this.cerrarAgregar();
  }

  // ── Alta / baja de integrantes (feature 023) ──────────────
  labelContacto(c: ContactoListado): string {
    return `${c.apellido}, ${c.nombre}${c.cedula ? ' (' + c.cedula + ')' : ''}`;
  }

  abrirAgregar(periodoId: number) {
    this.agregandoPeriodo.set(periodoId);
    this.qContacto.set('');
    this.resultados.set([]);
    this.contactoSel.set(null);
    this.cargoNuevo = '';
    this.fechaIngresoNuevo = new Date().toISOString().slice(0, 10);
    this.agregando.set(true);
  }

  cerrarAgregar() {
    this.agregando.set(false);
    this.agregandoPeriodo.set(null);
    this.resultados.set([]);
  }

  onBuscarContacto(ev: Event) {
    const q = (ev.target as HTMLInputElement).value;
    this.qContacto.set(q);
    this.contactoSel.set(null);
    this.buscarContacto$.next(q);
  }

  seleccionarContacto(c: ContactoListado) {
    this.contactoSel.set(c);
    this.resultados.set([]);
  }

  guardarIntegrante(periodoId: number) {
    const c = this.contactoSel();
    if (!c) return;
    this.guardando.set(true);
    this.http.post(`${environment.apiUrl}/agrupacion-integrantes`, {
      contactoId: c.id,
      agrupacionPeriodoId: periodoId,
      cargo: this.cargoNuevo.trim() || null,
      fechaIngreso: this.fechaIngresoNuevo || null,
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarAgregar();
        this.load();
        this.toast.success('Integrante agregado.');
      },
      error: () => this.guardando.set(false),  // el toast global muestra el error
    });
  }

  quitarIntegrante(i: IntegranteRow) {
    if (!confirm(`¿Quitar a ${i.apellido}, ${i.nombre} de esta agrupación?`)) return;
    this.http.delete(`${environment.apiUrl}/agrupacion-integrantes/${i.id}`).subscribe(() => {
      this.load();
      this.toast.success('Integrante quitado.');
    });
  }

  onSort(field: string) {
    toggleSort(this.sort, this.order, field);
    this.page.set(1);
    this.load();
  }

  indicador(field: string): string {
    return sortArrow(this.sort(), this.order(), field);
  }

  onPage(p: number) { this.page.set(p); this.load(); }
  onPageSize(size: number) { this.pageSize.set(size); this.page.set(1); this.load(); }
  onFilter() { this.filter$.next(); }

  fId = signal(''); fAgrId = signal('');
  fPeriodo = signal(''); fPend = signal('');
  fCod = signal('');
  fTipo = signal(''); fNombre = signal(''); fDepto = signal('');
  fSublema = signal('');

  periodos = signal<string[]>([]);
  // Lista canónica (feature 030): antes salía de la base (mayúsculas, duplicados, "Seleccione").
  readonly deptos = DEPARTAMENTOS;

  // ── Editar período (sublemas) ──────────────────────────────
  modalEditar = signal<AgrupacionPeriodoRow | null>(null);
  edBusy = signal(false);
  edError = signal('');
  ed: any = {};

  abrirEditar(r: AgrupacionPeriodoRow) {
    this.ed = {
      periodo: r.periodo,
      sublema1: r.sublema1 || '',
      sublema2: r.sublema2 || '',
      sublema3: r.sublema3 || '',
      sublema4: r.sublema4 || '',
      sublema5: r.sublema5 || '',
      sublemaRenunciado: r.sublemaRenunciado || ''
    };
    this.edError.set('');
    this.modalEditar.set(r);
  }

  cerrarEditar() {
    this.modalEditar.set(null);
    this.edError.set('');
  }

  guardarEditar() {
    const r = this.modalEditar();
    if (!r) return;
    if (!this.ed.periodo?.trim()) { this.edError.set('El período es obligatorio.'); return; }
    this.edBusy.set(true);
    this.edError.set('');
    this.http.put(`${environment.apiUrl}/agrupaciones-periodos/${r.periodoId}`, {
      periodo: this.ed.periodo.trim(),
      sublema1: this.ed.sublema1 || null,
      sublema2: this.ed.sublema2 || null,
      sublema3: this.ed.sublema3 || null,
      sublema4: this.ed.sublema4 || null,
      sublema5: this.ed.sublema5 || null,
      sublemaRenunciado: this.ed.sublemaRenunciado || null
    }).subscribe({
      next: () => {
        this.edBusy.set(false);
        this.cerrarEditar();
        this.load();
      },
      error: (err) => {
        this.edBusy.set(false);
        this.edError.set(err?.error?.message || err?.message || 'No se pudo guardar.');
      }
    });
  }

  toggleAP(r: AgrupacionPeriodoRow, ev: Event) {
    const target = ev.target as HTMLInputElement;
    const value = target.checked;
    // optimistic: aplico al modelo local y reviero si falla
    r.asuntosPoliticos = value;
    this.items.set([...this.items()]);
    this.http.patch(`${environment.apiUrl}/agrupaciones-periodos/${r.periodoId}/asuntos-politicos`, { value })
      .subscribe({
        error: () => {
          r.asuntosPoliticos = !value;
          target.checked = !value;
          this.items.set([...this.items()]);
          alert('No se pudo actualizar Asuntos Políticos.');
        }
      });
  }

  imprimir(r: AgrupacionPeriodoRow) {
    imprimirAgrupacion({
      agrupacionId: r.agrupacionId, periodoId: r.periodoId, periodo: r.periodo,
      pendiente: r.pendiente,
      nombre: r.nombre, codAgrup: r.codAgrup, codDepto: r.codDepto, tipo: r.tipo,
      depto: r.depto, solic: r.solic,
      clasificacion: r.clasificacion, solicita: r.solicita, sector: r.sector,
      fechaSolicitud: r.fechaSolicitud, codAnt: r.codAnt, nombreAnt: r.nombreAnt,
      domicilioLegal: r.domicilioLegal, ciudad: r.ciudad,
      tel1: r.tel1, tel2: r.tel2, fax: r.fax, email: r.email,
      formaRepresentacion: r.formaRepresentacion, representante: r.representante,
      delegadoCE: r.delegadoCE, formaActuacion: r.formaActuacion,
      fechaIngComis: r.fechaIngComis, fechaRecAgrup: r.fechaRecAgrup,
      fechaEntrCE: r.fechaEntrCE, fechaCircCE: r.fechaCircCE,
      observaciones: r.observaciones, obsCE: r.obsCE, nota: r.nota,
      antecedentes: r.antecedentes, resolucionComision: r.resolucionComision,
      sublema1: r.sublema1, sublema2: r.sublema2, sublema3: r.sublema3,
      sublema4: r.sublema4, sublema5: r.sublema5,
      sublemaRenunciado: r.sublemaRenunciado,
      integrantes: r.integrantes
    }, { firmas: false, titulo: 'Agrupación por Período' });
  }

  joinSublemas(r: AgrupacionPeriodoRow): string {
    const s = [r.sublema1, r.sublema2, r.sublema3, r.sublema4, r.sublema5].filter(Boolean);
    return s.length ? s.join(', ') : '—';
  }

  private base = `${environment.apiUrl}/agrupaciones-periodos`;

  private query(): GridQuery {
    return {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(),
      filters: {
        id: this.fId(), agrId: this.fAgrId(),
        periodo: this.fPeriodo(), pend: this.fPend(),
        cod: this.fCod(),
        tipo: this.fTipo(), nombre: this.fNombre(), depto: this.fDepto(),
        sublema: this.fSublema(),
      },
    };
  }

  load() {
    this.http.get<PagedResult<AgrupacionPeriodoRow>>(this.base, { params: buildPagedParams(this.query()) })
      .subscribe({
        next: r => { this.items.set(r.items); this.total.set(r.total); },
        error: () => { this.items.set([]); this.total.set(0); },
      });
  }

  constructor() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => { this.page.set(1); this.load(); });
    this.http.get<{ periodos: string[]; deptos: string[] }>(`${this.base}/opciones`)
      .subscribe(o => this.periodos.set(o.periodos ?? []));
    // Autocomplete de contacto para el alta de integrante (feature 023).
    this.buscarContacto$.pipe(debounceTime(250)).subscribe(q => {
      if (!q.trim()) { this.resultados.set([]); return; }
      this.contactosSvc.listado({ page: 1, pageSize: 8, filters: { q } })
        .subscribe(r => this.resultados.set(r.items));
    });
    this.load();
  }
}
