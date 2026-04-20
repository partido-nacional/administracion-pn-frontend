import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Resumen {
  contactos: number;
  adhesionesWebPendientes: number;
  adhesionesLocales: number;
  productos: number;
  ventasMes: number;
  donacionesMes: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ resumen()?.contactos ?? '—' }}</div>
        <div class="stat-label">Contactos en Agenda</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ resumen()?.adhesionesWebPendientes ?? '—' }}</div>
        <div class="stat-label">Adhesiones Web Pendientes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ resumen()?.adhesionesLocales ?? '—' }}</div>
        <div class="stat-label">Adhesiones Locales</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ resumen()?.productos ?? '—' }}</div>
        <div class="stat-label">Productos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ resumen()?.ventasMes ?? '—' }}</div>
        <div class="stat-label">Ventas este mes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">\${{ resumen()?.donacionesMes ?? 0 }}</div>
        <div class="stat-label">Donaciones este mes</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Agenda del Partido</h2>
      </div>
      <div class="card-body">
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-text">Calendario próximamente.</div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  private http = inject(HttpClient);
  private title = inject(PageTitleService);
  resumen = signal<Resumen | null>(null);

  constructor() {
    this.title.set('Inicio');
    this.http.get<Resumen>(`${environment.apiUrl}/dashboard/resumen`).subscribe(r => this.resumen.set(r));
  }
}
