import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Tarjeta { tarjeta: string; aceptados: number; rechazados: number; total: number; monto: number; pctAceptacion: number; }
interface Rechazado { adherente: string; tarjeta: string; monto: number; fecha: string; motivo: string; }
interface Stats { aceptados: number; rechazados: number; montoTotal: number; pctAceptados: number; pctRechazados: number; }
interface Dashboard { stats: Stats; porTarjeta: Tarjeta[]; rechazados: Rechazado[]; }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

@Component({
  selector: 'app-debitos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="filter-bar">
          @for (m of meses; track m; let i = $index) {
            <span class="filter-chip" [class.active]="mes()===i" (click)="mes.set(i)">{{ m }}</span>
          }
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" style="color:var(--success)">{{ data().stats.aceptados }}</div>
        <div class="stat-label">Aceptados</div>
        <div class="stat-trend up">{{ pctAceptados(data().stats) }}% del total</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--danger)">{{ data().stats.rechazados }}</div>
        <div class="stat-label">Rechazados</div>
        <div class="stat-trend down">{{ pctRechazados(data().stats) }}% del total</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">\${{ formatMonto(data().stats.montoTotal) }}</div>
        <div class="stat-label">Monto Total Recaudado</div>
        <div class="stat-trend up">+12% vs mes anterior</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h2 class="card-title">Resumen por Tarjeta — {{ meses[mes()] }} 2026</h2></div>
      <div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead>
            <tr><th>Tarjeta</th><th>Aceptados</th><th>Rechazados</th><th>Total</th><th>Monto</th><th>% Aceptación</th><th></th></tr>
          </thead>
          <tbody>
            @for (t of data().porTarjeta; track t.tarjeta) {
              <tr>
                <td><span class="badge" [ngClass]="badgeClass(t.tarjeta)">{{ t.tarjeta }}</span></td>
                <td><strong>{{ t.aceptados }}</strong></td>
                <td style="color:var(--danger)">{{ t.rechazados }}</td>
                <td>{{ totalTarjeta(t) }}</td>
                <td>\${{ formatMonto(t.monto) }}</td>
                <td><span class="badge" [ngClass]="pctAceptacion(t) >= 88 ? 'status-active' : 'status-pending'">{{ pctAceptacion(t) }}%</span></td>
                <td class="action-group">
                  <a class="action-link">Aceptados</a>
                  <a class="action-link">Rechazados</a>
                  <a class="action-link">Histórico</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Últimos Débitos Rechazados</h2>
        <!-- TODO: "Ver todos" pendiente — requiere vista/endpoint de listado completo de débitos rechazados (ver auditoría de pendientes, sección 2) -->
        <a class="btn btn-secondary btn-sm">Ver todos</a>
      </div>
      <div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead><tr><th>Adherente</th><th>Tarjeta</th><th>Monto</th><th>Fecha</th><th>Motivo</th></tr></thead>
          <tbody>
            @for (r of data().rechazados; track $index) {
              <tr>
                <td><strong>{{ r.adherente }}</strong></td>
                <td><span class="badge" [ngClass]="badgeClass(r.tarjeta)">{{ r.tarjeta }}</span></td>
                <td>\${{ formatMonto(r.monto) }}</td>
                <td>{{ r.fecha | date:'dd/MM/yyyy' }}</td>
                <td>{{ r.motivo }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DebitosComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  meses = MESES;
  mes = signal(3);
  data = signal<Dashboard>({ stats: { aceptados: 0, rechazados: 0, montoTotal: 0, pctAceptados: 0, pctRechazados: 0 }, porTarjeta: [], rechazados: [] });

  constructor() {
    this.titleSvc.set('Débitos');
    this.http.get<Dashboard>(`${environment.apiUrl}/debitos/dashboard`).subscribe(x => this.data.set(x));
  }

  private baseTotal(x: { aceptados: number; rechazados: number }) {
    return x.aceptados + x.rechazados;
  }

  totalTarjeta(t: { aceptados: number; rechazados: number }) {
    return this.baseTotal(t);
  }

  pctAceptacion(t: { aceptados: number; rechazados: number }) {
    const b = this.baseTotal(t);
    return b === 0 ? 0 : Math.round((t.aceptados / b) * 100);
  }

  pctAceptados(s: { aceptados: number; rechazados: number }) {
    const b = this.baseTotal(s);
    return b === 0 ? 0 : Math.round((s.aceptados / b) * 100);
  }

  pctRechazados(s: { aceptados: number; rechazados: number }) {
    const b = this.baseTotal(s);
    return b === 0 ? 0 : Math.round((s.rechazados / b) * 100);
  }

  badgeClass(t: string) {
    const k = t.toLowerCase();
    if (k === 'visa') return 'visa';
    if (k === 'master') return 'master';
    if (k === 'oca') return 'oca';
    if (k === 'ebrou') return 'ebrou';
    if (k === 'antel') return 'antel';
    return 'dept';
  }

  formatMonto(n: number) {
    return n.toLocaleString('es-UY', { maximumFractionDigits: 0 });
  }
}
