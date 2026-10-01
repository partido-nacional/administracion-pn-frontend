# Feature: Agrupaciones

> **Estado:** Implementada (con gaps — ver final). La más compleja del front: una ruta con 5 sub-vistas internas (tabs), 4 componentes (3 hijos + 1 host), 4 tipos de modal de edición, un flujo de aprobación de 3 etapas (ficha web → pendiente → todas) e impresión a PDF vía ventana nueva.
>
> **Ruta:** `/agrupaciones` (lazy `loadComponent`, dentro del shell autenticado con `authGuard`) — `src/app/app.routes.ts:34`. No tiene sub-rutas; las "sub-vistas" son **tabs internas** controladas por un signal, no por el router.
>
> **Componentes:**
> - `AgrupacionesComponent` (host + tabs + vista "Todas" + vista "Padrón" + modal Nueva/Editar) — `src/app/features/agrupaciones/agrupaciones.component.ts`
> - `AgrupacionesPendientesComponent` — `src/app/features/agrupaciones/agrupaciones-pendientes.component.ts`
> - `FichasAgrupacionComponent` — `src/app/features/agrupaciones/fichas-agrupacion.component.ts`
> - `AgrupacionesPorPeriodoComponent` — `src/app/features/agrupaciones/agrupaciones-por-periodo.component.ts`
> - Helper de impresión `imprimirAgrupacion()` — `src/app/features/agrupaciones/imprimir-agrupacion.ts`
>
> **Contexto transversal:** ver [`../architecture.md`](../architecture.md). Angular 17.3 standalone + signals; `authGuard` protege la ruta y el `authInterceptor` agrega el token; `apiUrl = http://localhost:5000/api` (todos los componentes lo leen de `environment.apiUrl`).

---

## Propósito

Gestionar las **agrupaciones políticas** del Partido Nacional a lo largo de su ciclo de vida administrativo. El modelo de datos separa dos conceptos:

1. **Agrupación (datos maestros):** nombre, códigos, contacto, datos de Comisión Electoral, etc. Vive en la entidad `agrupaciones`.
2. **Agrupación por período (datos del período):** sublemas y el flag *Asuntos Políticos*, que cambian elección a elección (p. ej. período `2025-2030`). Vive en `agrupaciones-periodos`. La nota en el modal de edición lo confirma: *"Los sublemas y el flag AP viven en cada Agrupación por Período y se editan ahí"* (`agrupaciones.component.ts:53-55`).

El flujo de alta tiene 3 etapas con aprobación incremental:

```
Ficha de Agrupación Web  ──promover──▶  Agrupación Pendiente  ──aprobar──▶  Agrupación (Todas)
  (importada de la web,                  (datos editables,                  (alta definitiva)
   con validación de errores)            todos los * requeridos
                                          para aprobar)
```

Las agrupaciones también pueden crearse directamente como "Nueva Agrupación" (entra como pendiente, `agrupaciones.component.ts:638`).

---

## Rutas y navegación

Una única ruta de Angular: `/agrupaciones`. Internamente hay **5 tabs** manejadas por el signal `tab` (tipo `Tab = 'todas' | 'pendientes' | 'fichas' | 'periodo' | 'padron'`, `agrupaciones.component.ts:26`):

| Tab (label visible)            | Valor signal | Render                                                   | Línea (markup) |
|--------------------------------|--------------|----------------------------------------------------------|----------------|
| **Todas**                      | `todas`      | Tabla inline en el host (con expand/sort)                | `:142,149`     |
| **Agrupaciones Pendientes**    | `pendientes` | `<app-agrupaciones-pendientes>`                          | `:143,272`     |
| **Fichas de Agrupación Web**   | `fichas`     | `<app-fichas-agrupacion>`                                | `:144,276`     |
| **Agrupaciones por Período**   | `periodo`    | `<app-agrupaciones-por-periodo>`                         | `:145,280`     |
| **Padrón Electoral**           | `padron`     | Tabla inline en el host (filtros por columna)            | `:146,285`     |

