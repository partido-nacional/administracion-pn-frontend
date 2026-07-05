import { signal } from '@angular/core';
import { SortOrder } from '../../core/models/paged';
import { toggleSort, sortArrow } from './grid-sort';

describe('toggleSort', () => {
  it('activa una columna nueva en asc', () => {
    const sort = signal<string | undefined>(undefined);
    const order = signal<SortOrder>('asc');
    toggleSort(sort, order, 'nombre');
    expect(sort()).toBe('nombre');
    expect(order()).toBe('asc');
  });

  it('invierte asc→desc al reclickear la misma columna', () => {
    const sort = signal<string | undefined>('nombre');
    const order = signal<SortOrder>('asc');
    toggleSort(sort, order, 'nombre');
    expect(sort()).toBe('nombre');
    expect(order()).toBe('desc');
  });

  it('invierte desc→asc al reclickear la misma columna', () => {
    const sort = signal<string | undefined>('nombre');
    const order = signal<SortOrder>('desc');
    toggleSort(sort, order, 'nombre');
    expect(order()).toBe('asc');
  });

  it('al cambiar de columna resetea a asc (aunque la previa fuera desc)', () => {
    const sort = signal<string | undefined>('nombre');
    const order = signal<SortOrder>('desc');
    toggleSort(sort, order, 'tipo');
    expect(sort()).toBe('tipo');
    expect(order()).toBe('asc');
  });
});

describe('sortArrow', () => {
  it('▲ para la columna activa en asc', () => {
    expect(sortArrow('nombre', 'asc', 'nombre')).toBe('▲');
  });
  it('▼ para la columna activa en desc', () => {
    expect(sortArrow('nombre', 'desc', 'nombre')).toBe('▼');
  });
  it("'' para una columna no activa", () => {
    expect(sortArrow('nombre', 'asc', 'tipo')).toBe('');
  });
  it("'' cuando no hay columna de sort (undefined)", () => {
    expect(sortArrow(undefined, 'asc', 'nombre')).toBe('');
  });
});
