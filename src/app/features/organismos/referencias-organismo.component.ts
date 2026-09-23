import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { OrganismosService } from '../../core/services/organismos.service';
import { ReferenciaOrganismo } from '../../core/models/organismos';
import { PageTitleService } from '../../core/page-title.service';
import { aIsoDate } from '../../core/fechas';
import { ToastService } from '../../core/services/toast.service';
import { ModalFormComponent } from '../../shared/components/modal-form/modal-form.component';

/**
 * Referencias partidarias de un organismo (feature 028, solo lectura).
 * Se llega desde el botón "Referencias partidarias" de la grilla de Organismos.
 */
@Component({
  selector: 'app-referencias-organismo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalFormComponent],
  template: `
    <div class="topbar-inline">
      <a routerLink="/organismos" class="btn btn-secondary">← Volver a Organismos</a>
    </div>

    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <h2 style="margin:16px 24px 0 24px">Referencias Partidarias — Organismo #{{ organismoId }}</h2>
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
              @for (r of items(); track r.id) {
                <tr>
                  <td><strong>{{ r.nombres }}</strong></td>
                  <td>{{ r.rol || '—' }}</td>
                  <td>{{ r.periodo || '—' }}</td>
                  <td>{{ r.fechaDesignacion || '—' }}</td>
                  <td>{{ r.fechaCese || '—' }}</td>
                  <td>{{ r.art44 ? 'Sí' : 'No' }}</td>
                  <td>{{ r.notas || '—' }}</td>
                  <td>
                    <button type="button" class="btn btn-sm btn-secondary" (click)="abrirEdicion(r)">Editar</button>
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

  constructor() {
    this.titleSvc.set('Referencias Partidarias del Organismo');
    this.organismoId = +this.route.snapshot.paramMap.get('organismoId')!;
    this.cargar();
  }

  private cargar() {
    this.svc.getReferenciasDeOrganismo(this.organismoId).subscribe(x => this.items.set(x));
  }

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

