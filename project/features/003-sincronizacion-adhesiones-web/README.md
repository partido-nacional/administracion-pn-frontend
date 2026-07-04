# 003 — Sincronización de Adhesiones Web

**Estado**: Completada (archivada 2026-07-04) · **Tipo**: production · **Template**: full
**Verdicto de cierre**: `CAN_PROCEED_WITH_WARNINGS` (gap E2E documentado en backlog `TODO-011`)

## Qué se construyó

Parte **frontend** de la sincronización de adhesiones web desde la nube del Partido Nacional.
El botón **"Sincronizar Nube"** de *Adhesiones Pendientes en Web* dejó de usar data mockeada y
ahora invoca el endpoint del backend propio, muestra estado de carga, un resumen del resultado y
recarga listado + stats.

> El grueso de la lógica (traer del endpoint externo del PN, filtrado incremental por última
> sincronización, dedupe permanente por `identificador_formulario`, persistencia de la marca) vive
> en el **backend espejo** `administracion-pn-backend`. Esta feature cubre solo el FE.

## Componentes tocados

- `src/app/features/adhesiones/adhesiones.service.ts`
  - `sincronizarWeb()` → `POST ${base}/web/sincronizar`, tipado `Observable<SincronizacionResult>`.
  - Interfaz exportada `SincronizacionResult { nuevas, duplicadasIgnoradas, desde, ultimaSincronizacion: string|null }`.
- `src/app/features/adhesiones/adhesiones-listado.component.ts`
  - Botón cableado a `sincronizarNube()` con signal `sincronizando` (deshabilita + "Sincronizando…").
  - Al éxito: resumen inline ("X nuevas, Y ya existían") + `reloadWeb()` + `reloadStats()`.
  - Al error: mensaje en UI, sin `alert()` bloqueante.

## Contrato consumido (backend espejo)

`POST /adhesiones/web/sincronizar` (body vacío) → `SincronizacionResult`.

## Verificación

- ✅ Build (`npm run build`) verde.
- ✅ Code review, performance review y security review (TASK-004/005/006).
- ✅ Security: el password del endpoint externo (`MiPn.2024`) no aparece en el repo FE; el FE solo
  llama al backend propio; `src/environments/*` sin secretos de terceros (BR-4).
- ⏳ **Verificación E2E manual (TASK-003): diferida** → backlog `TODO-011`. Bloqueada por la
  dependencia cross-repo: el endpoint `POST /adhesiones/web/sincronizar` del backend aún no está
  disponible. Al estarlo, verificar vía `/verify` (caso con novedades, caso vacío, caso de error).

## Referencias

- Spec funcional: `functional-spec.md` · Spec técnica: `technical-spec.md` · Tareas: `tasks.json`
- Backlog: `TODO-011` (verificación E2E pendiente)
- Espejo backend: `administracion-pn-backend` (endpoint de sync + persistencia de marca)
