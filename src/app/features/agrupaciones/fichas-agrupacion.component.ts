import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { GridQuery, PagedResult, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { buildPagedParams } from '../../core/services/paged';
import { toggleSort, sortArrow } from '../../shared/grid/grid-sort';

export interface AutoridadFicha {
  id: number;
  nombre: string;
  apellido: string;
  ci: string;
  rol: string;
  orden: number;
  errorCi?: string | null;
  errorNombre?: string | null;
  errorAdhesion?: string | null;
}

export interface FichaAgrupacion {
  id: number;
  nombreAgrupacion: string;
  tipo: string;
  departamento?: string;
  domicilioLegal?: string;
  ciudad?: string;
  telefono1?: string;
  telefono2?: string;
  mail?: string;
  formaRepresentacion?: string;
  formaActuacion?: string;
  fechaSolicitud?: string;
  nombreResponsable?: string;
  apellidoResponsable?: string;
  ciResponsable?: string;
  celularResponsable?: string;
  sublema1: string;
  sublema2?: string;
  sublema3?: string;
  sublema4?: string;
  sublema5?: string;
  estado: string;
  fechaCreado?: string;
  autoridades: AutoridadFicha[];
}

import { DEPARTAMENTOS } from '../../core/departamentos';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-fichas-agrupacion',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="topbar-inline">
      <button class="btn btn-primary" (click)="sincronizar()" [disabled]="syncing()">
        {{ syncing() ? 'Sincronizando…' : '↻ Sincronizar' }}
      </button>
    </div>

    @if (loading() && !cargado()) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando fichas…</div></div></div></div>
    } @else if (fichas().length === 0 && !hayFiltros()) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">No hay fichas pendientes. Tocá Sincronizar para traer fichas desde la web.</div></div></div></div>
    } @else {
      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="resumen-table">
            <thead>
              <tr class="filter-row">
                <th></th>
                <th><input class="column-filter" [ngModel]="fId()" (ngModelChange)="fId.set($event); onFilter()" placeholder="Id"></th>
                <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event); onFilter()" placeholder="Filtrar..."></th>
                <th></th>
                <th><select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event); onFilter()"><option value="">Todos</option>@for (d of deptosFiltro; track d) { <option [ngValue]="d">{{ d }}</option> }</select></th>
                <th></th><th></th><th></th>
              </tr>
              <tr>
                <th style="width:40px"></th>
                <th>Id</th>
                <th class="sortable" (click)="sortBy('nombre')">Nombre Agrupación {{ arrow('nombre') }}</th>
                <th class="sortable" (click)="sortBy('tipo')">Tipo {{ arrow('tipo') }}</th>
                <th class="sortable" (click)="sortBy('departamento')">Departamento {{ arrow('departamento') }}</th>
                <th class="sortable" (click)="sortBy('fecha')">Fecha solicitud {{ arrow('fecha') }}</th>
                <th>Errores</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (f of fichas(); track f.id) {
                <tr class="clickable" [class.selected]="expandido() === f.id" (click)="toggle(f.id)">
                  <td class="caret">{{ expandido() === f.id ? '▾' : '▸' }}</td>
                  <td>#{{ f.id }}</td>
                  <td><strong>{{ f.nombreAgrupacion }}</strong></td>
                  <td>{{ f.tipo }}</td>
                  <td>{{ f.tipo === 'NACIONAL' ? '—' : (f.departamento || '—') }}</td>
                  <td>{{ f.fechaSolicitud || '—' }}</td>
                  <td>
                    @if (countErrores(f) > 0) {
                      <span class="badge err">{{ countErrores(f) }} error(es)</span>
                    } @else {
                      <span class="badge ok">OK</span>
                    }
                  </td>
                  <td (click)="$event.stopPropagation()" style="white-space:nowrap">
                    <button class="btn-wa" (click)="abrirWhatsapp(f)" [disabled]="!f.celularResponsable"
                            [title]="f.celularResponsable ? 'Enviar WhatsApp a ' + (f.nombreResponsable || 'responsable') : 'Sin celular del responsable'">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.62-5.964C.122 5.335 5.46 0 12.05 0a11.82 11.82 0 018.412 3.488 11.82 11.82 0 013.48 8.413c-.003 6.557-5.338 11.892-11.892 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                      </svg>
                    </button>
                    <button class="btn-edit" (click)="abrirEditar(f)" title="Editar ficha" style="margin-left:6px">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                      </svg>
                    </button>
                    <button class="btn btn-sm btn-primary" (click)="abrirPromover(f)" [disabled]="countErrores(f) > 0"
                            [title]="countErrores(f) > 0 ? 'No se puede pasar a pendiente: la ficha tiene errores' : 'Pasar a Agrupación Pendiente'"
                            style="margin-left:6px">
                      Pasar a pendiente
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="eliminar(f.id)" style="margin-left:6px">Eliminar</button>
                  </td>
                </tr>

                @if (expandido() === f.id) {
                  <tr class="detalle-row">
                    <td colspan="8">
                      <div class="detalle-wrap">
                        <div class="seccion">
                          <div class="seccion-title">Datos de la agrupación</div>
                          <div class="grid">
                            <div class="kv"><span class="k">Nombre</span><span class="v">{{ f.nombreAgrupacion }}</span></div>
                            <div class="kv"><span class="k">Tipo</span><span class="v">{{ f.tipo }}</span></div>
                            @if (f.tipo !== 'NACIONAL') {
                              <div class="kv"><span class="k">Departamento</span><span class="v">{{ f.departamento || '—' }}</span></div>
                            }
                            <div class="kv"><span class="k">Fecha solicitud</span><span class="v">{{ f.fechaSolicitud || '—' }}</span></div>
                            <div class="kv full"><span class="k">Domicilio legal</span><span class="v">{{ f.domicilioLegal || '—' }}</span></div>
                            <div class="kv"><span class="k">Ciudad</span><span class="v">{{ f.ciudad || '—' }}</span></div>
                            <div class="kv"><span class="k">Teléfono 1</span><span class="v">{{ f.telefono1 || '—' }}</span></div>
                            <div class="kv"><span class="k">Teléfono 2</span><span class="v">{{ f.telefono2 || '—' }}</span></div>
                            <div class="kv"><span class="k">Mail</span><span class="v">{{ f.mail || '—' }}</span></div>
                            <div class="kv"><span class="k">Forma Representación</span><span class="v">{{ f.formaRepresentacion || '—' }}</span></div>
                            <div class="kv"><span class="k">Forma Actuación</span><span class="v">{{ f.formaActuacion || '—' }}</span></div>
                          </div>
                        </div>

                        <div class="seccion">
                          <div class="seccion-title">Responsable</div>
                          <div class="grid">
                            <div class="kv"><span class="k">Nombre</span><span class="v">{{ f.nombreResponsable || '—' }}</span></div>
                            <div class="kv"><span class="k">Apellido</span><span class="v">{{ f.apellidoResponsable || '—' }}</span></div>
                            <div class="kv"><span class="k">CI</span><span class="v">{{ f.ciResponsable || '—' }}</span></div>
                            <div class="kv"><span class="k">Celular</span><span class="v">{{ f.celularResponsable || '—' }}</span></div>
                          </div>
                        </div>

                        <div class="seccion">
                          <div class="seccion-title">Sublemas</div>
                          <div class="grid">
                            <div class="kv"><span class="k">Sublema 1</span><span class="v">{{ f.sublema1 }}</span></div>
                            <div class="kv"><span class="k">Sublema 2</span><span class="v">{{ f.sublema2 || '—' }}</span></div>
                            <div class="kv"><span class="k">Sublema 3</span><span class="v">{{ f.sublema3 || '—' }}</span></div>
                            <div class="kv"><span class="k">Sublema 4</span><span class="v">{{ f.sublema4 || '—' }}</span></div>
                            <div class="kv"><span class="k">Sublema 5</span><span class="v">{{ f.sublema5 || '—' }}</span></div>
                          </div>
                        </div>

                        <div class="seccion">
                          <div class="seccion-title">Autoridades</div>
                          <table class="aut-table">
                            <thead>
                              <tr>
                                <th>#</th><th>Nombre</th><th>Apellido</th><th>CI</th><th>Rol</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (a of f.autoridades; track a.id) {
                                <tr>
                                  <td>{{ a.orden }}</td>
                                  <td>
                                    <div [class.err-input]="a.errorNombre">{{ a.nombre }}</div>
                                    @if (a.errorNombre) { <div class="err-msg">{{ a.errorNombre }}</div> }
                                  </td>
                                  <td>
                                    <div [class.err-input]="a.errorNombre">{{ a.apellido }}</div>
                                  </td>
                                  <td>
                                    <div [class.err-input]="a.errorCi || a.errorAdhesion">{{ a.ci }}</div>
                                    @if (a.errorCi) { <div class="err-msg">{{ a.errorCi }}</div> }
                                    @if (a.errorAdhesion) { <div class="err-msg">{{ a.errorAdhesion }}</div> }
                                  </td>
                                  <td>{{ a.rol }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr><td colspan="8" style="text-align:center; padding:24px; color:var(--gray-500)">{{ loading() ? 'Cargando…' : 'Sin resultados' }}</td></tr>
              }
            </tbody>
          </table>
          <app-paginator
            [total]="total()" [page]="page()" [pageSize]="pageSize()"
            (pageChange)="onPage($event)" (pageSizeChange)="onPageSize($event)" />
        </div>
      </div>
    }

    @if (waFicha()) {
      <div class="modal-backdrop" (click)="cerrarWhatsapp()">
        <div class="wa-modal" (click)="$event.stopPropagation()">
          <div class="wa-modal-header">
            <div class="wa-modal-title">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.62-5.964C.122 5.335 5.46 0 12.05 0a11.82 11.82 0 018.412 3.488 11.82 11.82 0 013.48 8.413c-.003 6.557-5.338 11.892-11.892 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              </svg>
              <span>Enviar WhatsApp</span>
            </div>
            <button class="wa-close" (click)="cerrarWhatsapp()" aria-label="Cerrar">×</button>
          </div>

          <div class="wa-modal-body">
            <div class="wa-recipient">
              <div class="wa-avatar">{{ waIniciales() }}</div>
              <div class="wa-recipient-info">
                <div class="wa-name">{{ waFicha()!.nombreResponsable }} {{ waFicha()!.apellidoResponsable }}</div>
                <div class="wa-phone">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="vertical-align:-2px; margin-right:4px">
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.62-5.964C.122 5.335 5.46 0 12.05 0a11.82 11.82 0 018.412 3.488 11.82 11.82 0 013.48 8.413c-.003 6.557-5.338 11.892-11.892 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z"/>
                  </svg>
                  +{{ waPhone() }}
                </div>
                <div class="wa-context">
                  Ficha: <strong>{{ waFicha()!.nombreAgrupacion }}</strong>
                </div>
              </div>
            </div>

            <div class="wa-field">
              <label class="wa-label">Mensaje</label>
              <textarea class="wa-textarea" [(ngModel)]="waMensaje" name="waMensaje"
                        placeholder="Escribí tu mensaje aquí..."></textarea>
              <div class="wa-char-count">{{ waMensaje.length }} caracteres</div>
            </div>

            <div class="wa-hint">
              <span class="wa-hint-icon">ⓘ</span>
              Al continuar se abre <strong>WhatsApp Web</strong> en una pestaña nueva, con la conversación
              y el mensaje precargado. Tenés que tocar <strong>Enviar</strong> ahí para que llegue.
            </div>
          </div>

          <div class="wa-modal-footer">
            <button class="btn btn-secondary" (click)="cerrarWhatsapp()">Cancelar</button>
            <button class="btn-wa-primary" (click)="enviarWhatsapp()" [disabled]="!waMensaje.trim()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-3px; margin-right:6px">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.62-5.964C.122 5.335 5.46 0 12.05 0a11.82 11.82 0 018.412 3.488 11.82 11.82 0 013.48 8.413c-.003 6.557-5.338 11.892-11.892 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              </svg>
              Abrir WhatsApp
            </button>
          </div>
        </div>
      </div>
    }

    @if (promFicha()) {
      <div class="modal-backdrop" (click)="cerrarPromover()">
        <div class="prom-modal" (click)="$event.stopPropagation()">
          <div class="prom-header">
            <div class="prom-title">Pasar a Agrupación Pendiente</div>
            <button class="wa-close" (click)="cerrarPromover()">×</button>
          </div>
          <div class="prom-body">
            <p class="prom-sub">
              Los siguientes campos no vienen en la ficha web. Podés completarlos ahora o dejarlos vacíos
              y editarlos después en <strong>Agrupaciones Pendientes</strong>.
            </p>
            <p class="prom-from">
              Desde ficha: <strong>{{ promFicha()!.nombreAgrupacion }}</strong>
            </p>

            <div class="prom-grid">
              <div class="fg"><label>Cod. Agrupación</label><input [(ngModel)]="prom.codAgrup" name="codAgrup"></div>
              <div class="fg"><label>Cod. Depto.</label><input [(ngModel)]="prom.codDepto" name="codDepto"></div>
              <div class="fg"><label>Solic.</label><input type="number" [(ngModel)]="prom.solic" name="solic"></div>
              <div class="fg"><label>Clasificación</label><input [(ngModel)]="prom.clasificacion" name="clasificacion"></div>
              <div class="fg"><label>Solicita</label><input [(ngModel)]="prom.solicita" name="solicita"></div>
              <div class="fg"><label>Sector</label><input [(ngModel)]="prom.sector" name="sector"></div>
              <div class="fg"><label>Cod. Ant.</label><input [(ngModel)]="prom.codAnt" name="codAnt"></div>
              <div class="fg"><label>Sublema Renunciado</label><input [(ngModel)]="prom.sublemaRenunciado" name="sublemaRenunciado"></div>
              <div class="fg"><label>Nombre Ant.</label><input [(ngModel)]="prom.nombreAnt" name="nombreAnt"></div>
              <div class="fg"><label>Fax</label><input [(ngModel)]="prom.fax" name="fax"></div>
              <div class="fg"><label>Representante</label><input [(ngModel)]="prom.representante" name="representante"></div>
              <div class="fg"><label>Delegado C.E.</label><input [(ngModel)]="prom.delegadoCE" name="delegadoCE"></div>
              <div class="fg"><label>Fecha Ing. Comis.</label><input type="date" [(ngModel)]="prom.fechaIngComis" name="fechaIngComis"></div>
              <div class="fg"><label>Fecha Rec. Agrup.</label><input type="date" [(ngModel)]="prom.fechaRecAgrup" name="fechaRecAgrup"></div>
              <div class="fg"><label>Fecha Entr. C.E.</label><input type="date" [(ngModel)]="prom.fechaEntrCE" name="fechaEntrCE"></div>
              <div class="fg"><label>Fecha Circ. C.E.</label><input type="date" [(ngModel)]="prom.fechaCircCE" name="fechaCircCE"></div>
              <div class="fg full"><label>Antecedentes</label><textarea rows="2" [(ngModel)]="prom.antecedentes" name="antecedentes"></textarea></div>
              <div class="fg full"><label>Resolución de la Comisión</label><textarea rows="2" [(ngModel)]="prom.resolucionComision" name="resolucionComision"></textarea></div>
              <div class="fg"><label>Observaciones</label><input [(ngModel)]="prom.observaciones" name="observaciones"></div>
              <div class="fg"><label>Obs. C.E.</label><input [(ngModel)]="prom.obsCE" name="obsCE"></div>
              <div class="fg full"><label>Nota</label><input [(ngModel)]="prom.nota" name="nota"></div>
            </div>

            @if (promError()) { <div class="prom-err">{{ promError() }}</div> }
          </div>
          <div class="prom-footer">
            <button class="btn btn-secondary" (click)="cerrarPromover()">Cancelar</button>
            <button class="btn btn-primary" (click)="confirmarPromover()" [disabled]="promBusy()">
              {{ promBusy() ? 'Pasando…' : 'Pasar a pendiente' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (editFicha()) {
      <div class="modal-backdrop" (click)="cerrarEditar()">
        <div class="prom-modal" (click)="$event.stopPropagation()">
          <div class="prom-header" style="background:#1f6f3b">
            <div class="prom-title">Editar Ficha de Agrupación Web #{{ editFicha()!.id }}</div>
            <button class="wa-close" (click)="cerrarEditar()">×</button>
          </div>
          <div class="prom-body">
            <h4 class="sec-h">Datos de la agrupación</h4>
            <div class="prom-grid">
              <div class="fg full"><label>Nombre Agrupación</label><input [(ngModel)]="edit.nombreAgrupacion" name="nombreAgrupacion"></div>
              <div class="fg">
                <label>Tipo</label>
                <select [(ngModel)]="edit.tipo" name="tipo">
                  <option value="DEPARTAMENTAL">DEPARTAMENTAL</option>
                  <option value="NACIONAL">NACIONAL</option>
                </select>
              </div>
              @if (edit.tipo !== 'NACIONAL') {
                <div class="fg"><label>Departamento</label><input [(ngModel)]="edit.departamento" name="departamento"></div>
              }
              <div class="fg full"><label>Domicilio Legal</label><input [(ngModel)]="edit.domicilioLegal" name="domicilioLegal"></div>
              <div class="fg"><label>Ciudad</label><input [(ngModel)]="edit.ciudad" name="ciudad"></div>
              <div class="fg"><label>Teléfono 1</label><input [(ngModel)]="edit.telefono1" name="telefono1"></div>
              <div class="fg"><label>Teléfono 2</label><input [(ngModel)]="edit.telefono2" name="telefono2"></div>
              <div class="fg"><label>Mail</label><input [(ngModel)]="edit.mail" name="mail"></div>
              <div class="fg"><label>Forma Representación</label><input [(ngModel)]="edit.formaRepresentacion" name="formaRepresentacion"></div>
              <div class="fg"><label>Forma Actuación</label><input [(ngModel)]="edit.formaActuacion" name="formaActuacion"></div>
              <div class="fg"><label>Fecha Solicitud</label><input type="date" [(ngModel)]="edit.fechaSolicitud" name="fechaSolicitud"></div>
            </div>

            <h4 class="sec-h">Responsable</h4>
            <div class="prom-grid">
              <div class="fg"><label>Nombre</label><input [(ngModel)]="edit.nombreResponsable" name="nombreResponsable"></div>
              <div class="fg"><label>Apellido</label><input [(ngModel)]="edit.apellidoResponsable" name="apellidoResponsable"></div>
              <div class="fg"><label>CI</label><input [(ngModel)]="edit.ciResponsable" name="ciResponsable"></div>
              <div class="fg"><label>Celular</label><input [(ngModel)]="edit.celularResponsable" name="celularResponsable"></div>
            </div>

            <h4 class="sec-h">Sublemas</h4>
            <div class="prom-grid">
              <div class="fg"><label>Sublema 1 *</label><input [(ngModel)]="edit.sublema1" name="sublema1"></div>
              <div class="fg"><label>Sublema 2</label><input [(ngModel)]="edit.sublema2" name="sublema2"></div>
              <div class="fg"><label>Sublema 3</label><input [(ngModel)]="edit.sublema3" name="sublema3"></div>
              <div class="fg"><label>Sublema 4</label><input [(ngModel)]="edit.sublema4" name="sublema4"></div>
              <div class="fg"><label>Sublema 5</label><input [(ngModel)]="edit.sublema5" name="sublema5"></div>
            </div>

            <h4 class="sec-h">
              Autoridades
              <button class="btn btn-sm btn-secondary" (click)="agregarAutoridad()" style="margin-left:10px">+ Agregar</button>
            </h4>
            <table class="aut-edit-table">
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Apellido</th><th>CI</th><th>Rol</th><th></th></tr>
              </thead>
              <tbody>
                @for (a of edit.autoridades; track a; let i = $index) {
                  <tr>
                    <td><input type="number" [(ngModel)]="a.orden" [name]="'aut-orden-' + i" style="width:60px"></td>
                    <td><input [(ngModel)]="a.nombre" [name]="'aut-nom-' + i"></td>
                    <td><input [(ngModel)]="a.apellido" [name]="'aut-ape-' + i"></td>
                    <td><input [(ngModel)]="a.ci" [name]="'aut-ci-' + i"></td>
                    <td>
                      <select [(ngModel)]="a.rol" [name]="'aut-rol-' + i">
                        <option>Presidente</option>
                        <option>Vicepresidente</option>
                        <option>Secretario</option>
                        <option>Tesorero</option>
                        <option>Vocal</option>
                      </select>
                    </td>
                    <td><button class="btn btn-sm btn-danger" (click)="quitarAutoridad(i)">×</button></td>
                  </tr>
                }
              </tbody>
            </table>

            @if (editError()) { <div class="prom-err">{{ editError() }}</div> }
          </div>
          <div class="prom-footer">
            <button class="btn btn-secondary" (click)="cerrarEditar()">Cancelar</button>
            <button class="btn btn-primary" (click)="confirmarEditar()" [disabled]="editBusy()">
              {{ editBusy() ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
    .resumen-table { width:100%; border-collapse:collapse; font-size:14px; }
    .resumen-table th, .resumen-table td { border-bottom:1px solid #eef1f5; padding:10px 14px; text-align:left; }
    .resumen-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .caret { color:#888; font-weight:bold; }
    .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px; }
    .badge.ok  { background:#e6f4ea; color:#1f6f3b; }
    .badge.err { background:#fdecea; color:#a8261b; }
    .detalle-wrap { padding:18px 22px; border-top:1px solid #d6dde6; display:flex; flex-direction:column; gap:16px; }
    .seccion { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:14px 18px; }
    .seccion-title { font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #eef1f5; }
    .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 24px; }
    @media (max-width: 900px) { .grid { grid-template-columns:repeat(2, 1fr); } }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv.full { grid-column:1 / -1; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }
    .aut-table { width:100%; border-collapse:collapse; font-size:13px; }
    .aut-table th, .aut-table td { border-bottom:1px solid #eef1f5; padding:8px 10px; text-align:left; vertical-align:top; }
    .aut-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    .err-input { color:#a8261b; font-weight:600; }
    .err-msg { color:#a8261b; font-size:11px; margin-top:2px; }
    .btn-wa {
      background:#25D366; color:#fff; border:none; border-radius:50%;
      width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center;
      cursor:pointer; vertical-align:middle;
    }
    .btn-wa:hover:not(:disabled) { background:#1ebe57; }
    .btn-wa:disabled { background:#bcd; cursor:not-allowed; }
    .btn-wa-primary {
      background:#25D366; color:#fff; border:none; padding:9px 18px;
      border-radius:6px; font-size:14px; font-weight:600; cursor:pointer;
      display:inline-flex; align-items:center; box-shadow:0 1px 2px rgba(0,0,0,.08);
    }
    .btn-wa-primary:hover:not(:disabled) { background:#1ebe57; }
    .btn-wa-primary:disabled { background:#9bd9b3; cursor:not-allowed; }

    /* WhatsApp modal */
    .modal-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.55);
      display:flex; align-items:center; justify-content:center; z-index:1000;
      padding:20px;
    }
    .wa-modal {
      background:#fff; border-radius:10px;
      width:min(560px, 100%); height:min(640px, 92vh);
      display:flex; flex-direction:column;
      box-shadow:0 20px 50px rgba(0,0,0,.3); overflow:hidden;
    }
    .wa-modal-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 20px; background:#25D366; color:#fff;
    }
    .wa-modal-title { display:flex; align-items:center; gap:10px; font-size:16px; font-weight:600; }
    .wa-close {
      background:transparent; border:none; color:#fff; font-size:24px; line-height:1;
      cursor:pointer; padding:0; width:28px; height:28px; border-radius:4px;
    }
    .wa-close:hover { background:rgba(255,255,255,.18); }
    .wa-modal-body {
      padding:18px 20px; flex:1; min-height:0;
      display:flex; flex-direction:column; gap:14px;
    }
    .wa-recipient {
      display:flex; gap:12px; align-items:center;
      background:#f5fbf7; border:1px solid #d6efdf; border-radius:8px; padding:12px 14px;
    }
    .wa-avatar {
      width:42px; height:42px; border-radius:50%; background:#25D366; color:#fff;
      display:flex; align-items:center; justify-content:center; font-weight:600; font-size:15px;
      flex-shrink:0;
    }
    .wa-recipient-info { min-width:0; flex:1; }
    .wa-name { font-weight:600; font-size:15px; color:#222; }
    .wa-phone { font-family:monospace; color:#1ebe57; font-size:13px; margin-top:2px; }
    .wa-context { font-size:12px; color:#666; margin-top:4px; }
    .wa-field {
      display:flex; flex-direction:column; gap:6px;
      flex:1; min-height:0;
    }
    .wa-label {
      font-size:11px; font-weight:600; color:#666;
      text-transform:uppercase; letter-spacing:.4px;
      display:block;
    }
    .wa-textarea {
      display:block; width:100%; box-sizing:border-box;
      flex:1; min-height:0;
      padding:10px 12px; font-size:14px;
      font-family:inherit; line-height:1.45; border:1px solid #cfd6e0; border-radius:6px;
      resize:none; outline:none;
    }
    .wa-textarea:focus { border-color:#25D366; box-shadow:0 0 0 3px rgba(37,211,102,.15); }
    .wa-char-count { font-size:11px; color:#888; text-align:right; }
    .wa-hint {
      display:flex; gap:8px; align-items:flex-start;
      background:#f0f6ff; border:1px solid #d6e4f5; border-radius:6px;
      padding:10px 12px; font-size:12px; color:#3d4f6b; line-height:1.45;
    }
    .wa-hint-icon { color:#1a4f8a; font-weight:bold; flex-shrink:0; }
    .wa-modal-footer {
      padding:12px 20px; border-top:1px solid #eef1f5; background:#fafbfd;
      display:flex; gap:10px; justify-content:flex-end;
    }

    .prom-modal {
      background:#fff; border-radius:10px; width:min(820px, 96vw);
      height:min(720px, 92vh); display:flex; flex-direction:column;
      box-shadow:0 20px 50px rgba(0,0,0,.3); overflow:hidden;
    }
    .prom-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 20px; background:#1e3a8a; color:#fff;
    }
    .prom-title { font-size:16px; font-weight:600; }
    .prom-body { padding:18px 20px; overflow-y:auto; flex:1; }
    .prom-sub { margin:0 0 4px 0; color:#444; font-size:13px; }
    .prom-from { margin:0 0 14px 0; color:#666; font-size:13px; }
    .prom-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:10px 16px; }
    @media (max-width:700px) { .prom-grid { grid-template-columns:1fr; } }
    .fg { display:flex; flex-direction:column; gap:4px; }
    .fg.full { grid-column:1 / -1; }
    .fg label { font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:.4px; }
    .fg input, .fg textarea {
      padding:8px 10px; font-size:13px; font-family:inherit;
      border:1px solid #cfd6e0; border-radius:5px; outline:none;
    }
    .fg input:focus, .fg textarea:focus { border-color:#1e3a8a; box-shadow:0 0 0 3px rgba(30,58,138,.12); }
    .fg textarea { resize:vertical; }
    .prom-err {
      margin-top:12px; padding:8px 12px; background:#fdecea; color:#a8261b;
      border-radius:5px; font-size:13px;
    }
    .prom-footer {
      padding:12px 20px; border-top:1px solid #eef1f5; background:#fafbfd;
      display:flex; gap:10px; justify-content:flex-end;
    }

    .btn-edit {
      background:#2563eb; color:#fff; border:none; border-radius:50%;
      width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center;
      cursor:pointer; vertical-align:middle; padding:0; line-height:1;
      box-shadow:0 1px 2px rgba(0,0,0,.15);
    }
    .btn-edit:hover { background:#1d4ed8; }
    .btn-edit svg { display:block; }
    .btn:disabled, .btn[disabled] {
      opacity:.5; cursor:not-allowed; pointer-events:none;
      filter:grayscale(0.4);
    }
    .sec-h {
      margin:16px 0 8px 0; font-size:13px; font-weight:600; color:#4a5568;
      text-transform:uppercase; letter-spacing:.5px;
      padding-bottom:4px; border-bottom:1px solid #eef1f5;
      display:flex; align-items:center;
    }
    .sec-h:first-child { margin-top:0; }
    th.sortable { cursor:pointer; user-select:none; }
    .aut-edit-table { width:100%; border-collapse:collapse; font-size:13px; }
    .aut-edit-table th, .aut-edit-table td { border-bottom:1px solid #eef1f5; padding:6px 6px; text-align:left; }
    .aut-edit-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    .aut-edit-table input, .aut-edit-table select {
      width:100%; padding:6px 8px; font-size:13px; font-family:inherit;
      border:1px solid #cfd6e0; border-radius:4px; outline:none; box-sizing:border-box;
    }
  `]
})
export class FichasAgrupacionComponent {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/fichas-agrupacion`;

  fichas = signal<FichaAgrupacion[]>([]);
  loading = signal(true);
  syncing = signal(false);
  expandido = signal<number | null>(null);

  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');

  // Filtros de la grilla (feature 030).
  fId = signal(''); fNombre = signal(''); fDepto = signal('');
  readonly deptosFiltro = DEPARTAMENTOS;
  private filter$ = new Subject<void>();
  onFilter() { this.filter$.next(); }
  hayFiltros = computed(() => !!(this.fId() || this.fNombre() || this.fDepto()));
  // El aviso de "cargando"/"vacío" reemplaza la tabla entera: con filtros activos (o tras la
  // primera carga) se mantiene la tabla para no perder la fila de filtros (feature 030).
  cargado = signal(false);

  constructor() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => { this.page.set(1); this.cargar(); });
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    const q: GridQuery = {
      page: this.page(), pageSize: this.pageSize(), sort: this.sort(), order: this.order(),
      filters: { id: this.fId(), nombre: this.fNombre(), departamento: this.fDepto() },
    };
    this.http.get<PagedResult<FichaAgrupacion>>(this.base, { params: buildPagedParams(q) }).subscribe({
      next: (r) => { this.fichas.set(r.items); this.total.set(r.total); this.loading.set(false); this.cargado.set(true); },
      error: () => { this.fichas.set([]); this.loading.set(false); this.cargado.set(true); }
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

  sincronizar() {
    this.syncing.set(true);
    this.http.post(`${this.base}/sincronizar`, {}).subscribe({
      next: () => { this.syncing.set(false); this.cargar(); },
      error: () => { this.syncing.set(false); }
    });
  }

  eliminar(id: number) {
    if (!confirm('Eliminar esta ficha pendiente?')) return;
    this.http.delete(`${this.base}/${id}`).subscribe(() => {
      if (this.expandido() === id) this.expandido.set(null);
      this.cargar();
    });
  }

  countErrores(f: FichaAgrupacion): number {
    return f.autoridades.reduce((n, a) =>
      n + (a.errorCi ? 1 : 0) + (a.errorNombre ? 1 : 0) + (a.errorAdhesion ? 1 : 0), 0);
  }

  // ─── WhatsApp ───────────────────────────────────────────────
  waFicha = signal<FichaAgrupacion | null>(null);
  waMensaje = '';

  abrirWhatsapp(f: FichaAgrupacion) {
    if (!f.celularResponsable) return;
    const nombre = (f.nombreResponsable || '').trim();
    const saludo = nombre ? `Hola ${nombre}` : 'Hola';
    this.waMensaje =
      `${saludo}, te escribimos del Partido Nacional respecto a la ficha de la agrupación "${f.nombreAgrupacion}" recibida el ${f.fechaSolicitud || ''}. Te contactamos para confirmar algunos datos antes de procesarla. ¿Tenés un momento?`;
    this.waFicha.set(f);
  }

  cerrarWhatsapp() {
    this.waFicha.set(null);
    this.waMensaje = '';
  }

  waPhone(): string {
    const f = this.waFicha();
    if (!f?.celularResponsable) return '';
    return this.formatoUy(f.celularResponsable);
  }

  waIniciales(): string {
    const f = this.waFicha();
    if (!f) return '?';
    const n = (f.nombreResponsable || '').trim().charAt(0).toUpperCase();
    const a = (f.apellidoResponsable || '').trim().charAt(0).toUpperCase();
    return (n + a) || '?';
  }

  enviarWhatsapp() {
    const f = this.waFicha();
    if (!f?.celularResponsable) return;
    const num = this.formatoUy(f.celularResponsable);
    if (!num) { alert('Numero de celular invalido.'); return; }
    const url = `https://wa.me/${num}?text=${encodeURIComponent(this.waMensaje)}`;
    window.open(url, '_blank');
    this.cerrarWhatsapp();
  }

  /** Normaliza a formato internacional sin '+' para wa.me. UY: 598 + 8 digitos del movil. */
  private formatoUy(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('598')) return digits;
    if (digits.startsWith('0')) return '598' + digits.slice(1);
    return '598' + digits;
  }

  // ─── Pasar a pendiente ──────────────────────────────────────
  promFicha = signal<FichaAgrupacion | null>(null);
  promBusy = signal(false);
  promError = signal<string>('');
  prom: any = {};

  abrirPromover(f: FichaAgrupacion) {
    if (this.countErrores(f) > 0) return;
    this.prom = {
      codAgrup: '', codDepto: '', solic: null,
      clasificacion: '', solicita: '', sector: '',
      codAnt: '', sublemaRenunciado: '', nombreAnt: '',
      fax: '', representante: '', delegadoCE: '',
      fechaIngComis: '', fechaRecAgrup: '', fechaEntrCE: '', fechaCircCE: '',
      observaciones: '', obsCE: '', nota: '',
      antecedentes: '', resolucionComision: ''
    };
    this.promError.set('');
    this.promFicha.set(f);
  }

  cerrarPromover() {
    this.promFicha.set(null);
    this.promError.set('');
  }

  // ─── Editar ficha ───────────────────────────────────────────
  editFicha = signal<FichaAgrupacion | null>(null);
  editBusy = signal(false);
  editError = signal<string>('');
  edit: any = { autoridades: [] };

  abrirEditar(f: FichaAgrupacion) {
    this.edit = {
      nombreAgrupacion: f.nombreAgrupacion,
      tipo: f.tipo,
      departamento: f.departamento || '',
      domicilioLegal: f.domicilioLegal || '',
      ciudad: f.ciudad || '',
      telefono1: f.telefono1 || '',
      telefono2: f.telefono2 || '',
      mail: f.mail || '',
      formaRepresentacion: f.formaRepresentacion || '',
      formaActuacion: f.formaActuacion || '',
      fechaSolicitud: f.fechaSolicitud || '',
      nombreResponsable: f.nombreResponsable || '',
      apellidoResponsable: f.apellidoResponsable || '',
      ciResponsable: f.ciResponsable || '',
      celularResponsable: f.celularResponsable || '',
      sublema1: f.sublema1,
      sublema2: f.sublema2 || '',
      sublema3: f.sublema3 || '',
      sublema4: f.sublema4 || '',
      sublema5: f.sublema5 || '',
      autoridades: f.autoridades.map(a => ({
        nombre: a.nombre, apellido: a.apellido, ci: a.ci, rol: a.rol, orden: a.orden
      }))
    };
    this.editError.set('');
    this.editFicha.set(f);
  }

  cerrarEditar() {
    this.editFicha.set(null);
    this.editError.set('');
  }

  agregarAutoridad() {
    const next = (this.edit.autoridades.reduce((m: number, a: any) => Math.max(m, +a.orden || 0), 0) || 0) + 1;
    this.edit.autoridades.push({ nombre: '', apellido: '', ci: '', rol: 'Vocal', orden: next });
  }

  quitarAutoridad(i: number) {
    this.edit.autoridades.splice(i, 1);
  }

  confirmarEditar() {
    const f = this.editFicha();
    if (!f) return;
    if (!this.edit.sublema1?.trim()) {
      this.editError.set('Sublema 1 es obligatorio.');
      return;
    }
    if (this.edit.autoridades.length < 5) {
      this.editError.set('Se requieren al menos 5 autoridades.');
      return;
    }
    const presidentes = this.edit.autoridades.filter((a: any) => a.rol === 'Presidente').length;
    if (presidentes !== 1) {
      this.editError.set('Debe haber exactamente 1 Presidente.');
      return;
    }
    const secretarios = this.edit.autoridades.filter((a: any) => a.rol === 'Secretario').length;
    if (secretarios < 1) {
      this.editError.set('Debe haber al menos 1 Secretario.');
      return;
    }

    this.editBusy.set(true);
    this.editError.set('');
    const body = {
      ...this.edit,
      fechaSolicitud: this.edit.fechaSolicitud || null,
      departamento: this.edit.tipo === 'NACIONAL' ? null : this.edit.departamento,
      autoridades: this.edit.autoridades.map((a: any, i: number) => ({
        nombre: a.nombre, apellido: a.apellido, ci: a.ci, rol: a.rol,
        orden: +a.orden || i + 1
      }))
    };
    this.http.put(`${this.base}/${f.id}`, body).subscribe({
      next: () => {
        this.editBusy.set(false);
        this.cerrarEditar();
        this.cargar();
      },
      error: (err) => {
        this.editBusy.set(false);
        const msg = err?.error?.message || err?.message || 'No se pudo guardar la ficha.';
        this.editError.set(msg);
      }
    });
  }

  confirmarPromover() {
    const f = this.promFicha();
    if (!f) return;
    this.promBusy.set(true);
    this.promError.set('');
    const body = {
      fichaId: f.id,
      ...this.prom,
      solic: this.prom.solic === '' || this.prom.solic == null ? null : Number(this.prom.solic),
      fechaIngComis: this.prom.fechaIngComis || null,
      fechaRecAgrup: this.prom.fechaRecAgrup || null,
      fechaEntrCE: this.prom.fechaEntrCE || null,
      fechaCircCE: this.prom.fechaCircCE || null
    };
    this.http.post(`${environment.apiUrl}/agrupaciones-pendientes/promover`, body).subscribe({
      next: () => {
        this.promBusy.set(false);
        this.cerrarPromover();
        this.cargar();
      },
      error: (err) => {
        this.promBusy.set(false);
        const msg = err?.error?.message || 'No se pudo pasar la ficha a pendiente.';
        this.promError.set(msg);
      }
    });
  }
}
