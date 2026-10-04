# Feature: Organismos

Cubre **dos componentes**:

1. `OrganismosComponent` — pantalla maestra de organismos (4 tabs), ruta `/organismos`. **Backend STUB.**
2. `IntegrantesContactoComponent` — ficha de los organismos a los que pertenece un contacto, ruta `/agenda/:contactoId/organismos`. **Backend REAL (DB).**

- **Estado global:**
  - `/organismos` (las 4 tabs): vista funcional que consume HTTP real, pero el **backend es STUB** (datos hardcodeados en memoria, sin DB) → `src/AdministracionPn.Api/Controllers/StubControllers.cs:89-140` (`OrganismosController`).
  - `/agenda/:contactoId/organismos`: vista funcional que consume **endpoints reales con base de datos** (no stub) → `ContactosController.cs:138` (GET) e `IntegrantesOrganismoController.cs:15` (DELETE).
- **Rutas:** `/organismos` · `/agenda/:contactoId/organismos`
- **Componentes:**
  - `OrganismosComponent` (standalone) — `src/app/features/organismos/organismos.component.ts:233`
  - `IntegrantesContactoComponent` (standalone) — `src/app/features/organismos/integrantes-contacto.component.ts:110`
- **Nota arquitectura:** Stack transversal en [../architecture.md](../architecture.md): Angular 17.3 standalone + signals, `authGuard`, `authInterceptor`, `apiUrl = http://localhost:5000/api`.

---

## Propósito

- **OrganismosComponent**: administración/consulta de los organismos del partido (directorios, comisiones, bancadas, juntas) con cuatro vistas: el listado de organismos, la info de la organización, sus integrantes y referencias partidarias históricas. Cada tab tiene filtros por columna y exportación a CSV.
- **IntegrantesContactoComponent**: desde la agenda de contactos, ver la "ficha" de un contacto puntual mostrando todos los organismos en los que es integrante, con detalle expandible y baja lógica (marca como inactivo).

---

## Rutas y navegación

`src/app/app.routes.ts`:

```ts
// app.routes.ts:33
{ path: 'organismos', loadComponent: () => import('./features/organismos/organismos.component').then(m => m.OrganismosComponent) }
// app.routes.ts:17
{ path: 'agenda/:contactoId/organismos', loadComponent: () => import('./features/organismos/integrantes-contacto.component').then(m => m.IntegrantesContactoComponent) }
```

- Ambas son **lazy** (`loadComponent`) y están bajo `authGuard`.
- `/organismos` no recibe params.
- `/agenda/:contactoId/organismos` recibe el param `:contactoId` (leído con `route.snapshot.paramMap.get('contactoId')`, `integrantes-contacto.component.ts:121`).
- Navegación de `IntegrantesContactoComponent`: botón **"← Volver a contactos"** con `routerLink="/agenda"` (`integrantes-contacto.component.ts:13`). Es la única navegación con `routerLink` real de ambos componentes.

---

## Componente A — `OrganismosComponent`

### Estructura general

- Barra superior con un único botón **"📥 CSV"** (`organismos.component.ts:24-26`) que exporta el tab activo.
- 4 tabs (`organismos.component.ts:28-33`), controladas por el signal `tab`:
  - `todos` → "Todos los Organismos"
  - `info` → "Info de la Organización"
  - `integrantes` → "Integrantes"
  - `referencias` → "Ref. Partidarias"

### Tab "todos" (`organismos.component.ts:35-98`)

Tabla de organismos con columnas: Id, Nombre, Descripción, Dirección, Ciudad, Departamento (badge), País, Art. 44 (`☑`/`☐`), Orden Dpto., Observaciones (`|| '—'`), y columna de acción con un botón lápiz. Fila de filtros por columna (inputs de texto; Departamento y Art. 44 son `<select>`). Footer "Mostrando X de Y" (`organismos.component.ts:96`). Empty-state "Sin resultados" (`organismos.component.ts:92`).

