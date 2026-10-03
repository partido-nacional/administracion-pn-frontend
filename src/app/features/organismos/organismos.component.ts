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
  OrganismoDto, OrganismoInput, OrganizacionDto,
  TipoOrganizacionDto, InfoOrganizacionDto, InfoOrganizacionInput,
  IntegranteOrg,
} from '../../core/models/organismos';
import { DEPARTAMENTOS } from '../../core/departamentos';

type ModalKind = 'organismo' | 'info';
type ModalMode = 'nueva' | 'editar';
/** Clave de un desplegable de info: el id de la info, o 'sin' para los organismos sin info. */
export type InfoKey = number | 'sin';

/**
 * Pantalla Organismos (feature 033): lista de infos de organización, cada una desplegable con sus
 * organismos (misma estructura que la vieja grilla de organismos), y cada organismo desplegable con
 * sus integrantes. Buscador por nombre de organismo: reduce las infos y lo que se ve al desplegar.
 */
@Component({
  selector: 'app-organismos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalFormComponent, PaginatorComponent],
  template: `
    <div class="topbar-inline">
      <input class="search" type="search" placeholder="Buscar organismo…" aria-label="Buscar organismo por nombre"
             [ngModel]="busqueda()" (ngModelChange)="setBusqueda($event)">
      <span class="spacer"></span>
      <button class="btn btn-primary" (click)="abrirNuevaInfo()">+ Nueva Info</button>
      <button class="btn btn-primary" (click)="abrirNuevoOrganismo()">+ Nuevo Organismo</button>
      <button class="btn btn-secondary" (click)="exportarCsv()" title="Exportar CSV">📥 CSV</button>
    </div>

    <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
      <table class="table" style="min-width:1100px">
        <thead>
          <tr class="filter-row">
            <th></th><th></th><th></th>
            <th><input class="column-filter" [ngModel]="fInfDir()" (ngModelChange)="setInfoFilter(fInfDir, $event)" placeholder="Filtrar..."></th>
            <th></th>
            <th><input class="column-filter" [ngModel]="fInfMail()" (ngModelChange)="setInfoFilter(fInfMail, $event)" placeholder="Filtrar..."></th>
            <th></th><th></th><th></th>
          </tr>
          <tr>
            <th class="sortable" (click)="sortInfo('nombre')">Nombre {{ arrowInfo('nombre') }}</th>
            <th class="sortable" (click)="sortInfo('id')">Id {{ arrowInfo('id') }}</th>
            <th>Tipo</th><th>Dirección</th><th>Teléfono</th><th>Email</th><th>Observaciones</th>
            <th title="Organismos de la info (con el buscador: solo los que coinciden)">Organismos</th><th></th>
          </tr>
        </thead>
        <tbody>
          @if (mostrarSinInfo()) {
            <tr class="clickable sin-info" [class.selected]="isInfoExpanded('sin')" (click)="toggleInfo('sin')">
              <td colspan="7">{{ isInfoExpanded('sin') ? '▾' : '▸' }} <strong>Sin info de organización</strong></td>
              <td>{{ sinInfoTotal() }}</td><td></td>
            </tr>
            @if (isInfoExpanded('sin')) {
              <tr class="detalle-row"><td colspan="9"><ng-container *ngTemplateOutlet="organismosTpl; context: { $implicit: 'sin' }" /></td></tr>
            }
          }
          @for (i of info(); track i.id) {
            <tr [class.clickable]="i.cantidadOrganismos > 0" [class.selected]="isInfoExpanded(i.id)" (click)="toggleInfo(i.id, i)">
              <td>
                @if (i.cantidadOrganismos > 0) { {{ isInfoExpanded(i.id) ? '▾' : '▸' }} } @else { <span class="no-toggle">·</span> }
                <strong>{{ nombreInfo(i) }}</strong>
              </td>
              <td>{{ i.id }}</td>
              <td>{{ nombreTipo(i.tipoOrganizacionId) }}</td>
              <td>{{ i.direccion || '—' }}</td>
              <td>{{ i.telefono || '—' }}</td>
              <td>{{ i.email || '—' }}</td>
              <td>{{ i.observaciones || '—' }}</td>
              <td>{{ i.cantidadOrganismos }}</td>
              <td (click)="$event.stopPropagation()">
                <button class="btn-pencil" (click)="abrirEditarInfo(i)" title="Editar info">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                      </svg>
                </button>
              </td>
            </tr>
            @if (isInfoExpanded(i.id)) {
              <tr class="detalle-row"><td colspan="9"><ng-container *ngTemplateOutlet="organismosTpl; context: { $implicit: i.id }" /></td></tr>
            }
          } @empty {
            @if (!mostrarSinInfo()) {
              <tr><td colspan="9"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
            }
          }
        </tbody>
      </table>
      <app-paginator [total]="infoTotal()" [page]="infoPage()" [pageSize]="infoPageSize()"
                     (pageChange)="onInfoPage($event)" (pageSizeChange)="onInfoPageSize($event)" />
    </div></div>

    <!-- Organismos de una info: misma estructura que la vieja grilla "Todos los Organismos". -->
    <ng-template #organismosTpl let-key>
      <div class="detalle-wrap">
        @if (orgsLoading()[k(key)]) {
          <div class="empty-state" style="padding:24px"><div class="empty-state-text">Cargando organismos…</div></div>
        } @else if (orgsError()[k(key)]) {
          <div class="empty-state" style="padding:24px">
            <div class="empty-state-text">{{ orgsError()[k(key)] }}</div>
            <button class="btn btn-secondary" style="margin-top:10px" (click)="loadOrganismos(key)">Reintentar</button>
          </div>
        } @else if (organismosDe(key).length === 0) {
          <div class="empty-state" style="padding:24px"><div class="empty-state-text">Sin organismos</div></div>
        } @else {
          <table class="table org-table">
            <thead>
              <tr>
                <th>Id</th>
                <th title="Organización estatal y/o partidaria (un organismo puede tener ambas)">Clasificación</th>
                <th>Nombre</th><th>Descripción</th><th>Dirección</th><th>Ciudad</th><th>Departamento</th>
                <th>País</th><th>Art. 44</th><th>Orden Dpto.</th><th>Observaciones</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (o of organismosDe(key); track o.id) {
                <tr class="clickable" [class.selected]="isExpanded(o)" (click)="toggleOrg(o)">
                  <td>{{ isExpanded(o) ? '▾' : '▸' }} {{ o.id }}</td>
                  <td class="clasif">
                    @if (o.organizacionEstatalNombre) { <span class="badge amb-est" title="Organización estatal">{{ o.organizacionEstatalNombre }}</span> }
                    @if (o.organizacionPartidariaNombre) { <span class="badge amb-part" title="Organización partidaria">{{ o.organizacionPartidariaNombre }}</span> }
                    @if (!o.organizacionEstatalNombre && !o.organizacionPartidariaNombre) { — }
                  </td>
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
                                @for (m of integrantesDe(o); track m.idContacto) {
                                  <tr>
                                    <td>{{ m.credCivica }}</td>
                                    <td><strong>{{ m.apellidos }}</strong></td>
                                    <td>{{ m.nombres }}</td>
                                    <td>{{ m.celular }}</td>
                                    <td>{{ m.mail }}</td>
                                    <td>{{ m.posicion }}</td>
                                    <td><span class="badge dept">{{ m.departamento }}</span></td>
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
              }
            </tbody>
          </table>
        }
      </div>
    </ng-template>

    @if (modalKind()) {
      <app-modal-form
        [title]="tituloModal()"
        [busy]="modalBusy()"
        [error]="modalError()"
        [saveLabel]="modalMode()==='editar' ? 'Guardar cambios' : 'Crear'"
        (save)="guardar()" (cancel)="cerrarModal()">
            @if (modalKind()==='organismo') {
              <div class="nv-grid">
                <div class="fg"><label>Organización estatal</label>
                  <select [(ngModel)]="form.organizacionEstatalId" name="o-est">
                    <option [ngValue]="null">— Ninguna —</option>
                    @for (x of orgEstatales(); track x.id) { <option [ngValue]="x.id">{{ x.nombre }}</option> }
                  </select>
                </div>
                <div class="fg"><label>Organización partidaria</label>
                  <select [(ngModel)]="form.organizacionPartidariaId" name="o-par">
                    <option [ngValue]="null">— Ninguna —</option>
                    @for (x of orgPartidarias(); track x.id) { <option [ngValue]="x.id">{{ x.nombre }}</option> }
                  </select>
                </div>
                <div class="fg"><label>Tipo de Organización</label>
                  <select [(ngModel)]="form.tipoOrganizacionId" name="o-tipo">
                    <option [ngValue]="null">—</option>
                    @for (t of tipos(); track t.id) { <option [ngValue]="t.id">{{ t.nombre }}</option> }
                  </select>
                </div>
                <div class="fg full"><label>Nombre *</label><input [(ngModel)]="form.nombre" name="o-nombre"></div>
                <div class="fg"><label>Info de organización (Id)</label><input type="number" [(ngModel)]="form.infoOrganizacionId" name="o-info"></div>
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
    .topbar-inline { display:flex; align-items:center; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
    .topbar-inline .spacer { flex:1; }
    .search { min-width:260px; padding:7px 10px; border:1px solid #cfd6df; border-radius:6px; font-size:14px; }
    .badge.amb-est { background:#e6f0ff; color:#1a4f8a; }
    .badge.amb-part { background:#fdeede; color:#8a5a1a; }
    td.clasif { white-space:nowrap; }
    td.clasif .badge + .badge { margin-left:4px; }
    th.sortable { cursor:pointer; user-select:none; white-space:nowrap; }
    th.sortable:hover { color:var(--primary, #1a4f8a); }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.sin-info td { color:#5a6472; font-style:italic; }
    .no-toggle { display:inline-block; width:1em; color:#b0b8c3; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .detalle-wrap { padding:12px 16px; border-top:1px solid #d6dde6; }
    .detalle-section { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:12px 16px; }
    .detalle-section-title {
      font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase;
      letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px;
      border-bottom:1px solid #eef1f5;
    }
    .org-table { min-width:1400px; background:#fff; }
    .inner-table { min-width:720px; }
    .inner-table th { font-size:12px; }
  `]
})
export class OrganismosComponent {
  private titleSvc = inject(PageTitleService);
  private svc = inject(OrganismosService);

