import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Overlay global de notificaciones. Se monta una sola vez (en el shell) y renderiza
 * ToastService.toasts(). Cada toast se auto-descarta o se cierra manualmente. DEBT-002.
 */
@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.error]="t.tipo==='error'" [class.success]="t.tipo==='success'"
             [class.info]="t.tipo==='info'" role="status">
          <span class="toast-ico" aria-hidden="true">
            {{ t.tipo === 'error' ? '⚠' : t.tipo === 'success' ? '✓' : 'ℹ' }}
          </span>
          <span class="toast-msg">{{ t.mensaje }}</span>
          <button type="button" class="toast-x" (click)="toast.dismiss(t.id)" aria-label="Cerrar">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toasts {
      position:fixed; top:16px; right:16px; z-index:2000;
      display:flex; flex-direction:column; gap:10px;
      max-width:min(380px, calc(100vw - 32px)); pointer-events:none;
    }
    .toast {
      pointer-events:auto; display:flex; align-items:flex-start; gap:10px;
      padding:12px 12px 12px 14px; border-radius:8px; background:#fff;
      box-shadow:0 8px 24px rgba(15,23,42,.18); border-left:4px solid #5b7186;
      font-size:13.5px; line-height:1.4; color:#17212e;
      animation:toast-in .18s ease-out;
    }
    .toast.error   { border-left-color:#c0392b; }
    .toast.success { border-left-color:#2e7d5b; }
    .toast.info    { border-left-color:#1e5aa8; }
    .toast-ico { font-weight:700; }
    .toast.error .toast-ico   { color:#c0392b; }
    .toast.success .toast-ico { color:#2e7d5b; }
    .toast.info .toast-ico    { color:#1e5aa8; }
    .toast-msg { flex:1; word-break:break-word; }
    .toast-x {
      background:transparent; border:none; cursor:pointer; color:#94a6b6;
      font-size:18px; line-height:1; padding:0 2px;
    }
    .toast-x:hover { color:#51637a; }
    @keyframes toast-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
    @media (prefers-reduced-motion:reduce) { .toast { animation:none; } }
  `]
})
export class ToastsComponent {
  toast = inject(ToastService);
}
