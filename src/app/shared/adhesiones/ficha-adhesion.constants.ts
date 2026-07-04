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

// BR-3 (campo "Confirmado" / baja) vive en `confirmado-baja.util.ts`:
// `resolverConfirmado` (sin window.prompt, prellena fecha de salida y se edita
// inline) y `normalizarFechaSalida` (coherencia al guardar).