- Cambio de tab: `setTab(t)` (`agrupaciones.component.ts:507-517`). Además de fijar el signal, actualiza el título de página vía `PageTitleService.set(...)` con un label por tab, y **carga el padrón perezosamente** la primera vez que se entra a `padron` (`:509`).
- El título inicial se setea en el constructor: `'Agrupaciones'` + `loadTodas()` (`:502-505`).
- **No hay** persistencia de la tab activa en la URL; recargar siempre vuelve a `todas`.

---

## Componentes

### 1. `AgrupacionesComponent` (host)

**Responsabilidad:** orquestar las tabs, renderizar las vistas "Todas" y "Padrón Electoral" directamente, y proveer el modal compartido **Nueva / Editar Agrupación** (botón "+ Nueva Agrupación" en el topbar, `:34`).

- **Imports standalone:** `CommonModule`, `FormsModule`, y los 3 componentes hijos (`agrupaciones.component.ts:31`).
- **Tabs:** las 5 ya descritas.

**Vista "Todas"** (`:149-270`):
- Tabla de `Agrupacion[]` (signal `agrupaciones`, `:419`), cargada por `loadTodas()` (`GET /agrupaciones`, `:652`).
- **Orden multi-columna:** `sortBy` es un signal de array `[{col, dir}]`, default `[{col:'nombre', dir:'asc'}]` (`:445-447`). `onSort(col, ev)` (`:462-479`): click simple reordena/invierte una sola columna; **Shift+Click** agrega columna como orden secundario. `indicador(col)` muestra `▲`/`▼` y el índice si hay multi-orden (`:481-487`). Comparador `cmp` con soporte número/booleano/string con `localeCompare('es', {numeric:true})` (`:489-496`).
- **Fila expandible:** click en la fila hace `toggleRow(id)` (`:498-500`, signal `expandido`). Al expandir muestra detalle completo en 5 secciones (Datos, Domicilio/Contacto, Comisión Electoral, Sublemas, Observaciones) — `:190-263`.
- **Lápiz por row:** botón `.btn-pencil` con SVG (`:182-187`) → `abrirEditar(a)`.

**Vista "Padrón Electoral"** (`:285-325`):
- Tabla de `PadronItem[]` (signal `padron`, `:420`), cargada por `loadPadron()` (`GET /agrupaciones/padron`, `:653`) sólo al entrar a la tab.
- **Filtros por columna** con 6 signals (`fPadSerie`, `fPadNro`, `fPadPNom`, `fPadSNom`, `fPadPApe`, `fPadSApe`, `:422-424`). `padronFiltrado` (computed, `:428-442`) combina filtros; `padronSeries` (computed, `:426`) llena el `<select>` de series. Serie es match exacto, el resto es `includes` case-insensitive.

**Modal Nueva / Editar** (`:37-139`) — ver sección Interacciones.

#### Signals de estado (`AgrupacionesComponent`)
| Signal | Tipo | Línea | Uso |
|--------|------|-------|-----|
| `tab` | `Tab` | `:418` | tab activa |
| `agrupaciones` | `Agrupacion[]` | `:419` | datos "Todas" |
| `padron` | `PadronItem[]` | `:420` | datos "Padrón" |
| `fPadSerie..fPadSApe` | `string` ×6 | `:422-424` | filtros padrón |
| `expandido` | `number\|null` | `:443` | fila expandida en "Todas" |
| `sortBy` | `{col,dir}[]` | `:445` | orden multi-col |
| `modoModal` | `'nueva'\|'editar'\|null` | `:519` | modo del modal compartido |
| `editandoId` | `number\|null` | `:520` | id en edición |
| `mostrarNueva` | computed | `:522` | alias `modoModal()!==null` |
| `nuevoBusy` | `boolean` | `:523` | spinner guardar |
| `nuevoError` | `string` | `:524` | error del modal |
| `nuevoForm` | `any` (no signal) | `:525` | modelo del form (ngModel) |

Computeds derivados: `padronSeries` (`:426`), `padronFiltrado` (`:428`), `agrupacionesOrdenadas` (`:449`).

---

### 2. `AgrupacionesPendientesComponent`

