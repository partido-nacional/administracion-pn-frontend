import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
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
                  <td (click)="$event.stopPropagation()" style="white-space:nowrap">
                    <button class="btn-wa" (click)="abrirWhatsapp(f)" [disabled]="!f.celularResponsable"
                            [title]="f.celularResponsable ? 'Enviar WhatsApp a ' + (f.nombreResponsable || 'responsable') : 'Sin celular del responsable'">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.62-5.964C.122 5.335 5.46 0 12.05 0a11.82 11.82 0 018.412 3.488 11.82 11.82 0 013.48 8.413c-.003 6.557-5.338 11.892-11.892 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                      </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="eliminar(f.id)" style="margin-left:6px">Eliminar</button>
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

    @if (waFicha()) {
      <div class="modal-backdrop" (click)="cerrarWhatsapp()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Enviar WhatsApp</h3>
            <button class="modal-close" (click)="cerrarWhatsapp()">×</button>
          </div>
          <div class="modal-body">
            <div class="wa-dest">
              <div><strong>{{ waFicha()!.nombreResponsable || '—' }} {{ waFicha()!.apellidoResponsable || '' }}</strong></div>
              <div class="wa-num">+{{ waPhone() }}</div>
            </div>
            <label class="form-label" style="margin-top:14px">Mensaje</label>
            <textarea class="form-input" rows="6" [(ngModel)]="waMensaje" name="waMensaje"></textarea>
            <small style="display:block; margin-top:8px; color:#666">
              Esto abre WhatsApp Web/App con el mensaje precargado al número del responsable.
              Tenés que tocar <strong>Enviar</strong> manualmente en WhatsApp.
            </small>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cerrarWhatsapp()">Cancelar</button>
            <button class="btn btn-wa-primary" (click)="enviarWhatsapp()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:-3px; margin-right:6px">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.62-5.964C.122 5.335 5.46 0 12.05 0a11.82 11.82 0 018.412 3.488 11.82 11.82 0 013.48 8.413c-.003 6.557-5.338 11.892-11.892 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              </svg>
              Abrir WhatsApp
            </button>
          </div>
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
    .btn-wa {
      background:#25D366; color:#fff; border:none; border-radius:50%;
      width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center;
      cursor:pointer; vertical-align:middle;
    }
    .btn-wa:hover:not(:disabled) { background:#1ebe57; }
    .btn-wa:disabled { background:#bcd; cursor:not-allowed; }
    .btn-wa-primary {
      background:#25D366; color:#fff; border:none; padding:8px 16px;
      border-radius:4px; font-size:14px; cursor:pointer; display:inline-flex; align-items:center;
    }
    .btn-wa-primary:hover { background:#1ebe57; }
    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,.5);
      display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .modal {
      background:#fff; border-radius:8px; width:min(520px, 92vw);
      max-height:90vh; display:flex; flex-direction:column;
      box-shadow:0 10px 40px rgba(0,0,0,.25);
    }
    .modal-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 18px; border-bottom:1px solid #eee;
    }
    .modal-header h3 { margin:0; font-size:17px; color:#1ebe57; }
    .modal-close { background:none; border:none; font-size:24px; cursor:pointer; color:#666; }
    .modal-body { padding:14px 18px; overflow-y:auto; flex:1; }
    .modal-footer {
      padding:12px 18px; border-top:1px solid #eee;
      display:flex; gap:8px; justify-content:flex-end;
    }
    .wa-dest { background:#f5f8ff; border:1px solid #e6eaf0; border-radius:6px; padding:10px 12px; }
    .wa-num { font-family:monospace; color:#1a4f8a; }
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

  // ─── WhatsApp ───────────────────────────────────────────────
  waFicha = signal<FichaAgrupacion | null>(null);
  waMensaje = '';

  abrirWhatsapp(f: FichaAgrupacion) {
    if (!f.celularResponsable) return;
    const nombre = (f.nombreResponsable || '').trim();
    const saludo = nombre ? `Hola ${nombre}` : 'Hola';
    this.waMensaje =
      `${saludo}, te escribimos del Partido Nacional respecto a la ficha de la agrupación "${f.nombreAgrupacion}" recibida el ${f.fechaSolicitud || ''}. Te contactamos para confirmar algunos datos antes de procesarla. ¿Tenés un momento?`;
    this.waFicha.set(f);
  }

  cerrarWhatsapp() {
    this.waFicha.set(null);
    this.waMensaje = '';
  }

  waPhone(): string {
    const f = this.waFicha();
    if (!f?.celularResponsable) return '';
    return this.formatoUy(f.celularResponsable);
  }

  enviarWhatsapp() {
    const f = this.waFicha();
    if (!f?.celularResponsable) return;
    const num = this.formatoUy(f.celularResponsable);
    if (!num) { alert('Numero de celular invalido.'); return; }
    const url = `https://wa.me/${num}?text=${encodeURIComponent(this.waMensaje)}`;
    window.open(url, '_blank');
    this.cerrarWhatsapp();
  }

  /** Normaliza a formato internacional sin '+' para wa.me. UY: 598 + 8 digitos del movil. */
  private formatoUy(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('598')) return digits;
    if (digits.startsWith('0')) return '598' + digits.slice(1);
    return '598' + digits;
  }
}
