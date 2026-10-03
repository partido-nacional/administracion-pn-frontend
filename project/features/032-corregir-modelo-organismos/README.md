# Feature 032 — Corregir modelo de organismos (espejo)

**Estado**: Completada · **Fecha**: 2026-10-02 · **Rama**: `feature/corregir-modelo-organismos`
**Espejo**: backend `035-corregir-modelo-organismos` (se mergean juntas: cambia el contrato)

## Qué se hizo

- **Modelos/servicio**:
  - `OrganismoDto` sin `ambito`, con `organizacionEstatalId/Nombre`, `organizacionPartidariaId/Nombre`, `infoOrganizacionId`; tipo opcional.
  - Un solo `OrganismoInput` para alta y edición.
  - `getOrganizacionesEstatales()` / `getOrganizacionesPartidarias()`.
  - Info sin `organismoId`.
- **Vista Organismos**:
  - Columna **Clasificación** con un badge por organización (AFE muestra los dos). Sin ninguna, muestra "—".
  - Filtro Estatal/Partidario igual que antes (`?ambito=`).
  - Formulario con selects de organización estatal y partidaria, "Info de organización (Id)" y tipo opcional.
  - CSV con "Org. estatal" / "Org. partidaria".
  - Info de organización sin "Id Organismo".
- **Spec viva**: sección "Actualización feature 032" en `organismos.md`. La reescritura completa quedó en DEBT-017.

## Validación

- 278 tests (Karma) en verde. Nuevos:
  - columna Clasificación (ambas / ninguna);
  - catálogos;
  - payload sin ámbito con clasificaciones e info;
  - tipo opcional;
  - filtro `?ambito`;
  - info sin `organismoId`.
- `ng build` OK.
