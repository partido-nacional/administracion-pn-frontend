# Functional Specification: Referencias partidarias desde integrantes finalizados

**Status**: Approved (2026-10-03) · **Created**: 2026-10-03 · **Espejo**: backend `038-referencias-desde-integrantes`

## Problem Statement
Una referencia partidaria es el historial de un cargo partidario. Desde la feature 031, finalizar un integrante
de un organismo partidario crea su referencia. Pero los integrantes que ya estaban inactivos (los 48.848 que vienen
del sistema viejo, y los que se pasan a inactivo editando la ficha) **no tienen referencia**, así que ese historial no
aparece en las vistas de referencias.

## Objectives
- [ ] Las referencias de un organismo y las de un contacto muestran, además de las guardadas, los integrantes inactivos
      sin referencia correspondiente.
- [ ] No se guarda nada: es una vista calculada, de solo lectura (decisión del usuario).

## Business Rules
- BR-1: **Integrante sin referencia** = `MiembroOrganismo.Activo = false` **y** el organismo es **partidario**
  (`OrganizacionPartidariaId` no nulo) **y** no existe un `ReferentePartidario` con el mismo `ContactoId` **y** el mismo
  `OrganismoId`.
- BR-2: Se muestra como una fila de referencia con: Rol = `PosicionOrganismo`, Fecha de designación = la del
  integrante, Fecha de cese = `FechaFin` (vacía en los del viejo), Período / Art. 44 / Notas vacíos, organismo = el del
  integrante. Lleva la marca de origen **"Desde integrante"**.
- BR-3: Cada integrante inactivo es una fila (un contacto pudo tener varios períodos en el mismo organismo).
- BR-4: En cuanto exista una referencia para ese contacto + organismo, las filas calculadas de ese par dejan de mostrarse.

## User Stories / Acceptance Criteria
- AC-1: `Referencias de un organismo` (botón del organismo) lista las referencias guardadas **y** las calculadas de
  ese organismo, juntas, ordenadas por apellido del contacto.
- AC-2: `Referencias de un contacto` (ficha del contacto) lista las guardadas **y** las calculadas de ese contacto.
- AC-3: Las filas calculadas se distinguen visualmente ("Desde integrante") y **no tienen botón de editar**.
- AC-4: En la Agenda, "Ver referencias partidarias" aparece también para los contactos que solo tienen
  referencias calculadas (hoy 457).
- AC-5: Integrantes inactivos de organismos estatales o sin clasificación **no** aparecen (decisión del usuario).

## Out of Scope
- Crear o editar referencias a partir de las filas calculadas (son de solo lectura).
- La grilla general `GET /organismos/referencias` (no tiene pantalla desde la feature 028).
- Emparejar con referencias sin organismo (el cargo está en texto libre, no hay coincidencia confiable).

## Edge Cases
- EC-1: Organismo con miles de integrantes inactivos (ej. Convención Nacional): la lista los incluye todos.
- EC-2: Integrante inactivo cuyo organismo deja de ser partidario: deja de aparecer.
