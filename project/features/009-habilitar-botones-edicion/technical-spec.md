# Technical Specification: Habilitar botones de edición ("lápiz") + alta de entidades

**Status**: Ready
**Created**: 2026-07-04
**Updated**: 2026-07-04 (inventario real + contrato backend desde INTEGRACION-FRONTEND.md)

## Architecture Overview

Para cada una de las 4 entidades en alcance, cablear el `(click)` del lápiz y de un botón "+ Nuevo/Nueva" a
un **modal/form** (edición y alta), persistiendo vía `PUT`/`POST` al backend y refrescando la vista.

- **UX / patrón visual**: reutilizar el patrón ya existente en `agrupaciones.component.ts`
  (signal `modoModal`, computed `esModalNueva`, métodos `abrirNueva()` / `abrirEditar(x)` / `guardar()` /
  `cerrarModal()`; mismo markup de modal y clases CSS). Objetivo: consistencia visual total.
- **HTTP**: crear **services por dominio** en `core/services/` (`convencionales.service.ts`,
  `organismos.service.ts`) que encapsulen los GET/POST/PUT tipados. Es código nuevo (greenfield), así que se
  adopta el estándar objetivo de `CLAUDE.md` (DEBT-006) sin refactor de riesgo. Los componentes dejan de usar
  `HttpClient` directo para estas entidades.
  - *Alternativa de menor esfuerzo* (si se prioriza velocidad): mantener `HttpClient` en el componente como
    hoy, igual que `agrupaciones.component.ts`. Decisión a confirmar en `/project.plan`.
- **Modelos**: mover/definir las interfaces alineadas a los DTO reales en `core/models/` (DEBT-009), o al
  menos corregir las interfaces inline del componente (ver "Data Model" abajo).
- **Estado**: signals para lista, `modoModal`, entidad en edición, `loading`, `error`.

## Inventario (relevado del código)

| # | Dominio / Componente | Tab | Botón hoy | Handler hoy | Entidad | Endpoint edición | Endpoint alta |
|---|---|---|---|---|---|---|---|
| 1 | `convencionales.component.ts:63` | Nacionales | `title="Editar (no implementado)"` | ❌ ninguno | Convencional | `PUT /api/convencionales/{id}` | `POST /api/convencionales` |
| 2 | `convencionales.component.ts:117` | ODN / ODD | `title="Editar (no implementado)"` | ❌ ninguno | Lista | `PUT /api/convencionales/listas/{id}` | `POST /api/convencionales/listas` |
| 3 | `organismos.component.ts:83` | Todos | `title="Editar (no implementado)"` | ❌ ninguno | Organismo (Estatal/Partidario) | `PUT /api/organismos/{estatales\|partidarios}/{id}` | `POST /api/organismos/{estatales\|partidarios}` |
| 4 | `organismos.component.ts:135` | Info | `title="Editar (no implementado)"` | ❌ ninguno | InfoOrganización | `PUT /api/organismos/info/{id}` | `POST /api/organismos/info` |

> Todos los endpoints **ya existen** en el backend (verificado en `INTEGRACION-FRONTEND.md` §7.9 y §7.10).

## API Contract

Base: `${environment.apiUrl}` (= `http://localhost:5000/api`). Todos 🔒 (JWT). Errores por envelope del
middleware: `{ status, errorCode, message, timestamp }` (`FK_INVALID`→400, `NOT_FOUND`→404).

### Convencional — `ConvencionalInput` (POST/PUT, sin `Id`)
```txt
{ contactoId:int, tipo:"Nacional"|"Departamental", departamento?:string, condicion?:string,
  adherente:bool, nombreOrganismo?:string, posicion?:string, fechaInicio:ISO, fechaFin?:ISO }
```
- `POST /api/convencionales` → 201 `ConvencionalDto`. **400 FK_INVALID** si `contactoId` no existe.
- `PUT /api/convencionales/{id}` → 200 `ConvencionalDto`. **404** / **400** FK.
- GET tab Nacionales: `GET /api/convencionales/nacionales` → `ConvencionalDto[]` (Tipo="Nacional").

### Lista — `ListaInput`
```txt
{ nombre:string, tipo:"ODN"|"ODD", agrupacionId?:int }
```
- `POST /api/convencionales/listas` → 201. **400** si `agrupacionId` provisto no existe.
- `PUT /api/convencionales/listas/{id}` → 200. **404** / **400** FK.
- GET: `GET /api/convencionales/listas/{odn|odd}` → `ListaDto[]`.

