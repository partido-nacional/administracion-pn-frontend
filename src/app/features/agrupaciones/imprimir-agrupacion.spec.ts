import { escalaParaUnaHoja, imprimirAgrupacion, PrintAgrupacionData } from './imprimir-agrupacion';

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

describe('imprimirAgrupacion — una sola hoja con firmas', () => {
  function html(d: PrintAgrupacionData, firmas = true): string {
    let written = '';
    spyOn(window, 'open').and.returnValue({
      document: { open() {}, write(h: string) { written += h; }, close() {} }, focus() {}, print() {}, onload: null,
    } as any);
    imprimirAgrupacion(d, { firmas, titulo: 'Ficha de Agrupación' });
    return written;
  }

  it('escalaParaUnaHoja: 1 si entra en el A4 útil (277mm ≈ 1047px, con 10% de margen ≈ 942px); si no, lo achica', () => {
    expect(escalaParaUnaHoja(900)).toBe(1);
    expect(escalaParaUnaHoja(942)).toBe(1);
    expect(escalaParaUnaHoja(1884)).toBeCloseTo(0.5, 2);
  });

  it('las firmas van en la misma hoja (sin saltos de página) y con los 7 nombres', () => {
    const h = html(base);
    expect(h).toContain('@page { size: A4');
    expect(h).not.toContain('page-break-before');
    ['Gloria Rodríguez', 'Javier García', 'Armando Castaingdebat', 'Luis A. Heber', 'Enrique Antía']
      .forEach(n => expect(h).toContain(n));
    expect(h.match(/class="firma"/g)?.length).toBe(7);
  });

  it('sin firmas no las imprime', () => {
    expect(html(base, false)).not.toContain('class="firma"');
  });

  it('integrantes con columna Adh. tildada solo para los adheridos, ordenados por cargo', () => {
    const h = html({
      ...base,
      integrantes: [
        { nombre: 'Eva', apellido: 'Ruiz', cargo: 'Vocal', adherente: false },
        { nombre: 'Ana', apellido: 'Pérez', cargo: 'Presidente', credencial: 'BAA41349', adherente: true },
        { nombre: 'Luis', apellido: 'Gómez', cargo: 'Secretario', adherente: true },
      ],
    });
    expect(h).toContain('<th class="c">Adh.</th>');
    expect(h.match(/class="chk on"/g)?.length).toBe(2);
    expect(h.match(/class="chk"/g)?.length).toBe(1);
    expect(h.indexOf('Pérez')).toBeLessThan(h.indexOf('Gómez'));
    expect(h.indexOf('Gómez')).toBeLessThan(h.indexOf('Ruiz'));
    expect(h).toContain('BAA41349');
  });

  it('al cargar la ventana achica el contenido si no entra en una hoja', () => {
    const style = { setProperty: jasmine.createSpy('setProperty') };
    const win: any = {
      document: { open() {}, write() {}, close() {}, body: { scrollHeight: 1884, style } },
      focus() {}, print: jasmine.createSpy('print'), onload: null,
    };
    spyOn(window, 'open').and.returnValue(win);
    imprimirAgrupacion(base, { firmas: true, titulo: 'Ficha' });
    win.onload();
    const [prop, valor] = style.setProperty.calls.mostRecent().args;
    expect(prop).toBe('zoom');
    expect(+valor).toBeCloseTo(0.5, 2);
    expect(win.print).toHaveBeenCalled();
  });
});
