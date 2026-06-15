# Dashboard (Inicio)

**Estado:** Implementado
**Ruta:** `/inicio`
**Componente:** `DashboardComponent` — `src/app/features/dashboard/dashboard.component.ts:275`

> Contexto transversal (Angular 17.3 standalone + signals, `authGuard`, `authInterceptor`, `apiUrl = http://localhost:5000/api`): ver `../architecture.md`. Esta spec no redocumenta esos aspectos.

---

## Propósito

Pantalla de inicio de la aplicación. Cumple dos funciones:

1. Mostrar un panel de **tarjetas de resumen** con métricas agregadas de la organización (contactos, adhesiones, productos, ventas y donaciones del mes).
2. Proveer un **calendario mensual** con eventos (públicos y privados), incluyendo creación y eliminación de eventos directamente desde la grilla.

Es el destino por defecto tras el login (`login.component.ts:54` navega a `/inicio`) y la redirección raíz (`app.routes.ts:11`).

---

## Rutas y navegación

- `app.routes.ts:7-12`: la ruta vacía `''` está protegida por `canActivate: [authGuard]` (`app.routes.ts:8`) y carga el `ShellComponent` como layout (`app.routes.ts:9`).
- `app.routes.ts:11`: `{ path: '', pathMatch: 'full', redirectTo: 'inicio' }` — la raíz redirige a `inicio`.
- `app.routes.ts:12`: `{ path: 'inicio', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) }` — carga diferida (lazy) del componente standalone.
- El componente **no define rutas hijas ni navega programáticamente** a otras secciones; toda la interacción es interna (modales del calendario). No usa `Router`.

---

## Componente

Standalone, `imports: [CommonModule, FormsModule]` (`dashboard.component.ts:42-43`). Template y estilos inline (`dashboard.component.ts:44-273`).

### Dependencias inyectadas (`dashboard.component.ts:276-278`)

- `HttpClient` — llamadas a la API.
- `PageTitleService` — fija el título de página a `'Inicio'` en el constructor (`dashboard.component.ts:329`).
- `AuthService` — para obtener el usuario actual de la sesión.

### Signals de estado

| Signal | Tipo | Inicial | Línea | Rol |
|---|---|---|---|---|
| `resumen` | `Resumen \| null` | `null` | `282` | Datos de las tarjetas de resumen. |
| `eventos` | `Evento[]` | `[]` | `283` | Eventos del mes visible. |
| `anio` | `number` | año actual | `285` | Año del mes mostrado en el calendario. |
| `mes` | `number` | mes actual (0-11) | `286` | Mes mostrado (índice 0-based). |
| `modal` | `'crear' \| 'ver' \| null` | `null` | `288` | Qué modal está abierto. |
| `eventoSel` | `Evento \| null` | `null` | `289` | Evento seleccionado en el modal "ver". |
| `modalError` | `string` | `''` | `290` | Mensaje de error dentro del modal de creación. |
| `busy` | `boolean` | `false` | `291` | Bloquea botones durante guardado/borrado. |
| `soloPrivados` | `boolean` | `false` | `292` | Filtro de vista: todos vs. solo privados. |
| `form` | `any` | objeto vacío | `293` | Modelo del formulario de nuevo evento (no es signal; objeto mutable con `ngModel`). |

### Computed signals

- `usuario` (`dashboard.component.ts:295`): `this.auth.session()?.usuario ?? 'desconocido'` — nombre del usuario logueado.
- `tituloMes` (`dashboard.component.ts:297`): `"${MESES[mes()]} ${anio()}"` (constante `MESES`, `dashboard.component.ts:37`).
- `dias` (`dashboard.component.ts:299-326`): construye la grilla del calendario como `DiaCalendario[]`. Calcula el primer día de la semana con semana iniciando en lunes (`firstDow = (firstDay.getDay() + 6) % 7`, `dashboard.component.ts:303`), genera filas completas de 7 días (`total = Math.ceil((firstDow + lastDay.getDate()) / 7) * 7`, `dashboard.component.ts:305`), marca `inMonth`/`isToday`, y asigna a cada día los eventos cuya `fechaInicio.slice(0,10)` coincide con la fecha ISO, ordenados por `fechaInicio` (`dashboard.component.ts:320-323`).

