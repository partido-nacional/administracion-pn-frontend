# Technical Specification: Manejo global de errores HTTP

**Status**: Draft
**Created**: 2026-07-11

## Architecture Overview

Todo el manejo se centraliza en un **ToastService** (signals) que alimenta un componente overlay **`<app-toasts>`** montado una sola vez en el shell. El **`httpErrorInterceptor`** (ya existente y registrado) se amplía para empujar un toast de error en cada respuesta ≠ 401, salvo opt-out. Los toasts de éxito los disparan los componentes vía `ToastService.success()` en el `next` de sus mutaciones. Para los listados se agrega un componente reutilizable **`<app-list-state>`** que resuelve cargando/vacío/error/listo.

Encaja con la estructura estándar (objetivo del proyecto): `core/services`, `core/models`, `core/http`, `shared/components` — nada de esto vive en los componentes de feature.

```
core/
  models/toast.ts                    → Toast, ToastTipo
  services/toast.service.ts          → estado (signal) + error()/success()/info()/dismiss()
  http/skip-error-toast.ts           → HttpContextToken + helper skipErrorToast()
  http/http-error-message.ts         → resolveErrorMessage(HttpErrorResponse): string
  interceptors/http-error.interceptor.ts  → (ampliado) empuja toast salvo opt-out
shared/components/
  toasts/toasts.component.ts         → <app-toasts> overlay (lee toast.toasts())
  list-state/list-state.component.ts → <app-list-state> loading/empty/error + <ng-content>
```

## API Contract

N/A — feature de frontend. Consume el contrato de error existente del backend: cuerpo `{ message: string }` en errores manejados (BadRequest/Conflict/NotFound); en 5xx sin body se usa fallback por status.

## Data Model & Storage

```ts
// core/models/toast.ts
export type ToastTipo = 'error' | 'success' | 'info';
export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}
```

Estado en memoria (no persiste): `ToastService.toasts = signal<Toast[]>([])`.

### ToastService (core/services/toast.service.ts)
- `readonly toasts = signal<Toast[]>([])`
- `error(mensaje: string)`, `success(mensaje: string)`, `info(mensaje: string)` → push con id incremental; auto-dismiss a los 5000ms (setTimeout → dismiss).
- `dismiss(id: number)` → filtra el toast.
- Tope opcional de visibles (ej. últimos 4) para EC-2.

### resolveErrorMessage (core/http/http-error-message.ts)
```
status 0            → "No se pudo conectar con el servidor."
error.message (str) → ese texto
400 → "Datos inválidos."   403 → "No tenés permiso para esta acción."
404 → "No encontrado."     409 → "Conflicto con el estado actual."
>=500 → "Error del servidor. Intentá de nuevo."
otro → "Ocurrió un error."
```

### Opt-out (core/http/skip-error-toast.ts)
```ts
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const skipErrorToast = () => new HttpContext().set(SKIP_ERROR_TOAST, true);
// uso: this.http.post(url, body, { context: skipErrorToast() })
```

### httpErrorInterceptor (ampliado)
```
catchError(err):
  if err.status !== 401:
    console.error(...)                      // se mantiene
    if !req.context.get(SKIP_ERROR_TOAST):
      toast.error(resolveErrorMessage(err))
  return throwError(() => err)              // el error sigue llegando al componente
```

### `<app-toasts>` (shared/components/toasts)
- Standalone; `overlay fixed` arriba-derecha; `z-index` alto.
- `@for (t of toast.toasts(); track t.id)` → tarjeta con color/ícono por `tipo`; click o botón × → `toast.dismiss(t.id)`.
- Se monta **una vez** en `shell.component.html` (junto al `<router-outlet>`). El login (fuera del shell) igual recibe toasts si más adelante se monta; por ahora alcanza con el shell (todo lo autenticado).
- Respeta `prefers-reduced-motion` en la animación de entrada.

### `<app-list-state>` (shared/components/list-state)
- Input `state: 'loading' | 'error' | 'empty' | 'ready'`; Input `emptyText`; Output `retry`.
- `loading` → spinner/skeleton; `error` → mensaje + botón "Reintentar" (emite `retry`); `empty` → `emptyText`; `ready` → `<ng-content>` (la tabla real).
- Los componentes de listado alcanzados exponen una signal `state` derivada de su carga (set 'loading' antes del GET, 'ready'/'empty' en next según total, 'error' en error) y envuelven la tabla con `<app-list-state>`.

## External Integrations

Ninguna.

## Error Handling

| Código | Comportamiento |
|--------|----------------|
| 401 | Sin toast — `authInterceptor` (logout + redirect). No se toca. |
| 0 (red) | Toast "No se pudo conectar con el servidor." |
| 400/403/404/409 | Toast con `message` del backend o fallback por status. |
| 5xx | Toast "Error del servidor. Intentá de nuevo." |
| con opt-out | Sin toast; el componente maneja inline. |

## Non-Functional Requirements

- Performance: interceptor liviano; toasts en memoria; sin polling.
- Security: nunca mostrar stack traces / detalles internos; solo `message` conocido o fallback.
- Accesibilidad: toasts con `role="status"`/`aria-live="polite"`; foco no robado; cerrable por teclado.
- Tests (production): unit de ToastService, resolveErrorMessage, interceptor (dispara / omite 401 / respeta opt-out), `<app-list-state>` (4 estados + retry). Cobertura ≥ 80% del código nuevo.

## Implementation Notes

- Reusar el patrón de otros componentes standalone del repo; CSS plano (sin librerías).
- El opt-out se aplica en los flujos que ya muestran error inline: modal de venta (`productos`), `pasar-a-local` (`adhesiones-listado`) → pasan `skipErrorToast()` para no duplicar, o se migran al toast (a decidir en build por flujo).
- Success toasts: cablear en guardar/eliminar de productos, ventas, donaciones, agrupaciones, eventos y pasar-a-local.
- `<app-list-state>` se aplica primero a las vistas con `PagedResult` (agrupaciones ×4, productos) y se extiende al resto de listados.
