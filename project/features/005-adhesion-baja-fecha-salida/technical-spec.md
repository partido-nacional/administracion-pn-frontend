# Technical Specification: Adhesión — Baja y fecha de salida

**Status**: Draft
**Created**: 2026-07-04

## Architecture Overview

> Componentes standalone Angular 17 con signals. El cambio es 100% frontend, en la feature `adhesiones`. Se elimina el `window.prompt` de `onConfirmadoChange` y se captura la fecha de salida con un `<input type="date">` inline, garantizando que el `<select>` de "Confirmado" nunca quede desincronizado del modelo.

## API Contract

Sin cambios. Se sigue usando el contrato existente de fichas de adhesión (campos `aporteConfirmado: bool|null` y `fechaSalida: string|null`).

## Data Model & Storage

Sin cambios de modelo. Solo se ajusta cómo se puebla `fechaSalida` y cuándo se aplica `aporteConfirmado = false` en el estado local del componente (signal `detalle`/`ficha`).

## Enfoque de implementación

- **Estado del control**: mantener el `<select>` "Confirmado" siempre en sync con el modelo. Como el binding es one-way (`[ngModel]` + `(ngModelChange)`), tras cualquier rama que no aplique el cambio hay que re-emitir el signal para que Angular reescriba el control a su valor real (evita el "Baja fantasma").
- **Captura de fecha inline**: al pasar a "Baja", mostrar el bloque `@if (aporteConfirmado === false)` (ya existente, `fichas-contacto.component.ts:157`) con un `<input type="date">` bindeado a `fechaSalida`. Prellenar con `fechaSalida` previa o `hoy`.
- **Confirmación diferida del estado**: `aporteConfirmado = false` se considera válido solo cuando hay `fechaSalida` con formato `YYYY-MM-DD`. Mientras no la haya, el control debe volver al valor previo.
- **Deduplicación**: extraer la lógica compartida (`onConfirmadoChange` y helpers relacionados) a un único lugar reutilizable por `FichasContactoComponent` y `NuevaFichaComponent` (helper/función o pequeña clase base), sin arrastrar el resto del componente.

## Archivos afectados

- `src/app/features/adhesiones/fichas-contacto.component.ts` (handler `onConfirmadoChange` `:259-275`, template select `:151` + bloque `:157`).
- `src/app/features/adhesiones/nueva-ficha.component.ts` (handler `:209-225`, template equivalente).
- (posible) nuevo archivo compartido en `src/app/features/adhesiones/` para la lógica común.
- `project/specs/features/adhesiones.md` (actualizar la descripción de `onConfirmadoChange` y el ítem de deuda del prompt nativo).

## Error Handling

| Situación | Comportamiento |
|-----------|----------------|
| Fecha de salida vacía o inválida | No se aplica "Baja"; el select vuelve al valor previo; feedback visual (input marcado/hint), sin descarte silencioso. |
| Cambio a Activa/Pendiente | `fechaSalida` se limpia. |

## Non-Functional Requirements

- Performance: sin impacto (cambios de UI local).
- Security: sin impacto.
- Consistencia: comportamiento idéntico en ambos componentes; sin `window.prompt`.
- Tests: unit tests (Karma/Jasmine ya montado en feature 002) que cubran el desync y la captura de fecha en al menos un componente.