### Qué muestra el template

**Tarjetas de resumen** (`dashboard.component.ts:45-52`), grilla `.stats-grid`, 6 tarjetas; cada valor usa `?? '—'` (o `?? 0` en donaciones):

1. `resumen()?.contactos` — "Contactos en Agenda" (`:46`)
2. `resumen()?.adhesionesWebPendientes` — "Adhesiones Web Pendientes" (`:47`)
3. `resumen()?.adhesionesLocales` — "Adhesiones Locales" (`:48`)
4. `resumen()?.productos` — "Productos" (`:49`)
5. `resumen()?.ventasMes` — "Ventas este mes" (`:50`)
6. `resumen()?.donacionesMes` — "Donaciones este mes", prefijado con `$` (`:51`)

**Calendario** (`dashboard.component.ts:54-92`):
- Cabecera con toggle de vista "Todos" / "Solo privados" (`:58-63`), navegación `‹` / `›` entre meses (`:64-66`), título del mes (`:65`), botón "Hoy" (`:67`).
- Grilla de 7 columnas: encabezados de día de la semana `DIAS_SEM` (Lun..Dom, `:72-74`; constante en `dashboard.component.ts:38`) y celdas por día (`:75-89`).
- Cada celda: número de día, clases `outside`/`today`, lista de eventos clicables (`:79-85`) y botón flotante `+` para crear (`:87`).
- Cada evento muestra hora (`formatoHora`), título, ícono `🔒` si `!esPublico`; clase `.priv` para privados (`:80-84`).

**Modal "crear"** (`dashboard.component.ts:94-135`): formulario con campos Título, Fecha (`type=date`), Hora (`type=time`), Tipo (select: `Reunion`, `Asamblea`, `Convencion`, `Eleccion`, `Otro`; `:108-112`), Descripción (textarea), toggle de visibilidad Público/Privado (`:117-123`), muestra "Creado por: {{ usuario() }}" (`:124`) y error si `modalError()`.

**Modal "ver"** (`dashboard.component.ts:137-166`): vista de solo lectura del evento seleccionado (fecha/hora, hasta, tipo, visibilidad, creador, descripción) con botones "Eliminar" y "Cerrar".

---

## API consumida

Todas relativas a `environment.apiUrl` (= `http://localhost:5000/api`). El bearer token lo agrega el `authInterceptor` (ver `../architecture.md`).

| Método + ruta (relativa a apiUrl) | Vía | Dónde | Dato |
|---|---|---|---|
| `GET /dashboard/resumen` | `this.http.get<Resumen>` | `dashboard.component.ts:330` (constructor) | Métricas de las 6 tarjetas → `resumen.set(r)`. |
| `GET /calendario/eventos?anio={anio}&mes={mes+1}&soloPrivados={bool}` | `this.http.get<Evento[]>` | `dashboard.component.ts:334-337` (`cargarEventos`) | Eventos del mes visible → `eventos.set(x)`. Nótese `mes()+1` (la API espera mes 1-12). |
| `POST /calendario/eventos` | `this.http.post<Evento>` | `dashboard.component.ts:392-400` (`guardarNuevo`) | Crea evento. Body: `{ titulo, fechaInicio, fechaFin: null, descripcion, tipo, creadorNombre, esPublico }`. |
| `DELETE /calendario/eventos/{id}` | `this.http.delete` | `dashboard.component.ts:414` (`eliminar`) | Elimina el evento seleccionado por su `id`. |

Detalles del body de creación (`dashboard.component.ts:392-400`):
- `titulo`: `form.titulo.trim()`
- `fechaInicio`: `"${form.fecha}T${form.hora}:00"` (compuesta en `:391`)
- `fechaFin`: siempre `null` (el formulario no captura fin)
- `descripcion`: `form.descripcion || null`
- `tipo`: `form.tipo || null`
- `creadorNombre`: `this.usuario()` (usuario logueado)
- `esPublico`: `form.esPublico`

`cargarEventos()` se invoca en el constructor (`:331`) y tras cada cambio de mes/filtro/CRUD.

---

## Modelos / interfaces

Definidos localmente en el archivo (no compartidos):

