# Feature 007 — Ocultar sección Débitos

**Estado**: Completada · **Tipo**: prototype · **Fecha**: 2026-07-04

## Qué se hizo

Se ocultó el ítem **Débitos** del menú de navegación lateral. La sección no se
usa por ahora; se dejó fuera del menú de forma fácilmente reversible.

## Cambios

- `src/app/layout/shell.component.html` — se comentó el bloque
  `<a routerLink="/debitos">…</a>` (con nota `<!-- Débitos oculto temporalmente
  (feature 007-ocultar-seccion-debitos). Descomentar para restaurar. -->`).

## Fuera de alcance (intacto)

- Ruta `/debitos` en `app.routes.ts` → sigue accesible por URL directa.
- Componente `features/debitos/` → sin cambios.

## Reversibilidad

Descomentar el bloque en `shell.component.html` restaura el ítem tal cual.

## Verificación

`npm run build -- --configuration production` → OK (sin errores).

## Entrega

- Commit `2615b24` en branch `feature/ocultar-seccion-debitos`.
- PR #51 → merge a `develop` (merge commit `b2b5c0a`).
