import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdhesionesService } from './adhesiones.service';
import { FichaAdhesionDetalle } from '../agenda/contactos.service';
import { PageTitleService } from '../../core/page-title.service';

@Component({
  selector: 'app-ficha-adhesion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (ficha()) {
      <div class="topbar-inline">
        <a [routerLink]="['/agenda', ficha()!.contactoId, 'fichas']" class="btn btn-secondary">← Volver a fichas</a>
        @if (!editMode()) {
          <button class="btn btn-primary" (click)="editMode.set(true)">Editar</button>
        } @else {
          <div style="display:flex; gap:8px">
            <button class="btn btn-secondary" (click)="cancelar()">Cancelar</button>
            <button class="btn btn-primary" (click)="guardar()">Guardar</button>
          </div>
        }
      </div>

      <div class="card">
        <div class="card-body">
          <h2 style="margin:0 0 4px 0">Ficha de Adhesión</h2>
          <p style="margin:0 0 16px 0; color:#666">{{ ficha()!.contactoNombre }} (#{{ ficha()!.contactoId }}) — Id Adhesion: {{ ficha()!.id }}</p>

          <div class="form-section"><div class="form-section-title">Datos de adhesión</div></div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Id Adhesión</label>
              <input class="form-input" [value]="ficha()!.id" disabled>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Sistema</label>
              <input class="form-input" type="date" [(ngModel)]="ficha()!.fechaAdhesion" name="fechaAdh" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Importe</label>
              <input class="form-input" type="number" [(ngModel)]="ficha()!.aporte" name="importe" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Sistema de Contribución</label>
              <select class="form-select" [(ngModel)]="ficha()!.sistContrib" name="sistContrib" [disabled]="!editMode()">
                <option value="">—</option>
                @for (s of sistemas; track s) { <option>{{ s }}</option> }
              </select>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Observaciones</label>
              <input class="form-input" [(ngModel)]="ficha()!.observaciones" name="observaciones" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Cédula responsable</label>
              <input class="form-input" [(ngModel)]="ficha()!.cedulaResponsable" name="cedResp" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono Antel</label>
              <input class="form-input" [(ngModel)]="ficha()!.telefonoAntel" name="telAntel" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Vencimiento</label>
              <input class="form-input" type="date" [(ngModel)]="ficha()!.fechaVencimiento" name="fechaVenc" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Aporte Todo al Partido</label>
              <select class="form-select" [(ngModel)]="ficha()!.aporteTodoAlPartido" name="aporteTodo" [disabled]="!editMode()">
                <option [ngValue]="true">SI</option>
                <option [ngValue]="false">NO</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Aporte a un Sector</label>
              <input class="form-input" [(ngModel)]="ficha()!.sector" name="sector" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Aporte a Secretaría/Agrupación</label>
              <input class="form-input" [(ngModel)]="ficha()!.aporteSecretariaAgrupacion" name="aporteSec" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Aporte Agrupación</label>
              <input class="form-input" [(ngModel)]="ficha()!.aporteAgrupacion" name="aporteAgr" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Departamento Agrupación</label>
              <input class="form-input" [(ngModel)]="ficha()!.departamentoAgrupacion" name="depAgr" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Código de Agrupación</label>
              <input class="form-input" [(ngModel)]="ficha()!.codigoAgrupacion" name="codAgr" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Ult. Pago</label>
              <input class="form-input" type="date" [(ngModel)]="ficha()!.fechaUltimoPago" name="fechaUltPago" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Confirmado</label>
              <select class="form-select" [(ngModel)]="ficha()!.aporteConfirmado" name="confirmado" [disabled]="!editMode()">
                <option [ngValue]="true">S</option>
                <option [ngValue]="false">N</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Art. 46</label>
              <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                <input type="checkbox" [(ngModel)]="ficha()!.art46" name="art46" [disabled]="!editMode()">
                <span>Sí</span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Departamental</label>
              <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                <input type="checkbox" [(ngModel)]="ficha()!.departamental" name="departamental" [disabled]="!editMode()">
                <span>Sí</span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de salida</label>
              <input class="form-input" type="date" [(ngModel)]="ficha()!.fechaSalida" name="fechaSalida" [disabled]="!editMode()">
            </div>
          </div>

          <div class="form-section"><div class="form-section-title">Datos de contacto en App +CERCA</div></div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Usuario</label>
              <input class="form-input" [(ngModel)]="ficha()!.cercaUsuario" name="cercaUsuario" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input class="form-input" type="password" [(ngModel)]="ficha()!.cercaContrasena" name="cercaPass" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Foja</label>
              <input class="form-input" [(ngModel)]="ficha()!.cercaFoja" name="cercaFoja" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Usuario activo</label>
              <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                <input type="checkbox" [(ngModel)]="ficha()!.cercaUsuarioActivo" name="cercaUsrAct" [disabled]="!editMode()">
                <span>Sí</span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Activo en la App</label>
              <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                <input type="checkbox" [(ngModel)]="ficha()!.cercaActivoEnApp" name="cercaActApp" [disabled]="!editMode()">
                <span>Sí</span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Con logueo</label>
              <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                <input type="checkbox" [(ngModel)]="ficha()!.cercaConLogueo" name="cercaLog" [disabled]="!editMode()">
                <span>Sí</span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-input" [(ngModel)]="ficha()!.cercaTelefono" name="cercaTel" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Celular</label>
              <input class="form-input" [(ngModel)]="ficha()!.cercaCelular" name="cercaCel" [disabled]="!editMode()">
            </div>
            <div class="form-group">
              <label class="form-label">Mail</label>
              <input class="form-input" type="email" [(ngModel)]="ficha()!.cercaMail" name="cercaMail" [disabled]="!editMode()">
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando ficha…</div></div></div></div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    input[disabled], select[disabled] { background:#f5f5f5; color:#333; cursor:default; }
  `]
})
export class FichaAdhesionComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(AdhesionesService);
  private titleSvc = inject(PageTitleService);

  ficha = signal<FichaAdhesionDetalle | null>(null);
  editMode = signal(false);
  private original: FichaAdhesionDetalle | null = null;

  sistemas = ['Antel', 'Visa', 'Master', 'OCA', 'Ebrou'];

  constructor() {
    this.titleSvc.set('Ficha de Adhesión');
    const id = +this.route.snapshot.paramMap.get('fichaId')!;
    this.svc.getLocal(id).subscribe(f => {
      this.normalizeDates(f);
      this.original = JSON.parse(JSON.stringify(f));
      this.ficha.set(f);
    });
  }

  private normalizeDates(f: FichaAdhesionDetalle) {
    f.fechaAdhesion = f.fechaAdhesion?.slice(0, 10);
    f.fechaSalida = f.fechaSalida?.slice(0, 10);
    f.fechaVencimiento = f.fechaVencimiento?.slice(0, 10);
    f.fechaUltimoPago = f.fechaUltimoPago?.slice(0, 10);
  }

  cancelar() {
    if (this.original) this.ficha.set(JSON.parse(JSON.stringify(this.original)));
    this.editMode.set(false);
  }

  guardar() {
    const f = this.ficha();
    if (!f) return;
    this.svc.updateLocal(f).subscribe(() => {
      this.original = JSON.parse(JSON.stringify(f));
      this.editMode.set(false);
    });
  }
}
