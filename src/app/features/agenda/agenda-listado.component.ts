import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactosService, Contacto } from './contactos.service';
import { PageTitleService } from '../../core/page-title.service';

@Component({
  selector: 'app-agenda-listado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input class="search-input" placeholder="Buscar por nombre, apellido, documento…" [(ngModel)]="q" (keyup.enter)="reload()">
        </div>
        <button class="btn btn-secondary" (click)="reload()">Buscar</button>
      </div>
      <a routerLink="/agenda/nuevo" class="btn btn-primary">+ Nuevo Contacto</a>
    </div>

    <div class="card">
      <div class="card-body" style="overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Apellido</th>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Departamento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (c of contactos(); track c.id) {
              <tr>
                <td>{{ c.apellido }}</td>
                <td>{{ c.nombre }}</td>
                <td>{{ c.documento || '—' }}</td>
                <td>{{ c.email || '—' }}</td>
                <td>{{ c.telefono || c.celular || '—' }}</td>
                <td>{{ c.departamento || '—' }}</td>
                <td class="action-group">
                  <a [routerLink]="['/agenda', c.id]" class="action-link">Editar</a>
                  <a class="action-link" style="color:var(--danger)" (click)="eliminar(c)">Eliminar</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7"><div class="empty-state"><div class="empty-state-text">Sin contactos</div></div></td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AgendaListadoComponent {
  private svc = inject(ContactosService);
  private titleSvc = inject(PageTitleService);

  q = '';
  contactos = signal<Contacto[]>([]);

  constructor() {
    this.titleSvc.set('Agenda');
    this.reload();
  }

  reload() { this.svc.list(this.q).subscribe(cs => this.contactos.set(cs)); }

  eliminar(c: Contacto) {
    if (!confirm(`¿Eliminar a ${c.apellido}, ${c.nombre}?`)) return;
    this.svc.delete(c.id).subscribe(() => this.reload());
  }
}