### Tab "info" (`organismos.component.ts:100-150`)

Tabla de info de organización: Id Info., Id Tipo, Id Org. Est., Id Org. Part., Nombre Compañía, Abreviado, Departamento (badge), acción lápiz. Filtros por columna (Departamento como `<select>`). Footer + empty-state.

### Tab "integrantes" (`organismos.component.ts:152-197`)

Tabla: ID Contacto, Cred. Cívica, Apellidos, Nombres, Celular, Mail, Posición, Organismo, Depto. (badge). Filtros por columna (Depto. como `<select>`). Footer + empty-state. **Sin** columna de acción.

### Vistas de referencias partidarias (editables desde feature 028)

Dos pantallas muestran el mismo dato con distinto filtro, y **ambas permiten editar**:

| Ruta | Componente | Se entra desde |
|---|---|---|
| `/agenda/:contactoId/referencias` | `ReferenciasContactoComponent` | botón "Ver referencias partidarias" de la grilla de Agenda |
| `/organismos/:organismoId/referencias` | `ReferenciasOrganismoComponent` | botón de la grilla de Organismos |

- Cada fila ofrece **Editar**, que abre un `<app-modal-form>` con `rol`, `periodo`,
  `fechaDesignacion`, `fechaCese`, `art44` y `notas` — los campos que acepta
  `PUT /organismos/referencias/{id}`.
- Se edita sobre una **copia** de la fila: cancelar no toca la grilla. Un error del backend se muestra
  en el modal **sin perder lo escrito**.
- `aIsoDate()` (`core/fechas.ts`) convierte las fechas de `dd/MM/yyyy` (como las serializa el backend)
  a `yyyy-MM-dd`, que es lo único que acepta `<input type="date">`. Sin eso el campo aparece vacío y
  guardar borraría la fecha en silencio.
- El `PUT` exige `contactoId` y `organismoId`; si el organismo cambia, valida que sea partidario (que tenga organización partidaria, backend 035). La vista por **contacto** lo
  toma del DTO (`organismoId`, agregado por la feature 031); la vista por **organismo**, de la ruta.
- Antes de la feature 028 ambas vistas eran de **sólo lectura** (0 botones), aunque el endpoint de
  edición ya existía en el backend.

### Tab "referencias" (`organismos.component.ts:199-226`)

Tabla: Nombre, Cargo, Organismo, Período. Filtros por columna (todos inputs de texto). Footer + empty-state.

### Signals (`organismos.component.ts:237-297`)

| Signal | Tipo | Inicial | Notas |
|---|---|---|---|
| `tab` | `signal<Tab>` | `'todos'` | tab activa; `Tab = 'todos' \| 'info' \| 'integrantes' \| 'referencias'` (`organismos.component.ts:14`) |
| `organismos` | `signal<Organismo[]>` | `[]` | carga en constructor |
| `info` | `signal<InfoOrg[]>` | `[]` | carga lazy al entrar al tab |
| `integrantes` | `signal<IntegranteOrg[]>` | `[]` | carga lazy al entrar al tab |
| `referencias` | `signal<RefPart[]>` | `[]` | carga lazy al entrar al tab |
| Filtros tab "todos" | 10 `signal('')` | `''` | `fOrgId`, `fOrgNom`, `fOrgDesc`, `fOrgDir`, `fOrgCiu`, `fOrgDep`, `fOrgPais`, `fOrgArt`, `fOrgOrd`, `fOrgObs` (`organismos.component.ts:244-247`) |
| Filtros tab "info" | 7 `signal('')` | `''` | `fInfId`, `fInfTipo`, `fInfEst`, `fInfPart`, `fInfComp`, `fInfAbr`, `fInfDep` (`organismos.component.ts:263-265`) |
| Filtros tab "integrantes" | 9 `signal('')` | `''` | `fIntId`, `fIntCred`, `fIntApe`, `fIntNom`, `fIntCel`, `fIntMail`, `fIntPos`, `fIntOrg`, `fIntDep` (`organismos.component.ts:277-279`) |
| Filtros tab "referencias" | 4 `signal('')` | `''` | `fRefNom`, `fRefCar`, `fRefOrg`, `fRefPer` (`organismos.component.ts:292`) |

