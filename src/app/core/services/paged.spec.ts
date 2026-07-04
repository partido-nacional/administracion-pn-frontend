import { buildPagedParams } from './paged';
import { GridQuery } from '../models/paged';

describe('buildPagedParams', () => {
  it('incluye page y pageSize por defecto', () => {
    const p = buildPagedParams({ page: 2, pageSize: 25 });
    expect(p.get('page')).toBe('2');
    expect(p.get('pageSize')).toBe('25');
  });

  it('agrega sort y order (order por defecto asc)', () => {
    const p = buildPagedParams({ page: 1, pageSize: 25, sort: 'nombre' });
    expect(p.get('sort')).toBe('nombre');
    expect(p.get('order')).toBe('asc');
  });

  it('respeta order desc', () => {
    const p = buildPagedParams({ page: 1, pageSize: 25, sort: 'fecha', order: 'desc' });
    expect(p.get('order')).toBe('desc');
  });

  it('no agrega sort si no se especifica', () => {
    const p = buildPagedParams({ page: 1, pageSize: 25 });
    expect(p.has('sort')).toBeFalse();
    expect(p.has('order')).toBeFalse();
  });

  it('omite filtros vacíos (undefined, null, "" y solo espacios)', () => {
    const q: GridQuery = {
      page: 1, pageSize: 25,
      filters: { a: '', b: undefined, c: null, d: '   ', e: 'valido' },
    };
    const p = buildPagedParams(q);
    expect(p.has('a')).toBeFalse();
    expect(p.has('b')).toBeFalse();
    expect(p.has('c')).toBeFalse();
    expect(p.has('d')).toBeFalse();
    expect(p.get('e')).toBe('valido');
  });

  it('serializa filtros numéricos y booleanos no vacíos', () => {
    const p = buildPagedParams({ page: 1, pageSize: 25, filters: { id: 7, activo: false } });
    expect(p.get('id')).toBe('7');
    expect(p.get('activo')).toBe('false');
  });

  it('con all=true envía all y omite page/pageSize', () => {
    const p = buildPagedParams({ page: 3, pageSize: 25, all: true, filters: { q: 'x' } });
    expect(p.get('all')).toBe('true');
    expect(p.has('page')).toBeFalse();
    expect(p.has('pageSize')).toBeFalse();
    expect(p.get('q')).toBe('x');
  });
});
