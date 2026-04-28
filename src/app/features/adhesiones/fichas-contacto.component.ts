import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactosService, FichaAdhesion } from '../agenda/contactos.service';
import { PageTitleService } from '../../core/page-title.service';

@Component({
  selector: 'app-fichas-contacto',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="topbar-inline">
      <a routerLink="/agenda" class="btn btn-secondary">← Volver a contactos</a>
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
                <th>Sector</th>
                <th>Sist. Contrib.</th>
                <th>Importe</th>
                <th>Confirmado</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (f of fichas(); track f.id) {
                <tr>
                  <td>{{ f.id }}</td>
                  <td>{{ f.fechaAdhesion || '—' }}</td>
                  <td>{{ f.sector || '—' }}</td>
                  <td>{{ f.sistContrib || '—' }}</td>
                  <td>{{ f.aporte ?? '—' }}</td>
                  <td>{{ f.aporteConfirmado ? 'S' : 'N' }}</td>
                  <td>{{ f.estado }}</td>
                  <td>
                    <a [routerLink]="['/agenda', contactoId, 'fichas', f.id]" class="btn btn-sm btn-primary">Ver Ficha</a>
                  </td>
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
export class FichasContactoComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(ContactosService);
  private titleSvc = inject(PageTitleService);

  contactoId!: number;
  fichas = signal<FichaAdhesion[]>([]);

  constructor() {
    this.titleSvc.set('Fichas de Adhesión');
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.svc.fichasAdhesion(this.contactoId).subscribe(x => this.fichas.set(x));
  }
}
