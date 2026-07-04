# Feature 008 — Agregar Convencionales al menú

**Estado**: Completada · **Tipo**: prototype · **Fecha**: 2026-07-04

## Qué se hizo

Se agregó el ítem **Convencionales** al menú de navegación lateral, apuntando a la
ruta top-level `/convencionales`. La sección ya existía (ruta + componente con tabs
Nacionales, Departamentales, Listas ODN/ODD, Integrantes) pero no tenía enlace en el
menú; solo era alcanzable por URL directa.

## Cambios

- `src/app/layout/shell.component.html` — nuevo `<a routerLink="/convencionales">`
  insertado después de "Organismos", con ícono de grupo de personas y label
  "Convencionales", siguiendo el patrón de los demás `nav-item`.

## Aclaración

No confundir con el subítem "Convencionales" del dropdown **Listados**
(`/listados/convencionales` → `ConvencionalesListadoComponent`), que es otra
pantalla y ya estaba en el menú. No se modificó.

## Fuera de alcance (intacto)

- Ruta `/convencionales` (`app.routes.ts`) y componente `ConvencionalesComponent`.

## Verificación

`npm run build -- --configuration production` → OK (sin errores).

## Entrega

- Commit `e42eac1` en branch `feature/agregar-convencionales-al-menu`.
- PR #52 → merge a `develop` (merge commit `fc0637c`).