### Computed signals

- `orgDeptos` / `infoDeptos` / `intDeptos` (`organismos.component.ts:249, 267, 281`): lista única y ordenada de departamentos para poblar los `<select>` de filtro.
- `organismosFiltrados` (`organismos.component.ts:251-260`), `infoFiltrados` (`:269-274`), `integrantesFiltrados` (`:283-289`), `referenciasFiltradas` (`:294-297`): aplican los filtros en **cliente** usando el helper `m(val, q)` (`organismos.component.ts:17`: substring case-insensitive). Departamento y Art. 44 usan comparación exacta.

### Métodos

- `setTab(t)` (`organismos.component.ts:304-312`): cambia tab y hace **carga lazy** del dataset si aún está vacío.
- `exportarCsvTab()` (`organismos.component.ts:314-364`): exporta a CSV el dataset filtrado del tab activo, usando `exportarCSV` con columnas tipadas (`CsvColumn<T>`). Nombre de archivo con timestamp `YYYY-MM-DD` (`organismos.component.ts:315`), p.ej. `organismos-2026-06-14.csv`.

### Servicios inyectados

- `HttpClient` (`organismos.component.ts:234`), `PageTitleService` (`:235`, `set('Organismos')` en `:300`).

---

## Componente B — `IntegrantesContactoComponent`

### Qué muestra

- Botón "← Volver a contactos" (`routerLink="/agenda"`, `integrantes-contacto.component.ts:13`).
- Título "Ficha de Integrante de Organismo — Contacto #{{ contactoId }}" (`:18`).
- Si no hay items: empty-state "El contacto no está asociado a ningún organismo" (`:20-22`).
- Si hay items: tabla con columnas Id Int.Org., Id C., Nom. Comp., Nombres, P.-S. (partido-sector), Pos. Org., Orden, Nom. Org., Nota, y botón "Eliminar" (`:24-54`).
- **Fila expandible**: al hacer click en una fila se expande un panel de detalle con grid de pares clave/valor (Id Integrante, Contacto, Nombre Compañía, Nombre Organismo, Partido-Sector, Posición, Orden, Orden 2, Cargo, Condición, Fecha Designación, Fecha Fin, Nota) (`:55-80`). El botón "Eliminar" hace `$event.stopPropagation()` para no togglear (`:51`).

### Signals (`integrantes-contacto.component.ts:115-117`)

| Signal / prop | Tipo | Notas |
|---|---|---|
| `contactoId` | `number` (prop) | se setea en constructor desde el param de ruta (`:121`) |
| `items` | `signal<IntegranteOrganismo[]>` | inicial `[]`; cargado en `reload()` |
| `expandedId` | `signal<number \| null>` | inicial `null`; id de la fila expandida |

### Métodos

- `reload()` (`:125-127`): `svc.integrantesOrganismo(contactoId).subscribe(...)`.
- `toggle(id)` (`:129-131`): expande/colapsa la fila.
- `eliminar(id)` (`:133-139`): `confirm('¿Eliminar este integrante? Quedará marcado como inactivo.')` → `svc.eliminarIntegranteOrganismo(id)` → al completar, colapsa y `reload()`. Es **baja lógica** (marca inactivo en backend, no borra).

### Servicios inyectados

- `ActivatedRoute` (`:111`), `ContactosService` (`:112`), `PageTitleService` (`:113`, `set('Ficha de Integrante de Organismo')` en `:120`).

---

## API consumida

### OrganismosComponent (todas STUB en backend)

