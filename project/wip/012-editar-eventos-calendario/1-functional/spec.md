# Functional Specification: Editar eventos del calendario

**Status**: Draft
**Created**: 2026-07-04

## Problem Statement

> Los eventos del calendario deben poder ser editables. Además, al no completar un
> campo, debe verse un mensaje que explique por qué falla la creación/edición (no un
> "Internal Server Error").

El calendario (dashboard) permite crear, ver y eliminar eventos, pero **no editarlos**:
el modal es `'crear' | 'ver'` y hay borrar pero ningún flujo de edición, aunque el
backend ya expone `PUT /api/calendario/eventos/{id}`. Este es el lado frontend; los
errores descriptivos del backend se resuelven en la feature backend 002.

## Objectives

- [ ] Poder editar un evento existente desde el calendario.
- [ ] Reusar el formulario de creación, precargado con los datos del evento.
- [ ] Mostrar el mensaje de error del backend si el guardado falla (crear y editar).

## Out of Scope

- Validación/robustez del backend (feature backend 002).
- Editar fecha de fin (el form actual no la expone; se mantiene igual que en alta).

## User Stories

### US-1: Editar un evento
**As a** usuario del calendario
**I want to** abrir un evento y modificar sus datos
**So that** corregir/actualizar sin tener que borrarlo y recrearlo

#### Acceptance Criteria
- AC-1: El modal de "ver" tiene un botón "Editar" que abre el form precargado con el evento.
- AC-2: El form muestra título, fecha, hora, tipo, descripción y visibilidad del evento.
- AC-3: Guardar hace `PUT /calendario/eventos/{id}` y refresca el calendario.
- AC-4: Si el backend devuelve error, se muestra su `message` en el modal (sin cerrarlo).
- AC-5: Validación de cliente (título/fecha/hora obligatorios) igual que en alta.

## Business Rules

- BR-1: La edición reutiliza el mismo formulario y las mismas validaciones de cliente que el alta.

## Edge Cases

- EC-1: Backend responde 400 con mensaje (p. ej. título faltante) → se muestra el mensaje; el modal sigue abierto.
- EC-2: Cancelar/cerrar el modal descarta los cambios (no persiste nada).

## Success Metrics

- Los eventos se pueden editar desde la UI; los errores de guardado son legibles.

## Feature Dependencies

- Backend `PUT /api/calendario/eventos/{id}` (existente) y feature backend 002 (mensajes descriptivos).
