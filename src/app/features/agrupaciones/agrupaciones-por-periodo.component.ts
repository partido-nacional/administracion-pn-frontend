import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AgrupacionPeriodoRow {
  periodoId: number;
  periodo: string;
  pendiente: boolean;
  agrupacionId: number;
  codAgrup?: string;
  codDepto?: string;
  tipo?: string;
  nombre: string;
  depto?: string;
  solic: number;
  sector?: string;
  clasificacion?: string;
  sublema1?: string;
  sublema2?: string;
  sublema3?: string;
  sublema4?: string;
  sublema5?: string;
  sublemaRenunciado?: string;
}

@Component({
  selector: 'app-agrupaciones-por-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card"><div class="card-body" style="padding:0; overflow-x:auto">
      <table class="table">
        <thead>
          <tr>
            <th>Id Per.</th>
            <th>Período</th>
            <th>Estado</th>
            <th>Id Agr.</th>
            <th>Cod. Agrup.</th>
            <th>Cod. Depto.</th>
            <th>Tipo</th>
            <th>Nombre</th>
            <th>Depto.</th>
            <th>Sector</th>
            <th>Sublemas</th>
          </tr>
          <tr class="filter-row">
            <th><input class="column-filter" [ngModel]="fId()"     (ngModelChange)="fId.set($event)"     placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fPeriodo()" (ngModelChange)="fPeriodo.set($event)">
                <option value="">Todos</option>
                @for (p of periodos(); track p) { <option [ngValue]="p">{{ p }}</option> }
              </select>
            </th>
            <th>
              <select class="column-filter" [ngModel]="fPend()" (ngModelChange)="fPend.set($event)">
                <option value="">Todos</option>
                <option value="si">Pendiente</option>
                <option value="no">Aprobada</option>
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fAgrId()"  (ngModelChange)="fAgrId.set($event)"  placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fCod()"    (ngModelChange)="fCod.set($event)"    placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fCodDep()" (ngModelChange)="fCodDep.set($event)" placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fTipo()" (ngModelChange)="fTipo.set($event)">
                <option value="">Todos</option>
                <option value="D">D</option>
                <option value="N">N</option>
                <option value="DEPARTAMENTAL">DEPARTAMENTAL</option>
                <option value="NACIONAL">NACIONAL</option>
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event)" placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event)">
                <option value="">Todos</option>
                @for (d of deptos(); track d) { <option [ngValue]="d">{{ d }}</option> }
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fSector()" (ngModelChange)="fSector.set($event)" placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fSublema()" (ngModelChange)="fSublema.set($event)" placeholder="Filtrar..."></th>
          </tr>
        </thead>
        <tbody>
          @for (r of filtrados(); track r.periodoId) {
            <tr>
              <td>{{ r.periodoId }}</td>
              <td><span class="badge periodo">{{ r.periodo }}</span></td>
              <td>
                @if (r.pendiente) { <span class="badge st-pend">Pendiente</span> }
                @else { <span class="badge st-ok">Aprobada</span> }
              </td>
              <td>{{ r.agrupacionId }}</td>
              <td>{{ r.codAgrup || '—' }}</td>
              <td>{{ r.codDepto || '—' }}</td>
              <td>{{ r.tipo || '—' }}</td>
              <td><strong>{{ r.nombre }}</strong></td>
              <td><span class="badge dept">{{ r.depto || '—' }}</span></td>
              <td>{{ r.sector || '—' }}</td>
              <td>{{ joinSublemas(r) }}</td>
            </tr>
          } @empty {
            <tr><td colspan="11"><div class="empty-state"><div class="empty-state-text">No hay agrupaciones por período que coincidan con el filtro.</div></div></td></tr>
          }
        </tbody>
      </table>
      <div class="footer">
        Mostrando {{ filtrados().length }} de {{ items().length }} agrupaciones-período
      </div>
    </div></div>
  `,
  styles: [`
    .badge.periodo { background:#eef5ff; color:#1a4f8a; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
    .badge.st-pend { background:#fff3cd; color:#856404; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
    .badge.st-ok   { background:#e6f4ea; color:#1f6f3b; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
    .footer { padding:12px 18px; font-size:13px; color:#666; border-top:1px solid #eef1f5; }
  `]
})
export class AgrupacionesPorPeriodoComponent {
  private http = inject(HttpClient);

  items = signal<AgrupacionPeriodoRow[]>([]);

  fId = signal(''); fPeriodo = signal(''); fPend = signal('');
  fAgrId = signal(''); fCod = signal(''); fCodDep = signal('');
  fTipo = signal(''); fNombre = signal(''); fDepto = signal('');
  fSector = signal(''); fSublema = signal('');

  periodos = computed(() => Array.from(new Set(this.items().map(a => a.periodo).filter(Boolean))).sort());
  deptos   = computed(() => Array.from(new Set(this.items().map(a => a.depto).filter((d): d is string => !!d))).sort());

  joinSublemas(r: AgrupacionPeriodoRow): string {
    const s = [r.sublema1, r.sublema2, r.sublema3, r.sublema4, r.sublema5].filter(Boolean);
    return s.length ? s.join(', ') : '—';
  }

  filtrados = computed(() => {
    const norm = (s: any) => (s ?? '').toString().toLowerCase();
    const m = (val: any, q: string) => !q || norm(val).includes(q.toLowerCase());
    const fId = this.fId(), fPer = this.fPeriodo(), fPend = this.fPend(),
          fAgrId = this.fAgrId(), fCod = this.fCod(), fCodDep = this.fCodDep(),
          fTipo = this.fTipo(), fNom = this.fNombre(), fDep = this.fDepto(),
          fSec = this.fSector(), fSub = this.fSublema();
    return this.items().filter(r =>
      m(r.periodoId, fId) &&
      (!fPer || r.periodo === fPer) &&
      (!fPend || (fPend === 'si' ? r.pendiente : !r.pendiente)) &&
      m(r.agrupacionId, fAgrId) &&
      m(r.codAgrup, fCod) &&
      m(r.codDepto, fCodDep) &&
      (!fTipo || r.tipo === fTipo) &&
      m(r.nombre, fNom) &&
      (!fDep || r.depto === fDep) &&
      m(r.sector, fSec) &&
      m(this.joinSublemas(r), fSub)
    );
  });

  constructor() {
    this.http.get<AgrupacionPeriodoRow[]>(`${environment.apiUrl}/agrupaciones-periodos`).subscribe(x => this.items.set(x));
  }
}
