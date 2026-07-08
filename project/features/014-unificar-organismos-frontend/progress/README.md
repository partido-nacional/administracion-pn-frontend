# Feature 014 — Unificar Organismos (frontend)

Adaptación del frontend al contrato unificado de Organismos (backend feature 006).

## Qué se construyó

- **Modelos** (`core/models/organismos.ts`): `OrganismoDto` con `ambito` + `tipoOrganizacionId`
  (funde el viejo `OrganismoTodosDto`); `OrganismoInput` (alta, con `ambito`) + `OrganismoUpdateInput`
  (edición, sin `ambito`); `TipoOrganizacionDto`; `InfoOrganizacion` con FK única `organismoId`.
- **Service** (`core/services/organismos.service.ts`): `getOrganismos(ambito?)` sobre `GET /organismos`;
  `getIntegrantes(id)` sobre `/organismos/{id}/integrantes`; `createOrganismo` (ámbito en body) /
  `updateOrganismo(id, ...)` (sin ámbito); Info con `organismoId`.
- **OrganismosComponent**: grilla unificada (badge + filtro de ámbito) con integrantes inline por id;
  tab Info con columna/campo único `organismoId`; modales y CSV al contrato nuevo.
- **Contacto / Agenda**: se quitaron `telefono2` y `telefonoTrabajo2` de la interface y de la UI
  (alta, detalle, duplicados); `localidad` → `ciudad` con label visible **"Ciudad"**.

## Sin cambios (a propósito)

- `integrantes-contacto.component.ts` y el DTO `IntegranteOrganismo`: el backend preservó su shape.
- `fichas-agrupacion` (`telefono2` de FichaAgrupacion, otra entidad).

## Verificación

- `npm run build -- --configuration production` sin errores.
- `npm test --watch=false --browsers=ChromeHeadless`: **138 tests** verdes (specs de organismos
  service + component adaptados al contrato nuevo).

## Nota

El CLAUDE.md dice "no hay tests todavía (DEBT-001)", pero el repo **sí** tiene karma/jasmine y 138
tests. Conviene actualizar esa sección del CLAUDE.md (fuera del alcance de esta feature).
