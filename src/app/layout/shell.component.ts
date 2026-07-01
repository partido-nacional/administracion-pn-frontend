import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { PageTitleService } from '../core/page-title.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
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
