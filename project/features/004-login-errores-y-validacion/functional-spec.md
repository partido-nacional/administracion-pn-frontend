# Functional Specification: Login — errores diferenciados y validación

**Status**: Draft
**Created**: 2026-07-04

## Problem Statement

El login (`src/app/features/auth/login.component.ts`) ya funciona con **signals** (`loading`, `error`)
y **spinner** (botón deshabilitado + "Ingresando…"), y muestra el motivo del `401` del backend. Esos
comportamientos se **mantienen**. Lo que falta mejorar:

1. **Manejo de error poco informativo ante fallos no-401.** Hoy el `error` handler hace
   `e?.error?.message ?? 'Error de autenticación'` (`login.component.ts:55`). Ante **sin conexión / red /
   timeout** (status 0) o **error de servidor (5xx)** cae al fallback plano *"Error de autenticación"*,
   sin distinguir la causa. El objetivo es **aclarar por qué falla** el login con mensajes diferenciados
   por tipo de fallo.
2. **Validación que no bloquea el submit (`TODO-010`).** El botón solo se deshabilita por `loading()`
   (`:31`), no por `f.invalid`: se puede enviar con usuario/clave vacíos. Además, en el camino feliz no
   se resetea `loading` (`:54-55`) — se arregla de paso.

Se mantiene el enfoque con **signals** (compatible con el backend; el contrato de datos ya es correcto)
y con **spinner**.

## Objectives

- [ ] Diferenciar el mensaje de error de login según el tipo de fallo: credenciales (401), sin conexión
      (status 0), error de servidor (5xx), y un fallback para lo demás.
- [ ] Basar la diferenciación en `err.status` (robusto), no en el body del error (inconsistente entre el
      401 del controller y los 5xx del middleware).
- [ ] El botón "Ingresar" se deshabilita cuando el formulario es inválido (usuario o clave vacíos).
- [ ] Resetear `loading` correctamente en todos los caminos (éxito y error).
- [ ] Mantener signals y spinner tal como están hoy.

## Out of Scope

- **No** se refactoriza el `AuthService` ni el modelo `LoginResponse` (contrato ya compatible con el
  backend, verificado 2026-07-04).
- **No** se quitan las credenciales demo `admin/admin123` ni el texto "Demo" — eso es `DEBT-004`, queda
  fuera de esta feature.
- **No** se toca el `Shell` ni el `Dashboard` (el ítem original los agrupaba como área, pero el alcance
  concreto es solo el login).
- **No** se agrega refresh token, expiración de JWT client-side, ni cambios de seguridad de sesión
  (`DEBT-003`).

## User Stories

### US-1: Iniciar sesión (camino feliz, sin regresión)
**As a** administrador del partido
**I want to** ingresar usuario y clave válidos y entrar al sistema
**So that** accedo al panel de administración

#### Acceptance Criteria
- AC-1: Con credenciales válidas, el login llama `POST /api/auth/login` vía `AuthService.login()` y, al
  éxito, navega a `/inicio`.
- AC-2: Mientras la request está en curso, el botón muestra el estado de carga (spinner/"Ingresando…")
  y queda deshabilitado (comportamiento actual, sin regresión).
- AC-3: El estado `loading` vuelve a `false` al terminar, tanto en éxito como en error.

### US-2: Entender por qué falla el login
**As a** administrador
**I want to** ver un mensaje que explique la causa del fallo
**So that** sé si me equivoqué de credenciales, si no hay conexión, o si el servidor tuvo un problema

#### Acceptance Criteria
- AC-4: Ante `401`, se muestra *"Usuario o clave inválidos"* (credenciales incorrectas).
- AC-5: Ante fallo de red / sin respuesta del servidor (`err.status === 0`), se muestra *"No hay conexión
  con el servidor. Verificá tu conexión e intentá de nuevo."*
- AC-6: Ante error de servidor (`err.status >= 500`), se muestra *"Ocurrió un error en el servidor.
  Intentá de nuevo más tarde."*
- AC-7: Ante cualquier otro status inesperado, se muestra un fallback *"No se pudo iniciar sesión.
  Intentá de nuevo."*
- AC-8: El mensaje de error se limpia al reintentar el submit (no queda un error viejo colgado).

### US-3: Evitar envíos inválidos
**As a** administrador
**I want to** que el botón "Ingresar" esté deshabilitado si falta usuario o clave
**So that** no disparo un login que va a fallar seguro

#### Acceptance Criteria
- AC-9: El botón "Ingresar" está deshabilitado si el formulario es inválido (usuario o clave vacíos) o
  mientras `loading` está activo.
- AC-10: Con el formulario válido y sin carga en curso, el botón está habilitado.

## Business Rules

- BR-1: **Mapeo status → mensaje** (única fuente de decisión = `err.status`):

  | `err.status` | Mensaje mostrado |
  |---|---|
  | 401 | Usuario o clave inválidos |
  | 0 | No hay conexión con el servidor. Verificá tu conexión e intentá de nuevo. |
  | ≥ 500 | Ocurrió un error en el servidor. Intentá de nuevo más tarde. |
  | otro | No se pudo iniciar sesión. Intentá de nuevo. |

- BR-2: No se muestra al usuario el `message` crudo del backend para 5xx (viene *"Internal server error"*
  en inglés desde el `ExceptionHandlingMiddleware`). Los textos son propios, en español.
- BR-3: El botón se deshabilita por `form.invalid || loading` (ambas condiciones).

## Edge Cases

- EC-1: Backend caído / sin red → `HttpErrorResponse.status === 0` → mensaje de conexión (AC-5), sin
  romper la UI, `loading` vuelve a `false`.
- EC-2: Timeout / respuesta no-JSON → cae en fallback (AC-7) salvo que el status calce en 0/5xx.
- EC-3: Doble click rápido en "Ingresar" → mientras `loading` está activo el botón está deshabilitado
  (AC-9), evitando el segundo submit.
- EC-4: Submit con Enter teniendo el form inválido → bloqueado por la misma condición de `form.invalid`.

## Success Metrics

- Ante cada tipo de fallo (401 / red / 5xx) el usuario ve el mensaje correcto (verificable por tests
  unitarios que mockean cada `err.status`).
- Cero submits con campos vacíos (botón deshabilitado).
- Sin regresión del camino feliz (login OK → `/inicio`).

## Feature Dependencies

- Backend `administracion-pn-backend` (.NET 8) — contrato de login ya verificado (2026-07-04):
  `POST /api/auth/login`, request `{ usuario, clave }`, response `{ token, usuario, rol }`, error 401
  `{ message }`. Sin cambios requeridos del lado del backend.
