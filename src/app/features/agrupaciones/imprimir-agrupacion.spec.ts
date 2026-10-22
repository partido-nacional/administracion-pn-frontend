import { imprimirAgrupacion, PrintAgrupacionData } from './imprimir-agrupacion';

function capturarHtml(d: PrintAgrupacionData): string {
  let written = '';
  const fakeWin: any = {
    document: { open() {}, write(h: string) { written += h; }, close() {} },
    focus() {}, print() {}, onload: null,
  };
  spyOn(window, 'open').and.returnValue(fakeWin);
  imprimirAgrupacion(d, { firmas: false, titulo: 'Agrupación' });
  return written;
}

const base: PrintAgrupacionData = {
  agrupacionId: 1, periodoId: 1, periodo: '2025-2030', nombre: 'Lista X',
};

describe('imprimirAgrupacion — escape XSS', () => {
  it('escapa el nombre de la agrupación', () => {
    const html = capturarHtml({ ...base, nombre: '<script>alert(1)</script>' });
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('escapa campos de trámite (observaciones)', () => {
    const html = capturarHtml({ ...base, observaciones: '<img src=x onerror=alert(1)>' });
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });

  it('escapa datos de integrantes', () => {
    const html = capturarHtml({
      ...base,
      integrantes: [{ nombre: '<script>1</script>', apellido: 'x', cedula: '"><b>y</b>' }],
    });
    expect(html).not.toContain('<script>1</script>');
    expect(html).not.toContain('<b>y</b>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('imprimirAgrupacion — N° Trámite', () => {
  it('imprime el N° Trámite y la Fecha Circ. C.E. solo si la agrupación la tiene', () => {
    const sinFecha = capturarHtml({ ...base, nroTramite: 'T-15' });
    expect(sinFecha).toContain('N° Trámite');
    expect(sinFecha).toContain('T-15');
    expect(sinFecha).not.toContain('Fecha Circ. C.E.');
    (window.open as jasmine.Spy).and.callThrough();
  });

  it('mantiene la Fecha Circ. C.E. migrada', () => {
    expect(capturarHtml({ ...base, fechaCircCE: '01/05/2020' })).toContain('Fecha Circ. C.E.');
  });
});
