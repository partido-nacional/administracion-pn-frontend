# Technical Specification: Mejoras calendario y filtros (frontend)

**Version**: 1.0
**Status**: Draft
**Created**: 2026-09-30
**Espejo**: backend `033-mejoras-calendario-filtros` (params nuevos de API)

## Architecture Overview

Angular 17 standalone. Sin librerías nuevas.

### 1. Imprimir calendario
- Nuevo helper `features/dashboard/imprimir-calendario.ts`, con el mismo patrón que `agrupaciones/imprimir-agrupacion.ts`: arma un HTML autónomo con `<style>` y `@media print`, lo abre con `window.open('', '_blank')` → `document.write` → `onload` → `print()`. Si la ventana emergente está bloqueada, avisa (AC-8).
- Funciones puras y testeables:
  - `rangoSemana(hoy): {desde, hasta}`: fechas ISO del lunes de la semana de hoy y del lunes siguiente (BR-4).
  - `agruparPorDia(eventos, rango, incluirVacios)`.
  - `htmlCalendario(...)`.
  - Todo texto de usuario se escapa en el HTML.
- `dashboard.component.ts`: botón "🖨 Imprimir" en la barra del calendario, con un menú chico de **Mes** / **Semana**.
  - **Mes**: reusa los eventos del mes visible que ya están cargados.
  - **Semana**: `GET /calendario/eventos?desde=&hasta=&soloPrivados=` con los límites como hora de pared + `Z` (`YYYY-MM-DDT00:00:00Z`). Así se respeta cómo se guardan los eventos (hora de pared marcada UTC) y la misma convención que el filtro mensual. *Corregido durante el build: originalmente decía offset local.*
- Columnas (AC-4): Hora · Hasta (`HH:mm`, o `dd/MM HH:mm` si termina otro día — EC-2) · Título (con 🔒 si es privado) · Tipo · Creador · Descripción.

### 2. Departamentos (`DEPARTAMENTOS` de `core/departamentos.ts` en todas partes)
| Grilla | Cambio |
|---|---|
| `listados/parlamentarias` | 6 opciones hardcodeadas → `DEPARTAMENTOS` |
| `listados/jovenes` | columna Departamento nueva; dropdown movido bajo esa columna; `Joven.departamento` |
| `listados/intendentes-pn` | dropdown nuevo → param `depto` |
| `organismos` | lista hardcodeada → `[...DEPARTAMENTOS, 'Nacional']` |
| `agrupaciones-por-periodo` | opciones de la base (`/opciones`) → `DEPARTAMENTOS` |
| `agrupaciones` (Todas) | dropdown nuevo → `depto` |
| `agrupaciones-pendientes` | dropdown nuevo → `depto` |
| `fichas-agrupacion` | dropdown nuevo → `departamento` |
| `adhesiones-listado` (web) | dropdown nuevo → `departamento` |
| `convencionales` (3 pestañas) | dropdown nuevo, filtrado **client-side** (el endpoint no pagina) con `normDepto()` |

- Helper nuevo `normDepto(s)` en `core/departamentos.ts`: `trim` + minúsculas + quita tildes (preserva la ñ), con la misma lógica que `TextNorm` del backend.
- Las listas de departamentos de los **formularios** no se tocan (fuera de alcance).

### 3. Agrupaciones: filtros Nombre / Código / ID
| Grilla | Inputs nuevos (fila de filtros) | Params |
|---|---|---|
| Todas | ID, Cod. Agrup., Nombre, Depto | `id`, `cod`, `nombre`, `depto` |
| Pendientes | ID, Cod. Agrup., Nombre, Depto | `id`, `cod`, `nombre`, `depto` |
| Fichas Web | ID, Nombre Agrupación, Departamento | `id`, `nombre`, `departamento` |
| Por Período | Id, Id Agr. (se suman a los existentes) | `id`, `agrId` |

- Patrón igual a los listados: `filter$` con `debounceTime(300)` → `page=1` → recarga; `GridQuery.filters` → `buildPagedParams`.
- Las grillas que hoy no tienen fila de filtros la ganan con la clase `.filter-row` existente.

## API Contract

Ver el spec técnico del backend 033 (todos los params son opcionales y retrocompatibles).

## Data Model

- `Joven` suma `departamento: string`.
- `Evento` sin cambios.

## Error Handling

- Fallo de carga: se mantiene el `error: () => loading.set(false)` de cada grilla.
- Imprimir semana con error de red: se avisa con mensaje y no se abre la ventana.

## Non-Functional Requirements

- Sin dependencias nuevas.
- La impresión funciona en Chrome/Edge/Firefox. "Guardar como PDF" lo da el navegador.

## Testing

Karma/Jasmine:
- Funciones de impresión: `rangoSemana` (incluye un domingo y un cruce de mes), agrupado, días vacíos, escape de HTML.
- Cada grilla tocada: el dropdown tiene los 19 departamentos (+Nacional en Organismos) y los filtros nuevos llegan como params al service.
- Convencionales: el filtro client-side ignora tildes y mayúsculas.

## Corrección pre-release (validación contra Postgres)

`Agrupacion.Depto` guarda casi siempre la **letra de serie de la credencial** (`C` = Canelones, `A`/`B` = Montevideo …
`T` = Tacuarembó, `X` = Nacional) y solo a veces el nombre. Con la semilla, Canelones son 744 `C` y 154 `CANELONES`.
- El filtro comparaba solo por nombre: perdía la mayoría de las filas. Además, Por Período quedaba en 0, porque antes su dropdown listaba las letras crudas.
- **Fix**: en Agrupaciones Todas, Pendientes y Por Período, `depto` acepta el nombre normalizado **o** las letras de ese departamento (`DepartamentosCredencial`, en Domain, la misma tabla que el `credencialMap` del alta de contactos).
- Los dropdowns de agrupaciones suman **'Nacional'** (`X` / `NACIONAL`).
- Verificado en Postgres: Canelones 154 → **898** (= 744 + 154, igual al conteo SQL directo); Por Período 0 → 1.369.