  tipos = signal<TipoOrganizacionDto[]>([]);
  orgEstatales = signal<OrganizacionDto[]>([]);
  orgPartidarias = signal<OrganizacionDto[]>([]);

  // Lista canónica + 'Nacional' para organismos de alcance nacional (feature 030, EC-5).
  departamentos = [...DEPARTAMENTOS, 'Nacional'];

  // Tamaño de página "grande" para la sublista de integrantes (sin paginador propio).
  private static readonly INLINE_PAGE_SIZE = 100;

  // ── Buscador por nombre de organismo ─────────────────────
  busqueda = signal('');

  // ── Grilla de infos ──────────────────────────────────────
  info = signal<InfoOrganizacionDto[]>([]);
  infoTotal = signal(0);
  infoPage = signal(1);
  infoPageSize = signal(DEFAULT_PAGE_SIZE);
  infoSort = signal<string | undefined>(undefined);
  infoOrder = signal<SortOrder>('asc');
  fInfDir = signal(''); fInfMail = signal('');

  // Fila especial "Sin info de organización" (solo en la página 1 y si hay organismos que coinciden).
  sinInfoTotal = signal(0);
  mostrarSinInfo = computed(() => this.sinInfoTotal() > 0 && this.infoPage() === 1);

  // ── Nivel 1: organismos por info (acordeón + caché por clave) ─
  expandedInfo = signal<InfoKey | null>(null);
  organismosPorInfo = signal<Record<string, OrganismoDto[]>>({});
  orgsLoading = signal<Record<string, boolean>>({});
  orgsError = signal<Record<string, string>>({});

