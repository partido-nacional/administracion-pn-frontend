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
 * Aplica el nuevo sistema de contribución. Solo cambia el campo disparador: NO borra
 * los campos condicionales (fix 009). Que un campo deje de mostrarse no significa
 * perder su valor cargado; la limpieza ocurre recién al guardar
 * (ver `sanitizarFichaParaGuardar`), para no destruir datos por un cambio transitorio.
 */
export function applySistContrib(f: FichaAdhesionDetalle, s: string): FichaAdhesionDetalle {
  return { ...f, sistContrib: s };
}

/**
 * Setea `aporteTodoAlPartido`. Solo cambia el campo disparador: NO borra los campos de
 * sector/agrupación (fix 009). La limpieza ocurre al guardar (ver `sanitizarFichaParaGuardar`).
 */
export function applyAporteTodo(f: FichaAdhesionDetalle, v: boolean): FichaAdhesionDetalle {
  return { ...f, aporteTodoAlPartido: v };
}

/**
 * Al GUARDAR: quita los campos condicionales que no aplican al estado final de la ficha
 * (BR-1/BR-2). Se aplica en el submit —no al cambiar una selección— para que alternar
 * campos condicionales no borre datos cargados sin aviso (fix 009). El resultado
 * persistido es equivalente al comportamiento previo: no se guardan campos irrelevantes.
 */
export function sanitizarFichaParaGuardar(f: FichaAdhesionDetalle): FichaAdhesionDetalle {
  const next: FichaAdhesionDetalle = { ...f };
  if (!showTelefonoAntel(next.sistContrib)) next.telefonoAntel = undefined;
  if (!showCedula(next.sistContrib)) next.cedulaResponsable = undefined;
  if (!showFechasPago(next.sistContrib)) { next.fechaVencimiento = undefined; next.fechaUltimoPago = undefined; }
  if (next.aporteTodoAlPartido) {
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
