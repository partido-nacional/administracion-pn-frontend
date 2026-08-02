# Functional Specification: Cortesías y Depto. Credencial

**Status**: Draft
**Created**: 2026-08-02

## Problem Statement

Dos correcciones reportadas sobre el formulario de alta/edición de Contacto (`/agenda/nuevo`, `/agenda/:id`):

1. **Catálogo de cortesías desactualizado.** El selector ofrece 11 tratamientos que no coinciden con el
   catálogo oficial del sistema de referencia del partido, que tiene 28. Faltan tratamientos de uso
   corriente (`Arq.`, `Cnel.`, `Ec.`, `Mtra.`, `Psic.`, `QF.`, `Soc.`, `Tte. Gral.`, las variantes
   `Dr. Esc.` / `Dra. Esc.` / `Ing. Agr.` / `Ing. Agrim.` / `Ec. Cr.`, y los retiros `Cnel. (R)` /
   `Gral. (R)`), lo que obliga a dejar el campo vacío o a elegir un tratamiento incorrecto.

2. **Departamento Credencial editable cuando no debería.** La feature previa
   `contactos-mejoras-credencial-y-listado` desbloqueó el campo para que fuera editable de forma
   independiente. El usuario indica que fue un error: el departamento credencial **se deriva de la
   credencial** y sólo debe poder tocarse cuando no hay credencial cargada. Hoy es posible guardar un
   contacto con credencial `ABC123456` (Montevideo) y departamento credencial `Rocha`.

> Pedido original del usuario (2026-08-02, verbatim):
>
> "Te voy a pasar algunos fixes para hacer. Primero, las cortesias en todos lados estan con los
> siguientes valores: [imagen 1] cuando deberian ser las de estas 2 imagenes: [imagen 2] y [imagen 3].
> Luego el otro dia en contacto o adhesion, no recuerdo exacto, te dije que el departamento credencial
> deberia ser modificable. Me equivoque, el depto credencial SOLO es modificable si NO hay credencial.
> Una vez se indica una credencial (tanto en edicion como creacion), el depto credencial se toma de esta
> y queda bloqueado."

### Contexto relevado (2026-08-02)

**Alcance real.** El único punto del sistema donde se **editan** cortesía y departamento credencial es
`src/app/features/agenda/agenda-nuevo.component.ts` (alta y edición de Contacto). El resto del front
—Listados, ficha de detalle, comparador de duplicados— sólo **muestra** los valores guardados.
Adhesiones no expone ninguno de los dos campos. El backend define `Cortesia` y `DepartamentoCredencial`
como `string?` libres, sin catálogo ni validación, y se confirmó dejarlo así.

**Cortesías actuales** (11 + vacío) — `agenda-nuevo.component.ts:42-44`:
`Sr.` · `Sra.` · `Srta.` · `Dr.` · `Dra.` · `Ing.` · `Lic.` · `Esc.` · `Cr.` · `Cra.` · `Prof.`

**Cortesías objetivo** (28 + vacío, orden alfabético) — imágenes 2 y 3:

| # | Valor | # | Valor | # | Valor | # | Valor |
|---|---|---|---|---|---|---|---|
| 1 | `Arq.` | 8 | `Dra.` | 15 | `Ing.` | 22 | `Prof.` |
| 2 | `Cnel.` | 9 | `Dra. Esc.` | 16 | `Ing. Agr.` | 23 | `Psic.` |
| 3 | `Cnel. (R)` | 10 | `Ec.` | 17 | `Ing. Agrim.` | 24 | `QF.` |
| 4 | `Cr.` | 11 | `Ec. Cr.` | 18 | `Lic.` | 25 | `Soc.` |
| 5 | `Cra.` | 12 | `Esc.` | 19 | `Mag.` | 26 | `Sr.` |
| 6 | `Dr.` | 13 | `Gral.` | 20 | `Mtra.` | 27 | `Sra.` |
| 7 | `Dr. Esc.` | 14 | `Gral. (R)` | 21 | `Mtro.` | 28 | `Tte. Gral.` |

Confirmado con el usuario que la fila tapada por el combo en la imagen 2 es la **opción vacía**, no un
valor. Diferencia neta: entran 18 valores nuevos, sale `Srta.` (sin migración de datos en BD).

