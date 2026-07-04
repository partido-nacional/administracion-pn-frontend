import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactosService, FichaAdhesionDetalle } from '../agenda/contactos.service';
import { AdhesionesService } from './adhesiones.service';
import { PageTitleService } from '../../core/page-title.service';
import { CatalogosService } from '../../core/catalogos.service';
import { DEPARTAMENTOS, sanitizarFichaParaGuardar } from '../../shared/adhesiones/ficha-adhesion.constants';
import { hoyISO, normalizarFechaSalida } from '../../shared/adhesiones/confirmado-baja.util';
import { FichaAdhesionFormComponent } from '../../shared/adhesiones/ficha-adhesion-form.component';

@Component({
  selector: 'app-nueva-ficha',
  standalone: true,
  imports: [CommonModule, RouterLink, FichaAdhesionFormComponent],
  template: `
    <div class="topbar-inline">
      <a [routerLink]="['/agenda', contactoId, 'fichas']" class="btn btn-secondary">← Cancelar</a>
    </div>

    @if (ficha(); as f) {
      <div class="card">
        <div class="card-body">
          <h2 style="margin:0 0 4px 0">Nueva Ficha de Adhesión</h2>
          <p style="margin:0 0 16px 0; color:#666">Contacto: <strong>{{ contactoNombre() }}</strong> (#{{ contactoId }})</p>

          <div class="form-section"><div class="form-section-title">Datos de adhesión</div></div>
          <app-ficha-adhesion-form
            [ficha]="f"
            (fichaChange)="ficha.set($event)"
            [sectores]="sectores()">
          </app-ficha-adhesion-form>

          <div class="form-actions">
            <button class="btn btn-primary" (click)="guardar()">Crear ficha</button>
            <a [routerLink]="['/agenda', contactoId, 'fichas']" class="btn btn-secondary">Cancelar</a>
          </div>
        </div>
      </div>
    } @else {
      <div class="card"><div class="card-body"><div class="empty-state"><div class="empty-state-text">Cargando datos del contacto…</div></div></div></div>
    }
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-start; margin-bottom:16px; }
  `]
})
export class NuevaFichaComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactosSvc = inject(ContactosService);
  private adhSvc = inject(AdhesionesService);
  private titleSvc = inject(PageTitleService);
  private catSvc = inject(CatalogosService);

  contactoId!: number;
  contactoNombre = signal<string>('');
  ficha = signal<FichaAdhesionDetalle | null>(null);
  sectores = signal<string[]>([]);

  constructor() {
    this.titleSvc.set('Nueva Ficha de Adhesión');
    this.catSvc.sectores().subscribe(list =>
      this.sectores.set(list.map(s => s.descripcion))
    );
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.contactosSvc.get(this.contactoId).subscribe(c => {
      this.contactoNombre.set(`${c.apellido}, ${c.nombre}`);
      const today = hoyISO();
      const dep = c.departamento && DEPARTAMENTOS.includes(c.departamento) ? c.departamento : undefined;
      this.ficha.set({
        id: 0,
        contactoId: this.contactoId,
        contactoNombre: `${c.nombre} ${c.apellido}`,
        sector: undefined,
        sistContrib: undefined,
        aporte: undefined,
        fechaAdhesion: today,
        fechaSalida: undefined,
        aporteConfirmado: null,
        art46: false,
        titularResponsable: `${c.nombre} ${c.apellido}`,
        observaciones: undefined,
        aporteTodoAlPartido: true,
        aporteSecretariaAgrupacion: undefined,
        aporteAgrupacion: undefined,
        departamentoAgrupacion: dep,
        departamental: false,
        cedulaResponsable: c.documento,
        codigoAgrupacion: undefined,
        telefonoAntel: c.telefono ?? c.celular,
        fechaVencimiento: undefined,
        fechaUltimoPago: undefined,
        carnetEntregado: undefined
      });
    });
  }

  guardar() {
    const f = this.ficha();
    if (!f) return;
    // Coherencia: una Baja siempre debe llevar fecha de salida (TODO-012).
    normalizarFechaSalida(f);
    // Saneo al guardar: quita los campos condicionales que no aplican (fix 009).
    const limpia = sanitizarFichaParaGuardar(f);
    this.adhSvc.createLocal(limpia).subscribe(() => {
      this.router.navigate(['/agenda', this.contactoId, 'fichas']);
    });
  }
}
