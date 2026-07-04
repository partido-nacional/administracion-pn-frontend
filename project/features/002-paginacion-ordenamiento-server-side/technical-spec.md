# Technical Specification: Paginación + Ordenamiento Server-Side

**Version**: 1.0
**Status**: Draft
**Created**: 2026-06-30

## Architecture Overview

Cross-repo. Se define **un contrato compartido** de paginación/orden y se aplica endpoint por
endpoint, migrando front y back **de forma atómica por endpoint** (el cambio de shape de la
respuesta obliga a actualizar ambos lados juntos en el mismo PR/tarea).

- **Backend** (.NET 8, EF Core, arquitectura por capas): `PagedResult<T>` y `PagedQuery` viven
  en el proyecto existente `AdministracionPn.DTOs`. Un helper de extensión aplica `Skip/Take`
  + `Count` sobre un `IQueryable` ya ordenado. El ordenamiento se resuelve por **whitelist
  explícita por endpoint** (sin librerías de dynamic LINQ, para evitar superficie de inyección).
  Los controllers hoy consultan `AppDbContext` directo → se mantiene ese estilo, solo se
  intercala paginado/orden antes del `ToListAsync`.
- **Frontend** (Angular 17 + signals): modelos en `core/models/`, un helper de estado de grilla
  + builder de `HttpParams` en `core/services/`, y un **paginador reutilizable** en
  `shared/components/`. Las grillas piloto pasan a consumir el service (alineado con DEBT-006)
  en vez de `HttpClient` directo. Se elimina el filtrado/orden client-side y la paginación
  decorativa.
- **Rollout piloto**: `listados/movimientos` (paginación 100% falsa hoy) y `agenda/contactos`
  (ya tiene `?q`/`?departamento`) como los dos patrones representativos. Validados → se replica.

## API Contract

### Query params (todos los GET-all de grilla migrados)

| Param | Tipo | Default | Notas |
|-------|------|---------|-------|
| `page` | int | 1 | 1-indexed |
| `pageSize` | int | 25 | capado a máx 100 |
| `sort` | string | orden por defecto del endpoint | debe estar en la whitelist; inválido → se ignora |
| `order` | `asc`\|`desc` | `asc` | |
| `all` | bool | false | **solo export**: ignora paginado, respeta filtros/sort. Ver §Export |
| (filtros) | varios | — | por endpoint (ej. `q`, `departamento`, `accion`, `modulo`) |

### Response envelope (elegido: body tipado)

```json
{
  "items": [ /* T[] */ ],
  "total": 2341,
  "page": 1,
  "pageSize": 25
}
```

> ⚠️ **Breaking shape change** por endpoint: la respuesta pasa de `T[]` a `PagedResult<T>`.
> Único consumidor es este front → se migra back+front juntos por endpoint. No hay otros clientes.

### Ejemplo

`GET /api/listados/movimientos?page=2&pageSize=25&sort=fecha&order=desc&modulo=Agenda`

```json
{ "items": [ /* 25 movimientos */ ], "total": 2341, "page": 2, "pageSize": 25 }
```

## Backend — diseño

### DTOs compartidos (`AdministracionPn.DTOs`)

```csharp
public sealed record PagedQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 25;
    public string? Sort { get; init; }
    public string? Order { get; init; }   // "asc" | "desc"
    public bool All { get; init; }         // export: ignora paginado
}

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
```

### Helper de paginado (extensión IQueryable)

```csharp
public static class QueryablePagingExtensions
{
    public const int MaxPageSize = 100;

    // Aplica orden por whitelist: sortMap mapea clave -> keySelector.
    public static IQueryable<T> ApplySort<T>(
        this IQueryable<T> query,
        string? sort, string? order,
        IReadOnlyDictionary<string, Expression<Func<T, object>>> sortMap,
        Expression<Func<T, object>> defaultKey, bool defaultDesc = false) { ... }

    // Count + Skip/Take con clamps (page>=1, 1<=pageSize<=MaxPageSize).
    // Si query.All -> devuelve todo (para export) pero mantiene orden/filtros.
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query, PagedQuery q) { ... }
}
```

- `ApplySort` recibe un **diccionario whitelist por endpoint** → `sort` fuera del map cae al
  `defaultKey` (BR-3, EC-3). Evita interpolar input crudo (seguridad).
- `ToPagedResultAsync` clampa `page`/`pageSize` (BR-2, EC-1, EC-2), hace `CountAsync` + `Skip/Take`.
- **Importante**: proyectar (`Select`) **antes** de paginar y ordenar por columnas de la
  proyección/entidad soportadas por SQL (evitar ordenar por campos calculados en memoria).

### Cambio típico en un controller (ejemplo movimientos)

```csharp
[HttpGet("movimientos")]
public async Task<ActionResult<PagedResult<Movimiento>>> Movimientos(
    [FromQuery] PagedQuery paging,
    [FromQuery] string? accion, [FromQuery] string? modulo, [FromQuery] string? usuario)
{
    var query = _db.MovimientosAuditoria.Include(m => m.Usuario).AsQueryable();
    if (!string.IsNullOrWhiteSpace(accion)) query = query.Where(m => m.Accion == accion);
    if (!string.IsNullOrWhiteSpace(modulo)) query = query.Where(m => m.Modulo == modulo);
    // ... filtros restantes (mapear los que hoy son client-side)

    var projected = query.Select(m => new Movimiento(/* ... */));

    var sortMap = new Dictionary<string, Expression<Func<Movimiento, object>>> {
        ["fecha"]   = m => m.FechaHora,
        ["usuario"] = m => m.Usuario,
        ["accion"]  = m => m.Accion,
        ["modulo"]  = m => m.Modulo,
    };
    projected = projected.ApplySort(paging.Sort, paging.Order, sortMap,
                                    defaultKey: m => m.FechaHora, defaultDesc: true);

    return Ok(await projected.ToPagedResultAsync(paging));
}
```