**Responsabilidad:** listar agrupaciones en estado pendiente y permitir **editar**, **aprobar**, **imprimir** o **eliminar** cada una.

- **`base = ${apiUrl}/agrupaciones-pendientes`** (`:328`).
- Carga al construir: `cargar()` → `GET /agrupaciones-pendientes` (`:345-351`). Maneja `loading` y empty-state ("Promové una desde la pestaña Fichas de Agrupación Web", `:38`).
- Tabla con fila expandible (`toggle`/`expandido`, `:352-355`) y mismas 5 secciones de detalle. Columna **Origen** muestra `Ficha #<fichaAgrupacionOrigenId>` si la pendiente vino de una ficha web (`:60`).
- **Acciones por row** (`:62-70`): lápiz → `abrirModal(a,'editar')`; botón "Aprobar" → `abrirModal(a,'aprobar')`; 🖨 → `imprimir(a)`; "Eliminar" (rojo) → `eliminar(id)`.

**Modal Editar/Aprobar** (un solo modal, dos modos — `:150-258`):
- `modal` signal `'editar' | 'aprobar' | null` (`:334`). Cabecera verde en modo aprobar (`.modal-header.aprob`, `:289`).
- `req()` (`:341`) devuelve `'*'` en modo aprobar y `''` en editar; los labels concatenan `{{ req() }}` para marcar requeridos sólo al aprobar.
- **Validación de aprobación:** `faltantes()` (`:431-462`) devuelve la lista de campos obligatorios vacíos — sólo en modo aprobar. Requiere: Nombre, Cod. Agrupación, Cod. Depto., Tipo, Solic. (>0), Departamento, Clasificación, Solicita, Sector, Fecha Solicitud, Domicilio Legal, Ciudad, Tel. 1, Email, Forma Representación, Representante, Delegado C.E., Forma Actuación, las 4 fechas C.E., Antecedentes, Resolución de la Comisión, Observaciones, Sublema 1. Si hay faltantes, el botón Aprobar queda `disabled` (`:247`) y se listan en un `<ul>` (`:236-241`).
- `confirmar()` (`:464-499`): si aprobar y hay faltantes, return. Arma `body` normalizando `solic` (a número, default 0) y fechas vacías a `null`. Endpoint: `POST /agrupaciones-pendientes/{id}/aprobar` (aprobar) o `PUT /agrupaciones-pendientes/{id}` (editar) — `:482-485`. Al terminar cierra modal y recarga.

**Signals de estado:** `items` (`:330`), `loading` (`:331`), `expandido` (`:332`), `modal` (`:334`), `editandoId` (`:335`), `busy` (`:336`), `modalError` (`:337`). `form: any` (`:338`, no signal). `deptos` = constante `DEPARTAMENTOS` (`:24-28`, `:339`).

---

### 3. `FichasAgrupacionComponent`

**Responsabilidad:** traer ("Sincronizar") las **fichas cargadas vía web pública**, mostrar sus **errores de validación**, permitir editarlas, contactar al responsable por **WhatsApp**, **eliminarlas** o **promoverlas** a pendiente.

- **`base = ${apiUrl}/fichas-agrupacion`** (`:572`).
- Carga al construir: `cargar()` → `GET /fichas-agrupacion` (`:581-587`).
- **Sincronizar:** `sincronizar()` → `POST /fichas-agrupacion/sincronizar` con body `{}` (`:593-599`), botón en topbar con estado `syncing` (`:52`). Trae fichas nuevas desde la web y recarga.
- **Errores:** `countErrores(f)` (`:609-612`) suma `errorCi`, `errorNombre`, `errorAdhesion` de todas las autoridades. Badge rojo "N error(es)" o verde "OK" (`:86-92`). Los errores se pintan inline en la tabla de autoridades del detalle (`:168-185`, clases `.err-input`/`.err-msg`).
- **Acciones por row** (`:93-112`): botón WhatsApp verde (deshabilitado si no hay `celularResponsable`); **lápiz** (`.btn-edit`) → `abrirEditar(f)`; "Pasar a pendiente" (deshabilitado si `countErrores(f) > 0`, con tooltip explicativo); "Eliminar".
- Detalle expandible (`toggle`/`expandido`, `:589-591`) con secciones Datos / Responsable / Sublemas / Autoridades.

