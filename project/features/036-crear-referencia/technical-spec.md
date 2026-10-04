# Technical Specification: Crear referencia partidaria a mano

**Status**: Approved (2026-10-03) · **Created**: 2026-10-03

- `OrganismosService.crearReferencia(input)` → `POST /organismos/referencias` (`ReferentePartidarioInput`: contactoId,
  organismoId?, rol, periodo, fechaDesignacion, fechaCese, art44, notas). Mismo shape que `ReferenciaEditInput`.
- `referencias-contacto`:
  - botón + `app-modal-form` de alta;
  - buscador de organismo (combo, mismo patrón que agrupaciones-por-periodo) sobre los organismos partidarios
    (`GET /organismos?ambito=Partidario&all=true`, cargados al abrir y filtrados en el cliente sin acentos).
- `referencias-organismo`:
  - botón visible si `GET /organismos/{id}` tiene `organizacionPartidariaId`;
  - buscador de contacto (combo, debounce, `ContactosService.listado({ filters: { q } })`, 10 resultados).
- Fechas en `yyyy-MM-dd` (input date), como el modal de edición.
- Tests: el botón aparece u oculta según el caso, validaciones, payload enviado, error del backend, recarga.
