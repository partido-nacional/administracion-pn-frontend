# Technical Specification: Editar eventos del calendario

**Status**: Draft
**Created**: 2026-07-04

## Architecture Overview

Se agrega un modo `'editar'` al modal de eventos del dashboard, reutilizando el
formulario y el markup del modo `'crear'`. La edición llama al `PUT` existente y
muestra el `message` de error del backend, igual que `guardarNuevo`.

## Archivos afectados

- `src/app/features/dashboard/dashboard.component.ts`
- **Nuevo** `src/app/features/dashboard/dashboard.component.spec.ts`

## Cambios en el componente

- `modal = signal<'crear' | 'editar' | 'ver' | null>(null)` (+ `'editar'`).
- Nuevo `editId = signal<number | null>(null)` para el id en edición.
- `abrirEditar(e)`: precarga `form` desde el evento (parte la ISO en fecha/hora con
  `slice(0,10)` / `slice(11,16)`), guarda `editId` y abre el modal en `'editar'`.
- `guardarEdicion()`: valida en cliente (título/fecha/hora), hace
  `PUT /calendario/eventos/{id}` con el mismo body que el alta, refresca en éxito y
  setea `modalError` con `err.error.message` en fallo.
- `cerrarModal()` limpia también `editId`.

## Cambios en el template

- El modal de creación pasa a `@if (modal() === 'crear' || modal() === 'editar')`;
  título dinámico ("Editar evento" / "Nuevo evento") y el botón Guardar despacha
  `guardarEdicion()` o `guardarNuevo()` según el modo.
- El modal de "ver" suma un botón **Editar** → `abrirEditar(eventoSel()!)`.

## API Contract

Usa el endpoint existente `PUT /api/calendario/eventos/{id}` con el body
`{ titulo, fechaInicio, fechaFin, descripcion, tipo, creadorNombre, esPublico }`
(igual que el POST de alta). Sin cambios de contrato.

## Error Handling

`guardarEdicion` replica el patrón de `guardarNuevo`: `modalError.set(err?.error?.message
|| 'No se pudo guardar el evento.')`. Con la feature backend 002, el `message` es
descriptivo (p. ej. "El título es obligatorio.").

## Non-Functional Requirements

- Sin impacto de performance.
- Testing (production): `dashboard.component.spec.ts` con `HttpTestingController` —
  prellenado del form, PUT correcto, cierre en éxito, mensaje de error del backend, y
  validación de cliente. Verificación: `ng build` + `ng test`.
