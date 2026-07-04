# Functional Specification: Ocultar sección Débitos

**Status**: Draft
**Created**: 2026-07-04

## Problem Statement

> Quiero que en el front, por el momento escondamos la sección Débitos, no la vamos a estar usando.

La sección **Débitos** aparece en la navegación lateral (`shell.component.html`) pero no se está usando por ahora. Debe quedar oculta del menú de forma que la ocultación sea fácilmente reversible cuando se retome su uso.

## Objectives

- [ ] Ocultar el ítem "Débitos" del menú de navegación lateral.
- [ ] Que la ocultación sea reversible con un cambio mínimo (idealmente comentar, no borrar).

## Out of Scope

- Eliminar el componente `features/debitos/` o su lógica.
- Quitar la ruta `/debitos` de `app.routes.ts` (la URL directa sigue funcionando — decisión: alcance "solo menú").
- Cambios de backend.

## User Stories

### US-1: Ocultar Débitos del menú
**As a** usuario de la administración partidaria
**I want to** no ver la sección Débitos en el menú lateral
**So that** el menú refleje solo las secciones actualmente en uso

#### Acceptance Criteria
- AC-1: El ítem "Débitos" no aparece en el nav lateral del shell.
- AC-2: El resto de los ítems del menú permanecen sin cambios ni reordenamiento visual.
- AC-3: La ocultación puede revertirse restaurando una sola porción de markup.

## Business Rules

- BR-1: No se elimina funcionalidad; solo se oculta el acceso desde el menú.

## Edge Cases

- EC-1: Acceso a `/debitos` por URL directa — fuera de alcance (sigue cargando el componente).

## Success Metrics

- El menú lateral ya no muestra "Débitos" en dev/prod.

## Feature Dependencies

- Ninguna.
