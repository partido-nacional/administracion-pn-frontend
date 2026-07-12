# Feature 021 — Manejo global de errores HTTP (DEBT-002)

Notificaciones globales para errores/éxitos HTTP y estados consistentes de listado.

## Qué se construyó

**Infraestructura (core / shared):**
- `core/models/toast.ts` — `Toast`, `ToastTipo`.
- `core/services/toast.service.ts` — estado con signals (`toasts()`), `error/success/info/dismiss`, auto-descarte 5s, tope de 4 visibles.
- `core/http/http-error-message.ts` — `resolveErrorMessage()` (status 0 → red, `message` del backend, o fallback por status).
- `core/http/skip-error-toast.ts` — `SKIP_ERROR_TOAST` (HttpContextToken) + `skipErrorToast()` para el opt-out por request.
- `core/interceptors/http-error.interceptor.ts` — ampliado: dispara toast de error si status ≠ 401 y sin opt-out; mantiene `console.error` + `throwError`.
- `shared/components/toasts/` — `<app-toasts>` overlay (montado 1 vez en el shell, `aria-live`, reduced-motion).
- `shared/components/list-state/` — `<app-list-state [state] (retry)>` reutilizable (loading/error/empty/ready).

**Aplicación en features:**
- Opt-out en modales con error inline (venta, donación, ajuste de stock, agrupación, evento) para no duplicar.
- Toasts de éxito en guardar/eliminar de productos, ventas, donaciones, adhesiones, agrupaciones y eventos.
- `pasar-a-local` y borrar evento migran de `alert()` al toast global.
- `<app-list-state>` en agrupaciones "todas" con estado de error + reintentar.

## Decisión de diseño

Las tablas con **filtros de columna** (productos listar/movimientos) NO se envuelven con `<app-list-state>`: hacerlo ocultaría la fila de filtros en vacío/error (no se podría limpiar un filtro que devolvió 0). Conservan su `@empty` inline; el patrón `<app-list-state>` aplica a listados sin filtros de columna.

## Tests

+19 (ToastService, resolveErrorMessage, interceptor, `<app-toasts>`, `<app-list-state>`). Suite total: 153, build limpio.

## 401

Intacto — lo sigue manejando `authInterceptor` (logout + redirect); nunca dispara toast.
