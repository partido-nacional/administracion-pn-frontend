import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { skipErrorToast } from '../../core/http/skip-error-toast';
import { rangoSemana, agruparPorDia, htmlCalendario, imprimirCalendario, tituloPeriodo } from './imprimir-calendario';

interface Resumen {
  contactos: number;
  adhesionesWebPendientes: number;
  adhesionesLocales: number;
  productos: number;
  ventasMes: number;
  donacionesMes: number;
}

interface Evento {
  id: number;
  titulo: string;
  fechaInicio: string;
  fechaFin?: string;
  descripcion?: string;
  tipo?: string;
  creadorNombre?: string;
  esPublico: boolean;
}

interface DiaCalendario {
  fecha: Date;
  isoDate: string;
  inMonth: boolean;
  isToday: boolean;
  eventos: Evento[];
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEM = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="stats-grid">
      <a class="stat-card" routerLink="/agenda" title="Ir a contactos">
        <div class="stat-value">{{ resumen()?.contactos ?? '—' }}</div><div class="stat-label">Todos los contactos</div>
      </a>
      @if (puedeVer(['Hacienda','IT'])) {
        <a class="stat-card" routerLink="/adhesiones" title="Ir a adhesiones">
          <div class="stat-value">{{ resumen()?.adhesionesLocales ?? '—' }}</div><div class="stat-label">Adhesiones locales</div>
        </a>
      }
      @if (puedeVer(['Secretaria','Hacienda','IT'])) {
        <a class="stat-card" routerLink="/productos" title="Ir a productos">
          <div class="stat-value">{{ resumen()?.ventasMes ?? '—' }}</div><div class="stat-label">Ventas</div>
        </a>
      }
    </div>

    <div class="card">
      <div class="card-header cal-header">
        <h2 class="card-title">Calendario</h2>
        <div class="cal-nav">
          <div class="cal-vista">
            <button class="vista-btn" [class.active]="!soloPrivados()"
                    (click)="setSoloPrivados(false)">Todos</button>
            <button class="vista-btn" [class.active]="soloPrivados()"
                    (click)="setSoloPrivados(true)">Solo privados</button>
          </div>
          <button class="btn btn-sm btn-secondary" (click)="prevMes()">‹</button>
          <span class="cal-month">{{ tituloMes() }}</span>
          <button class="btn btn-sm btn-secondary" (click)="nextMes()">›</button>
          <button class="btn btn-sm btn-secondary" (click)="hoy()" style="margin-left:8px">Hoy</button>
          <div class="cal-print" (click)="$event.stopPropagation()">
            <button class="btn btn-sm btn-secondary" (click)="menuImprimir.set(!menuImprimir())"
                    [disabled]="imprimiendo()" title="Imprimir calendario">🖨 Imprimir</button>
            @if (menuImprimir()) {
              <div class="cal-print-menu">
                <button (click)="imprimir('mes')">Mes ({{ tituloMes() }})</button>
                <button (click)="imprimir('semana')">Semana actual</button>
              </div>
            }
          </div>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div class="cal-grid">
          @for (d of DIAS_SEM; track d) {
            <div class="cal-dow">{{ d }}</div>
          }
          @for (d of dias(); track d.isoDate) {
            <div class="cal-day" [class.outside]="!d.inMonth" [class.today]="d.isToday">
              <div class="cal-day-num">{{ d.fecha.getDate() }}</div>
              <div class="cal-eventos">
                @for (e of d.eventos; track e.id) {
                  <div class="cal-evento" [class.priv]="!e.esPublico" (click)="abrirVer(e)" [title]="e.titulo">
                    <span class="cal-hora">{{ formatoHora(e.fechaInicio) }}</span>
                    <span class="cal-titulo">{{ e.titulo }}</span>
                    @if (!e.esPublico) { <span class="cal-lock">🔒</span> }
                  </div>
                }
              </div>
              <button class="cal-add" (click)="abrirCrear(d.isoDate)" title="Agregar evento">+</button>
            </div>
          }
        </div>
      </div>
    </div>

