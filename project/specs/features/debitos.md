# Feature: Débitos

- **Estado:** Vista 100% funcional pero alimentada por un **backend STUB**. El componente consume datos reales por HTTP (no hay mock en el front), pero el endpoint del backend devuelve datos **hardcodeados en memoria** (sin base de datos). Ver `src/AdministracionPn.Api/Controllers/StubControllers.cs:142-172` (`DebitosController`). En la práctica la pantalla siempre muestra los mismos números fijos.
- **Ruta:** `/debitos`
- **Componente:** `DebitosComponent` (standalone) — `src/app/features/debitos/debitos.component.ts:105`
- **Nota arquitectura:** Aplica el stack transversal descrito en [../architecture.md](../architecture.md): Angular 17.3 standalone + signals, `authGuard` (protege la ruta), `authInterceptor` (agrega el token), `apiUrl = http://localhost:5000/api`.

---

## Propósito

Dashboard de seguimiento de débitos automáticos (cobros con tarjeta/cuenta a adherentes), filtrable por mes. Resume cuántos débitos fueron aceptados, rechazados y pendientes, el monto total recaudado, un desglose por tarjeta y un listado de los últimos débitos rechazados.

---

## Rutas y navegación

- Declarada en `src/app/app.routes.ts:32`:
  ```ts
  { path: 'debitos', loadComponent: () => import('./features/debitos/debitos.component').then(m => m.DebitosComponent) }
  ```
- Carga **lazy** (`loadComponent`).
- Está dentro del grupo de rutas protegidas por `authGuard` (layout principal con sidebar). No recibe parámetros de ruta.
- No navega hacia otras vistas: los `action-link` ("Aceptados", "Rechazados", "Histórico", "Ver todos") son `<a>` sin `routerLink` ni handler → sin acción (ver gaps).

---

## Componente (qué muestra, signals)

`DebitosComponent` — no usa tabs; es una sola vista compuesta por:

1. **Barra de filtros por mes** (`debitos.component.ts:19-27`): 12 chips (Enero…Diciembre) generados con `@for (m of meses; ...)`. El chip activo se marca comparando contra `mes()`. Al hacer click setea `mes.set(i)`.
2. **Grid de 4 stat-cards** (`debitos.component.ts:29-50`):
   - Aceptados (`data().stats.aceptados`, `pctAceptados`) — color success.
   - Rechazados (`data().stats.rechazados`, `pctRechazados`) — color danger.
   - Pendientes (`data().stats.pendientes`, `pctPendientes`) — color warning.
   - Monto Total Recaudado (`data().stats.montoTotal`, formateado) — con texto fijo `"+12% vs mes anterior"` (hardcodeado en template, no calculado — `debitos.component.ts:48`).
3. **Tabla "Resumen por Tarjeta"** (`debitos.component.ts:52-79`): título dinámico `Resumen por Tarjeta — {{ meses[mes()] }} 2026` (el año "2026" está hardcodeado en el template, `debitos.component.ts:53`). Columnas: Tarjeta (badge), Aceptados, Rechazados, Pendientes, Total, Monto, % Aceptación (badge `status-active` si ≥88, si no `status-pending`), y una columna de acciones con 3 `action-link`.
4. **Tabla "Últimos Débitos Rechazados"** (`debitos.component.ts:81-102`): Adherente, Tarjeta (badge), Monto, Fecha (`date:'dd/MM/yyyy'`), Motivo. Botón "Ver todos" sin acción.

### Signals y estado (`debitos.component.ts:109-111`)

| Signal / prop | Tipo | Valor inicial | Notas |
|---|---|---|---|
| `meses` | `string[]` (const `MESES`) | 12 nombres de mes | `debitos.component.ts:12`, prop normal (no signal) |
| `mes` | `signal<number>` | `3` (→ "Abril") | índice del mes seleccionado |
| `data` | `signal<Dashboard>` | objeto vacío con stats en 0 y arrays vacíos | se llena tras la llamada HTTP |

### Métodos auxiliares

- `badgeClass(t)` (`debitos.component.ts:118-126`): mapea el nombre de tarjeta (lowercase) a una clase CSS de badge: `visa`, `master`, `oca`, `ebrou`, `antel`, default `dept`.
- `formatMonto(n)` (`debitos.component.ts:128-130`): `n.toLocaleString('es-UY', { maximumFractionDigits: 0 })`.

### Servicios inyectados

- `PageTitleService` (`debitos.component.ts:107`): en el constructor hace `titleSvc.set('Débitos')` (`debitos.component.ts:114`).
- `HttpClient` (`debitos.component.ts:106`).

---

## API consumida

Una sola llamada, en el **constructor** (`debitos.component.ts:115`):