**Modal WhatsApp** (`:200-255`):
- `waFicha` signal + `waMensaje` string (`:615-616`). `abrirWhatsapp(f)` (`:618-625`) precarga un mensaje plantilla con nombre del responsable, nombre de agrupación y fecha de solicitud.
- `waPhone()` / `waIniciales()` (`:632-644`) para el header del modal. `formatoUy(raw)` (`:657-663`) normaliza a `598`+dígitos (quita no-dígitos; antepone 598; trata `0` inicial).
- `enviarWhatsapp()` (`:646-654`): abre `https://wa.me/<num>?text=<encoded>` en pestaña nueva (`window.open`). **No** envía por API; el usuario aprieta Enviar en WhatsApp Web.

**Modal Promover** ("Pasar a Agrupación Pendiente", `:257-307`):
- `promFicha` signal, `prom: any` (`:666-669`). `abrirPromover(f)` (`:671-684`) — bloquea si hay errores (`countErrores>0`). Form con campos que **no vienen en la ficha web** (códigos, solic, clasificación, fechas C.E., observaciones, etc.) — todos opcionales.
- `confirmarPromover()` (`:788-814`): `POST /agrupaciones-pendientes/promover` con body `{ fichaId, ...prom, solic normalizado, fechas a null }`. Al terminar recarga las fichas.

**Modal Editar Ficha** (`:309-397`):
- `editFicha` signal, `edit: any = { autoridades: [] }` (`:692-695`). `abrirEditar(f)` (`:697-725`) copia todos los campos + clona autoridades.
- **Edición de autoridades inline:** tabla editable (`:361-385`); `agregarAutoridad()` (`:732-735`, calcula próximo `orden`) y `quitarAutoridad(i)` (`:737-739`). Rol vía `<select>` (Presidente/Vicepresidente/Secretario/Tesorero/Vocal).
- **Validación de edición** en `confirmarEditar()` (`:741-786`): Sublema 1 obligatorio; ≥5 autoridades; exactamente 1 Presidente; ≥1 Secretario. Endpoint: `PUT /fichas-agrupacion/{id}` (`:774`). `departamento` se manda `null` si tipo NACIONAL (`:768`).

**Signals de estado:** `fichas` (`:574`), `loading` (`:575`), `syncing` (`:576`), `expandido` (`:577`); WhatsApp: `waFicha` (`:615`); promover: `promFicha`/`promBusy`/`promError` (`:666-668`); editar: `editFicha`/`editBusy`/`editError` (`:692-694`). `waMensaje`, `prom`, `edit` son props normales (ngModel).

---

### 4. `AgrupacionesPorPeriodoComponent`

**Responsabilidad:** vista tabular de cada `(agrupación × período)` con todos los datos maestros + datos del período (sublemas, AP) + **integrantes**. Permite editar campos del período, togglear AP e imprimir.

- Carga al construir: `GET /agrupaciones-periodos` (`:624`).
- **Orden multi-columna** idéntico al host, default `[{periodo:desc},{nombre:asc}]` (`:438-441`); `onSort`/`indicador`/`cmp` (`:447-472`, `:614-621`).
- **Filtros por columna** (12 signals, `:474-477`): `fId, fPeriodo, fPend, fAgrId, fCod, fCodDep, fTipo, fNombre, fDepto, fSector, fSublema, fAP`. Selects para período (`periodos` computed, `:479`), estado pendiente/aprobada, tipo (D/N/DEPARTAMENTAL/NACIONAL), departamento (`deptos` computed, `:480`), AP. `filtrados` (computed, `:579-612`) combina filtro + orden.
- **Estado pendiente/aprobada:** badge amarillo "Pendiente" o verde "Aprobada" según `r.pendiente` (`:148-151`).
- **Sublemas:** columna resumida vía `joinSublemas(r)` (`:574-577`, junta sublema1..5 no vacíos).
- **Toggle AP (Asuntos Políticos):** checkbox en la fila (`:160-163`). `toggleAP(r, ev)` (`:534-549`) es **optimista**: aplica al modelo local, llama `PATCH /agrupaciones-periodos/{periodoId}/asuntos-politicos` con `{ value }`, y si falla revierte el checkbox + `alert`.
- Detalle expandible con secciones Período / Datos / Domicilio / Comisión Electoral / Sublemas / Observaciones / **Integrantes** (tabla de `IntegranteRow[]`, `:260-296`).

