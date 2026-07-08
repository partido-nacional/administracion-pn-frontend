# Technical Specification: unificar-organismos-frontend

**Status**: Draft
**Created**: 2026-07-08

## Architecture Overview

Cambio de capa de consumo (models + service) + ajuste de los componentes que lo usan. Se respeta la
estructura ya existente (`core/models`, `core/services`, `features/*`) que Organismos ya usa. No se
introducen nuevos patrones. Enfoque: **cambio mínimo** para alinear el contrato.

## API Contract (backend feature 006, ya desplegado)

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/organismos?ambito=Estatal\|Partidario` | Lista `OrganismoDto` (incluye `ambito`); sin `?ambito` = todos |
| POST | `/organismos` | body con `ambito` + `tipoOrganizacionId` |
| PUT | `/organismos/{id}` | body **sin** `ambito` (inmutable) |
| GET | `/organismos/{id}/integrantes` | grilla joineada; sin ámbito en la ruta |
| GET | `/organismos/tipos` | `TipoOrganizacionDto[]` |
| GET/POST/PUT | `/organismos/info` | `InfoOrganizacion` con `organismoId` + `tipoOrganizacionId` |

`OrganismoDto`:
```json
{ "id": 1, "ambito": "Estatal", "nombre": "...", "nombreCompania": null,
  "tipoOrganizacionId": 2, "categoria": null, "descripcion": null, "direccion": null,
  "ciudad": null, "departamento": null, "pais": null, "art44": false, "ordenDpto": 0,
  "observaciones": null }
```

## Data Model & Storage (frontend)

### `core/models/organismos.ts`
- `OrganismoDto`: `tipoOrganismoId` → `tipoOrganizacionId`; **agregar** `ambito: Ambito`. Elimina `OrganismoTodosDto` (se funde en `OrganismoDto`, que ahora trae ámbito).
- `OrganismoInput` (POST): `tipoOrganismoId` → `tipoOrganizacionId`; **agregar** `ambito: Ambito`.
- `OrganismoUpdateInput` (PUT): **nuevo**, igual a `OrganismoInput` pero **sin** `ambito`.
- `TipoOrganismoDto` → `TipoOrganizacionDto`.
- `InfoOrganizacionDto` / `InfoOrganizacionInput`: `tipoOrganismoId`→`tipoOrganizacionId`; `organismoEstatalId`/`organismoPartidarioId` → único `organismoId?`.
- `IntegranteOrg`: sin cambios (shape preservado por el backend).

### `core/services/organismos.service.ts`
- Quitar `ambitoPath`.
- `getTodos()` → `getOrganismos(ambito?: Ambito)` → `GET /organismos` (+ `params {ambito}` si viene).
- `getTipos(): TipoOrganizacionDto[]`.
- `getIntegrantes(ambito, id)` → `getIntegrantes(id)` → `GET /organismos/{id}/integrantes`.
- `createOrganismo(input: OrganismoInput)` → `POST /organismos` (ámbito va en el body).
- `updateOrganismo(id, input: OrganismoUpdateInput)` → `PUT /organismos/{id}`.
- `createInfo/updateInfo`: input con `organismoId`.

## Componentes a ajustar

### `features/organismos/organismos.component.ts`
- Tipos: `OrganismoTodosDto` → `OrganismoDto`; `TipoOrganismoDto` → `TipoOrganizacionDto`.
- Carga: `getTodos()` → `getOrganismos()`.
- `tipoOrganismoId` → `tipoOrganizacionId` (signal `tipos`, form, template select, CSV, `guardarOrganismo`).
- `orgKey(o)` → `String(o.id)` (id global); `loadIntegrantes` usa `getIntegrantes(o.id)`.
- `guardarOrganismo`: alta arma `OrganismoInput` con `ambito`; edición arma `OrganismoUpdateInput` (sin ámbito) y llama `updateOrganismo(id, input)`.
- Tab Info: columnas "Id Org. Est."/"Id Org. Part." → una sola "Id Organismo" (`organismoId`); `tipoOrganismoId`→`tipoOrganizacionId`. Modal Info: dos inputs de id → uno `organismoId`. CSV Info idem.
- Tab Referencias: sin cambios.

### `features/agenda/contactos.service.ts`
- Interface `Contacto`: quitar `telefono2`, `telefonoTrabajo2`; `localidad` → `ciudad`.

### `features/agenda/agenda-nuevo.component.ts`
- Quitar el input de `telefono2` (línea ~97) y el de `telefonoTrabajo2` (~155).
- Renombrar el binding `c.localidad` → `c.ciudad` y el label a **"Ciudad"** (~135).

### `features/agenda/agenda-listado.component.ts`
- Quitar filas de detalle "Teléfono 2" personal (~150) y laboral (~174).
- `detalle()!.localidad` → `.ciudad`, label **"Ciudad"** (~161).

### `features/agenda/duplicados-contactos.component.ts`
- Quitar entradas `telefono2` (~26) y `telefonoTrabajo2` (~38) de la lista de campos/matches.
- `localidad` → `ciudad`, label **"Ciudad"** (~31).

## Error Handling

| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_INPUT | ámbito inválido / FK inexistente → se muestra `error.message` en el modal |
| 500 | INTERNAL_ERROR | mensaje genérico de fallback |

## Non-Functional Requirements

- **Verificación**: dos gates:
  1. `npm run build -- --configuration production` sin errores de tipos.
  2. `npm test -- --watch=false --browsers=ChromeHeadless` — el repo **sí tiene karma/jasmine y specs**
     (corrección: el CLAUDE.md decía "no hay tests todavía", pero existen 138 tests, incluidos
     `organismos.service.spec.ts` y `organismos.component.spec.ts`). Ambos specs se adaptan al contrato nuevo.
- **Performance**: sin cambios de patrón; misma carga lazy con caché de integrantes.
- **Security**: sin cambios de auth; se respetan los `rolesGuard` existentes de la ruta.
