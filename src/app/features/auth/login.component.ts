import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

type Modo = 'login' | 'registro' | 'verificar' | 'recuperar' | 'resetear';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--gray-100);">
  <div class="card" style="width:400px;margin:0;">
    <div class="card-header" style="display:flex;gap:12px;align-items:center;">
      <div class="logo" style="width:36px;height:36px;background:var(--accent);color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;">PN</div>
      <h2 class="card-title">AdministracionPN</h2>
    </div>
    <div class="card-body">

      @if (mensaje()) {
        <div style="background:#dcfce7;color:#166534;padding:10px 12px;border-radius:4px;font-size:13px;margin-bottom:12px;">{{ mensaje() }}</div>
      }
      @if (error()) {
        <div style="background:#fee2e2;color:#991b1b;padding:10px 12px;border-radius:4px;font-size:13px;margin-bottom:12px;">{{ error() }}</div>
      }

      <!-- ===== LOGIN ===== -->
      @if (modo()==='login') {
        <form (ngSubmit)="doLogin()" #f="ngForm">
          <div class="form-group" style="margin-bottom:16px;">
            <label class="form-label">Usuario</label>
            <input class="form-input" name="usuario" [(ngModel)]="usuario" required autofocus>
          </div>
          <div class="form-group" style="margin-bottom:16px;">
            <label class="form-label">Clave</label>
            <div style="position:relative;">
              <input class="form-input" [type]="mostrarClave() ? 'text' : 'password'" name="clave" [(ngModel)]="clave" required style="width:100%;box-sizing:border-box;padding-right:38px;">
              <button type="button" (click)="mostrarClave.set(!mostrarClave())" aria-label="Mostrar/ocultar clave" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;padding:4px;cursor:pointer;color:var(--gray-400);">{{ mostrarClave() ? '🙈' : '👁' }}</button>
            </div>
          </div>
          @if (ofrecerVerificar()) {
            <button type="button" class="btn btn-secondary" style="width:100%;justify-content:center;margin-bottom:10px;" (click)="irAVerificar(usuario)">Verificar mi email</button>
          }
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;" [disabled]="loading() || f.invalid">
            {{ loading() ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>
        <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:13px;">
          <a style="cursor:pointer;color:var(--accent)" (click)="ir('registro')">Crear cuenta</a>
          <a style="cursor:pointer;color:var(--accent)" (click)="ir('recuperar')">¿Olvidaste tu contraseña?</a>
        </div>
      }

      <!-- ===== REGISTRO ===== -->
      @if (modo()==='registro') {
        <form (ngSubmit)="doRegistro()" #f="ngForm">
          <div class="form-group" style="margin-bottom:12px;"><label class="form-label">Usuario</label>
            <input class="form-input" name="usuario" [(ngModel)]="usuario" required autofocus></div>
          <div class="form-group" style="margin-bottom:12px;"><label class="form-label">Email</label>
            <input class="form-input" type="email" name="email" [(ngModel)]="email" required></div>
          <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Clave (mín. 8)</label>
            <input class="form-input" type="password" name="clave" [(ngModel)]="clave" required minlength="8"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;" [disabled]="loading() || f.invalid">
            {{ loading() ? 'Creando…' : 'Crear cuenta' }}
          </button>
        </form>
        <div style="margin-top:14px;font-size:13px;"><a style="cursor:pointer;color:var(--accent)" (click)="ir('login')">← Volver a ingresar</a></div>
      }

      <!-- ===== VERIFICAR ===== -->
      @if (modo()==='verificar') {
        <p style="font-size:13px;color:var(--gray-500);margin:0 0 12px;">Ingresá el código de 6 dígitos que te enviamos por email.</p>
        <form (ngSubmit)="doVerificar()" #f="ngForm">
          <div class="form-group" style="margin-bottom:12px;"><label class="form-label">Usuario</label>
            <input class="form-input" name="usuario" [(ngModel)]="usuario" required></div>
          <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Código</label>
            <input class="form-input" name="codigo" [(ngModel)]="codigo" required inputmode="numeric" autofocus></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;" [disabled]="loading() || f.invalid">
            {{ loading() ? 'Verificando…' : 'Verificar' }}
          </button>
        </form>
        <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:13px;">
          <a style="cursor:pointer;color:var(--accent)" (click)="ir('login')">← Volver</a>
          @if (email) { <a style="cursor:pointer;color:var(--accent)" (click)="doReenviar()">Reenviar código</a> }
        </div>
      }

      <!-- ===== RECUPERAR ===== -->
      @if (modo()==='recuperar') {
        <p style="font-size:13px;color:var(--gray-500);margin:0 0 12px;">Te enviaremos un enlace para restablecer tu contraseña.</p>
        <form (ngSubmit)="doRecuperar()" #f="ngForm">
          <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Email</label>
            <input class="form-input" type="email" name="email" [(ngModel)]="email" required autofocus></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;" [disabled]="loading() || f.invalid">
            {{ loading() ? 'Enviando…' : 'Enviar enlace' }}
          </button>
        </form>
        <div style="margin-top:14px;font-size:13px;"><a style="cursor:pointer;color:var(--accent)" (click)="ir('login')">← Volver a ingresar</a></div>
      }

      <!-- ===== RESETEAR ===== -->
      @if (modo()==='resetear') {
        <p style="font-size:13px;color:var(--gray-500);margin:0 0 12px;">Elegí tu nueva contraseña.</p>
        <form (ngSubmit)="doResetear()" #f="ngForm">
          <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Nueva clave (mín. 8)</label>
            <input class="form-input" type="password" name="nuevaClave" [(ngModel)]="nuevaClave" required minlength="8" autofocus></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;" [disabled]="loading() || f.invalid">
            {{ loading() ? 'Guardando…' : 'Cambiar contraseña' }}
          </button>
        </form>
        <div style="margin-top:14px;font-size:13px;"><a style="cursor:pointer;color:var(--accent)" (click)="ir('login')">← Volver a ingresar</a></div>
      }

    </div>
  </div>
</div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  modo = signal<Modo>('login');
  usuario = '';
  clave = '';
  email = '';
  codigo = '';
  nuevaClave = '';
  token = '';

  loading = signal(false);
  error = signal<string | null>(null);
  mensaje = signal<string | null>(null);
  mostrarClave = signal(false);
  ofrecerVerificar = signal(false);

  constructor() {
    // Deep-link de recuperación: /login?reset=<token>
    const reset = this.route.snapshot.queryParamMap.get('reset');
    if (reset) { this.token = reset; this.modo.set('resetear'); }
  }

  ir(m: Modo) {
    this.modo.set(m);
    this.error.set(null); this.mensaje.set(null); this.ofrecerVerificar.set(false);
  }

  irAVerificar(usuario: string) { this.usuario = usuario; this.ir('verificar'); }

  private start() { this.loading.set(true); this.error.set(null); this.mensaje.set(null); }

  doLogin() {
    this.start();
    this.auth.login(this.usuario, this.clave).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/inicio']); },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err?.error?.message as string | undefined;
        if (err.status === 401 && msg?.toLowerCase().includes('verific')) {
          this.error.set(msg);
          this.ofrecerVerificar.set(true);
        } else {
          this.error.set(this.mensajeError(err.status, msg));
        }
      }
    });
  }

  doRegistro() {
    this.start();
    this.auth.register(this.usuario, this.clave, this.email).subscribe({
      next: (r) => { this.loading.set(false); this.codigo = ''; this.ir('verificar'); this.mensaje.set(r.message); },
      error: (err: HttpErrorResponse) => { this.loading.set(false); this.error.set(err?.error?.message || this.mensajeError(err.status)); }
    });
  }

  doVerificar() {
    this.start();
    this.auth.verificarEmail(this.usuario, this.codigo).subscribe({
      next: (r) => { this.loading.set(false); this.clave = ''; this.ir('login'); this.mensaje.set(r.message); },
      error: (err: HttpErrorResponse) => { this.loading.set(false); this.error.set(err?.error?.message || 'Código inválido o expirado.'); }
    });
  }

  doReenviar() {
    if (!this.email) return;
    this.auth.reenviarCodigo(this.email).subscribe({
      next: (r) => this.mensaje.set(r.message),
      error: () => this.mensaje.set('Si el email corresponde a una cuenta sin verificar, te enviamos un nuevo código.')
    });
  }

  doRecuperar() {
    this.start();
    this.auth.recuperar(this.email).subscribe({
      next: (r) => { this.loading.set(false); this.mensaje.set(r.message); },
      error: () => { this.loading.set(false); this.mensaje.set('Si el email corresponde a una cuenta, te enviamos un enlace para restablecer la contraseña.'); }
    });
  }

  doResetear() {
    this.start();
    this.auth.resetear(this.token, this.nuevaClave).subscribe({
      next: (r) => { this.loading.set(false); this.nuevaClave = ''; this.ir('login'); this.mensaje.set(r.message); },
      error: (err: HttpErrorResponse) => { this.loading.set(false); this.error.set(err?.error?.message || 'El enlace es inválido o expiró.'); }
    });
  }

  private mensajeError(status: number, backendMsg?: string): string {
    if (backendMsg) return backendMsg;
    if (status === 401) return 'Usuario o clave inválidos';
    if (status === 409) return 'Ya existe una cuenta con ese usuario o email.';
    if (status === 0) return 'No hay conexión con el servidor. Verificá tu conexión e intentá de nuevo.';
    if (status >= 500) return 'Ocurrió un error en el servidor. Intentá de nuevo más tarde.';
    return 'No se pudo completar la acción. Intentá de nuevo.';
  }
}
