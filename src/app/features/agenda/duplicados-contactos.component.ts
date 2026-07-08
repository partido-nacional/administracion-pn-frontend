import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactosService, Contacto, DuplicadoPar } from './contactos.service';

type Lado = 'A' | 'B';

interface CampoMerge {
  key: keyof Contacto;
  label: string;
}

const CAMPOS: CampoMerge[] = [
  { key: 'cortesia', label: 'Cortesía' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'documento', label: 'Cédula' },
  { key: 'credencialCivica', label: 'Credencial' },
  { key: 'departamentoCredencial', label: 'Depto. Credencial' },
  { key: 'fechaNacimiento', label: 'Fecha Nacimiento' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'estadoCivil', label: 'Estado civil' },
  { key: 'situacion', label: 'Situación' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'celular', label: 'Celular' },
  { key: 'celular2', label: 'Celular 2' },
  { key: 'interno', label: 'Interno' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'ocupacion', label: 'Ocupación' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'organismo', label: 'Organismo' },
  { key: 'cargoLaboral', label: 'Cargo' },
  { key: 'telefonoTrabajo', label: 'Teléfono Laboral' },
  { key: 'departamentoLaboral', label: 'Depto. Laboral' },
  { key: 'mailTrabajo', label: 'Email Laboral' },
  { key: 'datosSecretaria', label: 'Datos Secretaría' },
  { key: 'observaciones', label: 'Observaciones' }
];

interface ParEstado {
  par: DuplicadoPar;
  seleccion: Record<string, Lado>;
  keep: Lado;
  expandido: boolean;
}

interface CampoCambio {
  label: string;
  from: string;
  to: string;
}

interface Confirmacion {
  idx: number;
  keep: Contacto;
  remove: Contacto;
  merged: Contacto;
  cambios: CampoCambio[];
}

