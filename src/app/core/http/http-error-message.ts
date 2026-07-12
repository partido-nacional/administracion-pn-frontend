import { HttpErrorResponse } from '@angular/common/http';

/**
 * Deriva un mensaje presentable a partir de un HttpErrorResponse:
 * conexión caída → mensaje de red; si el backend mandó `message`, ese texto;
 * en su defecto, un fallback por status. Nunca expone stack traces (AC-3).
 */
export function resolveErrorMessage(err: HttpErrorResponse): string {
  if (err.status === 0) return 'No se pudo conectar con el servidor.';

  const backend = err.error?.message;
  if (typeof backend === 'string' && backend.trim()) return backend.trim();

  switch (err.status) {
    case 400: return 'Datos inválidos.';
    case 403: return 'No tenés permiso para esta acción.';
    case 404: return 'No encontrado.';
    case 409: return 'Conflicto con el estado actual.';
    default: return err.status >= 500
      ? 'Error del servidor. Intentá de nuevo.'
      : 'Ocurrió un error.';
  }
}
