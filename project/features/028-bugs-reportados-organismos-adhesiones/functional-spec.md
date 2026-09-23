# Functional Specification: Editar referencias partidarias y validar dígito verificador

**Status**: Draft
**Created**: 2026-09-22

## Problem Statement

Espejo frontend de la feature backend `031-bugs-reportados-organismos-adhesiones`. Cubre los dos
reportes que se resuelven en la UI: **#3 (editar referencias partidarias)** y **#4 (dígito verificador
bloqueante)**.

> Reporte del usuario (2026-09-22, verbatim):
>
> "3) No se pueden editar las referencias partidarias. 4) En nuevo contacto, el digito verificador de la
> cedula debería ser bloqueante (si no es correcto no se deberia poder guardar)."

### Validación (2026-09-22)

**#3 — No se pueden editar las referencias partidarias.** ✅ Confirmado, y el backend ya está listo.

| Capa | Estado |
|---|---|
| `PUT /api/organismos/referencias/{id}` | **Existe** (`OrganismosController.cs:478`), acepta `Rol`, `Periodo`, `FechaDesignacion`, `FechaCese`, `Art44`, `Notas` |
| `POST /api/organismos/referencias` | **Existe** (`:461`) |
| `referencias-contacto.component.ts` | **0 botones** — sólo lectura |
| `referencias-organismo.component.ts` | **0 botones** — sólo lectura |

