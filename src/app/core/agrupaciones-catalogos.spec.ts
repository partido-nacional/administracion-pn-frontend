import { CARGOS_INTEGRANTE, CLASIFICACIONES_AGRUPACION, FORMAS_AGRUPACION, SOLICITA_AGRUPACION, opcionesConActual } from './agrupaciones-catalogos';

describe('agrupaciones-catalogos', () => {
  it('Clasificación tiene las 5 opciones en orden', () => {
    expect(CLASIFICACIONES_AGRUPACION).toEqual([
      'No tiene', 'Nueva', 'Vieja sin acta electoral', 'Vieja con acta electoral', 'Reconocida en este período',
    ]);
  });

  it('Solicita tiene las 4 opciones en orden', () => {
    expect(SOLICITA_AGRUPACION).toEqual(['Ampliar Sublemas', 'Reconocimiento', 'Modifica Autoridades', 'Cambio de cargo']);
  });

  it('Cargo de integrante tiene las 8 opciones en orden', () => {
    expect(CARGOS_INTEGRANTE).toEqual([
      'Presidente', 'Vicepresidente', 'Tesorero', 'Sec. General', 'Vocal', 'Secretario', 'Protesorero', 'Prosecretario',
    ]);
  });

  it('Forma de Representación / Actuación: Indistinta y Conjunta', () => {
    expect(FORMAS_AGRUPACION).toEqual(['Indistinta', 'Conjunta']);
  });

  it('opcionesConActual devuelve la lista tal cual si el valor está o viene vacío', () => {
    expect(opcionesConActual(SOLICITA_AGRUPACION, 'Reconocimiento')).toBe(SOLICITA_AGRUPACION);
    expect(opcionesConActual(SOLICITA_AGRUPACION, '')).toBe(SOLICITA_AGRUPACION);
    expect(opcionesConActual(SOLICITA_AGRUPACION, null)).toBe(SOLICITA_AGRUPACION);
  });

  it('opcionesConActual agrega al final un valor viejo que no está en la lista', () => {
    expect(opcionesConActual(CLASIFICACIONES_AGRUPACION, 'N')).toEqual([...CLASIFICACIONES_AGRUPACION, 'N']);
  });
});
