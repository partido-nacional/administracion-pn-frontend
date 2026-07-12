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