| Método | Ruta exacta | Cuándo (archivo:línea) | Tipo | Backend |
|---|---|---|---|---|
| `GET` | `${apiUrl}/organismos` | constructor — `organismos.component.ts:301` | `Organismo[]` | **STUB** `StubControllers.cs:133` (`List`) |
| `GET` | `${apiUrl}/organismos/info` | `setTab('info')` lazy — `organismos.component.ts:307` | `InfoOrg[]` | **STUB** `StubControllers.cs:135` |
| `GET` | `${apiUrl}/organismos/integrantes` | `setTab('integrantes')` lazy — `organismos.component.ts:309` | `IntegranteOrg[]` | **STUB** `StubControllers.cs:136` |
| `GET` | `${apiUrl}/organismos/referencias` | `setTab('referencias')` lazy — `organismos.component.ts:311` | `RefPart[]` | **STUB** `StubControllers.cs:137` |

`OrganismosController` (`StubControllers.cs:89-140`) devuelve arrays de `record` estáticos hardcodeados (`_orgs`, `_info`, `_integ`, `_ref`). También expone `GET /organismos/todos`, `/estatales`, `/partidarios` (`StubControllers.cs:134,138,139`) que **el front NO consume**.

### IntegrantesContactoComponent (REAL — DB)

Vía `ContactosService` (`src/app/features/agenda/contactos.service.ts`):

| Método | Ruta exacta | Llamada front | Backend |
|---|---|---|---|
| `GET` | `${apiUrl}/contactos/{id}/integrantes-organismo` | `svc.integrantesOrganismo(id)` — `contactos.service.ts:110`, invocado en `integrantes-contacto.component.ts:126` | **REAL (DB)** `ContactosController.cs:138-158` — consulta `_db.MiembrosOrganismo` con joins, filtra `m.Activo` |
| `DELETE` | `${apiUrl}/integrantes-organismo/{id}` | `svc.eliminarIntegranteOrganismo(id)` — `contactos.service.ts:111`, invocado en `integrantes-contacto.component.ts:135` | **REAL (DB)** `IntegrantesOrganismoController.cs:15-23` — baja lógica: `m.Activo = false; SaveChangesAsync()` |

> Nota: el `base` de `ContactosService` es `${apiUrl}/contactos` (de ahí `…/contactos/{id}/integrantes-organismo`), mientras que el DELETE usa `environment.apiUrl` directo (`…/integrantes-organismo/{id}`).

---

## Modelos / interfaces

### En `organismos.component.ts:9-12` (locales)

```ts
interface Organismo { id: number; nombre: string; descripcion: string; direccion: string; ciudad: string; departamento: string; pais: string; art44: boolean; ordenDpto: number; observaciones?: string; }
interface InfoOrg { id: number; idTipo: number; idEstatal: number; idPartidario: number; nombreCompania: string; nombreAbreviado: string; departamento: string; }
interface IntegranteOrg { idContacto: number; credCivica: string; apellidos: string; nombres: string; celular: string; mail: string; posicion: string; organismo: string; departamento: string; }
interface RefPart { nombre: string; cargo: string; organismo: string; periodo: string; }
type Tab = 'todos' | 'info' | 'integrantes' | 'referencias'; // organismos.component.ts:14
```

### En `contactos.service.ts:43-58` (compartido)

```ts
export interface IntegranteOrganismo {
  id: number; contactoId: number; nombres: string;
  nombreCompania?: string; nombreOrganismo?: string; partidoSector?: string;
  posicionOrganismo?: string; orden?: number; orden2?: number;
  cargo?: string; condicion?: string; nota?: string;
  fechaFin?: string; fechaDesignacion?: string;
}
```

Helpers (`organismos.component.ts:16-17`): `norm(s)` (lowercase) y `m(val, q)` (substring case-insensitive para filtrado en cliente).

---

## Interacciones / UX

