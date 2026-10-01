# Feature 030 — Mejoras: imprimir calendario, filtros de departamento y de agrupaciones

**Estado**: Completada · **Fecha**: 2026-09-30 · **Rama**: `feature/mejoras-calendario-filtros`
**Espejo**: backend `033-mejoras-calendario-filtros` ↔ frontend `030-mejoras-calendario-filtros`
**Flujo**: `/project.start` → `/project.spec` → `/project.plan` → `/project.build` → `/project.check --sync` → `/project.finish`

## Frontend (esta feature)

- **Imprimir calendario**: botón 🖨 con menú *Mes* / *Semana actual* → listado por día en ventana nueva +
  `window.print()` (`features/dashboard/imprimir-calendario.ts`). Respeta Todos / Solo privados; texto escapado.
- **Departamentos** (lista canónica `DEPARTAMENTOS`, 19): Parlamentarias (antes 6), Jóvenes (+columna), Intendentes PN
  (nuevo), Organismos (+Nacional), Agrupaciones Todas / Pendientes / Fichas Web / Por Período, Adhesiones web,
  Convencionales (client-side con `normDepto`).
- **Agrupaciones**: filtros ID / Código / Nombre en Todas y Pendientes; ID / Nombre en Fichas Web; Id / Id Agr. en Por Período.

## Hallazgos durante el build

- `app-list-state` (Todas) y los `@if (loading())` de Pendientes/Fichas **reemplazaban la tabla entera** al cargar
  o con 0 resultados: con filtros, el input se habría destruido mientras se tipea y no habría cómo borrar un filtro
  sin resultados. Con filtros activos / tras la primera carga la tabla queda visible con "Sin resultados" adentro.
- Code review: menú Imprimir ilegible en modo oscuro y no cerraba con click afuera; test flaky por orden aleatorio
  de Jasmine. Los tres corregidos.

## Tests

`imprimir-calendario.spec.ts` (11), `filtros-grillas.spec.ts` (11), `dashboard.component.spec.ts` (+4). Suite: 263/263.