**Depto. Credencial hoy** — `agenda-nuevo.component.ts:66-70` (select habilitado) y
`onCredencialInput()` `:253-267`, que sólo *sugiere* el departamento a partir de la primera letra vía
`credencialMap` (`:246-251`, cubre `A`–`T`). El comentario en `:261-262` documenta explícitamente la
decisión que ahora se revierte.

**Deuda de spec detectada.** `project/specs/features/agenda.md:207` todavía documenta el comportamiento
anterior (`departamentoCredencial no editable: select disabled`) — nunca se actualizó cuando la feature
previa lo desbloqueó. Al cerrar esta feature el spec queda alineado con el código.

## Objectives

- [ ] El selector de Cortesía ofrece exactamente los 28 valores del catálogo oficial + la opción vacía
- [ ] Ningún contacto puede guardarse con credencial y un departamento credencial que no derive de ella
- [ ] El Departamento Credencial sigue siendo editable cuando el contacto no tiene credencial
- [ ] Ninguna cortesía ya guardada se pierde en silencio al editar un contacto
- [ ] `project/specs/features/agenda.md` queda sincronizado con el comportamiento final

## Out of Scope

- **Backend**: no valida cortesía ni deriva el departamento credencial; se confirmó no tocarlo. La regla
  vive sólo en la UI y la API sigue aceptando cualquier string.
- **Migración de datos**: los contactos con `Srta.` u otras cortesías fuera del catálogo quedan como
  están en BD.
- **Listados / ficha / duplicados**: sólo muestran cortesía, no la editan.
- **Adhesiones**: no expone credencial ni departamento credencial.
- **`credencialMap`**: el mapa letra → departamento no se modifica.

## User Stories

### US-1: Elegir la cortesía correcta

**As a** operador de la agenda partidaria
**I want to** elegir la cortesía de un contacto desde el catálogo oficial del partido
**So that** los tratamientos coincidan con los del sistema de referencia y no queden campos vacíos por
falta de opción

#### Acceptance Criteria

- **AC-1**: Al abrir el alta de contacto, el selector de Cortesía lista exactamente 29 opciones: la
  opción vacía (`—`) primero, seguida de los 28 valores de la tabla del catálogo, en ese orden
  alfabético.
- **AC-2**: `Srta.` no figura entre las opciones seleccionables.
- **AC-3**: Al editar un contacto cuya cortesía guardada pertenece al catálogo, el selector la muestra
  seleccionada.
- **AC-4**: Al editar un contacto cuya cortesía guardada **no** pertenece al catálogo (ej. `Srta.`), el
  selector la muestra seleccionada como una opción adicional al final de la lista; si el operador
  guarda sin tocar el campo, el valor se conserva intacto.
- **AC-5**: Una vez que el operador cambia la cortesía a un valor del catálogo, la opción legacy
  desaparece de la lista y no puede volver a elegirse.
- **AC-6**: La cortesía sigue siendo opcional: guardar con la opción vacía no produce error.

### US-2: Departamento Credencial siempre consistente con la credencial

**As a** operador de la agenda partidaria
**I want to** que el departamento credencial se derive automáticamente de la credencial y quede
bloqueado
**So that** no se pueda registrar un contacto cuya credencial y departamento se contradigan

#### Acceptance Criteria

- **AC-7**: En el alta, con el campo Credencial vacío, el selector de Departamento Credencial está
  habilitado y el operador puede elegir cualquier departamento.
- **AC-8**: Apenas la credencial deja de estar vacía, el selector de Departamento Credencial queda
  deshabilitado.
- **AC-9**: Al escribir una credencial cuya primera letra está en `credencialMap`, el Departamento
  Credencial se setea al departamento correspondiente (ej. `E` → `Rocha`) y muestra ese valor mientras
  está bloqueado.
- **AC-10**: Al abrir la edición de un contacto que ya tiene credencial, el selector de Departamento
  Credencial aparece deshabilitado desde el primer render, sin necesidad de que el operador toque el
  campo Credencial.