- **OrganismosComponent**: tabs con carga lazy; filtros por columna en vivo (signals + computed); selects de Departamento poblados dinámicamente; Art. 44 filtrable Sí/No; export CSV del tab activo; footer de conteo; empty-states por tab. Botones lápiz "Editar (no implementado)" → sin acción.
- **IntegrantesContactoComponent**: filas clickeables que expanden detalle (`tr.clickable`, `tr.selected`); botón Eliminar con `confirm()` y baja lógica; estilos propios en `styles[]` (`integrantes-contacto.component.ts:88-108`), grid responsive del detalle.

---

## Dependencias

### OrganismosComponent
- `@angular/core`: `Component`, `computed`, `inject`, `signal` (`organismos.component.ts:1`).
- `@angular/common`: `CommonModule` (`:2`); `@angular/forms`: `FormsModule` (para `[ngModel]` de filtros) (`:3,22`).
- `@angular/common/http`: `HttpClient` (`:4`).
- `environment` (`:5`), `PageTitleService` (`:6`).
- `exportarCSV`, `CsvColumn` — `src/app/core/exportar-csv` (`:7`).

### IntegrantesContactoComponent
- `@angular/core`: `Component`, `inject`, `signal` (`integrantes-contacto.component.ts:1`).
- `@angular/common`: `CommonModule` (`:2`); `@angular/router`: `ActivatedRoute`, `RouterLink` (`:3,10`).
- `ContactosService`, `IntegranteOrganismo` — `src/app/features/agenda/contactos.service` (`:4`).
- `PageTitleService` (`:5`).

---

## No implementado / gaps

### OrganismosComponent
- **Backend STUB**: los 4 endpoints de `/organismos/*` devuelven datos fijos en memoria, sin DB (`StubControllers.cs:89-140`). La vista del front es real (HTTP, filtros y export reales), pero los datos de fondo son ficticios.
- **Botones de editar no implementados**: lápices con `title="Editar (no implementado)"` en tabs "todos" e "info" (`organismos.component.ts:83, 135`) → sin handler.
- **Sin alta/edición/baja** de organismos desde esta vista; solo lectura + filtro + export.

### IntegrantesContactoComponent
- **Vista real, datos reales**: consume endpoints DB-backed (no stub). Funcional para listar y dar de baja (lógica).
- **No tiene alta ni edición** de integrantes desde aquí (solo listar, ver detalle y eliminar lógicamente).
- No hay manejo explícito de estados de error HTTP.

## Actualización feature 030

El filtro y el formulario de departamento usan `[...DEPARTAMENTOS, 'Nacional']` (lista canónica + organismos de alcance nacional) en lugar de una copia hardcodeada.

## Actualización feature 032 (espejo backend 035) — 2026-10-02

> Esta sección manda sobre lo anterior en lo que respecta al modelo de organismo.

- **Modelo**: un organismo por cada uno del sistema viejo. `ambito` dejó de existir; cada organismo tiene
  `organizacionEstatalId/Nombre` y `organizacionPartidariaId/Nombre` (opcionales, no excluyentes: AFE tiene
  ambas), `infoOrganizacionId` (info compartida) y `tipoOrganizacionId` opcional
  (`core/models/organismos.ts`).
- **Grilla "Todos"**: la columna **Clasificación** muestra un badge por organización (estatal azul,
  partidaria naranja) o "—". No es ordenable. El filtro de la columna (Todos / Estatal / Partidario) manda
  `?ambito=`, que en el backend significa "tiene esa organización" (un organismo con ambas aparece en los dos).
- **Formulario de organismo**: selects **Organización estatal** y **Organización partidaria** (con
  "— Ninguna —", catálogos `GET /organismos/organizaciones-estatales|partidarias`, cargados una vez en el
  constructor), **Info de organización (Id)** numérico, tipo de organización opcional. Alta y edición mandan
  el mismo `OrganismoInput` (sin ámbito); solo el nombre es obligatorio.
- **Info de organización**: sin "Id Organismo" en grilla, formulario ni CSV (la relación va del organismo a
  la info).
