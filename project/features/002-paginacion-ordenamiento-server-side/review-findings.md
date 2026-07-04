# Reviews de calidad (TASK-013 / 014 / 015)

Fecha: 2026-07-04 · Alcance: toda la feature de paginación server-side (front + back).

## TASK-013 — Code Review

- ✅ **Patrón uniforme** en los ~25 endpoints migrados: contar sobre la consulta filtrada,
  ordenar por columnas de entidad **antes** de proyectar, `Skip/Take`, y recién ahí `Select`
  al DTO/record → `PagedResult<T>`. Evita el 500 de traducción de EF (ver
  [[paginacion-ef-orderby-projection]]).
- ✅ **Sin paginación decorativa remanente**: todas las grillas reales usan `<app-paginator>`;
  se eliminaron los bloques `.pagination` hardcodeados y los `computed filtrados()` client-side.
- ✅ **Contrato consistente**: `page/pageSize/sort/order/all` + `PagedResult` en todos lados;
  `buildPagedParams` centraliza el armado de params en el front.
- ℹ️ `QueryablePagingExtensions.ApplySort/ApplyPaging/ToPagedResultAsync` quedaron como utilitarios
  (cubiertos por tests) pero los controllers usan un `switch` inline para el orden (decisión del
  fix EF). `Normalize` sí se usa en todos los endpoints. No es dead code crítico; se mantienen como
  API reusable y testeada.
- ℹ️ **Cambios de comportamiento** (documentados y acordados): multi-sort Shift+Click → orden simple
  (contactos, agrupaciones "todas" y "por-período"); filtros de ID → coincidencia exacta; filtros de
  fecha → día calendario ISO.

## TASK-014 — Performance Review

- ✅ **Fix aplicado — `agrupaciones-periodos`**: ya no carga **todos** los integrantes en cada
  navegación de página; ahora sólo los de los `periodoId` de la página actual
  (`WHERE AgrupacionPeriodoId IN (ids de la página)`).
- ✅ **Fix aplicado — `fichas-agrupacion`**: ya no carga **todos** los contactos para validar
  autoridades; ahora sólo los de las CIs presentes en la página.
- ✅ **Sin N+1**: cada endpoint resuelve en 1–2 queries (página + count, más un sub-load acotado
  donde aplica). Orden y filtro se resuelven en SQL, no en memoria.
- ⚠️ **Recomendación (no bloqueante) — índices**: agregar índices en las columnas de sort/filtro de
  alto uso mejora `ORDER BY`/`WHERE` a escala:
  - `Contactos(Apellido)`, `Contactos(Departamento)`, `Contactos(Documento)`
  - `MovimientosAuditoria(Fecha)`
  - `Agrupaciones(Nombre)`, `Agrupaciones(Depto)`
  - `AdhesionesLocales(FechaAdhesion)`, `AdhesionesWeb(FechaAdhesion)`
- ⚠️ **Export `all=true`** es ilimitado por diseño (devuelve el dataset filtrado completo). Para
  contactos (~21k) es aceptable hoy; si crece mucho, evaluar un cap o export asíncrono.

## TASK-015 — Security Review

- ✅ **Sin inyección por `sort`**: el orden se resuelve por **whitelist explícita** (switch) en cada
  endpoint; nunca se interpola el valor de `sort` en la query. Un `sort` inválido cae al orden por
  defecto (sin error).
- ✅ **Filtros parametrizados**: los `.Where(x => x.Campo.ToLower().Contains(t))` de EF generan SQL
  parametrizado → sin SQL injection desde los filtros del query string.
- ✅ **AuthZ intacta**: `[Authorize]` se mantiene en todos los controllers migrados; no se tocaron
  atributos de autorización.
- ✅ **Sin secretos nuevos**: el job Secrets Scan del CI pasa en ambos repos.
- ⚠️ **`all=true`** es una superficie menor de DoS (respuestas grandes). Está detrás de auth
  (requiere login). Riesgo bajo; documentado para futura consideración.

## Tests que respaldan la feature

- Backend: 26 tests (xUnit + EF Core Sqlite in-memory) — `Normalize`, `IsDescending`, `ApplySort`
  (whitelist + fallback), `ApplyPaging`, `ToPagedResultAsync`, y el **patrón anti-500** sobre SQL real.
- Frontend: 15 tests (Karma/Jasmine) — `buildPagedParams` y `<app-paginator>`. Runner integrado al CI
  (job "Unit Tests", ChromeHeadlessNoSandbox).
