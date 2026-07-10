# Feature 020 — Registro/recuperación en login + eliminar usuarios (frontend)

Espejo del backend 010.
- auth.service: register/verificarEmail/reenviarCodigo/recuperar/resetear.
- LoginComponent multi-modo (login/registro/verificar/recuperar/resetear); ?reset=<token>; 401 verificación; sin demo creds.
- Usuarios: columna Email/verificado + botón Eliminar (confirm + error último-IT/self).

## Verificación
- ng build prod + 142 tests verdes. Release coordinado con backend 010 (backend primero: agrega endpoints).
