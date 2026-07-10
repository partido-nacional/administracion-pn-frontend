# Feature 019 — Quitar "Posibles Duplicados" de Adhesiones (frontend)

Se quitó la stat-card "Posibles Duplicados" de la tab Locales de Adhesiones y el campo `duplicados`
del `StatsDto` del front. Espejo del backend 009 (que quita el cómputo). Orden de release: front primero.

## Verificación
- `ng build --configuration production` sin errores. 142 tests verdes.
