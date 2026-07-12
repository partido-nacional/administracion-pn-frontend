import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { resolveErrorMessage } from '../http/http-error-message';
import { SKIP_ERROR_TOAST } from '../http/skip-error-toast';

/**
 * Interceptor central de errores HTTP. Loguea, dispara el toast global de error
 * (salvo 401 o opt-out del request) y re-emite el error para que el componente lo
 * siga recibiendo. El 401 lo maneja authInterceptor (logout + redirect). DEBT-002.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError(err => {
      if (err.status !== 401) {
        // eslint-disable-next-line no-console
        console.error(`[HTTP ${err.status}] ${req.method} ${req.url}`, err.error ?? err.message);
        if (!req.context.get(SKIP_ERROR_TOAST)) {
          toast.error(resolveErrorMessage(err));
        }
      }
      return throwError(() => err);
    })
  );
};
