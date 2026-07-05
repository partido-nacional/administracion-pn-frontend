# Functional Specification: Habilitar botones de edición ("lápiz") + alta de entidades

**Status**: Ready
**Created**: 2026-07-04
**Updated**: 2026-07-04 (relevamiento + sync con backend implementado)

## Problem Statement

> En Convencionales y Organismos hay **4 botones "lápiz" colgados** (`title="Editar (no implementado)"`,
> sin `(click)`). Hay que **habilitarlos y conectarlos al backend** (`PUT`), **agregar el botón de alta**
> (`POST`) para esas mismas entidades, y abrir **forms/modales** de edición y creación, manteniendo el
> aspecto visual y el comportamiento consistentes con el resto de las vistas.

### Estado real relevado (2026-07-04)

- **Backend**: los endpoints de edición **ya existen** (se implementaron en `administracion-pn-backend` en
  esta feature; documentados en `docs/INTEGRACION-FRONTEND.md`, secciones 7.9 Convencionales y 7.10
  Organismos). La dependencia cross-repo **está resuelta**.
- **4 botones colgados** (los únicos con `title="Editar (no implementado)"`):
  1. `convencionales.component.ts:63` — tab **Nacionales** → entidad **Convencional**.
  2. `convencionales.component.ts:117` — tabs **ODN/ODD** → entidad **Lista**.
  3. `organismos.component.ts:83` — tab **Todos** → entidad **Organismo** (Estatal/Partidario según `Ambito`).
  4. `organismos.component.ts:135` — tab **Info** → entidad **InfoOrganización**.
- **Desalineación read-model ↔ backend**: los GET de estas vistas ya devuelven la **entidad cruda** del
  backend, pero las interfaces del front todavía reflejan el shape del **mock viejo** (campos de display
  como `nombre`, `lista`, `codigoLrf`, `cargoLista`, `contacto`). Alinear el read-model es parte del trabajo
  (sin él, ni la grilla ni el form muestran los campos reales). Detalle en la spec técnica.
- **Patrón de referencia**: `agrupaciones.component.ts` ya implementa modal de **alta + edición** con
  `HttpClient` (`abrirNueva()`, `abrirEditar(a)`, signal `modoModal`, computed `esModalNueva`). Es el modelo
  visual/UX a reutilizar.

## Objectives

- [ ] Habilitar los **4 botones de edición** colgados y conectarlos a su `PUT` (Convencional, Lista, Organismo, Info).
- [ ] Agregar **botón de alta** (`POST`) para esas mismas 4 entidades (tomando de referencia botones "+ Nuevo/Nueva" existentes).
- [ ] Abrir **modal/form** de edición y de creación por entidad, con validación de obligatorios y FKs.
- [ ] Alinear los **read-models** del front (interfaces + grilla) con los DTO reales del backend.
- [ ] Manejar **loading / error / éxito** en cada operación, refrescando la grilla tras guardar.
- [ ] Mantener aspecto visual y comportamiento **consistentes** con las demás vistas (mismo modal, botones, estilos).

## Out of Scope

- **Baja / DELETE**: el backend lo soporta, pero esta feature cubre solo **alta y edición**.
- Entidades **sin botón hoy** y no pedidas: Convencional *departamental*, Integrante de Lista, TipoOrganismo,
  Integrante de Organismo, Referente Partidario. (El backend ya tiene su CRUD; queda para otra feature.)
- Los **5 lápices que ya funcionan** (agrupaciones, agrupaciones-pendientes, agrupaciones-por-periodo,
  productos, agenda, fichas-contacto): fuera de alcance.
- Endpoints **MOCK** (padrón, débitos) y reportería (`/api/listados/*`).

## User Stories

### US-1: Alta y edición de Convencional (nacional)
**As an** administrador
**I want to** crear un convencional nacional y editar uno existente desde la tab Nacionales
**So that** los datos del padrón de convencionales se mantengan al día sin tocar la base a mano

