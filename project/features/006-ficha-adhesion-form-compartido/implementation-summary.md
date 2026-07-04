# Implementation Summary — 006-ficha-adhesion-form-compartido

- **Duración**: 2026-07-04 (mismo día — spec → plan → build → merge → finish).
- **Tipo de proyecto**: production.
- **Tareas**: 11/11 completadas.
  - Layer 1 (implementación): 8 — módulo puro + tests, rewire de ambos componentes, componente de formulario + tests.
  - Layer 2 (quality): 3 — code / performance / security review, 0 hallazgos.
- **Estrategia**: batched (fase 1 → fase 2 → quality).
- **Complejidad**: 1×H (componente presentacional), resto M/L.
- **Tests**: 61 en verde (Karma headless). Cobertura alta sobre el módulo nuevo (funciones puras + util + componente).
- **Impacto de código**: −368 líneas netas en los dos componentes de adhesiones; lógica consolidada en `shared/adhesiones/`.

## Reconciliación de merge (develop)

Al mergear `develop` apareció un cambio de comportamiento paralelo (TODO-012: baja de adhesión sin `window.prompt`, fecha de salida prellenada y editable inline, con `normalizarFechaSalida` al guardar). Se **adoptó ese comportamiento** dentro de la estructura compartida: se descartó el `applyConfirmado`+prompt propio y se reutilizó/reubicó `confirmado-baja.util.ts` a `shared/adhesiones/`. Colisión de numeración de feature (develop archivó `005-adhesion-baja-fecha-salida`) resuelta renumerando esta feature a **006**.

## Seguimiento

- DEBT-007 sigue abierto (cableado a `/api/catalogos/*`); esta feature dejó las listas unificadas como paso previo.
