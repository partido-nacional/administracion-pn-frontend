# Feature 017 — Quitar Padrón Electoral de Agenda (frontend)

Se eliminó la tab "Padron Electoral" de la vista Agenda (`agenda-listado.component.ts`): era un
placeholder ("proximamente") sin contenido. El Padrón Electoral funcional vive en Agrupaciones (intacto).

## Cambio
- `type Tab`: quitado `'padron'`.
- Quitados el link de la tab y el bloque `@if (tab()==='padron')`.

## Verificación
- `ng build --configuration production` sin errores. 142 tests verdes. Sin backend.
