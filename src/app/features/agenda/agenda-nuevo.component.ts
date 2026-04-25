import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ContactosService, Contacto } from './contactos.service';
import { PageTitleService } from '../../core/page-title.service';

@Component({
  selector: 'app-agenda-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="guardar()" #f="ngForm">
      <div class="card">
        <div class="card-body">
          <div class="form-section"><div class="form-section-title">Datos personales</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Cortesía</label>
              <select class="form-select" name="cortesia" [(ngModel)]="c.cortesia">
                <option value="">—</option><option>Sr.</option><option>Sra.</option><option>Srta.</option>
                <option>Dr.</option><option>Dra.</option><option>Ing.</option><option>Lic.</option>
                <option>Esc.</option><option>Cr.</option><option>Cra.</option><option>Prof.</option>
              </select></div>
            <div class="form-group"><label class="form-label">Nombre *</label><input class="form-input" name="nombre" [(ngModel)]="c.nombre" required></div>
            <div class="form-group"><label class="form-label">Apellido *</label><input class="form-input" name="apellido" [(ngModel)]="c.apellido" required></div>
            <div class="form-group">
              <label class="form-label">Cedula</label>
              <input class="form-input" name="documento" [(ngModel)]="c.documento" #doc="ngModel"
                     pattern="^[0-9]{7,8}$" inputmode="numeric" maxlength="8"
                     placeholder="Solo numeros, 7 u 8 digitos">
              @if (doc.invalid && (doc.dirty || doc.touched)) {
                <small style="color:#c00; font-size:12px">La cedula debe ser numerica de 7 u 8 digitos.</small>
              }
            </div>
            <div class="form-group"><label class="form-label">Credencial</label><input class="form-input" name="cred" [(ngModel)]="c.credencialCivica"></div>
            <div class="form-group"><label class="form-label">Departamento Credencial</label>
              <select class="form-select" name="depCred" [(ngModel)]="c.departamentoCredencial">
                <option value="">—</option>
                @for (d of departamentos; track d) { <option>{{ d }}</option> }
              </select></div>
            <div class="form-group"><label class="form-label">Fecha Nacimiento</label><input class="form-input" type="date" name="fn" [(ngModel)]="c.fechaNacimiento"></div>
            <div class="form-group"><label class="form-label">Sexo</label>
              <select class="form-select" name="sexo" [(ngModel)]="c.sexo">
                <option value="">—</option><option>Masculino</option><option>Femenino</option><option>Otro</option>
              </select></div>
            <div class="form-group"><label class="form-label">Estado civil</label><input class="form-input" name="ec" [(ngModel)]="c.estadoCivil"></div>
            <div class="form-group"><label class="form-label">Situación</label>
              <select class="form-select" name="sit" [(ngModel)]="c.situacion">
                <option value="">—</option>
                @for (s of situaciones; track s) { <option>{{ s }}</option> }
              </select></div>
          </div>

          <div class="form-section"><div class="form-section-title">Contacto</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" name="email" [(ngModel)]="c.email"></div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-input" name="tel" [(ngModel)]="c.telefono" #tel="ngModel"
                     pattern="^[0-9]+$" inputmode="numeric"
                     placeholder="Solo numeros, sin espacios">
              @if (tel.invalid && (tel.dirty || tel.touched)) {
                <small style="color:#c00; font-size:12px">El telefono debe ser numerico, sin espacios.</small>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Celular</label>
              <input class="form-input" name="cel" [(ngModel)]="c.celular" #cel="ngModel"
                     pattern="^[0-9]+$" inputmode="numeric"
                     placeholder="Solo numeros, sin espacios">
              @if (cel.invalid && (cel.dirty || cel.touched)) {
                <small style="color:#c00; font-size:12px">El celular debe ser numerico, sin espacios.</small>
              }
            </div>
          </div>

          <div class="form-section"><div class="form-section-title">Dirección</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Departamento de la dirección</label>
              <select class="form-select" name="dep" [(ngModel)]="c.departamento">
                <option value="">—</option>
                @for (d of departamentos; track d) { <option>{{ d }}</option> }
              </select></div>
            <div class="form-group"><label class="form-label">Localidad</label><input class="form-input" name="loc" [(ngModel)]="c.localidad"></div>
            <div class="form-group full-width"><label class="form-label">Dirección</label><input class="form-input" name="dir" [(ngModel)]="c.direccion"></div>
          </div>

          <div class="form-section"><div class="form-section-title">Laboral</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Ocupación</label><input class="form-input" name="ocu" [(ngModel)]="c.ocupacion"></div>
            <div class="form-group"><label class="form-label">Empresa</label><input class="form-input" name="emp" [(ngModel)]="c.empresa"></div>
            <div class="form-group full-width"><label class="form-label">Cargo</label><input class="form-input" name="cargo" [(ngModel)]="c.cargoLaboral"></div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-input" name="telTrab" [(ngModel)]="c.telefonoTrabajo" #telTrab="ngModel"
                     pattern="^[0-9]+$" inputmode="numeric"
                     placeholder="Solo numeros, sin espacios">
              @if (telTrab.invalid && (telTrab.dirty || telTrab.touched)) {
                <small style="color:#c00; font-size:12px">El telefono debe ser numerico, sin espacios.</small>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Interno</label>
              <input class="form-input" name="interno" [(ngModel)]="c.interno" #int="ngModel"
                     pattern="^[0-9]*$" inputmode="numeric" placeholder="Solo numeros">
              @if (int.invalid && (int.dirty || int.touched)) {
                <small style="color:#c00; font-size:12px">El interno debe ser numerico.</small>
              }
            </div>
            <div class="form-group"><label class="form-label">Departamento</label>
              <select class="form-select" name="depLab" [(ngModel)]="c.departamentoLaboral">
                <option value="">—</option>
                @for (d of departamentos; track d) { <option>{{ d }}</option> }
              </select></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" name="mailLab" [(ngModel)]="c.mailTrabajo"></div>
            <div class="form-group full-width"><label class="form-label">Datos Secretaría</label><input class="form-input" name="sec" [(ngModel)]="c.datosSecretaria"></div>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="f.invalid">Guardar</button>
            <button class="btn btn-secondary" type="button" (click)="cancelar()">Cancelar</button>
          </div>
        </div>
      </div>
    </form>
  `
})
export class AgendaNuevoComponent {
  private svc = inject(ContactosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private titleSvc = inject(PageTitleService);

  c: Partial<Contacto> = { activo: true };
  editingId?: number;

  departamentos = [
    'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
    'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandu', 'Rio Negro',
    'Rivera', 'Rocha', 'Salto', 'San Jose', 'Soriano', 'Tacuarembo', 'Treinta y Tres'
  ];

  situaciones = ['F', 'M', 'R', 'V', 'S', 'SM', 'CEN', 'ICE', 'PC', 'CA', 'PI', 'FA', 'OOPP'];

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.titleSvc.set(id ? 'Editar Contacto' : 'Nuevo Contacto');
    if (id) {
      this.editingId = +id;
      this.svc.get(this.editingId).subscribe(x => this.c = x);
    }
  }

  guardar() {
    const req: Observable<unknown> = this.editingId
      ? this.svc.update(this.c as Contacto)
      : this.svc.create(this.c);
    req.subscribe(() => this.router.navigate(['/agenda']));
  }

  cancelar() { this.router.navigate(['/agenda']); }
}
