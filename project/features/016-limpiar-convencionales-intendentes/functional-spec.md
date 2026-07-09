# Functional Specification: limpiar-convencionales-intendentes (frontend)

**Status**: Draft
**Created**: 2026-07-08

## Problem Statement

> Quitemos del front (y back si están) las siguientes secciones: Listas ODD (en Convencionales) y
> Integrantes de lista (en Convencionales). Por otro lado, Intendencias PN debería renombrarse a
> Intendentes PN.

Limpieza de secciones no usadas + rename de una sección. Es **cross-repo**: hay endpoints backend
detrás (feature espejo backend). El rename de Intendencias→Intendentes incluye la ruta y el endpoint
(decisión: rename completo) → coordinado con el backend.

## Objectives

- [ ] Quitar de Convencionales la tab **Listas ODD** (conservar Listas ODN y las demás).
- [ ] Quitar de Convencionales la tab **Integrantes de Lista**.
- [ ] Renombrar **Intendencias PN → Intendentes PN** en todo el front: label del menú, título, CSV, ruta.
- [ ] Consumir el endpoint backend renombrado (`intendentes-pn`) y dejar de llamar a los endpoints ODD/Integrantes eliminados.

## Out of Scope

- Borrar tablas/datos (Lista tipo ODD, IntegranteLista quedan en el esquema; solo se quitan UI + endpoints).
- Quitar la columna "Lista ODD" de la grilla **Departamentales** (es un atributo del convencional; se mantiene).
- Tabs Nacionales, Departamentales y **Listas ODN** (se conservan).

## User Stories

### US-1: Convencionales sin Listas ODD ni Integrantes de Lista
**As a** usuario
**I want to** que Convencionales no muestre las secciones ODD ni Integrantes de Lista
**So that** la vista solo tiene lo vigente

#### Acceptance Criteria
- AC-1: La barra de tabs de Convencionales ya no muestra "Listas ODD" ni "Integrantes de Lista".
- AC-2: Se conservan las tabs Nacionales, Departamentales y "Listas ODN" (funcionando igual).
- AC-3: La card de stats "Listas ODD" se elimina; las demás stats siguen.
- AC-4: El modal de alta/edición de Lista ya no ofrece la opción ODD (solo ODN).
- AC-5: No quedan llamadas a `/convencionales/listas/odd` ni `/convencionales/integrantes` en el front.

### US-2: Intendencias PN renombrado a Intendentes PN
**As a** usuario
**I want to** ver "Intendentes PN" en el menú y la pantalla
**So that** el nombre es correcto

#### Acceptance Criteria
- AC-6: El ítem del menú lateral dice "Intendentes PN".
- AC-7: El título de la pantalla dice "Listados — Intendentes PN".
- AC-8: La ruta es `/listados/intendentes-pn`.
- AC-9: El CSV exportado se llama `intendentes-pn.csv`.
- AC-10: El service llama al endpoint backend `intendentes-pn` (renombrado).

## Business Rules

- BR-1: La eliminación de ODD/Integrantes es solo de UI + endpoints, no de datos.
- BR-2: El rename de ruta/endpoint es breaking → se libera coordinado con el backend.

## Edge Cases

- EC-1: Un link viejo a `/listados/intendencias-pn` deja de existir (404 de router) — aceptable, es interno.

## Success Metrics

- Convencionales sin las 2 secciones; Intendentes PN visible y funcionando; `ng build` + tests verdes.

## Feature Dependencies

- Feature espejo **backend** (limpiar-convencionales-intendentes-backend): quita endpoints ODD/Integrantes
  y renombra `intendencias-pn` → `intendentes-pn`. Se libera primero.
