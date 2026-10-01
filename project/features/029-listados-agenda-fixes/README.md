# Fixes reportados — Agenda / Listados

**Estado**: Completada · **Fecha**: 2026-09-30 · **Rama**: `fix/listados-agenda`
**Espejo**: backend `032-listados-agenda-fixes` ↔ frontend `029-listados-agenda-fixes`

## Reporte

1. Filtro departamento en **Intendencias Nacionalistas** no funciona.
2. **Comisiones Departamentales**: filtro departamento no funciona.
3. **Comisiones Directorio**: agregar a listados.
4. **Alcaldes**: no aparecen todos los departamentos en el filtro y tampoco filtra.

## Causa y fix

| # | Clasificación | Causa | Fix |
|---|---|---|---|
| 1, 2, 4 (filtrar) | IMPLEMENTATION_BUG | Backend comparaba `(o.Departamento ?? c.Departamento) == depto` exacto. La data guarda `PAYSANDÚ` (mayúsculas + tilde) y el dropdown manda `Paysandú` → en Postgres nunca matcheaba. Además `??` no cubría departamento de organismo `""` (18 alcaldías). | `norm(depto efectivo) = norm(depto)`; depto efectivo = organismo salvo null/vacío → contacto (filtro y proyección). |
| 4 (opciones) | IMPLEMENTATION_BUG | Front: 6 opciones hardcodeadas (y "Paysandu" sin tilde). | Dropdown con `DEPARTAMENTOS` (19). |
| 3 | FEATURE_GAP | No existía el listado. | Backend `GET /api/listados/comisiones-directorio` + front ruta/sidebar/componente. Población: miembros activos de organismos con compañía "PARTIDO NACIONAL - Directorio" y nombre con "comisión". Decisión del usuario: listado nuevo (no sumarlo al de Directorio). |

## Verificación

- Backend: `ListadosDepartamentoFiltroTests` (5) y `ComisionesDirectorioTests` (4). Con el filtro viejo restaurado, 4/5 de los de departamento **fallan** (reproducen el bug). Suite: 271/271.
- Frontend: `listados-agenda-fixes.spec.ts` (19 deptos en Alcaldes; Comisiones Directorio renderiza). Suite: 238/238, `ng build` OK.
- Specs actualizadas: `project/specs/features/listados.md` en ambos repos.
