# Feature 005 — Adhesión: baja y fecha de salida

## Qué se construyó

Se eliminó el `window.prompt()` que pedía la **fecha de salida** al marcar una ficha de adhesión como **Baja** (`aporteConfirmado = false`), y se corrigió un bug de **desincronización** entre el `<select>` "Confirmado" y el modelo.

### Problema original
- El `<select>` "Confirmado" usa binding one-way (`[ngModel]` + `(ngModelChange)`). Al elegir "Baja", `onConfirmadoChange` abría un `window.prompt`; si el usuario cancelaba o escribía una fecha inválida, el handler hacía `return` **sin** actualizar el modelo ni revertir el control → el desplegable quedaba en "Baja" mientras el dato seguía en el valor anterior y `fechaSalida` vacío ("Baja fantasma"). Al guardar se persistía el estado viejo/incoherente sin aviso.
- Lógica duplicada en `fichas-contacto.component.ts` y `nueva-ficha.component.ts`.

### Solución
- Se quitó el `window.prompt`. La fecha de salida se captura en el `<input type="date">` **inline** que ya existía (bloque `@if (aporteConfirmado === false)`), prellenado con hoy.
- `onConfirmadoChange` ahora **siempre** aplica el estado y re-emite el signal (`set({...f})`), manteniendo el `<select>` sincronizado con el modelo.
- Lógica compartida extraída a `confirmado-baja.util.ts` (`resolverConfirmado`, `hoyISO`), usada por ambos componentes.

## Componentes clave

| Archivo | Rol |
|---|---|
| `src/app/features/adhesiones/confirmado-baja.util.ts` | Helper puro `resolverConfirmado` + `hoyISO` |
| `src/app/features/adhesiones/fichas-contacto.component.ts` | Editor de fichas: handler sin prompt, input inline |
| `src/app/features/adhesiones/nueva-ficha.component.ts` | Alta de ficha: mismo comportamiento |
| `*.spec.ts` (util + fichas-contacto) | Unit tests del flujo |

## API

Sin cambios de backend. Se reutiliza el contrato existente de fichas de adhesión (`aporteConfirmado` + `fechaSalida`).

## Tests

- `confirmado-baja.util.spec.ts` — 5 casos (baja prellena hoy, baja conserva fecha, activa/pendiente limpian, formato de `hoyISO`).
- `fichas-contacto.component.spec.ts` — 4 casos (transiciones + re-emisión de signal / anti-desync).
- Suite total: **39/39** verdes (Karma/Jasmine, ChromeHeadless).

## Seguimiento

- **TODO-012** (backlog, Low): una Baja podría guardarse con `fechaSalida` vaciada manualmente; pre-existente, mitigado por el prellenado.
