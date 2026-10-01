# Feature 031 — Normalizar departamentos

**Estado**: Completada · **Fecha**: 2026-09-30 · **Rama**: `feature/normalizar-departamentos`
**Espejo**: backend `034-normalizar-departamentos` ↔ frontend `031-normalizar-departamentos`
**Origen (backlog)**: backend DEBT-023, DEBT-024 · frontend DEBT-015, DEBT-016

## Qué se hizo

- **Datos existentes (DEBT-023)**: migración solo de datos `NormalizarDepartamentos`. Las 6 columnas principales (`Contactos.Departamento` / `DepartamentoCredencial`, `Organismos`, `AdhesionesWeb`, `FichasAgrupacion`, `Agrupaciones.Depto`) pasan a forma canónica; `Seleccione` y los vacíos pasan a NULL.
  - Las letras de serie de agrupaciones (decisión del usuario), los países y los typos quedan intactos.
- **Escrituras nuevas**: `AppDbContext.SaveChanges` normaliza las mismas columnas en toda alta o edición: formularios, sync web, pasar a local, promoción de fichas y semilla.
- **Formularios (DEBT-015)**: lista canónica única (`core/departamentos.ts`).
  - El alta de contacto guardaba "Paysandu".
  - En edición, un valor no reconocido se conserva como opción extra.
- **nueva-ficha (DEBT-016)**: precarga el departamento aunque el contacto lo tenga en MAYÚSCULAS.
- **Specs (DEBT-024)**: `listados.md` reescrito contra el código en los dos repos.

## Validación contra Postgres (datos sucios como prod)

Base sembrada con el código de `develop`, después se arrancó el código nuevo, que aplicó la migración:

| Columna | Antes (sucio reconocible / basura) | Después |
|---|---|---|
| Contactos.Departamento | 20.974 / 0 | canónico 20.990; letras/otros intactos (3 ARGENTINA/URUGUAY) |
| Organismos.Departamento | 694 / 10 | canónico 694; nulos 280 → 290 |
| Agrupaciones.Depto | 269 / 0 | canónico 269; **2.023 letras intactas** |

- Segunda corrida: 12× `UPDATE 0` (idempotente).
- Los filtros devuelven los mismos totales que antes (Paysandú 841, Canelones agrupaciones 898).

## Code review

Con `AutoDetectChanges` apagado y otra columna marcada, la normalización se perdía. Se corrigió escribiendo vía `EntityEntry`, con un test que falla con la versión anterior.

## Release

La migración toca datos de prod y su `Down()` está vacío a propósito: **requiere backup o branch de Neon antes de mergear a `main`**.
