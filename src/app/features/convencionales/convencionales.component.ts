import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { ConvencionalesService } from '../../core/services/convencionales.service';
import { ModalFormComponent } from '../../shared/components/modal-form/modal-form.component';
import {
  ConvencionalDto, ConvencionalInput, ConvencionalStats,
  ListaDto, ListaInput, ListaTipo,
} from '../../core/models/convencionales';

/** Display-only de las tabs fuera de alcance (Departamentales / Integrantes): shape heredado. */
interface ConvDisplay { id: number; nombre: string; lista: string; codigoLrf: string; departamento: string; cargoLista: string; contacto: string; }
interface IntegranteLista { nombre: string; cedula: string; lista: string; codigoLrf: string; tipo: string; departamento: string; cargoLista: string; orden: number; contacto: string; }

type Tab = 'nacionales' | 'departamentales' | 'odn' | 'odd' | 'integrantes';
type ModalKind = 'convencional' | 'lista';
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
      <a class="tab" [class.active]="tab()==='odd'"             (click)="setTab('odd')">Listas ODD</a>
      <a class="tab" [class.active]="tab()==='integrantes'"     (click)="setTab('integrantes')">Integrantes de Lista</a>
    </div>

    @if (tab()==='nacionales') {
      <div class="stats-grid" style="margin-top:20px">
        <div class="stat-card"><div class="stat-value">{{ stats().nacionales }}</div><div class="stat-label">Conv. Nacionales</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats().departamentales }}</div><div class="stat-label">Conv. Departamentales</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats().listasOdn }}</div><div class="stat-label">Listas ODN</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats().listasOdd }}</div><div class="stat-label">Listas ODD</div></div>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input class="search-input" placeholder="Buscar por organismo, posición, departamento…" [(ngModel)]="q">
          </div>
        </div>
        <button class="btn btn-primary" (click)="abrirNuevoConvencional()">+ Nuevo Convencional</button>
      </div>

      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>ID</th><th>Contacto</th><th>Departamento</th><th>Condición</th><th>Adherente</th><th>Organismo</th><th>Posición</th><th>Fecha Inicio</th><th>Fecha Fin</th><th></th></tr>
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
                <td>
                  <button class="btn-pencil" (click)="abrirEditarConvencional(c)" title="Editar">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="10"><div class="empty-state"><div class="empty-state-text">Sin convencionales nacionales</div></div></td></tr>
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

    @if (tab()==='odn' || tab()==='odd') {
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input class="search-input" placeholder="Buscar por nombre de lista…" [(ngModel)]="q">
          </div>
        </div>
        <button class="btn btn-primary" (click)="abrirNuevaLista()">+ Nueva Lista {{ tab()==='odn' ? 'ODN' : 'ODD' }}</button>
      </div>
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>ID</th><th>Nombre de Lista</th><th>Tipo</th><th>Agrupación</th><th></th></tr>
          </thead>
          <tbody>
            @for (l of filtrarListas(); track l.id) {
              <tr>
                <td>{{ l.id }}</td>
                <td><strong>{{ l.nombre }}</strong></td>
                <td>{{ l.tipo }}</td>
                <td>{{ l.agrupacionId != null ? '#' + l.agrupacionId : '—' }}</td>
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
              <tr><td colspan="5"><div class="empty-state"><div class="empty-state-text">Sin listas {{ tab()==='odn' ? 'ODN' : 'ODD' }}</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='integrantes') {
      <div class="toolbar">
        <div class="toolbar-left">
          <select class="form-select" [(ngModel)]="filtroTipo" style="min-width:160px">
            <option value="">— Tipo —</option><option>ODN</option><option>ODD</option>
          </select>
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input class="search-input" placeholder="Buscar integrante…" [(ngModel)]="q">
          </div>
        </div>
      </div>
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Nombre</th><th>Cédula</th><th>Lista</th><th>Código LRF</th><th>Tipo</th><th>Depto.</th><th>Cargo</th><th>Orden</th><th>Contacto</th></tr>
          </thead>
          <tbody>
            @for (i of filtrarInteg(); track $index) {
              <tr>
                <td><strong>{{ i.nombre }}</strong></td>
                <td>{{ i.cedula }}</td>
                <td>{{ i.lista }}</td>
                <td>{{ i.codigoLrf }}</td>
                <td>{{ i.tipo }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
                <td>{{ i.cargoLista }}</td>
                <td>{{ i.orden }}</td>
                <td><a class="action-link">{{ i.contacto }}</a></td>
              </tr>
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
            @if (modalKind()==='convencional') {
              <div class="nv-grid">
                <div class="fg"><label>Contacto ID *</label><input type="number" [(ngModel)]="form.contactoId" name="c-contacto"></div>
                <div class="fg"><label>Tipo</label>
                  <select [(ngModel)]="form.tipo" name="c-tipo">
                    <option value="Nacional">Nacional</option>
                    <option value="Departamental">Departamental</option>
                  </select>
                </div>
                <div class="fg"><label>Departamento</label>
                  <select [(ngModel)]="form.departamento" name="c-depto">
                    <option value="">—</option>
                    @for (d of departamentos; track d) { <option [ngValue]="d">{{ d }}</option> }
                  </select>
                </div>
                <div class="fg"><label>Condición</label><input [(ngModel)]="form.condicion" name="c-cond"></div>
                <div class="fg"><label>Organismo</label><input [(ngModel)]="form.nombreOrganismo" name="c-org"></div>
                <div class="fg"><label>Posición</label><input [(ngModel)]="form.posicion" name="c-pos"></div>
                <div class="fg"><label>Fecha Inicio *</label><input type="date" [(ngModel)]="form.fechaInicio" name="c-fini"></div>
                <div class="fg"><label>Fecha Fin</label><input type="date" [(ngModel)]="form.fechaFin" name="c-ffin"></div>
                <div class="fg check"><label><input type="checkbox" [(ngModel)]="form.adherente" name="c-adh"> Adherente</label></div>
              </div>
            } @else {
              <div class="nv-grid">
                <div class="fg full"><label>Nombre de Lista *</label><input [(ngModel)]="form.nombre" name="l-nombre"></div>
                <div class="fg"><label>Tipo</label>
                  <select [(ngModel)]="form.tipo" name="l-tipo">
                    <option value="ODN">ODN</option>
                    <option value="ODD">ODD</option>
                  </select>
                </div>
                <div class="fg"><label>Agrupación ID</label><input type="number" [(ngModel)]="form.agrupacionId" name="l-agr"></div>
              </div>
            }
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
  filtroTipo = '';

  departamentos = [
    'Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida',
    'Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha',
    'Salto','San José','Soriano','Tacuarembó','Treinta y Tres','Nacional'
  ];

  nacionales = signal<ConvencionalDto[]>([]);
  departamentales = signal<ConvDisplay[]>([]);
  odn = signal<ListaDto[]>([]);
  odd = signal<ListaDto[]>([]);
  integ = signal<IntegranteLista[]>([]);
  stats = signal<ConvencionalStats>({ nacionales: 0, departamentales: 0, listasOdn: 0, listasOdd: 0 });

  // ── modal (alta/edición de Convencional o Lista) ──────────
  modalKind = signal<ModalKind | null>(null);
  modalMode = signal<ModalMode>('nueva');
  editId = signal<number | null>(null);
  modalBusy = signal(false);
  modalError = signal('');
  form: any = {};

  tituloModal = computed(() => {
    const acc = this.modalMode() === 'editar' ? 'Editar' : 'Nuevo';
    return this.modalKind() === 'lista'
      ? `${this.modalMode() === 'editar' ? 'Editar' : 'Nueva'} Lista`
      : `${acc} Convencional`;
  });

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
    if (t === 'odd' && this.odd().length === 0) this.loadListas('ODD');
    if (t === 'integrantes' && this.integ().length === 0)
      this.http.get<IntegranteLista[]>(`${environment.apiUrl}/convencionales/integrantes`).subscribe(x => this.integ.set(x));
  }

  private loadNacionales() { this.svc.getNacionales().subscribe(x => this.nacionales.set(x)); }
  private loadListas(tipo: ListaTipo) {
    this.svc.getListas(tipo).subscribe(x => (tipo === 'ODN' ? this.odn : this.odd).set(x));
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
    const arr = this.tab() === 'odn' ? this.odn() : this.odd();
    if (!this.q) return arr;
    const q = this.q.toLowerCase();
    return arr.filter(l => l.nombre.toLowerCase().includes(q));
  }

  filtrarInteg() {
    let arr = this.integ();
    if (this.filtroTipo) arr = arr.filter(i => i.tipo === this.filtroTipo);
    if (this.q) {
      const q = this.q.toLowerCase();
      arr = arr.filter(i => i.nombre.toLowerCase().includes(q) || i.lista.toLowerCase().includes(q));
    }
    return arr;
  }

  // ── helpers de fecha ──────────────────────────────────────
  fmtFecha(v?: string | null): string {
    if (!v) return '—';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}`; }
    return s;
  }
  private toInputDate(v?: string | null): string {
    if (!v) return '';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const mm = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    return mm ? `${mm[3]}-${mm[2]}-${mm[1]}` : '';
  }
  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.errorCode || err?.message || fallback;
  }

  // ── Convencional ──────────────────────────────────────────
  abrirNuevoConvencional() {
    this.form = { contactoId: null, tipo: 'Nacional', departamento: '', condicion: '', nombreOrganismo: '', posicion: '', fechaInicio: '', fechaFin: '', adherente: false };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('convencional');
  }

  abrirEditarConvencional(c: ConvencionalDto) {
    this.form = {
      contactoId: c.contactoId,
      tipo: c.tipo || 'Nacional',
      departamento: c.departamento || '',
      condicion: c.condicion || '',
      nombreOrganismo: c.nombreOrganismo || '',
      posicion: c.posicion || '',
      fechaInicio: this.toInputDate(c.fechaInicio),
      fechaFin: this.toInputDate(c.fechaFin),
      adherente: !!c.adherente,
    };
    this.modalError.set(''); this.editId.set(c.id);
    this.modalMode.set('editar'); this.modalKind.set('convencional');
  }

  // ── Lista ─────────────────────────────────────────────────
  abrirNuevaLista() {
    this.form = { nombre: '', tipo: this.tab() === 'odd' ? 'ODD' : 'ODN', agrupacionId: null };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('lista');
  }

  abrirEditarLista(l: ListaDto) {
    this.form = { nombre: l.nombre, tipo: l.tipo || 'ODN', agrupacionId: l.agrupacionId ?? null };
    this.modalError.set(''); this.editId.set(l.id);
    this.modalMode.set('editar'); this.modalKind.set('lista');
  }

  cerrarModal() {
    this.modalKind.set(null); this.editId.set(null); this.modalError.set('');
  }

  guardar() {
    if (this.modalKind() === 'convencional') this.guardarConvencional();
    else this.guardarLista();
  }

  private guardarConvencional() {
    if (this.form.contactoId == null || this.form.contactoId === '') { this.modalError.set('El Contacto ID es obligatorio.'); return; }
    if (!this.form.fechaInicio) { this.modalError.set('La Fecha Inicio es obligatoria.'); return; }
    const input: ConvencionalInput = {
      contactoId: Number(this.form.contactoId),
      tipo: this.form.tipo || 'Nacional',
      departamento: this.form.departamento || null,
      condicion: this.form.condicion || null,
      adherente: !!this.form.adherente,
      nombreOrganismo: this.form.nombreOrganismo || null,
      posicion: this.form.posicion || null,
      fechaInicio: this.form.fechaInicio,
      fechaFin: this.form.fechaFin || null,
    };
    this.modalBusy.set(true); this.modalError.set('');
    const id = this.editId();
    const req = this.modalMode() === 'editar' && id != null
      ? this.svc.updateConvencional(id, input)
      : this.svc.createConvencional(input);
    req.subscribe({
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.loadNacionales(); this.refreshStats(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar el convencional.')); },
    });
  }

  private guardarLista() {
    if (!this.form.nombre?.trim()) { this.modalError.set('El nombre de la lista es obligatorio.'); return; }
    const tipo = (this.form.tipo || 'ODN') as ListaTipo;
    const input: ListaInput = {
      nombre: this.form.nombre.trim(),
      tipo,
      agrupacionId: this.form.agrupacionId == null || this.form.agrupacionId === '' ? null : Number(this.form.agrupacionId),
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
