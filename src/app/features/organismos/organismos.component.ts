import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitleService } from '../../core/page-title.service';
import { exportarCSV, CsvColumn } from '../../core/exportar-csv';
import { OrganismosService } from '../../core/services/organismos.service';
import { ModalFormComponent } from '../../shared/components/modal-form/modal-form.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { toggleSort, sortArrow } from '../../shared/grid/grid-sort';
import { RouterLink } from '@angular/router';
import {
  Ambito, OrganismoDto, OrganismoUpdateInput,
  TipoOrganizacionDto, InfoOrganizacionDto, InfoOrganizacionInput,
  IntegranteOrg,
} from '../../core/models/organismos';

type Tab = 'todos' | 'info';
type ModalKind = 'organismo' | 'info';
type ModalMode = 'nueva' | 'editar';

@Component({
  selector: 'app-organismos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalFormComponent, PaginatorComponent],
  template: `
    <div class="topbar-inline">
      @if (tab()==='todos') { <button class="btn btn-primary" (click)="abrirNuevoOrganismo()">+ Nuevo Organismo</button> }
      @if (tab()==='info') { <button class="btn btn-primary" (click)="abrirNuevaInfo()">+ Nueva Info</button> }
      <button class="btn btn-secondary" (click)="exportarCsvTab()" title="Exportar CSV">📥 CSV</button>
    </div>

    <div class="tabs">
      <a class="tab" [class.active]="tab()==='todos'"        (click)="setTab('todos')">Todos los Organismos</a>
      <a class="tab" [class.active]="tab()==='info'"         (click)="setTab('info')">Info de la Organización</a>
    </div>

    @if (tab()==='todos') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1400px">
          <thead>
            <tr class="filter-row">
              <th></th>
              <th>
                <select class="column-filter" [ngModel]="fOrgAmb()" (ngModelChange)="setOrgFilter(fOrgAmb, $event)">
                  <option value="">Todos</option>
                  <option value="Estatal">Estatal</option>
                  <option value="Partidario">Partidario</option>
                </select>
              </th>
              <th><input class="column-filter" [ngModel]="fOrgNom()" (ngModelChange)="setOrgFilter(fOrgNom, $event)" placeholder="Filtrar..."></th>
              <th></th>
              <th></th>
              <th></th>
              <th>
                <select class="column-filter" [ngModel]="fOrgDep()" (ngModelChange)="setOrgFilter(fOrgDep, $event)">
                  <option value="">Todos</option>
                  @for (d of departamentos; track d) { <option [ngValue]="d">{{ d }}</option> }
                </select>
              </th>
              <th></th>
              <th>
                <select class="column-filter" [ngModel]="fOrgArt()" (ngModelChange)="setOrgFilter(fOrgArt, $event)">
                  <option value="">Todos</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
            <tr>
              <th class="sortable" (click)="sortTodos('id')">Id {{ arrowTodos('id') }}</th>
              <th class="sortable" (click)="sortTodos('ambito')">Ámbito {{ arrowTodos('ambito') }}</th>
              <th class="sortable" (click)="sortTodos('nombre')">Nombre {{ arrowTodos('nombre') }}</th>
              <th>Descripción</th><th>Dirección</th>
              <th>Ciudad</th>
              <th class="sortable" (click)="sortTodos('departamento')">Departamento {{ arrowTodos('departamento') }}</th>
              <th>País</th><th>Art. 44</th>
              <th class="sortable" (click)="sortTodos('ordenDpto')">Orden Dpto. {{ arrowTodos('ordenDpto') }}</th>
              <th>Observaciones</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (o of organismos(); track o.id) {
              <tr class="clickable" [class.selected]="isExpanded(o)" (click)="toggleOrg(o)">
                <td>{{ isExpanded(o) ? '▾' : '▸' }} {{ o.id }}</td>
                <td><span class="badge" [class.amb-est]="o.ambito==='Estatal'" [class.amb-part]="o.ambito==='Partidario'">{{ o.ambito }}</span></td>
                <td><strong>{{ o.nombre }}</strong></td>
                <td>{{ o.descripcion }}</td>
                <td>{{ o.direccion }}</td>
                <td>{{ o.ciudad }}</td>
                <td><span class="badge dept">{{ o.departamento }}</span></td>
                <td>{{ o.pais }}</td>
                <td>{{ o.art44 ? '☑' : '☐' }}</td>
                <td>{{ o.ordenDpto }}</td>
                <td>{{ o.observaciones || '—' }}</td>
                <td (click)="$event.stopPropagation()">
                  <div class="action-group">
                    <button class="btn-pencil" (click)="abrirEditarOrganismo(o)" title="Editar">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                      </svg>
                    </button>
                    <a [routerLink]="['/organismos', o.id, 'referencias']" class="btn btn-sm btn-secondary" title="Referencias partidarias de este organismo">Referencias partidarias</a>
                  </div>
                </td>
              </tr>
              @if (isExpanded(o)) {
                <tr class="detalle-row">
                  <td colspan="12">
                    <div class="detalle-wrap">
                      <div class="detalle-section">
                        <div class="detalle-section-title">Integrantes de {{ o.nombre }}</div>
                        @if (orgLoading()[o.id]) {
                          <div class="empty-state" style="padding:24px"><div class="empty-state-text">Cargando integrantes…</div></div>
                        } @else if (orgError()[o.id]) {
                          <div class="empty-state" style="padding:24px">
                            <div class="empty-state-text">{{ orgError()[o.id] }}</div>
                            <button class="btn btn-secondary" style="margin-top:10px" (click)="loadIntegrantes(o)">Reintentar</button>
                          </div>
                        } @else if (integrantesDe(o).length === 0) {
                          <div class="empty-state" style="padding:24px"><div class="empty-state-text">Este organismo no tiene integrantes</div></div>
                        } @else {
                          <table class="table inner-table">
                            <thead>
                              <tr>
                                <th>Cred. Cívica</th><th>Apellidos</th><th>Nombres</th>
                                <th>Celular</th><th>Mail</th><th>Posición</th><th>Depto.</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (i of integrantesDe(o); track i.idContacto) {
                                <tr>
                                  <td>{{ i.credCivica }}</td>
                                  <td><strong>{{ i.apellidos }}</strong></td>
                                  <td>{{ i.nombres }}</td>
                                  <td>{{ i.celular }}</td>
                                  <td>{{ i.mail }}</td>
                                  <td>{{ i.posicion }}</td>
                                  <td><span class="badge dept">{{ i.departamento }}</span></td>
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
              <tr><td colspan="12"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
            }
          </tbody>
        </table>
        <app-paginator [total]="orgTotal()" [page]="orgPage()" [pageSize]="orgPageSize()"
                       (pageChange)="onOrgPage($event)" (pageSizeChange)="onOrgPageSize($event)" />
      </div></div>
    }

    @if (tab()==='info') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1100px">
          <thead>
            <tr class="filter-row">
              <th></th>
              <th></th>
              <th><input class="column-filter" [ngModel]="fInfDir()" (ngModelChange)="setInfoFilter(fInfDir, $event)" placeholder="Filtrar..."></th>
              <th></th>
              <th><input class="column-filter" [ngModel]="fInfMail()" (ngModelChange)="setInfoFilter(fInfMail, $event)" placeholder="Filtrar..."></th>
              <th></th>
              <th></th>
            </tr>
            <tr>
              <th>Id Info.</th><th>Id Tipo</th><th>Id Organismo</th>
              <th>Dirección</th><th>Teléfono</th><th>Email</th><th>Observaciones</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (i of info(); track i.id) {
              <tr>
                <td>{{ i.id }}</td>
                <td>{{ i.tipoOrganizacionId ?? '—' }}</td>
                <td>{{ i.organismoId ?? '—' }}</td>
                <td>{{ i.direccion || '—' }}</td>
                <td>{{ i.telefono || '—' }}</td>
                <td>{{ i.email || '—' }}</td>
                <td>{{ i.observaciones || '—' }}</td>
                <td>
                  <button class="btn-pencil" (click)="abrirEditarInfo(i)" title="Editar">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
            }
          </tbody>
        </table>
        <app-paginator [total]="infoTotal()" [page]="infoPage()" [pageSize]="infoPageSize()"
                       (pageChange)="onInfoPage($event)" (pageSizeChange)="onInfoPageSize($event)" />
      </div></div>
    }


    @if (modalKind()) {
      <app-modal-form
        [title]="tituloModal()"
        [busy]="modalBusy()"
        [error]="modalError()"
        [saveLabel]="modalMode()==='editar' ? 'Guardar cambios' : 'Crear'"
        (save)="guardar()" (cancel)="cerrarModal()">
            @if (modalKind()==='organismo') {
              <div class="nv-grid">
                <div class="fg"><label>Ámbito *</label>
                  <select [(ngModel)]="form.ambito" name="o-amb" [disabled]="modalMode()==='editar'">
                    <option value="Estatal">Estatal</option>
                    <option value="Partidario">Partidario</option>
                  </select>
                </div>
                <div class="fg"><label>Tipo de Organización *</label>
                  <select [(ngModel)]="form.tipoOrganizacionId" name="o-tipo">
                    <option [ngValue]="null">— Seleccioná —</option>
                    @for (t of tipos(); track t.id) { <option [ngValue]="t.id">{{ t.nombre }}</option> }
                  </select>
                </div>
                <div class="fg full"><label>Nombre *</label><input [(ngModel)]="form.nombre" name="o-nombre"></div>
                <div class="fg"><label>Nombre Compañía</label><input [(ngModel)]="form.nombreCompania" name="o-comp"></div>
                <div class="fg"><label>Categoría</label><input [(ngModel)]="form.categoria" name="o-cat"></div>
                <div class="fg full"><label>Descripción</label><input [(ngModel)]="form.descripcion" name="o-desc"></div>
                <div class="fg full"><label>Dirección</label><input [(ngModel)]="form.direccion" name="o-dir"></div>
                <div class="fg"><label>Ciudad</label><input [(ngModel)]="form.ciudad" name="o-ciu"></div>
                <div class="fg"><label>Departamento</label>
                  <select [(ngModel)]="form.departamento" name="o-dep">
                    <option value="">—</option>
                    @for (d of departamentos; track d) { <option [ngValue]="d">{{ d }}</option> }
                  </select>
                </div>
                <div class="fg"><label>País</label><input [(ngModel)]="form.pais" name="o-pais"></div>
                <div class="fg"><label>Orden Dpto.</label><input type="number" [(ngModel)]="form.ordenDpto" name="o-ord"></div>
                <div class="fg full"><label>Observaciones</label><input [(ngModel)]="form.observaciones" name="o-obs"></div>
                <div class="fg check"><label><input type="checkbox" [(ngModel)]="form.art44" name="o-art"> Art. 44</label></div>
              </div>
            } @else {
              <div class="nv-grid">
                <div class="fg"><label>Tipo de Organización</label>
                  <select [(ngModel)]="form.tipoOrganizacionId" name="i-tipo">
                    <option [ngValue]="null">—</option>
                    @for (t of tipos(); track t.id) { <option [ngValue]="t.id">{{ t.nombre }}</option> }
                  </select>
                </div>
                <div class="fg"><label>Organismo ID</label><input type="number" [(ngModel)]="form.organismoId" name="i-org"></div>
                <div class="fg full"><label>Dirección</label><input [(ngModel)]="form.direccion" name="i-dir"></div>
                <div class="fg"><label>Teléfono</label><input [(ngModel)]="form.telefono" name="i-tel"></div>
                <div class="fg"><label>Email</label><input [(ngModel)]="form.email" name="i-mail"></div>
                <div class="fg full"><label>Observaciones</label><input [(ngModel)]="form.observaciones" name="i-obs"></div>
              </div>
            }
      </app-modal-form>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; gap:8px; margin-bottom:16px; }
    .badge.amb-est { background:#e6f0ff; color:#1a4f8a; }
    .badge.amb-part { background:#fdeede; color:#8a5a1a; }
    th.sortable { cursor:pointer; user-select:none; white-space:nowrap; }
    th.sortable:hover { color:var(--primary, #1a4f8a); }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .detalle-wrap { padding:16px 20px; border-top:1px solid #d6dde6; }
    .detalle-section { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:12px 16px; }
    .detalle-section-title {
      font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase;
      letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px;
      border-bottom:1px solid #eef1f5;
    }
    .inner-table { min-width:720px; }
    .inner-table th { font-size:12px; }
  `]
})
export class OrganismosComponent {
  private titleSvc = inject(PageTitleService);
  private svc = inject(OrganismosService);