    @if (modal() === 'crear' || modal() === 'editar') {
      <div class="modal-backdrop" (click)="cerrarModal()">
        <div class="ev-modal" (click)="$event.stopPropagation()">
          <div class="ev-header">
            <div class="ev-title">{{ modal() === 'editar' ? 'Editar evento' : 'Nuevo evento' }}</div>
            <button class="ev-close" (click)="cerrarModal()">×</button>
          </div>
          <div class="ev-body">
            <div class="fg"><label>Título *</label><input [(ngModel)]="form.titulo" name="titulo"></div>
            <div class="row">
              <div class="fg"><label>Fecha *</label><input type="date" [(ngModel)]="form.fecha" name="fecha"></div>
              <div class="fg"><label>Hora *</label><input type="time" [(ngModel)]="form.hora" name="hora"></div>
            </div>
            <div class="row">
              <div class="fg"><label>Hasta (fecha)</label><input type="date" [(ngModel)]="form.fechaHasta" name="fechaHasta"></div>
              <div class="fg"><label>Hasta (hora)</label><input type="time" [(ngModel)]="form.horaHasta" name="horaHasta"></div>
            </div>
            <div class="fg"><label>Tipo</label>
              <select [(ngModel)]="form.tipo" name="tipo">
                <option value="">—</option>
                <option>Reunion</option><option>Asamblea</option>
                <option>Convencion</option><option>Eleccion</option><option>Otro</option>
              </select>
            </div>
            <div class="fg"><label>Descripción</label>
              <textarea rows="3" [(ngModel)]="form.descripcion" name="descripcion"></textarea>
            </div>
            <div class="vis-toggle">
              <span class="vis-label">Visibilidad:</span>
              <button type="button" class="vis-btn" [class.active]="form.esPublico"
                      (click)="form.esPublico = true">🌐 Público</button>
              <button type="button" class="vis-btn" [class.active]="!form.esPublico"
                      (click)="form.esPublico = false">🔒 Privado</button>
            </div>
            <small class="muted">Creado por: <strong>{{ usuario() }}</strong></small>
            @if (modalError()) { <div class="ev-err">{{ modalError() }}</div> }
          </div>
          <div class="ev-footer">
            <button class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="modal() === 'editar' ? guardarEdicion() : guardarNuevo()" [disabled]="busy()">
              {{ busy() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (modal() === 'ver' && eventoSel()) {
      <div class="modal-backdrop" (click)="cerrarModal()">
        <div class="ev-modal" (click)="$event.stopPropagation()">
          <div class="ev-header">
            <div class="ev-title">{{ eventoSel()!.titulo }}</div>
            <button class="ev-close" (click)="cerrarModal()">×</button>
          </div>
          <div class="ev-body">
            <div class="kv"><span class="k">Fecha y hora</span><span class="v">{{ formatoFechaCompleta(eventoSel()!.fechaInicio) }}</span></div>
            @if (eventoSel()!.fechaFin) {
              <div class="kv"><span class="k">Hasta</span><span class="v">{{ formatoFechaCompleta(eventoSel()!.fechaFin!) }}</span></div>
            }
            @if (eventoSel()!.tipo) {
              <div class="kv"><span class="k">Tipo</span><span class="v">{{ eventoSel()!.tipo }}</span></div>
            }
            <div class="kv"><span class="k">Visibilidad</span>
              <span class="v">{{ eventoSel()!.esPublico ? '🌐 Público' : '🔒 Privado' }}</span>
            </div>
            <div class="kv"><span class="k">Creador</span><span class="v">{{ eventoSel()!.creadorNombre || '—' }}</span></div>
            @if (eventoSel()!.descripcion) {
              <div class="kv"><span class="k">Descripción</span><span class="v desc">{{ eventoSel()!.descripcion }}</span></div>
            }
          </div>
          <div class="ev-footer">
            <button class="btn btn-danger" (click)="eliminar()" [disabled]="busy()">Eliminar</button>
            <button class="btn btn-primary" (click)="abrirEditar(eventoSel()!)" [disabled]="busy()">Editar</button>
            <button class="btn btn-secondary" (click)="cerrarModal()">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    a.stat-card {
      text-decoration:none; color:inherit; cursor:pointer; display:block;
      transition:box-shadow .15s ease, transform .15s ease;
    }
    a.stat-card:hover { box-shadow:0 6px 18px rgba(15,23,42,.12); transform:translateY(-2px); }
    a.stat-card:focus-visible { outline:2px solid #1e5aa8; outline-offset:2px; }
    @media (prefers-reduced-motion:reduce) { a.stat-card { transition:none; } a.stat-card:hover { transform:none; } }
    .cal-header { display:flex; justify-content:space-between; align-items:center; }
    .cal-nav { display:flex; align-items:center; gap:6px; }
    .cal-print { position:relative; margin-left:8px; }
    .cal-print-menu {
      position:absolute; right:0; top:calc(100% + 4px); z-index:20; min-width:170px;
      background:#fff; border:1px solid var(--gray-200, #e2e8f0); border-radius:6px;
      box-shadow:0 6px 18px rgba(0,0,0,.12); display:flex; flex-direction:column; overflow:hidden;
    }
    .cal-print-menu button {
      background:none; border:none; text-align:left; padding:8px 12px; cursor:pointer;
      font:inherit; font-size:13px; color:inherit;
    }
    .cal-print-menu button:hover { background:var(--gray-50, #f7fafc); }
    .cal-month { font-weight:600; min-width:160px; text-align:center; text-transform:capitalize; }
    .cal-grid {
      display:grid; grid-template-columns:repeat(7, 1fr);
      border-top:1px solid #e6eaf0; border-left:1px solid #e6eaf0;
    }
    .cal-dow {
      background:#fafbfd; padding:8px 10px; font-size:11px; font-weight:600;
      color:#666; text-transform:uppercase; letter-spacing:.4px;
      border-bottom:1px solid #e6eaf0; border-right:1px solid #e6eaf0;
      text-align:center;
    }
    .cal-day {
      position:relative; min-height:120px; padding:6px 6px 4px 6px;
      border-bottom:1px solid #e6eaf0; border-right:1px solid #e6eaf0;
      background:#fff;
    }
    .cal-day.outside { background:#fafbfd; color:#bbb; }
    .cal-day.outside .cal-day-num { color:#bbb; }
    .cal-day.today { background:#eef5ff; }
    .cal-day.today .cal-day-num { color:#1a4f8a; font-weight:700; }
    .cal-day-num { font-size:13px; font-weight:600; color:#444; margin-bottom:4px; }
    .cal-eventos { display:flex; flex-direction:column; gap:2px; }
    .cal-evento {
      display:flex; gap:4px; align-items:center;
      background:#dbeafe; color:#1e3a8a; padding:2px 6px;
      border-radius:3px; font-size:11px; cursor:pointer;
      overflow:hidden; white-space:nowrap; text-overflow:ellipsis;
    }
    .cal-evento:hover { background:#bfdbfe; }
    .cal-evento.priv { background:#fef3c7; color:#854d0e; }
    .cal-evento.priv:hover { background:#fde68a; }
    .cal-lock { font-size:10px; flex-shrink:0; margin-left:auto; }
    .cal-hora { font-weight:600; flex-shrink:0; }
    .cal-titulo { overflow:hidden; text-overflow:ellipsis; }
    .cal-vista {
      display:inline-flex; border:1px solid #cfd6e0; border-radius:6px;
      overflow:hidden; margin-right:6px;
    }
    .vista-btn {
      background:#fff; color:#444; border:none; padding:6px 12px;
      font-size:13px; cursor:pointer;
    }
    .vista-btn:not(:last-child) { border-right:1px solid #cfd6e0; }
    .vista-btn.active { background:#2563eb; color:#fff; }
    .vista-btn:hover:not(.active) { background:#f0f4fa; }
    .vis-toggle {
      display:flex; align-items:center; gap:8px;
      background:#fafbfd; border:1px solid #e6eaf0; border-radius:6px;
      padding:8px 10px;
    }
    .vis-label { font-size:12px; font-weight:600; color:#666; text-transform:uppercase; }
    .vis-btn {
      flex:1; background:#fff; color:#444; border:1px solid #cfd6e0;
      padding:6px 10px; border-radius:5px; font-size:13px; cursor:pointer;
    }
    .vis-btn.active { background:#2563eb; color:#fff; border-color:#2563eb; }
    .vis-btn:hover:not(.active) { background:#f0f4fa; }
    .cal-add {
      position:absolute; bottom:4px; right:4px;
      width:22px; height:22px; border-radius:50%;
      border:none; background:#2563eb; color:#fff; font-size:14px;
      line-height:1; cursor:pointer; opacity:0; transition:opacity .15s;
      display:flex; align-items:center; justify-content:center;
    }
    .cal-day:hover .cal-add { opacity:1; }
    .cal-add:hover { background:#1d4ed8; }

    .modal-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.55);
      display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;
    }
    .ev-modal {
      background:#fff; border-radius:10px; width:min(480px, 100%);
      display:flex; flex-direction:column; box-shadow:0 20px 50px rgba(0,0,0,.3);
      overflow:hidden;
    }
    .ev-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 18px; background:#1e3a8a; color:#fff;
    }
    .ev-title { font-size:16px; font-weight:600; }
    .ev-close { background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; }
    .ev-body { padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
    .ev-footer { padding:12px 18px; border-top:1px solid #eef1f5; background:#fafbfd;
      display:flex; gap:8px; justify-content:flex-end; }
    .row { display:flex; gap:10px; }
    .row .fg { flex:1; }
    .fg { display:flex; flex-direction:column; gap:4px; }
    .fg label { font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:.4px; }
    .fg input, .fg select, .fg textarea {
      padding:8px 10px; font-size:13px; font-family:inherit;
      border:1px solid #cfd6e0; border-radius:5px; outline:none;
    }
    .fg input:focus, .fg select:focus, .fg textarea:focus {
      border-color:#1e3a8a; box-shadow:0 0 0 3px rgba(30,58,138,.12);
    }
    .muted { color:#777; font-size:12px; }
    .ev-err { background:#fdecea; color:#a8261b; padding:8px 10px; border-radius:5px; font-size:13px; }
    .kv { display:flex; flex-direction:column; gap:2px; }
    .kv .k { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .kv .v { font-size:14px; color:#222; word-break:break-word; }
    .kv .v.desc { white-space:pre-wrap; }
  `]
})
export class DashboardComponent {
  private http = inject(HttpClient);
  private title = inject(PageTitleService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  /** True si el rol actual está entre los permitidos (espejo del guard de la ruta destino). */
  puedeVer(roles: string[]): boolean {
    const rol = this.auth.session()?.rol;
    return !!rol && roles.includes(rol);
  }

  DIAS_SEM = DIAS_SEM;

  resumen = signal<Resumen | null>(null);
  eventos = signal<Evento[]>([]);

  anio = signal(new Date().getFullYear());
  mes = signal(new Date().getMonth()); // 0-11

  modal = signal<'crear' | 'editar' | 'ver' | null>(null);
  eventoSel = signal<Evento | null>(null);
  editId = signal<number | null>(null);
  modalError = signal('');
  busy = signal(false);
  soloPrivados = signal(false);
  form: any = { titulo: '', fecha: '', hora: '', fechaHasta: '', horaHasta: '', tipo: '', descripcion: '', esPublico: true };

  usuario = computed(() => this.auth.session()?.usuario ?? 'desconocido');

  tituloMes = computed(() => `${MESES[this.mes()]} ${this.anio()}`);

  dias = computed<DiaCalendario[]>(() => {
    const y = this.anio(), m = this.mes();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const firstDow = (firstDay.getDay() + 6) % 7; // 0=Mon...6=Sun
    const start = new Date(y, m, 1 - firstDow);
    const total = Math.ceil((firstDow + lastDay.getDate()) / 7) * 7;
    const today = new Date();
    const todayIso = this.toIso(today);
    const evs = this.eventos();

    const result: DiaCalendario[] = [];
    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = this.toIso(d);
      result.push({
        fecha: d,
        isoDate: iso,
        inMonth: d.getMonth() === m,
        isToday: iso === todayIso,
        eventos: evs
          .filter(e => e.fechaInicio.slice(0, 10) === iso)
          .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
      });
    }
    return result;
  });

  constructor() {
    this.title.set('Inicio');
    this.http.get<Resumen>(`${environment.apiUrl}/dashboard/resumen`).subscribe(r => this.resumen.set(r));
    this.cargarEventos();
  }

  cargarEventos() {
    const params = `?anio=${this.anio()}&mes=${this.mes() + 1}&soloPrivados=${this.soloPrivados()}`;
    this.http.get<Evento[]>(`${environment.apiUrl}/calendario/eventos${params}`).subscribe(x => this.eventos.set(x));
  }

  menuImprimir = signal(false);
  imprimiendo = signal(false);

  /** Cierra el menú de impresión al hacer click fuera de él (el wrapper corta la propagación). */
  @HostListener('document:click')
  cerrarMenuImprimir() { this.menuImprimir.set(false); }

  /**
   * Imprime el calendario como listado por día (feature 030). Mes = el mes visible, con los
   * eventos ya cargados; Semana = lunes a domingo de hoy, pedida aparte porque puede cruzar
   * de mes. Ambos respetan el filtro Todos / Solo privados.
   */
  imprimir(modo: 'mes' | 'semana') {
    this.menuImprimir.set(false);
    const filtro = this.soloPrivados() ? 'Solo eventos privados' : 'Todos los eventos';
    const emitir = (eventos: Evento[], desde: string, hasta: string) => {
      const html = htmlCalendario({
        periodo: tituloPeriodo(modo, desde, hasta), filtro,
        dias: agruparPorDia(eventos, desde, hasta, modo === 'semana'),
      });
      if (!imprimirCalendario(html))
        this.toast.error('El navegador bloqueó la ventana de impresión. Permitila para este sitio y volvé a intentar.');
    };

    if (modo === 'mes') {
      const desde = this.toIso(new Date(this.anio(), this.mes(), 1));
      const hasta = this.toIso(new Date(this.anio(), this.mes() + 1, 1));
      emitir(this.eventos(), desde, hasta);
      return;
    }

    // Los eventos guardan la hora de pared marcada UTC: los bordes van como fecha + 'T00:00:00Z'.
    const { desde, hasta } = rangoSemana(new Date());
    const params = `?desde=${desde}T00:00:00Z&hasta=${hasta}T00:00:00Z&soloPrivados=${this.soloPrivados()}`;
    this.imprimiendo.set(true);
    this.http.get<Evento[]>(`${environment.apiUrl}/calendario/eventos${params}`, { context: skipErrorToast() }).subscribe({
      next: evs => { this.imprimiendo.set(false); emitir(evs, desde, hasta); },
      error: () => { this.imprimiendo.set(false); this.toast.error('No se pudieron cargar los eventos de la semana.'); },
    });
  }

  setSoloPrivados(v: boolean) {
    this.soloPrivados.set(v);
    this.cargarEventos();
  }

  prevMes() {
    let y = this.anio(), m = this.mes() - 1;
    if (m < 0) { m = 11; y--; }
    this.anio.set(y); this.mes.set(m); this.cargarEventos();
  }
  nextMes() {
    let y = this.anio(), m = this.mes() + 1;
    if (m > 11) { m = 0; y++; }
    this.anio.set(y); this.mes.set(m); this.cargarEventos();
  }
  hoy() {
    const n = new Date();
    this.anio.set(n.getFullYear()); this.mes.set(n.getMonth());
    this.cargarEventos();
  }

  toIso(d: Date): string {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  formatoHora(iso: string): string {
    return iso.slice(11, 16);
  }
  formatoFechaCompleta(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' });
  }

  abrirCrear(isoDate: string) {
    this.form = { titulo: '', fecha: isoDate, hora: '09:00', fechaHasta: '', horaHasta: '', tipo: '', descripcion: '', esPublico: true };
    this.modalError.set('');
    this.modal.set('crear');
  }
  abrirVer(e: Evento) {
    this.eventoSel.set(e);
    this.modal.set('ver');
  }
  abrirEditar(e: Evento) {
    this.form = {
      titulo: e.titulo,
      fecha: e.fechaInicio.slice(0, 10),
      hora: e.fechaInicio.slice(11, 16),
      fechaHasta: e.fechaFin ? e.fechaFin.slice(0, 10) : '',
      horaHasta: e.fechaFin ? e.fechaFin.slice(11, 16) : '',
      tipo: e.tipo || '',
      descripcion: e.descripcion || '',
      esPublico: e.esPublico,
    };
    this.editId.set(e.id);
    this.modalError.set('');
    this.modal.set('editar');
  }
  cerrarModal() {
    this.modal.set(null); this.eventoSel.set(null); this.editId.set(null); this.modalError.set('');
  }

  /** Fin opcional: solo si se completó fecha y hora de "Hasta". El backend valida fin > inicio. */
  private fechaFinForm(): string | null {
    return this.form.fechaHasta && this.form.horaHasta
      ? `${this.form.fechaHasta}T${this.form.horaHasta}:00`
      : null;
  }

  guardarNuevo() {
    if (!this.form.titulo.trim()) { this.modalError.set('El título es obligatorio.'); return; }
    if (!this.form.fecha || !this.form.hora) { this.modalError.set('Fecha y hora son obligatorias.'); return; }
    this.busy.set(true);
    const fechaInicio = `${this.form.fecha}T${this.form.hora}:00`;
    this.http.post<Evento>(`${environment.apiUrl}/calendario/eventos`, {
      titulo: this.form.titulo.trim(),
      fechaInicio,
      fechaFin: this.fechaFinForm(),
      descripcion: this.form.descripcion || null,
      tipo: this.form.tipo || null,
      creadorNombre: this.usuario(),
      esPublico: this.form.esPublico
    }, { context: skipErrorToast() }).subscribe({
      next: () => { this.busy.set(false); this.cerrarModal(); this.cargarEventos(); this.toast.success('Evento creado.'); },
      error: (err) => {
        this.busy.set(false);
        this.modalError.set(err?.error?.message || 'No se pudo crear el evento.');
      }
    });
  }

  guardarEdicion() {
    const id = this.editId();
    if (id == null) return;
    if (!this.form.titulo.trim()) { this.modalError.set('El título es obligatorio.'); return; }
    if (!this.form.fecha || !this.form.hora) { this.modalError.set('Fecha y hora son obligatorias.'); return; }
    this.busy.set(true);
    const fechaInicio = `${this.form.fecha}T${this.form.hora}:00`;
    this.http.put(`${environment.apiUrl}/calendario/eventos/${id}`, {
      titulo: this.form.titulo.trim(),
      fechaInicio,
      fechaFin: this.fechaFinForm(),
      descripcion: this.form.descripcion || null,
      tipo: this.form.tipo || null,
      creadorNombre: this.usuario(),
      esPublico: this.form.esPublico
    }, { context: skipErrorToast() }).subscribe({
      next: () => { this.busy.set(false); this.cerrarModal(); this.cargarEventos(); this.toast.success('Evento actualizado.'); },
      error: (err) => {
        this.busy.set(false);
        this.modalError.set(err?.error?.message || 'No se pudo guardar el evento.');
      }
    });
  }

  eliminar() {
    const e = this.eventoSel();
    if (!e) return;
    if (!confirm(`Eliminar el evento "${e.titulo}"?`)) return;
    this.busy.set(true);
    this.http.delete(`${environment.apiUrl}/calendario/eventos/${e.id}`).subscribe({
      next: () => { this.busy.set(false); this.cerrarModal(); this.cargarEventos(); this.toast.success('Evento eliminado.'); },
      error: () => this.busy.set(false)   // el toast global muestra el error
    });
  }
}
