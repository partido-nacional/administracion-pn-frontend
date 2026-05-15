import { Component, computed, inject, signal } from '@angular/core';
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
  { key: 'telefono2', label: 'Teléfono 2' },
  { key: 'celular', label: 'Celular' },
  { key: 'celular2', label: 'Celular 2' },
  { key: 'interno', label: 'Interno' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'localidad', label: 'Localidad' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'ocupacion', label: 'Ocupación' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'organismo', label: 'Organismo' },
  { key: 'cargoLaboral', label: 'Cargo' },
  { key: 'telefonoTrabajo', label: 'Teléfono Laboral' },
  { key: 'telefonoTrabajo2', label: 'Teléfono Laboral 2' },
  { key: 'departamentoLaboral', label: 'Depto. Laboral' },
  { key: 'mailTrabajo', label: 'Email Laboral' },
  { key: 'datosSecretaria', label: 'Datos Secretaría' },
  { key: 'observaciones', label: 'Observaciones' }
];

interface ParEstado {
  par: DuplicadoPar;
  seleccion: Record<string, Lado>;
  keep: Lado;
}

@Component({
  selector: 'app-duplicados-contactos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (loading()) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando duplicados…</div></div></div></div>
    } @else if (estados().length === 0) {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">No se detectaron contactos duplicados.</div></div></div></div>
    } @else {
      @for (est of estados(); track est.par.a.id + '-' + est.par.b.id; let idx = $index) {
        <div class="card" style="margin-bottom:18px">
          <div class="card-body">
            <div class="dup-header">
              <div>
                <h3 style="margin:0">Posible duplicado</h3>
                <small class="muted">Coincide por: <strong>{{ est.par.matches.join(', ') }}</strong></small>
              </div>
              <div class="keep-selector">
                <span class="muted">Conservar:</span>
                <label><input type="radio" [name]="'keep-' + idx" value="A" [(ngModel)]="est.keep"> A (#{{ est.par.a.id }})</label>
                <label><input type="radio" [name]="'keep-' + idx" value="B" [(ngModel)]="est.keep"> B (#{{ est.par.b.id }})</label>
              </div>
            </div>

            <table class="merge-table">
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
                  <tr [class.diff]="diff(est.par, campo.key)">
                    <td class="campo-col">{{ campo.label }}</td>
                    <td>
                      <label class="opt">
                        <input type="radio" [name]="'f-' + idx + '-' + campo.key" value="A" [(ngModel)]="est.seleccion[campo.key]" [disabled]="bothEmpty(est.par, campo.key)">
                        <span>{{ display(est.par.a[campo.key]) }}</span>
                      </label>
                    </td>
                    <td>
                      <label class="opt">
                        <input type="radio" [name]="'f-' + idx + '-' + campo.key" value="B" [(ngModel)]="est.seleccion[campo.key]" [disabled]="bothEmpty(est.par, campo.key)">
                        <span>{{ display(est.par.b[campo.key]) }}</span>
                      </label>
                    </td>
                    <td class="result-col">{{ display(resultado(est, campo.key)) }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="dup-actions">
              <button class="btn btn-secondary" (click)="resetear(est)">Restablecer sugerido</button>
              <button class="btn btn-primary" (click)="aplicar(est)" [disabled]="aplicando()">Aplicar merge</button>
            </div>
            @if (mensaje()[idx]) {
              <div class="msg" [class.err]="mensajeErr()[idx]">{{ mensaje()[idx] }}</div>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .dup-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; flex-wrap:wrap; gap:12px; }
    .keep-selector { display:flex; gap:14px; align-items:center; font-size:13px; }
    .keep-selector label { display:flex; gap:6px; align-items:center; cursor:pointer; }
    .muted { color:#777; font-size:12px; }
    .merge-table { width:100%; border-collapse:collapse; font-size:13px; }
    .merge-table th, .merge-table td { border-bottom:1px solid #eef1f5; padding:8px 10px; text-align:left; vertical-align:middle; }
    .merge-table th { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.4px; background:#fafbfd; }
    .merge-table tr.diff { background:#fff8e1; }
    .merge-table tr.diff:hover { background:#fff2c4; }
    .campo-col { font-weight:600; color:#555; width:170px; }
    .result-col { font-weight:600; color:#1a4f8a; background:#eef5ff; }
    .opt { display:flex; gap:8px; align-items:center; cursor:pointer; }
    .opt input[disabled] { cursor:not-allowed; }
    .dup-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:14px; }
    .msg { margin-top:10px; padding:8px 12px; border-radius:4px; background:#e6f4ea; color:#1f6f3b; font-size:13px; }
    .msg.err { background:#fdecea; color:#a8261b; }
  `]
})
export class DuplicadosContactosComponent {
  private svc = inject(ContactosService);

  campos = CAMPOS;
  loading = signal(true);
  aplicando = signal(false);
  estados = signal<ParEstado[]>([]);
  mensaje = signal<Record<number, string>>({});
  mensajeErr = signal<Record<number, boolean>>({});

  constructor() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.svc.duplicados().subscribe({
      next: (pares) => {
        this.estados.set(pares.map(p => this.armarEstado(p)));
        this.loading.set(false);
      },
      error: () => {
        this.estados.set([]);
        this.loading.set(false);
      }
    });
  }

  private armarEstado(par: DuplicadoPar): ParEstado {
    const sel: Record<string, Lado> = {};
    for (const c of CAMPOS) {
      sel[c.key as string] = this.sugerencia(par, c.key);
    }
    return { par, seleccion: sel, keep: 'A' };
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

  bothEmpty(par: DuplicadoPar, key: keyof Contacto): boolean {
    return !this.norm(par.a[key]) && !this.norm(par.b[key]);
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
    const lado = est.seleccion[key as string];
    const va = est.par.a[key];
    const vb = est.par.b[key];
    if (this.bothEmpty(est.par, key)) return null;
    if (lado === 'A') return this.norm(va) ? va : vb;
    return this.norm(vb) ? vb : va;
  }

  resetear(est: ParEstado) {
    for (const c of CAMPOS) {
      est.seleccion[c.key as string] = this.sugerencia(est.par, c.key);
    }
    est.keep = 'A';
    this.estados.set([...this.estados()]);
  }

  aplicar(est: ParEstado) {
    const idx = this.estados().indexOf(est);
    const keep = est.keep === 'A' ? est.par.a : est.par.b;
    const remove = est.keep === 'A' ? est.par.b : est.par.a;

    const merged: Contacto = { ...keep };
    for (const c of CAMPOS) {
      const v = this.resultado(est, c.key);
      (merged as any)[c.key] = v == null || v === '' ? undefined : v;
    }
    merged.id = keep.id;

    this.aplicando.set(true);
    this.svc.delete(remove.id).subscribe({
      next: () => {
        this.svc.update(merged).subscribe({
          next: () => {
            this.setMensaje(idx, `Merge aplicado. Se eliminó #${remove.id} y se actualizó #${keep.id}.`, false);
            this.aplicando.set(false);
            this.cargar();
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo actualizar el contacto resultante.';
            this.setMensaje(idx, msg, true);
            this.aplicando.set(false);
          }
        });
      },
      error: () => {
        this.setMensaje(idx, 'No se pudo eliminar el contacto duplicado.', true);
        this.aplicando.set(false);
      }
    });
  }

  private setMensaje(idx: number, texto: string, err: boolean) {
    this.mensaje.set({ ...this.mensaje(), [idx]: texto });
    this.mensajeErr.set({ ...this.mensajeErr(), [idx]: err });
  }
}
