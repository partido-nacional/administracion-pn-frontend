import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ListState = 'loading' | 'error' | 'empty' | 'ready';

/**
 * Envoltorio de estado para vistas de listado: muestra cargando / vacío / error
 * y proyecta el contenido real (la tabla) cuando el estado es 'ready'. Reutilizable
 * — evita el copy-paste de estados por vista (DEBT-002 / AC-11).
 *
 * Uso:
 *   <app-list-state [state]="state()" emptyText="Sin resultados" (retry)="cargar()">
 *     <table>…</table>
 *   </app-list-state>
 */
@Component({
  selector: 'app-list-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (state) {
      @case ('loading') {
        <div class="ls ls-loading" role="status" aria-live="polite">
          <span class="ls-spinner" aria-hidden="true"></span>
          <span class="ls-text">Cargando…</span>
        </div>
      }
      @case ('error') {
        <div class="ls ls-error" role="alert">
          <span class="ls-text">{{ errorText }}</span>
          <button type="button" class="ls-retry" (click)="retry.emit()">Reintentar</button>
        </div>
      }
      @case ('empty') {
        <div class="ls ls-empty">
          <span class="ls-text">{{ emptyText }}</span>
        </div>
      }
      @default {
        <ng-content></ng-content>
      }
    }
  `,
  styles: [`
    .ls { display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:12px; padding:40px 20px; text-align:center; color:#51637a; }
    .ls-text { font-size:14px; }
    .ls-error .ls-text { color:#a8261b; }
    .ls-spinner { width:26px; height:26px; border-radius:50%;
      border:3px solid #d6e0ec; border-top-color:#1e5aa8; animation:ls-spin .8s linear infinite; }
    .ls-retry { font-family:inherit; font-size:13px; font-weight:600; cursor:pointer;
      color:#1e5aa8; background:#fff; border:1px solid #cfd6e0; border-radius:6px; padding:7px 16px; }
    .ls-retry:hover { background:#f5f8ff; }
    @keyframes ls-spin { to { transform:rotate(360deg); } }
    @media (prefers-reduced-motion:reduce) { .ls-spinner { animation:none; } }
  `]
})
export class ListStateComponent {
  @Input() state: ListState = 'ready';
  @Input() emptyText = 'Sin resultados';
  @Input() errorText = 'No se pudieron cargar los datos.';
  @Output() retry = new EventEmitter<void>();
}
