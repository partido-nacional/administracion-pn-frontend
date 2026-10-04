import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { OrganismosService } from '../../core/services/organismos.service';
import { OrganismoDto, ReferenciaOrganismo } from '../../core/models/organismos';
import { ContactosService, ContactoListado } from '../agenda/contactos.service';
import { PageTitleService } from '../../core/page-title.service';
import { aIsoDate } from '../../core/fechas';
import { ToastService } from '../../core/services/toast.service';
import { ModalFormComponent } from '../../shared/components/modal-form/modal-form.component';

/** Formulario de alta (feature 036): mismos campos que la edición, con el contacto elegido aparte. */
interface NuevaReferencia {
  rol: string; periodo: string; fechaDesignacion: string; fechaCese: string; art44: boolean; notas: string;
}
const nuevaVacia = (): NuevaReferencia =>
  ({ rol: '', periodo: '', fechaDesignacion: '', fechaCese: '', art44: false, notas: '' });

/**
 * Referencias partidarias de un organismo (feature 028). Editables; alta manual en la feature 036.
 * Se llega desde el botón "Referencias partidarias" de la grilla de Organismos.
 */
@Component({
  selector: 'app-referencias-organismo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalFormComponent],
  template: `
    <div class="topbar-inline">
      <a routerLink="/organismos" class="btn btn-secondary">← Volver a Organismos</a>
      <!-- Solo organismos partidarios admiten referencias (el backend rechaza el resto). -->
      @if (esPartidario()) {
        <button type="button" class="btn btn-primary" (click)="abrirAlta()">+ Crear referencia</button>
      }
    </div>

    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <h2 style="margin:16px 24px 0 24px">Referencias Partidarias — {{ organismo()?.nombre || 'Organismo #' + organismoId }}</h2>
        @if (items().length === 0) {
          <div class="empty-state" style="padding:40px">
            <div class="empty-state-text">Este organismo no tiene referencias partidarias</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Rol / Cargo</th>
                <th>Período</th>
                <th>Fecha Designación</th>
                <th>Fecha Cese</th>
                <th>Art. 44</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of items(); track clave(r)) {
                <tr [class.calculada]="esCalculada(r)">
                  <td><strong>{{ r.nombres }}</strong> @if (esCalculada(r)) { <span class="badge-calc" title="Integrante finalizado sin referencia partidaria (calculada, solo lectura)">Desde integrante</span> }</td>
                  <td>{{ r.rol || '—' }}</td>
                  <td>{{ r.periodo || '—' }}</td>
                  <td>{{ r.fechaDesignacion || '—' }}</td>
                  <td>{{ r.fechaCese || '—' }}</td>
                  <td>{{ r.art44 ? 'Sí' : 'No' }}</td>
                  <td>{{ r.notas || '—' }}</td>
                  <td>
                    @if (esCalculada(r)) {
                      <span class="hint" title="Integrante finalizado sin referencia partidaria: se muestra calculado y no se puede editar">—</span>
                    } @else {
                      <button type="button" class="btn btn-sm btn-secondary" (click)="abrirEdicion(r)">Editar</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (editando(); as e) {
      <app-modal-form title="Editar referencia partidaria"
                      [error]="error()" [busy]="busy()"
                      (save)="guardar()" (cancel)="cancelar()">
        <div class="nv-grid g3">
          <div class="fg"><label>Rol / Cargo</label>
            <input [(ngModel)]="e.rol" name="rol"></div>
          <div class="fg"><label>Período</label>
            <input [(ngModel)]="e.periodo" name="periodo"></div>
          <div class="fg"><label>Art. 44</label>
            <select [(ngModel)]="e.art44" name="art44">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Sí</option>
            </select></div>
          <div class="fg"><label>Fecha designación</label>
            <input type="date" [(ngModel)]="e.fechaDesignacion" name="fd"></div>
          <div class="fg"><label>Fecha cese</label>
            <input type="date" [(ngModel)]="e.fechaCese" name="fc"></div>
        </div>
        <div class="fg" style="margin-top:12px"><label>Notas</label>
          <textarea [(ngModel)]="e.notas" name="notas" rows="3"></textarea></div>
      </app-modal-form>
    }

    @if (nueva(); as n) {
      <app-modal-form title="Crear referencia partidaria" saveLabel="Crear"
                      [error]="error()" [busy]="busy()"
                      (save)="crear()" (cancel)="cerrarAlta()">
        <div class="fg" style="margin-bottom:12px"><label>Contacto *</label>
          <div class="combo">
            <input class="combo-input" name="n-contacto" aria-label="Buscar contacto"
                   [placeholder]="contactoSel() ? '' : 'Buscar por nombre o cédula…'"
                   [value]="contactoSel() ? labelContacto(contactoSel()!) : qContacto()"
                   (input)="onBuscarContacto($event)" (focus)="contactoSel.set(null)">
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
        <div class="nv-grid g3">
          <div class="fg"><label>Rol / Cargo *</label>
            <input [(ngModel)]="n.rol" name="n-rol"></div>
          <div class="fg"><label>Período</label>
            <input [(ngModel)]="n.periodo" name="n-periodo"></div>
          <div class="fg"><label>Art. 44</label>
            <select [(ngModel)]="n.art44" name="n-art44">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Sí</option>
            </select></div>
          <div class="fg"><label>Fecha designación</label>
            <input type="date" [(ngModel)]="n.fechaDesignacion" name="n-fd"></div>
          <div class="fg"><label>Fecha cese</label>
            <input type="date" [(ngModel)]="n.fechaCese" name="n-fc"></div>
        </div>
        <div class="fg" style="margin-top:12px"><label>Notas</label>
          <textarea [(ngModel)]="n.notas" name="n-notas" rows="3"></textarea></div>
      </app-modal-form>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:space-between; margin-bottom:16px; }
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
    .badge-calc { display:inline-block; margin-left:6px; padding:1px 6px; border-radius:10px; font-size:11px;
                  background:#eef1f5; color:#5a6472; font-weight:500; white-space:nowrap; }
    tr.calculada td { color:#5a6472; }
  `]
})
export class ReferenciasOrganismoComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(OrganismosService);
  private titleSvc = inject(PageTitleService);
  private toast = inject(ToastService);

  organismoId!: number;
  items = signal<ReferenciaOrganismo[]>([]);

  /** Copia editable de la fila abierta. null = modal cerrado. */
  editando = signal<ReferenciaOrganismo | null>(null);
  busy = signal(false);
  error = signal('');

  // ── Alta manual (feature 036) ─────────────────────────────
  private contactosSvc = inject(ContactosService);
  organismo = signal<OrganismoDto | null>(null);
  esPartidario = () => this.organismo()?.organizacionPartidariaId != null;
  /** Formulario de alta abierto. null = cerrado. */
  nueva = signal<NuevaReferencia | null>(null);
  qContacto = signal('');
  resultados = signal<ContactoListado[]>([]);
  contactoSel = signal<ContactoListado | null>(null);
  private buscarContacto$ = new Subject<string>();

  constructor() {
    this.titleSvc.set('Referencias Partidarias del Organismo');
    this.organismoId = +this.route.snapshot.paramMap.get('organismoId')!;
    this.svc.getOrganismo(this.organismoId).subscribe(o => this.organismo.set(o));
    this.cargar();
    // Buscador de contacto: mismo patrón que agrupaciones-por-periodo (debounce + 8 resultados).
    this.buscarContacto$.pipe(debounceTime(250), takeUntilDestroyed(inject(DestroyRef))).subscribe(q => {
      if (!q.trim()) { this.resultados.set([]); return; }
      this.contactosSvc.listado({ page: 1, pageSize: 8, filters: { q } })
        .subscribe(r => this.resultados.set(r.items));
    });
  }

  /** "Apellido, Nombre (cédula)". La cédula "0" es un valor por defecto del sistema viejo: no se muestra. */
  labelContacto(c: ContactoListado): string {
    const ced = c.cedula && c.cedula.trim() !== '0' ? ` (${c.cedula})` : '';
    return `${c.apellido}, ${c.nombre}${ced}`;
  }

  abrirAlta() {
    this.nueva.set(nuevaVacia());
    this.contactoSel.set(null);
    this.qContacto.set('');
    this.resultados.set([]);
    this.error.set('');
  }

  cerrarAlta() {
    this.nueva.set(null);
    this.error.set('');
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

  crear() {
    const n = this.nueva();
    if (!n) return;
    const c = this.contactoSel();
    if (!c) { this.error.set('Elegí un contacto de la lista.'); return; }
    if (!n.rol.trim()) { this.error.set('El rol / cargo es obligatorio.'); return; }
    this.busy.set(true);
    this.error.set('');
    this.svc.crearReferencia({
      contactoId: c.id,
      organismoId: this.organismoId,
      rol: n.rol.trim(),
      periodo: n.periodo.trim() || null,
      fechaDesignacion: n.fechaDesignacion || null,
      fechaCese: n.fechaCese || null,
      art44: n.art44,
      notas: n.notas.trim() || null,
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.nueva.set(null);
        this.toast.success('Referencia creada.');
        this.cargar();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message || 'No se pudo crear la referencia.');
      },
    });
  }

  private cargar() {
    this.svc.getReferenciasDeOrganismo(this.organismoId).subscribe(x => this.items.set(x));
  }

  /** Feature 035: fila calculada desde un integrante finalizado sin referencia (solo lectura). */
  esCalculada(r: ReferenciaOrganismo): boolean { return r.origen === 'Integrante'; }
  /** Las calculadas tienen id 0: se trackean por el id del integrante. */
  clave(r: ReferenciaOrganismo): string { return this.esCalculada(r) ? `i${r.integranteId}` : `r${r.id}`; }

  abrirEdicion(r: ReferenciaOrganismo) {
    // Copia: si el operador cancela, la fila de la grilla queda intacta.
    this.editando.set({ ...r, fechaDesignacion: aIsoDate(r.fechaDesignacion), fechaCese: aIsoDate(r.fechaCese) });
    this.error.set('');
  }

  cancelar() {
    this.editando.set(null);
    this.error.set('');
  }

  guardar() {
    const e = this.editando();
    if (!e) return;
    this.busy.set(true);
    this.error.set('');
    // A diferencia de la vista por contacto, aca el organismoId viene de la ruta.
    this.svc.editarReferencia(e.id, {
      contactoId: e.contactoId,
      organismoId: this.organismoId,
      rol: e.rol || null,
      periodo: e.periodo || null,
      fechaDesignacion: e.fechaDesignacion || null,
      fechaCese: e.fechaCese || null,
      art44: e.art44,
      notas: e.notas || null,
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.editando.set(null);
        this.toast.success('Referencia actualizada.');
        this.cargar();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message || 'No se pudo guardar la referencia.');
      },
    });
  }
}