**Modal Editar Período** (`:311-346`):
- `modalEditar` signal (la row), `ed: any` (`:483-486`). `abrirEditar(r)` (`:488-500`) precarga período + 5 sublemas + renunciado. Nota en el modal: estos campos son específicos del período; los datos maestros se editan desde la tab "Todas" (`:319-323`).
- `guardarEditar()` (`:507-532`): valida período no vacío. `PUT /agrupaciones-periodos/{periodoId}` con `{ periodo, sublema1..5, sublemaRenunciado }` (nulls para vacíos, `:513-521`). Al terminar **recarga toda la lista** con un segundo `GET /agrupaciones-periodos` (`:525`).

**Signals de estado:** `items` (`:434`), `expandido` (`:435`), `sortBy` (`:438`), los 12 filtros (`:474-477`), `modalEditar` (`:483`), `edBusy` (`:484`), `edError` (`:485`). Computeds: `periodos`, `deptos`, `filtrados`. `ed` es prop normal.

---

### 5. `imprimir-agrupacion.ts` (helper, no componente)

Función `imprimirAgrupacion(d: PrintAgrupacionData, opts: {firmas, titulo})` (`:279-294`). Construye un HTML A4 completo (`buildHtml`, `:133-277`), abre `window.open('', '_blank')`, escribe el documento y dispara `w.print()` en `onload`. Si el navegador bloquea el popup, muestra `alert` (`:286`). Detalle en Interacciones.

---

## API consumida

`apiUrl = http://localhost:5000/api` (de `environment.apiUrl`). Todas las llamadas pasan por `HttpClient` (interceptor agrega auth — ver architecture.md).

### Recurso `agrupaciones`
| Método | Ruta | Componente · Línea | Acción |
|--------|------|--------------------|--------|
| GET    | `/agrupaciones`               | `agrupaciones.component.ts:652` (`loadTodas`)  | Lista "Todas" |
| GET    | `/agrupaciones/padron`        | `agrupaciones.component.ts:653` (`loadPadron`) | Padrón electoral |
| PUT    | `/agrupaciones/{id}`          | `agrupaciones.component.ts:626` (`guardarNueva` modo editar) | Editar datos maestros |

### Recurso `agrupaciones-pendientes`
| Método | Ruta | Componente · Línea | Acción |
|--------|------|--------------------|--------|
| GET    | `/agrupaciones-pendientes`            | `agrupaciones-pendientes.component.ts:347` (`cargar`) | Lista pendientes |
| POST   | `/agrupaciones-pendientes/nueva`      | `agrupaciones.component.ts:638` (`guardarNueva` modo nueva) | Alta directa (entra pendiente) |
| POST   | `/agrupaciones-pendientes/promover`   | `fichas-agrupacion.component.ts:802` (`confirmarPromover`) | Ficha web → pendiente |
| PUT    | `/agrupaciones-pendientes/{id}`       | `agrupaciones-pendientes.component.ts:485` (`confirmar` modo editar) | Editar pendiente |
| POST   | `/agrupaciones-pendientes/{id}/aprobar` | `agrupaciones-pendientes.component.ts:484` (`confirmar` modo aprobar) | Aprobar → "Todas" |
| DELETE | `/agrupaciones-pendientes/{id}`       | `agrupaciones-pendientes.component.ts:381` (`eliminar`) | Eliminar pendiente |

