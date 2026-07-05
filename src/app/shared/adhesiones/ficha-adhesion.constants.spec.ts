import {
  SISTEMAS, DEPARTAMENTOS, APORTES_SEC_AGR,
  showTelefonoAntel, showCedula, showFechasPago,
  applySistContrib, applyAporteTodo, sanitizarFichaParaGuardar,
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

// Fix 009: cambiar una selección condicional NO borra datos; solo setea el disparador.
// El clearing se movió al guardado (`sanitizarFichaParaGuardar`).

describe('applySistContrib (fix 009: preserva, no borra)', () => {
  it('cambia el sistema y conserva todos los campos condicionales cargados', () => {
    const f = ficha({ telefonoAntel: '099', cedulaResponsable: '123', fechaVencimiento: '2025-01-01', fechaUltimoPago: '2025-01-02' });
    const r = applySistContrib(f, 'OCA');
    expect(r.sistContrib).toBe('OCA');
    expect(r.telefonoAntel).toBe('099');
    expect(r.cedulaResponsable).toBe('123');
    expect(r.fechaVencimiento).toBe('2025-01-01');
    expect(r.fechaUltimoPago).toBe('2025-01-02');
  });
  it('AC-1: alternar sistema y volver conserva el dato original', () => {
    let f = ficha({ sistContrib: 'ANUAL', fechaVencimiento: '2025-01-01', fechaUltimoPago: '2025-01-02' });
    f = applySistContrib(f, 'OCA');   // se oculta pero no se borra
    f = applySistContrib(f, 'ANUAL'); // vuelve
    expect(f.fechaVencimiento).toBe('2025-01-01');
    expect(f.fechaUltimoPago).toBe('2025-01-02');
  });
  it('no muta la ficha original', () => {
    const f = ficha({ telefonoAntel: '099' });
    applySistContrib(f, 'OCA');
    expect(f.telefonoAntel).toBe('099');
  });
});

describe('applyAporteTodo (fix 009: preserva, no borra)', () => {
  it('true setea el flag pero conserva los campos de sector/agrupación', () => {
    const f = ficha({
      aporteTodoAlPartido: false, sector: 'X', aporteSecretariaAgrupacion: 'SAS',
      aporteAgrupacion: 'A', departamentoAgrupacion: 'Montevideo', codigoAgrupacion: '9',
    });
    const r = applyAporteTodo(f, true);
    expect(r.aporteTodoAlPartido).toBeTrue();
    expect(r.sector).toBe('X');
    expect(r.aporteAgrupacion).toBe('A');
    expect(r.departamentoAgrupacion).toBe('Montevideo');
    expect(r.codigoAgrupacion).toBe('9');
  });
  it('AC-2: togglear y volver conserva los datos de agrupación', () => {
    let f = ficha({ aporteTodoAlPartido: false, sector: 'X', aporteAgrupacion: 'A' });
    f = applyAporteTodo(f, true);
    f = applyAporteTodo(f, false);
    expect(f.sector).toBe('X');
    expect(f.aporteAgrupacion).toBe('A');
  });
});

describe('sanitizarFichaParaGuardar (fix 009: limpia al guardar)', () => {
  it('AC-3: con OCA quita teléfono Antel y fechas de pago, conserva cédula', () => {
    const f = ficha({ sistContrib: 'OCA', telefonoAntel: '099', cedulaResponsable: '123', fechaVencimiento: '2025-01-01', fechaUltimoPago: '2025-01-02' });
    const r = sanitizarFichaParaGuardar(f);
    expect(r.cedulaResponsable).toBe('123');
    expect(r.telefonoAntel).toBeUndefined();
    expect(r.fechaVencimiento).toBeUndefined();
    expect(r.fechaUltimoPago).toBeUndefined();
  });
  it('con Antel conserva el teléfono y quita cédula/fechas', () => {
    const f = ficha({ sistContrib: 'Antel', telefonoAntel: '099', cedulaResponsable: '123', fechaVencimiento: '2025-01-01' });
    const r = sanitizarFichaParaGuardar(f);
    expect(r.telefonoAntel).toBe('099');
    expect(r.cedulaResponsable).toBeUndefined();
    expect(r.fechaVencimiento).toBeUndefined();
  });
  it('con ANUAL conserva las fechas y quita teléfono/cédula', () => {
    const f = ficha({ sistContrib: 'ANUAL', fechaVencimiento: '2025-01-01', fechaUltimoPago: '2025-01-02', telefonoAntel: '099' });
    const r = sanitizarFichaParaGuardar(f);
    expect(r.fechaVencimiento).toBe('2025-01-01');
    expect(r.fechaUltimoPago).toBe('2025-01-02');
    expect(r.telefonoAntel).toBeUndefined();
  });
  it('AC-4: con aporteTodoAlPartido=true quita sector y campos de agrupación', () => {
    const f = ficha({
      aporteTodoAlPartido: true, sector: 'X', aporteSecretariaAgrupacion: 'SAS',
      aporteAgrupacion: 'A', departamentoAgrupacion: 'Montevideo', codigoAgrupacion: '9',
    });
    const r = sanitizarFichaParaGuardar(f);
    expect(r.sector).toBeUndefined();
    expect(r.aporteSecretariaAgrupacion).toBeUndefined();
    expect(r.aporteAgrupacion).toBeUndefined();
    expect(r.departamentoAgrupacion).toBeUndefined();
    expect(r.codigoAgrupacion).toBeUndefined();
  });
  it('con aporteTodoAlPartido=false conserva los campos de agrupación', () => {
    const f = ficha({ aporteTodoAlPartido: false, sector: 'X', aporteAgrupacion: 'A' });
    const r = sanitizarFichaParaGuardar(f);
    expect(r.sector).toBe('X');
    expect(r.aporteAgrupacion).toBe('A');
  });
  it('EC-1: tras alternar sistemas, al guardar solo quedan los campos del sistema final', () => {
    let f = ficha({ sistContrib: 'Antel', telefonoAntel: '099' });
    f = applySistContrib(f, 'ANUAL');
    f.fechaVencimiento = '2025-01-01';
    const r = sanitizarFichaParaGuardar(f);
    expect(r.fechaVencimiento).toBe('2025-01-01');
    expect(r.telefonoAntel).toBeUndefined(); // Antel ya no aplica
  });
  it('no muta la ficha original', () => {
    const f = ficha({ sistContrib: 'OCA', telefonoAntel: '099' });
    sanitizarFichaParaGuardar(f);
    expect(f.telefonoAntel).toBe('099');
  });
});

// BR-3 (campo "Confirmado" / baja) se testea en confirmado-baja.util.spec.ts.
