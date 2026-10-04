# Feature 036 — Crear referencia partidaria a mano

**Estado**: Completada · **Fecha**: 2026-10-03 · **Rama**: `feature/crear-referencia` · Solo frontend

- Botón "+ Crear referencia" en las referencias de un contacto (con buscador de organismo partidario) y de un organismo partidario (con buscador de contacto).
- **Tests**: 294 en verde (+11). `ng build` OK.
- **Prueba end-to-end local**, contra el backend de `develop` sobre Postgres con datos reales:
  - alta desde la pantalla del organismo AFE;
  - la referencia nueva queda editable;
  - la fila calculada "Desde integrante" del mismo contacto desaparece.
