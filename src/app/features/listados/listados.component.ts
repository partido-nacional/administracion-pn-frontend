import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PageTitleService } from '../../core/page-title.service';

interface Movimiento { fechaHora: string; usuario: string; accion: string; modulo: string; detalle: string; }
interface Parlamentario { cortesia: string; apellidos: string; nombre: string; direccion: string; domicilio: string; departamento: string; telMovil: string; mailPartido: string; posOrganismo: string; nombreOrganismo: string; credCivica: string; cedulaId: string; observaciones: string; }
interface Gobierno { cortesia: string; apellidos: string; nombre: string; telTrabajo: string; celular: string; mail: string; posOrganismo: string; nombreOrganismo: string; nombreCompania: string; }
interface ComDep { cortesia: string; apellidos: string; nombre: string; telefono: string; celular: string; mail: string; posOrganismo: string; departamento: string; dirOrganizacion: string; ciudadOrganizacion: string; }
interface IntNac { cortesia: string; apellidos: string; nombre: string; telTrabajo: string; posOrganismo: string; nombreOrganismo: string; departamento: string; }
interface IntPN { apellidos: string; nombres: string; telTrabajo1: string; telTrabajo2: string; telMovil: string; departamento: string; mailParticular: string; mailTrabajo: string; }
interface Alcalde { cortesia: string; apellidos: string; nombres: string; telTrabajo: string; celular: string; mail: string; posOrganismo: string; nombreOrganismo: string; departamento: string; }
interface Joven { apellidos: string; nombres: string; celular: string; mail: string; posOrganismo: string; }
interface ConvL { idContacto: number; credCivica: string; apellidos: string; nombres: string; celular: string; mail: string; posOrganismo: string; nombreOrganismo: string; condicion: string; adherente: boolean; }
interface DirEntry { apellidos: string; nombres: string; celular: string; mail: string; posOrganismo: string; }

type Sec = 'movimientos' | 'parlamentarias' | 'gobierno' | 'comdep' | 'intnac' | 'intpn' | 'alcaldes' | 'jovenes' | 'convencionales' | 'directorio';

