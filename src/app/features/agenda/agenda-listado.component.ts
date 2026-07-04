import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { PageTitleService } from '../../core/page-title.service';
import { ContactosService, Contacto, ContactoListado } from './contactos.service';
import { DuplicadosContactosComponent } from './duplicados-contactos.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { exportarCSV } from '../../core/exportar-csv';

type Tab = 'todos' | 'padron' | 'duplicados' | 'exportar';

@Component({
  selector: 'app-agenda-listado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DuplicadosContactosComponent, PaginatorComponent],
  template: `
    <div class="topbar-inline">
      <button class="btn btn-secondary" (click)="exportarCsv()" title="Exportar CSV">📥 CSV</button>
      <a routerLink="/agenda/nuevo" class="btn btn-primary">+ Nuevo Contacto</a>
    </div>

    <div class="tabs">
      <a class="tab" [class.active]="tab()==='todos'"      (click)="tab.set('todos')">Todos los contactos</a>
      <a class="tab" [class.active]="tab()==='duplicados'" (click)="tab.set('duplicados')">Duplicados</a>
      <a class="tab" [class.active]="tab()==='padron'"     (click)="tab.set('padron')">Padron Electoral</a>
      <a class="tab" [class.active]="tab()==='exportar'"   (click)="tab.set('exportar')">Exportar</a>
    </div>

    @if (tab() === 'todos') {
      <div class="sort-hint">
        💡 Click en una columna para ordenar (server-side).
      </div>
      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table">
            <thead>
              <tr>
                <th class="sortable" (click)="onSort('id')">ID <span class="ind">{{ indicador('id') }}</span></th>
                <th class="sortable" (click)="onSort('apellido')">Nombre <span class="ind">{{ indicador('apellido') }}</span></th>
                <th class="sortable" (click)="onSort('cedula')">Cedula <span class="ind">{{ indicador('cedula') }}</span></th>
                <th class="sortable" (click)="onSort('credencial')">Credencial <span class="ind">{{ indicador('credencial') }}</span></th>
                <th class="sortable" (click)="onSort('departamento')">Departamento <span class="ind">{{ indicador('departamento') }}</span></th>
                <th class="sortable" (click)="onSort('celular')">Celular <span class="ind">{{ indicador('celular') }}</span></th>
                <th class="sortable" (click)="onSort('email')">Email <span class="ind">{{ indicador('email') }}</span></th>
                <th class="sortable" (click)="onSort('adhesion')">Adhesion <span class="ind">{{ indicador('adhesion') }}</span></th>
                <th></th>
              </tr>
              <tr class="filter-row">
                <th><input class="column-filter" [ngModel]="fId()"     (ngModelChange)="fId.set($event); onFilter()"     placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event); onFilter()" placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fCedula()" (ngModelChange)="fCedula.set($event); onFilter()" placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fCred()"   (ngModelChange)="fCred.set($event); onFilter()"   placeholder="Filtrar..."></th>
                <th>
                  <select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event); onFilter()">
                    <option value="">Todos</option>
                    @for (d of deptos; track d) { @if (d) { <option>{{ d }}</option> } }
                  </select>
                </th>
                <th><input class="column-filter" [ngModel]="fCel()"   (ngModelChange)="fCel.set($event); onFilter()"   placeholder="Filtrar..."></th>
                <th></th>
                <th>
                  <select class="column-filter" [ngModel]="fAdh()" (ngModelChange)="fAdh.set($event); onFilter()">
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
              @for (c of items(); track c.id) {
                <tr class="clickable" [class.selected]="expandedId() === c.id" (click)="toggle(c.id)">
                  <td>{{ c.id }}</td>
                  <td><strong>{{ c.apellido }}, {{ c.nombre }}</strong></td>
                  <td>{{ c.cedula || '—' }}</td>
                  <td>{{ c.credencial || '—' }}</td>
                  <td>
                    @if (c.departamento) {
                      <span class="badge dept">{{ c.departamento }}</span>
                    } @else { — }
                  </td>
                  <td>{{ c.celular || '—' }}</td>
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
                  <td (click)="$event.stopPropagation()">
                    <div class="action-group">
                      <button class="btn-wa" (click)="abrirWhatsapp(c)" [disabled]="!c.celular && !c.celular2"
                              [title]="(c.celular || c.celular2) ? 'WhatsApp' : 'Sin celular'">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.62-5.964C.122 5.335 5.46 0 12.05 0a11.82 11.82 0 018.412 3.488 11.82 11.82 0 013.48 8.413c-.003 6.557-5.338 11.892-11.892 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                        </svg>
                      </button>
                      <a [routerLink]="['/agenda', c.id]" class="btn-pencil" title="Editar">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                        </svg>
                      </a>
                      @if (c.tieneFicha) {
                        <a [routerLink]="['/agenda', c.id, 'fichas']" class="btn btn-sm btn-success">Ficha Adhesion</a>
                      } @else {
                        <a [routerLink]="['/agenda', c.id, 'fichas', 'nueva']" class="btn btn-sm btn-success">Pasar a Adhesion</a>
                      }
                      @if (c.tieneIntegranteOrganismo) {
                        <a [routerLink]="['/agenda', c.id, 'organismos']" class="btn btn-sm btn-secondary">Int. Organismo</a>
                      } @else {
                        <button class="btn btn-sm btn-secondary" disabled title="El contacto no pertenece a ningún organismo">Int. Organismo</button>
                      }
                    </div>
                  </td>
                </tr>
                @if (expandedId() === c.id && detalle()) {
                  <tr class="detalle-row">
                    <td colspan="9">
                      <div class="detalle-wrap">
                        <div class="detalle-section">
                          <div class="detalle-section-title">Datos personales</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Cortesía</span><span class="v">{{ fmt(detalle()!.cortesia) }}</span></div>
                            <div class="kv"><span class="k">Nombre</span><span class="v">{{ fmt(detalle()!.nombre) }}</span></div>
                            <div class="kv"><span class="k">Apellido</span><span class="v">{{ fmt(detalle()!.apellido) }}</span></div>
                            <div class="kv"><span class="k">Cedula</span><span class="v">{{ fmt(detalle()!.documento) }}</span></div>
                            <div class="kv"><span class="k">Credencial</span><span class="v">{{ fmt(detalle()!.credencialCivica) }}</span></div>
                            <div class="kv"><span class="k">Departamento Credencial</span><span class="v">{{ fmt(detalle()!.departamentoCredencial) }}</span></div>
                            <div class="kv"><span class="k">Fecha Nacimiento</span><span class="v">{{ fmtDate(detalle()!.fechaNacimiento) }}</span></div>
                            <div class="kv"><span class="k">Sexo</span><span class="v">{{ fmt(detalle()!.sexo) }}</span></div>
                            <div class="kv"><span class="k">Estado civil</span><span class="v">{{ fmt(detalle()!.estadoCivil) }}</span></div>
                            <div class="kv"><span class="k">Situación</span><span class="v">{{ fmt(detalle()!.situacion) }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Contacto</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Email</span><span class="v">{{ fmt(detalle()!.email) }}</span></div>
                            <div class="kv"><span class="k">Teléfono</span><span class="v">{{ fmt(detalle()!.telefono) }}</span></div>
                            <div class="kv"><span class="k">Teléfono 2</span><span class="v">{{ fmt(detalle()!.telefono2) }}</span></div>
                            <div class="kv"><span class="k">Celular</span><span class="v">{{ fmt(detalle()!.celular) }}</span></div>
                            <div class="kv"><span class="k">Celular 2</span><span class="v">{{ fmt(detalle()!.celular2) }}</span></div>
                            <div class="kv"><span class="k">Interno</span><span class="v">{{ fmt(detalle()!.interno) }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Dirección</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Departamento</span><span class="v">{{ fmt(detalle()!.departamento) }}</span></div>
                            <div class="kv"><span class="k">Localidad</span><span class="v">{{ fmt(detalle()!.localidad) }}</span></div>
                            <div class="kv full"><span class="k">Dirección</span><span class="v">{{ fmt(detalle()!.direccion) }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Laboral</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Ocupación</span><span class="v">{{ fmt(detalle()!.ocupacion) }}</span></div>
                            <div class="kv"><span class="k">Empresa</span><span class="v">{{ fmt(detalle()!.empresa) }}</span></div>
                            <div class="kv"><span class="k">Organismo</span><span class="v">{{ fmt(detalle()!.organismo) }}</span></div>
                            <div class="kv full"><span class="k">Cargo</span><span class="v">{{ fmt(detalle()!.cargoLaboral) }}</span></div>
                            <div class="kv"><span class="k">Teléfono</span><span class="v">{{ fmt(detalle()!.telefonoTrabajo) }}</span></div>
                            <div class="kv"><span class="k">Teléfono 2</span><span class="v">{{ fmt(detalle()!.telefonoTrabajo2) }}</span></div>
                            <div class="kv"><span class="k">Departamento</span><span class="v">{{ fmt(detalle()!.departamentoLaboral) }}</span></div>
                            <div class="kv"><span class="k">Email</span><span class="v">{{ fmt(detalle()!.mailTrabajo) }}</span></div>
                            <div class="kv full"><span class="k">Datos Secretaría</span><span class="v">{{ fmt(detalle()!.datosSecretaria) }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Adhesion</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Adherente</span><span class="v">{{ detalle()!.adherente ? 'Sí' : 'No' }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Otros</div>
                          <div class="detalle-grid">
                            <div class="kv full"><span class="k">Observaciones</span><span class="v">{{ fmt(detalle()!.observaciones) }}</span></div>
                            <div class="kv"><span class="k">Fecha de creación</span><span class="v">{{ fmtDate(detalle()!.fechaCreado) }}</span></div>
                            <div class="kv"><span class="k">Última modificación</span><span class="v">{{ fmtDate(detalle()!.fechaUltimaModificacion) }}</span></div>
                            <div class="kv"><span class="k">Activo</span><span class="v">{{ detalle()!.activo ? 'Sí' : 'No' }}</span></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr><td colspan="9"><div class="empty-state"><div class="empty-state-text">Sin contactos</div></div></td></tr>
              }
            </tbody>
          </table>
          <app-paginator
            [total]="total()" [page]="page()" [pageSize]="pageSize()"
            (pageChange)="onPage($event)" (pageSizeChange)="onPageSize($event)" />
        </div>
      </div>
    }

    @if (tab() === 'padron') {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Padron Electoral — proximamente</div></div></div></div>
    }
    @if (tab() === 'duplicados') {
      <app-duplicados-contactos></app-duplicados-contactos>
    }
    @if (tab() === 'exportar') {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Exportar — proximamente</div></div></div></div>
    }

    @if (waChoice()) {
      <div class="modal-backdrop" (click)="waChoice.set(null)">
        <div class="wa-pick" (click)="$event.stopPropagation()">
          <div class="wa-pick-header">¿A qué celular querés escribir?</div>
          <div class="wa-pick-body">
            <button class="wa-pick-opt" (click)="abrirWaCon(waChoice()!.celular!)">
              <span class="wa-pick-label">Celular</span>
              <span class="wa-pick-num">{{ waChoice()!.celular }}</span>
            </button>
            <button class="wa-pick-opt" (click)="abrirWaCon(waChoice()!.celular2!)">
              <span class="wa-pick-label">Celular 2</span>
              <span class="wa-pick-num">{{ waChoice()!.celular2 }}</span>
            </button>
          </div>
          <div class="wa-pick-footer">
            <button class="btn btn-secondary" (click)="waChoice.set(null)">Cancelar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; gap:8px; margin-bottom:16px; }
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
    .action-group .btn-wa {
      background:#25D366; color:#fff; border:none;
      border-radius:50%;
      width:34px !important; height:34px !important;
      min-width:34px; min-height:34px;
      max-width:34px; max-height:34px;
      flex:0 0 34px; align-self:center;
      display:inline-flex; align-items:center; justify-content:center;
      cursor:pointer; padding:0; box-sizing:border-box;
      aspect-ratio: 1 / 1;
    }
    .action-group .btn-wa svg { display:block; flex-shrink:0; }
    .action-group .btn-wa:hover:not(:disabled) { background:#1ebe57; }
    .action-group .btn-wa:disabled { background:#bcd; cursor:not-allowed; }
    .action-group .btn-pencil {
      width:34px !important; height:34px !important;
      min-width:34px; min-height:34px;
      max-width:34px; max-height:34px;
      flex:0 0 34px; align-self:center;
    }
    .action-group .btn-pencil svg { width:18px; height:18px; }

    .modal-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.55);
      display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;
    }
    .wa-pick {
      background:#fff; border-radius:10px; width:min(380px, 100%);
      box-shadow:0 20px 50px rgba(0,0,0,.3); overflow:hidden;
    }
    .wa-pick-header { background:#25D366; color:#fff; padding:14px 18px; font-weight:600; }
    .wa-pick-body { padding:14px 16px; display:flex; flex-direction:column; gap:10px; }
    .wa-pick-opt {
      background:#f5fbf7; border:1px solid #d6efdf; color:#1f6f3b;
      padding:12px 14px; border-radius:6px; cursor:pointer; text-align:left;
      display:flex; justify-content:space-between; align-items:center;
      font-family:inherit; font-size:14px;
    }
    .wa-pick-opt:hover { background:#e7f6ec; }
    .wa-pick-label { font-weight:600; }
    .wa-pick-num { font-family:monospace; }
    .wa-pick-footer { padding:10px 16px; border-top:1px solid #eef1f5; display:flex; justify-content:flex-end; }
    .action-group { align-items:stretch; }
    .action-group .btn {
      font-family:inherit; font-size:13px; line-height:1.3;
      box-sizing:border-box; text-align:center; white-space:normal;
    }
    .action-group .btn-success { min-width:120px; }
    .action-group .btn:disabled { opacity:.5; cursor:not-allowed; pointer-events:none; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .detalle-wrap { padding:20px 24px; border-top:1px solid #d6dde6; display:flex; flex-direction:column; gap:18px; }
    .detalle-section { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:14px 18px; }
    .detalle-section-title {
      font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase;
      letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px;
      border-bottom:1px solid #eef1f5;
    }
    .detalle-grid {
      display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 24px;
    }
    @media (max-width: 900px) { .detalle-grid { grid-template-columns:repeat(2, 1fr); } }
    @media (max-width: 600px) { .detalle-grid { grid-template-columns:1fr; } }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv.full { grid-column:1 / -1; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }
  `]
})
export class AgendaListadoComponent implements OnInit {
  private titleSvc = inject(PageTitleService);
  private svc = inject(ContactosService);