> Nota: `Movimiento.FechaHora` hoy es string formateado `yyyy-MM-dd HH:mm` → ordena
> lexicográficamente igual que cronológico, sirve. Verificar caso por caso en el resto.

### Filtros a mapear (hoy client-side → server-side)

Por cada grilla, trasladar los filtros del `computed filtrados()` del front a `Where` en el
controller (mismos criterios, mismo casing/`Contains`). Inventario detallado se completa en
`/project.plan` tarea por tarea. Ejemplos: movimientos (fecha, usuario, accion, modulo, detalle),
contactos (`q`, `departamento` — ya existen).

### Export (`all=true`)

- El botón "Exportar a Excel" del front llama al **mismo endpoint** con los filtros/sort activos
  y `all=true` (sin `page`/`pageSize`) → backend devuelve `PagedResult<T>` con todos los items
  filtrados. El front alimenta `core/exportar-csv.ts` con `items`.
- Cap de seguridad: si más adelante hay datasets enormes, evaluar límite duro; por ahora es
  aceptable para el volumen actual.

## Frontend — diseño

### Modelos (`core/models/paged.ts`)

```typescript
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }
export type SortOrder = 'asc' | 'desc';
export interface GridQuery {
  page: number; pageSize: number;
  sort?: string; order?: SortOrder;
  filters?: Record<string, string | undefined>;
}
```

### Helper de params (`core/services/paged.ts`)

`buildPagedParams(q: GridQuery): HttpParams` — arma page/pageSize/sort/order + filtros no vacíos.
Un `all=true` para export.

### Paginador reutilizable (`shared/components/paginator`)

Componente standalone signals: inputs `total`, `page`, `pageSize`; outputs `pageChange`,
`pageSizeChange`. Renderiza `<`, números con elipsis, `>`, "Mostrando X–Y de N" y selector
25/50/100. **Reemplaza** el bloque `.pagination` hardcodeado de cada grilla.

### Estado de grilla en el componente

Signals: `page`, `pageSize`, `sort`, `order`, `filters`, `total`, `items`, `loading`.
`effect`/método `load()` que llama al service con `buildPagedParams` y setea `items`/`total`.
Cambiar filtro/sort → resetea `page=1` y recarga. Input de texto con **debounce** (~300 ms).
Se elimina el `computed filtrados()` client-side.

### Migración por endpoint (patrón)

1. Crear/extender service por dominio en `core/services/` que devuelva `PagedResult<T>`.
2. Sustituir `http.get<T[]>(...).subscribe(x => sig.set(x))` por consumo paginado.
3. Reemplazar el HTML de paginación decorativa por `<app-paginator>`.
4. Conectar filtros existentes a `filters` (server-side) y encabezados de columna a `sort`.
5. Export → método `all=true` + `exportar-csv.ts`.

## Data Model & Storage

Sin cambios de esquema. Cambio solo en la capa de query: `Skip/Take` + `OrderBy` en SQL en vez
de materializar toda la tabla. **Revisar índices** en columnas ordenables/filtrables de alto uso
(p. ej. `MovimientosAuditoria.Fecha`, `Contactos.Apellido/Departamento`) — anotar en plan.

## External Integrations

Ninguna nueva. Solo el contrato REST entre este front y `administracion-pn-backend`.

## Error Handling

| Code | Situación | Comportamiento |
|------|-----------|----------------|
| 200 | `page` fuera de rango | `items: []`, `total` real |
| 200 | `sort` fuera de whitelist | orden por defecto del endpoint (no 400) |
| 200 | `pageSize` > máx | capeado a 100 |
| 400 | `page`/`pageSize` no numérico/negativo | validación de binding / clamp a default (definir: preferimos clamp silencioso, sin romper) |

## Non-Functional Requirements

- **Performance**: carga inicial = 1 página; orden/filtro resueltos en DB, no en memoria.
- **Security**: `sort` y filtros validados por whitelist; nunca interpolar input crudo en la query.
- **Backward-compat**: llamadas sin params → default `page=1, pageSize=25` (no "todo"). El cambio
  de shape se absorbe migrando front+back juntos por endpoint.
- **Sin regresión**: paridad de filtros/orden/export por vista; verificar cada grilla migrada.

## Implementation Notes / Gotchas

- **Piloto primero**: `movimientos` + `contactos`. No tocar las 19 grillas de una.
- **Shape change atómico**: nunca mergear un cambio de backend que devuelva `PagedResult<T>` sin el
  front correspondiente (rompería la vista). Tarea = back+front del mismo endpoint juntos.
- **Ordenar campos string-formateados**: verificar que el orden SQL coincida con el esperado
  (fechas como `yyyy-MM-dd HH:mm` ordenan bien; montos/decimales no deben ser string).
- **Stubs en memoria**: fuera de alcance (padrón, convencionales, organismos, ventas, donaciones).
- **Tests (production)**: backend → tests del helper de paginado (clamps, whitelist, all=true) y de
  1-2 controllers piloto. Front → tests del paginador y del builder de params. Ver `/project.plan`.
- **Export**: confirmar que `exportar-csv.ts` acepta el array completo devuelto por `all=true`.