### Organismo — `OrganismoInput` (mismo shape estatal/partidario)
```txt
{ nombre:string, nombreCompania?:string, tipoOrganismoId:int, categoria?:string, descripcion?:string,
  direccion?:string, ciudad?:string, departamento?:string, pais?:string, art44:bool,
  ordenDpto:int, observaciones?:string }
```
- `POST /api/organismos/{estatales|partidarios}` → 201. **400** si `tipoOrganismoId` no existe.
- `PUT /api/organismos/{estatales|partidarios}/{id}` → 200. **404** / **400** FK.
- GET tab Todos: `GET /api/organismos/todos` → `OrganismoTodosDto[]` (incluye `ambito:"Estatal"|"Partidario"`).
- Select de tipos: `GET /api/organismos/tipos` → `TipoOrganismoDto[]`.

### InfoOrganización — `InfoOrganizacionInput`
```txt
{ tipoOrganismoId?:int, organismoEstatalId?:int, organismoPartidarioId?:int,
  direccion?:string, telefono?:string, email?:string, observaciones?:string }
```
- `POST /api/organismos/info` → 201. **400** si alguna FK provista no existe.
- `PUT /api/organismos/info/{id}` → 200. **404** / **400** FK.
- GET: `GET /api/organismos/info` → `InfoOrganizacionDto[]`.

## Data Model & Storage — ⚠️ desalineación read-model ↔ backend

Las interfaces del front reflejan el **mock viejo**, no el DTO real que hoy devuelve el backend. Realinear es
prerequisito para editar (los campos a editar no están en el modelo actual):

| Entidad | Interface actual (front) | DTO real backend | Acción |
|---|---|---|---|
| Convencional | `{ id, nombre, lista, codigoLrf, departamento, cargoLista, contacto }` | `{ id, contactoId, tipo, departamento?, condicion?, adherente, nombreOrganismo?, posicion?, fechaInicio, fechaFin? }` | **Reescribir** interface + grilla; el form usa los campos del DTO |
| Lista | `{ codigoLrf, nombre, departamento, titulares, suplentes }` | `{ id, nombre, tipo, agrupacionId? }` | **Reescribir**; añadir `id`, `tipo`, `agrupacionId` |
| Organismo | `{ id, nombre, descripcion, direccion, ciudad, departamento, pais, art44, ordenDpto, observaciones? }` | `OrganismoTodosDto{ ambito, id, nombre, nombreCompania?, tipoOrganismoId, categoria?, ...campos }` | **Extender**: falta `ambito`, `tipoOrganismoId`, `nombreCompania`, `categoria` |
| InfoOrg | `{ id, idTipo, idEstatal, idPartidario, nombreCompania, nombreAbreviado, departamento }` | `{ id, tipoOrganismoId?, organismoEstatalId?, organismoPartidarioId?, direccion?, telefono?, email?, observaciones? }` | **Reescribir**: el shape difiere casi por completo |

> Nota: como los GET actuales tipan mal la respuesta, es posible que algunas columnas de estas grillas hoy
> aparezcan vacías con datos reales. La feature corrige grilla + form juntos.

Modelos objetivo en `core/models/convencionales.ts` y `core/models/organismos.ts` (o inline corregidas si se
opta por menor esfuerzo).

## External Integrations

Ninguna nueva. Solo el backend propio (`administracion-pn-backend`).

## Error Handling

| Code | Error | UX |
|------|-------|----|
| 400 | `FK_INVALID` / validación | Mostrar `message` en el form; no cerrar; permitir corregir |
| 404 | `NOT_FOUND` | Aviso "el registro ya no existe" + refrescar grilla |
| 401 | Auth | Manejo global (interceptor) → reautenticar |
| 500 | INTERNAL_ERROR | Mensaje genérico; form queda abierto |

Leer `errorCode` si viene (envelope del middleware); si no, `message`. El status HTTP siempre es fiable
(ver `INTEGRACION-FRONTEND.md` §4).

## Non-Functional Requirements

- **Performance**: no recargar toda la grilla innecesariamente (update de fila o refetch acotado del tab).
- **Security**: endpoints `[Authorize]` (JWT), igual que el resto.
- **Consistencia visual**: reutilizar el modal/estilos existentes (agrupaciones) — requisito explícito.
- **Testing (production, ≥80% en lo tocado)**: unit de los services (POST/PUT/GET tipados, mapeo de errores)
  y de los componentes (el botón dispara la operación y refleja éxito/error). Requiere montar el runner
  Karma/Jasmine (DEBT-001) — **precondición** o riesgo a decidir en `/project.plan`.

## Cross-repo (administracion-pn-backend)

**Resuelto.** Los `POST/PUT` de las 4 entidades ya están implementados y documentados
(`docs/INTEGRACION-FRONTEND.md`). Ítem espejo: `backend-backlog.md` de esta feature → completado. No queda
trabajo backend pendiente para el alcance de esta feature.
