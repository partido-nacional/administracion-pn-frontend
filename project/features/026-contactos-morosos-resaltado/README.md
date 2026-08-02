# Feature 026 — Resaltado de contactos morosos

**Estado**: Completada · **Fecha**: 2026-08-02 · **Rama**: `feature/contactos-morosos-resaltado`
**Espejo**: `administracion-pn-backend` → `029-contactos-morosos-resaltado`

## Qué se construyó

Un contacto con `Situacion = 'M'` era indistinguible del resto en la grilla: el dato existía pero
sólo se veía abriendo el editor del contacto. Ahora:

| Dónde | Qué pasa |
|---|---|
| Fila de la grilla | Fondo rojo pastel `#fdecea`, con hover propio `#fbdfdc` |
| Fila desplegada | Conserva el rojo + barra lateral `#e57373` que marca la expansión |
| Área desplegada | Teñida en sus dos capas (`tr.detalle-row > td` y `.detalle-section`) |
| Aviso | `**** CONTACTO SUSPENDIDO POR MOROSIDAD, CONSULTAR CON CCH ANTES DE REALIZAR CUALQUIER GESTIÓN ****` |

## Decisiones que vale recordar

- **El rojo le gana al azul de selección por especificidad, no por orden.** `tr.selected` usa
  `background:#e6efff !important`; `tr.moroso.selected` (0,2,1) le gana a `tr.selected` (0,1,1). Sin
  eso el azul tapa el rojo justo al desplegar — cuando el operador va a actuar. Fijado con un test.
- **La barra lateral va como `box-shadow: inset` en el primer `td`**, no como `border-left` en el
  `<tr>`: el borde en una fila sólo renderiza consistente con `border-collapse:collapse`, y el
  resaltado no debería depender de una propiedad de la tabla que otro cambio podría tocar.
- **El área desplegada se tiñe en dos capas.** `tr.detalle-row > td` es `#fafbfd` y `.detalle-section`
  es `#fff`; teñir una sola dejaba la card a parches.
- **Un solo `esMoroso()`** para fila y card, comparando con `trim()` e ignorando mayúsculas: el backend
  normaliza igual en su filtro de situaciones, señal de que el dato migrado no es consistente en
  formato. Comparar `=== 'M'` a secas dejaría morosos sin marcar.
- **El aviso sale de `detalle()`, no de la fila.** Si el backend todavía no expone `situacion` en el
  listado, la fila no se resalta pero el aviso aparece igual, porque `GET /contactos/{id}` ya la
  devolvía. Frontend y backend pueden desplegarse en cualquier orden.

## Tema oscuro

Las reglas viven en `src/styles.css`, **no** en los estilos del componente: la encapsulación emulada
scopea también el elemento `html` (queda `html.dark[_ngcontent-xxx]`, que ese elemento nunca lleva), así
que una regla `html.dark` declarada en el componente no matchea nunca.

Se oscurece **sólo la fila**. El área desplegada se deja clara a propósito: `.kv .v` usa `color:#222`
hardcodeado y `tr.detalle-row > td` / `.detalle-section` usan fondos claros hardcodeados aun en tema
oscuro. Esa combinación preexistente mantenía el texto legible por accidente; oscurecer sólo la card
morosa lo dejaba negro sobre marrón. Cuando se salde la deuda de tema oscuro de esta grilla, la card
morosa se oscurece junto con el resto.

## Riesgo aceptado

**El color es el único indicador en la fila.** Se evaluó sumar un badge "MOROSO" y se optó por sólo
color. Para daltonismo rojo-verde la fila será indistinguible en la grilla; la información sigue siendo
accesible al desplegar el contacto, donde el aviso la comunica sin depender del color.

## Tests

`agenda-listado.component.spec.ts` es **nuevo** — el componente no tenía spec. 12 tests mapeados a los
acceptance criteria. Suite completa: **209/209**.

## Verificación visual

Verificado contra la app real (backend + frontend levantados, Chrome headless vía CDP), en tema claro y
oscuro. Encontró dos bugs que los tests no podían ver, porque verifican clases y DOM y no estilos
computados: las reglas `html.dark` del componente que nunca matcheaban, y el texto ilegible al oscurecer
la card. Ambos corregidos en `76afdc3`.
