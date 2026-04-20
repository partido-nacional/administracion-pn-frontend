import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface AdhesionWeb {
  id: number; nombre: string; apellido: string; documento?: string;
  email?: string; telefono?: string; departamento?: string; localidad?: string;
  fechaAdhesion: string; estado: string;
}
interface AdhesionLocal {
  id: number; contactoId: number; contacto?: any; fechaAdhesion: string; origen?: string;
}

@Component({
  selector: 'app-adhesiones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabs">
      <a class="tab" [class.active]="tab()==='web'" (click)="tab.set('web')">Pendientes (Web) <span class="badge status-pending">{{ web().length }}</span></a>
      <a class="tab" [class.active]="tab()==='local'" (click)="tab.set('local')">Locales</a>
    </div>

    @if (tab()==='web') {
      <div class="card"><div class="card-body" style="overflow-x:auto">
        <table class="table">
          <thead><tr><th>Fecha</th><th>Apellido</th><th>Nombre</th><th>Documento</th><th>Email</th><th>Depto</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (a of web(); track a.id) {
              <tr>
                <td>{{ a.fechaAdhesion | date:'dd/MM/yy' }}</td>
                <td>{{ a.apellido }}</td>
                <td>{{ a.nombre }}</td>
                <td>{{ a.documento || '—' }}</td>
                <td>{{ a.email || '—' }}</td>
                <td>{{ a.departamento || '—' }}</td>
                <td><button class="btn btn-success btn-sm" (click)="pasar(a.id)">Pasar a Local</button></td>
              </tr>
            } @empty {
              <tr><td colspan="7"><div class="empty-state"><div class="empty-state-text">No hay adhesiones pendientes</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    } @else {
      <div class="card"><div class="card-body" style="overflow-x:auto">
        <table class="table">
          <thead><tr><th>Fecha</th><th>Contacto</th><th>Origen</th></tr></thead>
          <tbody>
            @for (a of local(); track a.id) {
              <tr>
                <td>{{ a.fechaAdhesion | date:'dd/MM/yy' }}</td>
                <td>{{ a.contacto?.apellido }}, {{ a.contacto?.nombre }}</td>
                <td><span class="badge dept">{{ a.origen || 'Directo' }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="3"><div class="empty-state"><div class="empty-state-text">Sin adhesiones locales</div></div></td></tr>
            }
          </tbody>
        </table>
      </div></div>
    }
  `
})
export class AdhesionesListadoComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);
  tab = signal<'web'|'local'>('web');
  web = signal<AdhesionWeb[]>([]);
  local = signal<AdhesionLocal[]>([]);

  constructor() {
    this.titleSvc.set('Adhesiones');
    this.reloadWeb();
    this.reloadLocal();
  }

  reloadWeb() { this.http.get<AdhesionWeb[]>(`${environment.apiUrl}/adhesiones/web`).subscribe(x => this.web.set(x)); }
  reloadLocal() { this.http.get<AdhesionLocal[]>(`${environment.apiUrl}/adhesiones/locales`).subscribe(x => this.local.set(x)); }

  pasar(id: number) {
    this.http.post(`${environment.apiUrl}/adhesiones/web/${id}/pasar-a-local`, {}).subscribe(() => {
      this.reloadWeb();
      this.reloadLocal();
    });
  }
}
