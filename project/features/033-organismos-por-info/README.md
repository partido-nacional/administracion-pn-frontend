# Feature 033 — Organismos agrupados por info de organización

**Estado**: Completada · **Fecha**: 2026-10-03 · **Rama**: `feature/organismos-por-info`
**Espejo**: backend `036-organismos-por-info` (endpoints; se mergean juntas)

## Qué se hizo

- **Pantalla**: sale la pestaña "Todos los Organismos". `/organismos` es la lista de infos de organización, con un acordeón info → organismos → integrantes.
- **Fila de info**: nombre derivado de sus organismos ("Info #id" si no tiene), tipo, contacto, cantidad de organismos y editar.
- **Desplegable de info**: la fila de organismo tiene la estructura de la vieja grilla (clasificación, editar, referencias) y se despliega a sus integrantes.
- **Buscador por nombre de organismo**: reduce las infos y los organismos del desplegable; vuelve a la página 1 y colapsa.
- **Fila "Sin info de organización"** para los organismos sin info.
- **CSV**: exporta las infos con el buscador aplicado.

## Validación

- 275 tests (spec del componente reescrito).
- `ng build` OK.
- Prueba end-to-end local: front (puerto 4300) contra el backend 036 sobre Postgres con los datos reales.
  - Búsqueda "afe" → info de AFE → 3 organismos → integrantes de AFE.
  - La fila "Sin info" despliega sus 8 organismos.
