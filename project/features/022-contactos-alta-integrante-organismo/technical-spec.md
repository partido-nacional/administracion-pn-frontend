# Technical Specification: Contactos — alta de integrante de organismo

**Status**: Draft
**Created**: 2026-07-12

## Architecture Overview

Feature cross-repo. Sin cambios de schema — se usan `MiembroOrganismo.Activo` (bool) y `FechaFin` (date?) existentes.

**Backend** (`administracion-pn-backend`):
1. `POST /api/organismos/integrantes` (`CrearIntegrante`): validar la regla — si el contacto ya tiene una ficha con `Activo==true`, devolver **409**. Fuerza el alta a `Activo=true`, `FechaFin=null` (nueva = vigente) ignorando esos campos del input o validándolos.
2. **Finalizar**: los soft-delete (`DELETE /integrantes-organismo/{id}` y `DELETE /organismos/integrantes/{id}`) ahora setean `FechaFin = hoy` (si estaba null) **además** de `Activo=false`.
3. `GET /api/contactos/{id}/integrantes-organismo`: quitar el filtro `Where(Activo)` → devuelve **todas** las fichas; agregar `Activo` (bool) al `IntegranteOrganismoDto`.
4. Grilla de contactos (`ContactosController.List`): `tieneIntegranteOrganismo` pasa de `Any(...&& Activo)` a `Any(...)` (≥1 ficha, activa o no).

**Frontend** (`administracion-pn-frontend`):
1. `agenda-listado`: si `tieneIntegranteOrganismo` → link "Int. Organismo" (grilla, igual que hoy); si no → botón **"Agregar integrante organismo"** → `/agenda/{id}/organismos/nuevo`.
2. Nueva pantalla de alta `IntegranteOrganismoNuevoComponent` (ruta `/agenda/:contactoId/organismos/nuevo`): form → `POST /organismos/integrantes`.
3. `IntegrantesContactoComponent` (grilla): consume el GET (todas), muestra estado (Vigente/Finalizada), botón **"Nuevo integrante organismo"** arriba (deshabilitado si `items.some(i => i.activo)`), y renombra "Eliminar" → **"Finalizar"** (solo en filas activas).
4. `contactos.service`: `crearIntegranteOrganismo(input)` (POST) + `activo` en la interface `IntegranteOrganismo`.

## API Contract

### POST /api/organismos/integrantes  (existente, se agrega validación)
Body `MiembroOrganismoInput`: `{ contactoId, organismoId?, cargo?, fechaFin?, partidoSectorId?, posicionOrganismo?, orden?, orden2?, nota?, condicion?, fechaDesignacion?, activo }`.
- **201**: ficha creada (activa).
- **409** `{ message }`: el contacto ya tiene una ficha activa.

### DELETE /api/integrantes-organismo/{id}  ("Finalizar")
- **204**: setea `FechaFin=hoy` (si null) + `Activo=false`.

### GET /api/contactos/{id}/integrantes-organismo
- **200**: todas las fichas del contacto (activas y finalizadas), cada una con `activo` y `fechaFin`.

## Data Model & Storage

`MiembroOrganismo`: `Activo` (bool, default true), `FechaFin` (DateTime?). Sin migración.
- **Ficha activa** = `Activo == true`. Regla de unicidad: a lo sumo una activa por `ContactoId`.

## External Integrations

Catálogos para el form de alta (existentes): `GET /api/organismos` (organismos) y `GET /api/catalogos/partido-sectores`.

## Error Handling

| Code | Error | Description |
|------|-------|-------------|
| 409 | YA_ACTIVA | El contacto ya tiene un integrante de organismo activo |
| 404 | NOT_FOUND | Ficha inexistente al finalizar |

## Non-Functional Requirements

- Security: alta y finalización requieren rol `AdminSecciones` (como hoy en ambos controllers).
- Tests (production):
  - Backend: 409 al crear con activa existente; alta OK sin activa; Finalizar setea FechaFin+Activo=false; GET devuelve todas con `activo`.
  - Frontend: gate del botón "Nuevo" (deshab. con activa), botón "Agregar" vs "Int. Organismo", envío del alta, "Finalizar" solo en activas.

## Implementation Notes

- El form de alta: **Organismo requerido**; resto opcional (cargo, sector, posición, orden, condición, fecha designación, nota). `activo=true`, `fechaFin=null` los fija el back.
- El error 409 se muestra vía el toast global (feature 021) — el alta no necesita opt-out.
- "Nuevo" y "Agregar" llevan a la **misma** pantalla de alta (contactoId en la ruta).
