# Functional Specification: Adhesión — Baja y fecha de salida

**Status**: Draft
**Created**: 2026-07-04

## Problem Statement

> En la sección adhesiones, al marcar una ficha como "Baja" (Confirmado = D / `aporteConfirmado = false`), el sistema pide la **fecha de salida** con un `window.prompt()` nativo. Esto tiene dos problemas:
> 1. **Bug de desincronización**: el `<select>` de "Confirmado" usa binding one-way (`[ngModel]` + `(ngModelChange)`). Si el usuario cancela el prompt o ingresa una fecha inválida, el handler `onConfirmadoChange` hace `return` sin actualizar el modelo ni revertir el control → el desplegable queda mostrando "D/Baja" mientras los datos siguen en el valor anterior (Activa/Pendiente) y `fechaSalida` queda vacío. Al guardar se persiste el estado viejo/incoherente sin ningún aviso.
> 2. **UX con prompt nativo**: bloqueante, estilo ajeno a la app, validación pobre (solo regex, descarte silencioso), mala experiencia en mobile.
>
> El código está duplicado en `fichas-contacto.component.ts:259` y `nueva-ficha.component.ts:209`.
> Referencia en spec: `project/specs/features/adhesiones.md:146,174,241`.

## Objectives

- [ ] El control "Confirmado" **siempre** refleja el valor real del modelo (sin quedar desincronizado).
- [ ] Capturar la fecha de salida con un input inline dentro de la ficha (no `window.prompt`).
- [ ] Al marcar "Baja" sin fecha válida, el estado no se aplica y el control vuelve a su valor previo.
- [ ] Unificar la lógica entre `FichasContacto` y `NuevaFicha` (sin duplicar).

## Out of Scope

- Cambios en el backend (el contrato `aporteConfirmado` + `fechaSalida` ya existe y no se toca).
- Rediseño general del editor de fichas de adhesión.
- Migrar la feature a la capa de servicios objetivo (DEBT-006/009) más allá de lo mínimo para deduplicar.

## User Stories

### US-1: Dar de baja una adhesión con fecha de salida
**As a** administrador de adhesiones
**I want to** marcar una ficha como "Baja" e indicar la fecha de salida en la misma pantalla
**So that** el estado y la fecha queden registrados correctamente, sin ambigüedad.

#### Acceptance Criteria
- AC-1: Al elegir "D (Baja)" en el select "Confirmado", aparece un campo de fecha (`<input type="date">`) inline, prellenado con `fechaSalida` existente o la fecha de hoy.
- AC-2: Mientras no haya una fecha de salida válida, el estado "Baja" no se confirma en el modelo.
- AC-3: Si el usuario cancela / no completa la fecha, el select vuelve a mostrar el valor anterior (no queda en "Baja" fantasma).
- AC-4: Al cambiar a "S (Activa)" o "- (Pendiente)", `fechaSalida` se limpia.
- AC-5: El comportamiento es idéntico en el editor de fichas existentes y en el alta de ficha nueva.

## Business Rules

- BR-1: `aporteConfirmado` es tri-estado: `true` = Activa, `false` = Baja, `null` = Pendiente.
- BR-2: `fechaSalida` solo tiene sentido cuando `aporteConfirmado = false`; en los otros estados debe ser vacío/nulo.
- BR-3: Formato de fecha de salida: `YYYY-MM-DD`.

## Edge Cases

- EC-1: Usuario abre el date-picker y lo cierra sin elegir → el estado no cambia y el select refleja el valor real.
- EC-2: Ficha que ya venía en "Baja" con `fechaSalida` → se muestra la fecha existente y puede editarse.
- EC-3: Usuario alterna Baja → Activa → Baja: la fecha se limpia y se vuelve a pedir.

## Success Metrics

- Cero casos de fichas guardadas con select "Baja" pero `aporteConfirmado` distinto de `false` (desync eliminado).
- Sin uso de `window.prompt` en el flujo de adhesiones.

## Feature Dependencies

- Ninguna nueva. Reutiliza el contrato existente de fichas de adhesión (`PUT`/`POST` con `aporteConfirmado` + `fechaSalida`).
