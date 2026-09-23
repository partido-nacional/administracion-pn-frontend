# Feature 028 — Editar referencias partidarias y validar dígito verificador

**Estado**: Completada · **Fecha**: 2026-09-22 · **Rama**: `fix/bugs-reportados-sept`
**Espejo**: `administracion-pn-backend` → `031-bugs-reportados-organismos-adhesiones`

Dos de los cuatro bugs reportados: el **#3** y la UI del **#4**. Los otros dos son de backend.

## #3 — No se podían editar las referencias partidarias

El endpoint `PUT /organismos/referencias/{id}` **ya existía** en el backend. Lo que faltaba era la UI:
las dos vistas tenían **0 botones**, se habían creado read-only a propósito en una feature anterior.

Ahora cada fila ofrece **Editar** con un modal (`<app-modal-form>`, el compartido de `DEBT-014`), en
**ambas** vistas — dejar una editable y la otra no habría sido peor que el estado original.

**Bloqueante encontrado durante el build**: ningún DTO de lectura traía `organismoId`, y el `PUT` lo
exige y valida `EnsureOrganismoPartidario`. Se agregó en el backend. La vista por organismo no lo
necesita: lo toma de la ruta.

Se edita sobre una **copia** de la fila: cancelar no toca la grilla, y un error del backend se muestra
sin perder lo escrito.

## #4 — El dígito verificador no bloqueaba

No había validación en ningún lado; el único control era `pattern ^[0-9]{7,8}$`.

| Caso | Comportamiento |
|---|---|
| Alta con DV inválido | bloquea, con mensaje que distingue "dígito verificador" del genérico de formato |
| Alta con DV válido | funciona |
| Alta sin cédula | funciona — el campo es opcional |
| **Edición sin tocar** una cédula inválida | **guarda** |
| Edición cambiando la cédula a inválida | bloquea |

**Por qué esa distinción**: hay **335 contactos (3,1%)** con cédula inválida ya cargados. Validar
siempre los dejaría imposibles de editar — nadie podría corregirles el teléfono sin saber la cédula
real.

## El riesgo que el spec anticipó, y se cumplió

El documento original de la cédula se captura **dentro del `subscribe` de `svc.get()`**. El contacto
llega async: leerlo antes lo dejaría `undefined`, y el validador creería que **toda** edición cambió la
cédula, bloqueando justo a los 335 contactos que la regla protege.

Hay un test dedicado, y **se verificó que falla** si se rompe: reintroduciendo el bug, el test
*"edición SIN tocar una cédula inválida sí llama a update()"* falla.

## Verificación en la app real

Con backend y frontend levantados, Chrome headless vía CDP:

| Caso | Resultado |
|---|---|
| Listado de referencias | 1 fila, 1 botón Editar |
| Modal | abre con los valores de la fila, fechas convertidas a ISO |
| Guardar | persiste (`periodo: 2020-2026`), cierra el modal, refresca la fila |
| Alta con DV inválido | mensaje inline correcto |
| Contacto **real** de los 335 (`id=114`, cédula `13327132`) | carga **sin error**, sigue editable |

## Nota sobre la duplicación del algoritmo

`core/cedula.ts` duplica el algoritmo del backend **a propósito**: acá hace falta feedback inmediato sin
round-trip, allá no se puede confiar en el cliente. Es el criterio de cualquier validación de doble capa.

## Tests

18 nuevos (236/236). Los casos usan **cédulas reales de la base**: al escribirlos asumí que `1234567`
era válida y resultó que no — su DV es `1`, no `7`. Verificar contra datos reales evita escribir una
validación que rechace cédulas legítimas.
