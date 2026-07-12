# Functional Specification: Agrupaciones — alta/baja de integrantes

**Status**: Draft
**Created**: 2026-07-12
**Backlog**: TODO-008 (Medium)

## Problem Statement

En Agrupaciones → tab "Por Período", la sección "Integrantes" de cada período es solo lectura: los integrantes llegan embebidos en `GET /agrupaciones-periodos` y no hay forma de agregar ni quitar integrantes desde la app. El backend ya expone `POST /api/agrupacion-integrantes` (alta) y `DELETE /api/agrupacion-integrantes/{id}` (baja). Alcance: **alta + baja** (sin edición; el backend no tiene PUT).

## Objectives

- [ ] Poder **agregar** un integrante a un período de agrupación desde el detalle expandido.
- [ ] Poder **quitar** un integrante (borrado físico) con confirmación.
- [ ] Refrescar la tabla de integrantes tras cada alta/baja.
- [ ] Reutilizar los endpoints existentes (sin cambios de backend).

## Out of Scope

- Edición de un integrante (el backend no expone PUT; se quita y se re-agrega).
- Cambios de backend / de schema.
- Validación de duplicados a nivel UI (si el backend la tiene, se muestra su error; no se replica).

## User Stories

### US-1: Agregar un integrante
**As a** usuario de secciones administrativas
**I want to** agregar un contacto como integrante de un período de agrupación
**So that** mantengo actualizada la composición de la agrupación

#### Acceptance Criteria
- AC-1: En la sección "Integrantes" del período expandido hay un botón **"Agregar integrante"**.
- AC-2: Abre un mini-form con: **buscador de contacto** (autocomplete server-side por nombre/cédula), **Cargo** (texto libre, opcional) y **Fecha de ingreso** (opcional, default hoy).
- AC-3: El **contacto es obligatorio**; sin contacto seleccionado, no se puede guardar.
- AC-4: Al guardar, se hace `POST /agrupacion-integrantes` con `{ contactoId, agrupacionPeriodoId, cargo, fechaIngreso }` y la tabla se refresca mostrando el nuevo integrante.
- AC-5: Un error del backend (ej. duplicado) se muestra (toast global) y no rompe la vista.

### US-2: Quitar un integrante
**As a** usuario
**I want to** quitar un integrante de un período
**So that** corrijo la composición

#### Acceptance Criteria
- AC-6: Cada fila de integrante tiene una acción **"Quitar"**.
- AC-7: Al clickear, aparece un `confirm()` con el nombre: "¿Quitar a {Apellido, Nombre} de esta agrupación?".
- AC-8: Al confirmar, se hace `DELETE /agrupacion-integrantes/{id}` (borrado físico) y la fila desaparece de la tabla.
- AC-9: Si se cancela el confirm, no pasa nada.

## Business Rules

- BR-1: El `agrupacionPeriodoId` del alta es el `periodoId` de la fila expandida.
- BR-2: La baja es **borrado físico** (la entidad `AgrupacionIntegrante` no tiene estado/soft-delete).
- BR-3: `FechaIngreso` por defecto = hoy si el usuario no la completa.

## Edge Cases

- EC-1: Búsqueda de contacto sin resultados → el autocomplete muestra "Sin resultados"; no se puede guardar.
- EC-2: Alta de un contacto ya integrante de ese período → se muestra el error que devuelva el backend (si valida); si no valida, queda a criterio del backend.
- EC-3: Quitar el último integrante → la sección vuelve a "Sin integrantes registrados en este período".

## Success Metrics

- Se puede componer/editar la lista de integrantes de una agrupación sin tocar la base a mano.

## Feature Dependencies

- Backend: `POST /agrupacion-integrantes`, `DELETE /agrupacion-integrantes/{id}` (existentes), `GET /contactos?q=` (autocomplete), `GET /agrupaciones-periodos` (refresco).
