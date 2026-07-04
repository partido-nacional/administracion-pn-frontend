# Functional Specification: Fix campos condicionales que borran datos sin aviso

**Status**: Draft
**Created**: 2026-07-04

## Problem Statement

> Reporte del equipo de testing (sección Adhesiones): "Campos condicionales que
> pueden borrar datos cargados sin aviso."

El formulario de ficha de adhesión muestra/oculta campos según dos selecciones:
- **Sistema de contribución** (`sistContrib`): `Antel` → Teléfono Antel; `OCA/VISA/MASTER/EBROU`
  → Cédula del responsable; `ANUAL` → Fecha vencimiento + Fecha último pago.
- **Aporte todo al partido** (`aporteTodoAlPartido`): en `false` muestra Sector y
  campos de agrupación.

Hoy, al cambiar cualquiera de esas selecciones, el valor de los campos que dejan de
aplicar se **borra en el acto y en silencio** (`applySistContrib`/`applyAporteTodo`
setean `undefined`). En **edición** esto destruye datos ya guardados de un contacto
real ante un clic accidental en un dropdown, sin confirmación ni undo.

## Enfoque elegido: A — ocultar sin borrar; sanear al guardar

Cambiar una selección **no** toca los valores; solo cambia qué campos se muestran.
Los campos irrelevantes se limpian **recién al guardar** (submit), preservando la
intención original (no persistir datos que no aplican) sin la pérdida por toques transitorios.

## Objectives

- [ ] Cambiar una selección condicional no borra datos ya cargados.
- [ ] Volver a la selección original conserva el dato (no hay pérdida por alternar).
- [ ] Al guardar, la ficha persistida no incluye campos que no aplican al estado final (comportamiento neto igual al actual en el resultado guardado).

## Out of Scope

- Rediseño del formulario o de las reglas de visibilidad.
- Cambios de backend (el contrato de guardado no cambia).
- Diálogos de confirmación (enfoque B, descartado).

## User Stories

### US-1: No perder datos por cambiar una selección
**As a** usuario que edita una ficha de adhesión
**I want to** que cambiar el sistema de contribución (o el toggle de aporte) no borre lo que ya cargué
**So that** un clic accidental no destruya datos guardados

#### Acceptance Criteria
- AC-1: Con `sistContrib=ANUAL` y fechas cargadas, cambiar a `OCA` y volver a `ANUAL` conserva las fechas.
- AC-2: Con `aporteTodoAlPartido=false` y datos de agrupación, poner el toggle en `true` y volver a `false` conserva esos datos.
- AC-3: Al guardar con `sistContrib=OCA`, la ficha persistida no incluye Teléfono Antel ni fechas de pago (se sanean).
- AC-4: Al guardar con `aporteTodoAlPartido=true`, la ficha persistida no incluye Sector ni campos de agrupación.
- AC-5: El resultado guardado es equivalente al comportamiento previo (no se persisten campos irrelevantes).

## Business Rules

- BR-1: El saneo de campos por `sistContrib` se aplica **al guardar**, no al cambiar la selección.
- BR-2: El saneo de campos por `aporteTodoAlPartido` se aplica **al guardar**, no al togglear.

## Edge Cases

- EC-1: Alternar sistema varias veces antes de guardar → al guardar solo quedan los campos del sistema final.
- EC-2: Alta (`nueva-ficha`) y edición (`fichas-contacto`) → ambos sanean al guardar.

## Success Metrics

- Testing no reproduce pérdida de datos por cambio de campo condicional.

## Feature Dependencies

- Feature 006 (formulario compartido de adhesión) — se modifican sus reglas.
