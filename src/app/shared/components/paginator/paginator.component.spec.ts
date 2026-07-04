import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginatorComponent } from './paginator.component';

describe('PaginatorComponent', () => {
  let fixture: ComponentFixture<PaginatorComponent>;
  let cmp: PaginatorComponent;

  function setup(total: number, page: number, pageSize: number) {
    fixture = TestBed.createComponent(PaginatorComponent);
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.detectChanges();
    cmp = fixture.componentInstance;
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [PaginatorComponent] }));

  it('calcula totalPages, from y to', () => {
    setup(100, 1, 25);
    expect(cmp.totalPages()).toBe(4);
    expect(cmp.from()).toBe(1);
    expect(cmp.to()).toBe(25);
  });

  it('to no excede el total en la última página', () => {
    setup(30, 2, 25);
    expect(cmp.totalPages()).toBe(2);
    expect(cmp.from()).toBe(26);
    expect(cmp.to()).toBe(30);
  });

  it('con 0 resultados: totalPages 1, from/to en 0', () => {
    setup(0, 1, 25);
    expect(cmp.totalPages()).toBe(1);
    expect(cmp.from()).toBe(0);
    expect(cmp.to()).toBe(0);
  });

  it('pages() sin elipsis cuando hay pocas páginas', () => {
    setup(50, 1, 25); // 2 páginas
    expect(cmp.pages()).toEqual([1, 2]);
  });

  it('pages() con elipsis cuando hay muchas páginas', () => {
    setup(1000, 1, 25); // 40 páginas
    const pages = cmp.pages();
    expect(pages[0]).toBe(1);
    expect(pages).toContain(cmp.ELLIPSIS);
    expect(pages[pages.length - 1]).toBe(40);
  });

  it('go() emite pageChange con la página válida', () => {
    setup(100, 1, 25);
    let emitted: number | undefined;
    cmp.pageChange.subscribe(v => (emitted = v));
    cmp.go(3);
    expect(emitted).toBe(3);
  });

  it('go() clampea al rango y no emite si no cambia', () => {
    setup(100, 1, 25);
    let emitted: number | undefined;
    cmp.pageChange.subscribe(v => (emitted = v));
    cmp.go(0);            // clamp a 1 == página actual -> no emite
    expect(emitted).toBeUndefined();
    cmp.go(999);          // clamp a totalPages (4)
    expect(emitted).toBe(4);
  });

  it('onPageSize emite pageSizeChange con el nuevo tamaño', () => {
    setup(100, 1, 25);
    let emitted: number | undefined;
    cmp.pageSizeChange.subscribe(v => (emitted = v));
    cmp.onPageSize({ target: { value: '50' } } as unknown as Event);
    expect(emitted).toBe(50);
  });
});
