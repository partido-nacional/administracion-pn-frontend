# Functional Specification: Resaltado de contactos morosos

**Status**: Draft
**Created**: 2026-08-02

## Problem Statement

Un contacto con `Situacion = 'M'` (moroso) hoy es visualmente indistinguible del resto en la grilla de
contactos. El dato existe, pero está enterrado en el editor del contacto: para saber que una persona
está suspendida por morosidad hay que abrir su ficha de edición. Quien opera la agenda puede iniciar una
gestión sobre un moroso sin enterarse.

> Pedido original del usuario (2026-08-02, verbatim):
>
> "En las fichas de adhesion, si la situacion es M, el color de la ficha en vez de blanco deberia ser un
> rojito pastel que no rompa mucho los ojos. Tambien en la grilla de contactos, si un contacto tiene una
> ficha de adhesion con situacion M, esta linea tambien tiene que estar en ese mismo rojo. Ademas,
> cuando se entra a la ficha, deberia decir este mensaje escrito en la ficha (CONTACTO SUSPENDIDO POR
> MOROSIDAD... etc), como en la imagen."
>
> **Corrección del usuario en la misma sesión**: *"Perdon, me confundi, era en contacto no ficha
> adhesion. Iria en rojo tanto la fila de la grilla, como la card del contacto desplegada"*. El cartel
> va *"al desplegar el contacto moroso en la grilla"*.

### Contexto relevado (2026-08-02)

**`Situacion` es un campo del Contacto**, no de la ficha de adhesión. Vive en `Agenda.cs:26`
(`Contacto.Situacion`, `string?`) con el catálogo
`['F','M','R','V','S','SM','CEN','ICE','PC','CA','PI','FA','OOPP']`
(`agenda-nuevo.component.ts:256`). `AdhesionLocal` (la ficha) **no tiene** campo situación — de ahí que
el pedido original se haya corregido.

**Los morosos sí se listan.** `ContactosController.SituacionesExcluidasListado` (`:29`) excluye
`s`, `cen`, `r`, `f`, `v` del listado paginado; `m` no está entre ellas.

**Dónde está el dato hoy:**

| Vista | ¿Tiene `situacion`? |
|---|---|
| Fila de la grilla (`items()`) | **No** — `ContactoListado` no lo expone (backend `:41-44`, TS `:115-120`) |
| Card desplegada (`detalle()`) | Sí — `toggle(id)` hace `svc.get(id)`, que devuelve el `Contacto` completo |
| Cartel al desplegar | Sí — mismo origen que la card |

**Estilos existentes que la feature debe respetar** (`agenda-listado.component.ts:302-307`):

```css
tr.clickable:hover  { background:#f5f8ff; }
tr.selected         { background:#e6efff !important; }   ← pisa cualquier color de fila
tr.detalle-row > td { background:#fafbfd; }
.detalle-section    { background:#fff; }
```

El `!important` del estado seleccionado es el conflicto principal: al desplegar un contacto moroso —
exactamente cuando el operador va a actuar — el azul taparía el rojo.

**Texto del cartel** (imagen de referencia, en rojo):
`**** CONTACTO SUSPENDIDO POR MOROSIDAD, CONSULTAR CON CCH ANTES DE REALIZAR CUALQUIER GESTIÓN ****`

## Objectives

- [ ] La fila de un contacto moroso se distingue a simple vista en la grilla, sin abrir nada
- [ ] La card desplegada usa el mismo rojo, incluso con la fila en estado seleccionado
- [ ] Al desplegar un contacto moroso se muestra la advertencia de suspensión con la acción a tomar
- [ ] El rojo es pastel y no cansa la vista en listados largos

## Out of Scope

- **Fichas de adhesión** (`/agenda/:id/fichas`, `/adhesiones`): el usuario corrigió el pedido; el
  resaltado va en contacto, no en ficha.
- **Editor de contacto** (`/agenda/:id`): no se pidió resaltado ni cartel ahí.
- **Modelo de datos**: `Situacion` ya existe; no se agregan campos ni migraciones.
- **Reglas de negocio**: la feature es informativa. No bloquea ni condiciona ninguna acción sobre el
  contacto moroso.
- **Otras situaciones del catálogo**: sólo `'M'` recibe tratamiento visual.
- **Filtrar u ordenar por situación**: no se agrega control de filtro.
- **Modo oscuro del resto de la grilla**: `tr.clickable:hover`, `tr.selected` y `tr.detalle-row` usan
  colores claros hardcodeados sin variante `html.dark`. Es una inconsistencia **preexistente** que esta
  feature no introduce ni corrige; se registra en backlog.

## User Stories

### US-1: Detectar morosos de un vistazo en la grilla

**As a** operador de la agenda partidaria
**I want to** ver resaltadas las filas de los contactos morosos
**So that** identifico a quién no debo gestionar sin consultar antes, sin abrir cada contacto

#### Acceptance Criteria

- **AC-1**: La fila de un contacto con `situacion = 'M'` se renderiza con fondo `#FDECEA` en lugar de
  blanco.
