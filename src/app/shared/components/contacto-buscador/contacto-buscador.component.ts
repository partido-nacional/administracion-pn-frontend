import { Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import { ContactosService, ContactoListado } from '../../../features/agenda/contactos.service';

/** "Apellido, Nombre (cédula)": cómo se muestra un contacto elegido. */
export function etiquetaContacto(c: ContactoListado): string {
  return `${c.apellido}, ${c.nombre}${c.cedula ? ' (' + c.cedula + ')' : ''}`;
}

/** Datos extra en cada resultado, para distinguir homónimos: "#45 · Cred. BAA27057". */
export function detalleContacto(c: ContactoListado): string {
  return [`#${c.id}`, c.credencial ? `Cred. ${c.credencial}` : ''].filter(Boolean).join(' · ');
}

/**
 * Combo para buscar un contacto por nombre y apellido, cédula, credencial o ID (debounce 250 ms, 8 resultados) y elegirlo.
 * Busca en toda la agenda (q de GET /contactos); con un solo término, la coincidencia exacta de ID,
 * cédula o credencial sale primera.
 * Emite `seleccionar` con el contacto y se limpia solo, listo para buscar el siguiente.
 * Misma búsqueda que el alta de integrantes de Agrupaciones por Período.
 */
@Component({
  selector: 'app-contacto-buscador',
  standalone: true,
  template: `
    <div class="combo">
      <input class="combo-input" [placeholder]="placeholder" [value]="q()" (input)="onInput($event)"
             [attr.aria-label]="placeholder" autocomplete="off">
      @if (q()) {
        <button type="button" class="combo-clear" (click)="limpiar()" aria-label="Limpiar">×</button>
      }
      @if (resultados().length > 0) {
        <div class="combo-list" role="listbox">
          @for (c of resultados(); track c.id) {
            <div class="combo-opt" role="option" (click)="elegir(c)">
              {{ etiqueta(c) }} <span class="combo-det">{{ detalle(c) }}</span>
            </div>
          }
        </div>
      }
      @if (sinResultados()) { <div class="combo-empty">Sin coincidencias.</div> }
    </div>
  `,
  styles: [`
    .combo { position:relative; }
    .combo-input { width:100%; box-sizing:border-box; padding-right:28px; }
    .combo-clear {
      position:absolute; right:6px; top:50%; transform:translateY(-50%);
      background:transparent; border:none; font-size:16px; cursor:pointer; color:#888;
    }
    .combo-list {
      position:absolute; top:100%; left:0; right:0; z-index:20;
      max-height:200px; overflow-y:auto; background:#fff;
      border:1px solid #cfd6e0; border-radius:5px; margin-top:2px;
      box-shadow:0 6px 16px rgba(0,0,0,.12);
    }
    .combo-opt { padding:8px 12px; cursor:pointer; font-size:13px; border-bottom:1px solid #f0f3f7; }
    .combo-opt:last-child { border-bottom:none; }
    .combo-opt:hover { background:#eef5ff; }
    .combo-det { color:#888; font-size:12px; margin-left:4px; }
    .combo-empty { font-size:12px; color:#888; margin-top:4px; }
  `],
})
export class ContactoBuscadorComponent {
  private contactosSvc = inject(ContactosService);

  @Input() placeholder = 'Buscar por nombre y apellido, cédula, credencial o ID…';
  @Output() seleccionar = new EventEmitter<ContactoListado>();

  q = signal('');
  resultados = signal<ContactoListado[]>([]);
  sinResultados = signal(false);
  readonly etiqueta = etiquetaContacto;
  readonly detalle = detalleContacto;

  private buscar$ = new Subject<string>();

  constructor() {
    this.buscar$.pipe(
      debounceTime(250),
      // switchMap: si se sigue tipeando, se descarta la respuesta vieja
      // (un error de red no corta el stream: se trata como "sin resultados" y se puede reintentar)
      switchMap(q => q.trim()
        ? this.contactosSvc.listado({ page: 1, pageSize: 8, filters: { q: q.trim() } }).pipe(catchError(() => of(null)))
        : of(null)),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(r => {
      this.resultados.set(r?.items ?? []);
      this.sinResultados.set(!!r && r.items.length === 0);
    });
  }

  onInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.q.set(v);
    this.sinResultados.set(false);
    this.buscar$.next(v);
  }

  elegir(c: ContactoListado) {
    this.seleccionar.emit(c);
    this.limpiar();
  }

  limpiar() {
    this.q.set('');
    this.resultados.set([]);
    this.sinResultados.set(false);
    this.buscar$.next('');
  }
}
