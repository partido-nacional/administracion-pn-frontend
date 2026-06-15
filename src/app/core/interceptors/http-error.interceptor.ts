import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor central de errores HTTP. Hoy loguea y re-emite el error (los
 * componentes siguen recibiéndolo). Es el punto único para centralizar el
 * manejo de errores del backend (toasts, mapeo del errorCode/message que
 * devuelve el ExceptionHandlingMiddleware del backend, etc.) — ver backlog
 * DEBT-002. El 401 lo maneja authInterceptor (logout + redirect a /login).
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError(err => {
      if (err.status !== 401) {
        // eslint-disable-next-line no-console
        console.error(`[HTTP ${err.status}] ${req.method} ${req.url}`, err.error ?? err.message);
      }
      return throwError(() => err);
    })
  );
