import { imprimirContactos, ContactoPrintRow } from './imprimir-contactos';

/** Captura el HTML que el helper escribiría en la ventana de impresión, sin abrir nada. */
function capturarHtml(rows: ContactoPrintRow[], opts?: any): string {
  let written = '';
  const fakeWin: any = {
    document: { open() {}, write(h: string) { written += h; }, close() {} },
    focus() {}, print() {}, onload: null,
  };
  spyOn(window, 'open').and.returnValue(fakeWin);
  imprimirContactos(rows, opts);
  return written;
}

describe('imprimirContactos — escape XSS', () => {
  it('escapa HTML en los campos del contacto', () => {
    const html = capturarHtml([
      { id: 1, nombre: '<script>alert(1)</script>', apellido: 'Pérez', email: 'a"><img src=x onerror=alert(1)>' } as ContactoPrintRow,
    ]);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&quot;'); // la comilla del email quedó escapada
  });

  it('escapa el valor de los filtros (self-XSS)', () => {
    const html = capturarHtml(
      [{ id: 1, nombre: 'a', apellido: 'b' } as ContactoPrintRow],
      { filtros: [{ campo: 'Nombre', valor: '<img src=x onerror=alert(1)>' }] },
    );
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });

  it('escapa el badge de adhesión', () => {
    const html = capturarHtml([
      { id: 1, nombre: 'a', apellido: 'b', adhesion: '<b>x</b>' } as ContactoPrintRow,
    ]);
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
