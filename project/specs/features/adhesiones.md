# Feature: Adhesiones (Frontend Angular 17)

> **Fuente de verdad** — comportamiento real del código (verificado 2026-06-14). Ver `../architecture.md` para lo transversal (Angular 17.3 standalone + signals, `authGuard`/interceptor, `apiUrl=http://localhost:5000/api`, `PageTitleService`).

**Estado**: ⚠️ Funcional con gaps · **Rutas**: `/adhesiones`, `/agenda/:contactoId/fichas`, `/agenda/:contactoId/fichas/nueva` · **Componentes**: `AdhesionesListadoComponent`, `FichasContactoComponent`, `NuevaFichaComponent` (+ `AdhesionesService`)

Los tres componentes son `standalone` y se cargan vía `loadComponent` lazy bajo el shell protegido por `authGuard` (`src/app/app.routes.ts:8`, `:15`, `:16`, `:19`). Todas las llamadas HTTP usan `environment.apiUrl` y pasan por el interceptor/auth descrito en `../architecture.md`.

---

## Propósito

Gestionar las **adhesiones** (afiliaciones aportantes) al partido desde dos orígenes y dos vistas:

1. **Listado global** (`/adhesiones`, `AdhesionesListadoComponent`): bandeja operativa con dos solapas — adhesiones **pendientes en web** (las que llegan desde el formulario público de la nube) y adhesiones **locales** (las ya cargadas/confirmadas en el sistema interno), más tarjetas de estadísticas. Permite "pasar a local" una web, eliminar registros y crear una local rápida. (`src/app/features/adhesiones/adhesiones-listado.component.ts`)
2. **Fichas por contacto** (`/agenda/:contactoId/fichas`, `FichasContactoComponent`): historial de fichas de adhesión de un contacto concreto, con expansión inline y edición de la ficha. (`src/app/features/adhesiones/fichas-contacto.component.ts`)
3. **Alta de ficha** (`/agenda/:contactoId/fichas/nueva`, `NuevaFichaComponent`): formulario de alta de una nueva ficha de adhesión para un contacto, con campos condicionales según el sistema de contribución y el destino del aporte. (`src/app/features/adhesiones/nueva-ficha.component.ts`)

