import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CARGOS_INTEGRANTE, opcionesConActual } from '../../core/agrupaciones-catalogos';
import { ToastService } from '../../core/services/toast.service';
import { ContactoBuscadorComponent, avisoNoAdherido, etiquetaContacto } from '../../shared/components/contacto-buscador/contacto-buscador.component';
import { ContactoListado } from '../agenda/contactos.service';

/** Integrante en edición (alta de una agrupación o edición de una pendiente), todavía sin guardar. */
export interface IntegranteEditable { contacto: ContactoListado; cargo: string; fechaIngreso: string; }

/** Fecha de hoy (local) como yyyy-MM-dd para un input date. */
export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** La lista como la espera el backend (IntegranteNuevoDto): cargo y fecha vacíos van como null. */
export function integrantesParaGuardar(lista: IntegranteEditable[]) {
  return lista.map(i => ({
    contactoId: i.contacto.id,
    cargo: i.cargo.trim() || null,
    fechaIngreso: i.fechaIngreso || null,
  }));
}

/**
 * Carga de integrantes de una agrupación: buscador de contactos + tabla con Adh. (si está adherido,
 * requisito para abrir una agrupación), Cargo, Fecha de ingreso y Quitar. Un no adherido se marca
 * pero se puede cargar igual. La lista la guarda el componente padre junto con la agrupación.
 */
@Component({
  selector: 'app-integrantes-editor',
  standalone: true,
  imports: [FormsModule, ContactoBuscadorComponent],
  template: `
    <div class="ie-buscar">
      <label>Agregar contacto</label>
      <app-contacto-buscador (seleccionar)="agregar($event)"></app-contacto-buscador>
    </div>
    @if (integrantes.length > 0) {
      <table class="ie-table">
        <thead><tr><th>Contacto</th><th class="c">Adh.</th><th>Cargo</th><th>Fecha ingreso</th><th></th></tr></thead>
        <tbody>
          @for (i of integrantes; track i.contacto.id) {
            <tr [class.no-adh]="!!aviso(i.contacto)">
              <td>
                {{ etiqueta(i.contacto) }}
                @if (aviso(i.contacto); as a) { <span class="aviso-adh">{{ a }}</span> }
              </td>
              <td class="c">
                <input type="checkbox" class="adh" disabled [checked]="i.contacto.adherente === true"
                       [attr.aria-label]="'Adherido: ' + etiqueta(i.contacto)">
              </td>
              <td>
                <select [(ngModel)]="i.cargo" [name]="'int-cargo-' + i.contacto.id" aria-label="Cargo">
                  <option value="">—</option>
                  @for (o of opcionesConActual(cargos, i.cargo); track o) { <option [ngValue]="o">{{ o }}</option> }
                </select>
              </td>
              <td><input type="date" [(ngModel)]="i.fechaIngreso" [name]="'int-fi-' + i.contacto.id" aria-label="Fecha ingreso"></td>
              <td><button type="button" class="btn btn-sm btn-secondary" (click)="quitar(i.contacto.id)">Quitar</button></td>
            </tr>
          }
        </tbody>
      </table>
      <p class="ie-resumen" [class.falta]="adheridos() < integrantes.length">
        Adheridos: {{ adheridos() }} de {{ integrantes.length }}
      </p>
    }
  `,
  styles: [`
    .ie-buscar label { display:block; font-size:12px; color:#555; margin-bottom:4px; }
    .ie-table { width:100%; border-collapse:collapse; font-size:13px; margin-top:8px; }
    .ie-table th, .ie-table td { border-bottom:1px solid #eef1f5; padding:6px 8px; text-align:left; }
    .ie-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    .ie-table .c { text-align:center; width:48px; }
    .ie-table input:not([type=checkbox]), .ie-table select { width:100%; box-sizing:border-box; padding:5px 8px; font-size:13px; border:1px solid #cfd6e0; border-radius:5px; }
    .ie-table tr.no-adh td { background:#fffbea; }
    .adh { width:16px; height:16px; accent-color:#1f6f3b; }
    .aviso-adh { display:inline-block; margin-left:6px; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:600; color:#8a5a00; background:#fff3cd; border:1px solid #f0d58a; }
    .ie-resumen { font-size:12px; color:#1f6f3b; margin:6px 0 0; }
    .ie-resumen.falta { color:#8a5a00; }
  `],
})
export class IntegrantesEditorComponent {
  private toast = inject(ToastService);

  @Input() integrantes: IntegranteEditable[] = [];
  @Output() integrantesChange = new EventEmitter<IntegranteEditable[]>();

  readonly cargos = CARGOS_INTEGRANTE;
  readonly opcionesConActual = opcionesConActual;
  readonly etiqueta = etiquetaContacto;
  readonly aviso = avisoNoAdherido;

  adheridos(): number {
    return this.integrantes.filter(i => i.contacto.adherente === true).length;
  }

  agregar(c: ContactoListado) {
    if (this.integrantes.some(i => i.contacto.id === c.id)) {
      this.toast.error(`${etiquetaContacto(c)} ya está en la lista.`);
      return;
    }
    this.emitir([...this.integrantes, { contacto: c, cargo: '', fechaIngreso: hoyIso() }]);
  }

  quitar(contactoId: number) {
    this.emitir(this.integrantes.filter(i => i.contacto.id !== contactoId));
  }

  private emitir(lista: IntegranteEditable[]) {
    this.integrantes = lista;
    this.integrantesChange.emit(lista);
  }
}