### Recurso `agrupaciones-periodos`
| Método | Ruta | Componente · Línea | Acción |
|--------|------|--------------------|--------|
| GET   | `/agrupaciones-periodos`                              | `agrupaciones-por-periodo.component.ts:624` (constructor) y `:525` (recarga tras editar) | Lista período×agrupación con integrantes |
| PUT   | `/agrupaciones-periodos/{periodoId}`                 | `agrupaciones-por-periodo.component.ts:513` (`guardarEditar`) | Editar período + sublemas |
| PATCH | `/agrupaciones-periodos/{periodoId}/asuntos-politicos` | `agrupaciones-por-periodo.component.ts:540` (`toggleAP`) body `{value}` | Toggle flag AP |

### Recurso `fichas-agrupacion`
| Método | Ruta | Componente · Línea | Acción |
|--------|------|--------------------|--------|
| GET    | `/fichas-agrupacion`             | `fichas-agrupacion.component.ts:583` (`cargar`)        | Lista fichas web |
| POST   | `/fichas-agrupacion/sincronizar` | `fichas-agrupacion.component.ts:595` (`sincronizar`) body `{}` | Importar fichas desde la web |
| PUT    | `/fichas-agrupacion/{id}`        | `fichas-agrupacion.component.ts:774` (`confirmarEditar`) | Editar ficha + autoridades |
| DELETE | `/fichas-agrupacion/{id}`        | `fichas-agrupacion.component.ts:603` (`eliminar`)      | Eliminar ficha |

### Recurso `agrupacion-integrantes`
**No se consume ningún endpoint propio.** Los integrantes (`IntegranteRow`, `agrupaciones-por-periodo.component.ts:8-20`) llegan **embebidos** en la respuesta de `GET /agrupaciones-periodos` (campo `integrantes` de cada `AgrupacionPeriodoRow`, `:65`). No hay alta/baja/edición de integrantes desde esta feature — sólo lectura y se pasan al PDF. (Ver gaps.)

---

## Modelos / interfaces

| Interface | Archivo · Línea | Notas |
|-----------|-----------------|-------|
| `Agrupacion` | `agrupaciones.component.ts:11-23` | Datos maestros + sublema1..5 + sublemaRenunciado. `tipo` puede venir como `'D'`/`'N'` (se traduce a DEPARTAMENTAL/NACIONAL en UI, `:201`). |
| `PadronItem` | `agrupaciones.component.ts:24` | `serie, nro, primerNombre, segundoNombre, primerApellido, segundoApellido`. |
| `Tab` | `agrupaciones.component.ts:26` | union de las 5 tabs. |
| `AgrupacionPendiente` | `agrupaciones-pendientes.component.ts:8-22` | Como `Agrupacion` + `fichaAgrupacionOrigenId?` (traza el origen). `tipo` aquí en formato largo (DEPARTAMENTAL/NACIONAL). |
| `IntegranteRow` | `agrupaciones-por-periodo.component.ts:8-20` | `id, contactoId, nombre, apellido, cedula?, credencial?, telefono?, celular?, email?, cargo?, fechaIngreso?`. |
| `AgrupacionPeriodoRow` | `agrupaciones-por-periodo.component.ts:22-66` | Une período (`periodoId, periodo, pendiente, fichaAgrupacionOrigenId?`) + datos maestros (`agrupacionId, codAgrup...`) + `asuntosPoliticos: boolean` + `integrantes: IntegranteRow[]`. |
| `AutoridadFicha` | `fichas-agrupacion.component.ts:7-17` (exportada) | `id, nombre, apellido, ci, rol, orden` + `errorCi?, errorNombre?, errorAdhesion?` (validación server). |
| `FichaAgrupacion` | `fichas-agrupacion.component.ts:19-44` (exportada) | Datos de la ficha web + responsable + sublema1..5 + `estado` + `autoridades[]`. |
| `PrintAgrupacionData` | `imprimir-agrupacion.ts:7-61` (exportada) | DTO de impresión (incluye `integrantes?` opcional). |

`DEPARTAMENTOS` (lista de 19 deptos + 'Nacional'): definida dos veces — `agrupaciones.component.ts:526-530` (campo `departamentos`) y `agrupaciones-pendientes.component.ts:24-28` (const `DEPARTAMENTOS`). **Duplicada.**

---

## Interacciones / UX

