import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageTitleService } from '../../core/page-title.service';

@Component({
  selector: 'app-stub',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-body">
        <div class="empty-state">
          <div class="empty-state-icon">🚧</div>
          <div class="empty-state-text">Módulo <strong>{{ titulo }}</strong> — en construcción</div>
          <p style="font-size:13px;color:var(--gray-500);">Este módulo está scaffoldeado: endpoints stub en el backend y pantalla pendiente de implementación.</p>
        </div>
      </div>
    </div>
  `
})
export class StubComponent {
  titulo: string;
  constructor() {
    const route = inject(ActivatedRoute);
    const titleSvc = inject(PageTitleService);
    this.titulo = route.snapshot.data['titulo'] ?? 'Módulo';
    titleSvc.set(this.titulo);
  }
}