- **AC-11**: Al abrir la edición de un contacto sin credencial, el selector aparece habilitado.
- **AC-12**: Al borrar por completo la credencial en edición, el selector vuelve a habilitarse y
  **conserva** el departamento que tenía; el operador puede cambiarlo o dejarlo.
- **AC-13**: El valor del Departamento Credencial se envía al backend aunque el control esté
  deshabilitado (no se pierde al guardar).
- **AC-14**: El campo deshabilitado se distingue visualmente del habilitado y su valor sigue siendo
  legible.

## Business Rules

- **BR-1**: El catálogo de cortesías seleccionables es exactamente el de 28 valores de la tabla, más la
  opción vacía. Es una lista cerrada; no se admite texto libre.
- **BR-2**: Si la cortesía guardada de un contacto no pertenece al catálogo, se ofrece como opción
  adicional **sólo para ese contacto y sólo hasta que el operador la cambie**. Nunca se limpia
  automáticamente.
- **BR-3**: `departamentoCredencial` es editable **si y sólo si** `credencialCivica` está vacía.
  Cualquier valor no vacío en la credencial —incluso un solo carácter mientras se tipea— bloquea el
  campo.
- **BR-4**: Con credencial no vacía, `departamentoCredencial` se deriva de la primera letra de la
  credencial según `credencialMap` (`A`–`T`). La derivación se recalcula en cada cambio de la
  credencial.
- **BR-5**: Al vaciarse la credencial, el campo se desbloquea y **retiene** el último valor derivado. No
  se limpia.
- **BR-6**: La regla es de UI. El backend sigue aceptando cualquier combinación; no se agrega validación
  server-side en esta feature.

## Edge Cases

- **EC-1** — *Cortesía guardada fuera de catálogo*: contacto con `Srta.`. El select la muestra
  seleccionada como opción extra al final (BR-2). Cubierto por AC-4 y AC-5.
- **EC-2** — *Edición con credencial preexistente*: el campo debe abrir bloqueado en el primer render,
  antes de cualquier interacción. El contacto se carga async (`svc.get(id).subscribe`), así que el
  estado bloqueado tiene que derivarse del modelo, no de un evento del input. Cubierto por AC-10.
- **EC-3** — *Borrado de la credencial en edición*: desbloquea y conserva el valor (BR-5). Cubierto por
  AC-12.
- **EC-4** — *Primera letra fuera de `credencialMap`*: el mapa cubre `A`–`T`; `U`–`Z` no se usan en
  credenciales uruguayas pero el `pattern` del campo (`^[A-Z]{3}[0-9]{1,6}$`) las permite. **Decisión
  asumida**: el campo queda bloqueado (hay credencial) y el departamento se **limpia a vacío**, porque
  no puede derivarse de esa credencial y dejar un valor previo produciría exactamente la inconsistencia
  que esta feature elimina. *(Asunción a validar con el usuario; caso prácticamente inalcanzable en
  datos reales.)*
- **EC-5** — *Credencial parcial mientras se tipea*: con 1 o 2 letras ya se deriva el departamento
  desde la primera letra (comportamiento actual, se conserva) y el campo ya está bloqueado.
- **EC-6** — *Cambio de primera letra*: pasar de `ABC123` a `EBC123` re-deriva `Montevideo` → `Rocha`,
  sobrescribiendo el valor anterior sin confirmación.
- **EC-7** — *Contacto sin credencial y sin departamento credencial*: ambos vacíos, campo habilitado; el
  operador puede cargar sólo el departamento. Es el caso que la feature previa buscaba habilitar y se
  mantiene.

## Success Metrics

- Los 28 valores del selector coinciden 1:1 con los del sistema de referencia (verificable contra las
  imágenes)
- Cero contactos nuevos con credencial cuya letra inicial no se corresponde con el departamento
  credencial guardado
- Ninguna cortesía preexistente se pierde por el cambio de catálogo

## Feature Dependencies

- Revierte parcialmente la decisión de la feature `contactos-mejoras-credencial-y-listado` sobre la
  editabilidad de `departamentoCredencial` (comentario en `agenda-nuevo.component.ts:261-262`). El
  matiz nuevo es EC-7: sin credencial, sigue siendo editable.
