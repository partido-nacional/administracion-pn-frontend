import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { ConvencionalesService } from '../../core/services/convencionales.service';
import { ModalFormComponent } from '../../shared/components/modal-form/modal-form.component';
import {
  ConvencionalDto, ConvencionalStats,
  ListaDto, ListaInput, ListaTipo,
} from '../../core/models/convencionales';

/** Display-only de la tab Departamentales: shape heredado. */
interface ConvDisplay { id: number; nombre: string; lista: string; codigoLrf: string; departamento: string; cargoLista: string; contacto: string; }

type Tab = 'nacionales' | 'departamentales' | 'odn';
type ModalKind = 'lista'; // Convencionales es solo lectura (feature 019); el modal solo edita Listas ODN.
type ModalMode = 'nueva' | 'editar';

@Component({
  selector: 'app-convencionales',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalFormComponent],
  template: `
    <div class="tabs">
      <a class="tab" [class.active]="tab()==='nacionales'"      (click)="setTab('nacionales')">Nacionales</a>
      <a class="tab" [class.active]="tab()==='departamentales'" (click)="setTab('departamentales')">Departamentales</a>
      <a class="tab" [class.active]="tab()==='odn'"             (click)="setTab('odn')">Listas ODN</a>
    </div>

    @if (tab()==='nacionales') {
      <div class="stats-grid" style="margin-top:20px">
        <div class="stat-card"><div class="stat-value">{{ stats().nacionales }}</div><div class="stat-label">Conv. Nacionales</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats().departamentales }}</div><div class="stat-label">Conv. Departamentales</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats().listasOdn }}</div><div class="stat-label">Listas ODN</div></div>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input class="search-input" placeholder="Buscar por organismo, posición, departamento…" [(ngModel)]="q">
          </div>
        </div>
      </div>

      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>ID</th><th>Contacto</th><th>Departamento</th><th>Condición</th><th>Adherente</th><th>Organismo</th><th>Posición</th><th>Fecha Inicio</th><th>Fecha Fin</th></tr>
          </thead>
          <tbody>
            @for (c of filtrarNacionales(); track c.id) {
              <tr>
                <td>{{ c.id }}</td>
                <td>#{{ c.contactoId }}</td>
                <td><span class="badge dept">{{ c.departamento || '—' }}</span></td>
                <td>{{ c.condicion || '—' }}</td>
                <td>{{ c.adherente ? '☑' : '☐' }}</td>
                <td>{{ c.nombreOrganismo || '—' }}</td>
                <td>{{ c.posicion || '—' }}</td>
                <td>{{ fmtFecha(c.fechaInicio) }}</td>
                <td>{{ fmtFecha(c.fechaFin) }}</td>
              </tr>
            } @empty {
              <tr><td colspan="9"><div class="empty-state"><div class="empty-state-text">Sin convencionales nacionales</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='departamentales') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Lista ODD</th><th>Código LRF</th><th>Departamento</th><th>Cargo</th><th>Contacto</th></tr>
          </thead>
          <tbody>
            @for (c of departamentales(); track c.id) {
              <tr>
                <td>{{ c.id }}</td>
                <td><strong>{{ c.nombre }}</strong></td>
                <td>{{ c.lista }}</td>
                <td>{{ c.codigoLrf }}</td>
                <td><span class="badge dept">{{ c.departamento }}</span></td>
                <td>{{ c.cargoLista }}</td>
                <td><a class="action-link">{{ c.contacto }}</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='odn') {
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input class="search-input" placeholder="Buscar por nombre de lista…" [(ngModel)]="q">
          </div>
        </div>
        <button class="btn btn-primary" (click)="abrirNuevaLista()">+ Nueva Lista ODN</button>
      </div>
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Lista</th><th>Depto.</th><th>Sublema</th><th>Presidente</th><th>Sector</th><th>Votos</th><th>Agrup.</th><th></th></tr>
          </thead>
          <tbody>
            @for (l of filtrarListas(); track l.id) {
              <tr>
                <td><strong>{{ l.nombre }}</strong></td>
                <td><span class="badge dept">{{ l.departamento || '—' }}</span></td>
                <td>{{ l.sublema || '—' }}</td>
                <td>{{ l.presidente || '—' }}</td>
                <td>{{ l.sector || '—' }}</td>
                <td>{{ l.votos != null ? l.votos : '—' }}</td>
                <td>{{ l.codAgrup != null ? l.codAgrup : (l.agrupacionId != null ? '#' + l.agrupacionId : '—') }}</td>
                <td>
                  <button class="btn-pencil" (click)="abrirEditarLista(l)" title="Editar">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8"><div class="empty-state"><div class="empty-state-text">Sin listas ODN</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (modalKind()) {
      <app-modal-form
        [title]="tituloModal()"
        [busy]="modalBusy()"
        [error]="modalError()"
        [saveLabel]="modalMode()==='editar' ? 'Guardar cambios' : 'Crear'"
        (save)="guardar()" (cancel)="cerrarModal()">
            <div class="nv-grid">
              <div class="fg"><label>Lista (nombre) *</label><input [(ngModel)]="form.nombre" name="l-nombre"></div>
              <div class="fg"><label>Departamento</label><input [(ngModel)]="form.departamento" name="l-depto"></div>
              <div class="fg full"><label>Sublema</label><input [(ngModel)]="form.sublema" name="l-sublema"></div>
              <div class="fg"><label>Presidente</label><input [(ngModel)]="form.presidente" name="l-pres"></div>
              <div class="fg"><label>Sector</label><input [(ngModel)]="form.sector" name="l-sector"></div>
              <div class="fg"><label>Votos</label><input type="number" [(ngModel)]="form.votos" name="l-votos"></div>
              <div class="fg"><label>Cod. Agrup.</label><input type="number" [(ngModel)]="form.codAgrup" name="l-codagr"></div>
            </div>
      </app-modal-form>
    }
  `,
})
export class ConvencionalesComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  private svc = inject(ConvencionalesService);

  tab = signal<Tab>('nacionales');
  q = '';

  nacionales = signal<ConvencionalDto[]>([]);
  departamentales = signal<ConvDisplay[]>([]);
  odn = signal<ListaDto[]>([]);
  stats = signal<ConvencionalStats>({ nacionales: 0, departamentales: 0, listasOdn: 0 });

  // ── modal (alta/edición de Convencional o Lista) ──────────
  modalKind = signal<ModalKind | null>(null);
  modalMode = signal<ModalMode>('nueva');
  editId = signal<number | null>(null);
  modalBusy = signal(false);
  modalError = signal('');
  form: any = {};

  tituloModal = computed(() => `${this.modalMode() === 'editar' ? 'Editar' : 'Nueva'} Lista`);

  constructor() {
    this.titleSvc.set('Convencionales');
    this.svc.getStats().subscribe(s => this.stats.set(s));
    this.loadNacionales();
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'departamentales' && this.departamentales().length === 0)
      this.http.get<ConvDisplay[]>(`${environment.apiUrl}/convencionales/departamentales`).subscribe(x => this.departamentales.set(x));
    if (t === 'odn' && this.odn().length === 0) this.loadListas('ODN');
  }

  private loadNacionales() { this.svc.getNacionales().subscribe(x => this.nacionales.set(x)); }
  private loadListas(tipo: ListaTipo) {
    this.svc.getListas(tipo).subscribe(x => this.odn.set(x));
  }
  private refreshStats() { this.svc.getStats().subscribe(s => this.stats.set(s)); }

  filtrarNacionales() {
    const arr = this.nacionales();
    if (!this.q) return arr;
    const q = this.q.toLowerCase();
    return arr.filter(c =>
      (c.departamento || '').toLowerCase().includes(q) ||
      (c.condicion || '').toLowerCase().includes(q) ||
      (c.nombreOrganismo || '').toLowerCase().includes(q) ||
      (c.posicion || '').toLowerCase().includes(q));
  }

  filtrarListas() {
    const arr = this.odn();
    if (!this.q) return arr;
    const q = this.q.toLowerCase();
    return arr.filter(l =>
      l.nombre.toLowerCase().includes(q) ||
      (l.sublema || '').toLowerCase().includes(q) ||
      (l.presidente || '').toLowerCase().includes(q) ||
      (l.departamento || '').toLowerCase().includes(q));
  }

  // ── helpers de fecha ──────────────────────────────────────
  fmtFecha(v?: string | null): string {
    if (!v) return '—';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}`; }
    return s;
  }
  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.errorCode || err?.message || fallback;
  }

  // ── Lista ─────────────────────────────────────────────────
  abrirNuevaLista() {
    this.form = { nombre: '', tipo: 'ODN', agrupacionId: null, departamento: '', sublema: '', presidente: '', sector: '', votos: null, codAgrup: null };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('lista');
  }

  abrirEditarLista(l: ListaDto) {
    this.form = {
      nombre: l.nombre, tipo: l.tipo || 'ODN', agrupacionId: l.agrupacionId ?? null,
      departamento: l.departamento || '', sublema: l.sublema || '', presidente: l.presidente || '',
      sector: l.sector || '', votos: l.votos ?? null, codAgrup: l.codAgrup ?? null,
    };
    this.modalError.set(''); this.editId.set(l.id);
    this.modalMode.set('editar'); this.modalKind.set('lista');
  }

  cerrarModal() {
    this.modalKind.set(null); this.editId.set(null); this.modalError.set('');
  }

  guardar() { this.guardarLista(); }

  private guardarLista() {
    if (!this.form.nombre?.trim()) { this.modalError.set('El nombre de la lista es obligatorio.'); return; }
    const tipo = (this.form.tipo || 'ODN') as ListaTipo;
    const num = (v: any) => v == null || v === '' ? null : Number(v);
    const str = (v: any) => v?.toString().trim() ? v.trim() : null;
    const input: ListaInput = {
      nombre: this.form.nombre.trim(),
      tipo,
      agrupacionId: num(this.form.agrupacionId),
      departamento: str(this.form.departamento),
      sublema: str(this.form.sublema),
      presidente: str(this.form.presidente),
      sector: str(this.form.sector),
      votos: num(this.form.votos),
      codAgrup: num(this.form.codAgrup),
    };
    this.modalBusy.set(true); this.modalError.set('');
    const id = this.editId();
    const req = this.modalMode() === 'editar' && id != null
      ? this.svc.updateLista(id, input)
      : this.svc.createLista(input);
    req.subscribe({
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.loadListas(tipo); this.refreshStats(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar la lista.')); },
    });
  }
}
