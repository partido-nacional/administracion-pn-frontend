import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PAGE_SIZE_OPTIONS } from '../../../core/models/paged';

/**
 * Paginador reutilizable server-side. Reemplaza el bloque `.pagination` decorativo.
 * Reutiliza las clases globales (.pagination, .page-btn, ...) de styles.css.
 *
 * Uso:
 *   <app-paginator [total]="total()" [page]="page()" [pageSize]="pageSize()"
 *                  (pageChange)="onPage($event)" (pageSizeChange)="onPageSize($event)" />
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination" style="padding:16px 24px">
      <span class="pagination-info">
        @if (total() > 0) {
          Mostrando {{ from() }}–{{ to() }} de {{ total() | number }}
        } @else {
          Sin resultados
        }
      </span>

      <div style="display:flex; align-items:center; gap:12px">
        <label style="display:flex; align-items:center; gap:6px; font-size:13px; color:var(--gray-500)">
          Por página
          <select class="column-filter" [value]="pageSize()"
                  (change)="onPageSize($event)">
            @for (opt of pageSizeOptions; track opt) {
              <option [value]="opt">{{ opt }}</option>
            }
          </select>
        </label>

        <div class="pagination-buttons">
          <button class="page-btn" [disabled]="page() <= 1"
                  (click)="go(page() - 1)" aria-label="Anterior">&lt;</button>

          @for (p of pages(); track $index) {
            @if (p === ELLIPSIS) {
              <button class="page-btn" disabled>…</button>
            } @else {
              <button class="page-btn" [class.active]="p === page()"
                      (click)="go(p)">{{ p }}</button>
            }
          }

          <button class="page-btn" [disabled]="page() >= totalPages()"
                  (click)="go(page() + 1)" aria-label="Siguiente">&gt;</button>
        </div>
      </div>
    </div>
  `
})
export class PaginatorComponent {
  /** Total de registros (del backend). */
  total = input.required<number>();
  /** Página actual (1-indexed). */
  page = input.required<number>();
  /** Tamaño de página actual. */
  pageSize = input.required<number>();

  pageChange = output<number>();
  pageSizeChange = output<number>();

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly ELLIPSIS = -1;

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  from = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  /** Ventana de páginas con elipsis: 1 … (p-1) p (p+1) … N */
  pages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const out: number[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) out.push(this.ELLIPSIS);
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push(this.ELLIPSIS);
    out.push(total);
    return out;
  });

  go(p: number): void {
    const clamped = Math.min(Math.max(1, p), this.totalPages());
    if (clamped !== this.page()) this.pageChange.emit(clamped);
  }

  onPageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (value && value !== this.pageSize()) this.pageSizeChange.emit(value);
  }
}