- **CSV de organismos**: "Org. estatal" y "Org. partidaria" en lugar de "Ámbito".

## Actualización feature 033 (espejo backend 036) — 2026-10-03

> Manda sobre todo lo anterior en cuanto a la estructura de `OrganismosComponent`.

- **Sin pestañas.** `/organismos` es la lista de **infos de organización** (paginada, orden por nombre o Id),
  con un acordeón de dos niveles: **info → organismos → integrantes**.
- **Fila de info**: nombre (derivado por el backend del `NombreCompania` de sus organismos; sin organismos →
  "Info #id"), Id, tipo, dirección, teléfono, email, observaciones, cantidad de organismos y editar. Las
  infos sin organismos no se despliegan. Se conservan los filtros de dirección y email.
- **Desplegable de info**: todos sus organismos (`GET /organismos?infoOrganizacionId=…&all=true`), con la
  misma estructura que la vieja grilla de organismos (clasificación, editar, "Referencias partidarias"). Cada
  organismo se despliega a sus integrantes. Hay caché por info y por organismo, y un solo desplegable abierto
  por nivel.
- **Fila "Sin info de organización"** al principio de la página 1 si hay organismos sin info que pasan el
  buscador (`sinInfo=true`).
- **Buscador "Buscar organismo…"**: manda `nombreOrganismo` a `GET /organismos/info` y `nombre` a los
  desplegables, así que se ven solo las infos y los organismos que coinciden. Al cambiar vuelve a la página 1
  y colapsa todo.
- **Altas y ediciones**: "+ Nueva Info" y "+ Nuevo Organismo" en la topbar. Guardar recarga la lista y
  descarta los desplegables.
- **CSV**: infos (nombre, id, tipo, contacto, cantidad de organismos) con el buscador aplicado.

## Actualización feature 034 (espejo backend 037) — 2026-10-03

- **Organismo e info tienen cada uno su nombre.** `OrganismoDto/Input` ya no tienen `nombreCompania`. La info
  tiene `nombre` propio, que se edita en su formulario (campo "Nombre"). La grilla muestra ese nombre
  ("Info #id" solo si está vacío).
- **Alta de integrante** (`integrante-organismo-nuevo`): el select "Compañía" lista las infos de organización
  (por su nombre) y el de organismo filtra por `infoOrganizacionId`.
- **Filtro por nombre de info** (2026-10-03): input en la columna Nombre de la grilla de infos → `?nombre=` (nombre
  propio de la info, sin acentos, "contiene"). Es independiente del buscador por nombre de organismo, y se pueden combinar.

## Actualización feature 035 (espejo backend 038) — 2026-10-03

Las vistas de referencias partidarias (de un organismo y de un contacto) muestran también las **calculadas desde
integrantes finalizados** sin referencia (`origen === 'Integrante'`, `id` 0). Van con la marca "Desde integrante",
en gris y sin botón Editar, y se trackean por `integranteId`. En la agenda, el botón "Ver referencias partidarias"
aparece también cuando el contacto solo tiene calculadas (el flag ya viene del backend).

## Actualización feature 036 — alta manual de referencias (2026-10-03)

- **Referencias de un contacto**: botón **"+ Crear referencia"** con el contacto fijo y buscador de organismo
  partidario (opcional; filtro sin acentos sobre `GET /organismos?ambito=Partidario&all=true`).
- **Referencias de un organismo**: el título muestra el nombre del organismo; **"+ Crear referencia"** solo si el
  organismo es partidario (`GET /organismos/{id}`). Tiene buscador de contacto (debounce, 8 resultados, la cédula
  "0" no se muestra).
- Campos: Rol / Cargo (obligatorio), Período, fechas de designación y cese, Art. 44 y Notas → `POST
  /organismos/referencias`. Si es del mismo contacto + organismo que una fila "Desde integrante", esa fila deja de
  aparecer.
