import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactosService, FichaAdhesion, FichaAdhesionDetalle } from '../agenda/contactos.service';
import { AdhesionesService } from './adhesiones.service';
import { PageTitleService } from '../../core/page-title.service';
import { CatalogosService } from '../../core/catalogos.service';
import { normalizarFechaSalida } from '../../shared/adhesiones/confirmado-baja.util';
import { sanitizarFichaParaGuardar } from '../../shared/adhesiones/ficha-adhesion.constants';
import { FichaAdhesionFormComponent } from '../../shared/adhesiones/ficha-adhesion-form.component';

@Component({
  selector: 'app-fichas-contacto',
  standalone: true,
  imports: [CommonModule, RouterLink, FichaAdhesionFormComponent],
  template: `
    <div class="topbar-inline">
      <a routerLink="/agenda" class="btn btn-secondary">← Volver a contactos</a>
      <a [routerLink]="['/agenda', contactoId, 'fichas', 'nueva']" class="btn btn-primary">+ Nueva Ficha</a>
    </div>

    <div class="card">
      <div class="card-body" style="padding:0; overflow-x:auto">
        <h2 style="margin:16px 24px 0 24px">Fichas de Adhesión — Contacto #{{ contactoId }}</h2>
        @if (fichas().length === 0) {
          <div class="empty-state" style="padding:40px"><div class="empty-state-text">Sin fichas de adhesion para este contacto</div></div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Id Adhesion</th>
                <th>Fecha</th>
                <th>Fecha Salida</th>
                <th>Aporte Todo al Partido</th>
                <th>Sist. Contrib.</th>
                <th>Importe</th>
                <th>Confirmado</th>
                <th>Art. 46</th>
              </tr>
            </thead>
            <tbody>
              @for (f of fichas(); track f.id) {
                <tr class="clickable" [class.selected]="expandedId() === f.id" (click)="toggle(f.id)">
                  <td>{{ f.id }}</td>
                  <td>{{ f.fechaAdhesion || '—' }}</td>
                  <td>{{ f.fechaSalida || '—' }}</td>
                  <td>{{ f.aporteTodoAlPartido ? 'SI' : 'NO' }}</td>
                  <td>{{ f.sistContrib || '—' }}</td>
                  <td>{{ f.aporte ?? '—' }}</td>
                  <td>{{ f.aporteConfirmado === true ? 'S' : f.aporteConfirmado === false ? 'D' : '-' }}</td>
                  <td>{{ f.art46 ? 'SI' : 'NO' }}</td>
                </tr>
                @if (expandedId() === f.id && detalle()) {
                  <tr class="detalle-row">
                    <td colspan="8">
                      <div class="detalle-wrap">
                        <div class="detalle-header">
                          <h3>Ficha #{{ detalle()!.id }}</h3>
                          @if (!editMode()) {
                            <button class="btn btn-primary btn-sm" (click)="editMode.set(true); $event.stopPropagation()">Editar</button>
                          } @else {
                            <div style="display:flex; gap:8px">
                              <button class="btn btn-secondary btn-sm" (click)="cancelar(); $event.stopPropagation()">Cancelar</button>
                              <button class="btn btn-primary btn-sm" (click)="guardar(); $event.stopPropagation()">Guardar</button>
                            </div>
                          }
                        </div>
                        <div (click)="$event.stopPropagation()">
                          <app-ficha-adhesion-form
                            [ficha]="detalle()!"
                            (fichaChange)="detalle.set($event)"
                            [disabled]="!editMode()"
                            [showId]="true"
                            [sectores]="sectores()">
                          </app-ficha-adhesion-form>
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
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .detalle-wrap { padding:20px 24px; border-top:1px solid #d6dde6; }
    .detalle-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .detalle-header h3 { margin:0; font-size:16px; }
    input[disabled], select[disabled] { background:#f5f5f5; color:#333; cursor:default; }
  `]
})
export class FichasContactoComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(ContactosService);
  private adhSvc = inject(AdhesionesService);
  private titleSvc = inject(PageTitleService);
  private catSvc = inject(CatalogosService);

  contactoId!: number;
  fichas = signal<FichaAdhesion[]>([]);
  expandedId = signal<number | null>(null);
  detalle = signal<FichaAdhesionDetalle | null>(null);
  editMode = signal(false);
  private original: FichaAdhesionDetalle | null = null;

  sectores = signal<string[]>([]);

  constructor() {
    this.titleSvc.set('Fichas de Adhesión');
    this.catSvc.sectores().subscribe(list =>
      this.sectores.set(list.map(s => s.descripcion))
    );
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.svc.fichasAdhesion(this.contactoId).subscribe(x => this.fichas.set(x));
  }

  toggle(id: number) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.detalle.set(null);
      this.editMode.set(false);
      return;
    }
    this.editMode.set(false);
    this.expandedId.set(id);
    this.adhSvc.getLocal(id).subscribe(f => {
      this.normalizeDates(f);
      this.original = JSON.parse(JSON.stringify(f));
      this.detalle.set(f);
    });
  }

  private normalizeDates(f: FichaAdhesionDetalle) {
    f.fechaAdhesion = f.fechaAdhesion?.slice(0, 10);
    f.fechaSalida = f.fechaSalida?.slice(0, 10);
    f.fechaVencimiento = f.fechaVencimiento?.slice(0, 10);
    f.fechaUltimoPago = f.fechaUltimoPago?.slice(0, 10);
    f.carnetEntregado = f.carnetEntregado?.slice(0, 10);
  }

  cancelar() {
    if (this.original) this.detalle.set(JSON.parse(JSON.stringify(this.original)));
    this.editMode.set(false);
  }

  guardar() {
    const f = this.detalle();
    if (!f) return;
    // Coherencia: una Baja siempre debe llevar fecha de salida (TODO-012).
    normalizarFechaSalida(f);
    // Saneo al guardar: quita los campos condicionales que no aplican (fix 009).
    const limpia = sanitizarFichaParaGuardar(f);
    this.detalle.set({ ...limpia });
    this.adhSvc.updateLocal(limpia).subscribe(() => {
      this.original = JSON.parse(JSON.stringify(limpia));
      this.editMode.set(false);
      this.svc.fichasAdhesion(this.contactoId).subscribe(x => this.fichas.set(x));
    });
  }
}
