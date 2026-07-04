# Functional Specification: Ficha Adhesión — Formulario y Handlers Compartidos

**Status**: Draft
**Created**: 2026-07-04

## Problem Statement

> En la sección de adhesiones hay **lógica de handlers duplicada entre dos componentes**:
> `nueva-ficha.component.ts` (crear ficha) y `fichas-contacto.component.ts` (editar ficha
> en fila expandible). Ambos repiten las mismas constantes de catálogo, los mismos helpers
> de visibilidad condicional y los mismos handlers de cambio, además del bloque de markup
> del formulario de ficha de adhesión.

Duplicación observada hoy (verificada en código):

- **Constantes**: `SISTEMAS`, `DEPARTAMENTOS`, `APORTES_SEC_AGR` — declaradas inline en `fichas-contacto` y como consts de módulo en `nueva-ficha`, con **los mismos valores**.
- **Helpers de visibilidad**: `showTelefonoAntel(s)`, `showCedula(s)`, `showFechasPago(s)` — idénticos.
- **Handlers de cambio**: `onSistContribChange`, `onAporteTodoChange`, `onConfirmadoChange` — misma lógica; sólo difieren en que uno opera sobre el signal `detalle()` y el otro sobre `ficha()`.
- **Markup del formulario**: el bloque de campos condicionales (sist. contribución → Antel/OCA/ANUAL; aporte-todo-al-partido → sector/agrupación; confirmado → fecha de salida) está duplicado casi textualmente entre ambos templates.

Riesgo actual: cualquier cambio de regla (p. ej. un nuevo sistema de contribución, o un campo condicional nuevo) hay que hacerlo **dos veces**, y ya hay divergencias latentes (constantes inline vs. de módulo). Espejo parcial de **DEBT-007**.

## Objectives

- [ ] Eliminar la duplicación de handlers y constantes entre `nueva-ficha` y `fichas-contacto`, con una única fuente de verdad.
- [ ] Eliminar (o reducir a un único origen) la duplicación del markup del formulario de ficha.
- [ ] **No cambiar el comportamiento observable** de alta ni de edición de fichas (misma UI, mismos campos condicionales, mismo guardado).
- [ ] Dejar el código de adhesiones alineado con el estándar objetivo (`shared/` para UI reutilizable; ver CLAUDE.md).

## Out of Scope

- Reemplazar los catálogos hardcodeados por el endpoint `/api/catalogos/*` (eso es DEBT-007 completo; aquí sólo se **unifican** las listas hardcodeadas en un único lugar, no se cablea el backend).
- El **alta rápida de adhesión del listado** (`adhesiones-listado.component.ts`) y su lista divergente de Sector/Sist.Contrib. — queda para DEBT-007 completo. Este refactor toca **solo** `nueva-ficha.component.ts` y `fichas-contacto.component.ts`.
- Cambiar el contrato del backend de fichas (`getLocal`/`updateLocal`/`createLocal`).
- Rediseñar visualmente el formulario o agregar/quitar campos.
- Migrar el resto de adhesiones (listado, sync nube) a la estructura estándar.
- Reemplazar el `window.prompt` de fecha de salida por un modal (se preserva el comportamiento actual).

## User Stories

### US-1: Mantener reglas de ficha en un solo lugar
**As a** desarrollador del sistema
**I want to** que las constantes, helpers de visibilidad y handlers de cambio de la ficha de adhesión vivan en una única pieza compartida
**So that** un cambio de regla (nuevo sistema de contribución, nuevo campo condicional) se haga una sola vez y no diverja entre alta y edición.

#### Acceptance Criteria
- AC-1: `SISTEMAS`, `DEPARTAMENTOS`, `APORTES_SEC_AGR` existen en un único módulo importado por ambos componentes (o encapsulados en la pieza compartida).
- AC-2: `showTelefonoAntel`/`showCedula`/`showFechasPago` y `onSistContribChange`/`onAporteTodoChange`/`onConfirmadoChange` existen una sola vez.
- AC-3: No queda ninguna copia de esas constantes/handlers en `nueva-ficha.component.ts` ni en `fichas-contacto.component.ts`.

### US-2: Preservar el alta de ficha
**As a** usuario de adhesiones
**I want to** crear una ficha nueva exactamente como hoy
**So that** el refactor no rompe mi flujo de trabajo.

#### Acceptance Criteria
- AC-4: El formulario de "Nueva Ficha" muestra los mismos campos y campos condicionales que hoy.
- AC-5: Al guardar, se llama `createLocal(f)` con el mismo payload y se navega de vuelta al listado de fichas.
- AC-6: Los defaults al abrir el alta (fecha de sistema = hoy, aporteTodoAlPartido = true, cédula/teléfono precargados del contacto, departamento inferido) se mantienen.

### US-3: Preservar la edición de ficha
**As a** usuario de adhesiones
**I want to** editar una ficha existente en la fila expandible exactamente como hoy
**So that** el refactor no rompe la edición.

#### Acceptance Criteria
- AC-7: La fila expandible muestra los mismos campos condicionales; el toggle Editar/Cancelar/Guardar funciona igual.
- AC-8: "Cancelar" revierte a los valores originales; "Guardar" llama `updateLocal(f)` y recarga el listado de fichas.
- AC-9: La normalización de fechas (recorte a `YYYY-MM-DD`) al abrir el detalle se mantiene.

## Business Rules

- BR-1: Sistema de contribución `Antel` → muestra Teléfono Antel; `OCA/VISA/MASTER/EBROU` → muestra Cédula responsable; `ANUAL` → muestra Fecha Vencimiento + Fecha Último Pago. Al cambiar de sistema, los campos que dejan de aplicar se limpian a `undefined`.
- BR-2: `aporteTodoAlPartido = true` limpia sector/aporteSecretariaAgrupacion/aporteAgrupacion/departamentoAgrupacion/codigoAgrupacion; `false` los habilita.
- BR-3: `aporteConfirmado = false` (Dado de baja) exige capturar fecha de salida (hoy vía `window.prompt`, validada `YYYY-MM-DD`); si el usuario cancela o la fecha es inválida, el cambio no se aplica. Otro valor limpia `fechaSalida`.

## Edge Cases

- EC-1: Cambiar sistema de contribución varias veces no debe dejar campos "fantasma" con valores viejos (se limpian).
- EC-2: En edición, cancelar tras varios cambios debe restaurar el snapshot original completo.
- EC-3: Alta con contacto cuyo `departamento` no está en `DEPARTAMENTOS` → `departamentoAgrupacion` queda `undefined` (no rompe).

## Success Metrics

- Cero duplicación de las constantes/handlers listados (grep no encuentra copias en ambos componentes).
- `npm run build` y `npm test` en verde; comportamiento de alta/edición idéntico verificado manualmente.
- Reducción neta de líneas en los dos componentes de adhesiones.

## Feature Dependencies

- Ninguna dura. Relacionada con **DEBT-007** (unificación previa al cableado del endpoint de catálogos) y con **DEBT-011** (estructura estándar `shared/`).
