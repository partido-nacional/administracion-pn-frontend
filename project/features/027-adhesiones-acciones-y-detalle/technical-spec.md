# Technical Specification: Acciones de la grilla de Adhesiones

**Version**: 1.0
**Status**: Approved
**Created**: 2026-08-02

## Architecture Overview

Cambio de presentación en un solo componente. Sin servicios, sin rutas, sin API.

### Superficie de cambio

| Archivo | Líneas | Cambio |
|---|---|---|
| `src/app/features/adhesiones/adhesiones-listado.component.ts` | `89-94` | pestaña Web: se elimina "Detalle"; "Pasar a Local" y "Eliminar" pasan a `<button>` |
| `src/app/features/adhesiones/adhesiones-listado.component.ts` | `174-177` | pestaña Locales: "Eliminar" pasa a `<button>` |

### Decisiones de diseño

**D-1 — `btn btn-sm` y no una clase nueva.**
8 pantallas de la app ya usan ese patrón para acciones de grilla (`agrupaciones-pendientes`,
`fichas-agrupacion`, `usuarios`, `organismos`, `dashboard`, …). Adhesiones se alinea con la mayoría en
vez de inventar un tercer estilo.

**D-2 — `<button>` y no `<a>` con estilo de botón.**
No son navegación: disparan operaciones sobre la fila. Un `<a>` sin `href` no es focuseable por teclado
ni se activa con Enter/Espacio, que es parte de por qué el "Detalle" muerto pasó inadvertido.

**D-3 — No se toca la clase global `.action-link`.**
Sigue en uso en débitos, convencionales y productos. Eliminarla o redefinirla arrastraría esas tres
pantallas, que están fuera de alcance por decisión del usuario.

**D-4 — Se conserva `.action-group` como contenedor.**
Ya da `display:flex` con `gap`, que es lo que necesitan los botones. Sólo puede requerir ajuste del
`gap`, porque 12px pensados para texto quedan holgados entre botones.

## API Contract

Sin cambios. No se toca ningún endpoint ni DTO.

## Data Model & Storage

Sin cambios.

## External Integrations

Ninguna.

## Error Handling

| Código | Error | Descripción |
|---|---|---|
| — | — | Sin errores nuevos. Los handlers y su manejo de error no cambian. |

## Non-Functional Requirements

- **Accesibilidad**: mejora respecto del estado actual — `<button>` es focuseable y activable por
  teclado; el `<a>` sin `href` no lo era.
- **Performance**: sin impacto.
- **Tema oscuro**: `btn-sm`/`btn-danger` ya tienen tratamiento; `.action-link` no.

## Testing

`project_type: production`. `adhesiones-listado.component.ts` **no tiene spec** hoy. Se crea
`adhesiones-listado.component.spec.ts`.

| Test | Cubre |
|---|---|
| La pestaña Web renderiza las acciones como `<button>`, no `<a>` | AC-1 |
| "Eliminar" tiene la clase `btn-danger` | AC-3, BR-2 |
| Los botones usan `btn-sm` | AC-4 |
| No existe ningún elemento con el texto "Detalle" | AC-6 |
| Ningún control de acción queda sin handler | AC-7, BR-1 |
| Click en "Pasar a Local" invoca `pasar()` con el id de la fila | AC-5 |
| Click en "Eliminar" invoca `eliminarWeb()` con el id de la fila | AC-5 |
| La pestaña Locales renderiza "Eliminar" como `<button>` `btn-danger` | AC-2, BR-3 |

**Comando**: `npx ng test --watch=false --browsers=ChromeHeadless`

## Implementation Notes

- Verificar visualmente que la columna de acciones no empuje la tabla (EC-3): la grilla Web tiene 15
  columnas y ya es ancha.
- El `colspan="15"` del estado vacío no cambia (EC-2).
- Ojo con `(click)` sobre `<button>` dentro de una tabla: no hay fila clickeable acá, así que no hace
  falta `$event.stopPropagation()`.
