# 004 — Login: errores diferenciados y validación

**Estado**: Completada (archivada 2026-07-04) · **Tipo**: production · **Template**: full
**Verdicto de cierre**: `APPROVED` (sync consistente, 0 issues)

## Qué se construyó

Mejora del componente de login (`src/app/features/auth/login.component.ts`) en tres frentes,
**manteniendo signals**:

1. **Mensajes de error diferenciados por tipo de fallo.** Antes, cualquier error no-401 caía a un
   fallback plano *"Error de autenticación"*. Ahora se decide por `err.status`:

   | `err.status` | Mensaje |
   |---|---|
   | 401 | Usuario o clave inválidos |
   | 0 (sin conexión) | No hay conexión con el servidor. Verificá tu conexión e intentá de nuevo. |
   | ≥ 500 | Ocurrió un error en el servidor. Intentá de nuevo más tarde. |
   | otro | No se pudo iniciar sesión. Intentá de nuevo. |

2. **Validación que bloquea el submit (`TODO-010`).** El botón "Ingresar" ahora se deshabilita por
   `loading() || f.invalid` (antes solo por `loading()`), evitando envíos con usuario/clave vacíos.
   Además se resetea `loading` en el camino feliz.

3. **Spinner visual.** El indicador de carga era solo textual ("Ingresando…"); se agregó un spinner
   visual (ícono girando, clase `.spinner` en `src/styles.css`) que aparece mientras `loading()`.

## Componente tocado

- `src/app/features/auth/login.component.ts`
  - Nueva función pura `mensajeError(status: number): string` (mapeo de BR-1).
  - `error` callback tipado como `HttpErrorResponse`; decide por `err.status`, no por el body
    (el 401 y los 5xx del backend tienen formatos distintos).
  - `next` (éxito): `loading.set(false)` antes de navegar a `/inicio`.
  - Template: `[disabled]="loading() || f.invalid"` + spinner `@if (loading()) { <span class="spinner">…}`.
- `src/styles.css`
  - Clase `.spinner` + `@keyframes spin` (ícono circular animado, blanco sobre `btn-primary`).

## Decisión de diseño clave

El backend expone **dos formas de error**: el 401 del login sale directo del controller (`{ message }`)
y los 5xx pasan por el `ExceptionHandlingMiddleware` (`{ status, errorCode, message, timestamp }`, en
inglés). Por eso el FE mapea por **`err.status`** y usa textos propios en español, desacoplándose del
formato del backend (BR-2). Contrato verificado contra `administracion-pn-backend` (2026-07-04).

## Tests

- `src/app/features/auth/login.component.spec.ts` (nuevo) — 9 casos con `AuthService` mockeado:
  éxito → `/inicio` + loading false; error 401/0/500/otro → mensaje correcto + loading false;
  limpieza de error al reintentar; botón habilitado (form válido) / deshabilitado (campos vacíos);
  spinner visible solo mientras `loading()`.
- **24/24 tests verdes** (suite completa), **100% de cobertura** de `login.component.ts`.
- Runner: Karma/Jasmine + ChromeHeadless (montado en feature 002).

## Fuera de alcance

- `AuthService` / modelo `LoginResponse` (contrato ya compatible, sin cambios).
- `DEBT-004` (credenciales demo `admin/admin123`) — sigue pendiente.
- Shell, Dashboard, seguridad de sesión (`DEBT-003`).

## Referencias

- Spec funcional: `functional-spec.md` · Spec técnica: `technical-spec.md` · Tareas: `tasks.json`
- Backlog: resuelve `TODO-010` (validación bloquea submit).
