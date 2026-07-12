# Feature 022 — Contactos: alta de integrante de organismo

Cross-repo (frontend + backend). Sin cambios de schema.

## Qué se construyó

**Backend** (`administracion-pn-backend`):
- `POST /organismos/integrantes`: **409** si el contacto ya tiene una ficha activa; el alta fuerza `Activo=true`/`FechaFin=null`.
- **Finalizar** (`DELETE /integrantes-organismo/{id}` y `/organismos/integrantes/{id}`): setea `FechaFin=hoy` (si null) + `Activo=false`.
- `GET /contactos/{id}/integrantes-organismo`: devuelve **todas** las fichas (no solo activas) y expone `activo` en el DTO.
- `ContactosController.List`: `tieneIntegranteOrganismo = Any()` (≥1 ficha, activa o no).

**Frontend** (`administracion-pn-frontend`):
- Grilla de contactos: contacto sin fichas → botón **"Agregar integrante organismo"** (→ pantalla de alta); con fichas → "Int. Organismo" (grilla).
- Nueva pantalla `IntegranteOrganismoNuevoComponent` (ruta `/agenda/:contactoId/organismos/nuevo`): form (Organismo requerido + sector/cargo/posición/orden/condición/fecha designación/nota) → POST; el 409 se muestra inline y por toast.
- Grilla de integrantes: muestra **todas** las fichas con estado (Vigente/Finalizada); botón **"Nuevo integrante organismo"** arriba, **deshabilitado si hay una activa**; **"Eliminar" → "Finalizar"** (solo en filas activas).

## Regla de negocio

Un contacto tiene **a lo sumo una ficha activa** (`Activo==true`) a la vez. El gate del alta mira solo `Activo` (no la fecha). "Finalizar" cierra la ficha (fecha fin + inactiva) y habilita crear otra. Validado en UI **y** backend (409).

## Sobre "Eliminar" (pregunta original)

El botón hacía soft-delete `Activo=false` **sin** poner `FechaFin`, y el GET ocultaba las inactivas. Se renombró a **"Finalizar"**, ahora setea `FechaFin` y las finalizadas **quedan visibles** en la grilla (historial).

## Tests

- Backend: +4 (`IntegranteOrganismoAltaTests`) — 409 con activa, alta OK sin activa (nace vigente), Finalizar setea FechaFin+inactivo, GET trae todas con `activo`. Suite **172/172**.
- Frontend: +4 (`integrantes-contacto.component.spec`) — gate `hayActiva`, muestra todas, finalizar. Suite **157**.
