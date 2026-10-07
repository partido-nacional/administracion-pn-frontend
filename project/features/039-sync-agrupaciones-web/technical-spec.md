# Technical Specification: Sincronizar fichas de agrupación desde la web (frontend)

**Status**: Approved (2026-10-06) · **Created**: 2026-10-06

- `fichas-agrupacion.component`: `sincronizar()` lee la respuesta nueva `{ nuevas, duplicadasIgnoradas, desde,
  ultimaSincronizacion }` y muestra un toast "N fichas nuevas" o "No hay fichas nuevas". Ante un error (502/503) muestra
  el `message` del backend. En los dos casos recarga la grilla.
- Junto al botón: "Última sincronización: …" con `ultimaSincronizacion` cuando venga.
- Tests del componente.
