# Functional Specification: quitar-posibles-duplicados-adhesiones

**Status**: Draft
**Created**: 2026-07-09

## Problem Statement

> en adhesiones, quitemos "posibles duplicados". Entiendo que es un cambio solo front no?

En Adhesiones (tab "Locales") hay una stat-card "Posibles Duplicados" (`stats().duplicados`, con la
leyenda "Requiere revision"). Se quita. Cross-repo por decisión: además se limpia el cómputo en el
backend (feature 009) para no dejar cálculo muerto.

## Objectives

- [ ] Quitar la stat-card "Posibles Duplicados" de la tab Locales de Adhesiones.
- [ ] Quitar el campo `duplicados` del `StatsDto` del front (deja de leerse).

## Out of Scope

- Otras stats (Adhesiones Locales, Web, Total) y las demás tabs de Adhesiones.

## User Stories

### US-1: Adhesiones sin la card "Posibles Duplicados"
**As a** usuario de Adhesiones
**I want to** que la tab Locales no muestre la card "Posibles Duplicados"
**So that** el panel de stats queda con las métricas vigentes

#### Acceptance Criteria
- AC-1: La tab Locales ya no muestra la card "Posibles Duplicados" (ni "Requiere revision").
- AC-2: Se conservan las cards Adhesiones Locales, Adhesiones Web y Total.
- AC-3: `StatsDto` del front sin el campo `duplicados`; sin código muerto.

## Business Rules

- BR-1: Cambio de UI + tipo; sin datos.

## Edge Cases

- EC-1: El backend puede seguir devolviendo `duplicados` un tiempo (hasta el release backend); el front lo ignora sin romper.

## Success Metrics

- Card removida; `ng build` + tests verdes.

## Feature Dependencies

- Feature espejo backend 009 (quita el cómputo `duplicados` de `/adhesiones/stats`). Orden de release: **front primero**, backend después.
