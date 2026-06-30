# Technical Specification: Eliminar Débitos Pendientes

**Version**: 1.0
**Status**: Draft
**Created**: 2026-06-30

## Architecture Overview

Cambio acotado a un único componente standalone: `src/app/features/debitos/debitos.component.ts` (template inline + clase). No hay capa de service para débitos todavía (deuda DEBT-006); el componente usa `HttpClient` directo. Esta feature **no** migra esa deuda — mantiene el patrón actual para no inflar el alcance.

Estrategia: el frontend deja de mostrar "Pendientes" y deja de confiar en los campos `total` y `pct*` del backend, recalculándolos localmente desde `aceptados + rechazados`. Así la vista es internamente consistente sin requerir cambios en el backend (AC-5).

### Cambios en interfaces (TypeScript)

- `interface Tarjeta`: quitar `pendientes`. Se mantiene `total` y `pctAceptacion` en el tipo (el backend los sigue enviando), pero el template los recalcula y no usa los valores crudos del backend para mostrar.
- `interface Stats`: quitar `pendientes` y `pctPendientes`.
- `interface Dashboard`: sin cambios estructurales.
- Tolerancia: como TypeScript no falla si el JSON trae campos extra, quitar las props de las interfaces es seguro aunque el backend siga mandando `pendientes`/`pctPendientes` (AC-5).

### Cálculos derivados (helpers en la clase)

Agregar métodos puros en `DebitosComponent` para centralizar BR-1..BR-4 y cubrir EC-1 (sin división por cero):

```ts
private base(t: { aceptados: number; rechazados: number }): number {
  return t.aceptados + t.rechazados;            // Total = acept + rech (BR-1)
}
totalTarjeta(t): number { return this.base(t); }
pctAceptacion(t): number {                       // BR-2 / BR-4
  const b = this.base(t);
  return b === 0 ? 0 : Math.round((t.aceptados / b) * 100);
}
pctAceptados(s): number {                        // BR-3
  const b = this.base(s);
  return b === 0 ? 0 : Math.round((s.aceptados / b) * 100);
}
pctRechazados(s): number {
  const b = this.base(s);
  return b === 0 ? 0 : Math.round((s.rechazados / b) * 100);
}
```

> El redondeo se hace con `Math.round` para igualar el formato entero que hoy muestra la UI. El umbral de badge `>= 88` sigue aplicándose sobre `pctAceptacion(t)`.

### Cambios en el template (inline)

| Ubicación actual | Cambio |
|------------------|--------|
| Stat-card "Pendientes" (`:40-44`) | Eliminar el bloque completo. |
| `pctAceptados`/`pctRechazados` en stat-cards (`:33`, `:38`) | Usar `pctAceptados(data().stats)` / `pctRechazados(data().stats)`. |
| `<th>Pendientes</th>` en tabla (`:57`) | Eliminar la celda de encabezado. |
| `<td>{{ t.pendientes }}</td>` (`:65`) | Eliminar la celda. |
| `<td>{{ t.total }}</td>` (`:66`) | Usar `totalTarjeta(t)`. |
| Badge `% Aceptación` (`:68`) | Usar `pctAceptacion(t)` para valor y umbral. |
| `signal<Dashboard>` inicial (`:111`) | Quitar `pendientes`/`pctPendientes` del objeto inicial. |

La tabla "Últimos Débitos Rechazados" (`:81-102`) queda intacta (AC-6).

## API Contract

### GET /api/debitos/dashboard

**Description**: Dashboard de débitos por tarjeta. **Sin cambios en esta feature** — el frontend consume el mismo endpoint y tolera campos extra.
**Auth**: JWT (igual que el resto de la app).

**Response (200) — el backend hoy envía (campos de pendientes ignorados por el front)**:
```json
{
  "stats": { "aceptados": 0, "rechazados": 0, "pendientes": 0, "montoTotal": 0, "pctAceptados": 0, "pctRechazados": 0, "pctPendientes": 0 },
  "porTarjeta": [{ "tarjeta": "Visa", "aceptados": 0, "rechazados": 0, "pendientes": 0, "total": 0, "monto": 0, "pctAceptacion": 0 }],
  "rechazados": [{ "adherente": "", "tarjeta": "", "monto": 0, "fecha": "", "motivo": "" }]
}
```

> El frontend ignora `pendientes`, `pctPendientes`, y recalcula `total`/`pctAceptacion`/`pctAceptados`/`pctRechazados` localmente.

## Data Model & Storage

Frontend-only, sin storage. Modelos afectados (interfaces inline en el componente):

| Interface | Campo | Acción |
|-----------|-------|--------|
| `Tarjeta` | `pendientes` | Eliminar |
| `Stats` | `pendientes` | Eliminar |
| `Stats` | `pctPendientes` | Eliminar |

## External Integrations

### administracion-pn-backend (.NET 8)
- **Purpose**: provee `/debitos/dashboard`.
- **Failure handling**: sin cambios. El componente ya hace `subscribe` directo sin manejo de error explícito (deuda DEBT-002, fuera de alcance); el placeholder en ceros cubre EC-2.
- **Ítem espejo (no bloqueante)**: limpiar `pendientes`/`pctPendientes` del contrato y recálculo server-side de `total`/`pct*`. A registrar en `project/backlog.md`.

## Non-Functional Requirements

- **Performance**: sin impacto (cálculos triviales en render).
- **Security**: sin cambios.
- **Scalability**: N/A.

## Implementation Notes

- No introducir `NgModule` ni romper el patrón standalone (regla dura del repo).
- No migrar a service ni a `core/models/` en esta feature (deudas DEBT-006/009 separadas).
- Verificación manual recomendada (no hay runner de tests aún — DEBT-001): correr `npm start`, ir a `/debitos`, confirmar que no aparece "Pendientes" y que Total/% cuadran con `aceptados+rechazados`.
- Registrar el ítem espejo del backend en el backlog como parte del cierre (`/project.finish`).
