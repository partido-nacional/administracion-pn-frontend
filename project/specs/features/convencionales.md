# Feature: Convencionales

- **Estado:** Vista funcional que consume HTTP real (sin mock en el front), pero el **backend es STUB**: todos los endpoints de `/convencionales/*` devuelven datos **hardcodeados en memoria** (sin base de datos) → `src/AdministracionPn.Api/Controllers/StubControllers.cs:26-87` (`ConvencionalesController`). En la práctica la pantalla siempre muestra los mismos datos fijos.
- **Ruta:** `/convencionales`
- **Componente:** `ConvencionalesComponent` (standalone) — `src/app/features/convencionales/convencionales.component.ts:168`
- **Nota arquitectura:** Stack transversal en [../architecture.md](../architecture.md): Angular 17.3 standalone + signals, `authGuard`, `authInterceptor`, `apiUrl = http://localhost:5000/api`.

> No confundir con `/listados/convencionales` (`ConvencionalesListadoComponent`, `app.routes.ts:30`), que es un componente distinto y consume un endpoint **real con DB** (`ListadosController.Convencionales`, `StubControllers.cs:336-353`). Este spec documenta **solo** `/convencionales`.

---

## Propósito

Vista maestra de convencionales del partido (delegados electos) con cinco solapas: convencionales nacionales (ODN), departamentales (ODD), listas ODN, listas ODD e integrantes de lista. Incluye tarjetas de estadísticas y búsqueda en cliente.

---

## Rutas y navegación

`src/app/app.routes.ts:35`:

```ts
{ path: 'convencionales', loadComponent: () => import('./features/convencionales/convencionales.component').then(m => m.ConvencionalesComponent) }
```

- **Lazy** (`loadComponent`), bajo `authGuard`. Sin parámetros de ruta.
- No navega a otras vistas: los `action-link` ("Detalle", "Ver Integrantes", el `{{ c.contacto }}`) son `<a>` sin `routerLink` ni handler.

---

## Componente (qué muestra, tabs, signals)

### Tabs (`convencionales.component.ts:20-26`)

Controladas por el signal `tab` (`Tab = 'nacionales' | 'departamentales' | 'odn' | 'odd' | 'integrantes'`, `:13`):

- `nacionales` → "Nacionales"
- `departamentales` → "Departamentales"
- `odn` → "Listas ODN"
- `odd` → "Listas ODD"
- `integrantes` → "Integrantes de Lista"

### Tab "nacionales" (`convencionales.component.ts:28-75`)

- **Grid de 4 stat-cards** (`:29-34`): Conv. Nacionales (`stats().nacionales`), Conv. Departamentales (`stats().departamentales`), Listas ODN (`stats().listasOdn`), Listas ODD (`stats().listasOdd`). Solo se muestra en este tab.
- **Toolbar** con search-box (`[(ngModel)]="q"`) y botón "Exportar TSV" (`:36-44`).
- **Tabla**: ID, Nombre, Lista ODN, Código LRF, Departamento (badge), Cargo, Contacto (action-link), columna de acción ("Detalle" + lápiz). Filas vienen de `filtrar(nacionales())`.

### Tab "departamentales" (`convencionales.component.ts:77-98`)

Tabla: ID, Nombre, Lista ODD, Código LRF, Departamento (badge), Cargo, Contacto. Filas de `departamentales()` directo (**sin** aplicar `filtrar`; el search-box no se renderiza en este tab).

### Tabs "odn" / "odd" (`convencionales.component.ts:100-129`)

Un mismo bloque sirve ambos (`@if (tab()==='odn' || tab()==='odd')`). Tabla de listas: Código LRF, Nombre de Lista, Departamento (badge), Titulares, Suplentes, Total (`titulares + suplentes`), acción ("Ver Integrantes" + lápiz). Fuente: `tab()==='odn' ? odn() : odd()` (`:107`).

### Tab "integrantes" (`convencionales.component.ts:131-165`)

- Toolbar con `<select>` Tipo (`[(ngModel)]="filtroTipo"`, opciones ODN/ODD) + search-box (`[(ngModel)]="q"`) (`:132-142`).
- Tabla: Nombre, Cédula, Lista, Código LRF, Tipo, Depto. (badge), Cargo, Orden, Contacto. Filas de `filtrarInteg()`.

### Signals y estado (`convencionales.component.ts:172-181`)

| Signal / prop | Tipo | Inicial | Notas |
|---|---|---|---|
| `tab` | `signal<Tab>` | `'nacionales'` | tab activa |
| `q` | `string` (prop, no signal) | `''` | texto de búsqueda (`[(ngModel)]`) |
| `filtroTipo` | `string` (prop, no signal) | `''` | filtro Tipo del tab integrantes |
| `nacionales` | `signal<Convencional[]>` | `[]` | carga en constructor |
| `departamentales` | `signal<Convencional[]>` | `[]` | carga lazy |
| `odn` | `signal<Lista[]>` | `[]` | carga lazy |
| `odd` | `signal<Lista[]>` | `[]` | carga lazy |
| `integ` | `signal<IntegranteLista[]>` | `[]` | carga lazy |
| `stats` | `signal<Stats>` | `{ nacionales:0, departamentales:0, listasOdn:0, listasOdd:0 }` | carga en constructor |

### Métodos

