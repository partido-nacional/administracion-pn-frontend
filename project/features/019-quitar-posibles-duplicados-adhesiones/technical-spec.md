# Technical Specification: quitar-posibles-duplicados-adhesiones

**Status**: Draft
**Created**: 2026-07-09

## Cambios

### `features/adhesiones/adhesiones-listado.component.ts`
- Quitar la `<div class="stat-card">` de "Posibles Duplicados" (usa `stats().duplicados` + trend "Requiere revision").
- Quitar el campo `duplicados` de `interface StatsDto`.
- Quitar `duplicados: 0` del valor inicial de `stats = signal<StatsDto>({...})`.
- `reloadStats()` sigue leyendo `GET /adhesiones/stats` (el backend puede devolver el campo extra; se ignora).

### Tests
- Adaptar spec de adhesiones-listado si referencia `duplicados` (verificar en build).

## Non-Functional Requirements

- **Verificación**: `ng build --configuration production` + `npm test --watch=false --browsers=ChromeHeadless`.
- **Release**: front primero (deja de consumir), backend 009 después (deja de producir) → sin glitch.
