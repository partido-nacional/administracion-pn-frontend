import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Agrupacion {
  id: number; codAgrup?: string; codDepto?: string; pendiente: boolean; tipo?: string;
  solic: number; nombre: string; depto?: string; periodo?: string;
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
            <th>Id</th>
            <th>Cod. Agrup.</th>
            <th>Cod. Depto.</th>
            <th>Pendiente</th>
            <th>Tipo</th>
            <th>Solic.</th>
            <th>Nombre</th>
            <th>Depto.</th>
            <th>Período</th>
          </tr>
          <tr class="filter-row">
            <th><input class="column-filter" [ngModel]="fId()"     (ngModelChange)="fId.set($event)"     placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fCod()"    (ngModelChange)="fCod.set($event)"    placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fCodDep()" (ngModelChange)="fCodDep.set($event)" placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fPend()" (ngModelChange)="fPend.set($event)">
                <option value="">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </th>
            <th>
              <select class="column-filter" [ngModel]="fTipo()" (ngModelChange)="fTipo.set($event)">
                <option value="">Todos</option>
                <option value="D">D</option>
                <option value="N">N</option>
                <option value="DEPARTAMENTAL">DEPARTAMENTAL</option>
                <option value="NACIONAL">NACIONAL</option>
              </select>
            </th>
            <th><input class="column-filter" [ngModel]="fSolic()"  (ngModelChange)="fSolic.set($event)"  placeholder="Filtrar..."></th>
            <th><input class="column-filter" [ngModel]="fNombre()" (ngModelChange)="fNombre.set($event)" placeholder="Filtrar..."></th>
            <th>
              <select class="column-filter" [ngModel]="fDepto()" (ngModelChange)="fDepto.set($event)">
                <option value="">Todos</option>
                @for (d of deptos(); track d) { <option [ngValue]="d">{{ d }}</option> }
              </select>
            </th>
            <th>
              <select class="column-filter" [ngModel]="fPeriodo()" (ngModelChange)="fPeriodo.set($event)">
                <option value="">Todos</option>
                @for (p of periodos(); track p) { <option [ngValue]="p">{{ p }}</option> }
              </select>
            </th>
          </tr>
        </thead>
        <tbody>
          @for (a of filtrados(); track a.id) {
            <tr>
              <td>{{ a.id }}</td>
              <td>{{ a.codAgrup || '—' }}</td>
              <td>{{ a.codDepto || '—' }}</td>
              <td>{{ a.pendiente ? '☑' : '☐' }}</td>
              <td>{{ a.tipo || '—' }}</td>
              <td>{{ a.solic ?? '—' }}</td>
              <td><strong>{{ a.nombre }}</strong></td>
              <td><span class="badge dept">{{ a.depto || '—' }}</span></td>
              <td>
                @if (a.periodo) {
                  <span class="badge periodo">{{ a.periodo }}</span>
                } @else { — }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="9"><div class="empty-state"><div class="empty-state-text">No hay agrupaciones que coincidan con el filtro.</div></div></td></tr>
          }
        </tbody>
      </table>
      <div class="footer">
        Mostrando {{ filtrados().length }} de {{ items().length }} agrupaciones
      </div>
    </div></div>
  `,
  styles: [`
    .badge.periodo { background:#eef5ff; color:#1a4f8a; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
    .footer { padding:12px 18px; font-size:13px; color:#666; border-top:1px solid #eef1f5; }
  `]
})
export class AgrupacionesPorPeriodoComponent {
  private http = inject(HttpClient);

  items = signal<Agrupacion[]>([]);

  fId = signal(''); fCod = signal(''); fCodDep = signal('');
  fPend = signal(''); fTipo = signal(''); fSolic = signal('');
  fNombre = signal(''); fDepto = signal(''); fPeriodo = signal('');

  periodos = computed(() => Array.from(new Set(this.items().map(a => a.periodo).filter((p): p is string => !!p))).sort());
  deptos   = computed(() => Array.from(new Set(this.items().map(a => a.depto).filter((d): d is string => !!d))).sort());

  filtrados = computed(() => {
    const norm = (s: any) => (s ?? '').toString().toLowerCase();
    const m = (val: any, q: string) => !q || norm(val).includes(q.toLowerCase());
    const fId = this.fId(), fCod = this.fCod(), fCodDep = this.fCodDep(),
          fPend = this.fPend(), fTipo = this.fTipo(), fSolic = this.fSolic(),
          fNom = this.fNombre(), fDep = this.fDepto(), fPer = this.fPeriodo();
    return this.items().filter(a =>
      m(a.id, fId) &&
      m(a.codAgrup, fCod) &&
      m(a.codDepto, fCodDep) &&
      (!fPend || (fPend === 'si' ? a.pendiente : !a.pendiente)) &&
      (!fTipo || a.tipo === fTipo) &&
      m(a.solic, fSolic) &&
      m(a.nombre, fNom) &&
      (!fDep || a.depto === fDep) &&
      (!fPer || a.periodo === fPer)
    );
  });

  constructor() {
    this.http.get<Agrupacion[]>(`${environment.apiUrl}/agrupaciones`).subscribe(x => this.items.set(x));
  }
}
