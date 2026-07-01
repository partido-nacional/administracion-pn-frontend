import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { AdhesionesService } from './adhesiones.service';
import { finalize } from 'rxjs';

interface AdhesionWebDto {
  id: number; nombre: string; apellido: string; cedula?: string; credCivica?: string;
  email?: string; telefono?: string; celular?: string; departamento?: string;
  fechaNacimiento?: string; fechaSistema?: string; sistContrib?: string;
  importe?: number; observaciones?: string; estado: string;
}
interface AdhesionLocalDto {
  id: number; idContacto: number; nombre: string; apellido: string; cedula?: string;
  sector?: string; sistContrib?: string; aporte?: number;
  fechaAlta?: string; fechaSalida?: string;
  aporteConfirmado: boolean | null; art46: boolean;
  titularResp?: string; observaciones?: string;
}
interface StatsDto { locales: number; web: number; total: number; duplicados: number; }

type Tab = 'web' | 'locales' | 'nuevo';

@Component({
  selector: 'app-adhesiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topbar-inline">
      <a class="btn btn-primary" (click)="tab.set('nuevo')">+ Nuevo Adherente</a>
    </div>

    <div class="tabs">
      <a class="tab" [class.active]="tab()==='web'"     (click)="tab.set('web')">Adhesiones Pendientes en Web</a>
      <a class="tab" [class.active]="tab()==='locales'" (click)="tab.set('locales')">Adhesiones Locales</a>
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
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Cedula</th>
                <th>Cred. Civica</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Celular</th>
                <th>Departamento</th>
                <th>Fecha Nac.</th>
                <th>Fecha en Sist.</th>
                <th>Sist. Contrib.</th>
                <th>Importe</th>
                <th>Observaciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (a of pagedWeb(); track a.id) {
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
                      <a class="action-link">Detalle</a>
                      <a class="action-link" (click)="pasar(a.id)">Pasar a Local</a>
                      <a class="action-link" (click)="eliminarWeb(a.id)">Eliminar</a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="15"><div class="empty-state"><div class="empty-state-text">No hay adhesiones pendientes</div></div></td></tr>
              }
            </tbody>
          </table>
          <div class="pagination" style="padding:16px 24px">
            <span class="pagination-info">Mostrando {{ webRangeStart() }}–{{ webRangeEnd() }} de {{ web().length }} adhesiones pendientes en web</span>
            <div class="pagination-buttons">
              <button class="page-btn" [disabled]="webPage() === 1" (click)="webPage.set(webPage() - 1)">&lt;</button>
              @for (p of webPageNumbers(); track p) {
                <button class="page-btn" [class.active]="webPage() === p" (click)="webPage.set(p)">{{ p }}</button>
              }
              <button class="page-btn" [disabled]="webPage() === webTotalPages()" (click)="webPage.set(webPage() + 1)">&gt;</button>
            </div>
          </div>
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
        <div class="stat-card">
          <div class="stat-value">{{ stats().duplicados }}</div>
          <div class="stat-label">Posibles Duplicados</div>
          <div class="stat-trend down">Requiere revision</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table" style="min-width:1560px">
            <thead>
              <tr>
                <th style="width:45px">ID</th>
                <th style="width:65px">ID Contacto</th>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Cedula</th>
                <th>Sector</th>
                <th>Sist. Contrib.</th>
                <th>Aporte</th>
                <th>Fecha Alta</th>
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
                      <a class="action-link" (click)="eliminarLocal(l.id)">Eliminar</a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="15"><div class="empty-state"><div class="empty-state-text">Sin adhesiones locales</div></div></td></tr>
              }
            </tbody>
          </table>
          <div class="pagination" style="padding:16px 24px">
            <span class="pagination-info">Mostrando 1–{{ locales().length }} de {{ locales().length }} adhesiones locales</span>
            <div class="pagination-buttons">
              <button class="page-btn">&lt;</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">&gt;</button>
            </div>
          </div>
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
    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
    .sync-msg { font-size:13px; color:#2e7d32; }
    .sync-msg.error { color:#c62828; }
    .form-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
    .form-group { display:flex; flex-direction:column; gap:4px; }
    .form-group label { font-size:12px; color:#666; font-weight:600; }
    .form-group input, .form-group select, .form-group textarea {
      padding:8px 10px; border:1px solid #ddd; border-radius:4px; font-size:14px;
    }
  `]
})
export class AdhesionesListadoComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  private adhesionesSvc = inject(AdhesionesService);

  tab = signal<Tab>('locales');
  web = signal<AdhesionWebDto[]>([]);
  locales = signal<AdhesionLocalDto[]>([]);
  stats = signal<StatsDto>({ locales: 0, web: 0, total: 0, duplicados: 0 });

  sincronizando = signal(false);
  syncMensaje = signal('');
  syncError = signal(false);

  webPageSize = 10;
  webPage = signal(1);
  webTotalPages = computed(() => Math.max(1, Math.ceil(this.web().length / this.webPageSize)));
  webPageNumbers = computed(() => Array.from({ length: this.webTotalPages() }, (_, i) => i + 1));
  pagedWeb = computed(() => {
    const start = (this.webPage() - 1) * this.webPageSize;
    return this.web().slice(start, start + this.webPageSize);
  });
  webRangeStart = computed(() => this.web().length === 0 ? 0 : (this.webPage() - 1) * this.webPageSize + 1);
  webRangeEnd = computed(() => Math.min(this.webPage() * this.webPageSize, this.web().length));

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
          this.reloadWeb();
          this.reloadStats();
        },
        error: () => {
          this.syncError.set(true);
          this.syncMensaje.set('No se pudo sincronizar. Intentá de nuevo.');
        }
      });
  }

  reloadWeb()    { this.http.get<AdhesionWebDto[]>(`${environment.apiUrl}/adhesiones/web`).subscribe(x => { this.web.set(x); this.webPage.set(1); }); }
  reloadLocales(){ this.http.get<AdhesionLocalDto[]>(`${environment.apiUrl}/adhesiones/locales`).subscribe(x => this.locales.set(x)); }
  reloadStats()  { this.http.get<StatsDto>(`${environment.apiUrl}/adhesiones/stats`).subscribe(x => this.stats.set(x)); }

  pasar(id: number) {
    this.http.post(`${environment.apiUrl}/adhesiones/web/${id}/pasar-a-local`, {}).subscribe(() => {
      this.reloadWeb(); this.reloadLocales(); this.reloadStats();
    });
  }

  eliminarWeb(id: number) {
    if (!confirm('Eliminar esta adhesion web?')) return;
    this.http.delete(`${environment.apiUrl}/adhesiones/web/${id}`).subscribe(() => {
      this.reloadWeb(); this.reloadStats();
    });
  }

  eliminarLocal(id: number) {
    if (!confirm('Eliminar esta adhesion local?')) return;
    this.http.delete(`${environment.apiUrl}/adhesiones/locales/${id}`).subscribe(() => {
      this.reloadLocales(); this.reloadStats();
    });
  }

  crearLocal() {
    if (!this.form.contactoId) { alert('Falta el ID de contacto'); return; }
    this.http.post(`${environment.apiUrl}/adhesiones/locales`, {
      ...this.form
    }).subscribe(() => {
      this.form = { contactoId: null, sector: '', sistContrib: '', aporte: null, titularResponsable: '', observaciones: '' };
      this.tab.set('locales');
      this.reloadLocales(); this.reloadStats();
    });
  }
}