### Modales de edición (4 distintos)
1. **Host — Nueva / Editar Agrupación** (`agrupaciones.component.ts:37-139`): modal grande con secciones Identificación / Domicilio / Comisión Electoral / (Sublemas sólo en modo nueva, `:108`) / Observaciones. Modo `nueva` → `POST .../nueva`; modo `editar` → `PUT /agrupaciones/{id}`. Validación: sólo Nombre obligatorio (`:606`). `toInputDate()` (`:550-556`) convierte `dd/MM/yyyy`/ISO a `yyyy-MM-dd` para los `input[type=date]`. Al crear, salta a tab `pendientes` (`:642`).
2. **Pendientes — Editar/Aprobar** (un modal, dos modos): los `*` y la validación `faltantes()` sólo aplican en aprobar. Cabecera cambia a verde. Descrito arriba.
3. **Período — Editar período**: sólo período + sublemas + renunciado (campos específicos del período). Modal chico (`:391`, 640px).
4. **Fichas — Editar ficha** + **Promover** + **WhatsApp**: el editar incluye gestión inline de autoridades con reglas de negocio (≥5 autoridades, 1 Presidente, ≥1 Secretario).

Todos los modales: backdrop con click-para-cerrar + `$event.stopPropagation()` en el cuerpo; signals `busy`/`error` por modal; el "lápiz" (SVG idéntico) abre el modal de edición desde cada row.

### Impresión (`imprimirAgrupacion`)
- Genera un HTML A4 self-contained con CSS `@page`/`@media print` (`imprimir-agrupacion.ts:143-192`), lo abre en ventana nueva y dispara `print()` en `onload` (`:293`). El usuario elige "Guardar como PDF".
- Secciones: header con badge PENDIENTE/APROBADA (`:134-136`), Datos, Domicilio, Comisión Electoral, Sublemas, Antecedentes/Resolución, Integrantes (`buildIntegrantes`, `:88-116`), y **Firmas** condicionales.
- **Firmas:** sólo si `opts.firmas` (`:272`). `FIRMAS_PENDIENTE` (`:65-74`) es una **lista hardcodeada** de nombres (Gloria Rodriguez, Luis Alberto Heber, Javier Garcia, Enrique Antia, Armando Castaingdo, '', Juventud, Juventud (2)). Las celdas `''` mantienen la grilla 2-cols.
- Quién pasa `firmas`: **Pendientes** imprime con `firmas:true, titulo:'Agrupación Pendiente'` (`agrupaciones-pendientes.component.ts:376`); **Por Período** con `firmas:false, titulo:'Agrupación por Período'` y `integrantes` incluidos (`agrupaciones-por-periodo.component.ts:571`). El host "Todas" **no imprime**.
- `tipoLabel` traduce `'D'`/`'N'` a labels largos (`:78-82`); `fmt` pone `'—'` para vacíos (`:76`).

### Flujo de aprobación (3 etapas)
1. **Sincronizar** trae fichas web (`fichas-agrupacion`), que llegan con errores de validación marcados por autoridad.
2. **Pasar a pendiente** (promover) — bloqueado si hay errores; abre modal para completar campos faltantes; `POST .../promover`. La pendiente queda con `fichaAgrupacionOrigenId` apuntando a la ficha.
3. **Aprobar** en Pendientes — requiere **todos** los campos `*` completos (`faltantes()`); `POST .../{id}/aprobar`; pasa a "Todas" y se elimina de Pendientes (hint del modal, `:159-162`).

### WhatsApp
Contacto directo al responsable de la ficha vía `wa.me` con mensaje plantilla precargado; no usa la API del backend, abre WhatsApp Web (`fichas-agrupacion.component.ts:646-654`).

---

## Dependencias

