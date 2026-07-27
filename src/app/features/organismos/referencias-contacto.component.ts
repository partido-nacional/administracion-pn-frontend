import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactosService, ReferenciaPartidaria } from '../agenda/contactos.service';
import { PageTitleService } from '../../core/page-title.service';

/**
 * Referencias partidarias de un contacto (feature 028, solo lectura).
 * Se llega desde el botón "Ver referencias partidarias" del listado de contactos.
 */
@Component({
  selector: 'app-referencias-contacto',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
              </tr>
            </thead>
            <tbody>
              @for (r of items(); track r.id) {
                <tr>
                  <td><strong>{{ r.rol || '—' }}</strong></td>
                  <td>{{ r.nombreOrganismo || '—' }}</td>
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
export class ReferenciasContactoComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(ContactosService);
  private titleSvc = inject(PageTitleService);

  contactoId!: number;
  items = signal<ReferenciaPartidaria[]>([]);

  constructor() {
    this.titleSvc.set('Referencias Partidarias');
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.svc.referenciasPartidarias(this.contactoId).subscribe(x => this.items.set(x));
  }
}
