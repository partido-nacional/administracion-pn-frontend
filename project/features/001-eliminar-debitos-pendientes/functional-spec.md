# Functional Specification: Eliminar Débitos Pendientes

**Status**: Draft
**Created**: 2026-06-29

## Problem Statement

> En la sección de Débitos, quiero eliminar todo lo relacionado a "débitos pendientes". No va a existir ese estado y no nos sirve.

La sección Débitos (`src/app/features/debitos/debitos.component.ts`) es un dashboard de transacciones de débito por tarjeta. Hoy maneja tres estados: **Aceptados**, **Rechazados** y **Pendientes**. El estado "Pendientes" ya no existe en el negocio y debe desaparecer por completo de la vista.

La data llega del backend real (`GET /api/debitos/dashboard`); **no está mockeada** en el frontend (el `signal` inicial en ceros es solo un placeholder hasta que responde el HTTP). El backend devuelve hoy los campos `stats.pendientes`, `stats.pctPendientes` y `porTarjeta[].pendientes`, y calcula `total` y los porcentajes incluyendo pendientes.

## Objectives

- [ ] Eliminar toda presencia visual del estado "Pendientes" en la sección Débitos (stat-card y columna de tabla).
- [ ] Que "Total" y los porcentajes de aceptación/rechazo reflejen únicamente `aceptados + rechazados`, sin inflarse con pendientes.
- [ ] No depender de un cambio en el backend para liberar esta feature (el frontend tolera que el backend siga enviando los campos de pendientes).

## Out of Scope

- Limpiar el contrato del backend (`administracion-pn-backend` → quitar `pendientes`/`pctPendientes` de `/debitos/dashboard`). Se registra como ítem espejo en `project/backlog.md` (convención de IDs cruzados) y se aborda por separado.
- Cualquier otra feature donde aparezca la palabra "pendiente" (agrupaciones, adhesiones, agenda). Son dominios distintos y **no se tocan**.
- El filtro de meses del dashboard (hoy no refetcha por mes); su comportamiento no cambia.

## User Stories

### US-1: Ver el dashboard de Débitos sin el estado Pendientes
**As a** administrador del partido que revisa la recaudación por débito
**I want to** ver el dashboard de Débitos solo con Aceptados y Rechazados
**So that** los números reflejen la realidad del negocio sin un estado que ya no existe

#### Acceptance Criteria
- AC-1: El grid de estadísticas muestra exactamente las tarjetas **Aceptados**, **Rechazados** y **Monto Total Recaudado**. La stat-card "Pendientes" no aparece.
- AC-2: La tabla "Resumen por Tarjeta" tiene las columnas **Tarjeta, Aceptados, Rechazados, Total, Monto, % Aceptación** (y la columna de acciones). No existe la columna "Pendientes".
- AC-3: En las stat-cards, `% del total` de Aceptados y de Rechazados se calcula sobre `aceptados + rechazados` (no sobre un total que incluya pendientes).
- AC-4: En la tabla, `Total = aceptados + rechazados` por cada fila, y `% Aceptación = aceptados / (aceptados + rechazados)`.
- AC-5: Si el backend sigue enviando `pendientes`/`pctPendientes`, la vista los ignora sin romperse (no aparecen por ningún lado).
- AC-6: La tabla "Últimos Débitos Rechazados" se mantiene igual (no estaba ligada a pendientes).

## Business Rules

- BR-1: **Total por tarjeta** = `aceptados + rechazados`. Ejemplo: una tarjeta con `aceptados=80`, `rechazados=20` → `Total = 100` (antes, con `pendientes=10`, mostraba 110).
- BR-2: **% Aceptación** = `aceptados / (aceptados + rechazados) * 100`, redondeado como hoy. Ejemplo: `aceptados=80`, `rechazados=20` → `80%`. El umbral visual de badge (`>= 88` → activo) se mantiene.
- BR-3: **% del total (stats)**: `pctAceptados = aceptados / (aceptados + rechazados) * 100`; `pctRechazados = rechazados / (aceptados + rechazados) * 100`.
- BR-4: El **Monto Total Recaudado** (`montoTotal`) no se altera por esta feature (la recaudación no depende del conteo de pendientes).

## Edge Cases

- EC-1: `aceptados + rechazados = 0` (sin movimientos) → mostrar `0%` en porcentajes y `0` en Total, sin división por cero ni `NaN`.
- EC-2: El backend no responde / responde vacío → se mantiene el placeholder en ceros actual, sin columnas ni cards de pendientes.
- EC-3: El backend envía `pendientes > 0` → el valor se descarta; no debe sumar al Total ni mostrarse.

## Success Metrics

- La palabra "Pendientes" no aparece en ningún lugar de la sección Débitos.
- Los totales y porcentajes cuadran con `aceptados + rechazados` en una verificación manual.

## Feature Dependencies

- Ninguna que bloquee el frontend. Existe un ítem espejo (opcional, no bloqueante) en `administracion-pn-backend` para limpiar el contrato de `/debitos/dashboard`.