- **Angular core:** `@angular/core` (Component, signal, computed, inject), standalone components.
- **`CommonModule`, `FormsModule`** (`ngModel` en todos los forms/filtros).
- **`HttpClient`** (`@angular/common/http`) — todas las llamadas API.
- **`environment`** (`../../../environments/environment`) — `apiUrl`.
- **`PageTitleService`** (`../../core/page-title.service`) — sólo en el host (`agrupaciones.component.ts:6,503,516`).
- **`imprimirAgrupacion`** (helper local) — usado por Pendientes y Por Período.
- **Componentes hijos** importados por el host: `FichasAgrupacionComponent`, `AgrupacionesPendientesComponent`, `AgrupacionesPorPeriodoComponent`.
- **Browser APIs:** `window.open` (impresión y WhatsApp), `confirm`/`alert` (eliminar, error AP, popup bloqueado), `encodeURIComponent`.
- **Transversal:** `authGuard` en la ruta, `authInterceptor` para el token (ver architecture.md).

---

## No implementado / gaps

1. **Tab no persistida en la URL:** las 5 sub-vistas son tabs internas (signal), no rutas. Refrescar pierde la tab; no hay deep-link a "pendientes", "fichas", etc.
2. **CRUD de integrantes ausente:** `IntegranteRow` se muestra y se imprime, pero **no hay endpoint `agrupacion-integrantes`** ni UI para alta/baja/edición de integrantes desde esta feature. Llegan embebidos en `GET /agrupaciones-periodos` (read-only).
3. **Recargas full en vez de update local:** tras editar/aprobar/eliminar se hace un GET completo (`cargar`/`loadTodas`/`:525`); no hay actualización incremental del signal (salvo el toggle AP optimista).
4. **`DEPARTAMENTOS` duplicado** en host y en pendientes (`agrupaciones.component.ts:526` vs `agrupaciones-pendientes.component.ts:24`).
5. **Firmas hardcodeadas:** `FIRMAS_PENDIENTE` (`imprimir-agrupacion.ts:65`) son nombres fijos en código, no configurables.
6. **El host "Todas" no imprime** (sólo Pendientes y Por Período tienen botón 🖨).
7. **WhatsApp sin envío real:** sólo abre `wa.me` precargado; el envío depende de acción manual del usuario en WhatsApp Web.
8. **Modal del host (editar) no incluye Sublemas:** los sublemas se editan sólo desde "Por Período" (nota explícita, `agrupaciones.component.ts:53-55`; `@if modoModal==='nueva'` envuelve los sublemas, `:108`).
9. **`sigla`/`descripcion` en forms pero parcialmente fuera del modelo de tabla:** el form de Nueva tiene `sigla`/`descripcion` (`:534`), pero la interface `Agrupacion` no los lista; se mandan al backend sin tipado.
10. **Sin manejo de error en cargas iniciales del host:** `loadTodas`/`loadPadron` (`:652-653`) no tienen rama `error` (a diferencia de los hijos), por lo que un fallo deja la tabla vacía sin feedback.

## Actualización feature 030 — filtros Nombre / Código / ID / Depto

| Pestaña | Filtros (fila `.filter-row`) | Params |
|---|---|---|
| Todas | ID, Cod. Agrup., Nombre, Depto. | `id`, `cod`, `nombre`, `depto` |
| Pendientes | ID, Cod. Agrup., Nombre, Depto. | `id`, `cod`, `nombre`, `depto` |
| Fichas Web | ID, Nombre Agrupación, Departamento | `id`, `nombre`, `departamento` |
| Por Período | se suman Id e Id Agr. | `id`, `agrId` |

- Debounce de 300 ms y vuelta a la página 1.
- Por Período: el dropdown de Depto. usa `DEPARTAMENTOS`. Antes salía de `/opciones` (valores crudos de la base); `/opciones` se sigue usando solo para los períodos.
- **Estados vacíos/cargando**: con filtros activos, o después de la primera carga, la tabla queda visible para no perder la fila de filtros. "Sin resultados" se muestra dentro de la tabla. Aplica a `app-list-state` (Todas) y a los `@if (loading())` de Pendientes y Fichas.
- Los dropdowns de departamento de los **formularios** (alta/aprobación) no cambian.

- Los dropdowns de Depto. de las grillas de agrupaciones (Todas, Pendientes, Por Período) son `[...DEPARTAMENTOS, 'Nacional']`. El dato guarda letras de serie (`C`, `X`); el backend las mapea.
