# Functional Specification: Organismos — Integrantes Inline

**Status**: Draft
**Created**: 2026-07-07

## Problem Statement

> En Organismos, movamos la sección integrantes. Que no sea una pestaña aparte, sino que al desplegar un Organismo, se muestren todos los integrantes de ese organismo.

Hoy la vista **Organismos** tiene una pestaña **"Integrantes"** que carga `GET /organismos/integrantes`: una **lista plana de TODOS los integrantes** de todos los organismos, donde el organismo se identifica por un **nombre (string)**, no por su id. Esto obliga al usuario a buscar/filtrar en una tabla global para encontrar quiénes integran un organismo puntual, y desconecta la información del organismo al que pertenece.

La propuesta es **contextualizar** los integrantes: al **desplegar (expandir) una fila** en la pestaña **"Todos los Organismos"**, se muestran inline los integrantes **de ese** organismo. La pestaña "Integrantes" separada se elimina.

## Objectives

- [ ] Eliminar la pestaña **"Integrantes"** de la vista Organismos.
- [ ] Hacer que cada fila de **"Todos los Organismos"** sea **expandible**; al expandir, se muestran los integrantes de ese organismo en una grilla anidada.
- [ ] Cargar los integrantes de un organismo **por su id** (contrato robusto por FK, no por nombre), vía un nuevo endpoint backend (ítem espejo cross-repo).
- [ ] Cargar los integrantes **on-demand** (al expandir) y cachearlos para no re-pedirlos al re-expandir.
- [ ] Mantener estados claros de **loading / vacío / error** por cada organismo expandido.

## Out of Scope

- La pestaña **"Ref. Partidarias"** (referencias) — se deja **tal cual** (sigue siendo tab aparte).
- Las pestañas **"Info de la Organización"** y el alta/edición de Organismos e Info — sin cambios.
- **Alta / edición / eliminación** de integrantes desde esta vista (sigue siendo **solo lectura**; el CRUD de integrantes vive en la ficha de contacto de Agenda).
- La **exportación CSV global** de integrantes (desaparece junto con la pestaña; no se reemplaza por un CSV per-organismo en esta feature).
- Migrar el componente a la estructura objetivo (`core/services`, `core/models`) más allá de lo que exija este cambio — DEBT-006/009 se mantienen como deuda.

## User Stories

### US-1: Ver integrantes de un organismo al desplegarlo
**As a** administrador partidario
**I want to** hacer clic en una fila de "Todos los Organismos" y ver desplegados los integrantes de ese organismo
**So that** entiendo quién compone cada organismo sin ir a una tabla global separada

#### Acceptance Criteria
- AC-1: En la pestaña "Todos los Organismos", cada fila de organismo es clickeable e indica visualmente que es expandible (cursor/hover y un indicador de estado abierto/cerrado).
- AC-2: Al hacer clic en una fila cerrada, se expande una fila-detalle debajo que muestra los integrantes de **ese** organismo (matcheados por id, no por nombre).
- AC-3: Al hacer clic nuevamente en una fila expandida, ésta se colapsa.
- AC-4: Al expandir una fila mientras hay otra ya expandida, la anterior se colapsa (comportamiento acordeón: una sola fila abierta a la vez).
- AC-5: La grilla anidada muestra por integrante: **Cred. Cívica, Apellidos, Nombres, Celular, Mail, Posición, Depto.** (se omite la columna "Organismo" por ser redundante en este contexto).

### US-2: Estados de carga, vacío y error por organismo
**As a** administrador partidario
**I want to** ver feedback claro mientras cargan / cuando no hay integrantes / cuando falla la carga
**So that** distingo "sin integrantes" de "todavía cargando" o "hubo un error"

#### Acceptance Criteria
- AC-6: Al expandir por primera vez, se pide la lista al backend y se muestra un indicador de **cargando** hasta recibir la respuesta.
- AC-7: Si el organismo no tiene integrantes, se muestra un **estado vacío** ("Este organismo no tiene integrantes").
- AC-8: Si la petición falla, se muestra un mensaje de **error** dentro de la fila-detalle, con posibilidad de reintentar.
- AC-9: Una vez cargados, los integrantes de un organismo se **cachean**: colapsar y volver a expandir **no** dispara una nueva petición.

### US-3: Eliminación de la pestaña Integrantes
**As a** administrador partidario
**I want to** que la barra de pestañas ya no muestre "Integrantes"
**So that** la única forma de ver integrantes sea contextual (por organismo), sin una tabla global duplicada

#### Acceptance Criteria
- AC-10: La pestaña **"Integrantes"** ya no aparece en la barra de pestañas de Organismos.
- AC-11: Las pestañas restantes ("Todos los Organismos", "Info de la Organización", "Ref. Partidarias") siguen funcionando igual que antes.
- AC-12: El botón/acción de exportar CSV de integrantes global se elimina; el CSV de las demás pestañas sigue disponible.

## Business Rules

- BR-1: Los integrantes de un organismo se obtienen **por id + ámbito** del organismo (estatal|partidario), no por coincidencia de nombre.
- BR-2: La vista es **solo lectura**: no se crean, editan ni eliminan integrantes desde acá.
- BR-3: El ámbito del organismo (Estatal|Partidario) determina la ruta del recurso, igual que en las operaciones existentes de Organismos (`estatales` | `partidarios`).

## Edge Cases

- EC-1: Organismo sin integrantes → estado vacío (AC-7), no error.
- EC-2: Falla de red / 5xx al pedir integrantes → estado de error con reintento (AC-8); no rompe el resto de la tabla.
- EC-3: Usuario expande y colapsa rápidamente / expande varios en secuencia → solo una fila abierta a la vez (AC-4); una petición en vuelo no debe pintar resultados sobre otro organismo.
- EC-4: Filtros de la tabla "Todos" activos + fila expandida → si un filtro oculta la fila expandida, su detalle también se oculta (el estado de expandido se asocia al organismo, no a la posición).
- EC-5: Organismos estatal y partidario con el **mismo nombre** → deben resolver integrantes distintos (garantizado por BR-1, id+ámbito).

## Success Metrics

- El usuario puede ver los integrantes de un organismo en ≤ 2 clics (abrir vista → expandir organismo), sin filtrar una tabla global.
- Cero dependencia de matcheo por nombre para asociar integrantes ↔ organismo.

## Feature Dependencies

- **Backend (cross-repo, ítem espejo en `administracion-pn-backend`)**: nuevo endpoint `GET /organismos/{estatales|partidarios}/{id}/integrantes` que devuelve los integrantes de ese organismo con el shape ya usado en la grilla actual (Cred. Cívica, Apellidos, Nombres, Celular, Mail, Posición, Depto.). Sin este endpoint, la feature cae en el matcheo frágil por nombre (opción descartada).
- Contrato **PartidoSector (FK)** ya adoptado en integrantes de contacto (commit `258d081`) — referencia de shape, no bloqueante para la grilla simple.
