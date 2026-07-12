import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marca un request para que el httpErrorInterceptor NO dispare el toast global
 * de error (el componente ya lo maneja inline). El error igual llega al caller.
 *
 * Uso: this.http.post(url, body, { context: skipErrorToast() })
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export function skipErrorToast(context: HttpContext = new HttpContext()): HttpContext {
  return context.set(SKIP_ERROR_TOAST, true);
}
