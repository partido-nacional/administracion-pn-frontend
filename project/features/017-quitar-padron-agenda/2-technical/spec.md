# Technical Specification: quitar-padron-agenda

**Status**: Draft
**Created**: 2026-07-08

## Architecture Overview

Cambio mínimo de UI en un componente. Sin backend, sin service, sin modelos.

## Cambios

### `features/agenda/agenda-listado.component.ts`
- `type Tab`: quitar `'padron'` (queda `'todos' | 'duplicados' | 'exportar'`).
- Template: quitar el `<a class="tab">Padron Electoral</a>` y el bloque `@if (tab() === 'padron') { ... }`
  (placeholder "proximamente").

### Tests
- Si algún spec de `agenda-listado` referenciara la tab padron, adaptarlo (no hay specs que la mencionen
  hoy — verificar en build).

## Data Model & Storage

Sin cambios.

## Non-Functional Requirements

- **Verificación**: `ng build --configuration production` + `npm test --watch=false --browsers=ChromeHeadless`.
- **Security**: sin cambios (misma ruta/guards de Agenda).
