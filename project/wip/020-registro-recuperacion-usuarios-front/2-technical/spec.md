# Technical Specification: registro-recuperacion-usuarios-front

**Status**: Draft
**Created**: 2026-07-09

## Cambios por archivo

### `core/auth.service.ts`
- Nuevos métodos (POST, sin tocar la sesión salvo login):
  - `register(usuario, clave, email): Observable<{message}>` → `/auth/register`.
  - `verificarEmail(usuario, codigo)` → `/auth/verificar-email`.
  - `reenviarCodigo(email)` → `/auth/reenviar-codigo`.
  - `recuperar(email)` → `/auth/recuperar`.
  - `resetear(token, nuevaClave)` → `/auth/resetear`.
- `login` sin cambios (setea sesión).

### `features/auth/login.component.ts`
- Estado `modo = signal<'login'|'registro'|'verificar'|'recuperar'|'resetear'>('login')`.
- Formularios por modo; navegación entre modos con links; `mensaje` (ok) y `error` signals.
- En `ngOnInit`/constructor: leer `?reset=<token>` de la URL (ActivatedRoute) → si viene, `modo='resetear'` con el token.
- Registro OK → `modo='verificar'` (precargar usuario). Verificar OK → `modo='login'` + mensaje.
- Login 401 con mensaje de verificación → mostrar CTA "verificar email".
- Quitar el prefijo `usuario='admin'`, `clave='admin123'` y el texto "Demo: admin / admin123" (DEBT-004).

### `core/services/usuarios.service.ts`
- `eliminar(id): Observable<void>` → `DELETE /usuarios/{id}`.

### `core/models/usuarios.ts`
- `UsuarioDto` + `email?: string | null`, `emailVerificado?: boolean`.

### `features/usuarios/usuarios.component.ts`
- Mostrar Email + verificado en la grilla; botón **Eliminar** con `confirm()` → `svc.eliminar(id)` → recargar.
- Manejo de error (último IT / self) en la UI.

### Tests
- Adaptar/extender: `login.component.spec.ts` (modos, register/verificar/recuperar/resetear, sin demo creds),
  `usuarios.component.spec.ts` (eliminar), modelos.

## Non-Functional Requirements

- **Verificación**: `ng build --configuration production` + `npm test --watch=false --browsers=ChromeHeadless`.
- **Security**: no autologin sin verificar; mensajes neutros de recuperación; se quitan credenciales demo.
- **Release**: coordinado con el backend 010 (front no rompe el login de admin).
