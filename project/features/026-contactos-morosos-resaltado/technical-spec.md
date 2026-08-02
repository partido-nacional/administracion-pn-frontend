# Technical Specification: Resaltado de contactos morosos

**Version**: 1.0
**Status**: Draft
**Created**: 2026-08-02

## Architecture Overview

Feature de presentación contenida en la grilla de contactos. Sin servicios nuevos, sin rutas nuevas,
sin cambios de estado más allá de una clase CSS condicional.

### Superficie de cambio

| Archivo | Líneas | Cambio |
|---|---|---|
| `src/app/features/agenda/contactos.service.ts` | `115-120` | agregar `situacion?: string` a la interfaz `ContactoListado` |
| `src/app/features/agenda/agenda-listado.component.ts` | `78` | `[class.moroso]="esMoroso(c.situacion)"` en la fila |
| `src/app/features/agenda/agenda-listado.component.ts` | `131-133` | `[class.moroso]` en `tr.detalle-row` y en `.detalle-wrap` + cartel de suspensión |
| `src/app/features/agenda/agenda-listado.component.ts` | `~302-307` | estilos del resaltado (fila, hover, seleccionada, card, cartel) |
| `src/app/features/agenda/agenda-listado.component.ts` | módulo | helper `esMoroso()` |
| `src/app/features/agenda/agenda-listado.component.spec.ts` | nuevo o existente | tests |

### Decisiones de diseño

**D-1 — Un único helper `esMoroso()` a nivel de módulo.**

```ts
const SITUACION_MOROSO = 'M';

export function esMoroso(situacion?: string | null): boolean {
  return (situacion ?? '').trim().toUpperCase() === SITUACION_MOROSO;
}
```

Lo consumen los dos lugares: la fila (desde `ContactoListado.situacion`, campo nuevo del backend) y el
área desplegada (desde `detalle().situacion`, que ya llegaba por `GET /contactos/{id}`). Un solo lugar
donde vive el criterio de BR-1 evita que fila y card discrepen si mañana cambia.

**D-2 — El rojo gana al azul de selección por especificidad, no por orden.**

`tr.selected { background:#e6efff !important }` (`:304`) sólo puede vencerse con `!important` y
especificidad mayor. `tr.moroso.selected` (0,2,1) supera a `tr.selected` (0,1,1):

```css
tr.moroso                    { background:#FDECEA; }
tr.clickable.moroso:hover    { background:#FBDFDC; }              /* AC-3: no vuelve al celeste */
tr.moroso.selected           { background:#FDECEA !important; }   /* AC-4: gana el rojo */
tr.moroso.selected > td:first-child { box-shadow: inset 3px 0 0 #E57373; }  /* barra lateral */
```

La barra va como `box-shadow: inset` en el primer `td` y no como `border-left` en el `tr`: el borde en
un `<tr>` sólo renderiza de forma consistente con `border-collapse: collapse`, y no queremos que el
resaltado dependa de una propiedad de la tabla que otro cambio podría tocar.

**D-3 — El área desplegada se tiñe en sus dos capas.**

`tr.detalle-row > td` tiene `background:#fafbfd` (`:305`) y `.detalle-section` tiene `background:#fff`
(`:307`). Teñir sólo una deja la card a parches:

```css
tr.detalle-row.moroso > td            { background:#FDECEA; }
.detalle-wrap.moroso .detalle-section { background:#FFF7F6; }   /* un paso más claro, mantiene jerarquía */
```

**D-4 — Variante `html.dark` propia.**

`#FDECEA` sobre tema oscuro es una banda clara que rompe el contraste del texto (EC-6). Se agrega una
variante con rojo desaturado oscuro y texto claro.

> Nota de alcance: `tr.clickable:hover`, `tr.selected` y `tr.detalle-row` **ya** usan colores claros
> hardcodeados sin variante `html.dark`. Es una inconsistencia preexistente, fuera del alcance de esta
> feature (ver Out of Scope del spec funcional) → backlog.

**D-5 — El cartel es markup, no un `alert()` ni un toast.**