La feature está fuertemente acoplada a **Contactos/Agenda**: las fichas viven colgadas de un `contactoId`, y `FichaAdhesion`/`FichaAdhesionDetalle` se definen en `contactos.service.ts` (ver [Dependencias](#dependencias)).

---

## Rutas y navegación

| Ruta | Componente | Origen de navegación | Definición |
|------|-----------|----------------------|------------|
| `/adhesiones` | `AdhesionesListadoComponent` | Menú/shell | `app.routes.ts:19` |
| `/agenda/:contactoId/fichas` | `FichasContactoComponent` | Botón "Ficha Adhesion" en agenda (`agenda-listado.component.ts:120`) | `app.routes.ts:16` |
| `/agenda/:contactoId/fichas/nueva` | `NuevaFichaComponent` | Botón "Pasar a Adhesion" en agenda (`agenda-listado.component.ts:122`) y botón "+ Nueva Ficha" en fichas-contacto (`fichas-contacto.component.ts:16`) | `app.routes.ts:15` |

Notas de orden de rutas: `/agenda/:contactoId/fichas/nueva` está declarada **antes** que `/agenda/:contactoId/fichas` y que `/agenda/:id` (`app.routes.ts:15-18`), por lo que la ruta más específica gana el match.

Navegación interna:

- `FichasContacto` → "← Volver a contactos" enlaza a `/agenda` (`fichas-contacto.component.ts:15`) y "+ Nueva Ficha" a `['/agenda', contactoId, 'fichas', 'nueva']` (`:16`).
- `NuevaFicha` → "← Cancelar" / "Cancelar" enlazan de vuelta a `['/agenda', contactoId, 'fichas']` (`nueva-ficha.component.ts:30`, `:155`); tras guardar, `router.navigate(['/agenda', contactoId, 'fichas'])` (`:268`).
- `AdhesionesListado` **no** navega por router para crear: usa una tercera solapa interna `'nuevo'` controlada por signal (no es una ruta).

---

## Componentes

### AdhesionesListadoComponent (`/adhesiones`)

Archivo: `src/app/features/adhesiones/adhesiones-listado.component.ts`. Selector `app-adhesiones` (`:26`). Imports: `CommonModule`, `FormsModule` (`:28`). Inyecta `HttpClient` (`:268`) y `PageTitleService` (`:269`); **llama al API directamente con `HttpClient`, no usa `AdhesionesService`**.

**Estado (signals):**

- `tab = signal<Tab>('locales')` — solapa activa; `Tab = 'web' | 'locales' | 'nuevo'` (`:23`, `:271`). Arranca en `'locales'`.
- `web = signal<AdhesionWebDto[]>([])` (`:272`).
- `locales = signal<AdhesionLocalDto[]>([])` (`:273`).
- `stats = signal<StatsDto>({ locales:0, web:0, total:0, duplicados:0 })` (`:274`).
- `form: any = { contactoId, sector, sistContrib, aporte, titularResponsable, observaciones }` (`:276-279`) — modelo del alta rápida local.

En el constructor (`:281-286`) fija el título `'Adhesiones'` y dispara `reloadWeb()`, `reloadLocales()`, `reloadStats()`.

**Solapa "Adhesiones Pendientes en Web" (`tab()==='web'`)** (`:39-113`):

- Tabla de 15 columnas (ID, Nombre, Apellidos, Cedula, Cred. Civica, Email, Telefono, Celular, Departamento, Fecha Nac., Fecha en Sist., Sist. Contrib., Importe, Observaciones, acciones) iterando `web()` con `@for ... track a.id` (`:63`).
- Badges: departamento con clase `dept` (`:75`); sistema de contribución con clase dinámica `badgeClass()` (`:82`).
- Importe se muestra `'$' + a.importe` o `'—'` (`:85`).
- Acciones por fila (`:88-92`): **"Detalle"** (link sin handler, no hace nada), **"Pasar a Local"** → `pasar(a.id)`, **"Eliminar"** → `eliminarWeb(a.id)`.
- `@empty`: "No hay adhesiones pendientes" (`:96`).
- Paginación: **estática/decorativa** — muestra `1–{{web().length}} de {{web().length}}` y botones `<`, `1`, `>` sin lógica (`:100-107`).
- Botón **"Sincronizar Nube"** (`:111`): **sin handler `(click)`**, no hace nada.

**Solapa "Adhesiones Locales" (`tab()==='locales'`)** (`:115-204`):

- **Tarjetas de stats** (`stats-grid`, `:116-134`): "Adhesiones Locales" (`stats().locales`), "Adhesiones Web" (`stats().web`), "Total" (`stats().total`), "Posibles Duplicados" (`stats().duplicados`) con leyenda "Requiere revision".
- Tabla de 15 columnas (ID, ID Contacto, Nombre, Apellidos, Cedula, Sector, Sist. Contrib., Aporte, Fecha Alta, Fecha Salida, Aporte Conf., Art. 46, Titular Resp., Observaciones, acciones) iterando `locales()` con `track l.id` (`:159`).
- `aporteConfirmado` y `art46` se muestran como checkboxes **deshabilitados** (`:179-180`).
- Sector como badge (`:168`); sist. contrib. con `badgeClass()` (`:173`).
- Acción por fila: solo **"Eliminar"** → `eliminarLocal(l.id)` (`:185`).
- `@empty`: "Sin adhesiones locales" (`:190`). Paginación estática igual que web (`:194-200`).

**Solapa "nuevo" (`tab()==='nuevo'`)** (`:206-255`) — formulario de **alta rápida local**, no es ruta:

- Activada por el botón "+ Nuevo Adherente" del topbar (`:31`, `tab.set('nuevo')`); no aparece como pestaña en la barra de tabs (solo hay tabs web/locales, `:34-37`).
- Campos (`ngModel` bidireccional sobre `form`):
  - **Contacto (ID)** — `<input type="number">` `form.contactoId` (`:213`).
  - **Sector** — `<select>` con opciones `Aire Fresco`, `Alianza Pais`, `Herrerismo` (`:217-222`).
  - **Sist. Contrib.** — `<select>` con `VISA`, `MASTER`, `OCA`, `eBROU`, `ANTEL`, `Efectivo` (`:226-234`).
  - **Aporte** — `<input type="number">` (`:238`).
  - **Titular Responsable** — `<input type="text">` (`:242`).
  - **Observaciones** — `<textarea rows=3>` (`:246`).
- Botones: **"Guardar"** → `crearLocal()` (`:250`), **"Cancelar"** → `tab.set('locales')` (`:251`).

**Métodos:**

- `badgeClass(s)` (`:288-296`): mapea sistema (lowercase) a clases CSS `visa`/`master`/`oca`/`ebrou`/`antel`, fallback `dept`.
- `reloadWeb/reloadLocales/reloadStats` (`:298-300`): GET a `/adhesiones/web`, `/adhesiones/locales`, `/adhesiones/stats`.
- `pasar(id)` (`:302-306`): POST `/adhesiones/web/{id}/pasar-a-local` con body `{}`; al completar recarga las tres listas.
- `eliminarWeb(id)` (`:308-313`): `confirm('Eliminar esta adhesion web?')`; DELETE `/adhesiones/web/{id}`; recarga web + stats.
- `eliminarLocal(id)` (`:315-320`): `confirm('Eliminar esta adhesion local?')`; DELETE `/adhesiones/locales/{id}`; recarga locales + stats.
- `crearLocal()` (`:322-331`): valida `form.contactoId` (si falta, `alert('Falta el ID de contacto')`); POST `/adhesiones/locales` con `{...form}`; al completar resetea `form`, vuelve a `tab='locales'` y recarga locales + stats.

### FichasContactoComponent (`/agenda/:contactoId/fichas`)

Archivo: `src/app/features/adhesiones/fichas-contacto.component.ts`. Selector `app-fichas-contacto` (`:10`). Imports: `CommonModule`, `FormsModule`, `RouterLink` (`:12`). Inyecta `ActivatedRoute`, `ContactosService` (`svc`), `AdhesionesService` (`adhSvc`), `PageTitleService` (`:205-208`).

**Estado (signals):**

- `contactoId!: number` — leído de la ruta (`:280`, `+route.snapshot.paramMap.get('contactoId')`).
- `fichas = signal<FichaAdhesion[]>([])` (`:211`).
- `expandedId = signal<number|null>(null)` (`:212`) — id de fila expandida.
- `detalle = signal<FichaAdhesionDetalle|null>(null)` (`:213`) — detalle cargado de la fila expandida.
- `editMode = signal(false)` (`:214`).
- `original: FichaAdhesionDetalle|null` (`:215`) — copia profunda para cancelar.

Constructor (`:278-282`): título `'Fichas de Adhesión'`, lee `contactoId`, y carga la lista vía `svc.fichasAdhesion(contactoId)` (→ `GET /contactos/{id}/fichas-adhesion`, en `contactos.service.ts:109`).

**Plantilla:**

- Topbar con "← Volver a contactos" y "+ Nueva Ficha" (`:14-17`).
- Encabezado "Fichas de Adhesión — Contacto #{contactoId}" (`:21`).
- Si `fichas().length === 0`: empty-state "Sin fichas de adhesion para este contacto" (`:23`).
- Tabla resumen de 8 columnas: Id Adhesion, Fecha, Fecha Salida, Aporte Todo al Partido (`SI`/`NO`), Sist. Contrib., Importe (`f.aporte ?? '—'`), Confirmado (`true→'S'`, `false→'D'`, `null→'-'`, `:47`), Art. 46 (`SI`/`NO`). Filas `clickable`, `track f.id` (`:39`).
- Fila clickeable → `toggle(f.id)` (`:40`); fila resaltada si `expandedId()===f.id` (`:40`).
- **Fila de detalle expandible** (`:50-184`): se muestra si `expandedId()===f.id && detalle()`. Header "Ficha #{id}" con botón **"Editar"** (si `!editMode()`) o **"Cancelar"/"Guardar"** (si `editMode()`), todos con `$event.stopPropagation()` para no colapsar la fila (`:54-63`).

**Formulario de detalle/edición** (`:65-180`) — campos `[disabled]="!editMode()"` (solo lectura hasta entrar en edición):

- Id Adhesión (siempre `disabled`, `:67-68`).
- Fecha de Sistema → `fechaAdhesion` (`type=date`, `:72`).
- Importe → `aporte` (`type=number`, `:76`).
- Sistema de Contribución → `sistContrib` (select sobre `sistemas`, `ngModelChange=onSistContribChange`, `:80-82`).
- Observaciones (full-width, `:86`).
- **Condicionales por sistema:**
  - Cédula responsable → si `showCedula(sistContrib)` (OCA/VISA/MASTER/EBROU), `:88-93`, `:233`.
  - Teléfono Antel → si `showTelefonoAntel` (`=== 'Antel'`), `:94-99`, `:232`.
  - Fecha Vencimiento + Fecha Ult. Pago → si `showFechasPago` (`=== 'ANUAL'`), `:100-109`, `:234`.
- Aporte Todo al Partido → select `true/false` (`onAporteTodoChange`, `:112-115`).
- **Si `!aporteTodoAlPartido`** (`:117-147`): Aporte a un Sector (`sector`, opciones `sectores`), Aporte a Secretaría/Agrupación (`aporteSecretariaAgrupacion`, opciones `aportesSecAgr`), Aporte Agrupación (`aporteAgrupacion`, texto), Departamento Agrupación (`departamentoAgrupacion`, opciones `departamentos`), Código de Agrupación (`codigoAgrupacion`, texto).
- Confirmado → select `null='-' / false='D' / true='S'` (`onConfirmadoChange`, `:150-154`).
- **Si `aporteConfirmado === false`** → muestra Fecha de salida (`fechaSalida`, `:156-161`).
- Carnet Entregado (`type=date`, `:164`).
- Art. 46 (checkbox, `:169`).
- Departamental (checkbox, `:176`).

**Catálogos en memoria** (`:217-230`): `sistemas` = `['Antel','OCA','VISA','MASTER','EBROU','ANUAL','Otro']`; `departamentos` (19 deptos + `'Nacional'`); `aportesSecAgr` (`Agrupacion`, `SAS`, `CNJ`, `Centro Josefa Oribe`, `CEPN`, `Comision Departamental`, `C. Cultura`, `Movimiento Afro-Nacionalista (MAN)`); `sectores` (`ALIANZA NACIONAL`, `TODO POR EL PUEBLO`, `AIRE FRESCO`, `MEJOR PAIS`, `D CENTRO`, `ESPACIO 40`, `HERRERISMO`, `POR LA PATRIA`).

**Lógica de campos condicionales** (`:232-276`):

- `onSistContribChange(s)` (`:236-244`): setea `sistContrib` y **limpia** los campos que dejan de aplicar (`telefonoAntel`, `cedulaResponsable`, `fechaVencimiento`, `fechaUltimoPago`); re-emite con `detalle.set({...f})`.
- `onAporteTodoChange(v)` (`:246-258`): si `v===true`, limpia `sector`, `aporteSecretariaAgrupacion`, `aporteAgrupacion`, `departamentoAgrupacion`, `codigoAgrupacion`.
- `onConfirmadoChange(v)` (`:260-276`): si `v===false`, abre `window.prompt('Ingrese la fecha de salida (YYYY-MM-DD):', ...)`, valida regex `/^\d{4}-\d{2}-\d{2}$/`; si inválida **aborta el cambio** (no setea); si válida setea `aporteConfirmado=false` + `fechaSalida`. Si `v !== false` limpia `fechaSalida`.

**Operaciones:**

- `toggle(id)` (`:284-298`): si ya estaba expandida, colapsa (limpia `expandedId`, `detalle`, `editMode`). Si no, sale de edición, marca `expandedId=id` y carga el detalle con `adhSvc.getLocal(id)` (→ `GET /adhesiones/locales/{id}`); normaliza fechas y guarda copia en `original`.
- `normalizeDates(f)` (`:300-306`): recorta a `YYYY-MM-DD` (`.slice(0,10)`) las fechas `fechaAdhesion`, `fechaSalida`, `fechaVencimiento`, `fechaUltimoPago`, `carnetEntregado` (para inputs `type=date`).
- `cancelar()` (`:308-311`): restaura `detalle` desde `original` (deep copy) y sale de edición.
- `guardar()` (`:313-321`): `adhSvc.updateLocal(f)` (→ `PUT /adhesiones/locales/{id}`); al completar refresca `original`, sale de edición y **recarga la lista** con `svc.fichasAdhesion(contactoId)`.

### NuevaFichaComponent (`/agenda/:contactoId/fichas/nueva`)

Archivo: `src/app/features/adhesiones/nueva-ficha.component.ts`. Selector `app-nueva-ficha` (`:25`). Imports: `CommonModule`, `FormsModule`, `RouterLink` (`:27`). Inyecta `ActivatedRoute`, `Router`, `ContactosService` (`contactosSvc`), `AdhesionesService` (`adhSvc`), `PageTitleService` (`:168-172`).

Catálogos como **constantes de módulo** (`:9-22`): `SISTEMAS`, `DEPARTAMENTOS`, `APORTES_SEC_AGR`, `SECTORES` (mismos valores que `FichasContacto`), expuestos como propiedades del componente (`:178-181`).

**Estado:**

- `contactoId!: number` (de la ruta, `:231`).
- `contactoNombre = signal<string>('')` (`:175`).
- `ficha = signal<FichaAdhesionDetalle|null>(null)` (`:176`) — modelo del formulario; arranca `null` (muestra "Cargando datos del contacto…", `:160`).

**Constructor / precarga** (`:229-262`): título `'Nueva Ficha de Adhesión'`, lee `contactoId`, y obtiene el contacto con `contactosSvc.get(contactoId)` (→ `GET /contactos/{id}`). Con ese contacto:

- `contactoNombre` = `"{apellido}, {nombre}"` (`:233`).
- Inicializa `ficha` con **valores derivados del contacto** (`:236-260`): `id:0`, `contactoId`, `fechaAdhesion=hoy` (`toISOString().slice(0,10)`), `aporteConfirmado:null`, `art46:false`, `aporteTodoAlPartido:true`, `departamental:false`, `titularResponsable = "{nombre} {apellido}"`, `cedulaResponsable = c.documento`, `telefonoAntel = c.telefono ?? c.celular`, y `departamentoAgrupacion = dep` solo si `c.departamento` está en `DEPARTAMENTOS` (si no, `undefined`, `:235`). El resto de campos quedan `undefined`/falsy.

**Plantilla** (`:28-161`): misma estructura de campos condicionales que el detalle de `FichasContacto` (Sistema de Contribución con condicionales Cédula/Antel/Fechas, Aporte Todo al Partido con bloque de agrupación, Confirmado con fecha de salida, Carnet, Art.46, Departamental), pero **sin** `editMode` (todos editables). Encabezado "Nueva Ficha de Adhesión" + "Contacto: {contactoNombre()} (#{contactoId})" (`:36-37`).

**Lógica condicional** idéntica a `FichasContacto`: `showTelefonoAntel`/`showCedula`/`showFechasPago` (`:183-185`), `onSistContribChange` (`:187-195`), `onAporteTodoChange` (`:197-209`), `onConfirmadoChange` con `window.prompt` + regex (`:211-227`).

**Validaciones de alta:** **No hay validación explícita** en `guardar()` (`:264-270`): toma `ficha()`, si es `null` retorna; si no, `adhSvc.createLocal(f)` (→ `POST /adhesiones/locales`) y al completar navega a `['/agenda', contactoId, 'fichas']`. Las únicas "validaciones" son las restricciones de los inputs (`type=number`, `type=date`) y la regex de la fecha de salida en `onConfirmadoChange`. No hay manejo de error del POST (sin callback `error`).

---

## API consumida

`apiUrl = http://localhost:5000/api` (`../architecture.md`). Las rutas mostradas son las que se concatenan a `apiUrl`.

### Vía `AdhesionesService` (`src/app/features/adhesiones/adhesiones.service.ts`)

`base = ${apiUrl}/adhesiones` (`:9`). Tipos de retorno `FichaAdhesionDetalle` (importado de `contactos.service.ts`).

| Método | HTTP + ruta | Body | Definición | Usado por |
|--------|-------------|------|-----------|-----------|
| `getLocal(id)` | `GET /adhesiones/locales/{id}` | — | `adhesiones.service.ts:11` | `FichasContacto.toggle()` (`fichas-contacto.component.ts:293`) |
| `updateLocal(f)` | `PUT /adhesiones/locales/{f.id}` | `FichaAdhesionDetalle` | `adhesiones.service.ts:12` | `FichasContacto.guardar()` (`:316`) |
| `createLocal(f)` | `POST /adhesiones/locales` | `Partial<FichaAdhesionDetalle>` | `adhesiones.service.ts:13` | `NuevaFicha.guardar()` (`nueva-ficha.component.ts:267`) |

### Directas con `HttpClient` en `AdhesionesListadoComponent`

(El componente **no** usa `AdhesionesService` para estas; concatena `environment.apiUrl` a mano.)

| HTTP + ruta | Body | Definición |
|-------------|------|-----------|
| `GET /adhesiones/web` | — | `adhesiones-listado.component.ts:298` |
| `GET /adhesiones/locales` | — | `:299` |
| `GET /adhesiones/stats` | — | `:300` |
| `POST /adhesiones/web/{id}/pasar-a-local` | `{}` | `:303` |
| `DELETE /adhesiones/web/{id}` | — | `:310` |
| `DELETE /adhesiones/locales/{id}` | — | `:317` |
| `POST /adhesiones/locales` | `{...form}` (contactoId, sector, sistContrib, aporte, titularResponsable, observaciones) | `:324` |

> ⚠️ **Inconsistencia de payload**: el `POST /adhesiones/locales` del listado (`:324`) envía la forma "rápida" (`form`), mientras que `AdhesionesService.createLocal` envía un `FichaAdhesionDetalle` completo. Son dos shapes distintos contra el mismo endpoint.

### Vía `ContactosService` (dependencia, ver abajo)

| HTTP + ruta | Definición | Usado por |
|-------------|-----------|-----------|
| `GET /contactos/{id}/fichas-adhesion` → `FichaAdhesion[]` | `contactos.service.ts:109` | `FichasContacto` (carga inicial `:281` y recarga tras guardar `:319`) |
| `GET /contactos/{id}` → `Contacto` | `contactos.service.ts:105` | `NuevaFicha` constructor (`:232`) |

---

## Modelos / interfaces

**Locales a `AdhesionesListadoComponent`** (`adhesiones-listado.component.ts:8-23`):

- `AdhesionWebDto` (`:8-13`): `id`, `nombre`, `apellido`, `cedula?`, `credCivica?`, `email?`, `telefono?`, `celular?`, `departamento?`, `fechaNacimiento?`, `fechaSistema?`, `sistContrib?`, `importe?`, `observaciones?`, `estado`.
- `AdhesionLocalDto` (`:14-20`): `id`, `idContacto`, `nombre`, `apellido`, `cedula?`, `sector?`, `sistContrib?`, `aporte?`, `fechaAlta?`, `fechaSalida?`, `aporteConfirmado: boolean|null`, `art46: boolean`, `titularResp?`, `observaciones?`.
- `StatsDto` (`:21`): `locales`, `web`, `total`, `duplicados` (todos `number`).
- `Tab` (`:23`): `'web' | 'locales' | 'nuevo'`.

**Compartidos desde `contactos.service.ts`** (definidos en Agenda, no en esta feature):

- `FichaAdhesion` (`contactos.service.ts:60-72`) — fila resumen: `id`, `sector?`, `sistContrib?`, `aporte?`, `fechaAdhesion?`, `fechaSalida?`, `aporteConfirmado: boolean|null`, `art46: boolean`, `titularResponsable?`, `observaciones?`, `aporteTodoAlPartido: boolean`.
- `FichaAdhesionDetalle` (`contactos.service.ts:74-98`) — detalle completo: todo lo de `FichaAdhesion` **más** `contactoId`, `contactoNombre?`, `aporteSecretariaAgrupacion?`, `aporteAgrupacion?`, `departamentoAgrupacion?`, `departamental: boolean`, `cedulaResponsable?`, `codigoAgrupacion?`, `telefonoAntel?`, `fechaVencimiento?`, `fechaUltimoPago?`, `carnetEntregado?`.

> Nota: `FichaAdhesionDetalle` **no** incluye `titularResponsable` propio en su lista directa pero sí lo hereda conceptualmente; en el código se setea `titularResponsable` al crear (`nueva-ficha.component.ts:247`) — el campo existe vía `FichaAdhesion` base (`contactos.service.ts:69`). Verificar contra backend.

---

## Interacciones / UX

- **Tabs por signal** en el listado (`tab.set(...)`), sin router; la solapa `'nuevo'` se muestra solo desde el botón "+ Nuevo Adherente", no aparece en la barra de tabs.
- **Confirmaciones nativas**: `confirm()` antes de eliminar web/local (`:309`, `:316`); `alert()` si falta `contactoId` al crear local (`:323`).
- **Prompt nativo** para la fecha de salida cuando se marca "Confirmado = D (false)" (`fichas-contacto.component.ts:265`, `nueva-ficha.component.ts:216`), con validación regex `YYYY-MM-DD`; si se cancela o es inválida, el cambio se **descarta**.
- **Expansión inline** de fichas con `stopPropagation()` en los controles internos para que clicar dentro del detalle no colapse la fila.
- **Edición optimista local**: `detalle` se muta in-place y se re-emite con `signal.set({...f})`; "Cancelar" restaura desde la copia `original` (deep clone JSON).
- **Campos condicionales** que se limpian al cambiar `sistContrib` / `aporteTodoAlPartido` para no enviar datos inconsistentes.
- **Normalización de fechas** a `YYYY-MM-DD` para los inputs `type=date` (`fichas-contacto.component.ts:300-306`).
- **Precarga inteligente** en `NuevaFicha`: hereda documento → cédula responsable, teléfono/celular → teléfono Antel, departamento del contacto si es válido (`nueva-ficha.component.ts:235`, `:254`, `:256`).
- Badges con colores por sistema de contribución vía `badgeClass()` (`adhesiones-listado.component.ts:288-296`).

---

## Dependencias

- **Agenda / Contactos** (`src/app/features/agenda/contactos.service.ts`): provee `ContactosService` (`get`, `fichasAdhesion`) y **las interfaces `FichaAdhesion` / `FichaAdhesionDetalle` / `Contacto`** que esta feature consume. El acoplamiento es estructural: las fichas se navegan bajo `/agenda/:contactoId/...` y se listan vía `GET /contactos/{id}/fichas-adhesion`.
- **Entradas desde Agenda**: la lista de contactos enlaza a fichas ("Ficha Adhesion", `agenda-listado.component.ts:120`) y al alta ("Pasar a Adhesion", `:122`).
- **`PageTitleService`** (`src/app/core/page-title.service.ts`): título de página en los tres componentes.
- **`environment.apiUrl`** y el **interceptor/auth** transversal (ver `../architecture.md`).
- **Angular**: `HttpClient`, `FormsModule` (`ngModel`), `RouterLink`/`ActivatedRoute`/`Router`, signals.

---

## No implementado / gaps

- **Botón "Sincronizar Nube"** (`adhesiones-listado.component.ts:111`): sin `(click)`, no hace nada. No existe llamada de sincronización web→local masiva en el front.
- **Acción "Detalle"** en la tabla web (`:89`): link sin handler, inerte.
- **Paginación decorativa**: los controles `<`, `1`, `>` y el texto "Mostrando 1–N de N" no tienen lógica; siempre muestra todo en una página (`:100-107`, `:194-200`). No hay filtros ni búsqueda en el listado.
- **Sin manejo de errores HTTP** en ninguna llamada (no hay callbacks `error:`); fallos del API quedan silenciosos. No hay estados de carga (spinners) salvo el placeholder de `NuevaFicha`.
- **Alta local con dos shapes contra `POST /adhesiones/locales`**: el listado manda `form` reducido (`:324`); `NuevaFicha` manda `FichaAdhesionDetalle` completo (`adhesiones.service.ts:13`). Riesgo de divergencia con el contrato del backend.
- **Catálogos hardcodeados y divergentes**: el `<select>` de Sector del alta rápida (`Aire Fresco`, `Alianza Pais`, `Herrerismo`, `:218-221`) y el de Sist. Contrib. (`eBROU`, `ANTEL`, `Efectivo`, `:227-233`) **no coinciden** con los catálogos de `FichasContacto`/`NuevaFicha` (`sectores`/`sistemas`, `fichas-contacto.component.ts:217`, `:227`). No hay catálogo centralizado.
- **Solapa de stats**: las tarjetas de estadísticas viven dentro de la solapa "locales" (`:116-134`), no en una vista de stats independiente; "Posibles Duplicados" se muestra pero el listado no ofrece acción de des-duplicar (eso vive en Contactos).
- **`FichaAdhesionDetalle` sin validación de obligatorios** al crear: `NuevaFicha.guardar()` no valida campos requeridos (ej. `sistContrib`, `aporte`); delega toda la validación al backend.
- **Eliminar/editar fichas por contacto**: `FichasContacto` permite editar (PUT) pero **no** eliminar fichas; la eliminación de adhesiones locales solo existe en el listado global (`:185`), que opera por `id` de adhesión.
