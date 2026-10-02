# Functional Specification: Corregir modelo de organismos (espejo)

**Status**: Approved (2026-10-02)
**Created**: 2026-10-02
**Espejo**: backend `035-corregir-modelo-organismos` (spec funcional aprobada allá; esta feature adapta la UI)

## Problem Statement

El backend dejó de partir en dos a los organismos que son estatales **y** partidarios (ej. AFE). Ahora hay un
organismo por cada uno del sistema viejo, con dos clasificaciones opcionales y no excluyentes
(organización estatal / organización partidaria) y una info de organización compartida. Sale `ambito`.
La vista Organismos del front todavía muestra, filtra y edita por `ambito`, y la info de organización
todavía tiene un "Organismo ID" que dejó de existir.

## Objectives

- [ ] La grilla muestra las clasificaciones del organismo (estatal y/o partidaria) en lugar del ámbito.
- [ ] El filtro Estatal / Partidario sigue funcionando (un organismo con ambas aparece en los dos).
- [ ] El formulario de organismo permite elegir organización estatal, partidaria e info; el tipo es opcional.
- [ ] La info de organización ya no muestra ni pide "Organismo ID".

## Out of Scope

- Cambios en otras vistas (listados, contactos, referencias): su contrato no cambió.
- CRUD de los catálogos de organizaciones (son de solo lectura en el backend).

## User Stories

### US-1: Ver la clasificación de cada organismo
**As a** usuario de Organismos **I want to** ver si un organismo es estatal, partidario o ambos **So that** no
aparezcan organismos duplicados.

- AC-1: La columna "Clasificación" muestra un badge con el nombre de la organización estatal y/o otro con la
  partidaria (ej. AFE: "Entes Autónomos" + "Agrupación de Gobierno"); sin ninguna → "—".
- AC-2: El filtro de la columna (Todos / Estatal / Partidario) manda `?ambito=` como hoy.
- AC-3: La columna no es ordenable (el backend ya no ordena por ámbito).
- AC-4: El CSV exporta "Org. estatal" y "Org. partidaria" en lugar de "Ámbito".

### US-2: Editar la clasificación
**As a** usuario **I want to** asignar organización estatal, partidaria e info a un organismo **So that** el
dato quede como en el sistema viejo.

- AC-5: El formulario tiene selects "Organización estatal" y "Organización partidaria" (con "— Ninguna —"),
  cargados de los catálogos del backend, editables también al editar.
- AC-6: "Info de organización (Id)" es un campo numérico opcional.
- AC-7: El tipo de organización es opcional (no bloquea el guardado).

### US-3: Info de organización sin organismo
- AC-8: La grilla, el formulario y el CSV de Info ya no tienen "Id Organismo".

## Business Rules

- BR-1: El payload de alta y de edición es el mismo (`OrganismoInput`, sin `ambito`).

## Edge Cases

- EC-1: Organismo sin clasificación: badge "—", editable igual.
- EC-2: Error del backend (FK inexistente → 400): se muestra en el modal como hoy.
