import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactosService, FichaAdhesion, FichaAdhesionDetalle } from '../agenda/contactos.service';
import { AdhesionesService } from './adhesiones.service';
import { PageTitleService } from '../../core/page-title.service';

@Component({
  selector: 'app-fichas-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="topbar-inline">
      <a routerLink="/agenda" class="btn btn-secondary">← Volver a contactos</a>
      <a [routerLink]="['/agenda', contactoId, 'fichas', 'nueva']" class="btn btn-primary">+ Nueva Ficha</a>
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
                <th>Fecha Salida</th>
                <th>Sector</th>
                <th>Sist. Contrib.</th>
                <th>Importe</th>
                <th>Confirmado</th>
              </tr>
            </thead>
            <tbody>
              @for (f of fichas(); track f.id) {
                <tr class="clickable" [class.selected]="expandedId() === f.id" (click)="toggle(f.id)">
                  <td>{{ f.id }}</td>
                  <td>{{ f.fechaAdhesion || '—' }}</td>
                  <td>{{ f.fechaSalida || '—' }}</td>
                  <td>{{ f.sector || '—' }}</td>
                  <td>{{ f.sistContrib || '—' }}</td>
                  <td>{{ f.aporte ?? '—' }}</td>
                  <td>{{ f.aporteConfirmado === true ? 'S' : f.aporteConfirmado === false ? 'N' : '-' }}</td>
                </tr>
                @if (expandedId() === f.id && detalle()) {
                  <tr class="detalle-row">
                    <td colspan="7">
                      <div class="detalle-wrap">
                        <div class="detalle-header">
                          <h3>Ficha #{{ detalle()!.id }}</h3>
                          @if (!editMode()) {
                            <button class="btn btn-primary btn-sm" (click)="editMode.set(true); $event.stopPropagation()">Editar</button>
                          } @else {
                            <div style="display:flex; gap:8px">
                              <button class="btn btn-secondary btn-sm" (click)="cancelar(); $event.stopPropagation()">Cancelar</button>
                              <button class="btn btn-primary btn-sm" (click)="guardar(); $event.stopPropagation()">Guardar</button>
                            </div>
                          }
                        </div>
                        <div class="form-grid" (click)="$event.stopPropagation()">
                          <div class="form-group">
                            <label class="form-label">Id Adhesión</label>
                            <input class="form-input" [value]="detalle()!.id" disabled>
                          </div>
                          <div class="form-group">
                            <label class="form-label">Fecha de Sistema</label>
                            <input class="form-input" type="date" [(ngModel)]="detalle()!.fechaAdhesion" name="fechaAdh" [disabled]="!editMode()">
                          </div>
                          <div class="form-group">
                            <label class="form-label">Importe</label>
                            <input class="form-input" type="number" [(ngModel)]="detalle()!.aporte" name="importe" [disabled]="!editMode()">
                          </div>
                          <div class="form-group">
                            <label class="form-label">Sistema de Contribución</label>
                            <select class="form-select" [ngModel]="detalle()!.sistContrib" (ngModelChange)="onSistContribChange($event)" name="sistContrib" [disabled]="!editMode()">
                              @for (s of sistemas; track s) { <option [ngValue]="s">{{ s }}</option> }
                            </select>
                          </div>
                          <div class="form-group full-width">
                            <label class="form-label">Observaciones</label>
                            <input class="form-input" [(ngModel)]="detalle()!.observaciones" name="observaciones" [disabled]="!editMode()">
                          </div>
                          @if (showCedula(detalle()!.sistContrib)) {
                            <div class="form-group">
                              <label class="form-label">Cédula responsable</label>
                              <input class="form-input" [(ngModel)]="detalle()!.cedulaResponsable" name="cedResp" [disabled]="!editMode()">
                            </div>
                          }
                          @if (showTelefonoAntel(detalle()!.sistContrib)) {
                            <div class="form-group">
                              <label class="form-label">Teléfono Antel</label>
                              <input class="form-input" [(ngModel)]="detalle()!.telefonoAntel" name="telAntel" [disabled]="!editMode()">
                            </div>
                          }
                          @if (showFechasPago(detalle()!.sistContrib)) {
                            <div class="form-group">
                              <label class="form-label">Fecha Vencimiento</label>
                              <input class="form-input" type="date" [(ngModel)]="detalle()!.fechaVencimiento" name="fechaVenc" [disabled]="!editMode()">
                            </div>
                            <div class="form-group">
                              <label class="form-label">Fecha Ult. Pago</label>
                              <input class="form-input" type="date" [(ngModel)]="detalle()!.fechaUltimoPago" name="fechaUltPago" [disabled]="!editMode()">
                            </div>
                          }
                          <div class="form-group">
                            <label class="form-label">Aporte Todo al Partido</label>
                            <select class="form-select" [ngModel]="detalle()!.aporteTodoAlPartido" (ngModelChange)="onAporteTodoChange($event)" name="aporteTodo" [disabled]="!editMode()">
                              <option [ngValue]="true">SI</option>
                              <option [ngValue]="false">NO</option>
                            </select>
                          </div>
                          @if (!detalle()!.aporteTodoAlPartido) {
                            <div class="form-group">
                              <label class="form-label">Aporte a un Sector</label>
                              <select class="form-select" [(ngModel)]="detalle()!.sector" name="sector" [disabled]="!editMode()">
                                <option [ngValue]="undefined">-</option>
                                @for (s of sectores; track s) { <option [ngValue]="s">{{ s }}</option> }
                              </select>
                            </div>
                            <div class="form-group">
                              <label class="form-label">Aporte a Secretaría/Agrupación</label>
                              <select class="form-select" [(ngModel)]="detalle()!.aporteSecretariaAgrupacion" name="aporteSec" [disabled]="!editMode()">
                                <option [ngValue]="undefined">-</option>
                                @for (a of aportesSecAgr; track a) { <option [ngValue]="a">{{ a }}</option> }
                              </select>
                            </div>
                            <div class="form-group">
                              <label class="form-label">Aporte Agrupación</label>
                              <input class="form-input" [(ngModel)]="detalle()!.aporteAgrupacion" name="aporteAgr" [disabled]="!editMode()">
                            </div>
                            <div class="form-group">
                              <label class="form-label">Departamento Agrupación</label>
                              <select class="form-select" [(ngModel)]="detalle()!.departamentoAgrupacion" name="depAgr" [disabled]="!editMode()">
                                <option [ngValue]="undefined">-</option>
                                @for (d of departamentos; track d) { <option [ngValue]="d">{{ d }}</option> }
                              </select>
                            </div>
                            <div class="form-group">
                              <label class="form-label">Código de Agrupación</label>
                              <input class="form-input" [(ngModel)]="detalle()!.codigoAgrupacion" name="codAgr" [disabled]="!editMode()">
                            </div>
                          }
                          <div class="form-group">
                            <label class="form-label">Confirmado</label>
                            <select class="form-select" [(ngModel)]="detalle()!.aporteConfirmado" name="confirmado" [disabled]="!editMode()">
                              <option [ngValue]="null">-</option>
                              <option [ngValue]="false">N</option>
                              <option [ngValue]="true">S</option>
                            </select>
                          </div>
                          <div class="form-group">
                            <label class="form-label">Carnet Entregado</label>
                            <input class="form-input" type="date" [(ngModel)]="detalle()!.carnetEntregado" name="carnetEntregado" [disabled]="!editMode()">
                          </div>
                          <div class="form-group">
                            <label class="form-label">Art. 46</label>
                            <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                              <input type="checkbox" [(ngModel)]="detalle()!.art46" name="art46" [disabled]="!editMode()">
                              <span>Sí</span>
                            </label>
                          </div>
                          <div class="form-group">
                            <label class="form-label">Departamental</label>
                            <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                              <input type="checkbox" [(ngModel)]="detalle()!.departamental" name="departamental" [disabled]="!editMode()">
                              <span>Sí</span>
                            </label>
                          </div>
                          <div class="form-group">
                            <label class="form-label">Fecha de salida</label>
                            <input class="form-input" type="date" [(ngModel)]="detalle()!.fechaSalida" name="fechaSalida" [disabled]="!editMode()">
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .detalle-wrap { padding:20px 24px; border-top:1px solid #d6dde6; }
    .detalle-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .detalle-header h3 { margin:0; font-size:16px; }
    input[disabled], select[disabled] { background:#f5f5f5; color:#333; cursor:default; }
  `]
})
export class FichasContactoComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(ContactosService);
  private adhSvc = inject(AdhesionesService);
  private titleSvc = inject(PageTitleService);

  contactoId!: number;
  fichas = signal<FichaAdhesion[]>([]);
  expandedId = signal<number | null>(null);
  detalle = signal<FichaAdhesionDetalle | null>(null);
  editMode = signal(false);
  private original: FichaAdhesionDetalle | null = null;

  sistemas = ['Antel', 'OCA', 'VISA', 'MASTER', 'EBROU', 'ANUAL', 'Otro'];
  departamentos = [
    'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
    'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
    'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres', 'Nacional'
  ];
  aportesSecAgr = [
    'Agrupacion', 'SAS', 'CNJ', 'Centro Josefa Oribe', 'CEPN',
    'Comision Departamental', 'C. Cultura', 'Movimiento Afro-Nacionalista (MAN)'
  ];
  sectores = [
    'ALIANZA NACIONAL', 'TODO POR EL PUEBLO', 'AIRE FRESCO', 'MEJOR PAIS',
    'D CENTRO', 'ESPACIO 40', 'HERRERISMO', 'POR LA PATRIA'
  ];

  showTelefonoAntel(s?: string) { return s === 'Antel'; }
  showCedula(s?: string) { return s === 'OCA' || s === 'VISA' || s === 'MASTER' || s === 'EBROU'; }
  showFechasPago(s?: string) { return s === 'ANUAL'; }

  onSistContribChange(s: string) {
    const f = this.detalle();
    if (!f) return;
    f.sistContrib = s;
    if (!this.showTelefonoAntel(s)) f.telefonoAntel = undefined;
    if (!this.showCedula(s)) f.cedulaResponsable = undefined;
    if (!this.showFechasPago(s)) { f.fechaVencimiento = undefined; f.fechaUltimoPago = undefined; }
    this.detalle.set({ ...f });
  }

  onAporteTodoChange(v: boolean) {
    const f = this.detalle();
    if (!f) return;
    f.aporteTodoAlPartido = v;
    if (v) {
      f.sector = undefined;
      f.aporteSecretariaAgrupacion = undefined;
      f.aporteAgrupacion = undefined;
      f.departamentoAgrupacion = undefined;
      f.codigoAgrupacion = undefined;
    }
    this.detalle.set({ ...f });
  }

  constructor() {
    this.titleSvc.set('Fichas de Adhesión');
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.svc.fichasAdhesion(this.contactoId).subscribe(x => this.fichas.set(x));
  }

  toggle(id: number) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.detalle.set(null);
      this.editMode.set(false);
      return;
    }
    this.editMode.set(false);
    this.expandedId.set(id);
    this.adhSvc.getLocal(id).subscribe(f => {
      this.normalizeDates(f);
      this.original = JSON.parse(JSON.stringify(f));
      this.detalle.set(f);
    });
  }

  private normalizeDates(f: FichaAdhesionDetalle) {
    f.fechaAdhesion = f.fechaAdhesion?.slice(0, 10);
    f.fechaSalida = f.fechaSalida?.slice(0, 10);
    f.fechaVencimiento = f.fechaVencimiento?.slice(0, 10);
    f.fechaUltimoPago = f.fechaUltimoPago?.slice(0, 10);
    f.carnetEntregado = f.carnetEntregado?.slice(0, 10);
  }

  cancelar() {
    if (this.original) this.detalle.set(JSON.parse(JSON.stringify(this.original)));
    this.editMode.set(false);
  }

  guardar() {
    const f = this.detalle();
    if (!f) return;
    this.adhSvc.updateLocal(f).subscribe(() => {
      this.original = JSON.parse(JSON.stringify(f));
      this.editMode.set(false);
      this.svc.fichasAdhesion(this.contactoId).subscribe(x => this.fichas.set(x));
    });
  }
}