  tab = signal<Tab>('todos');
  tipos = signal<TipoOrganizacionDto[]>([]);

  departamentos = [
    'Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida',
    'Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha',
    'Salto','San José','Soriano','Tacuarembó','Treinta y Tres','Nacional'
  ];

  // Tamaño de página "grande" para la sublista inline (sin paginador propio).
  private static readonly INLINE_PAGE_SIZE = 100;

  // ── Grilla Todos ─────────────────────────────────────────
  organismos = signal<OrganismoDto[]>([]);
  orgTotal = signal(0);
  orgPage = signal(1);
  orgPageSize = signal(DEFAULT_PAGE_SIZE);
  orgSort = signal<string | undefined>(undefined);
  orgOrder = signal<SortOrder>('asc');
  fOrgAmb = signal(''); fOrgNom = signal(''); fOrgDep = signal(''); fOrgArt = signal('');

  // ── Grilla Info ──────────────────────────────────────────
  info = signal<InfoOrganizacionDto[]>([]);
  infoTotal = signal(0);
  infoPage = signal(1);
  infoPageSize = signal(DEFAULT_PAGE_SIZE);
  fInfDir = signal(''); fInfMail = signal('');
  private infoLoaded = false;


  // ── Integrantes inline (acordeón + caché por id) ─────────
  expandedOrgId = signal<number | null>(null);
  integrantesPorOrg = signal<Record<number, IntegranteOrg[]>>({});
  orgLoading = signal<Record<number, boolean>>({});
  orgError = signal<Record<number, string>>({});

