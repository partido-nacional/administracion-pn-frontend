/**
 * Los 19 departamentos de Uruguay (Title Case con acentos), fuente única para los
 * dropdowns de filtro por departamento. El backend compara case-insensitive, así que
 * el casing acá es solo de presentación. Reemplaza las listas hardcodeadas dispersas
 * (parte de DEBT-007).
 */
export const DEPARTAMENTOS: readonly string[] = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
  'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
  'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres',
];

const ACENTOS = 'áàäâãéèëêíìïîóòöôõúùüû';
const PLANAS  = 'aaaaaeeeeiiiiooooouuuu';

/**
 * Normaliza un departamento para comparar en el cliente (feature 030): trim + minúsculas +
 * sin tildes, preservando la ñ. Misma lógica que TextNorm del backend + Trim, para que un
 * filtro client-side (Convencionales) se comporte igual que los server-side.
 */
export function normDepto(s: string | null | undefined): string {
  return [...(s ?? '').trim().toLowerCase()]
    .map(ch => { const i = ACENTOS.indexOf(ch); return i >= 0 ? PLANAS[i] : ch; })
    .join('');
}

/** Lista canónica + 'Nacional' (organismos y agrupaciones de alcance nacional). Feature 031. */
export const DEPARTAMENTOS_CON_NACIONAL: readonly string[] = [...DEPARTAMENTOS, 'Nacional'];

/**
 * Forma canónica de un departamento ("PAYSANDÚ" / "Paysandu" → "Paysandú"), o '' si no se
 * reconoce. Misma regla que DepartamentoCanonico del backend (feature 034).
 */
export function canonDepto(valor: string | null | undefined): string {
  const n = normDepto(valor);
  return n ? DEPARTAMENTOS_CON_NACIONAL.find(d => normDepto(d) === n) ?? '' : '';
}

/**
 * Opciones de un <select> de departamento en un formulario de edición: la lista + el valor
 * guardado si no está en ella (una letra de serie "C", "ARGENTINA"), para mostrarlo en vez de
 * dejar el select en blanco y perderlo al guardar.
 */
export function opcionesDepto(lista: readonly string[], actual: string | null | undefined): readonly string[] {
  return actual && !lista.includes(actual) ? [...lista, actual] : lista;
}
