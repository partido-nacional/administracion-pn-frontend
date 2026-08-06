import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { AdhesionesService, AdhesionWebDto, AdhesionLocalDto, AnualPorVencerDto } from './adhesiones.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { GridQuery, SortOrder, DEFAULT_PAGE_SIZE } from '../../core/models/paged';
import { ToastService } from '../../core/services/toast.service';
import { waLink, mensajeVencimiento } from './wa-link';

interface StatsDto { locales: number; web: number; total: number; }

type Tab = 'web' | 'locales' | 'nuevo' | 'anuales';

@Component({
  selector: 'app-adhesiones',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorComponent],
  template: `
    <div class="topbar-inline">
      <a class="btn btn-primary" (click)="tab.set('nuevo')">+ Nuevo Adherente</a>
    </div>

    <div class="tabs">
      <a class="tab" [class.active]="tab()==='web'"     (click)="tab.set('web')">Adhesiones Pendientes en Web</a>
      <a class="tab" [class.active]="tab()==='locales'" (click)="tab.set('locales')">Adhesiones Locales</a>
      <a class="tab" [class.active]="tab()==='anuales'" (click)="tab.set('anuales'); reloadAnuales()">Anuales por vencer</a>
    </div>

    @if (tab() === 'web') {
      <div style="margin-top:16px; display:flex; justify-content:flex-end; align-items:center; gap:12px">
        @if (syncMensaje()) {
          <span class="sync-msg" [class.error]="syncError()">{{ syncMensaje() }}</span>
        }
        <button class="btn btn-secondary" (click)="sincronizarNube()" [disabled]="sincronizando()">
          {{ sincronizando() ? 'Sincronizando…' : 'Sincronizar Nube' }}
        </button>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table" style="min-width:1400px">
            <thead>
              <tr>
                <th style="width:45px">ID</th>
                <th class="sortable" (click)="sortWeb('nombre')">Nombre {{ arrowWeb('nombre') }}</th>
                <th class="sortable" (click)="sortWeb('apellido')">Apellidos {{ arrowWeb('apellido') }}</th>
                <th>Cedula</th>
                <th>Cred. Civica</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Celular</th>
                <th class="sortable" (click)="sortWeb('departamento')">Departamento {{ arrowWeb('departamento') }}</th>
                <th>Fecha Nac.</th>
                <th class="sortable" (click)="sortWeb('fecha')">Fecha en Sist. {{ arrowWeb('fecha') }}</th>
                <th>Sist. Contrib.</th>
                <th>Importe</th>
                <th>Observaciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (a of web(); track a.id) {
                <tr>
                  <td>{{ a.id }}</td>
                  <td><strong>{{ a.nombre }}</strong></td>
                  <td><strong>{{ a.apellido }}</strong></td>
                  <td>{{ a.cedula || '—' }}</td>
                  <td>{{ a.credCivica || '—' }}</td>
                  <td>{{ a.email || '—' }}</td>
                  <td>{{ a.telefono || '—' }}</td>
                  <td>{{ a.celular || '—' }}</td>
                  <td>
                    @if (a.departamento) {
                      <span class="badge dept">{{ a.departamento }}</span>
                    } @else { — }
                  </td>
                  <td>{{ a.fechaNacimiento || '—' }}</td>
                  <td>{{ a.fechaSistema || '—' }}</td>
                  <td>
                    @if (a.sistContrib) {
                      <span class="badge" [class]="badgeClass(a.sistContrib)">{{ a.sistContrib }}</span>
                    } @else { — }
                  </td>
                  <td>{{ a.importe != null ? ('$' + a.importe) : '—' }}</td>
                  <td>{{ a.observaciones || '' }}</td>
                  <td>
                    <div class="action-group">
                      <button type="button" class="btn btn-sm btn-primary" (click)="pasar(a.id)">Pasar a Local</button>
                      <button type="button" class="btn btn-sm btn-danger" (click)="eliminarWeb(a.id)">Eliminar</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="15"><div class="empty-state"><div class="empty-state-text">
                  {{ loadingWeb() ? 'Cargando…' : 'No hay adhesiones pendientes' }}
                </div></div></td></tr>
              }
            </tbody>
          </table>
          <app-paginator
            [total]="webTotal()" [page]="webPage()" [pageSize]="webPageSize()"
            (pageChange)="onWebPage($event)" (pageSizeChange)="onWebPageSize($event)" />
        </div>
      </div>
    }

    @if (tab() === 'locales') {
      <div class="stats-grid" style="margin-top:16px">
        <div class="stat-card">
          <div class="stat-value">{{ stats().locales }}</div>
          <div class="stat-label">Adhesiones Locales</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().web }}</div>
          <div class="stat-label">Adhesiones Web</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().total }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table" style="min-width:1560px">
            <thead>
              <tr>
                <th style="width:45px">ID</th>
                <th style="width:65px">ID Contacto</th>
                <th class="sortable" (click)="sortLocales('nombre')">Nombre {{ arrowLocales('nombre') }}</th>
                <th class="sortable" (click)="sortLocales('apellido')">Apellidos {{ arrowLocales('apellido') }}</th>
                <th>Cedula</th>
                <th class="sortable" (click)="sortLocales('sector')">Sector {{ arrowLocales('sector') }}</th>
                <th>Sist. Contrib.</th>
                <th>Aporte</th>
                <th class="sortable" (click)="sortLocales('fecha')">Fecha Alta {{ arrowLocales('fecha') }}</th>
                <th>Fecha Salida</th>
                <th style="text-align:center">Aporte Conf.</th>
                <th style="text-align:center">Art. 46</th>
                <th>Titular Resp.</th>
                <th>Observaciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (l of locales(); track l.id) {
                <tr>
                  <td>{{ l.id }}</td>
                  <td>{{ l.idContacto }}</td>
                  <td><strong>{{ l.nombre }}</strong></td>
                  <td><strong>{{ l.apellido }}</strong></td>
                  <td>{{ l.cedula || '—' }}</td>
                  <td>
                    @if (l.sector) {
                      <span class="badge">{{ l.sector }}</span>
                    } @else { — }
                  </td>
                  <td>
                    @if (l.sistContrib) {
                      <span class="badge" [class]="badgeClass(l.sistContrib)">{{ l.sistContrib }}</span>
                    } @else { — }
                  </td>
                  <td>{{ l.aporte != null ? ('$' + l.aporte) : '—' }}</td>
                  <td>{{ l.fechaAlta || '—' }}</td>
                  <td>{{ l.fechaSalida || '—' }}</td>
                  <td style="text-align:center"><input type="checkbox" [checked]="l.aporteConfirmado" disabled></td>
                  <td style="text-align:center"><input type="checkbox" [checked]="l.art46" disabled></td>
                  <td>{{ l.titularResp || '—' }}</td>
                  <td>{{ l.observaciones || '' }}</td>
                  <td>
                    <div class="action-group">
                      <button type="button" class="btn btn-sm btn-danger" (click)="eliminarLocal(l.id)">Eliminar</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="15"><div class="empty-state"><div class="empty-state-text">
                  {{ loadingLocales() ? 'Cargando…' : 'Sin adhesiones locales' }}
                </div></div></td></tr>
              }
            </tbody>
          </table>
          <app-paginator
            [total]="localesTotal()" [page]="localesPage()" [pageSize]="localesPageSize()"
            (pageChange)="onLocalesPage($event)" (pageSizeChange)="onLocalesPageSize($event)" />
        </div>
      </div>
    }

    @if (tab() === 'anuales') {
      <div style="margin-top:16px; display:flex; align-items:baseline; gap:10px">
        <h3 style="margin:0">Anuales por vencer este mes</h3>
        <span style="color:#666; font-size:14px">({{ anuales().length }})</span>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table">
            <thead>
              <tr>
                <th style="width:65px">ID Contacto</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Celular</th>
                <th>Sistema</th>
                <th>Vencimiento</th>
                <th style="text-align:right"></th>
              </tr>
            </thead>
            <tbody>
              @for (a of anuales(); track a.contactoId) {
                <tr>
                  <td>{{ a.contactoId }}</td>
                  <td><strong>{{ a.nombre }}</strong></td>
                  <td><strong>{{ a.apellido }}</strong></td>
                  <td>{{ a.celular || '—' }}</td>
                  <td><span class="badge">{{ a.sistContrib || 'ANUAL' }}</span></td>
                  <td>{{ a.vencimiento }}</td>
                  <td style="text-align:right">
                    @if (waParaFila(a); as link) {
                      <a class="btn btn-sm btn-wpp" [href]="link" target="_blank" rel="noopener" title="Avisar por WhatsApp">
                        WhatsApp
                      </a>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7"><div class="empty-state"><div class="empty-state-text">
                  {{ loadingAnuales() ? 'Cargando…' : 'Sin anuales por vencer este mes' }}
                </div></div></td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    @if (tab() === 'nuevo') {
      <div class="card" style="margin-top:16px">
        <div class="card-body">
          <h3 style="margin-top:0">Nuevo Adherente</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Contacto (ID)</label>
              <input type="number" [(ngModel)]="form.contactoId">
            </div>
            <div class="form-group">
              <label>Sector</label>
              <select [(ngModel)]="form.sector">
                <option value="">— Seleccionar —</option>
                <option>Aire Fresco</option>
                <option>Alianza Pais</option>
                <option>Herrerismo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Sist. Contrib.</label>
              <select [(ngModel)]="form.sistContrib">
                <option value="">— Seleccionar —</option>
                <option>VISA</option>
                <option>MASTER</option>
                <option>OCA</option>
                <option>eBROU</option>
                <option>ANTEL</option>
                <option>Efectivo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Aporte</label>
              <input type="number" [(ngModel)]="form.aporte">
            </div>
            <div class="form-group">
              <label>Titular Responsable</label>
              <input type="text" [(ngModel)]="form.titularResponsable">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label>Observaciones</label>
              <textarea [(ngModel)]="form.observaciones" rows="3"></textarea>
            </div>
          </div>
          <div style="margin-top:16px; display:flex; gap:8px">
            <button class="btn btn-primary" (click)="crearLocal()">Guardar</button>
            <button class="btn btn-secondary" (click)="tab.set('locales')">Cancelar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* El .action-group global usa gap:12px, pensado para los links de texto que esta
       pantalla tenia antes. Entre botones queda holgado. Se ajusta acá y no en styles.css
       porque esa clase sigue en uso con links en débitos, convencionales y productos.
       nowrap evita que los dos botones de la fila Web se apilen: la grilla tiene 15
       columnas y la de acciones es la última. */
    .action-group { gap:6px; flex-wrap:nowrap; }
    .action-group .btn { white-space:nowrap; }

    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
    .sync-msg { font-size:13px; color:#2e7d32; }
    .sync-msg.error { color:#c62828; }
    .form-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
    .form-group { display:flex; flex-direction:column; gap:4px; }
    .form-group label { font-size:12px; color:#666; font-weight:600; }
    .form-group input, .form-group select, .form-group textarea {
      padding:8px 10px; border:1px solid #ddd; border-radius:4px; font-size:14px;
    }
    th.sortable { cursor:pointer; user-select:none; }
    .btn-wpp {
      background:#25d366; color:#fff; border:none; text-decoration:none;
      padding:5px 12px; border-radius:5px; font-weight:600; white-space:nowrap;
    }
    .btn-wpp:hover { background:#1da851; }
  `]
})
export class AdhesionesListadoComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  private adhesionesSvc = inject(AdhesionesService);
  private toast = inject(ToastService);

  tab = signal<Tab>('locales');
  web = signal<AdhesionWebDto[]>([]);
  locales = signal<AdhesionLocalDto[]>([]);
  anuales = signal<AnualPorVencerDto[]>([]);
  loadingAnuales = signal(false);
  stats = signal<StatsDto>({ locales: 0, web: 0, total: 0 });

  sincronizando = signal(false);
  syncMensaje = signal('');
  syncError = signal(false);

  // Paginación web
  webTotal = signal(0);
  webPage = signal(1);
  webPageSize = signal(DEFAULT_PAGE_SIZE);
  webSort = signal<string | undefined>(undefined);
  webOrder = signal<SortOrder>('asc');
  loadingWeb = signal(false);

  // Paginación locales
  localesTotal = signal(0);
  localesPage = signal(1);
  localesPageSize = signal(DEFAULT_PAGE_SIZE);
  localesSort = signal<string | undefined>(undefined);
  localesOrder = signal<SortOrder>('asc');
  loadingLocales = signal(false);

  form: any = {
    contactoId: null, sector: '', sistContrib: '', aporte: null,
    titularResponsable: '', observaciones: ''
  };

  constructor() {
    this.titleSvc.set('Adhesiones');
    this.reloadWeb();
    this.reloadLocales();
    this.reloadStats();
  }

  badgeClass(s: string): string {
    const k = (s || '').toLowerCase();
    if (k === 'visa') return 'visa';
    if (k === 'master') return 'master';
    if (k === 'oca') return 'oca';
    if (k === 'ebrou') return 'ebrou';
    if (k === 'antel') return 'antel';
    return 'dept';
  }

  private webQuery(): GridQuery {
    return { page: this.webPage(), pageSize: this.webPageSize(), sort: this.webSort(), order: this.webOrder() };
  }
  private localesQuery(): GridQuery {
    return { page: this.localesPage(), pageSize: this.localesPageSize(), sort: this.localesSort(), order: this.localesOrder() };
  }

  reloadWeb() {
    this.loadingWeb.set(true);
    this.adhesionesSvc.web(this.webQuery()).subscribe({
      next: r => { this.web.set(r.items); this.webTotal.set(r.total); this.loadingWeb.set(false); },
      error: () => this.loadingWeb.set(false),
    });
  }
  reloadLocales() {
    this.loadingLocales.set(true);
    this.adhesionesSvc.locales(this.localesQuery()).subscribe({
      next: r => { this.locales.set(r.items); this.localesTotal.set(r.total); this.loadingLocales.set(false); },
      error: () => this.loadingLocales.set(false),
    });
  }
  reloadStats() { this.http.get<StatsDto>(`${environment.apiUrl}/adhesiones/stats`).subscribe(x => this.stats.set(x)); }

  reloadAnuales() {
    this.loadingAnuales.set(true);
    this.adhesionesSvc.anualesPorVencer().subscribe({
      next: r => { this.anuales.set(r); this.loadingAnuales.set(false); },
      error: () => this.loadingAnuales.set(false),
    });
  }

  /** Deep link de WhatsApp para la fila, o null si el contacto no tiene celular válido. */
  waParaFila(a: AnualPorVencerDto): string | null {
    return waLink(a.celular, mensajeVencimiento(a.nombre, a.vencimiento));
  }

  onWebPage(p: number) { this.webPage.set(p); this.reloadWeb(); }
  onWebPageSize(s: number) { this.webPageSize.set(s); this.webPage.set(1); this.reloadWeb(); }
  sortWeb(field: string) {
    if (this.webSort() === field) this.webOrder.set(this.webOrder() === 'asc' ? 'desc' : 'asc');
    else { this.webSort.set(field); this.webOrder.set('asc'); }
    this.webPage.set(1);
    this.reloadWeb();
  }
  arrowWeb(field: string) { return this.webSort() !== field ? '' : (this.webOrder() === 'asc' ? '▲' : '▼'); }

  onLocalesPage(p: number) { this.localesPage.set(p); this.reloadLocales(); }
  onLocalesPageSize(s: number) { this.localesPageSize.set(s); this.localesPage.set(1); this.reloadLocales(); }
  sortLocales(field: string) {
    if (this.localesSort() === field) this.localesOrder.set(this.localesOrder() === 'asc' ? 'desc' : 'asc');
    else { this.localesSort.set(field); this.localesOrder.set('asc'); }
    this.localesPage.set(1);
    this.reloadLocales();
  }
  arrowLocales(field: string) { return this.localesSort() !== field ? '' : (this.localesOrder() === 'asc' ? '▲' : '▼'); }

  sincronizarNube() {
    if (this.sincronizando()) return;
    this.sincronizando.set(true);
    this.syncMensaje.set('');
    this.syncError.set(false);
    this.adhesionesSvc.sincronizarWeb()
      .pipe(finalize(() => this.sincronizando.set(false)))
      .subscribe({
        next: r => {
          this.syncError.set(false);
          this.syncMensaje.set(`${r.nuevas} nuevas, ${r.duplicadasIgnoradas} ya existían`);
          this.webPage.set(1);
          this.reloadWeb();
          this.reloadStats();
        },
        error: () => {
          this.syncError.set(true);
          this.syncMensaje.set('No se pudo sincronizar. Intentá de nuevo.');
        }
      });
  }

  pasar(id: number) {
    // El error lo muestra el toast global (interceptor); acá solo el éxito y recargar.
    this.http.post(`${environment.apiUrl}/adhesiones/web/${id}/pasar-a-local`, {}).subscribe({
      next: () => {
        this.reloadWeb(); this.reloadLocales(); this.reloadStats();
        this.toast.success('Adhesión pasada a local.');
      },
      error: () => this.reloadWeb()
    });
  }

  eliminarWeb(id: number) {
    if (!confirm('Eliminar esta adhesion web?')) return;
    this.http.delete(`${environment.apiUrl}/adhesiones/web/${id}`).subscribe(() => {
      this.reloadWeb(); this.reloadStats();
      this.toast.success('Adhesión web eliminada.');
    });
  }

  eliminarLocal(id: number) {
    if (!confirm('Eliminar esta adhesion local?')) return;
    this.http.delete(`${environment.apiUrl}/adhesiones/locales/${id}`).subscribe(() => {
      this.reloadLocales(); this.reloadStats();
      this.toast.success('Adhesión local eliminada.');
    });
  }

  crearLocal() {
    if (!this.form.contactoId) { this.toast.error('Falta el ID de contacto.'); return; }
    this.http.post(`${environment.apiUrl}/adhesiones/locales`, {
      ...this.form
    }).subscribe(() => {
      this.form = { contactoId: null, sector: '', sistContrib: '', aporte: null, titularResponsable: '', observaciones: '' };
      this.tab.set('locales');
      this.reloadLocales(); this.reloadStats();
      this.toast.success('Adhesión local creada.');
    });
  }
}