Las vistas se crearon read-only a propósito en la feature 028 del frontend ("endpoints read-only por
contacto/organismo"). El resultado es que el operador ve el histórico pero no puede corregirlo, aunque
la API lo permita.

Las dos vistas se alcanzan desde:
- `/agenda/:contactoId/referencias` — botón "Ver referencias partidarias" en la grilla de Agenda
- `/organismos/:organismoId/referencias` — botón en la grilla de Organismos

**#4 — El dígito verificador no se valida.** ✅ Confirmado.

No existe validación de DV **en ningún lado**, ni en el front ni en el backend. El único control del
formulario de contacto es `pattern="^[0-9]{7,8}$"` (`agenda-nuevo.component.ts`), que acepta cualquier
número de 7 u 8 dígitos.

El algoritmo estándar uruguayo se verificó contra las cédulas reales de la base: **10.361 de 10.696
(96,9%) son válidas**, lo que confirma que el algoritmo es correcto. Las **335 restantes (3,1%)** están
mal cargadas, y eso condiciona la regla de edición (BR-4).

## Objectives

- [ ] El operador puede corregir una referencia partidaria desde la UI
- [ ] No se puede guardar un contacto nuevo con cédula de dígito verificador inválido
- [ ] El error de cédula se entiende sin adivinar qué está mal
- [ ] Los 335 contactos con cédula inválida ya cargados siguen siendo editables

## Out of Scope

- **Crear referencias partidarias desde la UI**: el endpoint `POST` existe, pero el alta manual no fue
  reportada como problema. La feature backend además las genera automáticamente al finalizar un
  integrante.
- **Eliminar referencias**: no reportado, y el backend no expone `DELETE` para referencias.
- **Corregir las 335 cédulas inválidas existentes**: la feature impide que entren nuevas.
- **Validación de DV en otros formularios** (adhesiones web, padrón): sólo el formulario de contacto.
- **Bugs #1 y #2**: se resuelven íntegramente en el backend espejo.

## User Stories

### US-1: Corregir una referencia partidaria

**As a** operador de la agenda partidaria
**I want to** editar los datos de una referencia partidaria
**So that** puedo corregir un cargo, un período o una fecha de cese mal cargada sin pedir intervención
técnica

#### Acceptance Criteria

- **AC-1**: En `/agenda/:contactoId/referencias`, cada fila ofrece una acción "Editar".
- **AC-2**: Al editar se pueden modificar `rol`, `periodo`, `fechaDesignacion`, `fechaCese`, `art44` y
  `notas` — los campos que acepta `PUT /organismos/referencias/{id}`.
- **AC-3**: Al guardar, se llama al `PUT` y la fila refleja los datos nuevos sin recargar la página.
- **AC-4**: Cancelar descarta los cambios y deja la fila como estaba.
- **AC-5**: Un error del backend se muestra al operador sin perder lo que había escrito.
- **AC-6**: La vista de organismo (`/organismos/:organismoId/referencias`) ofrece la misma capacidad,
  para no dejar dos pantallas del mismo dato con distinto comportamiento.

### US-2: La cédula inválida no se puede guardar

**As a** operador que da de alta contactos
**I want to** que el formulario impida guardar una cédula cuyo dígito verificador no cierra
**So that** no entran cédulas mal tipeadas que después nadie puede corregir

#### Acceptance Criteria

- **AC-7**: En el alta, con una cédula de DV inválido, el botón Guardar no persiste el contacto.
- **AC-8**: Se muestra un mensaje que explica que el dígito verificador no es correcto, no un genérico
  "formato inválido".
- **AC-9**: Con una cédula de DV válido, el alta funciona como hoy.
- **AC-10**: Sin cédula (campo vacío), el alta funciona — la cédula es opcional.
- **AC-11**: El error aparece al terminar de escribir la cédula, no recién al presionar Guardar.
- **AC-12**: En edición, si el operador **no toca** la cédula, puede guardar otros cambios aunque la
  cédula existente sea inválida.
- **AC-13**: En edición, si el operador **modifica** la cédula y queda inválida, no puede guardar.

## Business Rules

- **BR-1**: Una cédula es válida si su dígito verificador cierra según el algoritmo uruguayo:
  multiplicadores `2,9,8,7,6,3,4` sobre los 7 dígitos (normalizando con ceros a la izquierda),
  `DV = (10 − suma mod 10) mod 10`.
- **BR-2**: La cédula sigue siendo **opcional**. La validación aplica sólo cuando hay valor.
- **BR-3**: La validación de DV **no reemplaza** al `pattern` existente: una cédula debe cumplir ambas.
- **BR-4**: En edición, la validación bloquea **sólo si el campo fue modificado**. Es lo que mantiene
  editables a los 335 contactos con cédula inválida ya cargados.
- **BR-5**: Las dos vistas de referencias (por contacto y por organismo) ofrecen la misma capacidad de
  edición.

## Edge Cases

- **EC-1** — *Cédula de 7 dígitos*: se normaliza con cero a la izquierda antes de calcular el DV.
- **EC-2** — *Cédula incompleta mientras se tipea*: no se muestra error hasta que tenga largo válido;
  marcar en rojo a los 3 dígitos sería ruido.
- **EC-3** — *Contacto existente con cédula inválida, sin tocar el campo*: guarda sin problema (BR-4,
  AC-12).
- **EC-4** — *Contacto existente con cédula inválida, el operador la corrige*: se valida la nueva.
- **EC-5** — *Referencia sin organismo*: el modelo permite `OrganismoId` null, pero el `PUT` valida
  `EnsureOrganismoPartidario`. Definir en el spec técnico si el formulario permite dejarlo vacío.
- **EC-6** — *Guardar una referencia mientras otra está en edición*: definir si se permite editar varias
  filas a la vez o sólo una.
- **EC-7** — *Fecha de cese anterior a la de designación*: no hay validación hoy. **Decisión asumida**:
  no se agrega en esta feature; no fue reportado. *Registrado como posible deuda.*

## Success Metrics

- El operador corrige una referencia mal cargada sin intervención técnica
- Cero cédulas con DV inválido ingresadas después del despliegue
- Los 335 contactos con cédula inválida siguen editables

## Feature Dependencies

- **Backend `031-bugs-reportados-organismos-adhesiones`**: agrega la validación de DV server-side (400)
  y genera las referencias al finalizar un integrante. El `PUT` que necesita US-1 **ya existe**, así que
  el #3 no depende del backend para salir.
