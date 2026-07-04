# Technical Specification: Fix campos condicionales que borran datos sin aviso

**Status**: Draft
**Created**: 2026-07-04

## Architecture Overview

Se mueve el "clearing" de campos condicionales del momento del *cambio de selección*
al momento del *guardado*. Las funciones `applyX` dejan de borrar (solo setean el
campo disparador); se agrega una función pura `sanitizarFichaParaGuardar` que aplica
las reglas de limpieza (BR-1/BR-2) y se invoca en `guardar()` de ambos componentes
padre antes del POST/PUT.

## Archivos afectados

- `src/app/shared/adhesiones/ficha-adhesion.constants.ts`
  - `applySistContrib(f, s)` → `{ ...f, sistContrib: s }` (sin borrar).
  - `applyAporteTodo(f, v)` → `{ ...f, aporteTodoAlPartido: v }` (sin borrar).
  - **nueva** `sanitizarFichaParaGuardar(f)` con las reglas de limpieza que hoy
    viven dispersas en `applyX`.
- `src/app/features/adhesiones/nueva-ficha.component.ts` — `guardar()`: sanear antes de `createLocal`.
- `src/app/features/adhesiones/fichas-contacto.component.ts` — `guardar()`: sanear antes de `updateLocal` (y reflejar en el signal).
- `src/app/shared/adhesiones/ficha-adhesion.constants.spec.ts` — reescribir los tests de
  `applyX` (ahora preservan) y agregar tests de `sanitizarFichaParaGuardar`.

## Diseño de la función de saneo

```ts
/** Quita los campos condicionales que no aplican al estado FINAL de la ficha.
 *  Se llama al guardar, no al cambiar una selección, para no perder datos por
 *  toques transitorios (fix 009). El resultado persistido equivale al previo. */
export function sanitizarFichaParaGuardar(f: FichaAdhesionDetalle): FichaAdhesionDetalle {
  const next: FichaAdhesionDetalle = { ...f };
  if (!showTelefonoAntel(next.sistContrib)) next.telefonoAntel = undefined;
  if (!showCedula(next.sistContrib))        next.cedulaResponsable = undefined;
  if (!showFechasPago(next.sistContrib))  { next.fechaVencimiento = undefined; next.fechaUltimoPago = undefined; }
  if (next.aporteTodoAlPartido) {
    next.sector = undefined;
    next.aporteSecretariaAgrupacion = undefined;
    next.aporteAgrupacion = undefined;
    next.departamentoAgrupacion = undefined;
    next.codigoAgrupacion = undefined;
  }
  return next;
}
```

## Integración en los padres

`nueva-ficha.guardar()`:
```ts
normalizarFechaSalida(f);
const limpia = sanitizarFichaParaGuardar(f);
this.adhSvc.createLocal(limpia).subscribe(...);
```
`fichas-contacto.guardar()`:
```ts
normalizarFechaSalida(f);
const limpia = sanitizarFichaParaGuardar(f);
this.detalle.set({ ...limpia });
this.adhSvc.updateLocal(limpia).subscribe(() => { this.original = JSON.parse(JSON.stringify(limpia)); ... });
```

## Impacto en el componente de formulario

`ficha-adhesion-form.component.ts` no requiere cambios de lógica: los handlers ya
llaman `applyX` (que ahora solo setean). Las condiciones `@if (showCedula(...))` etc.
siguen ocultando los campos; los valores permanecen en el modelo hasta guardar.

## Error Handling

> Sin nuevos caminos de error. Funciones puras + una llamada extra antes del HTTP existente.

## Non-Functional Requirements

- Performance: despreciable (una copia de objeto extra al guardar).
- Testing (production): unit tests de `sanitizarFichaParaGuardar` (limpia lo que no
  aplica en ambas dimensiones) y de `applySistContrib`/`applyAporteTodo` (ahora
  preservan). Verificación con `ng test` (Karma/Jasmine, ChromeHeadless) + `ng build`.
- Regresión: el resultado guardado debe ser equivalente al comportamiento previo.
