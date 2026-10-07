# Functional Specification: Sincronizar fichas de agrupación desde la web

**Status**: Approved (2026-10-06) · **Created**: 2026-10-06 · **Espejo**: frontend `039-sync-agrupaciones-web`
**Fuente**: "API Agrupaciones Partido Nacional" (DesarrolloDelSur), endpoint `api_solicitudes`

## Problem Statement
La web del Partido ya permite solicitar la creación de agrupaciones online. En Administración PN, el botón
**"↻ Sincronizar"** de Fichas de Agrupación no trae nada real: **inserta una ficha inventada** (plantillas de prueba)
cada vez que se lo toca. Hay que traer las solicitudes reales de la web, igual que ya se hace con las adhesiones web.

## Objectives
- [ ] El botón trae las solicitudes de agrupación de la web que **todavía no se trajeron**, como fichas pendientes.
- [ ] La sincronización también corre sola cada 60 minutos (configurable), como la de adhesiones.
- [ ] Se eliminan las fichas inventadas que dejó el botón actual.

## Out of Scope
- Columnas nuevas en la ficha para los campos de la web que hoy no existen (clasificación, qué se solicita,
  delegado, sublema renunciado, observaciones, estado web, flags de integrantes). Decisión del usuario: solo se
  mapea a lo que ya existe.
- Actualizar fichas ya traídas si cambian en la web (la API filtra por fecha de creación; no reporta cambios).
- Escribir en la web (la API es de solo lectura).

## Business Rules
- BR-1 **Incremental**: se pide `desde` = la mayor `ag_fecha_creacion` ya traída; la primera vez, `2020-01-01 00:00:00`
  (histórico completo, como recomienda el documento). La hora es de Uruguay.
- BR-2 **Sin duplicados**: cada solicitud se identifica por `ag_id`; una ya traída no se vuelve a crear nunca, aunque
  la ficha se haya editado, eliminado o promovido (el filtro de la API es inclusivo y repite la última).
- BR-3 **Mapeo** (solo columnas existentes):
  | Ficha | Web |
  |---|---|
  | Nombre de la agrupación | `ag_nombre` |
  | Tipo | `ag_tipo` |
  | Departamento | `ag_departamento` (se guarda en forma canónica, como todo departamento) |
  | Domicilio legal / Ciudad | `ag_domicilio` / `ag_ciudad` |
  | Teléfono 1 / Mail | `ag_telefono` / `ag_email` |
  | Forma de representación | `ag_formarep` |
  | Fecha de solicitud | `ag_fecha_solicitud` |
  | Responsable (nombre, apellido, CI) | el integrante con `ai_representante = 1` (si hay más de uno, el de menor orden) |
  | Sublemas 1..5 | los primeros 5 de `sublemas` (en orden) |
  | Autoridades | `integrantes`: nombres, apellidos, CI, cargo → rol, orden |
  | Estado | `Pendiente` |
  | Fecha de creado | `ag_fecha_creacion` |
- BR-4 Las autoridades se validan contra la agenda y las adhesiones como cualquier ficha (comportamiento existente).

## Acceptance Criteria
- AC-1: Tocar "↻ Sincronizar" trae las solicitudes nuevas y muestra un aviso: "N fichas nuevas" (o "No hay fichas
  nuevas"), y la grilla se recarga.
- AC-2: Tocarlo dos veces seguidas no duplica fichas.
- AC-3: Si la web responde con error (clave inválida 401, IP no habilitada 403, caída 5xx) o no hay clave configurada,
  se muestra un mensaje claro y no se crea nada.
- AC-4: La sincronización automática corre cada 60 minutos si hay clave; manual y automática nunca corren a la vez.
- AC-5: Las fichas inventadas (nombres de las plantillas de prueba **y** autoridades con las CI inventadas) se
  eliminan, salvo que alguna se haya promovido a agrupación.

## Edge Cases
- EC-1: Solicitud sin integrantes → ficha sin autoridades y sin responsable.
- EC-2: Más de 5 sublemas → se guardan los primeros 5.
- EC-3: Campos vacíos (`""` o `null`) → vacíos en la ficha; numéricos que llegan como texto se convierten.
- EC-4: `ag_fecha_solicitud` vacía o inválida → se usa la fecha de creación.

## Feature Dependencies
- Clave de API en la variable **`AGRUPACIONES_EXTERNAS__APIKEY`** (Render y `.env` local).
- La IP de salida de Render debe estar habilitada del lado de la web (si no, 403).
