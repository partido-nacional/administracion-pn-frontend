# Listados (Reportería)

**Estado:** Implementado (UI + lectura de datos). Export CSV, paginación y persistencia de filtros **NO implementados** (ver [No implementado / gaps](#no-implementado--gaps)).
**Rutas:** `/listados/*` (10 sub-rutas + redirect `/listados` → `/listados/movimientos`)
**Componentes:** 10 componentes standalone, todos en `src/app/features/listados/`:

| # | Componente | Archivo |
|---|------------|---------|
| 1 | `MovimientosComponent` | `movimientos.component.ts:80` |
| 2 | `ParlamentariasComponent` | `parlamentarias.component.ts:106` |
| 3 | `GobiernoComponent` | `gobierno.component.ts:87` |
| 4 | `DepartamentalesComponent` | `departamentales.component.ts:91` |
| 5 | `IntendenciasNacComponent` | `intendencias-nac.component.ts:80` |
| 6 | `IntendenciasPnComponent` | `intendencias-pn.component.ts:77` |
| 7 | `AlcaldesComponent` | `alcaldes.component.ts:88` |
| 8 | `JovenesComponent` | `jovenes.component.ts:63` |
| 9 | `ConvencionalesListadoComponent` | `convencionales-listado.component.ts:93` |
| 10 | `DirectorioComponent` | `directorio.component.ts:62` |

> Contexto transversal (Angular 17.3 standalone + signals, `authGuard`, `authInterceptor`, `apiUrl = http://localhost:5000/api`, export CSV en `core/exportar-csv.ts`): ver `../architecture.md`. Esta spec no redocumenta esos aspectos.

---

## Propósito

La sección **Listados** es el módulo de reportería de solo lectura. Expone 10 vistas tabulares independientes, cada una mostrando un padrón/listado distinto de la organización (movimientos del sistema, autoridades parlamentarias, de gobierno, departamentales, intendencias, alcaldes, jóvenes, convencionales y directorio).

Todas las vistas siguen el mismo patrón: cargan un array desde un endpoint `GET /listados/...` en el constructor, lo guardan en un `signal`, y lo renderizan en una tabla con **filtros por columna en cliente** (computados con `computed()`). No hay altas, ediciones ni eliminaciones — es estrictamente lectura. Cada tabla incluye una fila de paginación estática y un botón "Exportar a Excel" decorativo (sin handler).

---

## Rutas y navegación

Todas las rutas son hijas del `ShellComponent` (layout protegido por `authGuard`) y se cargan en lazy con `loadComponent`. Definidas en `app.routes.ts:21-31`:

| Ruta | Componente cargado | Definición |
|------|--------------------|------------|
| `listados` (redirect → `listados/movimientos`) | — | `app.routes.ts:21` |
| `listados/movimientos` | `MovimientosComponent` | `app.routes.ts:22` |
| `listados/parlamentarias` | `ParlamentariasComponent` | `app.routes.ts:23` |
| `listados/gobierno` | `GobiernoComponent` | `app.routes.ts:24` |
| `listados/departamentales` | `DepartamentalesComponent` | `app.routes.ts:25` |
| `listados/intendencias-nacionalistas` | `IntendenciasNacComponent` | `app.routes.ts:26` |
| `listados/intendencias-pn` | `IntendenciasPnComponent` | `app.routes.ts:27` |
| `listados/alcaldes` | `AlcaldesComponent` | `app.routes.ts:28` |
| `listados/jovenes` | `JovenesComponent` | `app.routes.ts:29` |
| `listados/convencionales` | `ConvencionalesListadoComponent` | `app.routes.ts:30` |
| `listados/directorio` | `DirectorioComponent` | `app.routes.ts:31` |

- **Redirect raíz de la sección:** `app.routes.ts:21` → `{ path: 'listados', pathMatch: 'full', redirectTo: 'listados/movimientos' }`. Entrar a `/listados` redirige a Mov. de Sistema.
- **Navegación lateral:** el menú "Listados" del sidebar es un submenú colapsable (`shell.component.html:12-26`). Los 10 ítems usan `routerLink`/`routerLinkActive` (`shell.component.html:16-25`). El submenú se abre/cierra con `toggle('listados')` / `isOpen('listados')` (`shell.component.html:12,15`).
- **Sin navegación programática:** ningún componente de listados inyecta `Router`. No hay drill-down ni links salientes; toda la interacción es interna (filtros).
- **Orden del sidebar vs. rutas:** idéntico (movimientos, parlamentarias, gobierno, departamentales, intendencias-nacionalistas, intendencias-pn, alcaldes, jovenes, convencionales, directorio).

---

## Componentes

### Patrón común (los 10 son idénticos en estructura)

Todos los componentes comparten exactamente la misma arquitectura. Descrito una vez aquí; las diferencias se tabulan abajo.

1. **Imports y decorador:** `standalone: true`, `imports: [CommonModule, FormsModule]`. Inyectan `HttpClient` y `PageTitleService` vía `inject()` (p. ej. `movimientos.component.ts:81-82`).
2. **Estado:** un único `signal<T[]>([])` (`data` o `movs`) con la lista, más una propiedad string por cada filtro de columna (`f…`), inicializadas en `''`.
3. **Carga de datos:** en el `constructor`, se fija el título de página con `titleSvc.set(...)` y se hace `this.http.get<T[]>(\`${environment.apiUrl}/listados/...\`).subscribe(x => this.data.set(x))` (p. ej. `directorio.component.ts:75-78`). **Sin manejo de error ni estado de carga.**
4. **Filtrado:** un `computed()` llamado `filtrados()` que filtra el array en cliente. Usa dos helpers locales: `t(s, f)` = match parcial case-insensitive (`!f || (s ?? '').toLowerCase().includes(f.toLowerCase())`) y `e(s, f)` = match exacto para campos con `<select>` (`!f || s === f`). Ver `gobierno.component.ts:95-101`.
5. **Template:** `<div class="card"><div class="card-body">` con una `<table class="table">`. `<thead>` tiene una fila de cabeceras y una `<tr class="filter-row">` con un `<input class="column-filter">` o `<select class="column-filter">` por columna (binding `[(ngModel)]`). `<tbody>` itera `@for (x of filtrados(); track $index)`. Cierra con un bloque `.pagination` que contiene el contador, el botón Exportar y botones de página estáticos.
6. **Tracking:** todos usan `track $index` **excepto** `ConvencionalesListadoComponent`, que usa `track c.idContacto` (`convencionales-listado.component.ts:60`) — es el único listado con un ID real en el modelo.

### Diferencias por listado

| Listado | Endpoint (GET) | Modelo (interface) | Columnas | Filtros tipo `<select>` (match exacto) | Total mostrado en pie | `track` |
|---------|----------------|--------------------|----------|----------------------------------------|-----------------------|---------|
| **Movimientos** | `/listados/movimientos` (`movimientos.component.ts:104`) | `Movimiento` (`:8`) | Fecha/Hora, Usuario, Acción, Módulo, Detalle (5) | Acción (Alta/Modificacion/Eliminacion), Módulo (6 opciones) | "de 2,341 movimientos" (`:64`) | `$index` |
| **Parlamentarias** | `/listados/parlamentarias` (`parlamentarias.component.ts:127`) | `Parlamentario` (`:8`) | Cortesía, Apellidos, Nombre, Dirección, Domicilio, Departamento, Tel. Móvil, Mail Partido, Pos. Organismo, Nombre Organismo, Cred. Cívica, Cédula Id., Observaciones (13) | Cortesía (7 opc.), Departamento (6 opc.), Nombre Organismo (Cámara de Representantes/Senadores) | "de 12 agrupaciones parlamentarias" (`:93`) | `$index` |
| **Gobierno** | `/listados/gobierno` (`gobierno.component.ts:105`) | `Gobierno` (`:8`) | Cortesía, Apellidos, Nombre, Tel. Trabajo, Celular, Mail, Pos. Organismo, Nombre Organismo, Nombre Compañía (9) | Cortesía (7 opc.), Nombre Organismo (ANP/ANTEL/UTE/CORREO/OSE/ANCAP) | "de 28 cargos de gobierno" (`:74`) | `$index` |
| **Departamentales** | `/listados/com-departamentales` (`departamentales.component.ts:111`) | `ComDep` (`:8`) | Cortesía, Apellidos, Nombre, Teléfono, Celular, Mail, Pos. Organismo, Departamento, Dir. Organización, Ciudad Organización (10) | Cortesía (7 opc.), Departamento (**19** deptos. del array `DEPTOS` `:13`, render `@for` `:53`) | "de 19 comisiones departamentales" (`:78`) | `$index` |
| **Intendencias Nac.** | `/listados/intendencias-nacionalistas` (`intendencias-nac.component.ts:98`) | `IntNac` (`:8`) | Cortesía, Apellidos, Nombre, Tel. Trabajo, Pos. Organismo, Nombre Organismo, Departamento (7) | Cortesía (7 opc.), Departamento (6 opc.) | "de 8 intendencias nacionalistas" (`:68`) | `$index` |
| **Intendencias PN** | `/listados/intendencias-pn` (`intendencias-pn.component.ts:95`) | `IntPN` (`:8`) | Apellidos, Nombres, Tel. Trabajo 1, Tel. Trabajo 2, Tel. Móvil, Departamento, Mail Particular, Mail Trabajo (8) — **sin columna Cortesía** | Departamento (6 opc.) | "de 8 intendencias PN" (`:65`) | `$index` |
| **Alcaldes** | `/listados/alcaldes` (`alcaldes.component.ts:106`) | `Alcalde` (`:8`) | Cortesía, Apellidos, Nombres, Tel. Trabajo, Celular, Mail, Pos. Organismo, Nombre Organismo, Departamento (9) | Cortesía (7 opc.), Departamento (6 opc.) | "de 34 alcaldes" (`:74`) | `$index` |
| **Jóvenes** | `/listados/jovenes` (`jovenes.component.ts:78`) | `Joven` (`:8`) | Apellidos, Nombres, Celular, Mail, Pos. Organismo (5) | ninguno (todos texto) | "de 42 integrantes" (`:49`) | `$index` |
| **Convencionales** | `/listados/convencionales` (`convencionales-listado.component.ts:114`) | `ConvL` (`:8`) | ID Contacto, Cred. Cívica, Apellidos, Nombres, Celular, Mail, Pos. Organismo, Nombre Organismo, Condición, Adherente (10) | Condición (Titular/Suplente), Adherente (Si/No → filtra sobre `boolean`) | "de 500 convencionales" (`:77`) | `c.idContacto` |
| **Directorio** | `/listados/directorio` (`directorio.component.ts:77`) | `DirEntry` (`:8`) | Apellidos, Nombres, Celular, Mail, Pos. Organismo (5) | ninguno (todos texto) | "de 15 integrantes del directorio" (`:49`) | `$index` |

Notas sobre columnas y filtros:
- **Jóvenes y Directorio comparten exactamente el mismo modelo y columnas** (`apellidos`, `nombres`, `celular`, `mail`, `posOrganismo`) y la misma lógica de filtrado (5 filtros de texto). Solo difieren en endpoint, título y el texto del contador.
- **Convencionales** es el único con filtros especiales fuera del patrón `t`/`e`: el filtro `fId` hace `String(c.idContacto).includes(...)` (`convencionales-listado.component.ts:103`) y `fAdherente` compara contra el `boolean` `adherente` con valores `'si'`/`'no'` (`:105-106`).
- **Movimientos** tiene helpers de presentación propios: `formatFecha()` convierte `YYYY-MM-DD HH:MM` a `dd/mm/aaaa HH:MM` (`movimientos.component.ts:107-110`) y `badgeAccion()` mapea Acción → clase de badge (`status-active`/`status-pending`/`status-rejected`, `:112-116`). El filtro de fecha (`fFecha`) compara contra el valor ya formateado (`:93`).

### Export CSV (por listado)

**Ninguno de los 10 componentes implementa export CSV.** El botón `<button class="btn btn-export btn-sm">📄 Exportar a Excel</button>` aparece en los 10 templates (p. ej. `movimientos.component.ts:65`, `directorio.component.ts:50`) pero **no tiene `(click)` ni ningún handler**, y ningún componente importa `exportarCSV` de `core/exportar-csv.ts` (búsqueda en toda la carpeta: 0 coincidencias). Es puramente decorativo. Ver [gaps](#no-implementado--gaps).

---

## API consumida

Todos son `GET` y devuelven un array JSON (`T[]`) que se vuelca directo al `signal`. La URL base es `environment.apiUrl` = `http://localhost:5000/api`. El `authInterceptor` adjunta el Bearer token (ver `../architecture.md`). No hay query params, paginación ni filtros server-side: la query completa se trae y se filtra en cliente.

| Método + ruta exacta | Componente | Línea de la llamada |
|----------------------|------------|---------------------|
| `GET /listados/movimientos` | `MovimientosComponent` | `movimientos.component.ts:104` |
| `GET /listados/parlamentarias` | `ParlamentariasComponent` | `parlamentarias.component.ts:127` |
| `GET /listados/gobierno` | `GobiernoComponent` | `gobierno.component.ts:105` |
| `GET /listados/com-departamentales` | `DepartamentalesComponent` | `departamentales.component.ts:111` |
| `GET /listados/intendencias-nacionalistas` | `IntendenciasNacComponent` | `intendencias-nac.component.ts:98` |
| `GET /listados/intendencias-pn` | `IntendenciasPnComponent` | `intendencias-pn.component.ts:95` |
| `GET /listados/alcaldes` | `AlcaldesComponent` | `alcaldes.component.ts:106` |
| `GET /listados/jovenes` | `JovenesComponent` | `jovenes.component.ts:78` |
| `GET /listados/convencionales` | `ConvencionalesListadoComponent` | `convencionales-listado.component.ts:114` |
| `GET /listados/directorio` | `DirectorioComponent` | `directorio.component.ts:77` |

> **`GET /listados/auditoria` NO existe en el frontend.** Búsqueda de `auditoria` en `src/app/features/listados/`: 0 coincidencias. El listado de "movimientos del sistema" (auditoría conceptual) se sirve por `/listados/movimientos`, no por una ruta `/auditoria`.

---

## Modelos / interfaces

Cada componente declara su propia `interface` local (no hay modelos compartidos en `core/` ni `shared/`). Todos los campos son `string` salvo donde se indique.

| Interface | Archivo:línea | Campos |
|-----------|---------------|--------|
| `Movimiento` | `movimientos.component.ts:8` | `fechaHora`, `usuario`, `accion`, `modulo`, `detalle` |
| `Parlamentario` | `parlamentarias.component.ts:8-12` | `cortesia`, `apellidos`, `nombre`, `direccion`, `domicilio`, `departamento`, `telMovil`, `mailPartido`, `posOrganismo`, `nombreOrganismo`, `credCivica`, `cedulaId`, `observaciones` |
| `Gobierno` | `gobierno.component.ts:8-11` | `cortesia`, `apellidos`, `nombre`, `telTrabajo`, `celular`, `mail`, `posOrganismo`, `nombreOrganismo`, `nombreCompania` |
| `ComDep` | `departamentales.component.ts:8-11` | `cortesia`, `apellidos`, `nombre`, `telefono`, `celular`, `mail`, `posOrganismo`, `departamento`, `dirOrganizacion`, `ciudadOrganizacion` |
| `IntNac` | `intendencias-nac.component.ts:8-11` | `cortesia`, `apellidos`, `nombre`, `telTrabajo`, `posOrganismo`, `nombreOrganismo`, `departamento` |
| `IntPN` | `intendencias-pn.component.ts:8-11` | `apellidos`, `nombres`, `telTrabajo1`, `telTrabajo2`, `telMovil`, `departamento`, `mailParticular`, `mailTrabajo` |
| `Alcalde` | `alcaldes.component.ts:8-11` | `cortesia`, `apellidos`, `nombres`, `telTrabajo`, `celular`, `mail`, `posOrganismo`, `nombreOrganismo`, `departamento` |
| `Joven` | `jovenes.component.ts:8-10` | `apellidos`, `nombres`, `celular`, `mail`, `posOrganismo` |
| `ConvL` | `convencionales-listado.component.ts:8-11` | `idContacto` (**number**), `credCivica`, `apellidos`, `nombres`, `celular`, `mail`, `posOrganismo`, `nombreOrganismo`, `condicion`, `adherente` (**boolean**) |
| `DirEntry` | `directorio.component.ts:8-10` | `apellidos`, `nombres`, `celular`, `mail`, `posOrganismo` |

Observaciones de modelado:
- Inconsistencia de nombres entre listados de personas: unos usan `nombre` singular (`Parlamentario`, `Gobierno`, `ComDep`, `IntNac`) y otros `nombres` plural (`IntPN`, `Alcalde`, `Joven`, `ConvL`, `DirEntry`). Los teléfonos también varían: `telTrabajo`, `telefono`, `telTrabajo1/2`, `telMovil`, `celular`.
- `Joven` y `DirEntry` son estructuralmente idénticos.
- `ConvL` es el único con tipos no-string (`idContacto: number`, `adherente: boolean`).

---

## Interacciones / UX

- **Filtrado por columna (cliente):** cada columna filtrable tiene un control en la `filter-row` ligado con `[(ngModel)]`. Inputs de texto = match parcial case-insensitive; `<select>` = match exacto contra opciones hardcodeadas en el template. El `computed() filtrados()` reacciona porque depende del `signal` `data()`; sin embargo, **los campos de filtro `f…` son propiedades planas, no signals**, por lo que el recálculo se dispara por el ciclo de detección de cambios de Angular al escribir (vía `ngModel`/`FormsModule`), no por reactividad de signals.
- **Opciones de `<select>` hardcodeadas y parciales:** las listas de Departamento, Organismo y Cortesía están escritas a mano en cada template y **no cubren todos los valores posibles**. Ejemplo: Parlamentarias ofrece solo 6 departamentos (`parlamentarias.component.ts:53-54`), mientras Departamentales ofrece los 19 desde el array `DEPTOS` (`departamentales.component.ts:13`). Filtrar por un valor ausente del `<select>` es imposible.
- **Contador del pie:** el texto "Mostrando 1–{{ filtrados().length }} de N …" usa `filtrados().length` para el límite superior pero un **N hardcodeado** para el total (p. ej. `de 2,341`, `de 500`). El total no refleja el array real cargado.
- **Paginación:** los botones de página (`< 1 2 3 … >`) son estáticos, sin `(click)` ni estado de página. La tabla renderiza **todas** las filas filtradas, no una página.
- **Exportar a Excel:** botón sin handler (ver sección de export CSV). No descarga nada.
- **Estados de carga / error / vacío:** no hay spinner, ni manejo de error en el `subscribe`, ni mensaje de "sin resultados". Si la lista está vacía el `<tbody>` simplemente no renderiza filas.
- **Título de página:** cada componente fija su título vía `PageTitleService.set(...)` en el constructor (p. ej. `alcaldes.component.ts:105` → `'Listados — Alcaldes'`), que el shell muestra en el header.

---

## Dependencias

- **Angular core:** `Component`, `computed`, `inject`, `signal` (`@angular/core`).
- **`CommonModule`** (`@angular/common`) — para `@for`, `@if`, `ngClass`.
- **`FormsModule`** (`@angular/forms`) — para `[(ngModel)]` en filtros.
- **`HttpClient`** (`@angular/common/http`) — fetch de datos; el `authInterceptor` global adjunta el token.
- **`environment`** (`src/environments/environment.ts:3`) — `apiUrl`.
- **`PageTitleService`** (`src/app/core/page-title.service.ts:4`) — título del header.
- **No usadas pese a estar disponibles:** `Router` (ningún componente navega), `exportarCSV` (`core/exportar-csv.ts:26`, ningún componente lo importa). No hay servicios compartidos de listados; cada componente hace su propio `http.get`.

---

## No implementado / gaps

1. **Export CSV ausente en los 10 listados.** El botón "Exportar a Excel" no tiene handler y `exportarCSV` (`core/exportar-csv.ts`) no se importa en ningún componente. Es la función transversal de export del core, lista para usar, pero sin cablear aquí.
2. **Paginación falsa.** Botones de página estáticos; la tabla renderiza todo el array filtrado sin segmentar.
3. **Contadores de total hardcodeados.** El "de N" del pie no proviene del array real (`2,341`, `500`, `42`, etc. son literales).
4. **Sin manejo de error ni estado de carga/vacío.** El `subscribe` no captura errores; no hay spinner ni mensaje de tabla vacía.
5. **Opciones de filtro `<select>` incompletas/hardcodeadas**, distintas entre listados; no se derivan de los datos.
6. **`GET /listados/auditoria` no existe.** No hay ruta ni llamada de auditoría separada; los movimientos del sistema se sirven por `/listados/movimientos`.
7. **Filtros no persisten** entre navegaciones (propiedades planas reinicializadas a `''` al recrear el componente).
8. **Duplicación de código.** Los 10 componentes repiten el mismo patrón (helpers `t`/`e`, estructura de template, carga en constructor); `JovenesComponent` y `DirectorioComponent` son casi clones. No hay abstracción/base compartida.
9. **Filtros son propiedades, no signals.** El recálculo del `computed` depende del ciclo de detección de cambios disparado por `ngModel`, no de reactividad pura de signals.
