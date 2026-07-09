# Feature 016 — Limpiar Convencionales + rename Intendentes (frontend)

Espejo de la feature backend 008.

## Cambios
- Convencionales: quitadas las tabs **Listas ODD** e **Integrantes de Lista**, la stat-card ODD y la
  opción ODD del modal de Lista. Se conservan Nacionales, Departamentales, **Listas ODN** y la columna
  "Lista ODD" de Departamentales.
- **Intendencias PN → Intendentes PN**: componente (archivo+clase), título, CSV, service (`intendentesPn`,
  endpoint `intendentes-pn`), ruta `/listados/intendentes-pn` y label del menú.

## Verificación
- `ng build --configuration production` sin errores. 142 tests verdes.

## Cross-repo
Release coordinado con el backend feature 008 (rename de endpoint breaking).
