# Feature: Listados (frontend)

> **Fuente de verdad**: describe el código actual (reescrito el 2026-09-30, feature 031 / DEBT-024, contra `src/app/features/listados/*`). Reemplaza la versión de ingeniería inversa original, que describía listados sin paginar, sin export y con filtros cosméticos. Contraparte backend: `administracion-pn-backend/project/specs/features/listados.md`.

## Propósito

Sección **Listados** del sidebar: reportería de solo lectura de autoridades, cargos y auditoría, con filtros y orden server-side, paginado y export a CSV.

## Acceso

- **Rutas**: `listados/*`, con `canActivate: [rolesGuard('Secretaria','Hacienda','IT')]` (`app.routes.ts`). `listados` redirige a `listados/movimientos`.
- **Sidebar**: el grupo "Listados" (`shell.component.html`) se muestra según la matriz de roles de `shell.component.ts`.

## Patrón común (todos los componentes)

- Componente standalone con `ListadosService` (`core/services/listados.service.ts`). Cada método llama a `GET {apiUrl}/listados/<ruta>` con `buildPagedParams(GridQuery)` y devuelve `PagedResult<T>`.
- **Estado**: signals `items`, `total`, `page`, `pageSize` (`DEFAULT_PAGE_SIZE`), `sort`, `order`, `loading`, `exporting`.
- **Filtros**: fila `<tr class="filter-row">` sobre los encabezados, con inputs de texto o `<select>` (`.column-filter`). Cada cambio → `filter$` con `debounceTime(300)` → `page = 1` → recarga.
- **Orden**: click en encabezado `.sortable` → `sortBy(campo)` (alterna asc/desc), con indicador ▲/▼.
- **Paginado**: `<app-paginator>` (`pageChange`, `pageSizeChange`).
- **Export**: botón "📄 Exportar a Excel" → misma query con `all=true` → `exportarCSV(items, columnas, archivo)` (`core/exportar-csv.ts`).
- **Departamento**: los dropdowns usan `DEPARTAMENTOS` (19, `core/departamentos.ts`). El backend compara `norm(trim)`, y desde la feature 034 el dato se guarda canónico.
- **Vacío / cargando**: fila única en el `tbody` ("Cargando…" / "Sin resultados"): la tabla y sus filtros siempre quedan visibles.

## Listados

| Ruta | Componente | Endpoint | Columnas | Filtros (param) |
|---|---|---|---|---|
| `listados/movimientos` | `MovimientosComponent` | `/movimientos` | Fecha, Usuario, Acción, Módulo, Detalle | `usuario`, `modulo`, `fecha` |
| `listados/parlamentarias` | `ParlamentariasComponent` | `/parlamentarias` | Cortesía, Apellidos, Nombre, Dirección, Domicilio, Departamento, Tel. Móvil, Mail Partido, Posición, Organismo, Condición, Cred. Cívica, Cédula, Observaciones | `apellidos`, `nombre`, **`departamento`**, `pos`, `org`, `condicion` |
| `listados/gobierno` | `GobiernoComponent` | `/gobierno` | Cortesía, Apellidos, Nombre, Tel. Trabajo, Celular, Mail, Posición, Organismo, Compañía | `apellidos`, `nombre`, `pos`, `org`, `compania` |
| `listados/departamentales` | `DepartamentalesComponent` | `/com-departamentales` | Cortesía, Apellidos, Nombre, Teléfono, Celular, Mail, Posición, Departamento, Dir. y Ciudad Organización | `apellidos`, `nombre`, `pos`, **`depto`**, `dir`, `ciudad` |
| `listados/intendencias-nacionalistas` | `IntendenciasNacComponent` | `/intendencias-nacionalistas` | Cortesía, Apellidos, Nombre, Tel. Trabajo, Posición, Organismo, Departamento | `apellidos`, `nombre`, `pos`, **`depto`** |
| `listados/intendentes-pn` | `IntendentesPnComponent` | `/intendentes-pn` | Apellidos, Nombres, Tel. Trabajo 1/2, Tel. Móvil, Departamento, Mail Particular, Mail Trabajo | **`depto`** |
| `listados/alcaldes` | `AlcaldesComponent` | `/alcaldes` | Cortesía, Apellidos, Nombres, Tel. Trabajo, Celular, Mail, Posición, Organismo, Departamento | `apellidos`, `nombres`, `pos`, `org`, **`depto`** |
| `listados/jovenes` | `JovenesComponent` | `/jovenes` | Apellidos, Nombres, Celular, Mail, Posición, Departamento | `apellidos`, `nombres`, **`departamento`** |
| `listados/convencionales` | `ConvencionalesComponent` (feature convencionales; incluye `ConvencionalesListadoComponent`) | `/convencionales` | ID Contacto, Cred. Cívica, Apellidos, Nombres, Celular, Mail, Posición, Organismo, Condición, Adherente | `apellidos`, `nombres`, `pos`, `org`, `condicion`, `adherente` |
| `listados/directorio` | `DirectorioComponent` | `/directorio` | Apellidos, Nombres, Celular, Mail, Posición | `apellidos`, `nombres`, `pos` |
| `listados/comisiones-directorio` | `ComisionesDirectorioComponent` | `/comisiones-directorio` | Comisión, Apellidos, Nombres, Celular, Mail, Posición | `comision`, `apellidos`, `nombres`, `pos` |

La población de cada listado (qué miembros entran) la define el backend: ver su spec.

## Modelos (`listados.service.ts`)

`Movimiento`, `Parlamentario`, `Gobierno`, `ComDep`, `IntNac`, `IntPN`, `Alcalde`, `Joven` (incluye `departamento`), `ConvL`, `DirEntry`, `ComisionDirEntry`. Son espejo de los records del backend, en camelCase.

## Gaps conocidos

- **Jóvenes** lista todos los contactos: no hay segmentación real de "joven" (backend TODO-008).
- Los títulos de página y del sidebar todavía dicen "Agrup." y "Com." (por ejemplo "Com. Jóvenes") por herencia del sistema viejo.
- No hay test por componente de listado: los cubren `listados-agenda-fixes.spec.ts` y `filtros-grillas.spec.ts`.