#### Acceptance Criteria
- AC-1: El botón "lápiz" de cada fila abre un form precargado con los datos reales del convencional.
- AC-2: Un botón "+ Nuevo" abre el mismo form vacío para crear.
- AC-3: Guardar edición hace `PUT /api/convencionales/{id}`; guardar alta hace `POST /api/convencionales`.
- AC-4: Tras guardar OK, el modal cierra y la grilla se refresca (o actualiza la fila).
- AC-5: Si `ContactoId` no existe, el backend responde 400 `FK_INVALID` y la UI muestra el error sin cerrar el form.

### US-2: Alta y edición de Lista (ODN/ODD)
**As an** administrador
**I want to** crear y editar listas de convencionales desde las tabs ODN/ODD
**So that** las listas reflejen la conformación real

#### Acceptance Criteria
- AC-1: El lápiz de la fila abre el form de la lista con sus datos; "+ Nueva" abre el form vacío.
- AC-2: Edición → `PUT /api/convencionales/listas/{id}`; alta → `POST /api/convencionales/listas`.
- AC-3: El campo `Tipo` (ODN/ODD) se preselecciona según la tab activa al crear.
- AC-4: `AgrupacionId` es opcional; si se envía con un valor inexistente, 400 y se muestra el error.

### US-3: Alta y edición de Organismo (Estatal/Partidario)
**As an** administrador
**I want to** crear y editar organismos desde la tab "Todos los Organismos"
**So that** el catálogo de organismos esté actualizado

#### Acceptance Criteria
- AC-1: El lápiz abre el form del organismo; "+ Nuevo" abre el form vacío.
- AC-2: La UI distingue el **ámbito** (Estatal/Partidario) para pegarle al endpoint correcto
  (`/organismos/estatales` vs `/organismos/partidarios`).
- AC-3: `TipoOrganismoId` es obligatorio; el form ofrece un select poblado con `GET /organismos/tipos`.
- AC-4: Edición → `PUT`; alta → `POST`. Si `TipoOrganismoId` no existe, 400 y error visible.

### US-4: Alta y edición de Info de Organización
**As an** administrador
**I want to** crear y editar la info de organización desde la tab "Info"
**So that** los datos de contacto de cada organismo estén completos

#### Acceptance Criteria
- AC-1: El lápiz abre el form de InfoOrganización; "+ Nueva" abre el form vacío.
- AC-2: Edición → `PUT /api/organismos/info/{id}`; alta → `POST /api/organismos/info`.
- AC-3: Las FKs (`TipoOrganismoId`, `OrganismoEstatalId`, `OrganismoPartidarioId`) son **nullable**; solo se
  validan si se envían con valor.

## Business Rules

- BR-1: Toda operación requiere **JWT** (los endpoints están `[Authorize]`). El 401 se maneja global (reautenticar).
- BR-2: **Solo alta y edición**; no se expone baja en esta feature.
- BR-3: El look & feel del modal, botones y estados debe ser **idéntico** al de las vistas ya implementadas
  (referencia: modal de agrupaciones).
- BR-4: Tras una operación exitosa, la vista debe reflejar el cambio sin recargar toda la app (refetch acotado o update de fila).

## Edge Cases

- EC-1: Editar un registro borrado por otro usuario → 404 → mostrar mensaje y refrescar la grilla.
- EC-2: FK inválida (`ContactoId`, `TipoOrganismoId`) → 400 `FK_INVALID` → error en el form, sin cerrar.
- EC-3: Organismo sin `Ambito` legible → no permitir editar hasta resolver el ámbito (o inferirlo del tab/dato).
- EC-4: Error de red / 500 → mensaje genérico y el form queda abierto con lo tipeado.
- EC-5: Doble submit → deshabilitar el botón guardar mientras hay request en vuelo.

## Success Metrics

- Los 4 botones de edición disparan un `PUT` que **persiste** en el backend y se refleja en la grilla.
- Las 4 entidades tienen un alta funcional que **persiste** vía `POST`.
- No quedan botones con `title="Editar (no implementado)"` en Convencionales ni Organismos.

## Feature Dependencies

- Backend `administracion-pn-backend` (.NET 8): **resuelto**. Endpoints POST/PUT de Convencionales (7.9) y
  Organismos (7.10) implementados y documentados en `docs/INTEGRACION-FRONTEND.md`.
- Ítem espejo cross-repo: `backend-backlog.md` de esta feature (CRUD de Convencionales y Organismos) → **completado**.
