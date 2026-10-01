# Functional Specification: Normalizar departamentos

**Status**: Draft
**Created**: 2026-09-30
**Espejo**: backend `034-normalizar-departamentos` (mismo spec funcional)
**Origen**: backlog DEBT-023, DEBT-024 (backend) · DEBT-015, DEBT-016 (frontend)

## Problem Statement

La feature 033/030 hizo que los filtros de departamento funcionen aunque el dato esté sucio. **El dato sigue sucio**, y se sigue ensuciando:

- **Datos existentes** (semilla, reflejo de prod):
  - Contactos: 20.976 en MAYÚSCULAS (`PAYSANDÚ`).
  - Organismos: 459 en MAYÚSCULAS y 5 con `Seleccione`.
  - Adhesiones web: 741 en MAYÚSCULAS.
  - Agrupaciones: 269 con nombre en MAYÚSCULAS. Además hay 2.023 con letra de serie, que se dejan como están.
  - Las grillas muestran `PAYSANDÚ`, `Paysandu` o `Paysandú` según el origen.
- **Escrituras nuevas** que vuelven a ensuciar:
  - El alta de contacto guarda sin tilde (`Paysandu`, `Rio Negro`): DEBT-015.
  - La sincronización web guarda en MAYÚSCULAS.
  - Varios formularios tienen su propia copia de la lista: DEBT-015.
- **Bug** (DEBT-016): al pasar un contacto a ficha de adhesión, el departamento queda vacío si el contacto lo tiene en MAYÚSCULAS. Pasa con la mayoría de los migrados.
- **Docs** (DEBT-024): las specs vivas de listados describen un sistema viejo ("sin filtros", "sin paginación").

## Objectives

- [ ] Toda columna de departamento principal queda en forma canónica ("Paysandú") y se mantiene así ante cualquier escritura nueva.
- [ ] Los formularios ofrecen la lista canónica única.
- [ ] Pasar contacto a ficha precarga el departamento siempre que el contacto lo tenga.
- [ ] La spec viva de listados describe el sistema actual.

## Out of Scope

- **Letras de serie de `Agrupacion.Depto`** (`C`, `X`…): quedan como están (decisión del usuario). El filtro ya las mapea (feature 033).
- `Contacto.DepartamentoLaboral` (letras, typos, ciudades): queda como está.
- Valores no uruguayos (`ARGENTINA`, `URUGUAY`): se conservan.
- Tabla legada `Convencionales` (códigos `MON`, `CAN`…): no la usa ningún endpoint.
- Mostrar el nombre en lugar de la letra en la grilla de agrupaciones.

## User Stories

### US-1: Datos existentes en forma canónica
**As a** operador
**I want to** ver el departamento escrito siempre igual
**So that** las grillas, los CSV y las impresiones sean prolijos y consistentes

#### Acceptance Criteria
- AC-1: Después del deploy, en `Contactos.Departamento`, `Contactos.DepartamentoCredencial`, `Organismos.Departamento`, `AdhesionesWeb.Departamento`, `FichasAgrupacion.Departamento` y `Agrupaciones.Depto`, todo valor que se reconoce como departamento queda canónico: `PAYSANDÚ` / `Paysandu` / ` paysandú ` → `Paysandú`; `NACIONAL` → `Nacional`.
- AC-2: Los valores basura (`Seleccione`, vacío o solo espacios) quedan **vacíos** (NULL).
- AC-3: Las letras de serie (`C`), los valores no uruguayos (`ARGENTINA`) y todo lo que no se reconoce **no cambian**.
- AC-4: La limpieza se puede correr dos veces sin cambiar nada la segunda (idempotente).

### US-2: Las escrituras nuevas no vuelven a ensuciar
**As a** responsable de los datos
**I want to** que cualquier alta o edición guarde el departamento canónico
**So that** la limpieza no se pierda con el tiempo

#### Acceptance Criteria
- AC-5: Altas y ediciones de contactos, organismos, adhesiones (web sync y pasar a local), fichas web y agrupaciones guardan el departamento canónico, venga de donde venga (formulario, sincronización web o API).
- AC-6: Los formularios del front ofrecen la lista canónica (`DEPARTAMENTOS`, más 'Nacional' donde aplica). Ninguno tiene una copia propia.
- AC-7: El alta de contacto deriva el "Departamento credencial" de la letra de la credencial con el nombre canónico ("Paysandú", no "Paysandu").

### US-3: Pasar contacto a ficha precarga el departamento
**As a** operador
**I want to** que la ficha de adhesión traiga el departamento del contacto
**So that** no tenga que volver a elegirlo

#### Acceptance Criteria
- AC-8: Si el contacto tiene `PAYSANDÚ`, `Paysandu` o `Paysandú`, la ficha nueva precarga "Paysandú" en el departamento de la agrupación.
- AC-9: Si el contacto no tiene departamento, o tiene uno no reconocible, el campo queda vacío para elegirlo (como hoy).

### US-4: Spec viva de listados actualizada
#### Acceptance Criteria
- AC-10: `project/specs/features/listados.md` (backend y frontend) describe los endpoints/grillas actuales: población, filtros, orden, paginado, export. Los anexos "Actualización feature NNN" se integran al cuerpo.

## Business Rules

- BR-1: **Canónico** = uno de los 19 departamentos en Title Case con tildes (`Artigas` … `Treinta y Tres`) o `Nacional`. Reconocimiento por `norm(trim(valor))` (minúsculas, sin tildes, la ñ preservada).
- BR-2: **Basura** = vacío, solo espacios o `Seleccione` (sin importar mayúsculas) → NULL.
- BR-3: Cualquier otro valor (letras de serie, otros países, typos) se conserva tal cual.
- BR-4: La misma regla aplica a la limpieza inicial y a cada escritura nueva.

## Edge Cases

- EC-1: `Agrupacion.Depto = "CANELONES"` → `Canelones`; `Agrupacion.Depto = "C"` → sin cambios.
- EC-2: `"CERRO  LARGO"` (doble espacio): no se reconoce → sin cambios. *(Solo aparece en DepartamentoLaboral, que está fuera de alcance.)*
- EC-3: Una adhesión web que llega de la sincronización como `RIVERA` se guarda `Rivera`.
- EC-4: Deploy con la migración ya aplicada (reinicio): no hace nada.

## Success Metrics

- 0 valores en MAYÚSCULAS o sin tilde en las columnas principales después del deploy (consulta de verificación).
- 0 fichas nuevas sin departamento cuando el contacto lo tiene.

## Feature Dependencies

- Función SQL `norm()` (feature 027) y `DepartamentosCredencial` (feature 033).
- **Backup**: branch o snapshot de Neon **antes** del release (la migración toca datos de prod).
