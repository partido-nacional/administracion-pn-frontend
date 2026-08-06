# Functional Specification: Acciones de la grilla de Adhesiones

**Status**: Approved
**Created**: 2026-08-02

## Problem Statement

> Reporte del usuario (2026-08-02, verbatim):
>
> "otro detalle, en adhesiones pendientes web hay 2 problemas, el primero, en la grilla no hay botones
> sino texto subrayado clickeable. Segundo, detalle no hace nada, es porque en la vista de row ya esta
> toda la data? en ese caso eliminaria el 'boton' detalle. En caso de que si haya mas data, tendria que
> desplegarse la row"

Dos defectos en la pantalla de Adhesiones (`/adhesiones`):

1. **Las acciones no parecen accionables.** Son `<a class="action-link">`: texto azul que sólo se
   subraya al pasar el mouse. No comunican que son operaciones, y algunas son destructivas (Eliminar).
2. **"Detalle" no hace absolutamente nada.** No es un bug de lógica: el elemento
   `<a class="action-link">Detalle</a>` (`:91`) **no tiene handler `(click)`**. Es markup muerto.

### Diagnóstico (2026-08-02)

**Sobre la pregunta del usuario — ¿la fila ya muestra todo?** Sí.

`AdhesionWebDto` devuelve 15 campos y la grilla renderiza **14**. El único que no se muestra es `estado`,
y el endpoint filtra `Estado == "Pendiente"` (`AdhesionesController.cs:50`), así que **es constante en
todas las filas de esa pestaña**: no aporta información.

En la entidad `AdhesionWeb` hay 3 campos que el DTO **no expone**: `Localidad`,
`IdentificadorFormulario` y `AdhesionLocalId`. De esos, sólo `Localidad` tendría valor para el operador;
los otros dos son de sincronización interna y `AdhesionLocalId` es siempre null mientras la adhesión
está pendiente. Exponerlos requeriría cambio de backend.

**Decisión del usuario**: eliminar "Detalle". No hay dato extra que justifique una fila desplegable.

**Sobre el alcance de los botones**: `.action-link` es una clase **global** (`styles.css:757-765`) usada
en 4 pantallas (adhesiones, débitos, convencionales, productos), mientras que 8 pantallas usan
`btn btn-sm`. La app ya está partida en dos patrones. **Decisión del usuario**: cambiar sólo Adhesiones,
en sus **dos** pestañas — dejar una con botones y la otra con links sería peor que el estado actual.

## Objectives

- [ ] Las acciones de la grilla se ven y se comportan como botones
- [ ] La acción destructiva se distingue de las demás
- [ ] Desaparece el elemento "Detalle", que no hacía nada
- [ ] Las dos pestañas de la pantalla quedan consistentes entre sí

## Out of Scope

- **Exponer `Localidad`** (u otros campos) en el DTO: requiere backend y el usuario optó por eliminar
  Detalle en lugar de mostrar más datos.
- **Fila desplegable**: sin datos extra que mostrar, no tiene sentido.
- **Las otras 3 pantallas con `.action-link`** (débitos, convencionales, productos): se evaluó unificar
  toda la app y el usuario acotó el cambio a Adhesiones.
- **Eliminar la clase global `.action-link`**: sigue en uso por esas 3 pantallas.
- **Cambios de comportamiento** de "Pasar a Local" o "Eliminar": sólo cambia su presentación.

## User Stories

### US-1: Acciones que se ven como acciones

**As a** operador de adhesiones
**I want to** ver las acciones de cada fila como botones
**So that** distingo qué puedo hacer sobre cada registro, y no confundo una operación destructiva con
un enlace

#### Acceptance Criteria

- **AC-1**: En la pestaña **Web**, "Pasar a Local" y "Eliminar" se renderizan como `<button>`, no como
  `<a>`.
- **AC-2**: En la pestaña **Locales**, "Eliminar" se renderiza como `<button>`.
- **AC-3**: "Eliminar" usa el estilo destructivo (`btn-danger`), visualmente distinto de las demás.
- **AC-4**: Los botones usan el tamaño chico (`btn-sm`), consistente con las otras 8 pantallas de la app
  que ya usan ese patrón.
- **AC-5**: Las acciones siguen invocando exactamente los mismos métodos que antes (`pasar(a.id)`,
  `eliminarWeb(a.id)`, `eliminarLocal(l.id)`), sin cambio de comportamiento.

### US-2: Sin acciones que no hacen nada

**As a** operador de adhesiones
**I want to** que no haya acciones inertes en la grilla
**So that** no pierdo tiempo clickeando algo que no responde

#### Acceptance Criteria

- **AC-6**: El elemento "Detalle" no existe en el DOM de la pestaña Web.
- **AC-7**: No queda ningún elemento de acción sin handler en ninguna de las dos pestañas.

## Business Rules

- **BR-1**: Ninguna acción de la grilla puede existir sin handler. Un control inerte es peor que su
  ausencia: promete algo que no cumple.
- **BR-2**: Las acciones destructivas se distinguen visualmente de las no destructivas.
- **BR-3**: Las dos pestañas de la pantalla usan el mismo patrón de acciones.

## Edge Cases

- **EC-1** — *Grilla vacía*: el estado vacío no tiene acciones; no cambia.
- **EC-2** — *`colspan` del estado vacío*: la columna de acciones se mantiene, así que el `colspan="15"`
  sigue siendo correcto.
- **EC-3** — *Ancho de la fila*: los botones ocupan más que el texto plano. La columna de acciones no
  debe empujar la tabla ni romper el layout.
- **EC-4** — *Tema oscuro*: `btn-sm`/`btn-danger` ya tienen tratamiento en el tema oscuro, a diferencia
  de `.action-link`.

## Success Metrics

- Ningún control inerte en la pantalla
- El operador distingue "Eliminar" de las demás acciones sin leer el texto

## Feature Dependencies

Ninguna. Cambio contenido en un componente del frontend.