**`Resumen`** (`dashboard.component.ts:9-16`):
```
contactos: number
adhesionesWebPendientes: number
adhesionesLocales: number
productos: number
ventasMes: number
donacionesMes: number
```

**`Evento`** (`dashboard.component.ts:18-27`):
```
id: number
titulo: string
fechaInicio: string
fechaFin?: string
descripcion?: string
tipo?: string
creadorNombre?: string
esPublico: boolean
```

**`DiaCalendario`** (`dashboard.component.ts:29-35`) — VM interna de la grilla:
```
fecha: Date
isoDate: string
inMonth: boolean
isToday: boolean
eventos: Evento[]
```

**Constantes:** `MESES` (12 nombres en español, `:37`), `DIAS_SEM` (`Lun`..`Dom`, `:38`).

---

## Interacciones / UX

- **Filtro de vista** (`setSoloPrivados`, `dashboard.component.ts:339-342`): "Todos" / "Solo privados" → re-fetch de eventos con `soloPrivados`.
- **Navegación de meses**: `prevMes` (`:344-348`) y `nextMes` (`:349-353`) ajustan año/mes con wrap (dic↔ene) y re-cargan; `hoy` (`:354-358`) vuelve al mes actual.
- **Crear evento** (`abrirCrear`, `:374-378`): el botón `+` de un día abre el modal con `form.fecha = isoDate` y hora por defecto `09:00`. `guardarNuevo` (`:387-407`) valida título obligatorio (`:388`) y fecha+hora obligatorias (`:389`); en éxito cierra modal y recarga; en error muestra `err?.error?.message` o mensaje genérico (`:404`).
- **Ver evento** (`abrirVer`, `:379-382`): click sobre un evento abre el modal de detalle.
- **Eliminar evento** (`eliminar`, `:409-418`): pide confirmación con `confirm(...)` nativo (`:412`); en éxito recarga; en error usa `alert(...)` (`:416`).
- **Cerrar modal** (`cerrarModal`, `:383-385`): click en backdrop o botón ×.
- Formato de hora `formatoHora` (`:365-367`, `slice(11,16)` de la ISO) y fecha completa `formatoFechaCompleta` (`:368-372`, `toLocaleString('es-UY', ...)`).
- **No hay navegación a otras secciones** desde el dashboard (las tarjetas no son clicables / no enrutan).

---

## Dependencias

- Angular: `Component, computed, inject, signal` (`dashboard.component.ts:1`), `CommonModule` (`:2`), `FormsModule` (`:3`, para `ngModel`), `HttpClient` (`:4`).
- `environment` (`:5`) para `apiUrl`.
- `PageTitleService` (`:6`, `src/app/core/page-title.service.ts`) — fija título "Inicio".
- `AuthService` (`:7`, `src/app/core/auth.service.ts`) — `session()?.usuario` para `creadorNombre`/display.
- Layout `ShellComponent` como contenedor de ruta (`app.routes.ts:9`).
- API backend: módulos `dashboard` y `calendario`.

---

## No implementado / gaps

- **Sin estado de carga ni manejo de error** para `GET /dashboard/resumen` (`:330`) ni para `cargarEventos` (`:336`): si fallan, las tarjetas quedan en `—` / `0` y el calendario vacío sin aviso.
- **No se editan eventos**: solo crear y eliminar. El modal "ver" no ofrece edición; `tipo` y `esPublico` no se pueden modificar tras crear.
- **`fechaFin` no se captura** en el formulario; se envía siempre `null` (`:395`), aunque la interfaz `Evento` y el modal "ver" lo soportan (`:146-148`).
- **`form` es `any`** (`:293`), sin tipado fuerte.
- **Tarjetas no son interactivas**: no hay enlaces a Agenda/Adhesiones/Productos desde las métricas.
- **Validación mínima** en creación (título + fecha/hora). Sin validación de formato más allá de los inputs nativos.
- **`confirm`/`alert` nativos** para eliminar (`:412`, `:416`), no modales propios de la app.
- El filtro `soloPrivados` se manda al backend pero no hay control de rol en el front: la separación público/privado depende del API.
- **`architecture.md` referenciada no existe aún** en `project/` (no se encontró el archivo al redactar esta spec).