  // ── Modal ────────────────────────────────────────────────
  modalKind = signal<ModalKind | null>(null);
  modalMode = signal<ModalMode>('nueva');
  editId = signal<number | null>(null);
  modalBusy = signal(false);
  modalError = signal('');
  form: any = {};

  private timers: Record<string, any> = {};

  tituloModal = computed(() => {
    if (this.modalKind() === 'info') return this.modalMode() === 'editar' ? 'Editar Info de Organización' : 'Nueva Info de Organización';
    return this.modalMode() === 'editar' ? 'Editar Organismo' : 'Nuevo Organismo';
  });

  constructor() {
    this.titleSvc.set('Organismos');
    this.svc.getTipos().subscribe(x => this.tipos.set(x));
    this.loadTodos();
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'info' && !this.infoLoaded) { this.infoLoaded = true; this.loadInfo(); }
  }

  // ── Debounce util ────────────────────────────────────────
  private debounced(key: string, fn: () => void, ms = 300) {
    clearTimeout(this.timers[key]);
    this.timers[key] = setTimeout(fn, ms);
  }

  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.errorCode || err?.message || fallback;
  }

  private clean(v: string): string | undefined { return v.trim() === '' ? undefined : v; }

  // ── Todos ────────────────────────────────────────────────
  private orgQuery(all = false): GridQuery {
    return {
      page: this.orgPage(), pageSize: this.orgPageSize(),
      sort: this.orgSort(), order: this.orgOrder(),
      filters: {
        ambito: this.clean(this.fOrgAmb()), nombre: this.clean(this.fOrgNom()),
        departamento: this.clean(this.fOrgDep()), art44: this.clean(this.fOrgArt()),
      },
      all,
    };
  }

  private loadTodos() {
    this.svc.getOrganismos(this.orgQuery()).subscribe(r => {
      this.organismos.set(r.items); this.orgTotal.set(r.total);
      this.orgPage.set(r.page); this.orgPageSize.set(r.pageSize);
    });
  }

  setOrgFilter(sig: WritableSignal<string>, value: string) {
    sig.set(value); this.orgPage.set(1);
    this.debounced('todos', () => this.loadTodos());
  }
  onOrgPage(p: number) { this.orgPage.set(p); this.loadTodos(); }
  onOrgPageSize(s: number) { this.orgPageSize.set(s); this.orgPage.set(1); this.loadTodos(); }
  sortTodos(field: string) { toggleSort(this.orgSort, this.orgOrder, field); this.orgPage.set(1); this.loadTodos(); }
  arrowTodos(field: string) { return sortArrow(this.orgSort(), this.orgOrder(), field); }

  // ── Info ─────────────────────────────────────────────────
  private infoQuery(all = false): GridQuery {
    return {
      page: this.infoPage(), pageSize: this.infoPageSize(),
      filters: { direccion: this.clean(this.fInfDir()), email: this.clean(this.fInfMail()) },
      all,
    };
  }
  private loadInfo() {
    this.svc.getInfo(this.infoQuery()).subscribe(r => {
      this.info.set(r.items); this.infoTotal.set(r.total);
      this.infoPage.set(r.page); this.infoPageSize.set(r.pageSize);
    });
  }
  setInfoFilter(sig: WritableSignal<string>, value: string) {
    sig.set(value); this.infoPage.set(1);
    this.debounced('info', () => this.loadInfo());
  }
  onInfoPage(p: number) { this.infoPage.set(p); this.loadInfo(); }
  onInfoPageSize(s: number) { this.infoPageSize.set(s); this.infoPage.set(1); this.loadInfo(); }


  // ── Integrantes inline (caché por id) ────────────────────
  isExpanded(o: OrganismoDto): boolean { return this.expandedOrgId() === o.id; }
  integrantesDe(o: OrganismoDto): IntegranteOrg[] { return this.integrantesPorOrg()[o.id] ?? []; }

  toggleOrg(o: OrganismoDto) {
    if (this.expandedOrgId() === o.id) { this.expandedOrgId.set(null); return; }
    this.expandedOrgId.set(o.id);
    if (!(o.id in this.integrantesPorOrg())) this.loadIntegrantes(o);
  }

  loadIntegrantes(o: OrganismoDto) {
    const id = o.id;
    this.orgLoading.update(mp => ({ ...mp, [id]: true }));
    this.orgError.update(mp => { const { [id]: _drop, ...rest } = mp; return rest; });
    // Sublista inline: una página grande, sin paginador propio (decisión UX).
    this.svc.getIntegrantes(id, { page: 1, pageSize: OrganismosComponent.INLINE_PAGE_SIZE }).subscribe({
      next: (r) => {
        this.integrantesPorOrg.update(mp => ({ ...mp, [id]: r.items }));
        this.orgLoading.update(mp => ({ ...mp, [id]: false }));
      },
      error: (err) => {
        this.orgLoading.update(mp => ({ ...mp, [id]: false }));
        this.orgError.update(mp => ({ ...mp, [id]: this.extractError(err, 'No se pudieron cargar los integrantes.') }));
      },
    });
  }

  // ── Organismo (alta/edición) ─────────────────────────────
  abrirNuevoOrganismo() {
    this.form = { ambito: 'Estatal', tipoOrganizacionId: null, nombre: '', nombreCompania: '', categoria: '', descripcion: '', direccion: '', ciudad: '', departamento: '', pais: '', ordenDpto: 0, observaciones: '', art44: false };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('organismo');
  }

  abrirEditarOrganismo(o: OrganismoDto) {
    this.form = {
      ambito: o.ambito,
      tipoOrganizacionId: o.tipoOrganizacionId ?? null,
      nombre: o.nombre || '',
      nombreCompania: o.nombreCompania || '',
      categoria: o.categoria || '',
      descripcion: o.descripcion || '',
      direccion: o.direccion || '',
      ciudad: o.ciudad || '',
      departamento: o.departamento || '',
      pais: o.pais || '',
      ordenDpto: o.ordenDpto ?? 0,
      observaciones: o.observaciones || '',
      art44: !!o.art44,
    };
    this.modalError.set(''); this.editId.set(o.id);
    this.modalMode.set('editar'); this.modalKind.set('organismo');
  }

  // ── Info (alta/edición) ──────────────────────────────────
  abrirNuevaInfo() {
    this.form = { tipoOrganizacionId: null, organismoId: null, direccion: '', telefono: '', email: '', observaciones: '' };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('info');
  }

  abrirEditarInfo(i: InfoOrganizacionDto) {
    this.form = {
      tipoOrganizacionId: i.tipoOrganizacionId ?? null,
      organismoId: i.organismoId ?? null,
      direccion: i.direccion || '',
      telefono: i.telefono || '',
      email: i.email || '',
      observaciones: i.observaciones || '',
    };
    this.modalError.set(''); this.editId.set(i.id);
    this.modalMode.set('editar'); this.modalKind.set('info');
  }

  cerrarModal() {
    this.modalKind.set(null); this.editId.set(null); this.modalError.set('');
  }

  guardar() {
    if (this.modalKind() === 'organismo') this.guardarOrganismo();
    else this.guardarInfo();
  }

  private num(v: any): number | null { return v == null || v === '' ? null : Number(v); }

  private guardarOrganismo() {
    if (!this.form.nombre?.trim()) { this.modalError.set('El nombre es obligatorio.'); return; }
    if (this.form.tipoOrganizacionId == null) { this.modalError.set('El tipo de organización es obligatorio.'); return; }
    const comun: OrganismoUpdateInput = {
      nombre: this.form.nombre.trim(),
      nombreCompania: this.form.nombreCompania || null,
      tipoOrganizacionId: Number(this.form.tipoOrganizacionId),
      categoria: this.form.categoria || null,
      descripcion: this.form.descripcion || null,
      direccion: this.form.direccion || null,
      ciudad: this.form.ciudad || null,
      departamento: this.form.departamento || null,
      pais: this.form.pais || null,
      art44: !!this.form.art44,
      ordenDpto: this.form.ordenDpto == null || this.form.ordenDpto === '' ? 0 : Number(this.form.ordenDpto),
      observaciones: this.form.observaciones || null,
    };
    this.modalBusy.set(true); this.modalError.set('');
    const id = this.editId();
    const req = this.modalMode() === 'editar' && id != null
      ? this.svc.updateOrganismo(id, comun)
      : this.svc.createOrganismo({ ambito: this.form.ambito as Ambito, ...comun });
    req.subscribe({
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.loadTodos(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar el organismo.')); },
    });
  }

  private guardarInfo() {
    const input: InfoOrganizacionInput = {
      tipoOrganizacionId: this.num(this.form.tipoOrganizacionId),
      organismoId: this.num(this.form.organismoId),
      direccion: this.form.direccion || null,
      telefono: this.form.telefono || null,
      email: this.form.email || null,
      observaciones: this.form.observaciones || null,
    };
    this.modalBusy.set(true); this.modalError.set('');
    const id = this.editId();
    const req = this.modalMode() === 'editar' && id != null
      ? this.svc.updateInfo(id, input)
      : this.svc.createInfo(input);
    req.subscribe({
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.loadInfo(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar la info.')); },
    });
  }

  // ── Export CSV: dataset completo filtrado/ordenado (all=true) ─
  exportarCsvTab() {
    const stamp = new Date().toISOString().slice(0, 10);
    const t = this.tab();
    if (t === 'todos') {
      const cols: CsvColumn<OrganismoDto>[] = [
        { get: 'id', label: 'ID' }, { get: 'ambito', label: 'Ámbito' }, { get: 'nombre', label: 'Nombre' },
        { get: 'descripcion', label: 'Descripción' }, { get: 'direccion', label: 'Dirección' },
        { get: 'ciudad', label: 'Ciudad' }, { get: 'departamento', label: 'Departamento' },
        { get: 'pais', label: 'País' }, { get: 'art44', label: 'Art. 44' },
        { get: 'ordenDpto', label: 'Orden Dpto.' }, { get: 'observaciones', label: 'Observaciones' }
      ];
      this.svc.getOrganismos(this.orgQuery(true)).subscribe(r => exportarCSV(r.items, cols, `organismos-${stamp}.csv`));
    } else if (t === 'info') {
      const cols: CsvColumn<InfoOrganizacionDto>[] = [
        { get: 'id', label: 'Id Info.' }, { get: 'tipoOrganizacionId', label: 'Id Tipo' },
        { get: 'organismoId', label: 'Id Organismo' }, { get: 'direccion', label: 'Dirección' },
        { get: 'telefono', label: 'Teléfono' }, { get: 'email', label: 'Email' },
        { get: 'observaciones', label: 'Observaciones' }
      ];
      this.svc.getInfo(this.infoQuery(true)).subscribe(r => exportarCSV(r.items, cols, `info-organismos-${stamp}.csv`));
    }
  }
}
