import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactosService, IntegranteOrganismoInput } from '../agenda/contactos.service';
import { OrganismosService } from '../../core/services/organismos.service';
import { CatalogosService, PartidoSectorDto } from '../../core/catalogos.service';
import { OrganismoDto } from '../../core/models/organismos';
import { PageTitleService } from '../../core/page-title.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Alta de una ficha de integrante de organismo para un contacto (feature 026).
 * Se llega desde el botón "Agregar integrante organismo" (contacto sin fichas) o
 * "Nuevo integrante organismo" (grilla). Un contacto puede tener más de una ficha
 * vigente (pertenecer a varios organismos). La Compañía filtra el dropdown de Organismo.
 */
@Component({
  selector: 'app-integrante-organismo-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="topbar-inline">
      <a [routerLink]="['/agenda', contactoId, 'organismos']" class="btn btn-secondary">← Volver a la ficha</a>
    </div>

    <div class="card" style="max-width:720px">
      <div class="card-header"><h2 class="card-title">Nuevo integrante de organismo — Contacto #{{ contactoId }}</h2></div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Compañía *</label>
            <select class="form-input" [ngModel]="companiaSel()" (ngModelChange)="onCompaniaChange($event)" name="comp">
              <option [ngValue]="null">— Seleccionar —</option>
              @for (c of companias(); track c) {
                <option [ngValue]="c">{{ c }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Organismo *</label>
            <select class="form-input" [(ngModel)]="form.organismoId" name="org" [disabled]="!companiaSel()">
              <option [ngValue]="null">— Seleccionar —</option>
              @for (o of organismosFiltrados(); track o.id) {
                <option [ngValue]="o.id">{{ o.nombre }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Partido-Sector</label>
            <select class="form-input" [(ngModel)]="form.partidoSectorId" name="ps">
              <option [ngValue]="null">— Sin asignar —</option>
              @for (s of sectores(); track s.id) {
                <option [ngValue]="s.id">{{ s.descripcion || s.codigo }}</option>
              }
            </select>
          </div>
          <div class="form-group"><label class="form-label">Posición en el organismo</label><input class="form-input" name="pos" [(ngModel)]="form.posicionOrganismo"></div>
          <div class="form-group">
            <label class="form-label">Condición</label>
            <select class="form-input" name="cond" [(ngModel)]="form.condicion">
              @for (c of condiciones; track c) {
                <option [ngValue]="c">{{ c }}</option>
              }
            </select>
          </div>
          <div class="form-group"><label class="form-label">Fecha de designación</label><input type="date" class="form-input" name="fd" [(ngModel)]="form.fechaDesignacion"></div>
          <div class="form-group"><label class="form-label">Orden</label><input type="number" step="0.01" class="form-input" name="ord" [(ngModel)]="form.orden"></div>
          <div class="form-group full-width"><label class="form-label">Nota</label><textarea class="form-textarea" name="nota" [(ngModel)]="form.nota"></textarea></div>
        </div>
        @if (error()) { <div class="form-error" style="color:#a8261b; margin-top:8px">{{ error() }}</div> }
      </div>
      <div class="card-footer" style="display:flex; gap:8px; justify-content:flex-end; padding:14px 20px; border-top:1px solid #eef1f5">
        <a [routerLink]="['/agenda', contactoId, 'organismos']" class="btn btn-secondary">Cancelar</a>
        <button class="btn btn-primary" (click)="guardar()" [disabled]="busy() || !form.organismoId">
          {{ busy() ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .topbar-inline { display:flex; justify-content:flex-start; margin-bottom:16px; }
    .form-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:14px 18px; }
    .form-group { display:flex; flex-direction:column; gap:5px; }
    .form-group.full-width { grid-column:1 / -1; }
    @media (max-width:600px) { .form-grid { grid-template-columns:1fr; } }
  `]
})
export class IntegranteOrganismoNuevoComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactosSvc = inject(ContactosService);
  private organismosSvc = inject(OrganismosService);
  private catalogosSvc = inject(CatalogosService);
  private titleSvc = inject(PageTitleService);
  private toast = inject(ToastService);

  contactoId!: number;
  organismos = signal<OrganismoDto[]>([]);
  sectores = signal<PartidoSectorDto[]>([]);
  companiaSel = signal<string | null>(null);
  busy = signal(false);
  error = signal('');

  /** Lista fija de condiciones (feature 026). El default es S/D. */
  readonly condiciones = ['S/D', 'Titular', 'Suplente', 'Titular con Licencia', 'Suplente en Ejercicio', 'Suspendido en Funciones'];

  /** Compañías = valores distintos, no vacíos, de organismo.nombreCompania, ordenadas alfabéticamente. */
  companias = computed(() => {
    const set = new Set<string>();
    for (const o of this.organismos()) {
      const c = (o.nombreCompania ?? '').trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  /** Organismos de la compañía seleccionada (vacío hasta elegir compañía). */
  organismosFiltrados = computed(() => {
    const comp = this.companiaSel();
    if (!comp) return [];
    return this.organismos().filter(o => (o.nombreCompania ?? '').trim() === comp);
  });

  form: Partial<IntegranteOrganismoInput> = {
    organismoId: null, partidoSectorId: null, posicionOrganismo: '',
    condicion: 'S/D', fechaDesignacion: '', orden: null, nota: '',
  };

  constructor() {
    this.titleSvc.set('Nuevo integrante de organismo');
    this.contactoId = +this.route.snapshot.paramMap.get('contactoId')!;
    this.organismosSvc.getOrganismos({ page: 1, pageSize: 1000, all: true, filters: {} }).subscribe(r => this.organismos.set(r.items));
    // Feature 026: "Partido Nacional - Todos" (código PN-CT (2)) no debe ofrecerse.
    this.catalogosSvc.partidoSectores().subscribe(s => this.sectores.set(s.filter(x => x.codigo !== 'PN-CT (2)')));
  }

  onCompaniaChange(value: string | null) {
    this.companiaSel.set(value);
    this.form.organismoId = null; // al cambiar de compañía se limpia el organismo elegido
  }

  guardar() {
    if (!this.form.organismoId) { this.error.set('Seleccioná un organismo.'); return; }
    this.busy.set(true);
    this.error.set('');
    const input: IntegranteOrganismoInput = {
      contactoId: this.contactoId,
      organismoId: this.form.organismoId,
      partidoSectorId: this.form.partidoSectorId ?? null,
      posicionOrganismo: this.form.posicionOrganismo || null,
      condicion: this.form.condicion || null,
      fechaDesignacion: this.form.fechaDesignacion || null,
      orden: this.form.orden ?? null,
      nota: this.form.nota || null,
      activo: true,
    };
    this.contactosSvc.crearIntegranteOrganismo(input).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('Integrante de organismo agregado.');
        this.router.navigate(['/agenda', this.contactoId, 'organismos']);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message || 'No se pudo guardar el integrante.');
      }
    });
  }
}
