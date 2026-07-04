# Technical Specification: Ocultar sección Débitos

**Status**: Draft
**Created**: 2026-07-04

## Architecture Overview

> Cambio puramente de UI en el shell. El ítem de navegación "Débitos" vive en
> `src/app/layout/shell.component.html` como un `<a routerLink="/debitos" ...>`.
> Se oculta comentando ese bloque de markup para máxima reversibilidad. No se
> toca `app.routes.ts` (alcance "solo menú" — decisión funcional), ni el
> componente `features/debitos/`.

## Archivos afectados

- `src/app/layout/shell.component.html` — bloque `<a routerLink="/debitos">…</a>`
  (aprox. líneas 103–111). Comentar el bloque con `<!-- … -->`.

## API Contract

> N/A — no hay cambios de API.

## Data Model & Storage

> N/A — no hay cambios de datos ni almacenamiento.

## External Integrations

> N/A.

## Error Handling

> N/A — cambio estático de markup, sin nuevos caminos de error.

## Non-Functional Requirements

- Performance: sin impacto.
- Security: sin impacto (la ruta sigue existiendo; no es un control de acceso).
- Reversibilidad: restaurable descomentando un único bloque; dejar un comentario
  `<!-- Débitos oculto temporalmente (feature 007) -->` para trazabilidad.
