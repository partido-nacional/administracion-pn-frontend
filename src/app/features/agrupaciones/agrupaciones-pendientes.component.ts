import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AgrupacionPendiente {
  id: number;
  fichaAgrupacionOrigenId?: number;
  nombre: string;
  codAgrup?: string; codDepto?: string; pendiente: boolean; tipo?: string; solic: number; depto?: string;
  clasificacion?: string; solicita?: string; sector?: string;
  fechaSolicitud?: string; codAnt?: string; sublemaRenunciado?: string; nombreAnt?: string;
  domicilioLegal?: string; ciudad?: string;
  tel1?: string; tel2?: string; fax?: string; email?: string;
  formaRepresentacion?: string; representante?: string; delegadoCE?: string; formaActuacion?: string;
  fechaIngComis?: string; fechaRecAgrup?: string; fechaEntrCE?: string; fechaCircCE?: string;
  observaciones?: string; obsCE?: string; nota?: string;
  antecedentes?: string; resolucionComision?: string;
  sublema1?: string; sublema2?: string; sublema3?: string; sublema4?: string; sublema5?: string;
}

@Component({
  selector: 'app-agrupaciones-pendientes',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando agrupaciones pendientes…</div></div></div></div>
    } @else if (items().length === 0) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">No hay agrupaciones pendientes. Promové una desde la pestaña Fichas de Agrupación Web.</div></div></div></div>
    } @else {
      <div class="card"><div class="card-body" style="padding:0; overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th style="width:34px"></th>
              <th>Id</th><th>Cod. Agrup.</th><th>Cod. Depto.</th>
              <th>Tipo</th><th>Nombre</th><th>Depto.</th>
              <th>Origen</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of items(); track a.id) {
              <tr class="clickable" [class.selected]="expandido() === a.id" (click)="toggle(a.id)">
                <td class="caret">{{ expandido() === a.id ? '▾' : '▸' }}</td>
                <td>{{ a.id }}</td>
                <td>{{ a.codAgrup || '—' }}</td>
                <td>{{ a.codDepto || '—' }}</td>
                <td>{{ a.tipo === 'DEPARTAMENTAL' ? 'D' : a.tipo === 'NACIONAL' ? 'N' : (a.tipo || '—') }}</td>
                <td><strong>{{ a.nombre }}</strong></td>
                <td><span class="badge dept">{{ a.depto || '—' }}</span></td>
                <td>{{ a.fichaAgrupacionOrigenId ? 'Ficha #' + a.fichaAgrupacionOrigenId : '—' }}</td>
                <td (click)="$event.stopPropagation()">
                  <button class="btn btn-sm btn-danger" (click)="eliminar(a.id)">Eliminar</button>
                </td>
              </tr>
              @if (expandido() === a.id) {
                <tr class="detalle-row">
                  <td colspan="9">
                    <div class="detalle-wrap">
                      <div class="seccion">
                        <div class="seccion-title">Datos de la Agrupación</div>
                        <div class="grid">
                          <div class="kv"><span class="k">ID</span><span class="v">{{ a.id }}</span></div>
                          <div class="kv"><span class="k">Cod. Agrupación</span><span class="v">{{ a.codAgrup || '—' }}</span></div>
                          <div class="kv"><span class="k">Cod. Depto.</span><span class="v">{{ a.codDepto || '—' }}</span></div>
                          <div class="kv"><span class="k">Pendiente</span><span class="v">{{ a.pendiente ? 'Sí' : 'No' }}</span></div>
                          <div class="kv"><span class="k">Tipo</span><span class="v">{{ a.tipo || '—' }}</span></div>
                          <div class="kv"><span class="k">Clasificación</span><span class="v">{{ a.clasificacion || '—' }}</span></div>
                          <div class="kv"><span class="k">Solicita</span><span class="v">{{ a.solicita || '—' }}</span></div>
                          <div class="kv"><span class="k">Sector</span><span class="v">{{ a.sector || '—' }}</span></div>
                          <div class="kv"><span class="k">Solic.</span><span class="v">{{ a.solic ?? '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Solicitud</span><span class="v">{{ a.fechaSolicitud || '—' }}</span></div>
                          <div class="kv"><span class="k">Cod. Ant.</span><span class="v">{{ a.codAnt || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema Renunciado</span><span class="v">{{ a.sublemaRenunciado || '—' }}</span></div>
                          <div class="kv"><span class="k">Nombre Ant.</span><span class="v">{{ a.nombreAnt || '—' }}</span></div>
                        </div>
                      </div>
                      <div class="seccion">
                        <div class="seccion-title">Domicilio y Contacto</div>
                        <div class="grid">
                          <div class="kv"><span class="k">Departamento</span><span class="v">{{ a.depto || '—' }}</span></div>
                          <div class="kv"><span class="k">Ciudad</span><span class="v">{{ a.ciudad || '—' }}</span></div>
                          <div class="kv full"><span class="k">Domicilio Legal</span><span class="v">{{ a.domicilioLegal || '—' }}</span></div>
                          <div class="kv"><span class="k">Tel. 1</span><span class="v">{{ a.tel1 || '—' }}</span></div>
                          <div class="kv"><span class="k">Tel. 2</span><span class="v">{{ a.tel2 || '—' }}</span></div>
                          <div class="kv"><span class="k">Fax</span><span class="v">{{ a.fax || '—' }}</span></div>
                          <div class="kv full"><span class="k">Email</span><span class="v">{{ a.email || '—' }}</span></div>
                        </div>
                      </div>
                      <div class="seccion">
                        <div class="seccion-title">Comisión Electoral</div>
                        <div class="grid">
                          <div class="kv"><span class="k">Forma Representación</span><span class="v">{{ a.formaRepresentacion || '—' }}</span></div>
                          <div class="kv"><span class="k">Representante</span><span class="v">{{ a.representante || '—' }}</span></div>
                          <div class="kv"><span class="k">Delegado C.E.</span><span class="v">{{ a.delegadoCE || '—' }}</span></div>
                          <div class="kv"><span class="k">Forma de Actuación</span><span class="v">{{ a.formaActuacion || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Ing. Comis.</span><span class="v">{{ a.fechaIngComis || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Rec. Agrup.</span><span class="v">{{ a.fechaRecAgrup || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Entr. C.E.</span><span class="v">{{ a.fechaEntrCE || '—' }}</span></div>
                          <div class="kv"><span class="k">Fecha Circ. C.E.</span><span class="v">{{ a.fechaCircCE || '—' }}</span></div>
                        </div>
                      </div>
                      <div class="seccion">
                        <div class="seccion-title">Sublemas</div>
                        <div class="grid">
                          <div class="kv"><span class="k">Sublema 1</span><span class="v">{{ a.sublema1 || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema 2</span><span class="v">{{ a.sublema2 || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema 3</span><span class="v">{{ a.sublema3 || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema 4</span><span class="v">{{ a.sublema4 || '—' }}</span></div>
                          <div class="kv"><span class="k">Sublema 5</span><span class="v">{{ a.sublema5 || '—' }}</span></div>
                        </div>
                      </div>
                      <div class="seccion">
                        <div class="seccion-title">Observaciones</div>
                        <div class="grid">
                          <div class="kv full"><span class="k">Antecedentes</span><span class="v">{{ a.antecedentes || '—' }}</span></div>
                          <div class="kv full"><span class="k">Resolución de la Comisión</span><span class="v">{{ a.resolucionComision || '—' }}</span></div>
                          <div class="kv"><span class="k">Observaciones</span><span class="v">{{ a.observaciones || '—' }}</span></div>
                          <div class="kv"><span class="k">Obs. C.E.</span><span class="v">{{ a.obsCE || '—' }}</span></div>
                          <div class="kv full"><span class="k">Nota</span><span class="v">{{ a.nota || '—' }}</span></div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div></div>
    }
  `,
  styles: [`
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff !important; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .caret { color:#888; font-weight:bold; }
    .detalle-wrap { padding:18px 22px; border-top:1px solid #d6dde6; display:flex; flex-direction:column; gap:16px; }
    .seccion { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:14px 18px; }
    .seccion-title { font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #eef1f5; }
    .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 24px; }
    @media (max-width: 900px) { .grid { grid-template-columns:repeat(2, 1fr); } }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv.full { grid-column:1 / -1; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }
  `]
})
export class AgrupacionesPendientesComponent {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/agrupaciones-pendientes`;

  items = signal<AgrupacionPendiente[]>([]);
  loading = signal(true);
  expandido = signal<number | null>(null);

  constructor() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.http.get<AgrupacionPendiente[]>(this.base).subscribe({
      next: (x) => { this.items.set(x); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); }
    });
  }

  toggle(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  eliminar(id: number) {
    if (!confirm('Eliminar esta agrupación pendiente?')) return;
    this.http.delete(`${this.base}/${id}`).subscribe(() => {
      if (this.expandido() === id) this.expandido.set(null);
      this.cargar();
    });
  }
}
