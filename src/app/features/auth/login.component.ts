import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--gray-100);">
  <div class="card" style="width:380px;margin:0;">
    <div class="card-header" style="display:flex;gap:12px;align-items:center;">
      <div class="logo" style="width:36px;height:36px;background:var(--accent);color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;">PN</div>
      <h2 class="card-title">AdministracionPN</h2>
    </div>
    <div class="card-body">
      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label">Usuario</label>
          <input class="form-input" name="usuario" [(ngModel)]="usuario" required autofocus>
        </div>
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label">Clave</label>
          <div style="position:relative;">
            <input class="form-input" [type]="mostrarClave() ? 'text' : 'password'" name="clave" [(ngModel)]="clave" required style="width:100%;box-sizing:border-box;padding-right:38px;">
            <button type="button" (click)="mostrarClave.set(!mostrarClave())" [attr.aria-label]="mostrarClave() ? 'Ocultar clave' : 'Mostrar clave'" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;padding:4px;cursor:pointer;color:var(--gray-400);display:flex;">
              @if (mostrarClave()) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>
        @if (error()) {
          <div style="background:#fee2e2;color:#991b1b;padding:10px 12px;border-radius:4px;font-size:13px;margin-bottom:12px;">{{ error() }}</div>
        }
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;" [disabled]="loading() || f.invalid">
          @if (loading()) { <span class="spinner" aria-hidden="true"></span> }
          {{ loading() ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>
      <p style="font-size:11px;color:var(--gray-400);margin-top:14px;text-align:center;">Demo: admin / admin123</p>
    </div>
  </div>
</div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  usuario = 'admin';
  clave = 'admin123';
  loading = signal(false);
  error = signal<string | null>(null);
  mostrarClave = signal(false);

  submit() {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.usuario, this.clave).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/inicio']); },
      error: (err: HttpErrorResponse) => { this.error.set(this.mensajeError(err.status)); this.loading.set(false); }
    });
  }

  private mensajeError(status: number): string {
    if (status === 401) return 'Usuario o clave inválidos';
    if (status === 0) return 'No hay conexión con el servidor. Verificá tu conexión e intentá de nuevo.';
    if (status >= 500) return 'Ocurrió un error en el servidor. Intentá de nuevo más tarde.';
    return 'No se pudo iniciar sesión. Intentá de nuevo.';
  }
}
