# Technical Specification: Editar referencias partidarias y validar dígito verificador

**Version**: 1.0
**Status**: Draft
**Created**: 2026-09-22

## Architecture Overview

Dos cambios independientes de UI. Sin rutas nuevas, sin cambios de contrato: el `PUT` que necesita el #3
ya existe en el backend.

### Superficie de cambio

| Archivo | Cambio | Bug |
|---|---|---|
| `src/app/features/organismos/referencias-contacto.component.ts` | acción "Editar" + modal | #3 |
| `src/app/features/organismos/referencias-organismo.component.ts` | ídem (BR-5) | #3 |
| `src/app/core/services/organismos.service.ts` | método `editarReferencia()` | #3 |
| `src/app/core/cedula.ts` | **nuevo** — validación del DV | #4 |
| `src/app/features/agenda/agenda-nuevo.component.ts` | validador en el campo cédula | #4 |
| specs de ambos componentes | tests | #3, #4 |

### Decisiones de diseño

**D-1 — Reutilizar `<app-modal-form>` en vez de inventar un modal.**

`src/app/shared/components/modal-form/` existe desde `DEBT-014`, que unificó el patrón de modal en tres
pantallas. Ya trae backdrop, header, footer con `busy`/`error`/`saveLabel`. Usarlo evita el cuarto
estilo de modal en la app y resuelve AC-5 (mostrar error sin perder lo escrito) sin código propio.

**D-2 — El validador de cédula es un `ValidatorFn` de Angular, no lógica suelta en el componente.**

```ts
export function cedulaValidator(): ValidatorFn
```

El formulario es template-driven (`[(ngModel)]`), así que el validador se expone como directiva o se
aplica vía `[pattern]`-style. La razón de fondo: el mensaje de error tiene que poder distinguir
"formato inválido" (el `pattern` existente) de "dígito verificador incorrecto" (AC-8). Un `if` en
`guardar()` no permite mostrarlo **mientras se escribe** (AC-11).

**D-3 — La validación de DV convive con el `pattern`, no lo reemplaza (BR-3).**

Una cédula debe cumplir ambos: el `pattern ^[0-9]{7,8}$` filtra el formato, el validador de DV la
aritmética. Un valor que no cumple el pattern no llega a evaluarse el DV (EC-10).

**D-4 — En edición, el validador compara contra el valor cargado.**

El componente ya guarda el contacto en `this.c` tras `svc.get(id)`. Se retiene el documento original al
cargar y el validador sólo bloquea si `c.documento !== documentoOriginal`. Es lo que mantiene editables
los 335 contactos con cédula inválida (BR-4, AC-12).

Ojo con el orden: el contacto llega **async**, así que el documento original hay que capturarlo en el
`subscribe`, no en el constructor — el mismo patrón que ya obligó a derivar `depCredBloqueado()` del
modelo en la feature 025.

**D-5 — El algoritmo se duplica entre front y backend, a propósito.**

El backend valida igual (espejo `031`). Es duplicación deliberada: el front necesita feedback inmediato
sin round-trip, el backend necesita no confiar en el cliente. Es el mismo criterio que cualquier
validación de doble capa.

**D-6 — Las dos vistas de referencias comparten el formulario de edición.**

`referencias-contacto` y `referencias-organismo` muestran el mismo dato con distinto filtro. BR-5 exige
la misma capacidad en ambas. El formulario del modal se extrae a un componente compartido o se
replica con el mismo contrato — a decidir en implementación según cuánto difieran las columnas.

## API Contract

Consume endpoints **existentes**, ninguno nuevo:

### PUT /api/organismos/referencias/{id}

```json
{
  "contactoId": 15677,
  "organismoId": 394,
  "rol": "Vocal",
  "periodo": "2020-2025",
  "fechaDesignacion": "2020-03-01",
  "fechaCese": "2026-09-22",
  "art44": false,
  "notas": null
}
```

**Response (200)**: el DTO de la referencia actualizada.

