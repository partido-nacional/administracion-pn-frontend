import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FichaAdhesionDetalle } from '../../features/agenda/contactos.service';
import {
  SISTEMAS, DEPARTAMENTOS, APORTES_SEC_AGR,
  showTelefonoAntel, showCedula, showFechasPago,
  applySistContrib, applyAporteTodo,
} from './ficha-adhesion.constants';
import { resolverConfirmado } from './confirmado-baja.util';

/**
 * Formulario presentacional de ficha de adhesión, compartido entre el alta
 * (`nueva-ficha`, siempre editable) y la edición en fila expandible
 * (`fichas-contacto`, con `disabled` según el modo edición).
 *
 * Two-way sobre la ficha vía `model()`: los campos que gatillan reglas
 * (sistema de contribución, aporte-todo, confirmado) delegan en las funciones
 * puras de `ficha-adhesion.constants` y reemiten la ficha; los campos simples
 * se editan in-place sobre el mismo objeto (mismo patrón que antes).
 */
@Component({
  selector: 'app-ficha-adhesion-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-grid">
      @if (showId()) {
        <div class="form-group">
          <label class="form-label">Id Adhesión</label>
          <input class="form-input" [value]="ficha().id" disabled>
        </div>
      }
      <div class="form-group">
        <label class="form-label">Fecha de Sistema</label>
        <input class="form-input" type="date" [(ngModel)]="ficha().fechaAdhesion" name="fechaAdh" [disabled]="disabled()">
      </div>
      <div class="form-group">
        <label class="form-label">Importe</label>
        <input class="form-input" type="number" [(ngModel)]="ficha().aporte" name="importe" [disabled]="disabled()">
      </div>
      <div class="form-group">
        <label class="form-label">Sistema de Contribución</label>
        <select class="form-select" [ngModel]="ficha().sistContrib" (ngModelChange)="onSistContribChange($event)" name="sistContrib" [disabled]="disabled()">
          @for (s of sistemas; track s) { <option [ngValue]="s">{{ s }}</option> }
        </select>
      </div>
      <div class="form-group full-width">
        <label class="form-label">Observaciones</label>
        <input class="form-input" [(ngModel)]="ficha().observaciones" name="observaciones" [disabled]="disabled()">
      </div>
      @if (showCedula(ficha().sistContrib)) {
        <div class="form-group">
          <label class="form-label">Cédula responsable</label>
          <input class="form-input" [(ngModel)]="ficha().cedulaResponsable" name="cedResp" [disabled]="disabled()">
        </div>
      }
      @if (showTelefonoAntel(ficha().sistContrib)) {
        <div class="form-group">
          <label class="form-label">Teléfono Antel</label>
          <input class="form-input" [(ngModel)]="ficha().telefonoAntel" name="telAntel" [disabled]="disabled()">
        </div>
      }
      @if (showFechasPago(ficha().sistContrib)) {
        <div class="form-group">
          <label class="form-label">Fecha Vencimiento</label>
          <input class="form-input" type="date" [(ngModel)]="ficha().fechaVencimiento" name="fechaVenc" [disabled]="disabled()">
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Ult. Pago</label>
          <input class="form-input" type="date" [(ngModel)]="ficha().fechaUltimoPago" name="fechaUltPago" [disabled]="disabled()">
        </div>
      }
      <div class="form-group">
        <label class="form-label">Aporte Todo al Partido</label>
        <select class="form-select" [ngModel]="ficha().aporteTodoAlPartido" (ngModelChange)="onAporteTodoChange($event)" name="aporteTodo" [disabled]="disabled()">
          <option [ngValue]="true">SI</option>
          <option [ngValue]="false">NO</option>
        </select>
      </div>
      @if (!ficha().aporteTodoAlPartido) {
        <div class="form-group">
          <label class="form-label">Aporte a un Sector</label>
          <select class="form-select" [(ngModel)]="ficha().sector" name="sector" [disabled]="disabled()">
            <option [ngValue]="undefined">-</option>
            @for (s of sectores(); track s) { <option [ngValue]="s">{{ s }}</option> }
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Aporte a Secretaría/Agrupación</label>
          <select class="form-select" [(ngModel)]="ficha().aporteSecretariaAgrupacion" name="aporteSec" [disabled]="disabled()">
            <option [ngValue]="undefined">-</option>
            @for (a of aportesSecAgr; track a) { <option [ngValue]="a">{{ a }}</option> }
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Aporte Agrupación</label>
          <input class="form-input" [(ngModel)]="ficha().aporteAgrupacion" name="aporteAgr" [disabled]="disabled()">
        </div>
        <div class="form-group">
          <label class="form-label">Departamento Agrupación</label>
          <select class="form-select" [(ngModel)]="ficha().departamentoAgrupacion" name="depAgr" [disabled]="disabled()">
            <option [ngValue]="undefined">-</option>
            @for (d of departamentos; track d) { <option [ngValue]="d">{{ d }}</option> }
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Código de Agrupación</label>
          <input class="form-input" [(ngModel)]="ficha().codigoAgrupacion" name="codAgr" [disabled]="disabled()">
        </div>
      }
      <div class="form-group">
        <label class="form-label">Confirmado</label>
        <select class="form-select" [ngModel]="ficha().aporteConfirmado" (ngModelChange)="onConfirmadoChange($event)" name="confirmado" [disabled]="disabled()">
          <option [ngValue]="null">-</option>
          <option [ngValue]="false">D</option>
          <option [ngValue]="true">S</option>
        </select>
      </div>
      @if (ficha().aporteConfirmado === false) {
        <div class="form-group">
          <label class="form-label">Fecha de salida</label>
          <input class="form-input" type="date" [(ngModel)]="ficha().fechaSalida" name="fechaSalidaCond" [disabled]="disabled()">
        </div>
      }
      <div class="form-group">
        <label class="form-label">Carnet Entregado</label>
        <input class="form-input" type="date" [(ngModel)]="ficha().carnetEntregado" name="carnetEntregado" [disabled]="disabled()">
      </div>
      <div class="form-group">
        <label class="form-label">Art. 46</label>
        <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
          <input type="checkbox" [(ngModel)]="ficha().art46" name="art46" [disabled]="disabled()">
          <span>Sí</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">Departamental</label>
        <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
          <input type="checkbox" [(ngModel)]="ficha().departamental" name="departamental" [disabled]="disabled()">
          <span>Sí</span>
        </label>
      </div>
    </div>
  `,
  styles: [`
    input[disabled], select[disabled] { background:#f5f5f5; color:#333; cursor:default; }
  `]
})
export class FichaAdhesionFormComponent {
  /** Ficha editable (two-way). Los cambios que gatillan reglas reemiten vía model. */
  ficha = model.required<FichaAdhesionDetalle>();
  /** Deshabilita todos los campos (modo lectura). */
  disabled = input<boolean>(false);
  /** Muestra el campo "Id Adhesión" (solo en la edición de una ficha existente). */
  showId = input<boolean>(false);
  /** Sectores del catálogo, provistos por el padre. */
  sectores = input<string[]>([]);

  sistemas = SISTEMAS;
  departamentos = DEPARTAMENTOS;
  aportesSecAgr = APORTES_SEC_AGR;

  showTelefonoAntel = showTelefonoAntel;
  showCedula = showCedula;
  showFechasPago = showFechasPago;

  onSistContribChange(s: string) {
    this.ficha.set(applySistContrib(this.ficha(), s));
  }

  onAporteTodoChange(v: boolean) {
    this.ficha.set(applyAporteTodo(this.ficha(), v));
  }

  onConfirmadoChange(v: boolean | null) {
    // Sin window.prompt: la Baja prellena la fecha de salida (o conserva la
    // existente) y queda editable inline en el <input type="date">. (TODO-012)
    const f = this.ficha();
    this.ficha.set({ ...f, ...resolverConfirmado(v, f.fechaSalida) });
  }
}
