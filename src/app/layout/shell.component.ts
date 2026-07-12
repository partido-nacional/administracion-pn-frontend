import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { PageTitleService } from '../core/page-title.service';
import { ToastsComponent } from '../shared/components/toasts/toasts.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastsComponent],
  templateUrl: './shell.component.html'
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  titleSvc = inject(PageTitleService);

  user = this.auth.session;
  openMenus = signal<Record<string, boolean>>({});
  sidebarCollapsed = signal(false);
  darkMode = signal(false);

  constructor() {
    if (localStorage.getItem('darkMode') === '1') {
      this.darkMode.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  toggle(key: string) {
    this.openMenus.update(m => ({ ...m, [key]: !m[key] }));
  }

  isOpen(key: string) { return !!this.openMenus()[key]; }

  /**
   * Secciones restringidas por rol (matriz RBAC). Las no listadas (inicio, agenda) son
   * accesibles para todos los roles. Fuente de verdad en el backend (feature 003); acá
   * se replica solo para ocultar el nav y bloquear la navegación (UX), no como seguridad.
   */
  private readonly accesoPorSeccion: Record<string, string[]> = {
    agrupaciones: ['Secretaria', 'Hacienda', 'IT'],
    listados: ['Secretaria', 'Hacienda', 'IT'],
    productos: ['Secretaria', 'Hacienda', 'IT'],
    organismos: ['Secretaria', 'Hacienda', 'IT'],
    convencionales: ['Secretaria', 'Hacienda', 'IT'],
    adhesiones: ['Hacienda', 'IT'],
    debitos: ['Hacienda', 'IT'],
    usuarios: ['IT'],
  };

  /** True si el rol actual puede ver/entrar a la sección (o si la sección es abierta). */
  puede(seccion: string): boolean {
    const roles = this.accesoPorSeccion[seccion];
    if (!roles) return true;
    const rol = this.user()?.rol;
    return !!rol && roles.includes(rol);
  }

  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }

  toggleDarkMode() {
    this.darkMode.update(v => !v);
    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', '1');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('darkMode');
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  today = new Date().toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' });

  initials(nombre?: string) {
    if (!nombre) return '?';
    return nombre.substring(0, 2).toUpperCase();
  }
}
