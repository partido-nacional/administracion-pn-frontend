import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Cartel de confirmación para acciones que no se pueden deshacer (p. ej. eliminar una
 * agrupación). Reemplaza al confirm() nativo con el mismo look de los modales de la app
 * (`.modal-backdrop`, `.nv-*` en styles.css). El contenido extra (detalle de lo que se borra)
 * se proyecta en el body.
 *
 * Uso:
 *   <app-confirm-dialog title="Eliminar agrupación" [message]="..." confirmLabel="Eliminar"
 *                       [busy]="busy()" [error]="error()" (confirm)="eliminar()" (cancel)="cerrar()">
 *   </app-confirm-dialog>
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="!busy && cancel.emit()">
      <div class="nv-modal" role="alertdialog" aria-modal="true" [attr.aria-label]="title" (click)="$event.stopPropagation()">
        <div class="nv-header">
          <div class="nv-title">{{ title }}</div>
          <button class="nv-close" type="button" (click)="cancel.emit()" [disabled]="busy">×</button>
        </div>
        <div class="nv-body">
          @if (message) { <p class="confirm-msg">{{ message }}</p> }
          <ng-content></ng-content>
          @if (error) { <div class="nv-err">{{ error }}</div> }
        </div>
        <div class="nv-footer">
          <button class="btn btn-secondary" type="button" (click)="cancel.emit()" [disabled]="busy">{{ cancelLabel }}</button>
          <button class="btn" [class.btn-danger]="danger" [class.btn-primary]="!danger" type="button"
                  (click)="confirm.emit()" [disabled]="busy">
            {{ busy ? busyLabel : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`.confirm-msg { margin: 0 0 8px; }`],
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirmar';
  @Input() message = '';
  @Input() error = '';
  @Input() busy = false;
  @Input() confirmLabel = 'Confirmar';
  @Input() busyLabel = 'Procesando…';
  @Input() cancelLabel = 'Cancelar';
  /** Botón de confirmar en rojo (acciones destructivas). */
  @Input() danger = true;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