- `setTab(t)` (`convencionales.component.ts:189-199`): cambia tab y hace **carga lazy** del dataset correspondiente si está vacío.
- `filtrar(arr)` (`:201-205`): filtro en cliente sobre `q` por `nombre`, `lista` o `departamento` (case-insensitive). Solo se aplica en el tab "nacionales".
- `filtrarInteg()` (`:207-215`): filtra `integ()` por `filtroTipo` (match exacto) y por `q` (sobre `nombre` o `lista`).

### Servicios inyectados

- `HttpClient` (`:169`), `PageTitleService` (`:170`, `set('Convencionales')` en `:184`).

---

## API consumida

Todas las rutas resuelven a `http://localhost:5000/api/...`. **Todos los endpoints son STUB** (`ConvencionalesController`, `StubControllers.cs:26-87`, devuelve `record` estáticos en memoria).

| Método | Ruta exacta | Cuándo (archivo:línea front) | Tipo | Backend (StubControllers.cs) |
|---|---|---|---|---|
| `GET` | `${apiUrl}/convencionales/stats` | constructor — `convencionales.component.ts:185` | `Stats` | **STUB** `:86` → `{ nacionales=623, departamentales=1247, listasOdn=84, listasOdd=156 }` |
| `GET` | `${apiUrl}/convencionales/nacionales` | constructor — `:186` | `Convencional[]` | **STUB** `:80` (array `_nac`) |
| `GET` | `${apiUrl}/convencionales/departamentales` | `setTab('departamentales')` lazy — `:192` | `Convencional[]` | **STUB** `:81` (array `_dep`) |
| `GET` | `${apiUrl}/convencionales/listas/odn` | `setTab('odn')` lazy — `:194` | `Lista[]` | **STUB** `:83` (array `_odn`) |
| `GET` | `${apiUrl}/convencionales/listas/odd` | `setTab('odd')` lazy — `:196` | `Lista[]` | **STUB** `:84` (array `_odd`) |
| `GET` | `${apiUrl}/convencionales/integrantes` | `setTab('integrantes')` lazy — `:198` | `IntegranteLista[]` | **STUB** `:85` (array `_inte`) |

> El backend también expone `GET /api/convencionales` y `GET /api/convencionales/listas` (`StubControllers.cs:79, 82`) que el front **no** consume.

> Las stats (623 / 1247 / 84 / 156) son números fijos que **no** coinciden con la cantidad real de filas devueltas (p.ej. `_nac` tiene 7 elementos): son valores de demo hardcodeados.

---

## Modelos / interfaces

Definidos localmente en `convencionales.component.ts:8-11` (no compartidos):

```ts
interface Convencional { id: number; nombre: string; lista: string; codigoLrf: string; departamento: string; cargoLista: string; contacto: string; }
interface Lista { codigoLrf: string; nombre: string; departamento: string; titulares: number; suplentes: number; }
interface IntegranteLista { nombre: string; cedula: string; lista: string; codigoLrf: string; tipo: string; departamento: string; cargoLista: string; orden: number; contacto: string; }
interface Stats { nacionales: number; departamentales: number; listasOdn: number; listasOdd: number; }
type Tab = 'nacionales' | 'departamentales' | 'odn' | 'odd' | 'integrantes'; // :13
```

---

## Interacciones / UX

- **Tabs** con carga lazy del dataset (`setTab`).
- **Búsqueda (`q`)**: en vivo, solo afecta tabs "nacionales" e "integrantes". Tab "departamentales", "odn" y "odd" no tienen búsqueda.
- **Filtro Tipo** (ODN/ODD) exclusivo del tab "integrantes".
- **Badges de departamento** (`badge dept`); **Total** de listas calculado en template (`titulares + suplentes`).
- Sin estados de loading/empty/error explícitos: las tablas se muestran vacías hasta que llega la respuesta.

---

## Dependencias

- `@angular/core`: `Component`, `inject`, `signal` (`convencionales.component.ts:1`).
- `@angular/common`: `CommonModule` (`:2`); `@angular/forms`: `FormsModule` (para `[(ngModel)]`) (`:3,18`).
- `@angular/common/http`: `HttpClient` (`:4`).
- `environment` (`:5`), `PageTitleService` (`:6`).
- **No** importa `RouterLink`, ni `exportarCSV`, ni service de feature.

---

## No implementado / gaps

- **Backend STUB**: todos los endpoints `/convencionales/*` devuelven datos fijos en memoria, sin DB (`StubControllers.cs:26-87`). La vista del front es real (consume HTTP, filtra en cliente), pero los datos son ficticios; las stats no se corresponden con las filas.
- **"Exportar TSV" no implementado** (`convencionales.component.ts:43`): botón sin `(click)` → sin acción (a diferencia de Organismos, que sí exporta CSV).
- **Botones de editar no implementados**: lápices con `title="Editar (no implementado)"` en tabs "nacionales" y "odn/odd" (`convencionales.component.ts:63, 117`) → sin handler.
- **Acciones de navegación inertes**: "Detalle" (`:62`), "Ver Integrantes" (`:116`) y el contacto `{{ c.contacto }}` (`:60, 92, 159`) son enlaces sin `routerLink`/handler.
- **Tab "departamentales" no usa `filtrar()`**: la tabla itera `departamentales()` directo (`:84`) y el search-box ni siquiera se renderiza en ese tab.
- Sin alta/edición/baja, sin paginación, sin manejo de errores HTTP.

## Actualización feature 030

Dropdown de departamento junto al buscador en las 3 pestañas (Todos/Nacionales, Departamentales, Listas ODN).
- Filtra **en el cliente**, porque esos endpoints no paginan: `normDepto(x.departamento) === normDepto(elegido)`.
- Se combina con la búsqueda de texto existente.
