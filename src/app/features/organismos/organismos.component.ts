import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { exportarCSV, CsvColumn } from '../../core/exportar-csv';

interface Organismo { id: number; nombre: string; descripcion: string; direccion: string; ciudad: string; departamento: string; pais: string; art44: boolean; ordenDpto: number; observaciones?: string; }
interface InfoOrg { id: number; idTipo: number; idEstatal: number; idPartidario: number; nombreCompania: string; nombreAbreviado: string; departamento: string; }
interface IntegranteOrg { idContacto: number; credCivica: string; apellidos: string; nombres: string; celular: string; mail: string; posicion: string; organismo: string; departamento: string; }
interface RefPart { nombre: string; cargo: string; organismo: string; periodo: string; }

type Tab = 'todos' | 'info' | 'integrantes' | 'referencias';

const norm = (s: any) => (s ?? '').toString().toLowerCase();
const m = (val: any, q: string) => !q || norm(val).includes(q.toLowerCase());

@Component({
  selector: 'app-organismos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topbar-inline">
      <button class="btn btn-secondary" (click)="exportarCsvTab()" title="Exportar CSV">📥 CSV</button>
    </div>

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
            <tr class="filter-row">
              <th><input class="column-filter" [ngModel]="fOrgId()"     (ngModelChange)="fOrgId.set($event)"     placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fOrgNom()"    (ngModelChange)="fOrgNom.set($event)"    placeholder="Filtrar..."></th>
              <th></th>
              <th></th>
              <th></th>
              <th>
                <select class="column-filter" [ngModel]="fOrgDep()" (ngModelChange)="fOrgDep.set($event)">
                  <option value="">Todos</option>
                  @for (d of orgDeptos(); track d) { <option [ngValue]="d">{{ d }}</option> }
                </select>
              </th>
              <th></th>
              <th>
                <select class="column-filter" [ngModel]="fOrgArt()" (ngModelChange)="fOrgArt.set($event)">
                  <option value="">Todos</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </th>
              <th><input class="column-filter" [ngModel]="fOrgOrd()"    (ngModelChange)="fOrgOrd.set($event)"    placeholder="Filtrar..."></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (o of organismosFiltrados(); track o.id) {
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
                <td>
                  <button class="btn-pencil" title="Editar (no implementado)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="11"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
            }
          </tbody>
        </table>
        <div class="footer">Mostrando {{ organismosFiltrados().length }} de {{ organismos().length }}</div>
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
            <tr class="filter-row">
              <th><input class="column-filter" [ngModel]="fInfId()"    (ngModelChange)="fInfId.set($event)"    placeholder="Filtrar..."></th>
              <th></th>
              <th></th>
              <th></th>
              <th><input class="column-filter" [ngModel]="fInfComp()"  (ngModelChange)="fInfComp.set($event)"  placeholder="Filtrar..."></th>
              <th></th>
              <th>
                <select class="column-filter" [ngModel]="fInfDep()" (ngModelChange)="fInfDep.set($event)">
                  <option value="">Todos</option>
                  @for (d of infoDeptos(); track d) { <option [ngValue]="d">{{ d }}</option> }
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (i of infoFiltrados(); track i.id) {
              <tr>
                <td>{{ i.id }}</td>
                <td>{{ i.idTipo }}</td>
                <td>{{ i.idEstatal }}</td>
                <td>{{ i.idPartidario }}</td>
                <td><strong>{{ i.nombreCompania }}</strong></td>
                <td>{{ i.nombreAbreviado }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
                <td>
                  <button class="btn-pencil" title="Editar (no implementado)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
            }
          </tbody>
        </table>
        <div class="footer">Mostrando {{ infoFiltrados().length }} de {{ info().length }}</div>
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
            <tr class="filter-row">
              <th><input class="column-filter" [ngModel]="fIntId()"   (ngModelChange)="fIntId.set($event)"   placeholder="Filtrar..."></th>
              <th></th>
              <th><input class="column-filter" [ngModel]="fIntApe()"  (ngModelChange)="fIntApe.set($event)"  placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fIntNom()"  (ngModelChange)="fIntNom.set($event)"  placeholder="Filtrar..."></th>
              <th></th>
              <th></th>
              <th></th>
              <th><input class="column-filter" [ngModel]="fIntOrg()"  (ngModelChange)="fIntOrg.set($event)"  placeholder="Filtrar..."></th>
              <th>
                <select class="column-filter" [ngModel]="fIntDep()" (ngModelChange)="fIntDep.set($event)">
                  <option value="">Todos</option>
                  @for (d of intDeptos(); track d) { <option [ngValue]="d">{{ d }}</option> }
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (i of integrantesFiltrados(); track i.idContacto) {
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
            } @empty {
              <tr><td colspan="9"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
            }
          </tbody>
        </table>
        <div class="footer">Mostrando {{ integrantesFiltrados().length }} de {{ integrantes().length }}</div>
      </div></div>
    }

    @if (tab()==='referencias') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Nombre</th><th>Cargo</th><th>Organismo</th><th>Período</th></tr>
            <tr class="filter-row">
              <th><input class="column-filter" [ngModel]="fRefNom()" (ngModelChange)="fRefNom.set($event)" placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fRefCar()" (ngModelChange)="fRefCar.set($event)" placeholder="Filtrar..."></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of referenciasFiltradas(); track $index) {
              <tr>
                <td><strong>{{ r.nombre }}</strong></td>
                <td>{{ r.cargo }}</td>
                <td>{{ r.organismo }}</td>
                <td>{{ r.periodo }}</td>
              </tr>
            } @empty {
              <tr><td colspan="4"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
            }
          </tbody>
        </table>
        <div class="footer">Mostrando {{ referenciasFiltradas().length }} de {{ referencias().length }}</div>
      </div></div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; gap:8px; margin-bottom:16px; }
    .footer { padding:12px 18px; font-size:13px; color:#666; border-top:1px solid #eef1f5; }
  `]
})
export class OrganismosComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  tab = signal<Tab>('todos');
  organismos = signal<Organismo[]>([]);
  info = signal<InfoOrg[]>([]);
  integrantes = signal<IntegranteOrg[]>([]);
  referencias = signal<RefPart[]>([]);

  // ── filtros: Todos
  fOrgId = signal(''); fOrgNom = signal(''); fOrgDep = signal('');
  fOrgArt = signal(''); fOrgOrd = signal('');

  orgDeptos = computed(() => Array.from(new Set(this.organismos().map(o => o.departamento).filter(Boolean))).sort());

  organismosFiltrados = computed(() => this.organismos().filter(o =>
    m(o.id, this.fOrgId()) && m(o.nombre, this.fOrgNom()) &&
    (!this.fOrgDep() || o.departamento === this.fOrgDep()) &&
    (!this.fOrgArt() || (this.fOrgArt() === 'si' ? o.art44 : !o.art44)) &&
    m(o.ordenDpto, this.fOrgOrd())
  ));

  // ── filtros: Info
  fInfId = signal(''); fInfComp = signal(''); fInfDep = signal('');

  infoDeptos = computed(() => Array.from(new Set(this.info().map(i => i.departamento).filter(Boolean))).sort());

  infoFiltrados = computed(() => this.info().filter(i =>
    m(i.id, this.fInfId()) &&
    m(i.nombreCompania, this.fInfComp()) &&
    (!this.fInfDep() || i.departamento === this.fInfDep())
  ));

  // ── filtros: Integrantes
  fIntId = signal(''); fIntApe = signal(''); fIntNom = signal('');
  fIntOrg = signal(''); fIntDep = signal('');

  intDeptos = computed(() => Array.from(new Set(this.integrantes().map(i => i.departamento).filter(Boolean))).sort());

  integrantesFiltrados = computed(() => this.integrantes().filter(i =>
    m(i.idContacto, this.fIntId()) &&
    m(i.apellidos, this.fIntApe()) && m(i.nombres, this.fIntNom()) &&
    m(i.organismo, this.fIntOrg()) &&
    (!this.fIntDep() || i.departamento === this.fIntDep())
  ));

  // ── filtros: Referencias
  fRefNom = signal(''); fRefCar = signal('');

  referenciasFiltradas = computed(() => this.referencias().filter(r =>
    m(r.nombre, this.fRefNom()) && m(r.cargo, this.fRefCar())
  ));

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

  exportarCsvTab() {
    const stamp = new Date().toISOString().slice(0, 10);
    const t = this.tab();
    if (t === 'todos') {
      const cols: CsvColumn<Organismo>[] = [
        { get: 'id', label: 'ID' },
        { get: 'nombre', label: 'Nombre' },
        { get: 'descripcion', label: 'Descripción' },
        { get: 'direccion', label: 'Dirección' },
        { get: 'ciudad', label: 'Ciudad' },
        { get: 'departamento', label: 'Departamento' },
        { get: 'pais', label: 'País' },
        { get: 'art44', label: 'Art. 44' },
        { get: 'ordenDpto', label: 'Orden Dpto.' },
        { get: 'observaciones', label: 'Observaciones' }
      ];
      exportarCSV(this.organismosFiltrados(), cols, `organismos-${stamp}.csv`);
    } else if (t === 'info') {
      const cols: CsvColumn<InfoOrg>[] = [
        { get: 'id', label: 'Id Info.' },
        { get: 'idTipo', label: 'Id Tipo' },
        { get: 'idEstatal', label: 'Id Org. Estatal' },
        { get: 'idPartidario', label: 'Id Org. Partidario' },
        { get: 'nombreCompania', label: 'Nombre Compañía' },
        { get: 'nombreAbreviado', label: 'Abreviado' },
        { get: 'departamento', label: 'Departamento' }
      ];
      exportarCSV(this.infoFiltrados(), cols, `info-organismos-${stamp}.csv`);
    } else if (t === 'integrantes') {
      const cols: CsvColumn<IntegranteOrg>[] = [
        { get: 'idContacto', label: 'ID Contacto' },
        { get: 'credCivica', label: 'Cred. Cívica' },
        { get: 'apellidos', label: 'Apellidos' },
        { get: 'nombres', label: 'Nombres' },
        { get: 'celular', label: 'Celular' },
        { get: 'mail', label: 'Mail' },
        { get: 'posicion', label: 'Posición' },
        { get: 'organismo', label: 'Organismo' },
        { get: 'departamento', label: 'Departamento' }
      ];
      exportarCSV(this.integrantesFiltrados(), cols, `integrantes-organismo-${stamp}.csv`);
    } else if (t === 'referencias') {
      const cols: CsvColumn<RefPart>[] = [
        { get: 'nombre', label: 'Nombre' },
        { get: 'cargo', label: 'Cargo' },
        { get: 'organismo', label: 'Organismo' },
        { get: 'periodo', label: 'Período' }
      ];
      exportarCSV(this.referenciasFiltradas(), cols, `referencias-partidarias-${stamp}.csv`);
    }
  }
}
