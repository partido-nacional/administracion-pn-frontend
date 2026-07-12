import { HttpErrorResponse } from '@angular/common/http';
import { resolveErrorMessage } from './http-error-message';

function err(status: number, body?: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body });
}

describe('resolveErrorMessage', () => {
  it('status 0 → mensaje de conexión', () => {
    expect(resolveErrorMessage(err(0))).toBe('No se pudo conectar con el servidor.');
  });

  it('usa el message del backend si viene', () => {
    expect(resolveErrorMessage(err(409, { message: 'Ya fue pasada a local.' })))
      .toBe('Ya fue pasada a local.');
  });

  it('ignora message vacío y cae al fallback por status', () => {
    expect(resolveErrorMessage(err(404, { message: '  ' }))).toBe('No encontrado.');
  });

  it('fallbacks por status', () => {
    expect(resolveErrorMessage(err(400))).toBe('Datos inválidos.');
    expect(resolveErrorMessage(err(403))).toBe('No tenés permiso para esta acción.');
    expect(resolveErrorMessage(err(409))).toBe('Conflicto con el estado actual.');
    expect(resolveErrorMessage(err(500))).toBe('Error del servidor. Intentá de nuevo.');
    expect(resolveErrorMessage(err(418))).toBe('Ocurrió un error.');
  });

  it('body no-JSON (string) → fallback por status', () => {
    expect(resolveErrorMessage(err(500, 'Internal Server Error'))).toBe('Error del servidor. Intentá de nuevo.');
  });
});
