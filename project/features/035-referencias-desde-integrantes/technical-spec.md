# Technical Specification: Referencias desde integrantes (frontend)

**Status**: Approved (2026-10-03) · **Created**: 2026-10-03

- Modelos `ReferenciaOrganismo` y `ReferenciaPartidaria` suman `origen` e `integranteId`.
- `referencias-organismo` y `referencias-contacto`: badge "Desde integrante" en las filas con `origen === 'Integrante'`,
  sin botón de editar; `track` por clave compuesta (las calculadas tienen `id` 0).
- Agenda: sin cambios (el flag `tieneReferenciaPartidaria` ya viene calculado del backend).
- Tests de los dos componentes.
