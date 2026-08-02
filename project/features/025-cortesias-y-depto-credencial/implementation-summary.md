# Implementation Summary — 025-cortesias-y-depto-credencial

**Creada**: 2026-08-02 · **Completada**: 2026-08-02 · **Duración**: 1 día
**Modo**: standard · **Template**: full · **Project type**: production · **Estrategia**: sequential

## Tareas

| ID | Título | Layer | Complejidad | Estado |
|---|---|---|---|---|
| TASK-001 | Catálogo de 28 cortesías + opción legacy | 1 | Medium | completed |
| TASK-002 | Bloqueo del Depto. Credencial derivado de la credencial | 1 | Medium | completed |
| TASK-003 | Spec de tests del componente | 1 | High | completed |
| TASK-004 | Code Review | 2 | Low | completed |
| TASK-005 | Performance Review | 2 | Low | completed |
| TASK-006 | Security Review | 2 | Low | completed |

**6/6 completadas.** Layer 1: 3 · Layer 2: 3.

## Commits

| SHA | Mensaje |
|---|---|
| `f708d99` | feat(agenda): catálogo de 28 cortesías y bloqueo de depto credencial (TASK-001,002,003) |
| `531f5d9` | chore(agenda): layer 2 calidad + tracking (feature 025) |

## Métricas

| Métrica | Valor |
|---|---|
| Archivos de producción tocados | 1 |
| Archivos de test nuevos | 1 |
| Tests agregados | 22 |
| Suite completa | 197/197 verde (antes: 175) |
| Build | verde |
| Cobertura de `agenda-nuevo.component.ts` | **91.17%** statements · 82.05% branches · 100% functions · 94.82% lines |
| Cobertura global del repo | 72.18% statements (867/1201) |

> **Cobertura del archivo tocado: supera el umbral.** El componente no tenía ningún spec antes de esta
> feature (55.88% medido tras los 11 tests iniciales de los AC). A pedido, se extendió la cobertura al
> resto del componente —modo alta/edición, submit válido e inválido, errores del backend, helpers
> numéricos, cancelar— con 11 tests adicionales, llevándolo a 91.17%.
>
> **La cobertura global sigue por debajo del 80%** porque el gap está en componentes que esta feature no
> toca. Es deuda preexistente y ya trackeada: ver `DEBT-001` en `project/backlog.md`, actualizado con la
> medición del 2026-08-02.

## Hallazgos durante la implementación

1. **Tests fallaban en la aserción del DOM, no en la lógica.** `NgModel` aplica `[disabled]` de forma
   asíncrona (microtask), así que `detectChanges()` solo no lo refleja en el `<select>`. Resuelto con
   `fakeAsync` + `tick()`. Si los tests hubieran verificado únicamente `depCredBloqueado()` en lugar del
   elemento real, el hueco habría pasado inadvertido.
2. **Code review: `CORTESIAS` mutable.** El getter lo devuelve por referencia en el caso normal (para no
   asignar por ciclo de change detection), lo que dejaba el catálogo global expuesto a un `.push()`
   accidental. Corregido a `readonly string[]`, que era lo que ya especificaba el spec técnico.
3. **Deuda de spec preexistente.** `project/specs/features/agenda.md` documentaba el comportamiento
   anterior a la feature `contactos-mejoras-credencial-y-listado` (`select disabled`) — nunca se había
   actualizado. Resincronizado en este cierre, junto con ~12 referencias de línea desfasadas.

## Sin verificar

Comportamiento en navegador real. La cobertura es de tests unitarios del componente aislado; no hubo
click-through de la aplicación corriendo.
