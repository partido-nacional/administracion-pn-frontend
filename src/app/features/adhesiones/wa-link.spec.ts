import { waLink, mensajeVencimiento } from './wa-link';

describe('waLink', () => {
  const msg = 'hola';

  it('normaliza un celular UY (099… → 598…) y arma el link', () => {
    const link = waLink('099626036', msg);
    expect(link).toBe('https://wa.me/59899626036?text=hola');
  });

  it('quita separadores y el 0 inicial', () => {
    expect(waLink('099 626-036', msg)).toBe('https://wa.me/59899626036?text=hola');
  });

  it('respeta un número que ya viene con 598', () => {
    expect(waLink('59899626036', msg)).toBe('https://wa.me/59899626036?text=hola');
  });

  it('devuelve null sin celular', () => {
    expect(waLink(null, msg)).toBeNull();
    expect(waLink('', msg)).toBeNull();
    expect(waLink('—', msg)).toBeNull();
  });

  it('devuelve null si el número es demasiado corto', () => {
    expect(waLink('123', msg)).toBeNull();
  });

  it('URL-encodea el mensaje', () => {
    const link = waLink('099626036', 'Hola & chau ¡vence!');
    expect(link).toContain('text=Hola%20%26%20chau%20%C2%A1vence!');
  });

  it('mensajeVencimiento incluye nombre y fecha', () => {
    const m = mensajeVencimiento('Ana', '15/07/2026');
    expect(m).toContain('Ana');
    expect(m).toContain('15/07/2026');
  });
});
