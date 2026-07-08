# Functional Specification: unificar-organismos-frontend

**Status**: Draft
**Created**: 2026-07-08

## Problem Statement

El backend (feature 006, ya en `main`) unificó el esquema de Organismos: recurso único `/organismos`
con `ambito` (Estatal|Partidario), `TipoOrganizacion` (ex TipoOrganismo), integrantes por
`/organismos/{id}/integrantes`, `InfoOrganizacion` con FK única `organismoId`, y en Contacto se
quitaron `telefono2`/`telefonoTrabajo2` y `localidad` pasó a `ciudad`. El frontend todavía consume el
contrato viejo (`/organismos/estatales|partidarios|todos`, `tipoOrganismoId`, ids por ámbito,
`telefono2`, `localidad`) → la vista de Organismos y el detalle/alta de Contacto quedan rotos contra
el backend nuevo. Esta feature actualiza el frontend al contrato nuevo con el **cambio mínimo**.

## Objectives

- [ ] Consumir el recurso único `/organismos` (lista con filtro `?ambito`, alta con `ambito` en body, edición por id).
- [ ] Renombrar el modelo/endpoint `TipoOrganismo` → `TipoOrganizacion`.
- [ ] Integrantes de un organismo vía `GET /organismos/{id}/integrantes` (id global, sin ámbito en la ruta).
- [ ] `InfoOrganizacion`: reemplazar `organismoEstatalId`/`organismoPartidarioId` por `organismoId`; `tipoOrganizacionId`.
- [ ] Contacto: quitar `telefono2` y `telefonoTrabajo2` de toda la UI; renombrar `localidad` → `ciudad` (label visible **"Ciudad"**).
- [ ] Mantener la **grilla unificada** de Organismos (badge + filtro de ámbito) tal como está hoy.

## Out of Scope

- Cambios de backend (hechos en feature 006).
- `telefono2` de FichaAgrupacion (otra entidad) — no se toca.
- `integrantes-contacto.component.ts` y el DTO `IntegranteOrganismo`: el backend preservó su shape → sin cambios.
- Reestructurar la vista en dos secciones separadas (se descartó: se mantiene grilla unificada).
- Montar el runner de tests (DEBT-001).

## User Stories

### US-1: Ver y filtrar organismos (grilla unificada)
**As a** usuario de Secretaría/Hacienda/IT
**I want to** ver todos los organismos en una grilla con ámbito y filtrarlos
**So that** puedo encontrar un organismo sin importar si es estatal o partidario

#### Acceptance Criteria
- AC-1: La grilla "Todos los Organismos" carga desde `GET /organismos` y muestra la columna Ámbito (badge Estatal/Partidario).
- AC-2: El filtro de ámbito (Todos/Estatal/Partidario) sigue funcionando sobre la lista.
- AC-3: El select de Tipo en el form se puebla desde `GET /organismos/tipos` (`TipoOrganizacionDto`).

### US-2: Ver integrantes inline de un organismo
**As a** usuario
**I want to** desplegar un organismo y ver sus integrantes
**So that** consulto la composición sin navegar a otra pantalla

#### Acceptance Criteria
- AC-4: Al desplegar una fila se llama `GET /organismos/{id}/integrantes` (sin ámbito en la ruta) y se listan los integrantes.
- AC-5: Organismo sin integrantes → mensaje "Este organismo no tiene integrantes" (no error).
- AC-6: Error de carga → mensaje + botón "Reintentar"; caché por organismo se mantiene (no refetch al re-expandir).

### US-3: Alta y edición de organismo
**As a** usuario con permisos
**I want to** crear y editar organismos
**So that** mantengo el padrón de organismos

#### Acceptance Criteria
- AC-7: Alta → `POST /organismos` con `ambito` y `tipoOrganizacionId` en el body; ámbito obligatorio.
- AC-8: Edición → `PUT /organismos/{id}`; el ámbito queda deshabilitado (inmutable) y no se envía.
- AC-9: Validación cliente: nombre y tipo obligatorios; ámbito inválido lo rechaza el backend (400) y se muestra el mensaje.

### US-4: Info de Organización con FK única
**As a** usuario
**I want to** ver/editar la Info de Organización referida a un organismo
**So that** el dato queda asociado al organismo unificado

#### Acceptance Criteria
- AC-10: La tab Info muestra una sola columna "Id Organismo" (`organismoId`) en vez de "Id Org. Est." / "Id Org. Part.".
- AC-11: El modal de Info tiene un único input "Organismo ID" y el select de Tipo usa `tipoOrganizacionId`.
- AC-12: Alta/edición de Info envía `organismoId` y `tipoOrganizacionId`.

### US-5: Contacto sin teléfonos 2 y con Ciudad
**As a** usuario de Agenda
**I want to** que el alta/edición y el detalle de contacto reflejen el esquema nuevo
**So that** no envío campos inexistentes ni veo columnas vacías

#### Acceptance Criteria
- AC-13: El alta/edición de contacto (`agenda-nuevo`) ya no tiene inputs de `telefono2` ni `telefonoTrabajo2`.
- AC-14: El campo antes "Localidad" ahora bindea a `ciudad` y su label visible es **"Ciudad"** (alta y detalle).
- AC-15: El detalle de contacto (`agenda-listado`) ya no muestra las filas "Teléfono 2" (personal ni laboral) y muestra "Ciudad".
- AC-16: La detección de duplicados (`duplicados-contactos`) ya no usa `telefono2`/`telefonoTrabajo2` y usa `ciudad` (label "Ciudad").

## Business Rules

- BR-1: Los ids de organismo ahora son globales (tabla unificada); la caché de integrantes se puede clavear solo por `id`.
- BR-2: El ámbito es inmutable en edición (coherente con el backend, que no lo acepta en el PUT).

## Edge Cases

- EC-1: Organismo sin integrantes → lista vacía con mensaje, no error (AC-5).
- EC-2: Contacto viejo con datos en `localidad` → se leen como `ciudad` (el backend ya renombró la columna).

## Success Metrics

- La vista de Organismos y el alta/detalle de Contacto funcionan contra el backend feature 006 sin errores de contrato.
- `ng build` (producción) sin errores de tipos.

## Feature Dependencies

- Backend feature 006 (unificar-organismos-schema) — desplegado en `main`.
