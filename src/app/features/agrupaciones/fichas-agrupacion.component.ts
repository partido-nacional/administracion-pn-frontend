import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AutoridadFicha {
  id: number;
  nombre: string;
  apellido: string;
  ci: string;
  rol: string;
  orden: number;
  errorCi?: string | null;
  errorNombre?: string | null;
  errorAdhesion?: string | null;
}

export interface FichaAgrupacion {
  id: number;
  nombreAgrupacion: string;
  tipo: string;
  departamento?: string;
  domicilioLegal?: string;
  ciudad?: string;
  telefono1?: string;
  telefono2?: string;
  mail?: string;
  formaRepresentacion?: string;
  formaActuacion?: string;
  fechaSolicitud?: string;
  nombreResponsable?: string;
  apellidoResponsable?: string;
  ciResponsable?: string;
  celularResponsable?: string;
  sublema1: string;
  sublema2?: string;
  sublema3?: string;
  sublema4?: string;
  sublema5?: string;
  estado: string;
  fechaCreado?: string;
  autoridades: AutoridadFicha[];
}

@Component({
  selector: 'app-fichas-agrupacion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="topbar-inline">
      <button class="btn btn-primary" (click)="sincronizar()" [disabled]="syncing()">
        {{ syncing() ? 'Sincronizando…' : '↻ Sincronizar' }}
      </button>
    </div>

    @if (loading()) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando fichas…</div></div></div></div>
    } @else if (fichas().length === 0) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">No hay fichas pendientes. Tocá Sincronizar para traer fichas desde la web.</div></div></div></div>
    } @else {
      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto">
          <table class="resumen-table">
            <thead>
              <tr>
                <th style="width:40px"></th>
                <th>Id</th>
                <th>Nombre Agrupación</th>
                <th>Tipo</th>
                <th>Departamento</th>
                <th>Fecha solicitud</th>
                <th>Errores</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (f of fichas(); track f.id) {
                <tr class="clickable" [class.selected]="expandido() === f.id" (click)="toggle(f.id)">
                  <td class="caret">{{ expandido() === f.id ? '▾' : '▸' }}</td>
                  <td>#{{ f.id }}</td>
                  <td><strong>{{ f.nombreAgrupacion }}</strong></td>
                  <td>{{ f.tipo }}</td>
                  <td>{{ f.tipo === 'NACIONAL' ? '—' : (f.departamento || '—') }}</td>
                  <td>{{ f.fechaSolicitud || '—' }}</td>
                  <td>
                    @if (countErrores(f) > 0) {
                      <span class="badge err">{{ countErrores(f) }} error(es)</span>
                    } @else {
                      <span class="badge ok">OK</span>
                    }
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <button class="btn btn-sm btn-danger" (click)="eliminar(f.id)">Eliminar</button>
                  </td>
                </tr>

                @if (expandido() === f.id) {
                  <tr class="detalle-row">
                    <td colspan="8">
                      <div class="detalle-wrap">
                        <div class="seccion">
                          <div class="seccion-title">Datos de la agrupación</div>
                          <div class="grid">
                            <div class="kv"><span class="k">Nombre</span><span class="v">{{ f.nombreAgrupacion }}</span></div>
                            <div class="kv"><span class="k">Tipo</span><span class="v">{{ f.tipo }}</span></div>
                            @if (f.tipo !== 'NACIONAL') {
                              <div class="kv"><span class="k">Departamento</span><span class="v">{{ f.departamento || '—' }}</span></div>
                            }
                            <div class="kv"><span class="k">Fecha solicitud</span><span class="v">{{ f.fechaSolicitud || '—' }}</span></div>
                            <div class="kv full"><span class="k">Domicilio legal</span><span class="v">{{ f.domicilioLegal || '—' }}</span></div>
                            <div class="kv"><span class="k">Ciudad</span><span class="v">{{ f.ciudad || '—' }}</span></div>
                            <div class="kv"><span class="k">Teléfono 1</span><span class="v">{{ f.telefono1 || '—' }}</span></div>
                            <div class="kv"><span class="k">Teléfono 2</span><span class="v">{{ f.telefono2 || '—' }}</span></div>
                            <div class="kv"><span class="k">Mail</span><span class="v">{{ f.mail || '—' }}</span></div>
                            <div class="kv"><span class="k">Forma Representación</span><span class="v">{{ f.formaRepresentacion || '—' }}</span></div>
                            <div class="kv"><span class="k">Forma Actuación</span><span class="v">{{ f.formaActuacion || '—' }}</span></div>
                          </div>
                        </div>

                        <div class="seccion">
                          <div class="seccion-title">Responsable</div>
                          <div class="grid">
                            <div class="kv"><span class="k">Nombre</span><span class="v">{{ f.nombreResponsable || '—' }}</span></div>
                            <div class="kv"><span class="k">Apellido</span><span class="v">{{ f.apellidoResponsable || '—' }}</span></div>
                            <div class="kv"><span class="k">CI</span><span class="v">{{ f.ciResponsable || '—' }}</span></div>
                            <div class="kv"><span class="k">Celular</span><span class="v">{{ f.celularResponsable || '—' }}</span></div>
                          </div>
                        </div>

                        <div class="seccion">
                          <div class="seccion-title">Sublemas</div>
                          <div class="grid">
                            <div class="kv"><span class="k">Sublema 1</span><span class="v">{{ f.sublema1 }}</span></div>
                            <div class="kv"><span class="k">Sublema 2</span><span class="v">{{ f.sublema2 || '—' }}</span></div>
                            <div class="kv"><span class="k">Sublema 3</span><span class="v">{{ f.sublema3 || '—' }}</span></div>
                            <div class="kv"><span class="k">Sublema 4</span><span class="v">{{ f.sublema4 || '—' }}</span></div>
                            <div class="kv"><span class="k">Sublema 5</span><span class="v">{{ f.sublema5 || '—' }}</span></div>
                          </div>
                        </div>

                        <div class="seccion">
                          <div class="seccion-title">Autoridades</div>
                          <table class="aut-table">
                            <thead>
                              <tr>
                                <th>#</th><th>Nombre</th><th>Apellido</th><th>CI</th><th>Rol</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (a of f.autoridades; track a.id) {
                                <tr>
                                  <td>{{ a.orden }}</td>
                                  <td>
                                    <div [class.err-input]="a.errorNombre">{{ a.nombre }}</div>
                                    @if (a.errorNombre) { <div class="err-msg">{{ a.errorNombre }}</div> }
                                  </td>
                                  <td>
                                    <div [class.err-input]="a.errorNombre">{{ a.apellido }}</div>
                                  </td>
                                  <td>
                                    <div [class.err-input]="a.errorCi || a.errorAdhesion">{{ a.ci }}</div>
                                    @if (a.errorCi) { <div class="err-msg">{{ a.errorCi }}</div> }
                                    @if (a.errorAdhesion) { <div class="err-msg">{{ a.errorAdhesion }}</div> }
                                  </td>
                                  <td>{{ a.rol }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-end; margin-bottom:16px; }
    .resumen-table { width:100%; border-collapse:collapse; font-size:14px; }
    .resumen-table th, .resumen-table td { border-bottom:1px solid #eef1f5; padding:10px 14px; text-align:left; }
    .resumen-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .caret { color:#888; font-weight:bold; }
    .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px; }
    .badge.ok  { background:#e6f4ea; color:#1f6f3b; }
    .badge.err { background:#fdecea; color:#a8261b; }
    .detalle-wrap { padding:18px 22px; border-top:1px solid #d6dde6; display:flex; flex-direction:column; gap:16px; }
    .seccion { background:#fff; border:1px solid #e6eaf0; border-radius:6px; padding:14px 18px; }
    .seccion-title { font-size:13px; font-weight:600; color:#4a5568; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #eef1f5; }
    .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px 24px; }
    @media (max-width: 900px) { .grid { grid-template-columns:repeat(2, 1fr); } }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv.full { grid-column:1 / -1; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }
    .aut-table { width:100%; border-collapse:collapse; font-size:13px; }
    .aut-table th, .aut-table td { border-bottom:1px solid #eef1f5; padding:8px 10px; text-align:left; vertical-align:top; }
    .aut-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    .err-input { color:#a8261b; font-weight:600; }
    .err-msg { color:#a8261b; font-size:11px; margin-top:2px; }
  `]
})
export class FichasAgrupacionComponent {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/fichas-agrupacion`;

  fichas = signal<FichaAgrupacion[]>([]);
  loading = signal(true);
  syncing = signal(false);
  expandido = signal<number | null>(null);

  constructor() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.http.get<FichaAgrupacion[]>(this.base).subscribe({
      next: (x) => { this.fichas.set(x); this.loading.set(false); },
      error: () => { this.fichas.set([]); this.loading.set(false); }
    });
  }

  toggle(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  sincronizar() {
    this.syncing.set(true);
    this.http.post(`${this.base}/sincronizar`, {}).subscribe({
      next: () => { this.syncing.set(false); this.cargar(); },
      error: () => { this.syncing.set(false); }
    });
  }

  eliminar(id: number) {
    if (!confirm('Eliminar esta ficha pendiente?')) return;
    this.http.delete(`${this.base}/${id}`).subscribe(() => {
      if (this.expandido() === id) this.expandido.set(null);
      this.cargar();
    });
  }

  countErrores(f: FichaAgrupacion): number {
    return f.autoridades.reduce((n, a) =>
      n + (a.errorCi ? 1 : 0) + (a.errorNombre ? 1 : 0) + (a.errorAdhesion ? 1 : 0), 0);
  }
}
