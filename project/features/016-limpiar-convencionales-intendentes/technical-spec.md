# Technical Specification: limpiar-convencionales-intendentes (frontend)

**Status**: Draft
**Created**: 2026-07-08

## Architecture Overview

Cambios de UI + capa de service. Eliminar dos secciones de Convencionales y renombrar la sección
Intendencias PN → Intendentes PN (label, título, ruta, CSV, endpoint). Sin patrones nuevos.
Cross-repo: el backend (feature espejo) quita los endpoints ODD/Integrantes y renombra el endpoint
`intendencias-pn` → `intendentes-pn`; se libera **primero**.

## Cambios por archivo

### `features/convencionales/convencionales.component.ts`
- `type Tab`: quitar `'odd'` y `'integrantes'` (queda `'nacionales' | 'departamentales' | 'odn'`).
- Template: quitar los `<a class="tab">` de "Listas ODD" e "Integrantes de Lista"; quitar la stat-card
  "Listas ODD"; el bloque compartido `tab()==='odn' || tab()==='odd'` pasa a solo `odn` (textos "Nueva
  Lista ODN", "Sin listas ODN"); quitar el bloque `@if (tab()==='integrantes')` y el modal-option ODD.
- Lógica: quitar signals `odd` e `integ`; en `setTab` quitar las ramas `odd`/`integrantes` (incluida la
  llamada http a `/convencionales/integrantes`); `loadListas` solo ODN; `filtrarListas` sobre `odn()`;
  `abrirNuevaLista` fija `tipo: 'ODN'`. Quitar imports/inyecciones ahora sin uso (`HttpClient`,
  `environment`, `IntegranteLista`).
- Mantener: tabs Nacionales, Departamentales, Listas ODN; la columna "Lista ODD" en Departamentales.

### `features/listados/intendencias-pn.component.ts` → `intendentes-pn.component.ts`
- Renombrar archivo y clase `IntendenciasPnComponent` → `IntendentesPnComponent`.
- Título `'Listados — Intendentes PN'`; nombre CSV `intendentes-pn.csv`; llamar `svc.intendentesPn(...)`.

### `core/services/listados.service.ts`
- `intendenciasPn(query)` → `intendentesPn(query)`; endpoint `'intendencias-pn'` → `'intendentes-pn'`.

### `app.routes.ts`
- Ruta `listados/intendencias-pn` → `listados/intendentes-pn`; actualizar `loadComponent` (path + clase).

### `layout/shell.component.html`
- Label del nav "Intendencias PN" → "Intendentes PN"; `routerLink` → `/listados/intendentes-pn`.

### Tests
- Adaptar specs afectados: `convencionales.component.spec.ts` (tabs ODD/Integrantes eliminadas),
  `listados.service.spec.ts` (método/endpoint renombrado), y el spec de intendencias-pn si existe.

## Non-Functional Requirements

- **Verificación**: `ng build --configuration production` + `npm test --watch=false --browsers=ChromeHeadless`.
- **Compatibilidad**: el rename de ruta/endpoint es breaking → coordinar release con el backend.
- **Security**: `rolesGuard` de la ruta se conserva (mismos roles) en la ruta renombrada.
