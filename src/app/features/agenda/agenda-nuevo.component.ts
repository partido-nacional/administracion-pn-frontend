import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
            <div class="form-group"><label class="form-label">Nombre *</label><input class="form-input" name="nombre" [(ngModel)]="c.nombre" required></div>
            <div class="form-group"><label class="form-label">Apellido *</label><input class="form-input" name="apellido" [(ngModel)]="c.apellido" required></div>
            <div class="form-group"><label class="form-label">Documento</label><input class="form-input" name="documento" [(ngModel)]="c.documento"></div>
            <div class="form-group"><label class="form-label">Fecha Nacimiento</label><input class="form-input" type="date" name="fn" [(ngModel)]="c.fechaNacimiento"></div>
            <div class="form-group"><label class="form-label">Sexo</label>
              <select class="form-select" name="sexo" [(ngModel)]="c.sexo">
                <option value="">—</option><option>Masculino</option><option>Femenino</option><option>Otro</option>
              </select></div>
            <div class="form-group"><label class="form-label">Estado civil</label><input class="form-input" name="ec" [(ngModel)]="c.estadoCivil"></div>
          </div>

          <div class="form-section"><div class="form-section-title">Contacto</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" name="email" [(ngModel)]="c.email"></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input" name="tel" [(ngModel)]="c.telefono"></div>
            <div class="form-group"><label class="form-label">Celular</label><input class="form-input" name="cel" [(ngModel)]="c.celular"></div>
          </div>

          <div class="form-section"><div class="form-section-title">Dirección</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Departamento</label><input class="form-input" name="dep" [(ngModel)]="c.departamento"></div>
            <div class="form-group"><label class="form-label">Localidad</label><input class="form-input" name="loc" [(ngModel)]="c.localidad"></div>
            <div class="form-group full-width"><label class="form-label">Dirección</label><input class="form-input" name="dir" [(ngModel)]="c.direccion"></div>
            <div class="form-group"><label class="form-label">Código postal</label><input class="form-input" name="cp" [(ngModel)]="c.codigoPostal"></div>
          </div>

          <div class="form-section"><div class="form-section-title">Laboral</div></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Ocupación</label><input class="form-input" name="ocu" [(ngModel)]="c.ocupacion"></div>
            <div class="form-group"><label class="form-label">Empresa</label><input class="form-input" name="emp" [(ngModel)]="c.empresa"></div>
            <div class="form-group full-width"><label class="form-label">Cargo</label><input class="form-input" name="cargo" [(ngModel)]="c.cargoLaboral"></div>
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

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.titleSvc.set(id ? 'Editar Contacto' : 'Nuevo Contacto');
    if (id) {
      this.editingId = +id;
      this.svc.get(this.editingId).subscribe(x => this.c = x);
    }
  }

  guardar() {
    const req = this.editingId
      ? this.svc.update(this.c as Contacto)
      : this.svc.create(this.c);
    req.subscribe(() => this.router.navigate(['/agenda']));
  }

  cancelar() { this.router.navigate(['/agenda']); }
}
