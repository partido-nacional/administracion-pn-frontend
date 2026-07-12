# Technical Specification: Agrupaciones — alta/baja de integrantes

**Status**: Draft
**Created**: 2026-07-12

## Architecture Overview

Solo frontend, en `agrupaciones-por-periodo.component.ts`. En la sección "Integrantes" del período expandido:

1. Botón **"Agregar integrante"** que despliega un form inline (signal `agregando`), atado a la fila expandida (`expandido()` = periodoId).
2. Form inline: **autocomplete de contacto** (input + dropdown de resultados vía `ContactosService.listado({ filters:{ q } })` con `debounceTime`), **Cargo** (texto) y **Fecha de ingreso** (date, default hoy). Guardar / Cancelar.
3. Cada fila de la tabla de integrantes suma una acción **"Quitar"**.

El componente ya usa `HttpClient` directo; se agregan dos llamadas inline (POST/DELETE) para mantener el estilo del archivo. Tras alta o baja → `this.load()` (recarga los períodos; la fila expandida se mantiene porque `expandido` guarda el periodoId).

## API Contract

- `POST /api/agrupacion-integrantes` — `{ contactoId, agrupacionPeriodoId, cargo?, fechaIngreso? }` → integrante creado.
- `DELETE /api/agrupacion-integrantes/{id}` — borrado físico → 204.
- `GET /api/contactos?q=…` (vía `ContactosService.listado`) — autocomplete (top N por nombre/cédula).

## Data Model & Storage

`AgrupacionIntegrante`: `ContactoId`, `AgrupacionPeriodoId`, `Cargo?`, `FechaIngreso`. Sin cambios de schema. `IntegranteRow.id` (front) = `AgrupacionIntegrante.Id` → se usa en el DELETE.

## Error Handling

| Code | Comportamiento |
|------|----------------|
| 4xx/5xx | Toast global (feature 021); el form no se cierra en error de alta |

## Non-Functional Requirements

- Security: la vista ya está bajo rol AdminSecciones (sección Agrupaciones).
- Accesibilidad: el dropdown del autocomplete cerrable; el contacto elegido visible.
- Tests (production): unit del flujo de alta (arma el body correcto y refresca) y baja (confirm → delete → refresca); autocomplete devuelve resultados del service.

## Implementation Notes

- Autocomplete: `Subject<string>` + `debounceTime(250)` → `ContactosService.listado({ page:1, pageSize:8, filters:{ q } })`; mostrar `apellido, nombre (cédula)`.
- Estado del form: `agregando`, `qContacto`, `resultados`, `contactoSel`, `cargoNuevo`, `fechaIngresoNuevo` (default hoy en ISO).
- El form inline vive dentro del `@if (expandido() === r.periodoId)`, así que su contexto es esa fila; `agregando` alcanza (un solo período expandido a la vez).
- Reusar el patrón de combo/autocomplete del modal de venta (productos) como referencia visual.
