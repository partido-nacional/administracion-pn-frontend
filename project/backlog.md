# Technical Backlog

> Items captured during development. Use `/project.backlog` to manage.

**Last Updated**: 2026-06-30
**Total Items**: 23 (10 TODO, 13 DEBT, 0 IDEA)

> Origen común: ingeniería inversa a máximo detalle (reverse-eng) del frontend Angular, 2026-06-14. Cada ítem fue verificado contra el código por un agente lector. Confirmar `archivo:línea` antes de arreglar.

## 📋 TODOs

### TODO-001: Export CSV no cableado en los 10 listados
- **Priority**: High
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/listados
- **Context**: `core/exportar-csv.ts` está listo (RFC 4180, BOM UTF-8), pero los 10 componentes de `listados/` tienen botones "Exportar a Excel" **sin `(click)`** y ninguno importa `exportarCSV`. La feature prometida no funciona.
- **Affected Files**: src/app/features/listados/*.component.ts
- **Complexity**: M

### TODO-002: Manejo de errores/estados HTTP ausente en la mayoría de las vistas
- **Priority**: High
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: transversal (varias features)
- **Context**: La mayoría de los GET no manejan error/loading/vacío (dashboard, listados, agenda, adhesiones, productos parcial). Si el backend falla, la UI queda en blanco sin feedback.
- **Affected Files**: src/app/features/**/*.component.ts
- **Complexity**: L

