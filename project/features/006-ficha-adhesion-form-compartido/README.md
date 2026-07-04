# Ficha Adhesión — Formulario y Handlers Compartidos (006)

## Qué se construyó

Se eliminó la duplicación de lógica de handlers, constantes y markup del **formulario de ficha de adhesión** entre `nueva-ficha` (alta) y `fichas-contacto` (edición en fila expandible), consolidándola en `src/app/shared/adhesiones/`.

## Componentes clave

- **`shared/adhesiones/ficha-adhesion.constants.ts`** — fuente única de `SISTEMAS`/`DEPARTAMENTOS`/`APORTES_SEC_AGR`, helpers `showTelefonoAntel/showCedula/showFechasPago` y funciones puras `applySistContrib`/`applyAporteTodo` (BR-1/BR-2), sin dependencia de Angular.
- **`shared/adhesiones/ficha-adhesion-form.component.ts`** — `FichaAdhesionFormComponent`, presentacional, con `ficha = model.required()` (two-way), `disabled`, `showId` y `sectores`. Contiene el markup condicional del formulario una sola vez.
- **`shared/adhesiones/confirmado-baja.util.ts`** — lógica BR-3 del campo "Confirmado"/baja (`resolverConfirmado`, `normalizarFechaSalida`, `hoyISO`), integrada desde el trabajo paralelo de develop (TODO-012, sin `window.prompt`). Reubicada desde `features/adhesiones/` a `shared/adhesiones/` durante el merge para consolidar.
- **`features/adhesiones/nueva-ficha.component.ts`** y **`fichas-contacto.component.ts`** — pasan a consumir el componente y las funciones compartidas; se redujeron ~368 líneas en conjunto.

## Comportamiento

Sin cambios de backend ni de contrato HTTP. Alta (`createLocal`) y edición (`updateLocal`) preservadas; la baja prellena la fecha de salida y se edita inline (comportamiento nuevo adoptado de develop). `normalizarFechaSalida` garantiza coherencia al guardar.

## Tests

Karma/Jasmine, headless. Suite total **61 tests en verde**:
- `ficha-adhesion.constants.spec.ts` — funciones puras (BR-1/BR-2, no-mutación, EC-1).
- `confirmado-baja.util.spec.ts` — BR-3 (baja/activa/pendiente, coherencia).
- `ficha-adhesion-form.component.spec.ts` — render condicional por sistema, `disabled`, `showId`, two-way, confirmado sin prompt.

## Relación con el backlog

- **DEBT-007** (catálogos hardcodeados/divergentes entre componentes de adhesiones): parcialmente atacado — las listas quedan unificadas en un único lugar; el cableado al endpoint `/api/catalogos/*` sigue pendiente.
- **TODO-012** (baja siempre con fecha de salida): resuelto por develop e integrado aquí sin regresión.
