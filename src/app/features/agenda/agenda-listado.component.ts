import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { ContactosService, Contacto } from './contactos.service';

interface ContactoListado {
  id: number; nombre: string; apellido: string; cedula?: string;
  departamento?: string; telefono?: string; email?: string; adhesion?: string;
  adherente?: boolean; tieneFicha?: boolean; tieneIntegranteOrganismo?: boolean;
}

type Tab = 'todos' | 'padron' | 'duplicados' | 'exportar';

@Component({
  selector: 'app-agenda-listado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="topbar-inline">
      <a routerLink="/agenda/nuevo" class="btn btn-primary">+ Nuevo Contacto</a>
    </div>

    <div class="tabs">
      <a class="tab" [class.active]="tab()==='todos'"      (click)="tab.set('todos')">Todos los contactos</a>
      <a class="tab" [class.active]="tab()==='padron'"     (click)="tab.set('padron')">Padron Electoral</a>
      <a class="tab" [class.active]="tab()==='duplicados'" (click)="tab.set('duplicados')">Duplicados</a>
      <a class="tab" [class.active]="tab()==='exportar'"   (click)="tab.set('exportar')">Exportar</a>
    </div>

    @if (tab() === 'todos') {
      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Cedula</th>
                <th>Departamento</th>
                <th>Telefono</th>
                <th>Email</th>
                <th>Adhesion</th>
                <th></th>
              </tr>
              <tr class="filter-row">
                <th><input class="column-filter" [ngModel]="fId()"     (ngModelChange)="fId.set($event)"     placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event)" placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fCedula()" (ngModelChange)="fCedula.set($event)" placeholder="Filtrar..."></th>
                <th>
                  <select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event)">
                    <option value="">Todos</option>
                    @for (d of deptos; track d) { @if (d) { <option>{{ d }}</option> } }
                  </select>
                </th>
                <th><input class="column-filter" [ngModel]="fTel()"   (ngModelChange)="fTel.set($event)"   placeholder="Filtrar..."></th>
                <th><input class="column-filter" [ngModel]="fEmail()" (ngModelChange)="fEmail.set($event)" placeholder="Filtrar..."></th>
                <th>
                  <select class="column-filter" [ngModel]="fAdh()" (ngModelChange)="fAdh.set($event)">
                    <option value="">Todas</option>
                    <option>Activa</option>
                    <option>Pendiente</option>
                    <option>Baja</option>
                  </select>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of filtrados(); track c.id) {
                <tr class="clickable" [class.selected]="expandedId() === c.id" (click)="toggle(c.id)">
                  <td>{{ c.id }}</td>
                  <td><strong>{{ c.apellido }}, {{ c.nombre }}</strong></td>
                  <td>{{ c.cedula || '—' }}</td>
                  <td>
                    @if (c.departamento) {
                      <span class="badge dept">{{ c.departamento }}</span>
                    } @else { — }
                  </td>
                  <td>{{ c.telefono || '—' }}</td>
                  <td>{{ c.email || '—' }}</td>
                  <td>
                    @if (c.adhesion === 'Activa') {
                      <span class="badge status-active">Activa</span>
                    } @else if (c.adhesion === 'Pendiente') {
                      <span class="badge status-pending">Pendiente</span>
                    } @else if (c.adhesion === 'Baja') {
                      <span class="badge status-rejected">Baja</span>
                    } @else { -- }
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <div class="action-group">
                      <a [routerLink]="['/agenda', c.id]" class="btn btn-sm btn-primary">Editar</a>
                      @if (c.tieneFicha) {
                        <a [routerLink]="['/agenda', c.id, 'fichas']" class="btn btn-sm btn-success">Ficha Adhesion</a>
                      } @else {
                        <a [routerLink]="['/agenda', c.id, 'fichas', 'nueva']" class="btn btn-sm btn-success">Pasar a Adhesion</a>
                      }
                      @if (c.tieneIntegranteOrganismo) {
                        <a [routerLink]="['/agenda', c.id, 'organismos']" class="btn btn-sm btn-secondary">Int. Organismo</a>
                      } @else {
                        <button class="btn btn-sm btn-secondary" disabled title="El contacto no pertenece a ningún organismo">Int. Organismo</button>
                      }
                    </div>
                  </td>
                </tr>
                @if (expandedId() === c.id && detalle()) {
                  <tr class="detalle-row">
                    <td colspan="8">
                      <div class="detalle-wrap">
                        <div class="detalle-section">
                          <div class="detalle-section-title">Datos personales</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Cortesía</span><span class="v">{{ fmt(detalle()!.cortesia) }}</span></div>
                            <div class="kv"><span class="k">Nombre</span><span class="v">{{ fmt(detalle()!.nombre) }}</span></div>
                            <div class="kv"><span class="k">Apellido</span><span class="v">{{ fmt(detalle()!.apellido) }}</span></div>
                            <div class="kv"><span class="k">Cedula</span><span class="v">{{ fmt(detalle()!.documento) }}</span></div>
                            <div class="kv"><span class="k">Credencial</span><span class="v">{{ fmt(detalle()!.credencialCivica) }}</span></div>
                            <div class="kv"><span class="k">Departamento Credencial</span><span class="v">{{ fmt(detalle()!.departamentoCredencial) }}</span></div>
                            <div class="kv"><span class="k">Fecha Nacimiento</span><span class="v">{{ fmtDate(detalle()!.fechaNacimiento) }}</span></div>
                            <div class="kv"><span class="k">Sexo</span><span class="v">{{ fmt(detalle()!.sexo) }}</span></div>
                            <div class="kv"><span class="k">Estado civil</span><span class="v">{{ fmt(detalle()!.estadoCivil) }}</span></div>
                            <div class="kv"><span class="k">Situación</span><span class="v">{{ fmt(detalle()!.situacion) }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Contacto</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Email</span><span class="v">{{ fmt(detalle()!.email) }}</span></div>
                            <div class="kv"><span class="k">Teléfono</span><span class="v">{{ fmt(detalle()!.telefono) }}</span></div>
                            <div class="kv"><span class="k">Celular</span><span class="v">{{ fmt(detalle()!.celular) }}</span></div>
                            <div class="kv"><span class="k">Celular 2</span><span class="v">{{ fmt(detalle()!.celular2) }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Dirección</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Departamento</span><span class="v">{{ fmt(detalle()!.departamento) }}</span></div>
                            <div class="kv"><span class="k">Localidad</span><span class="v">{{ fmt(detalle()!.localidad) }}</span></div>
                            <div class="kv full"><span class="k">Dirección</span><span class="v">{{ fmt(detalle()!.direccion) }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Laboral</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Ocupación</span><span class="v">{{ fmt(detalle()!.ocupacion) }}</span></div>
                            <div class="kv"><span class="k">Empresa</span><span class="v">{{ fmt(detalle()!.empresa) }}</span></div>
                            <div class="kv"><span class="k">Organismo</span><span class="v">{{ fmt(detalle()!.organismo) }}</span></div>
                            <div class="kv full"><span class="k">Cargo</span><span class="v">{{ fmt(detalle()!.cargoLaboral) }}</span></div>
                            <div class="kv"><span class="k">Teléfono</span><span class="v">{{ fmt(detalle()!.telefonoTrabajo) }}</span></div>
                            <div class="kv"><span class="k">Teléfono 2</span><span class="v">{{ fmt(detalle()!.telefonoTrabajo2) }}</span></div>
                            <div class="kv"><span class="k">Interno</span><span class="v">{{ fmt(detalle()!.interno) }}</span></div>
                            <div class="kv"><span class="k">Departamento</span><span class="v">{{ fmt(detalle()!.departamentoLaboral) }}</span></div>
                            <div class="kv"><span class="k">Email</span><span class="v">{{ fmt(detalle()!.mailTrabajo) }}</span></div>
                            <div class="kv full"><span class="k">Datos Secretaría</span><span class="v">{{ fmt(detalle()!.datosSecretaria) }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Adhesion</div>
                          <div class="detalle-grid">
                            <div class="kv"><span class="k">Adherente</span><span class="v">{{ detalle()!.adherente ? 'Sí' : 'No' }}</span></div>
                          </div>
                        </div>

                        <div class="detalle-section">
                          <div class="detalle-section-title">Otros</div>
                          <div class="detalle-grid">
                            <div class="kv full"><span class="k">Observaciones</span><span class="v">{{ fmt(detalle()!.observaciones) }}</span></div>
                            <div class="kv"><span class="k">Fecha de creación</span><span class="v">{{ fmtDate(detalle()!.fechaCreado) }}</span></div>
                            <div class="kv"><span class="k">Última modificación</span><span class="v">{{ fmtDate(detalle()!.fechaUltimaModificacion) }}</span></div>
                            <div class="kv"><span class="k">Activo</span><span class="v">{{ detalle()!.activo ? 'Sí' : 'No' }}</span></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr><td colspan="8"><div class="empty-state"><div class="empty-state-text">Sin contactos</div></div></td></tr>
              }
            </tbody>
          </table>
          <div class="pagination" style="padding:16px 24px">
            <span class="pagination-info">Mostrando 1–{{ filtrados().length }} de {{ contactos().length }} contactos</span>
            <div class="pagination-buttons">
              <button class="page-btn">&lt;</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'padron') {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Padron Electoral — proximamente</div></div></div></div>
    }
    @if (tab() === 'duplicados') {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Duplicados — proximamente</div></div></div></div>
    }
    @if (tab() === 'exportar') {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Exportar — proximamente</div></div></div></div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
    .action-group .btn:disabled { opacity:.5; cursor:not-allowed; pointer-events:none; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .detalle-wrap { padding:20px 24px; border-top:1px solid #d6dde6; display:flex; flex-direction:column; gap:18px; }
    .detalle-section { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:14px 18px; }
    .detalle-section-title {
      font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase;
      letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px;
      border-bottom:1px solid #eef1f5;
    }
    .detalle-grid {
      display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 24px;
    }
    @media (max-width: 900px) { .detalle-grid { grid-template-columns:repeat(2, 1fr); } }
    @media (max-width: 600px) { .detalle-grid { grid-template-columns:1fr; } }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv.full { grid-column:1 / -1; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }
  `]
})
export class AgendaListadoComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  private svc = inject(ContactosService);

  tab = signal<Tab>('todos');
  deptos = ['Montevideo', 'Canelones', 'Maldonado', 'Salto'];
  contactos = signal<ContactoListado[]>([]);
  expandedId = signal<number | null>(null);
  detalle = signal<Contacto | null>(null);

  toggle(id: number) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.detalle.set(null);
      return;
    }
    this.expandedId.set(id);
    this.detalle.set(null);
    this.svc.get(id).subscribe(c => this.detalle.set(c));
  }

  fmt(v: any): string {
    if (v == null || v === '') return '—';
    return String(v);
  }

  fmtDate(v: any): string {
    if (!v) return '—';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleString('es-UY');
    }
    return s;
  }

  fId = signal('');
  fNombre = signal('');
  fCedula = signal('');
  fDepto = signal('');
  fTel = signal('');
  fEmail = signal('');
  fAdh = signal('');

  filtrados = computed(() => {
    const norm = (s: any) => (s ?? '').toString().toLowerCase();
    const m = (val: any, q: string) => !q || norm(val).includes(q.toLowerCase());
    const fId = this.fId(), fNom = this.fNombre(), fCed = this.fCedula(),
          fDep = this.fDepto(), fTel = this.fTel(), fMail = this.fEmail(), fAdh = this.fAdh();
    return this.contactos().filter(c =>
      m(c.id, fId) &&
      m(`${c.apellido}, ${c.nombre}`, fNom) &&
      m(c.cedula, fCed) &&
      (!fDep || c.departamento === fDep) &&
      m(c.telefono, fTel) &&
      m(c.email, fMail) &&
      (!fAdh || (c.adhesion ?? '') === fAdh)
    );
  });

  constructor() {
    this.titleSvc.set('Agenda');
    this.reload();
  }

  reload() {
    this.http.get<ContactoListado[]>(`${environment.apiUrl}/contactos`)
      .subscribe(x => this.contactos.set(x));
  }
}
