# eliminar-debitos-pendientes

Elimina el estado **"Pendientes"** de la sección Débitos del frontend de Administración PN.

## Qué se construyó

La sección Débitos (`src/app/features/debitos/debitos.component.ts`) era un dashboard de transacciones por tarjeta con tres estados: Aceptados, Rechazados y Pendientes. El estado "Pendientes" dejó de existir en el negocio, así que se quitó por completo de la vista y los totales/porcentajes pasan a calcularse sobre `aceptados + rechazados`.

## Cambios clave

- **UI**: se eliminó la stat-card "Pendientes" y la columna "Pendientes" de la tabla "Resumen por Tarjeta". La tabla "Últimos Débitos Rechazados" no se tocó.
- **Cálculos**: nuevos helpers puros en `DebitosComponent` — `totalTarjeta`, `pctAceptacion`, `pctAceptados`, `pctRechazados` — todos con `base = aceptados + rechazados` y guarda `base === 0 ? 0` (sin división por cero).
- **Tipos**: se quitó `pendientes` de `Tarjeta`/`Stats` y `pctPendientes` de `Stats`. El frontend es tolerante a que el backend siga enviando esos campos (los ignora).

## Componente afectado

- `src/app/features/debitos/debitos.component.ts` (único archivo de la feature)

## API

- `GET /api/debitos/dashboard` — **sin cambios** en esta feature. El frontend recalcula `total`/`pct*` localmente. La limpieza del contrato del backend quedó como **DEBT-013** (espejo cross-repo).

## Verificación

- `npm run build` pasa.
- 0 referencias a "pendiente" en la sección Débitos.
- Sin runner de tests automatizados en el repo (DEBT-001/DEBT-012); los helpers puros quedan como candidatos ideales de unit test a futuro.