  tab = signal<Tab>('todos');
  deptos = ['Montevideo', 'Canelones', 'Maldonado', 'Salto'];
  items = signal<ContactoListado[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  sort = signal<string | undefined>(undefined);
  order = signal<SortOrder>('asc');
  loading = signal(false);
  expandedId = signal<number | null>(null);
  detalle = signal<Contacto | null>(null);

  private filter$ = new Subject<void>();

  toggle(id: number) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.detalle.set(null);
      return;
    }
    this.expandedId.set(id);
    this.detalle.set(null);
    this.svc.get(id).subscribe(c => this.detalle.set(c));
  }

  fmt(v: any): string {
    if (v == null || v === '') return '—';
    return String(v);
  }

  fmtDate(v: any): string {
    if (!v) return '—';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleString('es-UY');
    }
    return s;
  }

  fId = signal('');
  fNombre = signal('');
  fCedula = signal('');
  fCred = signal('');
  fDepto = signal('');
  fCel = signal('');
  fAdh = signal('');

  private buildQuery(all = false): GridQuery {
    return {
      page: this.page(), pageSize: this.pageSize(),
      sort: this.sort(), order: this.order(), all,
      filters: {
        id: this.fId(), nombre: this.fNombre(), cedula: this.fCedula(),
        credencial: this.fCred(), departamento: this.fDepto(), celular: this.fCel(),
        adhesion: this.fAdh(),
      },
    };
  }

  private load() {
    this.loading.set(true);
    this.svc.listado(this.buildQuery()).subscribe({
      next: r => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilter() { this.filter$.next(); }
  onPage(p: number) { this.page.set(p); this.load(); }
  onPageSize(size: number) { this.pageSize.set(size); this.page.set(1); this.load(); }

  onSort(col: string) {
    if (this.sort() === col) {
      this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sort.set(col);
      this.order.set('asc');
    }
    this.page.set(1);
    this.load();
  }

  indicador(col: string): string {
    if (this.sort() !== col) return '';
    return this.order() === 'asc' ? '▲' : '▼';
  }

  waChoice = signal<ContactoListado | null>(null);

  abrirWhatsapp(c: ContactoListado) {
    if (c.celular && c.celular2) {
      this.waChoice.set(c);
    } else if (c.celular) {
      this.abrirWaCon(c.celular);
    } else if (c.celular2) {
      this.abrirWaCon(c.celular2);
    }
  }

  abrirWaCon(numero: string) {
    const num = this.formatoUy(numero);
    if (!num) { alert('Número inválido.'); return; }
    window.open(`https://wa.me/${num}`, '_blank');
    this.waChoice.set(null);
  }

  /** Normaliza a internacional UY sin '+' para wa.me. */
  private formatoUy(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('598')) return digits;
    if (digits.startsWith('0')) return '598' + digits.slice(1);
    return '598' + digits;
  }

  exportarCsv() {
    this.svc.listado(this.buildQuery(true)).subscribe(r => {
      exportarCSV(r.items, [
        { get: 'id', label: 'ID' },
        { get: (c) => `${c.apellido}, ${c.nombre}`, label: 'Nombre' },
        { get: 'cedula', label: 'Cédula' },
        { get: 'credencial', label: 'Credencial' },
        { get: 'departamento', label: 'Departamento' },
        { get: 'celular', label: 'Celular' },
        { get: 'email', label: 'Email' },
        { get: 'adhesion', label: 'Adhesión' }
      ], `contactos-${new Date().toISOString().slice(0, 10)}.csv`);
    });
  }

  constructor() {
    this.titleSvc.set('Agenda');
    this.filter$.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  ngOnInit() { this.load(); }
}