  // ── Nivel 2: integrantes por organismo (acordeón + caché por id) ─
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
    this.svc.getOrganizacionesEstatales().subscribe(x => this.orgEstatales.set(x));
    this.svc.getOrganizacionesPartidarias().subscribe(x => this.orgPartidarias.set(x));
    this.recargar();
  }

  // ── Utilidades ───────────────────────────────────────────
  private debounced(key: string, fn: () => void, ms = 300) {
    clearTimeout(this.timers[key]);
    this.timers[key] = setTimeout(fn, ms);
  }

  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.errorCode || err?.message || fallback;
  }

  private clean(v: string): string | undefined { return v.trim() === '' ? undefined : v; }

  /** Clave string de un desplegable de info (para indexar las cachés). */
  k(key: InfoKey): string { return String(key); }

  /** BR-1: nombre derivado por el backend; sin organismos → "Info #id". */
  nombreInfo(i: InfoOrganizacionDto): string { return i.nombre?.trim() ? i.nombre : `Info #${i.id}`; }

  nombreTipo(id?: number | null): string {
    if (id == null) return '—';
    return this.tipos().find(t => t.id === id)?.nombre ?? String(id);
  }

  // ── Lista de infos ───────────────────────────────────────
  private infoQuery(all = false): GridQuery {
    return {
      page: this.infoPage(), pageSize: this.infoPageSize(),
      sort: this.infoSort(), order: this.infoOrder(),
      filters: {
        direccion: this.clean(this.fInfDir()), email: this.clean(this.fInfMail()),
        nombreOrganismo: this.clean(this.busqueda()),
      },
      all,
    };
  }

  private loadInfo() {
    this.svc.getInfo(this.infoQuery()).subscribe(r => {
      this.info.set(r.items); this.infoTotal.set(r.total);
      this.infoPage.set(r.page); this.infoPageSize.set(r.pageSize);
    });
  }

  /** Total de organismos sin info que pasan el buscador (decide si se muestra la fila especial). */
  private loadSinInfo() {
    this.svc.getOrganismos({ page: 1, pageSize: 1, filters: { sinInfo: true, nombre: this.clean(this.busqueda()) } })
      .subscribe(r => this.sinInfoTotal.set(r.total));
  }

  /** Recarga la lista y descarta los desplegables (sus datos pueden haber cambiado). */
  private recargar() {
    this.expandedInfo.set(null);
    this.expandedOrgId.set(null);
    this.organismosPorInfo.set({});
    this.loadInfo();
    this.loadSinInfo();
  }

  /** AC-11: el buscador vuelve a la página 1 y colapsa todo. */
  setBusqueda(value: string) {
    this.busqueda.set(value); this.infoPage.set(1);
    this.debounced('busqueda', () => this.recargar());
  }

  setInfoFilter(sig: WritableSignal<string>, value: string) {
    sig.set(value); this.infoPage.set(1);
    this.debounced('info', () => { this.expandedInfo.set(null); this.loadInfo(); });
  }
  onInfoPage(p: number) { this.infoPage.set(p); this.expandedInfo.set(null); this.loadInfo(); }
  onInfoPageSize(s: number) { this.infoPageSize.set(s); this.infoPage.set(1); this.expandedInfo.set(null); this.loadInfo(); }
  sortInfo(field: string) { toggleSort(this.infoSort, this.infoOrder, field); this.infoPage.set(1); this.expandedInfo.set(null); this.loadInfo(); }
  arrowInfo(field: string) { return sortArrow(this.infoSort(), this.infoOrder(), field); }

  // ── Nivel 1: organismos de una info ──────────────────────
  isInfoExpanded(key: InfoKey): boolean { return this.expandedInfo() === key; }
  organismosDe(key: InfoKey): OrganismoDto[] { return this.organismosPorInfo()[this.k(key)] ?? []; }

  /** AC-3: una info sin organismos no se despliega. */
  toggleInfo(key: InfoKey, info?: InfoOrganizacionDto) {
    if (info && info.cantidadOrganismos === 0) return;
    if (this.expandedInfo() === key) { this.expandedInfo.set(null); return; }
    this.expandedInfo.set(key);
    this.expandedOrgId.set(null);
    if (!(this.k(key) in this.organismosPorInfo())) this.loadOrganismos(key);
  }

  /** AC-4/AC-9: todos los organismos de la info (sin paginar), filtrados por el buscador. */
  loadOrganismos(key: InfoKey) {
    const ck = this.k(key);
    this.orgsLoading.update(mp => ({ ...mp, [ck]: true }));
    this.orgsError.update(mp => { const { [ck]: _drop, ...rest } = mp; return rest; });
    const filters = key === 'sin'
      ? { sinInfo: true, nombre: this.clean(this.busqueda()) }
      : { infoOrganizacionId: key, nombre: this.clean(this.busqueda()) };
    this.svc.getOrganismos({ page: 1, pageSize: DEFAULT_PAGE_SIZE, all: true, filters }).subscribe({
      next: (r) => {
        this.organismosPorInfo.update(mp => ({ ...mp, [ck]: r.items }));
        this.orgsLoading.update(mp => ({ ...mp, [ck]: false }));
      },
      error: (err) => {
        this.orgsLoading.update(mp => ({ ...mp, [ck]: false }));
        this.orgsError.update(mp => ({ ...mp, [ck]: this.extractError(err, 'No se pudieron cargar los organismos.') }));
      },
    });
  }

  // ── Nivel 2: integrantes de un organismo (caché por id) ──
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
    this.form = { tipoOrganizacionId: null, organizacionEstatalId: null, organizacionPartidariaId: null, infoOrganizacionId: null, nombre: '', nombreCompania: '', categoria: '', descripcion: '', direccion: '', ciudad: '', departamento: '', pais: '', ordenDpto: 0, observaciones: '', art44: false };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('organismo');
  }

  abrirEditarOrganismo(o: OrganismoDto) {
    this.form = {
      tipoOrganizacionId: o.tipoOrganizacionId ?? null,
      organizacionEstatalId: o.organizacionEstatalId ?? null,
      organizacionPartidariaId: o.organizacionPartidariaId ?? null,
      infoOrganizacionId: o.infoOrganizacionId ?? null,
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
    this.form = { tipoOrganizacionId: null, direccion: '', telefono: '', email: '', observaciones: '' };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('info');
  }

  abrirEditarInfo(i: InfoOrganizacionDto) {
    this.form = {
      tipoOrganizacionId: i.tipoOrganizacionId ?? null,
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
    // Mismo payload para alta y edición (backend 035): sin ámbito; clasificaciones, tipo e info opcionales.
    const input: OrganismoInput = {
      nombre: this.form.nombre.trim(),
      nombreCompania: this.form.nombreCompania || null,
      tipoOrganizacionId: this.num(this.form.tipoOrganizacionId),
      organizacionEstatalId: this.num(this.form.organizacionEstatalId),
      organizacionPartidariaId: this.num(this.form.organizacionPartidariaId),
      infoOrganizacionId: this.num(this.form.infoOrganizacionId),
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
      ? this.svc.updateOrganismo(id, input)
      : this.svc.createOrganismo(input);
    req.subscribe({
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.recargar(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar el organismo.')); },
    });
  }

  private guardarInfo() {
    const input: InfoOrganizacionInput = {
      tipoOrganizacionId: this.num(this.form.tipoOrganizacionId),
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
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.recargar(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar la info.')); },
    });
  }

  // ── Export CSV: infos completas con el buscador aplicado (all=true) ─
  exportarCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    const cols: CsvColumn<InfoOrganizacionDto>[] = [
      { get: (i) => this.nombreInfo(i), label: 'Nombre' }, { get: 'id', label: 'Id Info.' },
      { get: (i) => this.nombreTipo(i.tipoOrganizacionId), label: 'Tipo' },
      { get: 'direccion', label: 'Dirección' }, { get: 'telefono', label: 'Teléfono' },
      { get: 'email', label: 'Email' }, { get: 'observaciones', label: 'Observaciones' },
      { get: 'cantidadOrganismos', label: 'Organismos' },
    ];
    this.svc.getInfo(this.infoQuery(true)).subscribe(r => exportarCSV(r.items, cols, `organismos-por-info-${stamp}.csv`));
  }
}
