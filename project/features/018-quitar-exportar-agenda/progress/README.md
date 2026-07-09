# Feature 018 — Quitar tab Exportar de Agenda (frontend)

Se eliminó la tab "Exportar" de Agenda (`agenda-listado.component.ts`): era un placeholder
("proximamente"). La exportación real está en el botón 📥 CSV superior (`exportarCsv()`), que se conserva.

## Cambio
- `type Tab`: quitado `'exportar'`. Quitados el link de la tab y el bloque `@if (tab()==='exportar')`.

## Verificación
- `ng build --configuration production` sin errores. 142 tests verdes. Sin backend.