### TODO-003: Botones y acciones sin handler (UI muerta)
- **Priority**: Medium
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: transversal
- **Context**: Numerosas acciones decorativas sin binding: "Sincronizar Nube" y "Detalle" (adhesiones), "+ Nueva Donación" (productos), "Editar" en organismos, "Filtrar"/"Generar reporte"/"Eliminar" (productos), "Exportar TSV" (convencionales), tabs "Padrón"/"Exportar" (agenda).
- **Affected Files**: src/app/features/{adhesiones,productos,organismos,convencionales,agenda}/*.component.ts
- **Complexity**: M

### TODO-004: Paginación decorativa (sin handlers, render del array completo)
- **Priority**: Medium
- **Status**: RESOLVED → `project/features/002-paginacion-ordenamiento-server-side` (2026-07-04)
- **Created**: 2026-06-14
- **Origin**: transversal
- **Context**: Los controles de paginación (`<` `1` `>`) en agenda, adhesiones, listados y productos no tienen handlers; se renderiza todo el array en memoria. No escala con volumen real (ver `docs/migracion` del backend).
- **Affected Files**: src/app/features/{agenda,adhesiones,listados,productos}/*.component.ts
- **Complexity**: L

### TODO-005: Búsqueda de contactos resuelta 100% en cliente
- **Priority**: Medium
- **Status**: RESOLVED → `project/features/002-paginacion-ordenamiento-server-side` (2026-07-04)
- **Created**: 2026-06-14
- **Origin**: feature/agenda
- **Context**: `AgendaListado` hace `GET /contactos` sin `?q=&departamento=` y filtra/ordena client-side; el backend ya soporta búsqueda server-side. No escala.
- **Affected Files**: src/app/features/agenda/agenda-listado.component.ts (~519)
- **Complexity**: M

### TODO-006: Merge de duplicados no transaccional
- **Priority**: Medium
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/agenda
- **Context**: `DuplicadosContactos` hace `DELETE` seguido de `PUT` en llamadas separadas; si el `PUT` falla, queda estado inconsistente.
- **Affected Files**: src/app/features/agenda/duplicados-contactos.component.ts (~281-294)
- **Complexity**: M

### TODO-007: Dashboard — eventos sin edición y `fechaFin` nunca capturada
- **Priority**: Medium
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/dashboard
- **Context**: El calendario solo crea/elimina (no edita); `fechaFin` siempre se envía `null` (`:395`); las tarjetas de resumen no enrutan a sus secciones; usa `confirm`/`alert` nativos.
- **Affected Files**: src/app/features/dashboard/dashboard.component.ts
- **Complexity**: M

### TODO-008: Agrupaciones — sin CRUD de integrantes
- **Priority**: Medium
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/agrupaciones
- **Context**: Los integrantes llegan embebidos en `GET /agrupaciones-periodos` (solo lectura); no hay alta/baja desde el front aunque el backend expone `agrupacion-integrantes`.
- **Affected Files**: src/app/features/agrupaciones/agrupaciones-por-periodo.component.ts
- **Complexity**: M

### TODO-009: Filtros cosméticos que no filtran
- **Priority**: Low
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/debitos, feature/convencionales, feature/productos
- **Context**: El filtro por mes de Débitos no se envía al backend ni recarga; la tab "departamentales" de Convencionales no aplica el buscador; los filtros de rango de fecha de Productos no filtran.
- **Affected Files**: src/app/features/{debitos,convencionales,productos}/*.component.ts
- **Complexity**: S

### TODO-010: Login — `loading` no se resetea y validación no bloquea submit
- **Priority**: Low
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/auth
- **Context**: En el camino feliz no se llama `loading.set(false)` (`:54`); el botón solo se deshabilita por `loading()`, no por `form.invalid` (`:31`).
- **Affected Files**: src/app/features/auth/login.component.ts
- **Complexity**: S

## 🔧 Technical Debt

### DEBT-001: Sin tests automatizados
- **Priority**: High
- **Status**: partially-resolved (runner montado en feature 002; falta ampliar cobertura a otras features)
- **Created**: 2026-06-14
- **Origin**: transversal
- **Context**: ~~No hay Karma/Jasmine ni ningún `*.spec.ts`, ni `tsconfig.spec.json`.~~ Feature 002 montó el runner (Karma/Jasmine, `tsconfig.spec.json`, `karma.conf.js`, script `npm test`, job CI "Unit Tests") + specs de paginado. Falta extender specs al resto del proyecto.
- **Affected Files**: (todo el proyecto)
- **Complexity**: L
- **Risk if Ignored**: Regresiones invisibles; refactors riesgosos.

### DEBT-002: Sin manejo global de errores HTTP
- **Priority**: High
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: transversal
- **Context**: El `authInterceptor` solo maneja 401 (logout + redirect). No hay `ErrorHandler` global ni interceptor de errores; cada componente queda librado a sí mismo (ver TODO-002).
- **Affected Files**: src/app/core/auth.interceptor.ts, src/app/app.config.ts
- **Complexity**: M
- **Risk if Ignored**: Errores silenciosos, UX inconsistente.

### DEBT-003: Seguridad de sesión en el cliente
- **Priority**: High
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/auth (transversal)
- **Context**: Token JWT en `localStorage`; sin validación de expiración ni refresh token; el `authGuard` solo chequea presencia de sesión, no valida el JWT. Alineado con el backend (sin refresh).
- **Affected Files**: src/app/core/auth.service.ts, src/app/core/auth.guard.ts
- **Complexity**: M
- **Risk if Ignored**: Sesiones colgadas, exposición de token a XSS.

### DEBT-004: Credenciales demo hardcodeadas en el login
- **Priority**: Medium
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/auth
- **Context**: `usuario='admin'`/`clave='admin123'` precargados en el componente y visibles en el template.
- **Affected Files**: src/app/features/auth/login.component.ts (~45-46, ~35)
- **Complexity**: S
- **Risk if Ignored**: Credenciales reales filtradas si se reutiliza el patrón en prod.

### DEBT-005: Duplicación masiva en listados
- **Priority**: Medium
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/listados
- **Context**: Los 10 componentes de listados son casi idénticos (signal + `http.get` + `computed` + tabla con filtros); `Jovenes` y `Directorio` son clones literales. Abstraer a un componente/configuración genérica de reporte.
- **Affected Files**: src/app/features/listados/*.component.ts
- **Complexity**: L
- **Risk if Ignored**: Cambios repetidos x10, inconsistencias, bugs duplicados.

### DEBT-006: Llamadas HTTP dispersas sin capa de servicios consistente
- **Priority**: Medium
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: transversal
- **Context**: Varias features llaman `HttpClient` directo desde el componente (productos, listados, partes de adhesiones/agrupaciones) en vez de un service por dominio. Sin tipado/centralización del contrato de API.
- **Affected Files**: src/app/features/**/*.component.ts
- **Complexity**: L
- **Risk if Ignored**: Contrato de API desperdigado; difícil de mantener al cambiar el backend.