- **AC-2**: La fila de un contacto con cualquier otra situación, o sin situación, mantiene el fondo por
  defecto.
- **AC-3**: Al pasar el mouse sobre una fila morosa, el hover no la devuelve al celeste `#f5f8ff` del
  resto de la tabla.
- **AC-4**: Al desplegar un contacto moroso, la fila **conserva** el fondo rojo — el azul de
  `tr.selected` no lo pisa — y suma una barra vertical a la izquierda que indica que está expandida.
- **AC-5**: Al desplegar un contacto **no** moroso, la fila sigue usando el azul de selección de
  siempre.
- **AC-6**: El resaltado no altera el ancho, alto ni alineación de la fila respecto de las demás.

### US-2: Advertencia explícita al desplegar el contacto

**As a** operador de la agenda partidaria
**I want to** ver un cartel de suspensión al desplegar un contacto moroso
**So that** sé qué hacer —consultar con CCH— y no sólo que "algo pasa" con ese contacto

#### Acceptance Criteria

- **AC-7**: Al desplegar un contacto moroso, la card muestra el texto exacto
  `**** CONTACTO SUSPENDIDO POR MOROSIDAD, CONSULTAR CON CCH ANTES DE REALIZAR CUALQUIER GESTIÓN ****`
- **AC-8**: El cartel se ubica al principio del área desplegada, antes de las secciones de datos, de
  modo que se lea sin scrollear.
- **AC-9**: El cartel no aparece al desplegar un contacto no moroso.
- **AC-10**: El fondo del área desplegada (`tr.detalle-row > td`) y el de sus secciones internas
  (`.detalle-section`) usan el rojo pastel en lugar de `#fafbfd` / `#fff`.
- **AC-11**: El texto del cartel y el de los datos mantienen contraste suficiente (WCAG AA, ≥4.5:1)
  sobre el fondo rojo.

## Business Rules

- **BR-1**: Un contacto es moroso cuando su `situacion`, ignorando mayúsculas/minúsculas y espacios
  alrededor, es igual a `'M'`. La comparación es laxa a propósito: el backend ya normaliza con
  `.Trim().ToLower()` para su propio filtro de exclusión (`ContactosController.cs:39`), lo que indica
  que los datos migrados no son consistentes en formato.
- **BR-2**: El resaltado aplica a la fila de la grilla y al área desplegada, con el mismo color base
  `#FDECEA`.
- **BR-3**: El estado "moroso" tiene prioridad visual sobre el estado "seleccionado". La expansión se
  comunica con una barra lateral, no reemplazando el color.
- **BR-4**: El cartel usa el texto literal de la referencia, incluidos los asteriscos.
- **BR-5**: La feature es puramente informativa: no deshabilita botones, no bloquea navegación ni
  condiciona el guardado.

## Edge Cases

- **EC-1** — *Contacto sin situación* (`null`, `undefined` o `''`): no se resalta ni muestra cartel.
- **EC-2** — *Situación con formato irregular* (`'m'`, `' M '`, `'m '`): cuenta como moroso por BR-1.
- **EC-3** — *Fila morosa + hover*: cubierto por AC-3.
- **EC-4** — *Fila morosa + seleccionada*: cubierto por AC-4 y BR-3.
- **EC-5** — *El backend todavía no expone `situacion`*: el campo llega `undefined`, ninguna fila se
  resalta y la grilla funciona igual que hoy. La card desplegada **sí** se resalta, porque su dato viene
  de `GET /contactos/{id}`. Degradación parcial y silenciosa, sin errores.
- **EC-6** — *Modo oscuro*: `#FDECEA` sobre tema oscuro queda como una banda clara que rompe el
  contraste del texto. Necesita variante `html.dark` propia.
- **EC-7** — *El contacto deja de ser moroso mientras la grilla está abierta*: el color se actualiza
  recién al recargar el listado. Aceptado — no hay push ni polling en la grilla.
- **EC-8** — *Muchos morosos consecutivos*: el tono elegido es el más suave de los evaluados
  justamente para que un bloque de filas rojas siga siendo legible.

## Riesgo aceptado

**El color es el único indicador en la fila.** Se evaluó sumar un badge "MOROSO" o un ícono de
advertencia y el usuario optó por sólo color. Para daltonismo rojo-verde (~8% de los varones) la fila
morosa será indistinguible en la grilla; la información sigue siendo accesible al desplegar el contacto,
donde el cartel de texto la comunica sin depender del color. Decisión consciente, registrada acá para
que no se relea como omisión.

## Success Metrics

- Un operador identifica a los morosos de la grilla sin abrir ningún contacto
- El cartel comunica la acción a tomar (consultar con CCH), no sólo el estado
- Ningún moroso queda sin resaltar por diferencias de formato en el dato (`'m'` vs `'M'`)

## Feature Dependencies

- **Backend `029-contactos-morosos-resaltado`**: expone `Situacion` en el record `ContactoListado`.
  Sin eso, US-1 no puede cumplirse (US-2 sí, ver EC-5).