| Método | Ruta exacta | Cuándo | Respuesta tipada | Backend |
|---|---|---|---|---|
| `GET` | `${apiUrl}/debitos/dashboard` → `http://localhost:5000/api/debitos/dashboard` | al construir el componente | `Dashboard` | **STUB** — devuelve datos fijos en memoria |

```ts
// debitos.component.ts:115
this.http.get<Dashboard>(`${environment.apiUrl}/debitos/dashboard`).subscribe(x => this.data.set(x));
```

**Estado del endpoint en backend:** STUB. Definido en `src/AdministracionPn.Api/Controllers/StubControllers.cs:170` (`DebitosController.Dashboard`). Devuelve `new { stats = _stats, porTarjeta = _tarjetas, rechazados = _rech }` donde `_stats`, `_tarjetas` y `_rech` son arrays/record estáticos hardcodeados (`StubControllers.cs:149-167`). El controller además expone `GET /api/debitos` (lista vacía, `StubControllers.cs:169`) y `GET /api/debitos/rechazados` (`StubControllers.cs:171`), **pero el front NO los consume**.

> Importante: el filtro de mes (`mes` signal) **no se envía al backend** ni re-dispara la llamada. Cambiar de mes solo cambia el resaltado del chip y el texto del título; los datos no cambian.

---

## Modelos / interfaces

Definidos localmente en `debitos.component.ts:7-10` (no compartidos, no en un `.service.ts`):

```ts
// debitos.component.ts:7
interface Tarjeta { tarjeta: string; aceptados: number; rechazados: number; pendientes: number; total: number; monto: number; pctAceptacion: number; }
// debitos.component.ts:8
interface Rechazado { adherente: string; tarjeta: string; monto: number; fecha: string; motivo: string; }
// debitos.component.ts:9
interface Stats { aceptados: number; rechazados: number; pendientes: number; montoTotal: number; pctAceptados: number; pctRechazados: number; pctPendientes: number; }
// debitos.component.ts:10
interface Dashboard { stats: Stats; porTarjeta: Tarjeta[]; rechazados: Rechazado[]; }
```

Const `MESES` (`debitos.component.ts:12`): array de 12 nombres de mes en español.

---

## Interacciones / UX

- **Chips de mes**: click → `mes.set(i)`; el chip activo se resalta (`[class.active]="mes()===i"`). Efecto solo visual + título (no recarga datos).
- **Badges de tarjeta**: color según `badgeClass()`.
- **% Aceptación**: badge verde (`status-active`) si ≥88, naranja (`status-pending`) si <88.
- **Formato de monto**: locale `es-UY`, sin decimales, prefijo `$` puesto en el template.
- **Fecha de rechazados**: pipe `date:'dd/MM/yyyy'`.
- Sin estados de loading/empty/error explícitos: mientras no llega la respuesta se muestran los valores iniciales (0 y tablas vacías).

---

## Dependencias

- `@angular/core`: `Component`, `inject`, `signal` (`debitos.component.ts:1`).
- `@angular/common`: `CommonModule` (para `@for`, `@if` implícito, pipe `date`, `ngClass`) (`debitos.component.ts:2,17`).
- `@angular/common/http`: `HttpClient` (`debitos.component.ts:3`).
- `environment` (`apiUrl`) — `src/environments/environment` (`debitos.component.ts:4`).
- `PageTitleService` — `src/app/core/page-title.service` (`debitos.component.ts:5`).
- **No** importa `FormsModule`, `RouterLink`, ni ningún service de feature.

---

## No implementado / gaps

- **Backend es STUB**: el endpoint `/debitos/dashboard` no consulta base de datos; siempre devuelve los mismos valores fijos (`StubControllers.cs:142-172`). La vista del front es real (consume HTTP, sin mock embebido), pero los datos de fondo son ficticios.
- **El filtro por mes no funciona contra el servidor**: no se pasa el mes seleccionado al backend ni se re-dispara la consulta (`debitos.component.ts:23,115`). Es puramente cosmético.
- **Texto hardcodeado en template**: `"+12% vs mes anterior"` (`debitos.component.ts:48`) y el año `2026` del título de la tabla (`debitos.component.ts:53`) están escritos a mano, no calculados.
- **Acciones sin implementar**: los `action-link` "Aceptados" / "Rechazados" / "Histórico" (`debitos.component.ts:70-72`) y "Ver todos" (`debitos.component.ts:84`) son enlaces sin `routerLink` ni `(click)` → no hacen nada.
- **Sin exportación, sin paginación, sin manejo de errores HTTP.**
- Los endpoints backend `GET /api/debitos` y `GET /api/debitos/rechazados` existen pero el front no los usa.
