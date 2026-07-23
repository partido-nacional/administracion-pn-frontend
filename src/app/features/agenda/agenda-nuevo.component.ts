import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ContactosService, Contacto } from './contactos.service';
import { PageTitleService } from '../../core/page-title.service';

const FIELD_LABELS: Record<string, string> = {
  cortesia: 'Cortesía', nombre: 'Nombre', apellido: 'Apellido', documento: 'Cedula',
  cred: 'Credencial', depCred: 'Departamento Credencial', fn: 'Fecha Nacimiento',
  sexo: 'Sexo', ec: 'Estado civil', sit: 'Situación',
  email: 'Email', tel: 'Teléfono', tel2: 'Teléfono 2', cel: 'Celular', cel2: 'Celular 2',
  internoContacto: 'Interno',
  dep: 'Departamento (dirección)', loc: 'Localidad', dir: 'Dirección',
  ocu: 'Ocupación', emp: 'Empresa', org: 'Organismo', cargo: 'Cargo',
  telTrab: 'Teléfono laboral', telTrab2: 'Teléfono laboral 2', interno: 'Interno',
  depLab: 'Departamento laboral', mailLab: 'Email laboral', sec: 'Datos Secretaría'
};

function describeError(label: string, errors: any): string {
  if (errors.required) return `${label}: campo obligatorio`;
  if (errors.email) return `${label}: email inválido`;
  if (errors.pattern) return `${label}: formato inválido`;
  if (errors.minlength) return `${label}: mínimo ${errors.minlength.requiredLength} caracteres`;
  if (errors.maxlength) return `${label}: máximo ${errors.maxlength.requiredLength} caracteres`;
  return `${label}: valor inválido`;
}

