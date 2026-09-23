# Implementation Summary — 028-bugs-reportados-organismos-adhesiones

**Creada**: 2026-09-22 · **Completada**: 2026-09-22 · **Duración**: 1 día
**Modo**: standard · **Template**: full · **Project type**: production · **Tipo**: bugfix

## Tareas — 7/7

| ID | Título | Layer | Estado |
|---|---|---|---|
| TASK-001 | `cedula.ts` + validador bloqueante | 1 | completed |
| TASK-002 | Edición de referencias por contacto | 1 | completed |
| TASK-003 | Edición de referencias por organismo | 1 | completed |
| TASK-004 | Tests | 1 | completed |
| TASK-005 | Verificación visual | 2 | completed |
| TASK-006 | Code Review | 2 | completed |
| TASK-007 | Security Review | 2 | completed |

## Commits

| SHA | Mensaje |
|---|---|
| `706c92a` | fix(referencias,contactos): editar referencias partidarias y validar DV |
| `276cceb` | chore(referencias,contactos): layer 2 calidad (feature 028) |

## Métricas

| Métrica | Valor |
|---|---|
| Archivos de producción tocados | 6 (2 nuevos: `core/cedula.ts`, `core/fechas.ts`) |
| Archivos de test nuevos | 2 |
| Tests agregados | 18 |
| Suite completa | 236/236 (antes 218) |

## Revisiones de calidad

- **Code review** — **1 hallazgo, corregido**: el helper de conversión de fecha estaba duplicado entre
  las dos vistas de referencias; se extrajo a `core/fechas.ts`. Verificado además: un solo algoritmo de
  DV en el front, ambas vistas usan `<app-modal-form>`.
- **Security** — 0 hallazgos. Sin `innerHTML` ni `bypassSecurityTrust`. La validación de cédula es de
  doble capa (front + backend).

## Sync de specs

- `project/specs/features/agenda.md`: la validación de cédula documenta ahora el DV y la regla de
  edición.
- `project/specs/features/organismos.md`: sección nueva con las dos vistas de referencias y su edición.

## Sin verificar

- El comportamiento del modal en tema oscuro se apoya en que `<app-modal-form>` ya lo tiene resuelto
  (`DEBT-014` movió su CSS a `styles.css`); no se comprobó visualmente en oscuro.
- La vista de referencias por organismo se verificó por tests y build, no con click-through: la de
  contacto sí.
