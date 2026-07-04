import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { exportarCSV, CsvColumn } from '../../core/exportar-csv';
import { OrganismosService } from '../../core/services/organismos.service';
import {
  Ambito, OrganismoTodosDto, OrganismoInput,
  TipoOrganismoDto, InfoOrganizacionDto, InfoOrganizacionInput,
} from '../../core/models/organismos';

/** Display-only de las tabs fuera de alcance (Integrantes / Referencias): shape heredado. */
interface IntegranteOrg { idContacto: number; credCivica: string; apellidos: string; nombres: string; celular: string; mail: string; posicion: string; organismo: string; departamento: string; }
interface RefPart { nombre: string; cargo: string; organismo: string; periodo: string; }

type Tab = 'todos' | 'info' | 'integrantes' | 'referencias';
type ModalKind = 'organismo' | 'info';
type ModalMode = 'nueva' | 'editar';

const norm = (s: any) => (s ?? '').toString().toLowerCase();
const m = (val: any, q: string) => !q || norm(val).includes(q.toLowerCase());

@Component({
  selector: 'app-organismos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topbar-inline">
      @if (tab()==='todos') { <button class="btn btn-primary" (click)="abrirNuevoOrganismo()">+ Nuevo Organismo</button> }
      @if (tab()==='info') { <button class="btn btn-primary" (click)="abrirNuevaInfo()">+ Nueva Info</button> }
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
        <table class="table" style="min-width:1400px">
          <thead>
            <tr>
              <th>Id</th><th>Ámbito</th><th>Nombre</th><th>Descripción</th><th>Dirección</th>
              <th>Ciudad</th><th>Departamento</th><th>País</th><th>Art. 44</th>
              <th>Orden Dpto.</th><th>Observaciones</th><th></th>
            </tr>
            <tr class="filter-row">
              <th><input class="column-filter" [ngModel]="fOrgId()"     (ngModelChange)="fOrgId.set($event)"     placeholder="Filtrar..."></th>
              <th>
                <select class="column-filter" [ngModel]="fOrgAmb()" (ngModelChange)="fOrgAmb.set($event)">
                  <option value="">Todos</option>
                  <option value="Estatal">Estatal</option>
                  <option value="Partidario">Partidario</option>
                </select>
              </th>
              <th><input class="column-filter" [ngModel]="fOrgNom()"    (ngModelChange)="fOrgNom.set($event)"    placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fOrgDesc()"   (ngModelChange)="fOrgDesc.set($event)"   placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fOrgDir()"    (ngModelChange)="fOrgDir.set($event)"    placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fOrgCiu()"    (ngModelChange)="fOrgCiu.set($event)"    placeholder="Filtrar..."></th>
              <th>
                <select class="column-filter" [ngModel]="fOrgDep()" (ngModelChange)="fOrgDep.set($event)">
                  <option value="">Todos</option>
                  @for (d of orgDeptos(); track d) { <option [ngValue]="d">{{ d }}</option> }
                </select>
              </th>
              <th><input class="column-filter" [ngModel]="fOrgPais()"   (ngModelChange)="fOrgPais.set($event)"   placeholder="Filtrar..."></th>
              <th>
                <select class="column-filter" [ngModel]="fOrgArt()" (ngModelChange)="fOrgArt.set($event)">
                  <option value="">Todos</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </th>
              <th><input class="column-filter" [ngModel]="fOrgOrd()"    (ngModelChange)="fOrgOrd.set($event)"    placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fOrgObs()"    (ngModelChange)="fOrgObs.set($event)"    placeholder="Filtrar..."></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (o of organismosFiltrados(); track $index) {
              <tr>
                <td>{{ o.id }}</td>
                <td><span class="badge" [class.amb-est]="o.ambito==='Estatal'" [class.amb-part]="o.ambito==='Partidario'">{{ o.ambito }}</span></td>
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
                  <button class="btn-pencil" (click)="abrirEditarOrganismo(o)" title="Editar">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="12"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
            }
          </tbody>
        </table>
        <div class="footer">Mostrando {{ organismosFiltrados().length }} de {{ organismos().length }}</div>
      </div></div>
    }

    @if (tab()==='info') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1100px">
          <thead>
            <tr>
              <th>Id Info.</th><th>Id Tipo</th><th>Id Org. Est.</th><th>Id Org. Part.</th>
              <th>Dirección</th><th>Teléfono</th><th>Email</th><th>Observaciones</th><th></th>
            </tr>
            <tr class="filter-row">
              <th><input class="column-filter" [ngModel]="fInfId()"    (ngModelChange)="fInfId.set($event)"    placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fInfTipo()"  (ngModelChange)="fInfTipo.set($event)"  placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fInfEst()"   (ngModelChange)="fInfEst.set($event)"   placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fInfPart()"  (ngModelChange)="fInfPart.set($event)"  placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fInfDir()"   (ngModelChange)="fInfDir.set($event)"   placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fInfTel()"   (ngModelChange)="fInfTel.set($event)"   placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fInfMail()"  (ngModelChange)="fInfMail.set($event)"  placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fInfObs()"   (ngModelChange)="fInfObs.set($event)"   placeholder="Filtrar..."></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (i of infoFiltrados(); track i.id) {
              <tr>
                <td>{{ i.id }}</td>
                <td>{{ i.tipoOrganismoId ?? '—' }}</td>
                <td>{{ i.organismoEstatalId ?? '—' }}</td>
                <td>{{ i.organismoPartidarioId ?? '—' }}</td>
                <td>{{ i.direccion || '—' }}</td>
                <td>{{ i.telefono || '—' }}</td>
                <td>{{ i.email || '—' }}</td>
                <td>{{ i.observaciones || '—' }}</td>
                <td>
                  <button class="btn-pencil" (click)="abrirEditarInfo(i)" title="Editar">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9"><div class="empty-state"><div class="empty-state-text">Sin resultados</div></div></td></tr>
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
              <th><input class="column-filter" [ngModel]="fIntCred()" (ngModelChange)="fIntCred.set($event)" placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fIntApe()"  (ngModelChange)="fIntApe.set($event)"  placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fIntNom()"  (ngModelChange)="fIntNom.set($event)"  placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fIntCel()"  (ngModelChange)="fIntCel.set($event)"  placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fIntMail()" (ngModelChange)="fIntMail.set($event)" placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fIntPos()"  (ngModelChange)="fIntPos.set($event)"  placeholder="Filtrar..."></th>
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
              <th><input class="column-filter" [ngModel]="fRefOrg()" (ngModelChange)="fRefOrg.set($event)" placeholder="Filtrar..."></th>
              <th><input class="column-filter" [ngModel]="fRefPer()" (ngModelChange)="fRefPer.set($event)" placeholder="Filtrar..."></th>
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

    @if (modalKind()) {
      <div class="modal-backdrop" (click)="cerrarModal()">
        <div class="nv-modal" (click)="$event.stopPropagation()">
          <div class="nv-header">
            <div class="nv-title">{{ tituloModal() }}</div>
            <button class="nv-close" (click)="cerrarModal()">×</button>
          </div>
          <div class="nv-body">
            @if (modalKind()==='organismo') {
              <div class="nv-grid">
                <div class="fg"><label>Ámbito *</label>
                  <select [(ngModel)]="form.ambito" name="o-amb" [disabled]="modalMode()==='editar'">
                    <option value="Estatal">Estatal</option>
                    <option value="Partidario">Partidario</option>
                  </select>
                </div>
                <div class="fg"><label>Tipo de Organismo *</label>
                  <select [(ngModel)]="form.tipoOrganismoId" name="o-tipo">
                    <option [ngValue]="null">— Seleccioná —</option>
                    @for (t of tipos(); track t.id) { <option [ngValue]="t.id">{{ t.nombre }}</option> }
                  </select>
                </div>
                <div class="fg full"><label>Nombre *</label><input [(ngModel)]="form.nombre" name="o-nombre"></div>
                <div class="fg"><label>Nombre Compañía</label><input [(ngModel)]="form.nombreCompania" name="o-comp"></div>
                <div class="fg"><label>Categoría</label><input [(ngModel)]="form.categoria" name="o-cat"></div>
                <div class="fg full"><label>Descripción</label><input [(ngModel)]="form.descripcion" name="o-desc"></div>
                <div class="fg full"><label>Dirección</label><input [(ngModel)]="form.direccion" name="o-dir"></div>
                <div class="fg"><label>Ciudad</label><input [(ngModel)]="form.ciudad" name="o-ciu"></div>
                <div class="fg"><label>Departamento</label>
                  <select [(ngModel)]="form.departamento" name="o-dep">
                    <option value="">—</option>
                    @for (d of departamentos; track d) { <option [ngValue]="d">{{ d }}</option> }
                  </select>
                </div>
                <div class="fg"><label>País</label><input [(ngModel)]="form.pais" name="o-pais"></div>
                <div class="fg"><label>Orden Dpto.</label><input type="number" [(ngModel)]="form.ordenDpto" name="o-ord"></div>
                <div class="fg full"><label>Observaciones</label><input [(ngModel)]="form.observaciones" name="o-obs"></div>
                <div class="fg check"><label><input type="checkbox" [(ngModel)]="form.art44" name="o-art"> Art. 44</label></div>
              </div>
            } @else {
              <div class="nv-grid">
                <div class="fg"><label>Tipo de Organismo</label>
                  <select [(ngModel)]="form.tipoOrganismoId" name="i-tipo">
                    <option [ngValue]="null">—</option>
                    @for (t of tipos(); track t.id) { <option [ngValue]="t.id">{{ t.nombre }}</option> }
                  </select>
                </div>
                <div class="fg"><label>Org. Estatal ID</label><input type="number" [(ngModel)]="form.organismoEstatalId" name="i-est"></div>
                <div class="fg"><label>Org. Partidario ID</label><input type="number" [(ngModel)]="form.organismoPartidarioId" name="i-part"></div>
                <div class="fg full"><label>Dirección</label><input [(ngModel)]="form.direccion" name="i-dir"></div>
                <div class="fg"><label>Teléfono</label><input [(ngModel)]="form.telefono" name="i-tel"></div>
                <div class="fg"><label>Email</label><input [(ngModel)]="form.email" name="i-mail"></div>
                <div class="fg full"><label>Observaciones</label><input [(ngModel)]="form.observaciones" name="i-obs"></div>
              </div>
            }
            @if (modalError()) { <div class="nv-err">{{ modalError() }}</div> }
          </div>
          <div class="nv-footer">
            <button class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="guardar()" [disabled]="modalBusy()">
              {{ modalBusy() ? 'Guardando…' : (modalMode()==='editar' ? 'Guardar cambios' : 'Crear') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; gap:8px; margin-bottom:16px; }
    .footer { padding:12px 18px; font-size:13px; color:#666; border-top:1px solid #eef1f5; }
    .badge.amb-est { background:#e6f0ff; color:#1a4f8a; }
    .badge.amb-part { background:#fdeede; color:#8a5a1a; }

    .modal-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.55);
      display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;
    }
    .nv-modal {
      background:#fff; border-radius:10px; width:min(760px, 100%);
      max-height:92vh; display:flex; flex-direction:column;
      box-shadow:0 20px 50px rgba(0,0,0,.3); overflow:hidden;
    }
    .nv-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 20px; background:#1e3a8a; color:#fff;
    }
    .nv-title { font-size:16px; font-weight:600; }
    .nv-close { background:transparent; border:none; color:#fff; font-size:24px; cursor:pointer; }
    .nv-body { padding:18px 22px; overflow-y:auto; flex:1; }
    .nv-footer {
      padding:12px 20px; border-top:1px solid #eef1f5; background:#fafbfd;
      display:flex; gap:10px; justify-content:flex-end;
    }
    .nv-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:12px 16px; }
    @media (max-width:600px) { .nv-grid { grid-template-columns:1fr; } }
    .fg { display:flex; flex-direction:column; gap:4px; }
    .fg.full { grid-column:1 / -1; }
    .fg.check { justify-content:flex-end; }
    .fg.check label { flex-direction:row; display:flex; align-items:center; gap:8px; text-transform:none; font-size:13px; color:#222; }
    .fg label { font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:.4px; }
    .fg input:not([type=checkbox]), .fg select {
      padding:8px 10px; font-size:13px; font-family:inherit;
      border:1px solid #cfd6e0; border-radius:5px; outline:none;
    }
    .fg input:focus, .fg select:focus {
      border-color:#1e3a8a; box-shadow:0 0 0 3px rgba(30,58,138,.12);
    }
    .fg select:disabled { background:#f0f2f5; color:#888; }
    .nv-err {
      margin-top:12px; padding:8px 12px; background:#fdecea; color:#a8261b;
      border-radius:5px; font-size:13px;
    }
  `]
})
export class OrganismosComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  private svc = inject(OrganismosService);

  tab = signal<Tab>('todos');
  organismos = signal<OrganismoTodosDto[]>([]);
  info = signal<InfoOrganizacionDto[]>([]);
  tipos = signal<TipoOrganismoDto[]>([]);
  integrantes = signal<IntegranteOrg[]>([]);
  referencias = signal<RefPart[]>([]);

  departamentos = [
    'Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida',
    'Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha',
    'Salto','San José','Soriano','Tacuarembó','Treinta y Tres','Nacional'
  ];

  // ── filtros: Todos
  fOrgId = signal(''); fOrgAmb = signal(''); fOrgNom = signal(''); fOrgDesc = signal('');
  fOrgDir = signal(''); fOrgCiu = signal(''); fOrgDep = signal('');
  fOrgPais = signal(''); fOrgArt = signal(''); fOrgOrd = signal('');
  fOrgObs = signal('');

  orgDeptos = computed(() => Array.from(new Set(this.organismos().map(o => o.departamento).filter(Boolean))).sort() as string[]);

  organismosFiltrados = computed(() => this.organismos().filter(o =>
    m(o.id, this.fOrgId()) &&
    (!this.fOrgAmb() || o.ambito === this.fOrgAmb()) &&
    m(o.nombre, this.fOrgNom()) &&
    m(o.descripcion, this.fOrgDesc()) && m(o.direccion, this.fOrgDir()) &&
    m(o.ciudad, this.fOrgCiu()) &&
    (!this.fOrgDep() || o.departamento === this.fOrgDep()) &&
    m(o.pais, this.fOrgPais()) &&
    (!this.fOrgArt() || (this.fOrgArt() === 'si' ? o.art44 : !o.art44)) &&
    m(o.ordenDpto, this.fOrgOrd()) &&
    m(o.observaciones, this.fOrgObs())
  ));

  // ── filtros: Info
  fInfId = signal(''); fInfTipo = signal(''); fInfEst = signal('');
  fInfPart = signal(''); fInfDir = signal(''); fInfTel = signal('');
  fInfMail = signal(''); fInfObs = signal('');

  infoFiltrados = computed(() => this.info().filter(i =>
    m(i.id, this.fInfId()) && m(i.tipoOrganismoId, this.fInfTipo()) &&
    m(i.organismoEstatalId, this.fInfEst()) && m(i.organismoPartidarioId, this.fInfPart()) &&
    m(i.direccion, this.fInfDir()) && m(i.telefono, this.fInfTel()) &&
    m(i.email, this.fInfMail()) && m(i.observaciones, this.fInfObs())
  ));

  // ── filtros: Integrantes
  fIntId = signal(''); fIntCred = signal(''); fIntApe = signal('');
  fIntNom = signal(''); fIntCel = signal(''); fIntMail = signal('');
  fIntPos = signal(''); fIntOrg = signal(''); fIntDep = signal('');

  intDeptos = computed(() => Array.from(new Set(this.integrantes().map(i => i.departamento).filter(Boolean))).sort());

  integrantesFiltrados = computed(() => this.integrantes().filter(i =>
    m(i.idContacto, this.fIntId()) && m(i.credCivica, this.fIntCred()) &&
    m(i.apellidos, this.fIntApe()) && m(i.nombres, this.fIntNom()) &&
    m(i.celular, this.fIntCel()) && m(i.mail, this.fIntMail()) &&
    m(i.posicion, this.fIntPos()) && m(i.organismo, this.fIntOrg()) &&
    (!this.fIntDep() || i.departamento === this.fIntDep())
  ));

  // ── filtros: Referencias
  fRefNom = signal(''); fRefCar = signal(''); fRefOrg = signal(''); fRefPer = signal('');

  referenciasFiltradas = computed(() => this.referencias().filter(r =>
    m(r.nombre, this.fRefNom()) && m(r.cargo, this.fRefCar()) &&
    m(r.organismo, this.fRefOrg()) && m(r.periodo, this.fRefPer())
  ));

  // ── modal (alta/edición de Organismo o Info) ──────────────
  modalKind = signal<ModalKind | null>(null);
  modalMode = signal<ModalMode>('nueva');
  editId = signal<number | null>(null);
  modalBusy = signal(false);
  modalError = signal('');
  form: any = {};

  tituloModal = computed(() => {
    if (this.modalKind() === 'info') return this.modalMode() === 'editar' ? 'Editar Info de Organización' : 'Nueva Info de Organización';
    return this.modalMode() === 'editar' ? 'Editar Organismo' : 'Nuevo Organismo';
  });

  constructor() {
    this.titleSvc.set('Organismos');
    this.svc.getTodos().subscribe(x => this.organismos.set(x));
    this.svc.getTipos().subscribe(x => this.tipos.set(x));
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'info' && this.info().length === 0) this.loadInfo();
    if (t === 'integrantes' && this.integrantes().length === 0)
      this.http.get<IntegranteOrg[]>(`${environment.apiUrl}/organismos/integrantes`).subscribe(x => this.integrantes.set(x));
    if (t === 'referencias' && this.referencias().length === 0)
      this.http.get<RefPart[]>(`${environment.apiUrl}/organismos/referencias`).subscribe(x => this.referencias.set(x));
  }

  private loadTodos() { this.svc.getTodos().subscribe(x => this.organismos.set(x)); }
  private loadInfo() { this.svc.getInfo().subscribe(x => this.info.set(x)); }

  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.errorCode || err?.message || fallback;
  }

  // ── Organismo ─────────────────────────────────────────────
  abrirNuevoOrganismo() {
    this.form = { ambito: 'Estatal', tipoOrganismoId: null, nombre: '', nombreCompania: '', categoria: '', descripcion: '', direccion: '', ciudad: '', departamento: '', pais: '', ordenDpto: 0, observaciones: '', art44: false };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('organismo');
  }

  abrirEditarOrganismo(o: OrganismoTodosDto) {
    this.form = {
      ambito: o.ambito,
      tipoOrganismoId: o.tipoOrganismoId ?? null,
      nombre: o.nombre || '',
      nombreCompania: o.nombreCompania || '',
      categoria: o.categoria || '',
      descripcion: o.descripcion || '',
      direccion: o.direccion || '',
      ciudad: o.ciudad || '',
      departamento: o.departamento || '',
      pais: o.pais || '',
      ordenDpto: o.ordenDpto ?? 0,
      observaciones: o.observaciones || '',
      art44: !!o.art44,
    };
    this.modalError.set(''); this.editId.set(o.id);
    this.modalMode.set('editar'); this.modalKind.set('organismo');
  }

  // ── Info ──────────────────────────────────────────────────
  abrirNuevaInfo() {
    this.form = { tipoOrganismoId: null, organismoEstatalId: null, organismoPartidarioId: null, direccion: '', telefono: '', email: '', observaciones: '' };
    this.modalError.set(''); this.editId.set(null);
    this.modalMode.set('nueva'); this.modalKind.set('info');
  }

  abrirEditarInfo(i: InfoOrganizacionDto) {
    this.form = {
      tipoOrganismoId: i.tipoOrganismoId ?? null,
      organismoEstatalId: i.organismoEstatalId ?? null,
      organismoPartidarioId: i.organismoPartidarioId ?? null,
      direccion: i.direccion || '',
      telefono: i.telefono || '',
      email: i.email || '',
      observaciones: i.observaciones || '',
    };
    this.modalError.set(''); this.editId.set(i.id);
    this.modalMode.set('editar'); this.modalKind.set('info');
  }

  cerrarModal() {
    this.modalKind.set(null); this.editId.set(null); this.modalError.set('');
  }

  guardar() {
    if (this.modalKind() === 'organismo') this.guardarOrganismo();
    else this.guardarInfo();
  }

  private num(v: any): number | null { return v == null || v === '' ? null : Number(v); }

  private guardarOrganismo() {
    if (!this.form.nombre?.trim()) { this.modalError.set('El nombre es obligatorio.'); return; }
    if (this.form.tipoOrganismoId == null) { this.modalError.set('El tipo de organismo es obligatorio.'); return; }
    const ambito = this.form.ambito as Ambito;
    const input: OrganismoInput = {
      nombre: this.form.nombre.trim(),
      nombreCompania: this.form.nombreCompania || null,
      tipoOrganismoId: Number(this.form.tipoOrganismoId),
      categoria: this.form.categoria || null,
      descripcion: this.form.descripcion || null,
      direccion: this.form.direccion || null,
      ciudad: this.form.ciudad || null,
      departamento: this.form.departamento || null,
      pais: this.form.pais || null,
      art44: !!this.form.art44,
      ordenDpto: this.form.ordenDpto == null || this.form.ordenDpto === '' ? 0 : Number(this.form.ordenDpto),
      observaciones: this.form.observaciones || null,
    };
    this.modalBusy.set(true); this.modalError.set('');
    const id = this.editId();
    const req = this.modalMode() === 'editar' && id != null
      ? this.svc.updateOrganismo(ambito, id, input)
      : this.svc.createOrganismo(ambito, input);
    req.subscribe({
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.loadTodos(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar el organismo.')); },
    });
  }

  private guardarInfo() {
    const input: InfoOrganizacionInput = {
      tipoOrganismoId: this.num(this.form.tipoOrganismoId),
      organismoEstatalId: this.num(this.form.organismoEstatalId),
      organismoPartidarioId: this.num(this.form.organismoPartidarioId),
      direccion: this.form.direccion || null,
      telefono: this.form.telefono || null,
      email: this.form.email || null,
      observaciones: this.form.observaciones || null,
    };
    this.modalBusy.set(true); this.modalError.set('');
    const id = this.editId();
    const req = this.modalMode() === 'editar' && id != null
      ? this.svc.updateInfo(id, input)
      : this.svc.createInfo(input);
    req.subscribe({
      next: () => { this.modalBusy.set(false); this.cerrarModal(); this.loadInfo(); },
      error: (err) => { this.modalBusy.set(false); this.modalError.set(this.extractError(err, 'No se pudo guardar la info.')); },
    });
  }

  exportarCsvTab() {
    const stamp = new Date().toISOString().slice(0, 10);
    const t = this.tab();
    if (t === 'todos') {
      const cols: CsvColumn<OrganismoTodosDto>[] = [
        { get: 'id', label: 'ID' },
        { get: 'ambito', label: 'Ámbito' },
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
      const cols: CsvColumn<InfoOrganizacionDto>[] = [
        { get: 'id', label: 'Id Info.' },
        { get: 'tipoOrganismoId', label: 'Id Tipo' },
        { get: 'organismoEstatalId', label: 'Id Org. Estatal' },
        { get: 'organismoPartidarioId', label: 'Id Org. Partidario' },
        { get: 'direccion', label: 'Dirección' },
        { get: 'telefono', label: 'Teléfono' },
        { get: 'email', label: 'Email' },
        { get: 'observaciones', label: 'Observaciones' }
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
