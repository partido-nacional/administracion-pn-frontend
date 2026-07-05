# Feature 012 — Editar eventos del calendario

**Estado**: Completada · **Tipo**: production · **Fecha**: 2026-07-04

## Qué se hizo

Los eventos del calendario (dashboard) ahora se pueden editar. Antes solo se podía
crear, ver y borrar, aunque el backend ya exponía `PUT /api/calendario/eventos/{id}`.

## Cambios

- `dashboard.component.ts`:
  - Modal con modo `'editar'` (reutiliza el form de alta); `editId` signal.
  - `abrirEditar(e)` precarga el form desde el evento (parte la ISO en fecha/hora).
  - `guardarEdicion()` hace el `PUT`, refresca en éxito y muestra `err.error.message` en fallo.
  - Botón "Editar" en el modal de ver.
- `dashboard.component.spec.ts` (nuevo): 4 tests con `HttpTestingController`.

## Cross-repo

Lado frontend del pedido "eventos editables + errores descriptivos". El lado backend
(validación + mensajes descriptivos, fin del 500) es la feature backend
`002-validacion-eventos-calendario` (PR #30). Con ambas, editar sin título muestra
"El título es obligatorio." en vez de un 500.

## Verificación

`ng build` OK · `ng test` (ChromeHeadless) → 113/113 (4 nuevos del dashboard).

## Entrega

- PR #58 → merge a `develop` (merge commit `1b673f8`).
