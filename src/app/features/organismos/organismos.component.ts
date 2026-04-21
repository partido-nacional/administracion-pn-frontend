import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Organismo { id: number; nombre: string; descripcion: string; direccion: string; ciudad: string; departamento: string; pais: string; art44: boolean; ordenDpto: number; observaciones?: string; }
interface InfoOrg { id: number; idTipo: number; idEstatal: number; idPartidario: number; nombreCompania: string; nombreAbreviado: string; departamento: string; }
interface IntegranteOrg { idContacto: number; credCivica: string; apellidos: string; nombres: string; celular: string; mail: string; posicion: string; organismo: string; departamento: string; }
interface RefPart { nombre: string; cargo: string; organismo: string; periodo: string; }

type Tab = 'todos' | 'info' | 'integrantes' | 'referencias';

@Component({
  selector: 'app-organismos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tabs">
      <a class="tab" [class.active]="tab()==='todos'"        (click)="setTab('todos')">Todos los Organismos</a>
      <a class="tab" [class.active]="tab()==='info'"         (click)="setTab('info')">Info de la Organización</a>
      <a class="tab" [class.active]="tab()==='integrantes'"  (click)="setTab('integrantes')">Integrantes</a>
      <a class="tab" [class.active]="tab()==='referencias'"  (click)="setTab('referencias')">Ref. Partidarias</a>
    </div>

    @if (tab()==='todos') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead>
            <tr>
              <th>Id</th><th>Nombre</th><th>Descripción</th><th>Dirección</th>
              <th>Ciudad</th><th>Departamento</th><th>País</th><th>Art. 44</th>
              <th>Orden Dpto.</th><th>Observaciones</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (o of organismos(); track o.id) {
              <tr>
                <td>{{ o.id }}</td>
                <td><strong>{{ o.nombre }}</strong></td>
                <td>{{ o.descripcion }}</td>
                <td>{{ o.direccion }}</td>
                <td>{{ o.ciudad }}</td>
                <td><span class="badge dept">{{ o.departamento }}</span></td>
                <td>{{ o.pais }}</td>
                <td>{{ o.art44 ? '☑' : '☐' }}</td>
                <td>{{ o.ordenDpto }}</td>
                <td>{{ o.observaciones || '—' }}</td>
                <td><a class="action-link">Editar</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='info') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Id Info.</th><th>Id Tipo</th><th>Id Org. Est.</th><th>Id Org. Part.</th>
              <th>Nombre Compañía</th><th>Abreviado</th><th>Departamento</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (i of info(); track i.id) {
              <tr>
                <td>{{ i.id }}</td>
                <td>{{ i.idTipo }}</td>
                <td>{{ i.idEstatal }}</td>
                <td>{{ i.idPartidario }}</td>
                <td><strong>{{ i.nombreCompania }}</strong></td>
                <td>{{ i.nombreAbreviado }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
                <td><a class="action-link">Editar</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='integrantes') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>ID Contacto</th><th>Cred. Cívica</th><th>Apellidos</th><th>Nombres</th>
              <th>Celular</th><th>Mail</th><th>Posición</th><th>Organismo</th><th>Depto.</th>
            </tr>
          </thead>
          <tbody>
            @for (i of integrantes(); track i.idContacto) {
              <tr>
                <td>{{ i.idContacto }}</td>
                <td>{{ i.credCivica }}</td>
                <td><strong>{{ i.apellidos }}</strong></td>
                <td>{{ i.nombres }}</td>
                <td>{{ i.celular }}</td>
                <td>{{ i.mail }}</td>
                <td>{{ i.posicion }}</td>
                <td>{{ i.organismo }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (tab()==='referencias') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead><tr><th>Nombre</th><th>Cargo</th><th>Organismo</th><th>Período</th></tr></thead>
          <tbody>
            @for (r of referencias(); track $index) {
              <tr>
                <td><strong>{{ r.nombre }}</strong></td>
                <td>{{ r.cargo }}</td>
                <td>{{ r.organismo }}</td>
                <td>{{ r.periodo }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }
  `
})
export class OrganismosComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  tab = signal<Tab>('todos');
  organismos = signal<Organismo[]>([]);
  info = signal<InfoOrg[]>([]);
  integrantes = signal<IntegranteOrg[]>([]);
  referencias = signal<RefPart[]>([]);

  constructor() {
    this.titleSvc.set('Organismos');
    this.http.get<Organismo[]>(`${environment.apiUrl}/organismos`).subscribe(x => this.organismos.set(x));
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'info' && this.info().length === 0)
      this.http.get<InfoOrg[]>(`${environment.apiUrl}/organismos/info`).subscribe(x => this.info.set(x));
    if (t === 'integrantes' && this.integrantes().length === 0)
      this.http.get<IntegranteOrg[]>(`${environment.apiUrl}/organismos/integrantes`).subscribe(x => this.integrantes.set(x));
    if (t === 'referencias' && this.referencias().length === 0)
      this.http.get<RefPart[]>(`${environment.apiUrl}/organismos/referencias`).subscribe(x => this.referencias.set(x));
  }
}