@Component({
  selector: 'app-agenda-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="guardar(f)" #f="ngForm" novalidate [class.submitted]="submitted()">
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
              <input class="form-input" name="documento" [(ngModel)]="c.documento"
                     (input)="onlyDigits($event, 'documento')"
                     (keypress)="blockNonDigit($event)"
                     pattern="^[0-9]{7,8}$" inputmode="numeric" maxlength="8"
                     placeholder="Solo numeros, 7 u 8 digitos">
            </div>
            <div class="form-group">
              <label class="form-label">Credencial</label>
              <input class="form-input" name="cred" [(ngModel)]="c.credencialCivica" #cred="ngModel"
                     (input)="onCredencialInput($event)"
                     pattern="^[A-Z]{3}[0-9]{1,6}$" maxlength="9"
                     placeholder="Ej: ABC123456 (3 letras + hasta 6 numeros)">
              @if (cred.invalid && (cred.dirty || cred.touched)) {
                <small style="color:#c00; font-size:12px">La credencial debe ser 3 letras seguidas de hasta 6 numeros, sin espacios.</small>
              }
            </div>
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
              <input class="form-input" name="tel" [(ngModel)]="c.telefono"
                     (input)="onlyDigits($event, 'telefono')"
                     (keypress)="blockNonDigit($event)"
                     inputmode="numeric"
                     placeholder="Solo numeros, sin espacios">
            </div>
            <div class="form-group">
              <label class="form-label">Celular</label>
              <input class="form-input" name="cel" [(ngModel)]="c.celular"
                     (input)="onlyDigits($event, 'celular')"
                     (keypress)="blockNonDigit($event)"
                     inputmode="numeric"
                     placeholder="Solo numeros, sin espacios">
            </div>
            <div class="form-group">
              <label class="form-label">Celular 2</label>
              <input class="form-input" name="cel2" [(ngModel)]="c.celular2"
                     (input)="onlyDigits($event, 'celular2')"
                     (keypress)="blockNonDigit($event)"
                     inputmode="numeric"
                     placeholder="Solo numeros, sin espacios">
            </div>
          </div>

          <div class="form-section"><div class="form-section-title">Dirección</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Departamento de la dirección</label>
              <select class="form-select" name="dep" [(ngModel)]="c.departamento">
                <option value="">—</option>
                @for (d of departamentos; track d) { <option>{{ d }}</option> }
              </select></div>
            <div class="form-group"><label class="form-label">Ciudad</label><input class="form-input" name="ciudad" [(ngModel)]="c.ciudad"></div>
            <div class="form-group full-width"><label class="form-label">Dirección</label><input class="form-input" name="dir" [(ngModel)]="c.direccion"></div>
          </div>

          <div class="form-section"><div class="form-section-title">Laboral</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Ocupación</label><input class="form-input" name="ocu" [(ngModel)]="c.ocupacion"></div>
            <div class="form-group"><label class="form-label">Empresa</label><input class="form-input" name="emp" [(ngModel)]="c.empresa"></div>
            <div class="form-group"><label class="form-label">Organismo</label><input class="form-input" name="org" [(ngModel)]="c.organismo"></div>
            <div class="form-group full-width"><label class="form-label">Cargo</label><input class="form-input" name="cargo" [(ngModel)]="c.cargoLaboral"></div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-input" name="telTrab" [(ngModel)]="c.telefonoTrabajo"
                     (input)="onlyDigits($event, 'telefonoTrabajo')"
                     (keypress)="blockNonDigit($event)"
                     inputmode="numeric"
                     placeholder="Solo numeros, sin espacios">
            </div>
            <div class="form-group">
              <label class="form-label">Interno</label>
              <input class="form-input" name="internoContacto" [(ngModel)]="c.interno"
                     (input)="onlyDigits($event, 'interno')"
                     (keypress)="blockNonDigit($event)"
                     inputmode="numeric" placeholder="Solo numeros">
            </div>
            <div class="form-group"><label class="form-label">Departamento</label>
              <select class="form-select" name="depLab" [(ngModel)]="c.departamentoLaboral">
                <option value="">—</option>
                @for (d of departamentos; track d) { <option>{{ d }}</option> }
              </select></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" name="mailLab" [(ngModel)]="c.mailTrabajo"></div>
            <div class="form-group full-width"><label class="form-label">Datos Secretaría</label><input class="form-input" name="sec" [(ngModel)]="c.datosSecretaria"></div>
          </div>

          @if (editingId) {
            <div class="form-section"><div class="form-section-title">Adhesion</div></div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" style="display:flex; align-items:center; gap:8px">
                  <input type="checkbox" [checked]="c.adherente" disabled>
                  Adherente
                </label>
                <small style="color:#666; font-size:12px">Calculado automaticamente segun fichas de adhesion confirmadas.</small>
              </div>
            </div>
          }

          <div class="form-actions">
            <button class="btn btn-primary" type="submit">Guardar</button>
            <button class="btn btn-secondary" type="button" (click)="cancelar()">Cancelar</button>
          </div>
        </div>
      </div>
    </form>

    @if (errores().length > 0) {
      <div class="modal-backdrop" (click)="errores.set([])">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>No se pudo guardar</h3>
            <button class="modal-close" (click)="errores.set([])">×</button>
          </div>
          <div class="modal-body">
            <p style="margin-top:0; color:#666">Revisa los siguientes campos:</p>
            <ul class="error-list">
              @for (e of errores(); track e) { <li>{{ e }}</li> }
            </ul>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" (click)="errores.set([])">Entendido</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,.5);
      display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .modal {
      background:#fff; border-radius:8px; width:min(560px, 92vw);
      max-height:90vh; display:flex; flex-direction:column;
      box-shadow:0 10px 40px rgba(0,0,0,.25);
    }
    .modal-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:16px 20px; border-bottom:1px solid #eee;
    }
    .modal-header h3 { margin:0; font-size:18px; color:#c00; }
    .modal-close {
      background:none; border:none; font-size:24px; line-height:1;
      cursor:pointer; color:#666; padding:0; width:32px; height:32px;
    }
    .modal-body { padding:16px 20px; overflow-y:auto; flex:1; }
    .modal-footer {
      padding:12px 20px; border-top:1px solid #eee;
      display:flex; gap:8px; justify-content:flex-end;
    }
    .error-list { margin:0; padding-left:20px; color:#333; }
    .error-list li { padding:4px 0; }
    form.submitted .form-input.ng-invalid,
    form.submitted .form-select.ng-invalid {
      border-color:#c00 !important; background:#fff5f5;
    }
  `]
})
export class AgendaNuevoComponent {
  private svc = inject(ContactosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private titleSvc = inject(PageTitleService);

  c: Partial<Contacto> = { activo: true };
  editingId?: number;
  submitted = signal(false);
  errores = signal<string[]>([]);

  departamentos = [
    'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
    'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandu', 'Rio Negro',
    'Rivera', 'Rocha', 'Salto', 'San Jose', 'Soriano', 'Tacuarembo', 'Treinta y Tres'
  ];

  situaciones = ['F', 'M', 'R', 'V', 'S', 'SM', 'CEN', 'ICE', 'PC', 'CA', 'PI', 'FA', 'OOPP'];

  private credencialMap: Record<string, string> = {
    A: 'Montevideo', B: 'Montevideo', C: 'Canelones', D: 'Maldonado', E: 'Rocha',
    F: 'Treinta y Tres', G: 'Cerro Largo', H: 'Rivera', I: 'Artigas', J: 'Salto',
    K: 'Paysandu', L: 'Rio Negro', M: 'Soriano', N: 'Colonia', O: 'San Jose',
    P: 'Flores', Q: 'Florida', R: 'Durazno', S: 'Lavalleja', T: 'Tacuarembo'
  };

  onCredencialInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    let v = (input.value || '').toUpperCase().replace(/\s+/g, '');
    const letters = v.replace(/[^A-Z]/g, '').slice(0, 3);
    const digits = v.slice(letters.length).replace(/[^0-9]/g, '').slice(0, 6);
    v = letters + digits;
    input.value = v;
    this.c.credencialCivica = v;
    // La primera letra de la credencial sugiere el departamento. No se limpia cuando
    // no hay credencial: el depto credencial es editable de forma independiente (feature 025).
    if (letters.length >= 1) {
      const dep = this.credencialMap[letters[0]];
      if (dep) this.c.departamentoCredencial = dep;
    }
  }

  onlyDigits(ev: Event, field: keyof Contacto) {
    const input = ev.target as HTMLInputElement;
    const cleaned = (input.value || '').replace(/\D/g, '');
    if (cleaned !== input.value) input.value = cleaned;
    (this.c as any)[field] = cleaned;
  }

  blockNonDigit(ev: KeyboardEvent) {
    if (ev.key.length === 1 && !/[0-9]/.test(ev.key)) ev.preventDefault();
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.titleSvc.set(id ? 'Editar Contacto' : 'Nuevo Contacto');
    if (id) {
      this.editingId = +id;
      this.svc.get(this.editingId).subscribe(x => this.c = x);
    }
  }

  guardar(form: NgForm) {
    this.submitted.set(true);
    if (form.invalid) {
      Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
      const errs: string[] = [];
      Object.entries(form.controls).forEach(([name, ctrl]) => {
        if (ctrl.invalid && ctrl.errors) {
          const label = FIELD_LABELS[name] ?? name;
          errs.push(describeError(label, ctrl.errors));
        }
      });
      this.errores.set(errs.length ? errs : ['Hay campos con valores inválidos.']);
      return;
    }
    const req: Observable<unknown> = this.editingId
      ? this.svc.update(this.c as Contacto)
      : this.svc.create(this.c);
    req.subscribe({
      next: () => this.router.navigate(['/agenda']),
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'No se pudo guardar el contacto.';
        this.errores.set([typeof msg === 'string' ? msg : 'No se pudo guardar el contacto.']);
      }
    });
  }

  cancelar() { this.router.navigate(['/agenda']); }
}
