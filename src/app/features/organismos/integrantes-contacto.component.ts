import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactosService, IntegranteOrganismo } from '../agenda/contactos.service';
import { PageTitleService } from '../../core/page-title.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-integrantes-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="topbar-inline">
      <a routerLink="/agenda" class="btn btn-secondary">← Volver a contactos</a>
      <a [routerLink]="['/agenda', contactoId, 'organismos', 'nuevo']" class="btn btn-primary">Nuevo integrante organismo</a>
    </div>

    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <h2 style="margin:16px 24px 0 24px">Ficha de Integrante de Organismo — Contacto #{{ contactoId }}</h2>
        @if (items().length === 0) {
          <div class="empty-state" style="padding:40px">
            <div class="empty-state-text">El contacto no está asociado a ningún organismo</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Id Int.Org.</th>
                <th>Id C.</th>
                <th>Nom. Comp.</th>
                <th>Nombres</th>
                <th>P.-S.</th>
                <th>Pos. Org.</th>
                <th>Orden</th>
                <th>Nom. Org.</th>
                <th>Nota</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (i of items(); track i.id) {
                <tr class="clickable" [class.selected]="expandedId() === i.id" (click)="toggle(i.id)">
                  <td>{{ i.id }}</td>
                  <td>{{ i.contactoId }}</td>
                  <td>{{ i.nombreCompania || '—' }}</td>
                  <td>{{ i.nombres }}</td>
                  <td>{{ i.partidoSectorDescripcion || i.partidoSectorCodigo || '—' }}</td>
                  <td>{{ i.posicionOrganismo || '—' }}</td>
                  <td>{{ i.orden ?? '—' }}</td>
                  <td>{{ i.nombreOrganismo || '—' }}</td>
                  <td>{{ i.nota || '—' }}</td>
                  <td>
                    @if (i.activo) {
                      <span class="estado vigente">Vigente</span>
                    } @else {
                      <span class="estado finalizada">Finalizada{{ i.fechaFin ? ' · ' + i.fechaFin : '' }}</span>
                    }
                  </td>
                  <td (click)="$event.stopPropagation()">
                    @if (i.activo) {
                      <button class="btn btn-sm btn-danger" (click)="abrirFinalizar(i.id)">Finalizar</button>
                    }
                  </td>
                </tr>
                @if (expandedId() === i.id) {
                  <tr class="detalle-row">
                    <td colspan="11">
                      <div class="detalle-wrap">
                        <div class="detalle-section">
                          <div class="detalle-section-title">Detalle del integrante</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Id Integrante</span><span class="v">{{ i.id }}</span></div>
                            <div class="kv"><span class="k">Contacto</span><span class="v">{{ i.nombres }} (#{{ i.contactoId }})</span></div>
                            <div class="kv"><span class="k">Nombre Compañía</span><span class="v">{{ i.nombreCompania || '—' }}</span></div>
                            <div class="kv"><span class="k">Nombre Organismo</span><span class="v">{{ i.nombreOrganismo || '—' }}</span></div>
                            <div class="kv"><span class="k">Partido-Sector</span><span class="v">{{ i.partidoSectorDescripcion || i.partidoSectorCodigo || '—' }}</span></div>
                            <div class="kv full"><span class="k">Posición</span><span class="v">{{ i.posicionOrganismo || '—' }}</span></div>
                            <div class="kv"><span class="k">Orden</span><span class="v">{{ i.orden ?? '—' }}</span></div>
                            <div class="kv"><span class="k">Condición</span><span class="v">{{ i.condicion || '—' }}</span></div>
                            <div class="kv"><span class="k">Fecha Designación</span><span class="v">{{ i.fechaDesignacion || '—' }}</span></div>
                            <div class="kv"><span class="k">Fecha Fin</span><span class="v">{{ i.fechaFin || '—' }}</span></div>
                            <div class="kv full"><span class="k">Nota</span><span class="v">{{ i.nota || '—' }}</span></div>
                          </div>
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
    </div>

    @if (finalizarId() !== null) {
      <div class="modal-backdrop" (click)="cancelarFinalizar()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3 style="margin:0 0 12px">Finalizar ficha</h3>
          <div class="form-group">
            <label class="form-label">Fecha de finalización *</label>
            <input type="date" class="form-input" [(ngModel)]="fechaFin" name="ff">
          </div>
          @if (errorFin()) { <div style="color:#a8261b; margin-top:8px">{{ errorFin() }}</div> }
          <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px">
            <button class="btn btn-secondary" (click)="cancelarFinalizar()">Cancelar</button>
            <button class="btn btn-danger" (click)="confirmarFinalizar()" [disabled]="busy()">
              {{ busy() ? 'Finalizando…' : 'Finalizar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .detalle-wrap { padding:20px 24px; border-top:1px solid #d6dde6; }
    .detalle-section { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:14px 18px; }
    .detalle-section-title {
      font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase;
      letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px;
      border-bottom:1px solid #eef1f5;
    }
    .detalle-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 24px; }
    @media (max-width: 900px) { .detalle-grid { grid-template-columns:repeat(2, 1fr); } }
    @media (max-width: 600px) { .detalle-grid { grid-template-columns:1fr; } }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv.full { grid-column:1 / -1; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }
    .estado { font-size:12px; font-weight:600; padding:2px 8px; border-radius:20px; white-space:nowrap; }
    .estado.vigente { color:#2e7d5b; background:#e1f0e8; }
    .estado.finalizada { color:#7a5c33; background:#f1e9dc; }
    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,.35);
      display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .modal-card { background:#fff; border-radius:8px; padding:20px 24px; width:340px; max-width:90vw; box-shadow:0 8px 30px rgba(0,0,0,.2); }
    .form-group { display:flex; flex-direction:column; gap:5px; }
  `]
})
export class IntegrantesContactoComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(ContactosService);
  private titleSvc = inject(PageTitleService);
  private toast = inject(ToastService);

  contactoId!: number;
  items = signal<IntegranteOrganismo[]>([]);
  expandedId = signal<number | null>(null);

  // Estado del diálogo de finalización (feature 026): la fecha es editable y obligatoria.
  finalizarId = signal<number | null>(null);
  fechaFin = signal<string>('');
  errorFin = signal('');
  busy = signal(false);

  constructor() {
    this.titleSvc.set('Ficha de Integrante de Organismo');
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.reload();
  }

  reload() {
    this.svc.integrantesOrganismo(this.contactoId).subscribe(x => this.items.set(x));
  }

  toggle(id: number) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  abrirFinalizar(id: number) {
    this.errorFin.set('');
    this.fechaFin.set(this.hoyIso()); // precargada con hoy, editable
    this.finalizarId.set(id);
  }

  cancelarFinalizar() {
    this.finalizarId.set(null);
  }

  confirmarFinalizar() {
    const id = this.finalizarId();
    if (id === null) return;
    if (!this.fechaFin()) { this.errorFin.set('Ingresá la fecha de finalización.'); return; }
    this.busy.set(true);
    this.svc.finalizarIntegranteOrganismo(id, this.fechaFin()).subscribe({
      next: () => {
        this.busy.set(false);
        this.finalizarId.set(null);
        this.expandedId.set(null);
        this.reload();
        this.toast.success('Ficha finalizada.');
      },
      error: () => {
        this.busy.set(false);
        this.errorFin.set('No se pudo finalizar la ficha.');
      }
    });
  }

  /** Fecha de hoy en formato yyyy-MM-dd (zona local). */
  private hoyIso(): string {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
}
