# Technical Specification: Organismos agrupados por info (frontend)

**Version**: 1.0
**Status**: Approved (2026-10-03)
**Created**: 2026-10-03

## Architecture Overview

Se reescribe `features/organismos/organismos.component.ts` alrededor de la lista de infos, con un acordeón de
dos niveles: info → organismos → integrantes. Se reutilizan los patrones actuales: signals, cachés por id,
`app-paginator`, `app-modal-form`, debounce de filtros y `OrganismosService`.

## Contrato consumido (backend 036)

- `GET /organismos/info?nombreOrganismo=&page=&pageSize=` → `InfoOrganizacionDto` con `nombre` y `cantidadOrganismos`.
- `GET /organismos?infoOrganizacionId=&nombre=&all=true` → organismos de una info (todos, por nombre).
- `GET /organismos?sinInfo=true&nombre=&all=true` → organismos sin info (fila especial).
- `GET /organismos/{id}/integrantes` (sin cambios).

## Diseño de la pantalla

- Sale el sistema de pestañas. La topbar queda con "+ Nueva Info", "+ Nuevo Organismo" y "📥 CSV".
- Buscador `Buscar organismo…` (debounce 300 ms) arriba de la grilla. Al cambiar: página 1, se colapsan los
  desplegables y se vacían las cachés de organismos por info.
- Grilla de infos: ▸/▾ Nombre (`nombre ?? 'Info #id'`), Id, Tipo, Dirección, Teléfono, Email, Observaciones,
  Organismos (`cantidadOrganismos`), editar. Se mantienen los filtros de dirección y email de la grilla.
- Fila especial "Sin info de organización" al principio de la página 1, si `GET /organismos?sinInfo=true&nombre=…`
  devuelve total > 0.
- Desplegable de info: tabla de organismos con la estructura de la grilla actual (Id, Clasificación, Nombre,
  Descripción, Dirección, Ciudad, Departamento, País, Art. 44, Orden Dpto., Observaciones, editar, Referencias
  partidarias). Cada fila se despliega a sus integrantes (lógica actual).
- Cachés: `organismosPorInfo: Record<key, OrganismoDto[]>` (key = id de info o `'sin'`) con loading/error por
  key; `integrantesPorOrg`, como hoy. Acordeón: una info abierta a la vez y un organismo abierto a la vez.
- Al guardar un organismo o una info: se recarga la lista de infos y se vacían las cachés de organismos.
- CSV: infos (Nombre, Id, Tipo, Dirección, Teléfono, Email, Observaciones, Cantidad de organismos) con `all=true`
  y el buscador aplicado.

## Cambios

| Archivo | Cambio |
|---|---|
| `core/models/organismos.ts` | `InfoOrganizacionDto` + `nombre`, `cantidadOrganismos` |
| `core/services/organismos.service.ts` | sin métodos nuevos: `getOrganismos(GridQuery)` ya manda los filtros nuevos (`infoOrganizacionId`, `sinInfo`) |
| `features/organismos/organismos.component.ts` (+ spec) | reescritura descrita arriba |
| `project/specs/features/organismos.md` | sección de actualización 033 |

## Testing

- Sin pestaña "Todos".
- Desplegar una info pide sus organismos con `infoOrganizacionId` y `all=true` (con caché).
- El buscador filtra la lista de infos y los organismos del desplegable, y colapsa todo.
- Fila "Sin info" presente o ausente según el total.
- Desplegar un organismo carga sus integrantes.
- Una info sin organismos no se despliega.
- Errores con reintento.
