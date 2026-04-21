import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Agrupacion { id: number; codAgrup: string; codDepto: string; pendiente: boolean; tipo: string; solic: number; nombre: string; depto: string; }
interface Integrante { agrupacion: string; agrupActual: string; cargo: string; idContacto: number; representante: boolean; delegado: boolean; orden: number; ci: string; }
interface PadronItem { serie: string; nro: number; primerNombre: string; segundoNombre: string; primerApellido: string; segundoApellido: string; }

type Tab = 'todas' | 'integrantes' | 'padron' | 'nueva';

@Component({
  selector: 'app-agrupaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tabs">
      <a class="tab" [class.active]="tab()==='todas'" (click)="setTab('todas')">Todas</a>
      <a class="tab" [class.active]="tab()==='integrantes'" (click)="setTab('integrantes')">Integrantes por Agrupación</a>
      <a class="tab" [class.active]="tab()==='padron'" (click)="setTab('padron')">Padrón Electoral</a>
      <a class="tab" [class.active]="tab()==='nueva'" (click)="setTab('nueva')">+ Nueva Agrupación</a>
    </div>

    @if (tab()==='todas') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Id</th><th>Cod. Agrup.</th><th>Cod. Depto.</th><th>Pendiente</th>
              <th>Tipo</th><th>Solic.</th><th>Nombre</th><th>Depto.</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of agrupaciones(); track a.id) {
              <tr>
                <td>{{ a.id }}</td>
                <td>{{ a.codAgrup }}</td>
                <td>{{ a.codDepto }}</td>
                <td>{{ a.pendiente ? '☑' : '☐' }}</td>
                <td>{{ a.tipo }}</td>
                <td>{{ a.solic }}</td>
                <td><strong>{{ a.nombre }}</strong></td>
                <td><span class="badge dept">{{ a.depto }}</span></td>
                <td><a class="action-link">Editar</a></td>
              </tr>
            } @empty {
              <tr><td colspan="9"><div class="empty-state"><div class="empty-state-text">Sin agrupaciones</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='integrantes') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1100px">
          <thead>
            <tr>
              <th>Agrupación</th><th>Agrup. Actual</th><th>Cargo</th><th>ID C.</th>
              <th>Repr.</th><th>Delegado</th><th>Orden</th><th>C.I</th>
            </tr>
          </thead>
          <tbody>
            @for (i of integrantes(); track i.idContacto) {
              <tr>
                <td>{{ i.agrupacion }}</td>
                <td>{{ i.agrupActual }}</td>
                <td>{{ i.cargo }}</td>
                <td>{{ i.idContacto }}</td>
                <td>{{ i.representante ? '☑' : '☐' }}</td>
                <td>{{ i.delegado ? '☑' : '☐' }}</td>
                <td>{{ i.orden }}</td>
                <td>{{ i.ci }}</td>
              </tr>
            } @empty {
              <tr><td colspan="8"><div class="empty-state"><div class="empty-state-text">Sin integrantes</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='padron') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Serie</th><th>Nro.</th><th>Primer Nombre</th><th>Segundo Nombre</th><th>Primer Apellido</th><th>Segundo Apellido</th></tr>
          </thead>
          <tbody>
            @for (p of padron(); track $index) {
              <tr>
                <td>{{ p.serie }}</td>
                <td>{{ p.nro }}</td>
                <td>{{ p.primerNombre }}</td>
                <td>{{ p.segundoNombre }}</td>
                <td><strong>{{ p.primerApellido }}</strong></td>
                <td>{{ p.segundoApellido }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='nueva') {
      <div class="card">
        <div class="card-header"><h2 class="card-title">Nueva Agrupación</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Cod. Agrupación</label><input class="form-input" [(ngModel)]="form.codAgrup" name="codAgrup"></div>
            <div class="form-group"><label class="form-label">Nombre *</label><input class="form-input" [(ngModel)]="form.nombre" name="nombre"></div>
            <div class="form-group"><label class="form-label">Departamento</label>
              <select class="form-select" [(ngModel)]="form.depto" name="depto">
                <option value="">Seleccione</option>
                @for (d of deptos; track d) { <option>{{ d }}</option> }
              </select>
            </div>
            <div class="form-group"><label class="form-label">Tipo</label>
              <select class="form-select" [(ngModel)]="form.tipo" name="tipo">
                <option>D</option><option>N</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Pendiente</label>
              <select class="form-select" [(ngModel)]="form.pendiente" name="pendiente">
                <option [ngValue]="false">No</option>
                <option [ngValue]="true">Sí</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Representante</label><input class="form-input" [(ngModel)]="form.representante" name="rep"></div>
            <div class="form-group"><label class="form-label">Domicilio Legal</label><input class="form-input" [(ngModel)]="form.domicilio" name="dom"></div>
            <div class="form-group"><label class="form-label">Ciudad</label><input class="form-input" [(ngModel)]="form.ciudad" name="ciu"></div>
            <div class="form-group"><label class="form-label">Teléfono 1</label><input class="form-input" [(ngModel)]="form.tel1" name="tel1"></div>
            <div class="form-group"><label class="form-label">Teléfono 2</label><input class="form-input" [(ngModel)]="form.tel2" name="tel2"></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" [(ngModel)]="form.email" name="email"></div>
            <div class="form-group full-width"><label class="form-label">Observaciones</label><textarea class="form-textarea" [(ngModel)]="form.obs" name="obs"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="guardar()">Agregar</button>
            <button class="btn btn-secondary" (click)="setTab('todas')">Cancelar</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AgrupacionesComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  tab = signal<Tab>('todas');
  agrupaciones = signal<Agrupacion[]>([]);
  integrantes = signal<Integrante[]>([]);
  padron = signal<PadronItem[]>([]);

  deptos = ['Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida','Lavalleja','Maldonado','Montevideo','Paysandu','Rio Negro','Rivera','Rocha','Salto','San Jose','Soriano','Tacuarembo','Treinta y Tres'];
  form: any = { pendiente: false, tipo: 'D' };

  constructor() {
    this.titleSvc.set('Agrupaciones');
    this.loadTodas();
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'integrantes' && this.integrantes().length === 0) this.loadIntegrantes();
    if (t === 'padron' && this.padron().length === 0) this.loadPadron();
    this.titleSvc.set(t === 'todas' ? 'Agrupaciones' : t === 'integrantes' ? 'Agrupaciones — Integrantes' : t === 'padron' ? 'Agrupaciones — Padrón Electoral' : 'Agrupaciones — Nueva Agrupación');
  }

  loadTodas() { this.http.get<Agrupacion[]>(`${environment.apiUrl}/agrupaciones`).subscribe(x => this.agrupaciones.set(x)); }
  loadIntegrantes() { this.http.get<Integrante[]>(`${environment.apiUrl}/agrupaciones/integrantes`).subscribe(x => this.integrantes.set(x)); }
  loadPadron() { this.http.get<PadronItem[]>(`${environment.apiUrl}/agrupaciones/padron`).subscribe(x => this.padron.set(x)); }

  guardar() {
    alert('Agrupación agregada (demo)');
    this.form = { pendiente: false, tipo: 'D' };
    this.setTab('todas');
  }
}
