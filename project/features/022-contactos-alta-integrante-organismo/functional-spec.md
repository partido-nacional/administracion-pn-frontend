# Functional Specification: Contactos — alta de integrante de organismo

**Status**: Draft
**Created**: 2026-07-12

## Problem Statement

En la grilla de Contactos, los que NO son integrantes de organismo tienen el botón "Int. Organismo" deshabilitado; debe reemplazarse por un botón "Agregar integrante organismo" que lleve a una pantalla de alta. Los que SÍ tienen fichas entran a la grilla de integrantes, donde debe haber arriba un botón "Nuevo integrante organismo" (un contacto puede ser integrante de distintos organismos en distintas fechas). El botón de alta se deshabilita si el contacto ya tiene una ficha **activa**. Además, la acción "Eliminar" de la grilla se renombra a **"Finalizar"** y pasa a poner fecha fin.

## Objectives

- [ ] En la grilla de contactos, reemplazar el botón deshabilitado por "Agregar integrante organismo" (→ pantalla de alta) cuando el contacto **no tiene ninguna ficha**.
- [ ] Un contacto con **cualquier** ficha (activa o finalizada) mantiene el botón "Int. Organismo" → grilla de integrantes.
- [ ] En la grilla de integrantes, agregar botón "Nuevo integrante organismo", **deshabilitado si existe alguna ficha activa**.
- [ ] Pantalla de alta de integrante de organismo (form → crea la ficha).
- [ ] Renombrar "Eliminar" → "Finalizar": pone `FechaFin = hoy` + `Activo = false`, sin ocultar la fila.
- [ ] La grilla de integrantes muestra **todas** las fichas (activas y finalizadas), distinguiéndolas.
- [ ] El backend valida la regla (409 si ya hay una ficha activa).

## Out of Scope

- Edición de fichas de integrante (ya existe `PUT`; no se toca en esta feature).
- Cambios de schema (se usan `Activo` y `FechaFin` existentes).
- Reasignación/merge de organismos, catálogos de organismos/sectores (se consumen los existentes).

## Business Rules

- BR-1: **Ficha activa** = `Activo == true`. Un contacto puede tener **a lo sumo una** ficha activa a la vez.
- BR-2: El botón de alta ("Agregar" o "Nuevo") se habilita **solo si el contacto no tiene ninguna ficha activa**. (No se mira `FechaFin` para la regla.)
- BR-3: "Finalizar" setea `FechaFin = hoy` y `Activo = false`. Idempotente: sobre una ya finalizada no cambia nada relevante.
- BR-4: "Es integrante de organismo" (para el botón de la grilla de contactos) = tiene **≥1 ficha** (activa o no). Sin ninguna ficha → "Agregar".
- BR-5: La grilla de integrantes muestra **todas** las fichas del contacto (activas y finalizadas).

## User Stories

### US-1: Alta directa para contacto sin fichas
**As a** usuario de secciones administrativas
**I want to** agregar una ficha de integrante de organismo a un contacto que no tiene ninguna
**So that** registro su pertenencia a un organismo sin pasos extra

#### Acceptance Criteria
- AC-1: En la grilla de contactos, un contacto **sin ninguna ficha** muestra el botón "Agregar integrante organismo" (no un botón deshabilitado).
- AC-2: Al clickearlo, se abre la pantalla de alta con el contacto precargado.
- AC-3: Al guardar, se crea la ficha (activa) y se vuelve a la grilla de integrantes del contacto.

### US-2: Grilla con historial y alta de nueva ficha
**As a** usuario
**I want to** ver todas las fichas del contacto y crear una nueva cuando corresponde
**So that** gestiono su historial de organismos

#### Acceptance Criteria
- AC-4: Un contacto con **cualquier** ficha muestra "Int. Organismo" → grilla (aunque todas estén finalizadas).
- AC-5: La grilla lista **todas** las fichas (activas y finalizadas), indicando su estado (p. ej. columna Estado o fecha fin).
- AC-6: Arriba de la grilla hay un botón "Nuevo integrante organismo".
- AC-7: El botón "Nuevo" está **deshabilitado si el contacto tiene alguna ficha activa** (con tooltip explicando por qué), y habilitado si no.

### US-3: Finalizar una ficha
**As a** usuario
**I want to** finalizar una ficha vigente
**So that** cierro esa membresía y puedo dar de alta otra

#### Acceptance Criteria
- AC-8: La acción por fila se llama "Finalizar" (antes "Eliminar"), y solo aplica a fichas activas.
- AC-9: Al finalizar, la ficha queda con `FechaFin = hoy` y `Activo = false`; **sigue visible** en la grilla como finalizada.
- AC-10: Tras finalizar la única ficha activa, el botón "Nuevo" queda habilitado.

### US-4: Validación de la regla en el backend
**As a** sistema
**I want to** rechazar el alta si ya hay una ficha activa
**So that** la regla no se saltea llamando la API directo

#### Acceptance Criteria
- AC-11: `POST` de una nueva ficha cuando el contacto ya tiene una activa → **409** con `{ message }`.
- AC-12: El front muestra ese error (toast/estado) si ocurre.

## Edge Cases

- EC-1: Contacto con solo fichas finalizadas → "Int. Organismo" habilitado; en la grilla, "Nuevo" habilitado.
- EC-2: Finalizar una ficha ya finalizada → sin efecto (idempotente); no rompe.
- EC-3: Fichas legacy con `Activo=false` y `FechaFin=null` (borrados viejos) → cuentan como no-activas (no bloquean), se muestran como finalizadas.
- EC-4: Carrera: dos altas casi simultáneas → el backend (409) garantiza una sola activa.

## Success Metrics

- Un contacto nunca tiene 2 fichas activas a la vez.
- El historial de organismos de un contacto es visible en la grilla.
- No hay botones "muertos" (deshabilitados sin alternativa) para el alta.

## Feature Dependencies

- Backend: `POST /organismos/integrantes` (existe) + validación 409 · ajuste de "Finalizar" (FechaFin) · GET de integrantes sin filtrar `Activo` + exponer `activo` · gate del botón de contactos por "≥1 ficha".
- Catálogos de Organismos y Partido-Sector (existentes) para el form de alta.
