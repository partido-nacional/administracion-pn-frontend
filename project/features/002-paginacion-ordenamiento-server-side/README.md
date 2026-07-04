# Feature 002 — Paginación + Ordenamiento Server-Side

Refactor cross-repo (frontend `administracion-pn-frontend` + backend `administracion-pn-backend`)
que reemplazó el **GET-all** de todas las grillas por **paginación + ordenamiento + filtros
server-side**. Resuelve la lentitud reportada: ya no se transfiere ni renderiza el dataset completo.

## Qué se construyó

### Contrato
- Query params: `page`, `pageSize` (default 25, máx 100), `sort`, `order` (asc|desc), `all` (export), + filtros por endpoint.
- Respuesta: `PagedResult<T> = { items, total, page, pageSize }`.

### Backend (.NET 8 / EF Core)
- `PagedQuery` + `PagedResult<T>` en `AdministracionPn.DTOs.Paging`.
- `QueryablePagingExtensions` (`Normalize`, `ApplySort`, `ApplyPaging`, `ToPagedResultAsync`) en Infrastructure.
- **Patrón obligado** (evita 500 de traducción EF): contar sobre la consulta filtrada, ordenar por
  columnas de entidad **antes** de proyectar, `Skip/Take`, y recién ahí `Select` al DTO.
- Endpoints migrados: contactos; listados (movimientos, parlamentarias, gobierno, com-departamentales,
  intendencias-nac/pn, alcaldes, jóvenes, convencionales, directorio); adhesiones (web, locales);
  agrupaciones (todas, pendientes, fichas, por-período) + `/agrupaciones-periodos/opciones`;
  productos (productos, movimientos, ventas, donaciones).

### Frontend (Angular 17 + signals)
- `core/models/paged.ts`, `core/services/paged.ts` (`buildPagedParams`), `<app-paginator>` reutilizable.
- Cada grilla: estado de paginación con signals, filtros server-side con debounce (~300ms), sort por
  columna, selector 25/50/100, export `all=true`.

## Tests
- **Backend**: 26 (xUnit + EF Core Sqlite in-memory) — helper de paginado + patrón anti-500. CI `dotnet test`.
- **Frontend**: 15 (Karma/Jasmine) — `buildPagedParams` + `<app-paginator>`. Runner montado desde cero
  (cierra DEBT-001) + job CI "Unit Tests".

## Decisiones y cambios de comportamiento
- Orden multi-columna (Shift+Click) → orden simple server-side (contactos, agrupaciones todas/período).
- Filtros de ID → coincidencia exacta. Filtros de fecha → día calendario (ISO).
- Stubs en memoria (padrón, convencionales, organismos) fuera de alcance (no tienen DB real).

## Notas de deploy
- Render (backend) y Vercel (frontend) deployan `main`; el flujo fue `feature → develop → main` coordinado.
- El backend reseedea la base en cada arranque → ventana de "grillas vacías" durante el redeploy (no es bug).