### DEBT-007: Catálogos hardcodeados y divergentes
- **Priority**: Medium
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/adhesiones, feature/agrupaciones
- **Context**: Listas de Sector / Sist.Contrib. hardcodeadas y **divergentes** entre el alta rápida del listado y las fichas; `DEPARTAMENTOS` duplicado en dos componentes. El backend ahora expone `/api/catalogos/sectores` y `/api/catalogos/partido-sectores` — usarlos.
- **Affected Files**: src/app/features/adhesiones/*.component.ts, src/app/features/agrupaciones/*.component.ts
- **Complexity**: M
- **Risk if Ignored**: Datos inconsistentes entre pantallas. *(Espejo del backend: feature `catalogos`.)*

### DEBT-008: Datos y labels hardcodeados en la UI
- **Priority**: Low
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: feature/debitos, feature/convencionales, feature/agrupaciones
- **Context**: Débitos muestra `"+12% vs mes anterior"` y año `2026` fijos; Convencionales tiene stats fijas (623/1247/84/156) que no matchean las filas; las firmas del PDF de agrupaciones están hardcodeadas.
- **Affected Files**: src/app/features/{debitos,convencionales,agrupaciones}/*
- **Complexity**: S
- **Risk if Ignored**: Información engañosa en pantalla.

### DEBT-009: Interfaces/modelos TS duplicados entre features
- **Priority**: Low
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: transversal
- **Context**: Interfaces de datos (Contacto, listados, etc.) declaradas inline y repetidas entre componentes; no hay carpeta `models/` compartida.
- **Affected Files**: src/app/features/**/*.component.ts
- **Complexity**: M
- **Risk if Ignored**: Tipos divergentes del contrato real del backend.

### DEBT-010: `@angular/animations` declarado pero no provisto
- **Priority**: Low
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: transversal
- **Context**: `@angular/animations` figura en `package.json` pero no se llama `provideAnimations()` en `app.config.ts`; peso muerto o feature a medio cablear.
- **Affected Files**: package.json, src/app/app.config.ts
- **Complexity**: S
- **Risk if Ignored**: Bundle innecesario o animaciones que no funcionan.

### DEBT-011: Migrar a la estructura estándar (core/services, core/models, shared)
- **Priority**: High
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: chore/boilerplate-scaffold (transversal)
- **Context**: El estándar objetivo ya está scaffoldeado (`core/interceptors/` con auth + http-error, carpetas `core/services/`, `core/models/`, `shared/{components,directives,pipes}`). Falta **migrar la lógica**: mover las llamadas `HttpClient` dispersas a services por dominio en `core/services/` (DEBT-006), extraer las interfaces inline a `core/models/` (DEBT-009), y los componentes/pipes reutilizables a `shared/`. Migrar feature por feature; usar `auth`/`agenda` como piloto. Ver `CLAUDE.md` → "Cómo se construye una feature nueva".
- **Affected Files**: src/app/features/**, src/app/core/**, src/app/shared/**
- **Complexity**: XL
- **Risk if Ignored**: La estructura objetivo queda como cascarón; lógica acoplada y sin testear; cada feature nueva nace con deuda.

### DEBT-012: Montar el runner de tests + primeros tests
- **Priority**: High
- **Status**: pending
- **Created**: 2026-06-14
- **Origin**: chore/boilerplate-scaffold (transversal)
- **Context**: No hay runner de tests configurado (sin Karma/Jasmine ni vitest, sin `tsconfig.spec.json`). Montar el runner (Karma/Jasmine estándar de Angular 17, o vitest), agregar `tsconfig.spec.json` + target `test` en `angular.json`, escribir primeros tests (auth.service, interceptors, un componente), y agregar el step `ng test` al CI (`.github/workflows/ci.yml`).
- **Affected Files**: package.json, angular.json, tsconfig.spec.json (nuevo), .github/workflows/ci.yml
- **Complexity**: L
- **Risk if Ignored**: Sin red de seguridad automatizada (ligado a DEBT-001).

### DEBT-013: Limpiar "pendientes" del contrato de /debitos/dashboard (espejo backend)
- **Priority**: Low
- **Status**: pending
- **Created**: 2026-06-30
- **Origin**: feature/eliminar-debitos-pendientes (espejo cross-repo)
- **Context**: La feature `001-eliminar-debitos-pendientes` quitó el estado "Pendientes" del frontend y dejó que el componente recalcule `total`/`pct*` sobre `aceptados + rechazados`, tolerando que el backend siga enviando `pendientes`/`pctPendientes` (que el front ignora). Para cerrar la deuda: en `administracion-pn-backend`, quitar `stats.pendientes`, `stats.pctPendientes` y `porTarjeta[].pendientes` de la respuesta de `/api/debitos/dashboard`, y recalcular `total`/`pctAceptados`/`pctRechazados`/`pctAceptacion` server-side sobre aceptados+rechazados. Una vez hecho, el frontend puede simplificar los helpers (o volver a confiar en los campos del backend). Convención de IDs cruzados (ver `CLAUDE.md` → Workspace).
- **Affected Files**: administracion-pn-backend → endpoint `/debitos/dashboard`; (front) src/app/features/debitos/debitos.component.ts
- **Complexity**: S
- **Risk if Ignored**: El contrato sigue exponiendo un estado inexistente; los totales/porcentajes server-side quedan inflados para cualquier otro consumidor del endpoint.
