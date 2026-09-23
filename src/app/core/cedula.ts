/**
 * Validación de la cédula de identidad uruguaya por su dígito verificador (feature 028).
 *
 * Antes el único control del formulario era `pattern ^[0-9]{7,8}$`, que acepta cualquier número:
 * una cédula mal tipeada entraba sin aviso y después nadie sabía cuál era la correcta.
 *
 * El algoritmo se verificó contra las 10.696 cédulas reales de la base: 96,9% validan, lo que
 * confirma que es el correcto. El 3,1% restante (335 contactos) está efectivamente mal cargado —
 * por eso en edición la validación sólo bloquea si el operador toca el campo.
 *
 * Está duplicado respecto del backend a propósito: acá se necesita feedback inmediato sin
 * round-trip, allá no se puede confiar en el cliente.
 */
const MULTIPLICADORES = [2, 9, 8, 7, 6, 3, 4];

/**
 * True si el dígito verificador cierra. Null, undefined, vacío o sólo espacios se consideran
 * válidos: la cédula es OPCIONAL y su ausencia no es un error de formato.
 */
export function cedulaEsValida(documento?: string | null): boolean {
  const valor = (documento ?? '').trim();
  if (valor === '') return true;
  if (!/^\d{7,8}$/.test(valor)) return false;

  // El algoritmo siempre opera sobre 7 dígitos + verificador: una cédula de 7 se completa con
  // un cero a la izquierda.
  const digitos = valor.padStart(8, '0');
  const suma = MULTIPLICADORES.reduce((acc, m, i) => acc + m * Number(digitos[i]), 0);
  const esperado = (10 - (suma % 10)) % 10;

  return esperado === Number(digitos[7]);
}
