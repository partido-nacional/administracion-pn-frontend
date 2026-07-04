import {
  SISTEMAS, DEPARTAMENTOS, APORTES_SEC_AGR,
  showTelefonoAntel, showCedula, showFechasPago,
  applySistContrib, applyAporteTodo, applyConfirmado,
} from './ficha-adhesion.constants';
import { FichaAdhesionDetalle } from '../../features/agenda/contactos.service';

function ficha(over: Partial<FichaAdhesionDetalle> = {}): FichaAdhesionDetalle {
  return {
    id: 1, contactoId: 1,
    aporteConfirmado: null, art46: false, departamental: false,
    aporteTodoAlPartido: true,
    ...over,
  };
}

describe('ficha-adhesion.constants — catálogos', () => {
  it('exporta las tres listas con contenido', () => {
    expect(SISTEMAS).toContain('Antel');
    expect(DEPARTAMENTOS).toContain('Montevideo');
    expect(APORTES_SEC_AGR.length).toBeGreaterThan(0);
  });
});

describe('helpers de visibilidad', () => {
  it('showTelefonoAntel solo para Antel', () => {
    expect(showTelefonoAntel('Antel')).toBeTrue();
    expect(showTelefonoAntel('OCA')).toBeFalse();
    expect(showTelefonoAntel(undefined)).toBeFalse();
  });
  it('showCedula para tarjeta/débito', () => {
    for (const s of ['OCA', 'VISA', 'MASTER', 'EBROU']) expect(showCedula(s)).toBeTrue();
    expect(showCedula('Antel')).toBeFalse();
    expect(showCedula('ANUAL')).toBeFalse();
  });
  it('showFechasPago solo para ANUAL', () => {
    expect(showFechasPago('ANUAL')).toBeTrue();
    expect(showFechasPago('Otro')).toBeFalse();
  });
});

describe('applySistContrib (BR-1)', () => {
  it('conserva teléfono Antel al elegir Antel y limpia el resto', () => {
    const f = ficha({ telefonoAntel: '099', cedulaResponsable: '123', fechaVencimiento: '2025-01-01', fechaUltimoPago: '2025-01-02' });
    const r = applySistContrib(f, 'Antel');
    expect(r.sistContrib).toBe('Antel');
    expect(r.telefonoAntel).toBe('099');
    expect(r.cedulaResponsable).toBeUndefined();
    expect(r.fechaVencimiento).toBeUndefined();
    expect(r.fechaUltimoPago).toBeUndefined();
  });
  it('conserva cédula para OCA y limpia teléfono/fechas', () => {
    const f = ficha({ telefonoAntel: '099', cedulaResponsable: '123' });
    const r = applySistContrib(f, 'OCA');
    expect(r.cedulaResponsable).toBe('123');
    expect(r.telefonoAntel).toBeUndefined();
  });
  it('conserva fechas de pago para ANUAL', () => {
    const f = ficha({ fechaVencimiento: '2025-01-01', fechaUltimoPago: '2025-01-02', telefonoAntel: '099' });
    const r = applySistContrib(f, 'ANUAL');
    expect(r.fechaVencimiento).toBe('2025-01-01');
    expect(r.fechaUltimoPago).toBe('2025-01-02');
    expect(r.telefonoAntel).toBeUndefined();
  });
  it('EC-1: alternar de sistema no deja valores fantasma', () => {
    let f = ficha();
    f = applySistContrib(f, 'Antel'); f.telefonoAntel = '099';
    f = applySistContrib(f, 'OCA');
    expect(f.telefonoAntel).toBeUndefined();
  });
  it('no muta la ficha original', () => {
    const f = ficha({ telefonoAntel: '099' });
    applySistContrib(f, 'OCA');
    expect(f.telefonoAntel).toBe('099');
  });
});

describe('applyAporteTodo (BR-2)', () => {
  it('true limpia los campos de sector/agrupación', () => {
    const f = ficha({
      aporteTodoAlPartido: false, sector: 'X', aporteSecretariaAgrupacion: 'SAS',
      aporteAgrupacion: 'A', departamentoAgrupacion: 'Montevideo', codigoAgrupacion: '9',
    });
    const r = applyAporteTodo(f, true);
    expect(r.aporteTodoAlPartido).toBeTrue();
    expect(r.sector).toBeUndefined();
    expect(r.aporteSecretariaAgrupacion).toBeUndefined();
    expect(r.aporteAgrupacion).toBeUndefined();
    expect(r.departamentoAgrupacion).toBeUndefined();
    expect(r.codigoAgrupacion).toBeUndefined();
  });
  it('false habilita (no limpia) los campos', () => {
    const f = ficha({ sector: 'X' });
    const r = applyAporteTodo(f, false);
    expect(r.aporteTodoAlPartido).toBeFalse();
    expect(r.sector).toBe('X');
  });
});

describe('applyConfirmado (BR-3)', () => {
  it('valor true limpia fechaSalida', () => {
    const f = ficha({ aporteConfirmado: false, fechaSalida: '2025-01-01' });
    const r = applyConfirmado(f, true, () => null);
    expect(r.aporteConfirmado).toBeTrue();
    expect(r.fechaSalida).toBeUndefined();
  });
  it('valor null limpia fechaSalida', () => {
    const f = ficha({ aporteConfirmado: false, fechaSalida: '2025-01-01' });
    const r = applyConfirmado(f, null, () => null);
    expect(r.aporteConfirmado).toBeNull();
    expect(r.fechaSalida).toBeUndefined();
  });
  it('false con fecha válida setea la baja', () => {
    const f = ficha();
    const r = applyConfirmado(f, false, () => '2025-06-30');
    expect(r.aporteConfirmado).toBeFalse();
    expect(r.fechaSalida).toBe('2025-06-30');
  });
  it('false con prompt cancelado devuelve la ficha sin cambios', () => {
    const f = ficha({ aporteConfirmado: true });
    const r = applyConfirmado(f, false, () => null);
    expect(r).toBe(f);
  });
  it('false con fecha inválida devuelve la ficha sin cambios', () => {
    const f = ficha({ aporteConfirmado: true });
    const r = applyConfirmado(f, false, () => '30/06/2025');
    expect(r).toBe(f);
  });
  it('pasa la fecha de salida actual (o hoy) como default al prompt', () => {
    const f = ficha({ fechaSalida: '2024-12-31' });
    const spy = jasmine.createSpy('prompt').and.returnValue('2025-06-30');
    applyConfirmado(f, false, spy);
    expect(spy).toHaveBeenCalledWith('2024-12-31');
  });
});
