import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shell reutilizable de modal de alta/edición (feature `habilitar-botones-edicion`, DEBT-014).
 * Provee backdrop + header (título/cerrar) + body (contenido proyectado + error) + footer
 * (Cancelar / Guardar con estado `busy`). Los estilos viven en `styles.css` (`.modal-backdrop`,
 * `.nv-*`, `.fg`, `.nv-grid`) para que también apliquen al contenido proyectado.
 *
 * Uso:
 *   <app-modal-form [title]="..." [busy]="busy()" [error]="error()"
 *                   [saveLabel]="editando ? 'Guardar cambios' : 'Crear'"
 *                   (save)="guardar()" (cancel)="cerrar()">
 *     <div class="nv-grid"> ...campos con .fg... </div>
 *   </app-modal-form>
 */
@Component({
  selector: 'app-modal-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="cancel.emit()">
      <div class="nv-modal" [class.wide]="wide" (click)="$event.stopPropagation()">
        <div class="nv-header">
          <div class="nv-title">{{ title }}</div>
          <button class="nv-close" type="button" (click)="cancel.emit()">×</button>
        </div>
        <div class="nv-body">
          <ng-content></ng-content>
          @if (error) { <div class="nv-err">{{ error }}</div> }
        </div>
        <div class="nv-footer">
          <button class="btn btn-secondary" type="button" (click)="cancel.emit()">{{ cancelLabel }}</button>
          <button class="btn btn-primary" type="button" (click)="save.emit()" [disabled]="busy">
            {{ busy ? busyLabel : saveLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ModalFormComponent {
  @Input() title = '';
  @Input() error = '';
  @Input() busy = false;
  @Input() saveLabel = 'Guardar';
  @Input() busyLabel = 'Guardando…';
  @Input() cancelLabel = 'Cancelar';
  /** Modal ancho (para forms grandes, p.ej. agrupaciones). */
  @Input() wide = false;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