@Component({
  selector: 'app-duplicados-contactos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (loading()) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando duplicados…</div></div></div></div>
    } @else if (error()) {
      <div class="card"><div class="card-body"><div class="empty-state">
        <div class="empty-state-text">No se pudieron cargar los contactos duplicados.</div>
        <button class="btn btn-secondary" style="margin-top:12px" (click)="cargar()">Reintentar</button>
      </div></div></div>
    } @else if (estados().length === 0) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">No se detectaron contactos duplicados.</div></div></div></div>
    } @else {
      <div class="card">
        <div class="card-body" style="padding:0">
          <table class="resumen-table">
            <thead>
              <tr>
                <th style="width:40px"></th>
                <th>Id A</th>
                <th>Contacto A</th>
                <th>Id B</th>
                <th>Coincidencia</th>
              </tr>
            </thead>
            <tbody>
              @for (est of estados(); track est.par.a.id + '-' + est.par.b.id; let idx = $index) {
                <tr class="clickable" [class.selected]="est.expandido" (click)="toggle(est)">
                  <td class="caret">{{ est.expandido ? '▾' : '▸' }}</td>
                  <td>#{{ est.par.a.id }}</td>
                  <td><strong>{{ resumenA(est.par.a) }}</strong></td>
                  <td>#{{ est.par.b.id }}</td>
                  <td><span class="badge">{{ est.par.matches.join(', ') }}</span></td>
                </tr>
                @if (est.expandido) {
                  <tr class="detalle-row">
                    <td colspan="5">
                      <div class="detalle-wrap">
                        <div class="dup-header">
                          <small class="muted">Conservar:</small>
                          <div class="keep-selector">
                            <label><input type="radio" [name]="'keep-' + idx" value="A" [(ngModel)]="est.keep" (click)="$event.stopPropagation()"> A (#{{ est.par.a.id }})</label>
                            <label><input type="radio" [name]="'keep-' + idx" value="B" [(ngModel)]="est.keep" (click)="$event.stopPropagation()"> B (#{{ est.par.b.id }})</label>
                          </div>
                        </div>

                        <table class="merge-table" (click)="$event.stopPropagation()">
                          <thead>
                            <tr>
                              <th>Campo</th>
                              <th>A — #{{ est.par.a.id }} ({{ est.par.a.apellido }}, {{ est.par.a.nombre }})</th>
                              <th>B — #{{ est.par.b.id }} ({{ est.par.b.apellido }}, {{ est.par.b.nombre }})</th>
                              <th>Resultado</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (campo of campos; track campo.key) {
                              <tr [class.diff]="diff(est.par, campo.key)" [class.locked]="!diff(est.par, campo.key)">
                                <td class="campo-col">{{ campo.label }}</td>
                                @if (diff(est.par, campo.key)) {
                                  <td>
                                    <label class="opt">
                                      <input type="radio" [name]="'f-' + idx + '-' + campo.key" value="A" [(ngModel)]="est.seleccion[campo.key]">
                                      <span>{{ display(est.par.a[campo.key]) }}</span>
                                    </label>
                                  </td>
                                  <td>
                                    <label class="opt">
                                      <input type="radio" [name]="'f-' + idx + '-' + campo.key" value="B" [(ngModel)]="est.seleccion[campo.key]">
                                      <span>{{ display(est.par.b[campo.key]) }}</span>
                                    </label>
                                  </td>
                                } @else {
                                  <td class="locked-val">{{ display(est.par.a[campo.key]) }}</td>
                                  <td class="locked-val">{{ display(est.par.b[campo.key]) }}</td>
                                }
                                <td class="result-col">{{ display(resultado(est, campo.key)) }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>

                        <div class="dup-actions">
                          <button class="btn btn-secondary" (click)="resetear(est); $event.stopPropagation()">Restablecer sugerido</button>
                          <button class="btn btn-primary" (click)="aplicar(est); $event.stopPropagation()" [disabled]="aplicando()">Aplicar merge</button>
                        </div>
                        @if (mensaje()[idx]) {
                          <div class="msg" [class.err]="mensajeErr()[idx]">{{ mensaje()[idx] }}</div>
                        }
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

    @if (confirmacion(); as cf) {
      <div class="modal-overlay" (click)="cancelar()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>Confirmar fusión de contactos</h3>
          </div>
          <div class="modal-body">
            <p class="cf-note">
              ⚠️ El contacto #{{ cf.remove.id }} se elimina de forma <strong>permanente</strong>. Sus
              adhesiones, fichas, membresías de organismo y demás registros asociados se reasignan al
              contacto #{{ cf.keep.id }}. Esta acción no se puede deshacer.
            </p>

            <div class="cf-grid">
              <div class="cf-card keep">
                <div class="cf-tag">✓ Se conserva y actualiza</div>
                <div class="cf-id">#{{ cf.keep.id }}</div>
                <div class="cf-name">{{ resumenA(cf.keep) }}</div>
              </div>
              <div class="cf-card remove">
                <div class="cf-tag">✕ Se elimina (permanente)</div>
                <div class="cf-id">#{{ cf.remove.id }}</div>
                <div class="cf-name">{{ resumenA(cf.remove) }}</div>
              </div>
            </div>

            @if (cf.cambios.length > 0) {
              <div class="cf-changes-title">Cambios en el contacto #{{ cf.keep.id }} ({{ cf.cambios.length }}):</div>
              <table class="cf-changes">
                <thead><tr><th>Campo</th><th>Antes</th><th>Después</th></tr></thead>
                <tbody>
                  @for (c of cf.cambios; track c.label) {
                    <tr>
                      <td class="cf-campo">{{ c.label }}</td>
                      <td class="cf-from">{{ c.from }}</td>
                      <td class="cf-to">{{ c.to }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="cf-note">El contacto conservado no cambia ninguno de sus datos; solo se absorben los registros del duplicado.</p>
            }
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="cancelar()" [disabled]="aplicando()">Cancelar</button>
            <button class="btn btn-danger" (click)="confirmar()" [disabled]="aplicando()">
              {{ aplicando() ? 'Aplicando…' : 'Sí, fusionar contactos' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .resumen-table { width:100%; border-collapse:collapse; font-size:14px; }
    .resumen-table th, .resumen-table td { border-bottom:1px solid #eef1f5; padding:10px 14px; text-align:left; }
    .resumen-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    tr.clickable { cursor:pointer; }
    tr.clickable:hover { background:#f5f8ff; }
    tr.selected { background:#e6efff; }
    tr.detalle-row > td { padding:0; background:#fafbfd; }
    .caret { color:#888; font-weight:bold; }
    .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px; background:#fff3cd; color:#856404; }
    .detalle-wrap { padding:18px 22px; border-top:1px solid #d6dde6; }
    .dup-header { display:flex; gap:10px; align-items:center; margin-bottom:12px; }
    .keep-selector { display:flex; gap:14px; align-items:center; font-size:13px; }
    .keep-selector label { display:flex; gap:6px; align-items:center; cursor:pointer; }
    .muted { color:#777; font-size:12px; }
    .merge-table { width:100%; border-collapse:collapse; font-size:13px; background:#fff; border:1px solid #e6eaf0; border-radius:4px; }
    .merge-table th, .merge-table td { border-bottom:1px solid #eef1f5; padding:8px 10px; text-align:left; vertical-align:middle; }
    .merge-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    .merge-table tr.diff { background:#fff8e1; }
    .merge-table tr.diff:hover { background:#fff2c4; }
    .merge-table tr.locked { background:#f4f5f7; color:#888; }
    .merge-table tr.locked .campo-col { color:#888; }
    .locked-val { color:#888; }
    .campo-col { font-weight:600; color:#555; width:170px; }
    .result-col { font-weight:600; color:#1a4f8a; background:#eef5ff; }
    .opt { display:flex; gap:8px; align-items:center; cursor:pointer; }
    .dup-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:14px; }
    .msg { margin-top:10px; padding:8px 12px; border-radius:4px; background:#e6f4ea; color:#1f6f3b; font-size:13px; }
    .msg.err { background:#fdecea; color:#a8261b; }

    .modal-overlay { position:fixed; inset:0; background:rgba(20,28,40,.45); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
    .modal-card { background:#fff; border-radius:8px; width:100%; max-width:620px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 12px 40px rgba(0,0,0,.25); }
    .modal-head { padding:16px 22px; border-bottom:1px solid #eef1f5; }
    .modal-head h3 { margin:0; font-size:16px; color:#1a2b45; }
    .modal-body { padding:18px 22px; overflow:auto; }
    .cf-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:14px 0; }
    .cf-card { border:1px solid #e6eaf0; border-radius:6px; padding:12px 14px; }
    .cf-card.keep { background:#e8f5ea; border-color:#b6e0c2; }
    .cf-card.remove { background:#fdecea; border-color:#f5c6c2; }
    .cf-tag { font-size:11px; text-transform:uppercase; letter-spacing:.4px; font-weight:600; }
    .cf-card.keep .cf-tag { color:#1f6f3b; }
    .cf-card.remove .cf-tag { color:#a8261b; }
    .cf-id { font-family:monospace; font-size:13px; color:#666; margin-top:4px; }
    .cf-name { font-size:15px; font-weight:600; color:#222; }
    .cf-note { font-size:12.5px; color:#8a6d1a; background:#fff8e1; border:1px solid #ffe7a3; border-radius:4px; padding:9px 12px; margin:0 0 4px; }
    .btn-danger { background:#c62828; color:#fff; border:none; }
    .btn-danger:hover:not(:disabled):not([disabled]) { background:#b71c1c; }
    .cf-changes-title { font-size:12px; text-transform:uppercase; letter-spacing:.4px; color:#666; margin:6px 0 8px; }
    .cf-changes { width:100%; border-collapse:collapse; font-size:13px; }
    .cf-changes th, .cf-changes td { border-bottom:1px solid #eef1f5; padding:7px 10px; text-align:left; vertical-align:top; }
    .cf-changes th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    .cf-campo { font-weight:600; color:#555; width:150px; }
    .cf-from { color:#a8261b; text-decoration:line-through; }
    .cf-to { color:#1a4f8a; font-weight:600; }
    .modal-actions { padding:14px 22px; border-top:1px solid #eef1f5; display:flex; gap:8px; justify-content:flex-end; }
  `]
})
export class DuplicadosContactosComponent {
  private svc = inject(ContactosService);

  campos = CAMPOS;
  loading = signal(true);
  error = signal(false);
  aplicando = signal(false);
  estados = signal<ParEstado[]>([]);
  mensaje = signal<Record<number, string>>({});
  mensajeErr = signal<Record<number, boolean>>({});
  confirmacion = signal<Confirmacion | null>(null);

  constructor() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set(false);
    this.svc.duplicados().subscribe({
      next: (pares) => {
        this.estados.set(pares.map(p => this.armarEstado(p)));
        this.loading.set(false);
      },
      error: () => {
        this.estados.set([]);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  toggle(est: ParEstado) {
    est.expandido = !est.expandido;
    this.estados.set([...this.estados()]);
  }

  resumenA(c: Contacto): string {
    const cortesia = c.cortesia ? c.cortesia + ' ' : '';
    return `${cortesia}${c.nombre} ${c.apellido}`.trim();
  }

  private armarEstado(par: DuplicadoPar): ParEstado {
    const sel: Record<string, Lado> = {};
    for (const c of CAMPOS) {
      sel[c.key as string] = this.sugerencia(par, c.key);
    }
    return { par, seleccion: sel, keep: 'A', expandido: false };
  }

  private sugerencia(par: DuplicadoPar, key: keyof Contacto): Lado {
    const va = this.norm(par.a[key]);
    const vb = this.norm(par.b[key]);
    if (va && !vb) return 'A';
    if (!va && vb) return 'B';
    return 'A';
  }

  private norm(v: any): string {
    if (v == null) return '';
    return String(v).trim();
  }

  diff(par: DuplicadoPar, key: keyof Contacto): boolean {
    const va = this.norm(par.a[key]);
    const vb = this.norm(par.b[key]);
    return !!(va && vb && va !== vb);
  }

  display(v: any): string {
    if (v == null || v === '') return '—';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    return String(v);
  }

  resultado(est: ParEstado, key: keyof Contacto): any {
    const va = est.par.a[key];
    const vb = est.par.b[key];
    if (!this.norm(va) && !this.norm(vb)) return null;
    if (!this.norm(va)) return vb;
    if (!this.norm(vb)) return va;
    return est.seleccion[key as string] === 'A' ? va : vb;
  }

  resetear(est: ParEstado) {
    for (const c of CAMPOS) {
      est.seleccion[c.key as string] = this.sugerencia(est.par, c.key);
    }
    est.keep = 'A';
    this.estados.set([...this.estados()]);
  }

  /** Abre el resumen de confirmación antes de impactar el borrado/fusión. */
  aplicar(est: ParEstado) {
    const idx = this.estados().indexOf(est);
    const keep = est.keep === 'A' ? est.par.a : est.par.b;
    const remove = est.keep === 'A' ? est.par.b : est.par.a;

    const merged: Contacto = { ...keep };
    const cambios: CampoCambio[] = [];
    for (const c of CAMPOS) {
      const v = this.resultado(est, c.key);
      (merged as any)[c.key] = v == null || v === '' ? undefined : v;
      if (this.norm(keep[c.key]) !== this.norm(v)) {
        cambios.push({ label: c.label, from: this.display(keep[c.key]), to: this.display(v) });
      }
    }
    merged.id = keep.id;

    this.confirmacion.set({ idx, keep, remove, merged, cambios });
  }

  cancelar() {
    if (this.aplicando()) return;
    this.confirmacion.set(null);
  }

  /** Ejecuta la fusión transaccional una vez confirmada. */
  confirmar() {
    const cf = this.confirmacion();
    if (!cf) return;

    this.aplicando.set(true);
    this.svc.merge(cf.keep.id, cf.remove.id, cf.merged).subscribe({
      next: () => {
        this.setMensaje(cf.idx, `Fusión aplicada. Se eliminó #${cf.remove.id} y se conservó #${cf.keep.id}.`, false);
        this.aplicando.set(false);
        this.confirmacion.set(null);
        this.cargar();
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo completar la fusión de contactos.';
        this.setMensaje(cf.idx, msg, true);
        this.aplicando.set(false);
        this.confirmacion.set(null);
      }
    });
  }

  private setMensaje(idx: number, texto: string, err: boolean) {
    this.mensaje.set({ ...this.mensaje(), [idx]: texto });
    this.mensajeErr.set({ ...this.mensajeErr(), [idx]: err });
  }
}
