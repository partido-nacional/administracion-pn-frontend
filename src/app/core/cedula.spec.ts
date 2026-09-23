import { cedulaEsValida } from './cedula';

/**
 * Feature 028 (bug #4): el dígito verificador no se validaba en ningún lado.
 *
 * Los casos usan cédulas REALES de la base, no inventadas: al escribir estos tests asumí que
 * `1234567` era válida y resultó que no — su DV es 1, no 7. Verificar contra datos reales evita
 * escribir una validación que rechace cédulas legítimas.
 */
describe('cedulaEsValida', () => {
  it('acepta cédulas reales válidas de 8 dígitos', () => {
    ['46790554', '34056085', '42273954', '31315173'].forEach(c =>
      expect(cedulaEsValida(c)).withContext(c).toBeTrue());
  });

  it('acepta cédulas reales válidas de 7 dígitos', () => {
    // Se completan con un cero a la izquierda antes de calcular el DV.
    ['8968868', '8497603', '6284414'].forEach(c =>
      expect(cedulaEsValida(c)).withContext(c).toBeTrue());
  });

  it('el cero a la izquierda es equivalente', () => {
    expect(cedulaEsValida('8968868')).toBe(cedulaEsValida('08968868'));
  });

  it('rechaza cédulas con el dígito verificador alterado', () => {
    ['46790555', '34056086', '42273955'].forEach(c =>
      expect(cedulaEsValida(c)).withContext(c).toBeFalse());
  });

  it('considera válida la ausencia de cédula: el campo es opcional', () => {
    expect(cedulaEsValida(undefined)).toBeTrue();
    expect(cedulaEsValida(null)).toBeTrue();
    expect(cedulaEsValida('')).toBeTrue();
    expect(cedulaEsValida('   ')).toBeTrue();
  });

  it('rechaza formatos que no son 7 u 8 dígitos', () => {
    ['12345', '123456789', '1234567a', 'abcdefgh'].forEach(c =>
      expect(cedulaEsValida(c)).withContext(c).toBeFalse());
  });
});
