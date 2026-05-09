import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactosService, FichaAdhesionDetalle } from '../agenda/contactos.service';
import { AdhesionesService } from './adhesiones.service';
import { PageTitleService } from '../../core/page-title.service';

const SISTEMAS = ['Antel', 'OCA', 'VISA', 'MASTER', 'EBROU', 'ANUAL', 'Otro'];
const DEPARTAMENTOS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
  'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
  'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres', 'Nacional'
];

@Component({
  selector: 'app-nueva-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="topbar-inline">
      <a [routerLink]="['/agenda', contactoId, 'fichas']" class="btn btn-secondary">← Cancelar</a>
    </div>

    @if (ficha()) {
      <div class="card">
        <div class="card-body">
          <h2 style="margin:0 0 4px 0">Nueva Ficha de Adhesión</h2>
          <p style="margin:0 0 16px 0; color:#666">Contacto: <strong>{{ contactoNombre() }}</strong> (#{{ contactoId }})</p>

          <div class="form-section"><div class="form-section-title">Datos de adhesión</div></div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Fecha de Sistema</label>
              <input class="form-input" type="date" [(ngModel)]="ficha()!.fechaAdhesion" name="fechaAdh">
            </div>
            <div class="form-group">
              <label class="form-label">Importe</label>
              <input class="form-input" type="number" [(ngModel)]="ficha()!.aporte" name="importe">
            </div>
            <div class="form-group">
              <label class="form-label">Sistema de Contribución</label>
              <select class="form-select" [(ngModel)]="ficha()!.sistContrib" name="sistContrib">
                <option [ngValue]="undefined">—</option>
                @for (s of sistemas; track s) { <option [ngValue]="s">{{ s }}</option> }
              </select>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Observaciones</label>
              <input class="form-input" [(ngModel)]="ficha()!.observaciones" name="observaciones">
            </div>
            <div class="form-group">
              <label class="form-label">Cédula responsable</label>
              <input class="form-input" [(ngModel)]="ficha()!.cedulaResponsable" name="cedResp">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono Antel</label>
              <input class="form-input" [(ngModel)]="ficha()!.telefonoAntel" name="telAntel">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Vencimiento</label>
              <input class="form-input" type="date" [(ngModel)]="ficha()!.fechaVencimiento" name="fechaVenc">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Ult. Pago</label>
              <input class="form-input" type="date" [(ngModel)]="ficha()!.fechaUltimoPago" name="fechaUltPago">
            </div>
            <div class="form-group">
              <label class="form-label">Aporte Todo al Partido</label>
              <select class="form-select" [(ngModel)]="ficha()!.aporteTodoAlPartido" name="aporteTodo">
                <option [ngValue]="true">SI</option>
                <option [ngValue]="false">NO</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Aporte a un Sector</label>
              <input class="form-input" [(ngModel)]="ficha()!.sector" name="sector">
            </div>
            <div class="form-group">
              <label class="form-label">Aporte a Secretaría/Agrupación</label>
              <input class="form-input" [(ngModel)]="ficha()!.aporteSecretariaAgrupacion" name="aporteSec">
            </div>
            <div class="form-group">
              <label class="form-label">Aporte Agrupación</label>
              <input class="form-input" [(ngModel)]="ficha()!.aporteAgrupacion" name="aporteAgr">
            </div>
            <div class="form-group">
              <label class="form-label">Departamento Agrupación</label>
              <select class="form-select" [(ngModel)]="ficha()!.departamentoAgrupacion" name="depAgr">
                <option [ngValue]="undefined">-</option>
                @for (d of departamentos; track d) { <option [ngValue]="d">{{ d }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Código de Agrupación</label>
              <input class="form-input" [(ngModel)]="ficha()!.codigoAgrupacion" name="codAgr">
            </div>
            <div class="form-group">
              <label class="form-label">Confirmado</label>
              <select class="form-select" [(ngModel)]="ficha()!.aporteConfirmado" name="confirmado">
                <option [ngValue]="null">-</option>
                <option [ngValue]="false">N</option>
                <option [ngValue]="true">S</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Carnet Entregado</label>
              <input class="form-input" type="date" [(ngModel)]="ficha()!.carnetEntregado" name="carnetEntregado">
            </div>
            <div class="form-group">
              <label class="form-label">Art. 46</label>
              <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                <input type="checkbox" [(ngModel)]="ficha()!.art46" name="art46">
                <span>Sí</span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Departamental</label>
              <label style="display:flex; align-items:center; gap:8px; padding-top:8px">
                <input type="checkbox" [(ngModel)]="ficha()!.departamental" name="departamental">
                <span>Sí</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" (click)="guardar()">Crear ficha</button>
            <a [routerLink]="['/agenda', contactoId, 'fichas']" class="btn btn-secondary">Cancelar</a>
          </div>
        </div>
      </div>
    } @else {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando datos del contacto…</div></div></div></div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-start; margin-bottom:16px; }
  `]
})
export class NuevaFichaComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactosSvc = inject(ContactosService);
  private adhSvc = inject(AdhesionesService);
  private titleSvc = inject(PageTitleService);

  contactoId!: number;
  contactoNombre = signal<string>('');
  ficha = signal<FichaAdhesionDetalle | null>(null);

  sistemas = SISTEMAS;
  departamentos = DEPARTAMENTOS;

  constructor() {
    this.titleSvc.set('Nueva Ficha de Adhesión');
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.contactosSvc.get(this.contactoId).subscribe(c => {
      this.contactoNombre.set(`${c.apellido}, ${c.nombre}`);
      const today = new Date().toISOString().slice(0, 10);
      const dep = c.departamento && DEPARTAMENTOS.includes(c.departamento) ? c.departamento : undefined;
      this.ficha.set({
        id: 0,
        contactoId: this.contactoId,
        contactoNombre: `${c.nombre} ${c.apellido}`,
        sector: undefined,
        sistContrib: undefined,
        aporte: undefined,
        fechaAdhesion: today,
        fechaSalida: undefined,
        aporteConfirmado: null,
        art46: false,
        titularResponsable: `${c.nombre} ${c.apellido}`,
        observaciones: undefined,
        aporteTodoAlPartido: true,
        aporteSecretariaAgrupacion: undefined,
        aporteAgrupacion: undefined,
        departamentoAgrupacion: dep,
        departamental: false,
        cedulaResponsable: c.documento,
        codigoAgrupacion: undefined,
        telefonoAntel: c.telefono ?? c.celular,
        fechaVencimiento: undefined,
        fechaUltimoPago: undefined,
        carnetEntregado: undefined
      });
    });
  }

  guardar() {
    const f = this.ficha();
    if (!f) return;
    this.adhSvc.createLocal(f).subscribe(() => {
      this.router.navigate(['/agenda', this.contactoId, 'fichas']);
    });
  }
}
