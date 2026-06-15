# Feature: Agenda (Contactos)

> **Estado:** Implementado (parcial — ver [No implementado/gaps](#no-implementadogaps)).
> **Rutas:** `/agenda` · `/agenda/nuevo` · `/agenda/:id` · `/agenda/:id/fichas` · `/agenda/:id/fichas/nueva` · `/agenda/:id/organismos`
> **Componentes:** `AgendaListadoComponent`, `AgendaNuevoComponent`, `DuplicadosContactosComponent` (+ helper `imprimirContactos`, servicio `ContactosService`).
> **Contexto transversal:** Angular 17.3 standalone + signals, `authGuard` + interceptor, `apiUrl=http://localhost:5000/api`, export CSV en `core/exportar-csv`. Ver [`../architecture.md`](../architecture.md).

---

## Propósito

Gestión de la agenda de contactos del partido: alta, edición, listado con búsqueda/orden/exportación, detección y fusión (merge) de contactos duplicados, e integración de cada contacto con sus **fichas de adhesión** y su pertenencia a **organismos**. Es el catálogo central de personas del cual derivan adhesiones y cargos en organismos.

---

## Rutas y navegación

Todas las rutas viven bajo el shell protegido por `authGuard` (hijas del path `''`), definidas en `src/app/app.routes.ts`.

| Ruta | Componente | Archivo:línea (routes) | Origen del componente |
|------|-----------|------------------------|-----------------------|
| `/agenda` | `AgendaListadoComponent` | `app.routes.ts:13` | `features/agenda/agenda-listado.component.ts` |
| `/agenda/nuevo` | `AgendaNuevoComponent` (modo **alta**) | `app.routes.ts:14` | `features/agenda/agenda-nuevo.component.ts` |
| `/agenda/:contactoId/fichas/nueva` | `NuevaFichaComponent` | `app.routes.ts:15` | `features/adhesiones/nueva-ficha.component.ts` (otra feature) |
| `/agenda/:contactoId/fichas` | `FichasContactoComponent` | `app.routes.ts:16` | `features/adhesiones/fichas-contacto.component.ts` (otra feature) |
| `/agenda/:contactoId/organismos` | `IntegrantesContactoComponent` | `app.routes.ts:17` | `features/organismos/integrantes-contacto.component.ts` (otra feature) |
| `/agenda/:id` | `AgendaNuevoComponent` (modo **edición**) | `app.routes.ts:18` | `features/agenda/agenda-nuevo.component.ts` |

Notas de orden de matcheo:
- `/agenda/nuevo` (línea 14) se declara **antes** que `/agenda/:id` (línea 18), por lo que `nuevo` no es capturado como `:id`.
- Las sub-rutas `:contactoId/fichas*` y `:contactoId/organismos` (líneas 15–17) se declaran **antes** que `/agenda/:id`, evitando que `fichas`/`organismos` sean tratados como `:id`.
- El parámetro de ruta se llama `:id` para el editor de contacto y `:contactoId` para las sub-rutas de fichas/organismos.

Navegación saliente desde el listado (botones por fila, ver [Interacciones/UX](#interaccionesux)):
- Editar contacto → `['/agenda', c.id]` (`agenda-listado.component.ts:113`).
- Ficha de adhesión existente → `['/agenda', c.id, 'fichas']` (`agenda-listado.component.ts:120`).
- Crear ficha (pasar a adhesión) → `['/agenda', c.id, 'fichas', 'nueva']` (`agenda-listado.component.ts:122`).
- Integrante de organismo → `['/agenda', c.id, 'organismos']` (`agenda-listado.component.ts:125`).
- Nuevo contacto → `routerLink="/agenda/nuevo"` (`agenda-listado.component.ts:29`).

Tras guardar/cancelar en el editor se navega a `['/agenda']` (`agenda-nuevo.component.ts:323`, `:331`).

---

## Componentes

### AgendaListadoComponent
Archivo: `src/app/features/agenda/agenda-listado.component.ts`. Standalone, imports `CommonModule, FormsModule, RouterLink, DuplicadosContactosComponent` (`:24`). Setea título de página `'Agenda'` y carga datos en el constructor (`:513-516`).

**Pestañas (tabs).** Signal `tab = signal<Tab>('todos')` con `Tab = 'todos' | 'padron' | 'duplicados' | 'exportar'` (`:19`, `:337`). Tabs renderizadas en `:32-37`:
- `todos` — tabla de contactos (default).
- `duplicados` — embebe `<app-duplicados-contactos>` (`:228-230`).
- `padron` — placeholder "Padron Electoral — proximamente" (`:225-227`).
- `exportar` — placeholder "Exportar — proximamente" (`:231-233`).

**Carga de datos.** `reload()` hace `GET ${apiUrl}/contactos` directamente vía `HttpClient` (no usa `ContactosService.list`) y vuelca a `contactos` signal (`:518-521`). El modelo de fila es la interfaz local `ContactoListado` (`:13-17`), que incluye flags `tieneFicha`, `tieneIntegranteOrganismo`, `adherente`, `adhesion` (string 'Activa'|'Pendiente'|'Baja') que el backend debe proveer en el listado.

**Tabla.** Columnas: ID, Nombre (`apellido, nombre`), Cédula, Credencial, Departamento (badge), Celular, Email, Adhesión (badge por estado), y columna de acciones (`:45-211`). Estado vacío "Sin contactos" (`:208-210`).

**Búsqueda / filtro con signals.** Una fila de filtros por columna (`:58-80`), cada uno respaldado por su signal:

| Signal | Línea | Tipo de control | Lógica de match |
|--------|-------|-----------------|-----------------|
| `fId` | `:369` | input texto | `includes` sobre `c.id` |
| `fNombre` | `:370` | input texto | `includes` sobre `` `${apellido}, ${nombre}` `` |
| `fCedula` | `:371` | input texto | `includes` sobre `c.cedula` |
| `fCred` | `:372` | input texto | `includes` sobre `c.credencial` |
| `fDepto` | `:373` | select | igualdad exacta `c.departamento === fDep` |
| `fCel` | `:374` | input texto | `includes` sobre `c.celular` |
| `fEmail` | `:375` | input texto | `includes` sobre `c.email` |
| `fAdh` | `:376` | select (Activa/Pendiente/Baja) | igualdad exacta `(c.adhesion ?? '') === fAdh` |

El computed `filtrados()` (`:382-408`) aplica todos los filtros (`m()` es case-insensitive substring; `:383-384`) y luego ordena. El select de departamento usa el array fijo `deptos = ['Montevideo','Canelones','Maldonado','Salto']` (`:338`) — **no** los 19 departamentos del editor.

**Ordenamiento multi-columna.** Signal `sortBy = signal<{col; dir}[]>([{ col:'apellido', dir:'asc' }])` (`:378-380`). `onSort(col, ev)` (`:410-427`): click simple reemplaza el orden (toggle asc/desc si es la única columna y es la misma), `Shift+Click` agrega/toggla la columna como orden secundario. `indicador(col)` muestra `▲`/`▼` y el número de prioridad cuando hay varios (`:429-435`). Comparador `cmp()` (`:437-443`): nulls al final, numérico para números, `localeCompare('es', {numeric:true})` para strings.

**Detalle expandible (fila inline).** `expandedId` y `detalle` signals (`:340-341`). `toggle(id)` (`:343-352`) colapsa si ya está abierta, o abre y hace `svc.get(id)` para traer el `Contacto` completo y renderizar sus secciones: Datos personales, Contacto, Dirección, Laboral, Adhesion (sólo flag `adherente`), Otros (observaciones, fechas, activo) (`:132-207`). Helpers `fmt()` (`:354-357`) y `fmtDate()` (locale es-UY, `:359-367`).

**Paginación.** **Es estática/decorativa**: muestra "Mostrando 1–{{ filtrados().length }} de {{ contactos().length }}" y botones `<`, `1`, `>` sin handlers (`:213-220`). No hay paginación real — se renderizan todas las filas filtradas.

**Acciones por fila** (`:105-130`, ver UX):
- WhatsApp (`btn-wa`) — abre `wa.me`. Si hay 2 celulares muestra modal de elección (`waChoice` signal, `:472-489`). `formatoUy()` normaliza a internacional UY sin `+` (`:491-498`).
- Editar (lápiz) → `['/agenda', c.id]`.
- Ficha Adhesion / Pasar a Adhesion → según `c.tieneFicha`.
- Int. Organismo → habilitado sólo si `c.tieneIntegranteOrganismo`; si no, botón deshabilitado con title explicativo (`:124-128`).

### AgendaNuevoComponent
Archivo: `src/app/features/agenda/agenda-nuevo.component.ts`. Standalone, imports `CommonModule, FormsModule` (`:33`). Formulario template-driven (`#f="ngForm"`, `novalidate`, `[class.submitted]`) (`:35`).

**Modo nuevo vs edición.** En el constructor (`:296-303`) lee `:id` del `paramMap`:
- Sin `id` → modo alta. Título "Nuevo Contacto". Modelo inicial `c: Partial<Contacto> = { activo: true }` (`:249`).
- Con `id` → modo edición. `editingId = +id`, título "Editar Contacto", carga vía `svc.get(editingId)` y asigna a `c` (`:301`).

La sección **Adhesion** (checkbox `adherente`, deshabilitado, "Calculado automaticamente segun fichas de adhesion confirmadas") sólo se renderiza si `editingId` está seteado (`:170-181`).

**Campos del formulario.** Todos con `[(ngModel)]` a `c.*`:

*Datos personales* (`:38-82`): Cortesía (select: Sr./Sra./Srta./Dr./Dra./Ing./Lic./Esc./Cr./Cra./Prof.), **Nombre** (`required`), **Apellido** (`required`), Cedula (`pattern ^[0-9]{7,8}$`, solo dígitos, `maxlength=8`, `inputmode=numeric`), Credencial (`pattern ^[A-Z]{3}[0-9]{1,6}$`, `maxlength=9`, con mensaje de error inline `:62-64`), Departamento Credencial (select **disabled** — autocompletado), Fecha Nacimiento (`type=date`), Sexo (select Masculino/Femenino/Otro), Estado civil (texto libre), Situación (select desde `situaciones`).

*Contacto* (`:84-126`): Email (`type=email`), Teléfono, Teléfono 2, Celular, Celular 2, Interno — todos solo-dígitos.

*Dirección* (`:128-137`): Departamento de la dirección (select 19 deptos), Localidad, Dirección.

*Laboral* (`:139-168`): Ocupación, Empresa, Organismo, Cargo, Teléfono (laboral, solo dígitos), Teléfono 2 (laboral, solo dígitos), Departamento (select), Email (laboral, `type=email`), Datos Secretaría.

**Validaciones.**
- `Nombre` y `Apellido`: `required` (`:46-47`).
- `Cedula`: `pattern ^[0-9]{7,8}$` + `onlyDigits`/`blockNonDigit` (`:50-54`).
- `Credencial`: `pattern ^[A-Z]{3}[0-9]{1,6}$`; transformada en vivo por `onCredencialInput()` que mayúscula, quita espacios, limita a 3 letras + 6 dígitos y autocompleta `departamentoCredencial` vía `credencialMap` (letra inicial → departamento) (`:262-283`). Mensaje de error cuando `invalid && (dirty||touched)` (`:62-64`).
- Campos numéricos: `onlyDigits(ev, field)` limpia no-dígitos al input (`:285-290`) y `blockNonDigit(ev)` bloquea teclas no numéricas (`:292-294`).
- Emails: `type="email"` (validación HTML nativa de Angular).

**Submit / errores.** `guardar(form)` (`:305-329`): setea `submitted=true`; si `form.invalid` marca todos los controles como touched y construye lista de errores legibles vía `FIELD_LABELS` (`:9-19`) + `describeError()` (`:21-28`, mapea required/email/pattern/minlength/maxlength), mostrada en un **modal** (`:191-209`). Si es válido, llama `svc.update` (edición) o `svc.create` (alta) (`:319-321`); en `next` navega a `/agenda`; en `error` muestra `err.error.message` / `err.error` / fallback en el modal (`:324-327`). `cancelar()` navega a `/agenda` (`:331`).

**Constantes.** `departamentos` (19 departamentos de Uruguay, `:254-258`), `situaciones = ['F','M','R','V','S','SM','CEN','ICE','PC','CA','PI','FA','OOPP']` (`:260`), `credencialMap` (A–T → departamento, `:262-267`).

### DuplicadosContactosComponent
Archivo: `src/app/features/agenda/duplicados-contactos.component.ts`. Standalone, imports `CommonModule, FormsModule` (`:55`). Embebido en la tab "Duplicados" del listado. Asistente de **merge** de pares duplicados.

**Carga.** `cargar()` (`:194-206`) llama `svc.duplicados()`; mapea cada `DuplicadoPar` a un `ParEstado` (`:45-50`) con `armarEstado()` (`:218-224`): selección por campo según `sugerencia()` (lado con valor no vacío, default 'A'; `:226-232`), `keep='A'`, `expandido=false`. Signals: `loading`, `aplicando`, `estados`, `mensaje`, `mensajeErr` (`:184-188`).

**Tabla resumen + detalle expandible.** Lista de pares (Id A, Contacto A, Id B, Coincidencia = `matches.join(', ')`) (`:64-82`). `toggle()` expande la fila (`:208-211`). Al expandir muestra:
- Selector "Conservar" A/B (radio `keep`) (`:88-93`).
- Tabla de merge por cada campo de `CAMPOS` (29 campos, `:13-43`): filas con `diff` resaltadas (ambos lados tienen valor y difieren, `:239-243`); para campos en conflicto se elige lado vía radio (`seleccion[key]`); filas sin conflicto quedan "locked". Columna "Resultado" calculada por `resultado()` (`:251-258`: usa el valor no vacío, o el lado elegido).
- Botones "Restablecer sugerido" (`resetear()`, `:260-266`) y "Aplicar merge" (`aplicar()`).

**Aplicar merge.** `aplicar(est)` (`:268-301`): construye `merged` partiendo del contacto `keep` y sobrescribe cada campo con `resultado()`; fuerza `merged.id = keep.id`. Luego **`svc.delete(remove.id)`** y, en éxito, **`svc.update(merged)`** (`:281-283`). Mensajes de éxito/error por par (`setMensaje`, `:303-306`) y recarga (`cargar()`). `display()` formatea fechas ISO a `YYYY-MM-DD` y vacíos a `—` (`:245-249`).

---

## API consumida

Todas vía `ContactosService` (`src/app/features/agenda/contactos.service.ts`) salvo una llamada directa en el listado. `base = ${environment.apiUrl}/contactos` = `http://localhost:5000/api/contactos` (`:103`).

| Operación | Método + ruta | Definición (archivo:línea) | Usada en |
|-----------|---------------|----------------------------|----------|
| Listar (con `q` opcional) | `GET /contactos?q=` | `contactos.service.ts:104` | (definida; el listado NO la usa) |
| Listar (listado real) | `GET /contactos` | `agenda-listado.component.ts:519` | `reload()` — llamada directa con `HttpClient`, sin params |
| Obtener uno | `GET /contactos/{id}` | `contactos.service.ts:105` | listado `toggle()` (`:351`), editor (`:301`) |
| Crear | `POST /contactos` (body `Partial<Contacto>`) | `contactos.service.ts:106` | editor alta (`:321`) |
| Actualizar | `PUT /contactos/{id}` (body `Contacto`) | `contactos.service.ts:107` | editor edición (`:320`), merge (`:283`) |
| Eliminar | `DELETE /contactos/{id}` | `contactos.service.ts:108` | merge (`:281`) |
| Fichas de adhesión del contacto | `GET /contactos/{id}/fichas-adhesion` → `FichaAdhesion[]` | `contactos.service.ts:109` | (definida; no invocada dentro de feature agenda) |
| Integrantes de organismo del contacto | `GET /contactos/{id}/integrantes-organismo` → `IntegranteOrganismo[]` | `contactos.service.ts:110` | (definida; no invocada dentro de feature agenda) |
| Eliminar integrante de organismo | `DELETE /integrantes-organismo/{id}` | `contactos.service.ts:111` | (definida; ruta **fuera** de `/contactos`) |
| Duplicados | `GET /contactos/duplicados` → `DuplicadoPar[]` | `contactos.service.ts:112` | `DuplicadosContactosComponent.cargar()` (`:196`) |

> Nota: `list(q?)` (`:104`) está definido pero el listado real usa una llamada directa `GET /contactos` sin parámetro `q` (`agenda-listado.component.ts:519`); la búsqueda es 100% client-side. Las llamadas a `fichasAdhesion`, `integrantesOrganismo` y `eliminarIntegranteOrganismo` son consumidas por las features `adhesiones`/`organismos`, no por los componentes de agenda aquí documentados.

---

## Modelos / interfaces

Definidos en `contactos.service.ts` salvo indicación.

**`Contacto`** (`:6-41`) — modelo canónico completo:
`id:number`, `cortesia?`, `nombre`, `apellido`, `documento?` (cédula), `credencialCivica?`, `fechaNacimiento?`, `sexo?`, `estadoCivil?`, `telefono?`, `telefono2?`, `celular?`, `celular2?`, `email?`, `departamento?`, `departamentoCredencial?`, `localidad?`, `direccion?`, `situacion?`, `ocupacion?`, `empresa?`, `organismo?`, `cargoLaboral?`, `telefonoTrabajo?`, `telefonoTrabajo2?`, `interno?`, `datosSecretaria?`, `departamentoLaboral?`, `mailTrabajo?`, `observaciones?`, `fechaCreado?`, `fechaUltimaModificacion?`, `activo:boolean`, `adherente?`.

**`ContactoListado`** (local, `agenda-listado.component.ts:13-17`) — forma de fila del listado: `id, nombre, apellido, cedula?, credencial?, departamento?, celular?, celular2?, email?, adhesion?, adherente?, tieneFicha?, tieneIntegranteOrganismo?`. Nótese que usa `cedula`/`credencial` (no `documento`/`credencialCivica`) y agrega flags y `adhesion` string que sólo provee el endpoint de listado.

**`DuplicadoPar`** (`:115-119`): `{ a: Contacto; b: Contacto; matches: string[] }`.

**`IntegranteOrganismo`** (`:43-58`): `id, contactoId, nombres, nombreCompania?, nombreOrganismo?, partidoSector?, posicionOrganismo?, orden?, orden2?, cargo?, condicion?, nota?, fechaFin?, fechaDesignacion?` (no usado en los componentes de agenda).

**`FichaAdhesion`** (`:60-72`) y **`FichaAdhesionDetalle`** (`:74-98`): DTOs de adhesión (consumidos por la feature adhesiones; declarados aquí porque el servicio los retorna).

**`ContactoPrintRow`** (`imprimir-contactos.ts:7-17`): `id, nombre, apellido, cedula?, credencial?, departamento?, celular?, email?, adhesion?`. **`ContactoPrintOpts`** (`:19-22`): `{ filtros?: {campo,valor}[]; orden?: {campo,dir}[] }`.

---

## Interacciones / UX

- **Búsqueda/filtro:** client-side, por columna, en vivo (signals → computed `filtrados()`). Departamento y Adhesión por select; resto substring case-insensitive (`agenda-listado.component.ts:382-396`).
- **Orden:** multi-columna con Shift+Click; hint visible "Click... Shift+Click..." (`:40-42`). Indicadores `▲▼` + prioridad numérica (`:429-435`).
- **Detalle inline:** click en fila expande/colapsa y trae el contacto completo por `GET /contactos/{id}` (`:343-352`).
- **WhatsApp:** botón verde por fila. Con 2 celulares abre modal de selección; normaliza número a formato UY internacional (`598…`) y abre `https://wa.me/{num}` en pestaña nueva; alerta si número inválido (`:474-498`). Botón deshabilitado si no hay celular.
- **Export CSV:** `exportarCsv()` usa `exportarCSV()` de `core/exportar-csv` (RFC 4180, BOM UTF-8) sobre `filtrados()`, columnas ID/Nombre/Cédula/Credencial/Departamento/Celular/Email/Adhesión, nombre `contactos-YYYY-MM-DD.csv` (`:500-511`). Botón "📥 CSV" en topbar (`:27`).
- **Impresión / PDF:** `imprimir()` (`:445-470`) arma filas + metadatos (filtros activos y orden) y llama `imprimirContactos()` de `imprimir-contactos.ts`, que abre ventana nueva con HTML A4 landscape, badges de adhesión, y dispara `window.print()` para "Guardar como PDF"; alerta si el navegador bloquea popups (`imprimir-contactos.ts:143-154`). Botón "🖨 Imprimir" (`:28`).
- **Navegación a fichas/organismos:** botones contextuales por fila según flags `tieneFicha` / `tieneIntegranteOrganismo` (`:119-128`); rutas hacia features adhesiones y organismos.
- **Editor:** validación con modal de errores agregados; transformación en vivo de credencial (autocompleta departamento) y campos numéricos.
- **Merge de duplicados:** selección campo-a-campo con resaltado de conflictos, vista previa "Resultado", aplica como `DELETE` + `PUT` secuenciales y recarga.

---

## Dependencias

- **Core / transversal:** `environment.apiUrl` (`http://localhost:5000/api`), `PageTitleService` (`core/page-title.service`), `exportarCSV` (`core/exportar-csv`), `authGuard` + HTTP interceptor (ver [`../architecture.md`](../architecture.md)).
- **Angular:** standalone components, signals + `computed`, template-driven forms (`FormsModule`/`NgForm`/`ngModel`), `RouterLink`, `HttpClient`, control flow `@if`/`@for`.
- **Servicio compartido:** `ContactosService` (`providedIn:'root'`).
- **Helper local:** `imprimir-contactos.ts` (sin dependencias Angular; usa `window.open`/`document.write`).
- **Features acopladas (vía rutas, no imports):** `adhesiones` (`NuevaFichaComponent`, `FichasContactoComponent`), `organismos` (`IntegrantesContactoComponent`).

---

## No implementado / gaps

- **Paginación falsa:** los controles `<`/`1`/`>` no tienen handlers; se renderizan todas las filas filtradas (`agenda-listado.component.ts:213-220`).
- **Tab "Padron Electoral":** placeholder "proximamente" (`:225-227`).
- **Tab "Exportar":** placeholder "proximamente" (`:231-233`) — la exportación real vive en el botón CSV del topbar, no en esta tab.
- **Búsqueda server-side ausente:** `ContactosService.list(q?)` existe pero no se usa; el listado hace `GET /contactos` sin `q` y filtra en el cliente (`:519`). El endpoint con filtros tipo `GET /contactos?q=&departamento=` **no** está cableado.
- **Select de departamento en filtro** limitado a 4 valores hardcodeados (`deptos`, `:338`) vs. 19 en el editor — inconsistencia.
- **`departamentoCredencial` no editable:** select disabled; sólo se setea por `onCredencialInput` (`:66-70`, `:269-283`).
- **`adherente` de sólo lectura:** checkbox disabled; lo calcula el backend según fichas confirmadas (`:170-181`).
- **Merge no transaccional:** `aplicar()` hace `DELETE` y luego `PUT` por separado; si el `PUT` falla tras un `DELETE` exitoso, el duplicado queda eliminado sin que se actualice el conservado (`duplicados-contactos.component.ts:281-294`).
- **`fichasAdhesion` / `integrantesOrganismo` / `eliminarIntegranteOrganismo`** definidos en el servicio pero no invocados por componentes de la feature agenda.
