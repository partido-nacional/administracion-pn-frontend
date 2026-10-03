import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactosService, ReferenciaPartidaria } from '../agenda/contactos.service';
import { PageTitleService } from '../../core/page-title.service';
import { aIsoDate } from '../../core/fechas';
import { OrganismosService } from '../../core/services/organismos.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalFormComponent } from '../../shared/components/modal-form/modal-form.component';

/**
 * Referencias partidarias de un contacto. Editable desde la feature 028: el PUT del backend
 * ya existia, lo que faltaba era la UI.
 * Se llega desde el botón "Ver referencias partidarias" del listado de contactos.
 */
@Component({
  selector: 'app-referencias-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalFormComponent],
  template: `
    <div class="topbar-inline">
      <a routerLink="/agenda" class="btn btn-secondary">← Volver a contactos</a>
    </div>

    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <h2 style="margin:16px 24px 0 24px">Referencias Partidarias — Contacto #{{ contactoId }}</h2>
        @if (items().length === 0) {
          <div class="empty-state" style="padding:40px">
            <div class="empty-state-text">El contacto no tiene referencias partidarias</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Rol / Cargo</th>
                <th>Organismo</th>
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
                  <td><strong>{{ r.rol || '—' }}</strong> @if (esCalculada(r)) { <span class="badge-calc" title="Integrante finalizado sin referencia partidaria (calculada, solo lectura)">Desde integrante</span> }</td>
                  <td>{{ r.nombreOrganismo || '—' }}</td>
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
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-start; margin-bottom:16px; }
    .badge-calc { display:inline-block; margin-left:6px; padding:1px 6px; border-radius:10px; font-size:11px;
                  background:#eef1f5; color:#5a6472; font-weight:500; white-space:nowrap; }
    tr.calculada td { color:#5a6472; }
  `]
})
export class ReferenciasContactoComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(ContactosService);
  private organismosSvc = inject(OrganismosService);
  private titleSvc = inject(PageTitleService);
  private toast = inject(ToastService);

  contactoId!: number;
  items = signal<ReferenciaPartidaria[]>([]);

  /** Copia editable de la fila abierta. null = modal cerrado. */
  editando = signal<ReferenciaPartidaria | null>(null);
  busy = signal(false);
  error = signal('');

  constructor() {
    this.titleSvc.set('Referencias Partidarias');
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.cargar();
  }

  private cargar() {
    this.svc.referenciasPartidarias(this.contactoId).subscribe(x => this.items.set(x));
  }

  /** Feature 035: fila calculada desde un integrante finalizado sin referencia (solo lectura). */
  esCalculada(r: ReferenciaPartidaria): boolean { return r.origen === 'Integrante'; }
  /** Las calculadas tienen id 0: se trackean por el id del integrante. */
  clave(r: ReferenciaPartidaria): string { return this.esCalculada(r) ? `i${r.integranteId}` : `r${r.id}`; }

  abrirEdicion(r: ReferenciaPartidaria) {
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
    this.organismosSvc.editarReferencia(e.id, {
      contactoId: e.contactoId,
      organismoId: e.organismoId ?? null,
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
        // El modal conserva lo escrito: el operador no pierde el trabajo por un error del backend.
        this.error.set(err?.error?.message || 'No se pudo guardar la referencia.');
      },
    });
  }
}