Va como primer hijo de `.detalle-wrap`, antes de las secciones de datos (AC-8), para que se lea sin
scrollear. Texto literal en el template, sin interpolación ni i18n: es una cadena fija de negocio.

## API Contract

Consume `GET /api/contactos` con el campo `situacion` que agrega el backend
(`029-contactos-morosos-resaltado`). El detalle expandible sigue usando `GET /api/contactos/{id}`, que
ya devolvía `situacion`.

**Degradación** (EC-5): si el backend aún no expone el campo, `c.situacion` llega `undefined`,
`esMoroso()` devuelve `false` y ninguna fila se resalta. La card desplegada y el cartel **sí** funcionan,
porque su dato viene del otro endpoint. Sin errores ni logs.

## Data Model & Storage

Sin cambios de esquema. Sólo se amplía la interfaz TS `ContactoListado` con `situacion?: string`.

## External Integrations

Ninguna.

## Error Handling

| Código | Error | Descripción |
|---|---|---|
| — | — | Sin errores nuevos. El único modo de fallo es la degradación silenciosa de EC-5, que es el comportamiento deseado. |

## Non-Functional Requirements

- **Performance**: `esMoroso()` se evalúa por fila en cada ciclo de change detection. Es una comparación
  de string sin asignaciones; el costo es despreciable frente al `@for` que ya existe.
- **Accesibilidad**: contraste del texto sobre `#FDECEA` verificado ≥4.5:1 (WCAG AA) — el texto de la
  grilla es `#222` sobre un fondo de luminancia ~0.92. El color es el **único** indicador en la fila:
  riesgo aceptado y documentado en el spec funcional.
- **Modo oscuro**: variante propia (D-4).
- **Compatibilidad**: no requiere despliegue coordinado. Frontend y backend pueden salir en cualquier
  orden gracias a la degradación de EC-5.

## Testing

`project_type: production`. El componente **no tiene spec hoy** (`agenda-listado.component.ts`), igual
que pasaba con `agenda-nuevo` en la feature 025. Se crea `agenda-listado.component.spec.ts`.

| Test | Cubre |
|---|---|
| `esMoroso('M')` → true; `'m'`, `' M '`, `'m '` → true | BR-1, EC-2 |
| `esMoroso(undefined \| null \| '' \| 'SM' \| 'PC')` → false | AC-2, EC-1 |
| Fila con `situacion:'M'` recibe la clase `moroso` | AC-1 |
| Fila con otra situación no la recibe | AC-2 |
| Fila morosa desplegada conserva `moroso` junto a `selected` | AC-4, BR-3 |
| Fila no morosa desplegada recibe `selected` sin `moroso` | AC-5 |
| Al desplegar un moroso, el área desplegada muestra el texto exacto del cartel | AC-7, BR-4 |
| Al desplegar un no moroso, el cartel no está en el DOM | AC-9 |
| El cartel es el primer elemento de `.detalle-wrap` | AC-8 |
| Sin `situacion` en el listado (backend viejo), ninguna fila tiene `moroso` | EC-5 |

**Comando**: `npx ng test --watch=false --browsers=ChromeHeadless`

## Implementation Notes

- **El riesgo principal es AC-4.** Es el que un fix ingenuo (`tr.moroso { background:#FDECEA }` a secas)
  rompe en silencio: el `!important` de `tr.selected` gana y el rojo desaparece justo al desplegar. El
  test que verifica ambas clases juntas es obligatorio, y conviene además una verificación visual.
- **AC-8 se testea por posición en el DOM**, no sólo por presencia del texto: si el cartel termina
  debajo de las secciones de datos, hay que scrollear para verlo y pierde el sentido.
- Montar el `TestBed` de `agenda-listado` requiere mockear `ContactosService`, `Router`,
  `ActivatedRoute`, `PageTitleService` y `HttpClient` (el componente hace `GET /contactos` directo por
  `HttpClient`, no por el servicio — ver `reload()`). Es el mismo tipo de trabajo que en la feature 025.
