# Functional Specification: Agregar Convencionales al menú

**Status**: Draft
**Created**: 2026-07-04

## Problem Statement

> Quiero agregar la sección de convencionales que actualmente NO está en el menú
> al menú. Se ve que en algún momento se perdió.

La sección **Convencionales** (ruta top-level `/convencionales`, componente
`ConvencionalesComponent`) existe y funciona —tabs Nacionales, Departamentales,
Listas ODN, Listas ODD e Integrantes de Lista— pero **no tiene ítem en el menú
lateral**, por lo que solo es accesible por URL directa. Se implementó en el
commit `0464b75` pero nunca se le agregó (o se perdió) el enlace de navegación.

> ⚠️ No confundir con el subítem "Convencionales" del dropdown **Listados**
> (`/listados/convencionales` → `ConvencionalesListadoComponent`), que es otra
> pantalla distinta y **sí** está en el menú. Esta feature agrega el acceso a la
> sección top-level `/convencionales`.

## Objectives

- [ ] Agregar un ítem "Convencionales" al menú lateral que enlace a `/convencionales`.
- [ ] Ubicarlo después de "Organismos" (último ítem top-level; ambas son estructura partidaria).

## Out of Scope

- Cambios en el componente `ConvencionalesComponent` o su lógica.
- Cambios en la ruta `/convencionales` (ya existe en `app.routes.ts`).
- El subítem `/listados/convencionales` del dropdown Listados (ya está en el menú, no se toca).

## User Stories

### US-1: Acceder a Convencionales desde el menú
**As a** usuario de la administración partidaria
**I want to** ver y abrir "Convencionales" desde el menú lateral
**So that** pueda llegar a la sección sin escribir la URL a mano

#### Acceptance Criteria
- AC-1: El menú lateral muestra un ítem "Convencionales" con ícono y label.
- AC-2: Al clickearlo navega a `/convencionales` y el componente carga correctamente.
- AC-3: El ítem marca estado activo (`routerLinkActive="active"`) cuando la ruta está activa.
- AC-4: Queda ubicado después de "Organismos", coherente con el estilo de los demás ítems top-level.
- AC-5: El subítem "Convencionales" del dropdown Listados permanece sin cambios.

## Business Rules

- BR-1: El nuevo ítem sigue el mismo patrón de markup que los otros `nav-item`
  (span `nav-icon` con SVG + span `nav-label`).

## Edge Cases

- EC-1: Coexistencia de dos labels "Convencionales" (top-level nav-item y subítem
  de Listados) — es esperado; refieren a pantallas distintas.

## Success Metrics

- La sección `/convencionales` es alcanzable desde el menú en dev/prod.

## Feature Dependencies

- Ninguna (ruta y componente ya existen).
