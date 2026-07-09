# Functional Specification: quitar-exportar-agenda

**Status**: Draft
**Created**: 2026-07-08

## Problem Statement

> en agenda quita la seccion exportar, ya hay un boton csv arriba

En Agenda (`agenda-listado.component.ts`) existe la tab "Exportar", que hoy es solo un placeholder
("Exportar — proximamente") sin contenido. La exportación real ya está en el botón **📥 CSV** de la
barra superior (`exportarCsv()`). Se elimina la tab placeholder para evitar duplicación/confusión.

## Objectives

- [ ] Quitar la tab "Exportar" de Agenda (link + bloque placeholder).

## Out of Scope

- El botón **📥 CSV** superior y su método `exportarCsv()` (se conservan; es la exportación real).
- Otras tabs de Agenda (Todos, Duplicados).
- Backend.

## User Stories

### US-1: Agenda sin la tab Exportar placeholder
**As a** usuario de Agenda
**I want to** que Agenda no muestre la tab "Exportar" vacía
**So that** no hay una sección placeholder duplicando el botón CSV que ya existe arriba

#### Acceptance Criteria
- AC-1: La barra de tabs de Agenda ya no muestra "Exportar".
- AC-2: Se conservan las tabs Todos y Duplicados, funcionando igual.
- AC-3: El botón 📥 CSV superior sigue exportando (sin cambios).
- AC-4: No queda código muerto del placeholder (tipo Tab, bloque `@if tab()==='exportar'`).

## Business Rules

- BR-1: Cambio solo de UI; sin backend ni datos.

## Edge Cases

- EC-1: El default de tab sigue siendo 'todos'.

## Success Metrics

- Agenda sin la tab placeholder; el CSV sigue andando; `ng build` + tests verdes.

## Feature Dependencies

- Ninguna.
