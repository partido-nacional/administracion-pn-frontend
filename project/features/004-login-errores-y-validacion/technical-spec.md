# Technical Specification: Login — errores diferenciados y validación

**Version**: 1.0
**Status**: Draft
**Created**: 2026-07-04

## Architecture Overview

Cambio acotado a **un solo componente**: `src/app/features/auth/login.component.ts` (standalone,
template-driven con `FormsModule`). Se mantiene:

- El estado con **signals** (`loading`, `error`) — sin cambios de patrón.
- El indicador de carga textual (botón deshabilitado + "Ingresando…").
- La llamada vía `AuthService.login()` → `POST {apiUrl}/auth/login` (sin tocar el service).

Se modifica solo:
1. El handler de `error` del `subscribe`: reemplazar `e?.error?.message ?? 'Error de autenticación'`
   por una función pura `mensajeError(status: number): string` que mapea `err.status` → mensaje (BR-1).
2. El `next` (éxito): agregar `this.loading.set(false)` antes de navegar (AC-3).
3. El template: cambiar `[disabled]="loading()"` por `[disabled]="loading() || f.invalid"` usando la
   referencia de template `#f="ngForm"` que ya existe (AC-9).
4. Limpiar `error` al inicio del `submit()` (ya se hace en `:52`) — mantener (AC-8).
5. **Spinner visual** (AC-2): dentro del botón, `@if (loading()) { <span class="spinner"></span> }` junto
   al texto "Ingresando…". La clase `.spinner` y el `@keyframes spin` se agregan a `src/styles.css`
   (ícono circular con borde animado; blanco sobre el `btn-primary`).

**Sin** nuevos servicios, modelos ni dependencias. Se toca `login.component.ts` y `src/styles.css`
(clase `.spinner`). No se toca `AuthService`, `auth.interceptor`, `app.config` ni rutas.

## API Contract

> Ya existente — no se modifica. Documentado para referencia (verificado contra
> `administracion-pn-backend/AuthController.cs`, 2026-07-04).

### POST /api/auth/login
**Description**: Autentica usuario/clave y devuelve un JWT.
**Auth**: No requerida.

**Request**:
```json
{
  "usuario": "string - nombre de usuario",
  "clave": "string - contraseña en claro"
}
```

**Response (200)**:
```json
{
  "token": "string - JWT (expira en 8h)",
  "usuario": "string",
  "rol": "string"
}
```

**Error Responses**:
| Code | Forma del body | Origen | Mensaje FE (BR-1) |
|------|----------------|--------|-------------------|
| 401 | `{ message }` | `AuthController` directo | Usuario o clave inválidos |
| 0 | `HttpErrorResponse` sin respuesta | red/servidor caído/CORS | No hay conexión con el servidor. Verificá tu conexión e intentá de nuevo. |
| ≥500 | `{ status, errorCode, message, timestamp }` | `ExceptionHandlingMiddleware` | Ocurrió un error en el servidor. Intentá de nuevo más tarde. |
| otro | variable | — | No se pudo iniciar sesión. Intentá de nuevo. |

> **Decisión**: el FE decide el mensaje por `err.status`, NO por el body (el 401 no trae `errorCode` y
> los 5xx traen *"Internal server error"* en inglés). Esto desacopla la UI del formato de error del
> backend.

## Data Model & Storage

Sin cambios. La sesión sigue persistiéndose en `localStorage` bajo `admpn_auth` vía `AuthService`
(fuera de alcance). Interfaz `LoginResponse { token, usuario, rol }` — ya alineada con el backend.

## External Integrations

Ninguna nueva. Solo el backend propio (`environment.apiUrl`).

## Non-Functional Requirements

- **Performance**: sin impacto (mismo flujo de una request).
- **Security**: no exponer el `message` crudo del backend en 5xx; los textos son propios. El mapeo por
  status no filtra si el usuario existe o no más allá de lo que ya hace el 401.
- **Testing (production, ≥80% en archivos tocados)**:
  - Unit del componente (`login.component.spec.ts`, nuevo) con `AuthService` mockeado:
    - éxito → navega a `/inicio` y `loading` queda `false`.
    - error 401 / status 0 / 500 / otro → cada uno setea el mensaje correcto de BR-1 y `loading` false.
    - botón deshabilitado con form inválido; habilitado con form válido.
  - Se apoya en el runner Karma/Jasmine ya montado (feature 002) y `tsconfig.spec.json`.

## Implementation Notes

- `mensajeError(status)` como **función pura** (fácil de testear en aislamiento; opcionalmente exportarla
  o dejarla como método privado). Firma sugerida:
  ```ts
  private mensajeError(status: number): string {
    if (status === 401) return 'Usuario o clave inválidos';
    if (status === 0)   return 'No hay conexión con el servidor. Verificá tu conexión e intentá de nuevo.';
    if (status >= 500)  return 'Ocurrió un error en el servidor. Intentá de nuevo más tarde.';
    return 'No se pudo iniciar sesión. Intentá de nuevo.';
  }
  ```
- El `error` del `subscribe` es un `HttpErrorResponse`; usar `err.status`. Tipar el callback como
  `(err: HttpErrorResponse)` e importar de `@angular/common/http`.
- Template: `[disabled]="loading() || f.invalid"` — `#f="ngForm"` ya está declarado (`:19`); los inputs
  ya tienen `required` (`:22,26`), así que `f.invalid` es verdadero con campos vacíos sin cambios extra.
- Mantener el `error.set(null)` al inicio de `submit()` para AC-8.
- No introducir `alert()` ni cambios de estilo; el bloque de error del template (`:28-30`) ya sirve.

## Gotchas

- En tests, un `HttpErrorResponse` de red se construye con `{ status: 0 }`; verificar que el mapeo no
  confunda `0` con "otro".
- No romper el binding existente `[(ngModel)]`; el `#f="ngForm"` depende de que los controles tengan
  `name` (ya lo tienen: `usuario`, `clave`).
