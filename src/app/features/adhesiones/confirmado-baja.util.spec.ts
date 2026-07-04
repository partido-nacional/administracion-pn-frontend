import { resolverConfirmado, hoyISO } from './confirmado-baja.util';

describe('resolverConfirmado', () => {
  const HOY = '2026-07-04';

  // AC-2/AC-1: baja sin fecha previa → prellena con hoy
  it('baja (false) sin fecha previa prellena con hoy', () => {
    expect(resolverConfirmado(false, undefined, HOY)).toEqual({
      aporteConfirmado: false,
      fechaSalida: HOY,
    });
  });

  // EC-2: baja con fecha previa la conserva (editable luego)
  it('baja (false) con fecha previa la conserva', () => {
    expect(resolverConfirmado(false, '2020-01-15', HOY)).toEqual({
      aporteConfirmado: false,
      fechaSalida: '2020-01-15',
    });
  });

  // AC-4: activa limpia la fecha de salida
  it('activa (true) limpia la fecha de salida', () => {
    expect(resolverConfirmado(true, '2020-01-15', HOY)).toEqual({
      aporteConfirmado: true,
      fechaSalida: undefined,
    });
  });

  // AC-4: pendiente limpia la fecha de salida
  it('pendiente (null) limpia la fecha de salida', () => {
    expect(resolverConfirmado(null, '2020-01-15', HOY)).toEqual({
      aporteConfirmado: null,
      fechaSalida: undefined,
    });
  });

  it('hoyISO devuelve formato YYYY-MM-DD', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
