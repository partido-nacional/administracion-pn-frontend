# Technical Specification: quitar-exportar-agenda

**Status**: Draft
**Created**: 2026-07-08

## Architecture Overview

Cambio mínimo de UI en un componente. Sin backend, sin service, sin modelos.

## Cambios

### `features/agenda/agenda-listado.component.ts`
- `type Tab`: quitar `'exportar'` (queda `'todos' | 'duplicados'`).
- Template: quitar el `<a class="tab">Exportar</a>` y el bloque `@if (tab() === 'exportar') { ... }`
  (placeholder "proximamente").
- **Conservar**: el botón `📥 CSV` superior, el método `exportarCsv()` y el import `exportarCSV`.

### Tests
- No hay specs que referencien la tab 'exportar' (verificar en build); adaptar si aparece.

## Non-Functional Requirements

- **Verificación**: `ng build --configuration production` + `npm test --watch=false --browsers=ChromeHeadless`.
- **Security**: sin cambios.
