/**
 * Lógica compartida por FichasContactoComponent y NuevaFichaComponent para el
 * campo "Confirmado" (`aporteConfirmado`) de una ficha de adhesión.
 *
 * `aporteConfirmado` es tri-estado:
 *   - `true`  → Activa
 *   - `false` → Baja / desafiliado (requiere `fechaSalida`)
 *   - `null`  → Pendiente
 */

/** Fecha de hoy en formato `YYYY-MM-DD` (para prellenar la fecha de salida). */
export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface EstadoConfirmado {
  aporteConfirmado: boolean | null;
  fechaSalida: string | undefined;
}

/**
 * Resuelve el estado de la ficha al cambiar el campo "Confirmado", sin usar
 * `window.prompt`. El resultado se aplica siempre al modelo (evita que el
 * `<select>` quede desincronizado del dato).
 *
 * - Baja (`false`): conserva la `fechaSalida` existente o la prellena con hoy;
 *   queda editable en el `<input type="date">` inline de la ficha.
 * - Activa (`true`) / Pendiente (`null`): limpia la `fechaSalida`.
 */
export function resolverConfirmado(
  valor: boolean | null,
  fechaSalidaActual: string | undefined,
  hoy: string = hoyISO()
): EstadoConfirmado {
  if (valor === false) {
    return { aporteConfirmado: false, fechaSalida: fechaSalidaActual || hoy };
  }
  return { aporteConfirmado: valor, fechaSalida: undefined };
}

/**
 * Garantiza la coherencia de la ficha antes de guardar: una ficha en Baja
 * (`aporteConfirmado === false`) siempre debe tener `fechaSalida`. Si el usuario
 * la borró del `<input type="date">` inline, se completa con hoy (mismo default
 * que prellena la UI). Muta y devuelve la misma ficha para poder encadenar.
 */
export function normalizarFechaSalida<
  T extends { aporteConfirmado: boolean | null; fechaSalida?: string }
>(ficha: T, hoy: string = hoyISO()): T {
  if (ficha.aporteConfirmado === false && !ficha.fechaSalida) {
    ficha.fechaSalida = hoy;
  }
  return ficha;
}
