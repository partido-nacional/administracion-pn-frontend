import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { ContactosService, Contacto, FichaAdhesion } from './contactos.service';

interface ContactoListado {
  id: number; nombre: string; apellido: string; cedula?: string;
  departamento?: string; telefono?: string; email?: string; adhesion?: string;
}

const FIELD_LABELS: Record<string, string> = {
  id: 'ID', cortesia: 'Cortesía', nombre: 'Nombre', apellido: 'Apellido',
  documento: 'Cedula', credencialCivica: 'Credencial',
  fechaNacimiento: 'Fecha Nacimiento', sexo: 'Sexo', estadoCivil: 'Estado civil',
  telefono: 'Teléfono', celular: 'Celular', celular2: 'Celular 2', email: 'Email',
  departamento: 'Departamento (dirección)', departamentoCredencial: 'Departamento Credencial',
  localidad: 'Localidad', direccion: 'Dirección', situacion: 'Situación',
  ocupacion: 'Ocupación', empresa: 'Empresa', organismo: 'Organismo', cargoLaboral: 'Cargo',
  telefonoTrabajo: 'Teléfono laboral', telefonoTrabajo2: 'Teléfono laboral 2',
  interno: 'Interno',
  datosSecretaria: 'Datos Secretaría', departamentoLaboral: 'Departamento laboral',
  mailTrabajo: 'Email laboral', observaciones: 'Observaciones',
  fechaCreado: 'Fecha de creación', fechaUltimaModificacion: 'Última modificación',
  activo: 'Activo', adherente: 'Adherente'
};

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
                <tr>
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
                  <td>
                    <div class="action-group">
                      <button class="btn btn-sm btn-secondary" (click)="ver(c.id)">Ver</button>
                      <a [routerLink]="['/agenda', c.id]" class="btn btn-sm btn-primary">Editar</a>
                      <button class="btn btn-sm btn-info" (click)="verFichas(c.id, c.apellido + ', ' + c.nombre)">Ficha Adhesion</button>
                    </div>
                  </td>
                </tr>
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

    @if (verContacto()) {
      <div class="modal-backdrop" (click)="verContacto.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Contacto #{{ verContacto()!.id }}</h3>
            <button class="modal-close" (click)="verContacto.set(null)">×</button>
          </div>
          <div class="modal-body">
            <table class="detalle-table">
              @for (row of verRows(); track row.key) {
                <tr>
                  <th>{{ row.label }}</th>
                  <td>{{ row.value }}</td>
                </tr>
              }
            </table>
          </div>
          <div class="modal-footer">
            <a [routerLink]="['/agenda', verContacto()!.id]" class="btn btn-primary">Editar</a>
            <button class="btn btn-secondary" (click)="verContacto.set(null)">Cerrar</button>
          </div>
        </div>
      </div>
    }

    @if (fichasContactoId() !== null) {
      <div class="modal-backdrop" (click)="cerrarFichas()">
        <div class="modal" (click)="$event.stopPropagation()" style="width:min(900px, 95vw)">
          <div class="modal-header">
            <h3>Fichas de Adhesion — {{ fichasContactoNombre() }}</h3>
            <button class="modal-close" (click)="cerrarFichas()">×</button>
          </div>
          <div class="modal-body">
            @if (fichas().length === 0) {
              <div class="empty-state"><div class="empty-state-text">Sin fichas de adhesion para este contacto</div></div>
            } @else {
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th><th>Sector</th><th>Sist. Contrib.</th><th>Aporte</th>
                    <th>Fecha Adhesion</th><th>Fecha Salida</th><th>Confirmado</th>
                    <th>Art. 46</th><th>Titular Resp.</th><th>Estado</th><th>Origen</th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of fichas(); track f.id) {
                    <tr>
                      <td>{{ f.id }}</td>
                      <td>{{ f.sector || '—' }}</td>
                      <td>{{ f.sistContrib || '—' }}</td>
                      <td>{{ f.aporte ?? '—' }}</td>
                      <td>{{ f.fechaAdhesion || '—' }}</td>
                      <td>{{ f.fechaSalida || '—' }}</td>
                      <td>{{ f.aporteConfirmado ? 'S' : 'N' }}</td>
                      <td>{{ f.art46 ? 'S' : 'N' }}</td>
                      <td>{{ f.titularResponsable || '—' }}</td>
                      <td>{{ f.estado }}</td>
                      <td>{{ f.origen || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cerrarFichas()">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,.5);
      display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .modal {
      background:#fff; border-radius:8px; width:min(720px, 92vw);
      max-height:90vh; display:flex; flex-direction:column;
      box-shadow:0 10px 40px rgba(0,0,0,.25);
    }
    .modal-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:16px 20px; border-bottom:1px solid #eee;
    }
    .modal-header h3 { margin:0; font-size:18px; }
    .modal-close {
      background:none; border:none; font-size:24px; line-height:1;
      cursor:pointer; color:#666; padding:0; width:32px; height:32px;
    }
    .modal-body { padding:16px 20px; overflow-y:auto; flex:1; }
    .modal-footer {
      padding:12px 20px; border-top:1px solid #eee;
      display:flex; gap:8px; justify-content:flex-end;
    }
    .detalle-table { width:100%; border-collapse:collapse; }
    .detalle-table th {
      text-align:left; padding:8px 12px 8px 0; width:38%;
      color:#666; font-weight:600; font-size:13px;
      border-bottom:1px solid #f0f0f0;
    }
    .detalle-table td {
      padding:8px 0; font-size:14px; border-bottom:1px solid #f0f0f0;
      word-break:break-word;
    }
  `]
})
export class AgendaListadoComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  private svc = inject(ContactosService);

  tab = signal<Tab>('todos');
  deptos = ['Montevideo', 'Canelones', 'Maldonado', 'Salto'];
  contactos = signal<ContactoListado[]>([]);
  verContacto = signal<Contacto | null>(null);
  fichasContactoId = signal<number | null>(null);
  fichasContactoNombre = signal<string>('');
  fichas = signal<FichaAdhesion[]>([]);

  verFichas(id: number, nombre: string) {
    this.fichasContactoId.set(id);
    this.fichasContactoNombre.set(nombre);
    this.svc.fichasAdhesion(id).subscribe(x => this.fichas.set(x));
  }

  cerrarFichas() {
    this.fichasContactoId.set(null);
    this.fichas.set([]);
  }

  verRows = computed(() => {
    const c = this.verContacto();
    if (!c) return [];
    const fmt = (v: any) => {
      if (v == null || v === '') return '—';
      if (typeof v === 'boolean') return v ? 'Sí' : 'No';
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toLocaleString('es-UY');
      }
      return String(v);
    };
    return Object.keys(FIELD_LABELS)
      .filter(k => k in c)
      .map(k => ({ key: k, label: FIELD_LABELS[k], value: fmt((c as any)[k]) }));
  });

  ver(id: number) {
    this.svc.get(id).subscribe(c => this.verContacto.set(c));
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
