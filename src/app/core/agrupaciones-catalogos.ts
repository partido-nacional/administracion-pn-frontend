/**
 * Opciones fijas de los campos Clasificación y Solicita de una agrupación. El backend los
 * guarda como texto libre; los datos migrados del sistema viejo traen códigos ("N", "C",
 * "T"...) o textos largos que no están en estas listas, por eso los formularios de edición
 * usan opcionesConActual para no perderlos al guardar.
 */
export const CLASIFICACIONES_AGRUPACION: readonly string[] = [
  'No tiene',
  'Nueva',
  'Vieja sin acta electoral',
  'Vieja con acta electoral',
  'Reconocida en este período',
];

export const SOLICITA_AGRUPACION: readonly string[] = [
  'Ampliar Sublemas',
  'Reconocimiento',
  'Modifica Autoridades',
  'Cambio de cargo',
];

/**
 * Cargo de un integrante (alta de agrupación, Agrupaciones por Período) y rol de una autoridad
 * en las fichas web, que al promover pasa a ser el cargo del integrante. Los cargados antes son
 * texto libre ("Secretario General", "Tesorera"...): editar un rol usa opcionesConActual.
 */
export const CARGOS_INTEGRANTE: readonly string[] = [
  'Presidente',
  'Vicepresidente',
  'Tesorero',
  'Sec. General',
  'Vocal',
  'Secretario',
  'Protesorero',
  'Prosecretario',
];

/** Forma de Representación y Forma de Actuación (desplegables independientes, mismas opciones). */
export const FORMAS_AGRUPACION: readonly string[] = ['Indistinta', 'Conjunta'];

/**
 * Opciones de un <select> en un formulario de edición: la lista + el valor guardado si no
 * está en ella, para mostrarlo en vez de dejar el select en blanco y perderlo al guardar.
 * Misma regla que opcionesDepto.
 */
export function opcionesConActual(lista: readonly string[], actual: string | null | undefined): readonly string[] {
  return actual && !lista.includes(actual) ? [...lista, actual] : lista;
}
