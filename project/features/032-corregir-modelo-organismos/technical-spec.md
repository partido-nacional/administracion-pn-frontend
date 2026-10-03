# Technical Specification: Corregir modelo de organismos (espejo)

**Version**: 1.0
**Status**: Approved (2026-10-02)
**Created**: 2026-10-02

## Architecture Overview

Cambio de contrato acotado a la vista Organismos. Se siguen los patrones actuales (servicio
`OrganismosService`, modelos en `core/models/organismos.ts`, componente standalone con signals).

## API Contract (backend 035)

- `OrganismoDto`: sale `ambito`; entran `organizacionEstatalId`, `organizacionEstatalNombre`,
  `organizacionPartidariaId`, `organizacionPartidariaNombre`, `infoOrganizacionId`; `tipoOrganizacionId`
  puede ser `null`.
- `OrganismoInput` (POST y PUT): sin `ambito`; con `tipoOrganizacionId?`, `organizacionEstatalId?`,
  `organizacionPartidariaId?`, `infoOrganizacionId?`. Desaparece `OrganismoUpdateInput`.
- `GET /organismos/organizaciones-estatales` y `/organizaciones-partidarias` → `{ id, tipoOrganizacionId, nombre }[]`.
- `InfoOrganizacionDto` / `InfoOrganizacionInput`: sale `organismoId`.
- `GET /organismos?ambito=Estatal|Partidario`: mismo parámetro, semántica "tiene esa organización".

## Cambios

| Archivo | Cambio |
|---|---|
| `core/models/organismos.ts` | modelos de arriba + `OrganizacionDto`; `Ambito` queda solo como tipo del filtro |
| `core/services/organismos.service.ts` | `getOrganizacionesEstatales()`, `getOrganizacionesPartidarias()`; `updateOrganismo(id, OrganismoInput)` |
| `features/organismos/organismos.component.ts` | columna Clasificación, form con selects + info, tipo opcional, Info sin organismo, CSV |
| specs (`*.spec.ts`) | adaptar a contrato nuevo + casos nuevos (ambas clasificaciones, catálogos) |

## Testing

`ng test` (Karma, ChromeHeadless) y `ng build`.
