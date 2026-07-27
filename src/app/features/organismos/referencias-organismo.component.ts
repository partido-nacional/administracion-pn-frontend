import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { OrganismosService } from '../../core/services/organismos.service';
import { ReferenciaOrganismo } from '../../core/models/organismos';
import { PageTitleService } from '../../core/page-title.service';

/**
 * Referencias partidarias de un organismo (feature 028, solo lectura).
 * Se llega desde el botón "Referencias partidarias" de la grilla de Organismos.
 */
@Component({
  selector: 'app-referencias-organismo',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-start; margin-bottom:16px; }
  `]
})
export class ReferenciasOrganismoComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(OrganismosService);
  private titleSvc = inject(PageTitleService);

  organismoId!: number;
  items = signal<ReferenciaOrganismo[]>([]);

  constructor() {
    this.titleSvc.set('Referencias Partidarias del Organismo');
    this.organismoId = +this.route.snapshot.paramMap.get('organismoId')!;
    this.svc.getReferenciasDeOrganismo(this.organismoId).subscribe(x => this.items.set(x));
  }
}
