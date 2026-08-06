# Feature 027 — Acciones de la grilla de Adhesiones

**Estado**: Completada · **Fecha**: 2026-08-02 · **Rama**: `fix/adhesiones-acciones-y-detalle`
**Tipo**: bugfix de UI

## Qué se arregló

1. **Las acciones no parecían accionables.** Eran `<a class="action-link">`: texto azul que sólo se
   subraya al hover. Ahora son `<button class="btn btn-sm">`, con `btn-danger` para Eliminar.
2. **"Detalle" no hacía nada.** No era un bug de lógica: el elemento **no tenía handler `(click)`**.
   Markup muerto. Eliminado.

## La pregunta del usuario, respondida

> *"detalle no hace nada, es porque en la vista de row ya esta toda la data?"*

**Sí.** `AdhesionWebDto` devuelve 15 campos y la grilla renderiza 14. El único que falta es `estado`, y
el endpoint filtra `Estado == "Pendiente"` (`AdhesionesController.cs:50`): es **constante** en todas las
filas de esa pestaña, no aporta nada.

En la entidad hay 3 campos que el DTO no expone —`Localidad`, `IdentificadorFormulario`,
`AdhesionLocalId`— pero sólo `Localidad` tendría valor real, y exponerla requería backend. Se optó por
eliminar Detalle.

## Alcance

- **Las dos pestañas** (Web y Locales) de la pantalla. Dejar una con botones y la otra con links habría
  sido peor que el estado original.
- **No se tocó** la clase global `.action-link` (`styles.css:757`): sigue en uso en débitos,
  convencionales y productos. Unificar la app entera se evaluó y quedó fuera de alcance.

## Detalles de implementación

- `.action-group` global usa `gap:12px`, pensado para links de texto; entre botones queda holgado. Se
  ajustó a `6px` **en los estilos del componente**, no en `styles.css`, para no arrastrar a las otras
  tres pantallas.
- `flex-wrap:nowrap` + `white-space:nowrap` para que los dos botones de la fila Web no se apilen.

## Tests

`adhesiones-listado.component.spec.ts` es **nuevo** — el componente no tenía spec. 9 tests.

**Se verificó que los tests tienen dientes**: reintroduciendo el `Detalle` muerto, **7 de los 9 fallan**,
incluido el de "ningún control de acción queda sin handler". Ese es el que habría detectado el bug
original, y es la razón de que exista: un `<a>` sin `href` no se distingue visualmente de uno con
comportamiento.

Suite completa: **218/218**.

## Verificación visual

Contra la app real con 8 adhesiones pendientes en la base:

| | Con el fix | Original |
|---|---|---|
| Ancho de tabla | 1679px | 1651px |
| Columna de acciones | 171px | 143px |
| Contenedor scrollea | no | no |
| Página scrollea horizontal | sí | **sí** |

El scroll horizontal de página **ya existía** (la grilla tiene 15 columnas): no lo introdujo esta
feature. La columna de acciones creció 28px sin desbordar el contenedor.
