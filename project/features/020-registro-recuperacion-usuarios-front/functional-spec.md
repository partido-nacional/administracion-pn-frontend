# Functional Specification: registro-recuperacion-usuarios-front

**Status**: Draft
**Created**: 2026-07-09

## Problem Statement

Feature espejo del backend **010**. Agrega al login: registro (usuario/clave/email) con verificación por
código, y recuperación de contraseña por email. Y a la sección Usuarios (rol IT): botón **Eliminar** +
mostrar el email/estado de verificación. (Modificar rol e inactivar ya existen.)

## Objectives

- [ ] `AuthService`: register / verificar-email / reenviar-codigo / recuperar / resetear.
- [ ] `LoginComponent` multi-modo: login, registro, verificar código, recuperar, resetear.
- [ ] Manejar el 401 "verificá tu email" del login y ofrecer verificar.
- [ ] Manejar `?reset=<token>` en la URL → abrir el modo resetear con el token.
- [ ] Usuarios: `eliminar(id)` en el service + botón Eliminar (con confirmación) + columna Email/Verificado.
- [ ] Quitar las credenciales demo precargadas (admin/admin123) del login (DEBT-004).

## Out of Scope

- Backend (feature 010, ya en develop).
- Modificar rol / inactivar (ya existen en la sección Usuarios).
- Autologin tras registro (el usuario debe verificar primero).

## User Stories

### US-1: Registro desde el login
**As a** visitante
**I want to** crear una cuenta con usuario, contraseña y email
**So that** puedo registrarme y validar mi email

#### Acceptance Criteria
- AC-1: Desde el login, un link "Crear cuenta" abre el formulario de registro (usuario, clave, email).
- AC-2: Al enviar, se llama `POST /auth/register`; en éxito se pasa al paso "verificar código" (con el usuario precargado) y un mensaje "te enviamos un código".
- AC-3: Errores (duplicado 409, validación 400) se muestran en el form sin romper.

### US-2: Verificación de email
#### Acceptance Criteria
- AC-4: El paso "verificar" pide el código; `POST /auth/verificar-email` en éxito → vuelve al login con mensaje "email verificado, ya podés ingresar".
- AC-5: Link "reenviar código" → `POST /auth/reenviar-codigo`.
- AC-6: Si el login devuelve 401 con mensaje de verificación, se ofrece ir a verificar.

### US-3: Recuperación de contraseña
#### Acceptance Criteria
- AC-7: Link "¿Olvidaste tu contraseña?" abre el paso recuperar (email); `POST /auth/recuperar` → mensaje "si el email existe, te enviamos un enlace" (siempre igual).
- AC-8: Con `?reset=<token>` en la URL, el login abre el paso resetear (token oculto/precargado) pidiendo nueva contraseña; `POST /auth/resetear` en éxito → vuelve al login con mensaje.
- AC-9: Token inválido/expirado (400) muestra el error.

### US-4: Gestión — eliminar + email
#### Acceptance Criteria
- AC-10: La grilla de Usuarios muestra Email y estado de verificación.
- AC-11: Botón "Eliminar" con confirmación → `DELETE /usuarios/{id}`; refresca la lista.
- AC-12: Errores del backend (último IT / self, 400) se muestran sin romper.

## Business Rules

- BR-1: Sin autologin tras registro (se verifica primero).
- BR-2: Los mensajes de recuperar/reenviar no revelan si el email existe (se muestra el mensaje neutro del backend).

## Edge Cases

- EC-1: Navegación entre modos (login ↔ registro ↔ verificar ↔ recuperar ↔ resetear) sin recargar.
- EC-2: `?reset=` con token vacío → modo login normal.

## Success Metrics

- Flujos registro→verificación→login y recuperación funcionan contra el backend 010; `ng build` + tests verdes.

## Feature Dependencies

- Backend 010 (en develop). Release coordinado.
- SMTP configurado en Render para que los emails lleguen (si no, el código se loguea en el backend).
