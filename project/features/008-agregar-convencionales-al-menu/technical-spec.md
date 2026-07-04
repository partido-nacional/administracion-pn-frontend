# Technical Specification: Agregar Convencionales al menú

**Status**: Draft
**Created**: 2026-07-04

## Architecture Overview

> Cambio puramente de UI en el shell. Se agrega un `<a class="nav-item">` que
> apunta a la ruta existente `/convencionales`, replicando el patrón de los demás
> ítems top-level (`nav-icon` con SVG + `nav-label`). No se toca `app.routes.ts`
> (la ruta ya existe) ni `ConvencionalesComponent`.

## Archivos afectados

- `src/app/layout/shell.component.html` — insertar el nuevo `nav-item` después del
  bloque de "Organismos" (antes del cierre `</nav>`, ~línea 128).

## Estado actual (referencia)

- Ruta existente: `app.routes.ts:35` →
  `{ path: 'convencionales', loadComponent: () => import('./features/convencionales/convencionales.component').then(m => m.ConvencionalesComponent) }`
- El subítem de Listados (`shell.component.html:75`, `/listados/convencionales`)
  es una pantalla distinta y no se modifica.

## Markup a insertar

```html
<a routerLink="/convencionales" routerLinkActive="active" class="nav-item" title="Convencionales">
  <span class="nav-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  </span>
  <span class="nav-label">Convencionales</span>
</a>
```

> Ícono de "grupo de personas" (delegados/convencionales). Reutiliza las clases
> CSS existentes; no se agregan estilos nuevos.

## API Contract

> N/A — no hay cambios de API.

## Data Model & Storage

> N/A.

## External Integrations

> N/A.

## Error Handling

> N/A — cambio estático de markup, sin nuevos caminos de error.

## Non-Functional Requirements

- Performance: sin impacto (ruta lazy ya existente).
- Security: sin impacto (no es un control de acceso; la ruta ya era alcanzable).
- Verificación: `npm run build -- --configuration production` debe compilar sin errores.
