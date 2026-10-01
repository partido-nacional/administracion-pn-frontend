# Functional Specification: Mejoras calendario y filtros

**Status**: Draft
**Created**: 2026-09-30
**Espejo**: backend `033-mejoras-calendario-filtros` (mismo spec funcional)

## Problem Statement

Mejoras reportadas por los usuarios:

1. **Calendario**: no se puede imprimir. Se pide un botón Imprimir, por semana o mensual, "estilo listado".
2. **Departamentos**: "en todos los listados fallan los filtros de departamento o faltan departamentos en el filtro". La auditoría lo confirma:
   - Parlamentarias ofrece solo 6 departamentos.
   - Jóvenes manda el filtro pero el backend lo ignora (y no muestra la columna).
   - Intendentes PN muestra Departamento pero no tiene filtro.
   - Agrupaciones Todas / Pendientes / Fichas Web, Adhesiones web y Convencionales muestran Departamento sin poder filtrarlo.
   - Organismos y Agrupaciones por Período arman su lista por fuera de la lista canónica (la de Por Período sale de la base: mayúsculas, duplicados, "Seleccione").
3. **Agrupaciones**: no se puede filtrar por Nombre, Código ni ID en ninguna grilla salvo Por Período (que tampoco tiene ID).

## Objectives

- [ ] Imprimir el calendario visible (mes) o la semana actual como listado por día.
- [ ] Toda grilla que muestra Departamento permite filtrarlo, con los 19 departamentos, y el filtro funciona.
- [ ] Toda grilla de agrupaciones permite filtrar por Nombre, Código (Cod. Agrup.) e ID.

## Out of Scope

- Formularios de alta/edición que guardan departamentos sin tilde (alta de contacto) y el bug de `nueva-ficha` que pierde el departamento: quedan al backlog.
- Normalizar/limpiar los datos de departamento existentes en la base.
- Exportar el calendario a PDF/CSV (se usa el diálogo de impresión del navegador, que permite "Guardar como PDF").
- Vistas semanal/diaria en pantalla del calendario (solo la impresión es semanal).
- Padrón Electoral (no es una grilla de agrupaciones).

## User Stories

### US-1: Imprimir el calendario
**As a** usuario de cualquier rol
**I want to** imprimir los eventos del mes que estoy viendo o de la semana actual
**So that** tenga la agenda en papel o PDF

#### Acceptance Criteria
- AC-1: El calendario tiene un botón "🖨 Imprimir" con dos opciones: **Mes** y **Semana**.
- AC-2: **Mes** imprime todos los eventos del mes visible en pantalla.
- AC-3: **Semana** imprime los eventos de la semana actual (lunes a domingo que contiene hoy), aunque cruce de mes.
- AC-4: La impresión es un listado agrupado por día, en orden cronológico. Cada evento: Hora inicio · Hora fin (o "—") · Título · Tipo · Creador · Descripción. Encabezado: "Calendario — <período>" y fecha de impresión.
- AC-5: En el listado **semanal** aparecen los 7 días, con "(sin eventos)" en los vacíos. En el **mensual** solo aparecen los días con eventos.
- AC-6: Respeta el filtro activo (Todos / Solo privados) y la visibilidad (públicos + propios privados). Los privados se marcan con 🔒.
- AC-7: Si el período no tiene eventos, se imprime el encabezado y "Sin eventos en el período".
- AC-8: Si el navegador bloquea la ventana emergente, se avisa al usuario (mismo comportamiento que Imprimir agrupación).

### US-2: Filtrar por departamento en todas las grillas
**As a** operador
**I want to** filtrar por cualquiera de los 19 departamentos en toda grilla que muestre Departamento
**So that** pueda armar listados por departamento

#### Acceptance Criteria
- AC-9: El dropdown ofrece "Todos" + los 19 departamentos (lista canónica, con tildes) en: Parlamentarias, Jóvenes, Intendentes PN, Com. Departamentales, Intendencias Nac., Alcaldes, Agenda, Organismos (más "Nacional"), Agrupaciones Todas / Pendientes / Fichas Web / Por Período, Adhesiones web y Convencionales (3 pestañas).
- AC-10: El filtro ignora mayúsculas, tildes y espacios sobrantes: elegir "Paysandú" trae registros guardados como `PAYSANDÚ`, `Paysandu` o `paysandú `.
- AC-11: **Jóvenes** muestra la columna Departamento (del contacto) y el filtro funciona.
- AC-12: **Intendentes PN** tiene el filtro de departamento.
- AC-13: Combinado con otros filtros y paginación: el total y las páginas reflejan el filtro.

### US-3: Filtrar agrupaciones por Nombre, Código e ID
**As a** operador
**I want to** filtrar las grillas de agrupaciones por Nombre, Código e ID
**So that** encuentre una agrupación rápido

#### Acceptance Criteria
- AC-14: **Todas** y **Pendientes**: filtros de texto bajo ID, Cod. Agrup. y Nombre.
- AC-15: **Fichas Web**: filtros bajo ID y Nombre Agrupación (no tiene código).
- AC-16: **Por Período**: se agregan filtros bajo Id e Id Agr. (Nombre y Código ya existen).
- AC-17: **Nombre** y **Código**: coincidencia parcial que ignora mayúsculas y tildes ("etica" encuentra "Ética").
- AC-18: **ID**: coincidencia exacta del número. Si se escribe algo no numérico, no hay resultados (no se ignora el filtro).

## Business Rules

- BR-1: Lista canónica de departamentos: los 19 de Uruguay en Title Case con tildes (`core/departamentos.ts`). Ninguna grilla arma su propia lista.
- BR-2: Comparación de departamento = `norm(trim(valor guardado)) == norm(trim(elegido))`. `norm` baja a minúsculas y quita tildes, y preserva la ñ.
- BR-3: En los listados de organismos con fallback (Com. Departamentales, Intendencias, Alcaldes) se mantiene la regla vigente: el departamento del organismo, o el del contacto si el del organismo está vacío.
- BR-4: Semana = lunes 00:00 a domingo 23:59 (hora Uruguay) de la semana que contiene la fecha de hoy.
- BR-5: Un evento entra en el período si su **fecha de inicio** cae dentro del período (igual que la vista mensual de hoy).

## Edge Cases

- EC-1: Valores basura guardados ("Seleccione", "") no coinciden con ningún departamento. Solo aparecen con "Todos".
- EC-2: Evento que empieza en un día y termina en otro: se lista en el día de inicio, con fecha y hora de fin.
- EC-3: Semana que cruza meses (p. ej. 29/09–05/10): incluye eventos de ambos meses.
- EC-4: ID con espacios (" 12 ") → se toma 12.
- EC-5: Organismos de alcance nacional: el filtro de Organismos conserva la opción "Nacional".

## Success Metrics

- Cero reportes de "el filtro de departamento no anda" o "falta un departamento".
- El calendario se imprime sin pasos manuales (sin capturas de pantalla).

## Feature Dependencies

- Ninguna nueva. Reusa el patrón de `imprimir-agrupacion.ts` (ventana + `window.print()`) y la función `norm()` (feature 027).
