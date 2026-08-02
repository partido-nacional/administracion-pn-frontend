# Implementation Summary — 026-contactos-morosos-resaltado

**Creada**: 2026-08-02 · **Completada**: 2026-08-02 · **Duración**: 1 día
**Modo**: standard · **Template**: full · **Project type**: production · **Estrategia**: sequential
**Espejo**: `administracion-pn-backend` → `029-contactos-morosos-resaltado`

## Tareas

| ID | Título | Layer | Complejidad | Estado |
|---|---|---|---|---|
| TASK-001 | Campo situacion + helper esMoroso() | 1 | Low | completed |
| TASK-002 | Resaltado de la fila en la grilla | 1 | Medium | completed |
| TASK-003 | Card desplegada teñida + cartel | 1 | Medium | completed |
| TASK-004 | Spec de tests del componente | 1 | High | completed |
| TASK-005 | Code Review | 2 | Low | completed |
| TASK-006 | Performance Review | 2 | Low | completed |
| TASK-007 | Security Review | 2 | Low | completed |

**7/7 completadas.**

## Commits

| SHA | Mensaje |
|---|---|
| `3bc1dd0` | feat(agenda): resaltar contactos morosos en la grilla (TASK-001..004) |
| `76afdc3` | fix(agenda): corregir el tema oscuro del resaltado de morosos |

## Métricas

| Métrica | Valor |
|---|---|
| Archivos de producción tocados | 3 |
| Archivos de test nuevos | 1 |
| Tests agregados | 12 |
| Suite completa | 209/209 verde |
| Build | verde |

## Revisiones de calidad

- **Code review** — 0 hallazgos. Un solo `esMoroso()`; el rojo gana por especificidad y no por orden de
  declaración; hex del resaltado agrupados en un bloque comentado.
- **Performance** — 0 hallazgos. `esMoroso()` es una comparación de string; el resaltado usa
  `background`/`box-shadow`, que no fuerzan layout.
- **Security** — 0 hallazgos. Aviso por interpolación, sin `innerHTML` ni `bypassSecurityTrust`.

## Hallazgos de la verificación visual

Levantar la app encontró **dos bugs que los tests unitarios no podían ver**, porque verifican clases y
presencia en el DOM y no estilos computados:

1. **Las reglas `html.dark` del componente no matcheaban nunca.** Angular emitió
   `html.dark[_ngcontent-ng-c2246583791]`: la encapsulación emulada agrega el atributo de scope también
   al elemento `html`, que nunca lo lleva. Movidas a `src/styles.css`.
2. **Oscurecer el área desplegada dejaba el texto ilegible.** `.kv .v` usa `color:#222` hardcodeado y la
   card tiene fondos claros hardcodeados aun en tema oscuro; esa combinación preexistente mantenía el
   texto legible por accidente. Ahora en tema oscuro se oscurece sólo la fila.

## Sync de specs

`project/specs/features/agenda.md`: documentado el resaltado, y corregidas dos desincronizaciones
**preexistentes** — el spec decía que `reload()` pegaba directo con `HttpClient` (hoy es `load()` vía
`ContactosService.listado()`, paginado server-side) y que `ContactoListado` era una interfaz local del
componente (vive en `contactos.service.ts`).

## Sin verificar

Cobertura global del repo (deuda `DEBT-001`, sin medir en este cierre). Comportamiento con muchos
morosos consecutivos en una misma página, más allá de la elección del tono más suave.