> El endpoint valida `EnsureContacto` y `EnsureOrganismoPartidario`: enviar un organismo de ámbito
> Estatal devuelve error. Ver EC-5.

**Errores**: `404` si la referencia no existe; `400` de validación de dominio.

## Data Model & Storage

Sin cambios de esquema. `ReferenciaPartidaria` (`contactos.service.ts:123-134`) ya expone todos los
campos editables.

Para el `PUT` hace falta `contactoId` y `organismoId`, que el DTO de lectura ya trae.

## External Integrations

Ninguna.

## Error Handling

| Situación | Manejo |
|---|---|
| `PUT` falla | El modal muestra el error y conserva lo escrito (AC-5) — `<app-modal-form>` ya lo soporta vía su input `error` |
| Cédula con DV inválido | Error inline bajo el campo, bloquea el submit (AC-7, AC-8) |
| Cédula que no cumple el `pattern` | Mensaje existente, sin cambios (D-3) |

## Non-Functional Requirements

- **Performance**: el validador corre en cada cambio del campo; es aritmética sobre 8 dígitos.
- **Accesibilidad**: el mensaje de error debe estar asociado al campo, no sólo ser texto rojo suelto.
- **Tema oscuro**: `<app-modal-form>` ya tiene tratamiento (`DEBT-014` movió su CSS a `styles.css`).

## Testing

`project_type: production`.

### `cedula.spec.ts` (#4) — nuevo

| Test | Cubre |
|---|---|
| Cédulas reales válidas pasan | BR-1 |
| Cédulas con el DV alterado fallan | BR-1 |
| Cédula de 7 dígitos se normaliza con cero a la izquierda | EC-1 |
| `null`, `undefined` y `''` son válidos (cédula opcional) | AC-10, BR-2 |
| Valor con caracteres no numéricos no rompe el validador | EC-10 |

### `agenda-nuevo.component.spec.ts` (#4) — **existe**, se extiende

| Test | Cubre |
|---|---|
| Alta con DV inválido: el formulario queda inválido y no llama a `create()` | AC-7 |
| El mensaje distingue DV de formato | AC-8 |
| Alta con DV válido llama a `create()` | AC-9 |
| Alta sin cédula llama a `create()` | AC-10 |
| Edición sin tocar la cédula inválida: llama a `update()` | AC-12, BR-4, D-4 |
| Edición cambiando la cédula a inválida: no llama a `update()` | AC-13 |

### `referencias-contacto.component.spec.ts` (#3) — nuevo

| Test | Cubre |
|---|---|
| Cada fila ofrece "Editar" | AC-1 |
| El modal se abre con los valores de la fila | AC-2 |
| Guardar llama al `PUT` con los campos editados | AC-3 |
| La fila refleja los datos nuevos sin recargar | AC-3 |
| Cancelar descarta los cambios | AC-4 |
| Un error del backend se muestra y conserva lo escrito | AC-5 |

**Comando**: `npx ng test --watch=false --browsers=ChromeHeadless`

## Implementation Notes

- **Riesgo principal: D-4.** El contacto llega async en edición. Si el documento original se captura
  antes del `subscribe`, queda `undefined` y el validador va a creer que **toda** edición cambió la
  cédula — bloqueando justamente los 335 contactos que la regla busca proteger. El test de AC-12 es el
  que lo fija.
- **Verificar en la app real**, no sólo en tests: los dos bugs de fecha de esta misma sesión pasaron los
  tests y fallaron en producción. Probar con un contacto real de los 335 con cédula inválida.
- El `PUT` exige `organismoId` de ámbito Partidario. Si alguna referencia del histórico tiene organismo
  null, el modal debe contemplarlo (EC-5) — verificar contra datos reales antes de implementar.
- `referencias-organismo.component.ts` tiene las mismas columnas salvo que muestra el contacto en vez
  del organismo; confirmar antes de decidir si el formulario se comparte o se replica (D-6).
