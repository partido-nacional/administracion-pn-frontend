import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitleService } from '../../core/page-title.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ModalFormComponent } from '../../shared/components/modal-form/modal-form.component';
import { ROLES_USUARIO, RolUsuario, UsuarioDto, UsuarioInput } from '../../core/models/usuarios';

type ModalMode = 'nueva' | 'editar';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalFormComponent],
  template: `
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input class="search-input" placeholder="Buscar por usuario, nombre o rol…" [(ngModel)]="q">
        </div>
      </div>
      <button class="btn btn-primary" (click)="abrirNuevo()">+ Nuevo Usuario</button>
    </div>

    <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
      <table class="table">
        <thead>
          <tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          @for (u of filtrados(); track u.id) {
            <tr>
              <td><strong>{{ u.usuario }}</strong></td>
              <td>{{ u.nombre }}</td>
              <td><span class="badge dept">{{ u.rol }}</span></td>
              <td><span class="badge" [class.status-active]="u.activo" [class.status-rejected]="!u.activo">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td style="display:flex;gap:6px;justify-content:flex-end;white-space:nowrap;">
                <button class="btn btn-sm btn-secondary" (click)="abrirEditar(u)">Editar</button>
                <button class="btn btn-sm btn-secondary" (click)="confirmarResetearClave(u)">Resetear clave</button>
                <button class="btn btn-sm" [class.btn-danger]="u.activo" [class.btn-success]="!u.activo" (click)="confirmarCambiarEstado(u)">
                  {{ u.activo ? 'Desactivar' : 'Activar' }}
                </button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5"><div class="empty-state"><div class="empty-state-text">Sin usuarios</div></div></td></tr>
          }
        </tbody>
      </table>
    </div></div>

    @if (modalOpen()) {
      <app-modal-form
        [title]="modalMode()==='editar' ? 'Editar Usuario' : 'Nuevo Usuario'"
        [busy]="modalBusy()"
        [error]="modalError()"
        [saveLabel]="modalMode()==='editar' ? 'Guardar cambios' : 'Crear'"
        (save)="guardar()" (cancel)="cerrarModal()">
        <div class="nv-grid">
          <div class="fg"><label>Usuario *</label><input [(ngModel)]="form.usuario" name="u-usuario"></div>
          <div class="fg"><label>Nombre *</label><input [(ngModel)]="form.nombre" name="u-nombre"></div>
          <div class="fg"><label>Rol *</label>
            <select [(ngModel)]="form.rol" name="u-rol">
              @for (r of roles; track r) { <option [ngValue]="r">{{ r }}</option> }
            </select>
          </div>
          @if (modalMode()==='nueva') {
            <div class="fg"><label>Contraseña inicial *</label><input type="password" [(ngModel)]="form.clave" name="u-clave"></div>
          }
        </div>
      </app-modal-form>
    }

    @if (claveGenerada()) {
      <app-modal-form
        title="Contraseña reseteada"
        saveLabel="Copiar y cerrar" cancelLabel="Cerrar"
        (save)="copiarClave()" (cancel)="cerrarClaveGenerada()">
        <div class="fg full">
          <label>Nueva contraseña temporal</label>
          <input class="form-input" [value]="claveGenerada()" readonly>
        </div>
        <p style="font-size:12px;color:var(--gray-400);margin-top:8px;">
          Compartila con el usuario de forma segura. No se volverá a mostrar.
        </p>
      </app-modal-form>
    }
  `,
})
export class UsuariosComponent {
  private titleSvc = inject(PageTitleService);
  private svc = inject(UsuariosService);

  roles = ROLES_USUARIO;
  q = '';

  usuarios = signal<UsuarioDto[]>([]);

  modalOpen = signal(false);
  modalMode = signal<ModalMode>('nueva');
  editId = signal<number | null>(null);
  modalBusy = signal(false);
  modalError = signal('');
  form: { usuario: string; nombre: string; rol: RolUsuario; clave: string } = this.formVacio();

  claveGenerada = signal<string | null>(null);

  constructor() {
    this.titleSvc.set('Usuarios');
    this.cargar();
  }

  private formVacio() {
    return { usuario: '', nombre: '', rol: 'Secretaria' as RolUsuario, clave: '' };
  }

  private cargar() {
    this.svc.getUsuarios().subscribe(x => this.usuarios.set(x));
  }

  filtrados(): UsuarioDto[] {
    const arr = this.usuarios();
    if (!this.q) return arr;
    const q = this.q.toLowerCase();
    return arr.filter(u =>
      u.usuario.toLowerCase().includes(q) ||
      u.nombre.toLowerCase().includes(q) ||
      u.rol.toLowerCase().includes(q));
  }

  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.errorCode || err?.message || fallback;
  }

  abrirNuevo() {
    this.form = this.formVacio();
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalOpen.set(true);
  }

  abrirEditar(u: UsuarioDto) {
    this.form = { usuario: u.usuario, nombre: u.nombre, rol: u.rol, clave: '' };
    this.modalError.set(''); this.editId.set(u.id);
    this.modalMode.set('editar'); this.modalOpen.set(true);
  }

  cerrarModal() {
    this.modalOpen.set(false); this.editId.set(null); this.modalError.set('');
  }

  guardar() {
    if (!this.form.usuario.trim()) { this.modalError.set('El usuario es obligatorio.'); return; }
    if (!this.form.nombre.trim()) { this.modalError.set('El nombre es obligatorio.'); return; }
    if (this.modalMode() === 'nueva' && !this.form.clave.trim()) { this.modalError.set('La contraseña inicial es obligatoria.'); return; }

    const input: UsuarioInput = {
      usuario: this.form.usuario.trim(),
      nombre: this.form.nombre.trim(),
      rol: this.form.rol,
      ...(this.modalMode() === 'nueva' ? { clave: this.form.clave } : {}),
    };

    this.modalBusy.set(true); this.modalError.set('');
    const id = this.editId();
    const req = this.modalMode() === 'editar' && id != null
      ? this.svc.actualizar(id, input)
      : this.svc.crear(input);
    req.subscribe({
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.cargar(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar el usuario.')); },
    });
  }

  confirmarCambiarEstado(u: UsuarioDto) {
    const accion = u.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Seguro que querés ${accion} a "${u.usuario}"?`)) return;
    this.svc.cambiarEstado(u.id, !u.activo).subscribe(() => this.cargar());
  }

  confirmarResetearClave(u: UsuarioDto) {
    if (!confirm(`¿Resetear la contraseña de "${u.usuario}"? Se generará una nueva contraseña temporal.`)) return;
    this.svc.resetearClave(u.id).subscribe(r => this.claveGenerada.set(r.claveTemporal));
  }

  copiarClave() {
    const clave = this.claveGenerada();
    if (clave) navigator.clipboard?.writeText(clave);
    this.cerrarClaveGenerada();
  }

  cerrarClaveGenerada() {
    this.claveGenerada.set(null);
  }
}
