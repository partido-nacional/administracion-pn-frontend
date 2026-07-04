import { FichaAdhesionDetalle } from '../../features/agenda/contactos.service';

/**
 * Fuente de verdad única para las constantes y reglas del formulario de ficha de
 * adhesión. Consumido por `nueva-ficha` (alta) y `fichas-contacto` (edición) para
 * evitar la duplicación de handlers/constantes entre ambos componentes.
 *
 * Las funciones `applyX` son puras: reciben una ficha y devuelven una copia con la
 * regla aplicada (o la misma referencia cuando el cambio no debe aplicarse), de modo
 * que el componente solo tiene que hacer `signal.set(applyX(...))`.
 */

export const SISTEMAS = ['Antel', 'OCA', 'VISA', 'MASTER', 'EBROU', 'ANUAL', 'Otro'];

export const DEPARTAMENTOS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
  'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
  'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres', 'Nacional'
];

export const APORTES_SEC_AGR = [
  'Agrupacion', 'SAS', 'CNJ', 'Centro Josefa Oribe', 'CEPN',
  'Comision Departamental', 'C. Cultura', 'Movimiento Afro-Nacionalista (MAN)'
];

/** Sistema `Antel` → se pide Teléfono Antel. */
export const showTelefonoAntel = (s?: string) => s === 'Antel';
/** Sistemas con tarjeta/débito → se pide Cédula del responsable. */
export const showCedula = (s?: string) => s === 'OCA' || s === 'VISA' || s === 'MASTER' || s === 'EBROU';
/** Sistema `ANUAL` → se piden Fecha Vencimiento y Fecha Último Pago. */
export const showFechasPago = (s?: string) => s === 'ANUAL';

/**
 * BR-1: aplica el nuevo sistema de contribución y limpia los campos que dejan de
 * aplicar para ese sistema.
 */
export function applySistContrib(f: FichaAdhesionDetalle, s: string): FichaAdhesionDetalle {
  const next: FichaAdhesionDetalle = { ...f, sistContrib: s };
  if (!showTelefonoAntel(s)) next.telefonoAntel = undefined;
  if (!showCedula(s)) next.cedulaResponsable = undefined;
  if (!showFechasPago(s)) { next.fechaVencimiento = undefined; next.fechaUltimoPago = undefined; }
  return next;
}

/**
 * BR-2: setea `aporteTodoAlPartido`. Si es `true`, limpia los campos de aporte a
 * sector/agrupación que dejan de aplicar.
 */
export function applyAporteTodo(f: FichaAdhesionDetalle, v: boolean): FichaAdhesionDetalle {
  const next: FichaAdhesionDetalle = { ...f, aporteTodoAlPartido: v };
  if (v) {
    next.sector = undefined;
    next.aporteSecretariaAgrupacion = undefined;
    next.aporteAgrupacion = undefined;
    next.departamentoAgrupacion = undefined;
    next.codigoAgrupacion = undefined;
  }
  return next;
}

/**
 * BR-3: cambia el estado de confirmación. Si pasa a `false` (dado de baja), se exige
 * una fecha de salida vía `promptFn`; si el usuario cancela o la fecha es inválida
 * (no `YYYY-MM-DD`), devuelve la ficha **sin cambios** (misma referencia). Cualquier
 * otro valor limpia la fecha de salida.
 */
export function applyConfirmado(
  f: FichaAdhesionDetalle,
  v: boolean | null,
  promptFn: (defaultDate: string) => string | null
): FichaAdhesionDetalle {
  if (v === false) {
    const today = new Date().toISOString().slice(0, 10);
    const fecha = promptFn(f.fechaSalida || today);
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return f;
    }
    return { ...f, aporteConfirmado: false, fechaSalida: fecha };
  }
  return { ...f, aporteConfirmado: v, fechaSalida: undefined };
}

/** Prompt por defecto (mismo comportamiento actual con `window.prompt`). */
export const defaultFechaSalidaPrompt = (defaultDate: string): string | null =>
  window.prompt('Ingrese la fecha de salida (YYYY-MM-DD):', defaultDate);
