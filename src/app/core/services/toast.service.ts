import { Injectable, signal } from '@angular/core';
import { Toast, ToastTipo } from '../models/toast';

/**
 * Estado central de notificaciones (toasts). Lo alimenta el httpErrorInterceptor
 * (errores) y los componentes (éxito). El overlay <app-toasts> lo renderiza. Ver
 * backlog DEBT-002.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** ms hasta el auto-descarte de un toast. */
  private static readonly TIMEOUT = 5000;
  /** máximo de toasts visibles a la vez (evita ráfagas — EC-2). */
  private static readonly MAX_VISIBLES = 4;

  private seq = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  error(mensaje: string) { this.push('error', mensaje); }
  success(mensaje: string) { this.push('success', mensaje); }
  info(mensaje: string) { this.push('info', mensaje); }

  dismiss(id: number) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(tipo: ToastTipo, mensaje: string) {
    const texto = (mensaje ?? '').trim();
    if (!texto) return;
    const id = ++this.seq;
    this._toasts.update(list => {
      const next = [...list, { id, tipo, mensaje: texto }];
      // conserva los últimos MAX_VISIBLES
      return next.slice(-ToastService.MAX_VISIBLES);
    });
    setTimeout(() => this.dismiss(id), ToastService.TIMEOUT);
  }
}