@Component({
  selector: 'app-listados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tabs" style="flex-wrap:wrap">
      <a class="tab" [class.active]="sec()==='movimientos'"    (click)="setSec('movimientos')">Mov. de Sistema</a>
      <a class="tab" [class.active]="sec()==='parlamentarias'" (click)="setSec('parlamentarias')">Agrup. Parlamentarias</a>
      <a class="tab" [class.active]="sec()==='gobierno'"       (click)="setSec('gobierno')">Agrup. de Gobierno</a>
      <a class="tab" [class.active]="sec()==='comdep'"         (click)="setSec('comdep')">Com. Departamentales</a>
      <a class="tab" [class.active]="sec()==='intnac'"         (click)="setSec('intnac')">Intend. Nacionalistas</a>
      <a class="tab" [class.active]="sec()==='intpn'"          (click)="setSec('intpn')">Intendencias PN</a>
      <a class="tab" [class.active]="sec()==='alcaldes'"       (click)="setSec('alcaldes')">Alcaldes</a>
      <a class="tab" [class.active]="sec()==='jovenes'"        (click)="setSec('jovenes')">Com. Jóvenes</a>
      <a class="tab" [class.active]="sec()==='convencionales'" (click)="setSec('convencionales')">Convencionales</a>
      <a class="tab" [class.active]="sec()==='directorio'"     (click)="setSec('directorio')">Directorio</a>
    </div>

    @if (sec()==='movimientos') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead><tr><th>Fecha/Hora</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Detalle</th></tr></thead>
          <tbody>
            @for (m of movimientos(); track $index) {
              <tr>
                <td>{{ m.fechaHora }}</td>
                <td><strong>{{ m.usuario }}</strong></td>
                <td><span class="badge" [ngClass]="badgeAccion(m.accion)">{{ m.accion }}</span></td>
                <td>{{ m.modulo }}</td>
                <td>{{ m.detalle }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='parlamentarias') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1500px">
          <thead><tr><th>Cortesía</th><th>Apellidos</th><th>Nombre</th><th>Dirección</th><th>Domicilio</th><th>Depto.</th><th>Tel. Móvil</th><th>Mail</th><th>Posición</th><th>Organismo</th><th>Cred. Cívica</th><th>Cédula</th><th>Observaciones</th></tr></thead>
          <tbody>
            @for (p of parl(); track $index) {
              <tr>
                <td>{{ p.cortesia }}</td>
                <td><strong>{{ p.apellidos }}</strong></td>
                <td><strong>{{ p.nombre }}</strong></td>
                <td>{{ p.direccion }}</td>
                <td>{{ p.domicilio }}</td>
                <td><span class="badge dept">{{ p.departamento }}</span></td>
                <td>{{ p.telMovil }}</td>
                <td>{{ p.mailPartido }}</td>
                <td>{{ p.posOrganismo }}</td>
                <td>{{ p.nombreOrganismo }}</td>
                <td>{{ p.credCivica }}</td>
                <td>{{ p.cedulaId }}</td>
                <td>{{ p.observaciones }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='gobierno') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead><tr><th>Cortesía</th><th>Apellidos</th><th>Nombre</th><th>Tel. Trabajo</th><th>Celular</th><th>Mail</th><th>Posición</th><th>Organismo</th><th>Compañía</th></tr></thead>
          <tbody>
            @for (g of gob(); track $index) {
              <tr>
                <td>{{ g.cortesia }}</td>
                <td><strong>{{ g.apellidos }}</strong></td>
                <td><strong>{{ g.nombre }}</strong></td>
                <td>{{ g.telTrabajo }}</td>
                <td>{{ g.celular }}</td>
                <td>{{ g.mail }}</td>
                <td>{{ g.posOrganismo }}</td>
                <td>{{ g.nombreOrganismo }}</td>
                <td>{{ g.nombreCompania }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='comdep') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead><tr><th>Cortesía</th><th>Apellidos</th><th>Nombre</th><th>Teléfono</th><th>Celular</th><th>Mail</th><th>Posición</th><th>Depto.</th><th>Dir. Organización</th><th>Ciudad</th></tr></thead>
          <tbody>
            @for (c of comdep(); track $index) {
              <tr>
                <td>{{ c.cortesia }}</td>
                <td><strong>{{ c.apellidos }}</strong></td>
                <td><strong>{{ c.nombre }}</strong></td>
                <td>{{ c.telefono }}</td>
                <td>{{ c.celular }}</td>
                <td>{{ c.mail }}</td>
                <td>{{ c.posOrganismo }}</td>
                <td><span class="badge dept">{{ c.departamento }}</span></td>
                <td>{{ c.dirOrganizacion }}</td>
                <td>{{ c.ciudadOrganizacion }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='intnac') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead><tr><th>Cortesía</th><th>Apellidos</th><th>Nombre</th><th>Tel. Trabajo</th><th>Posición</th><th>Organismo</th><th>Depto.</th></tr></thead>
          <tbody>
            @for (i of intnac(); track $index) {
              <tr>
                <td>{{ i.cortesia }}</td>
                <td><strong>{{ i.apellidos }}</strong></td>
                <td><strong>{{ i.nombre }}</strong></td>
                <td>{{ i.telTrabajo }}</td>
                <td>{{ i.posOrganismo }}</td>
                <td>{{ i.nombreOrganismo }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='intpn') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead><tr><th>Apellidos</th><th>Nombres</th><th>Tel. Trabajo 1</th><th>Tel. Trabajo 2</th><th>Tel. Móvil</th><th>Depto.</th><th>Mail Particular</th><th>Mail Trabajo</th></tr></thead>
          <tbody>
            @for (i of intpn(); track $index) {
              <tr>
                <td><strong>{{ i.apellidos }}</strong></td>
                <td><strong>{{ i.nombres }}</strong></td>
                <td>{{ i.telTrabajo1 }}</td>
                <td>{{ i.telTrabajo2 }}</td>
                <td>{{ i.telMovil }}</td>
                <td><span class="badge dept">{{ i.departamento }}</span></td>
                <td>{{ i.mailParticular }}</td>
                <td>{{ i.mailTrabajo }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='alcaldes') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead><tr><th>Cortesía</th><th>Apellidos</th><th>Nombres</th><th>Tel. Trabajo</th><th>Celular</th><th>Mail</th><th>Posición</th><th>Organismo</th><th>Depto.</th></tr></thead>
          <tbody>
            @for (a of alcaldes(); track $index) {
              <tr>
                <td>{{ a.cortesia }}</td>
                <td><strong>{{ a.apellidos }}</strong></td>
                <td><strong>{{ a.nombres }}</strong></td>
                <td>{{ a.telTrabajo }}</td>
                <td>{{ a.celular }}</td>
                <td>{{ a.mail }}</td>
                <td>{{ a.posOrganismo }}</td>
                <td>{{ a.nombreOrganismo }}</td>
                <td><span class="badge dept">{{ a.departamento }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='jovenes') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead><tr><th>Apellidos</th><th>Nombres</th><th>Celular</th><th>Mail</th><th>Posición</th></tr></thead>
          <tbody>
            @for (j of jovenes(); track $index) {
              <tr>
                <td><strong>{{ j.apellidos }}</strong></td>
                <td><strong>{{ j.nombres }}</strong></td>
                <td>{{ j.celular }}</td>
                <td>{{ j.mail }}</td>
                <td>{{ j.posOrganismo }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='convencionales') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table" style="min-width:1300px">
          <thead><tr><th>ID Contacto</th><th>Cred. Cívica</th><th>Apellidos</th><th>Nombres</th><th>Celular</th><th>Mail</th><th>Posición</th><th>Organismo</th><th>Condición</th><th>Adherente</th></tr></thead>
          <tbody>
            @for (c of convs(); track c.idContacto) {
              <tr>
                <td>{{ c.idContacto }}</td>
                <td>{{ c.credCivica }}</td>
                <td><strong>{{ c.apellidos }}</strong></td>
                <td><strong>{{ c.nombres }}</strong></td>
                <td>{{ c.celular }}</td>
                <td>{{ c.mail }}</td>
                <td>{{ c.posOrganismo }}</td>
                <td>{{ c.nombreOrganismo }}</td>
                <td>{{ c.condicion }}</td>
                <td style="text-align:center">{{ c.adherente ? '☑' : '☐' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    @if (sec()==='directorio') {
      <div class="card"><div class="card-body" style="padding:0;overflow-x:auto">
        <table class="table">
          <thead><tr><th>Apellidos</th><th>Nombres</th><th>Celular</th><th>Mail</th><th>Posición</th></tr></thead>
          <tbody>
            @for (d of directorio(); track $index) {
              <tr>
                <td><strong>{{ d.apellidos }}</strong></td>
                <td><strong>{{ d.nombres }}</strong></td>
                <td>{{ d.celular }}</td>
                <td>{{ d.mail }}</td>
                <td>{{ d.posOrganismo }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }
  `
})
export class ListadosComponent {
  private http = inject(HttpClient);
  private titleSvc = inject(PageTitleService);

  sec = signal<Sec>('movimientos');

  movimientos = signal<Movimiento[]>([]);
  parl = signal<Parlamentario[]>([]);
  gob = signal<Gobierno[]>([]);
  comdep = signal<ComDep[]>([]);
  intnac = signal<IntNac[]>([]);
  intpn = signal<IntPN[]>([]);
  alcaldes = signal<Alcalde[]>([]);
  jovenes = signal<Joven[]>([]);
  convs = signal<ConvL[]>([]);
  directorio = signal<DirEntry[]>([]);

  constructor() {
    this.titleSvc.set('Listados');
    this.cargar('movimientos');
  }

  setSec(s: Sec) {
    this.sec.set(s);
    this.cargar(s);
  }

  cargar(s: Sec) {
    const base = environment.apiUrl + '/listados';
    if (s === 'movimientos' && this.movimientos().length === 0)
      this.http.get<Movimiento[]>(`${base}/movimientos`).subscribe(x => this.movimientos.set(x));
    if (s === 'parlamentarias' && this.parl().length === 0)
      this.http.get<Parlamentario[]>(`${base}/parlamentarias`).subscribe(x => this.parl.set(x));
    if (s === 'gobierno' && this.gob().length === 0)
      this.http.get<Gobierno[]>(`${base}/gobierno`).subscribe(x => this.gob.set(x));
    if (s === 'comdep' && this.comdep().length === 0)
      this.http.get<ComDep[]>(`${base}/com-departamentales`).subscribe(x => this.comdep.set(x));
    if (s === 'intnac' && this.intnac().length === 0)
      this.http.get<IntNac[]>(`${base}/intendencias-nacionalistas`).subscribe(x => this.intnac.set(x));
    if (s === 'intpn' && this.intpn().length === 0)
      this.http.get<IntPN[]>(`${base}/intendencias-pn`).subscribe(x => this.intpn.set(x));
    if (s === 'alcaldes' && this.alcaldes().length === 0)
      this.http.get<Alcalde[]>(`${base}/alcaldes`).subscribe(x => this.alcaldes.set(x));
    if (s === 'jovenes' && this.jovenes().length === 0)
      this.http.get<Joven[]>(`${base}/jovenes`).subscribe(x => this.jovenes.set(x));
    if (s === 'convencionales' && this.convs().length === 0)
      this.http.get<ConvL[]>(`${base}/convencionales`).subscribe(x => this.convs.set(x));
    if (s === 'directorio' && this.directorio().length === 0)
      this.http.get<DirEntry[]>(`${base}/directorio`).subscribe(x => this.directorio.set(x));
  }

  badgeAccion(a: string) {
    if (a === 'Alta') return 'status-active';
    if (a === 'Modificacion') return 'status-pending';
    return 'status-rejected';
  }
}
