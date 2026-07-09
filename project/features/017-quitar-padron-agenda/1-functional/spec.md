# Functional Specification: quitar-padron-agenda

**Status**: Draft
**Created**: 2026-07-08

## Problem Statement

> quita del front la pestaña Padron Electoral en Agenda, ya la tenemos en agrupaciones

En Agenda (`agenda-listado.component.ts`) existe la tab "Padron Electoral", que hoy es solo un
placeholder ("Padron Electoral — proximamente") sin contenido real. El Padrón Electoral funcional vive
en Agrupaciones. Se elimina la tab de Agenda para evitar duplicación/confusión.

## Objectives

- [ ] Quitar la tab "Padron Electoral" de la vista Agenda (link + bloque placeholder).

## Out of Scope

- El Padrón Electoral de **Agrupaciones** (se conserva; es el funcional).
- Backend (la tab de Agenda no tiene endpoint propio; es un placeholder).
- Otras tabs de Agenda (Todos, Duplicados, Exportar).

## User Stories

### US-1: Agenda sin la tab Padrón placeholder
**As a** usuario de Agenda
**I want to** que Agenda no muestre la tab "Padron Electoral" vacía
**So that** no hay una sección placeholder duplicando lo que ya está en Agrupaciones

#### Acceptance Criteria
- AC-1: La barra de tabs de Agenda ya no muestra "Padron Electoral".
- AC-2: Se conservan las tabs Todos, Duplicados y Exportar, funcionando igual.
- AC-3: No queda código muerto del placeholder (tipo Tab, bloque `@if tab()==='padron'`).

## Business Rules

- BR-1: Cambio solo de UI; sin backend ni datos.

## Edge Cases

- EC-1: Si la tab activa fuese 'padron' (no persistida), el default sigue siendo 'todos'.

## Success Metrics

- Agenda sin la tab placeholder; `ng build` + tests verdes.

## Feature Dependencies

- Ninguna.
