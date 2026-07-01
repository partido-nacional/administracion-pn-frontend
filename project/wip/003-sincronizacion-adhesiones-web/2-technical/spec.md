# Technical Specification: Sincronización de Adhesiones Web

**Version**: 1.0
**Status**: Draft
**Created**: 2026-07-01

## Architecture Overview

Cross-repo. El **backend** (`administracion-pn-backend`, .NET 8) hace el trabajo pesado: expone `POST /adhesiones/web/sincronizar`, llama al endpoint externo del PN (server-side, para no exponer el password ni chocar con CORS), filtra en memoria por fecha, agrupa el EAV por `identificador_formulario`, deduplica **permanentemente** contra el histórico de identificadores vistos, persiste las adhesiones nuevas y actualiza la marca de última sincronización.

El **frontend** (este repo) solo cablea el botón "Sincronizar Nube": llama al nuevo endpoint vía `AdhesionesService.sincronizar()`, muestra estado de carga + resumen, y al terminar recarga listado (`/adhesiones/web`) y stats.

Flujo de una sync:
1. Backend lee marca `ultima_sincronizacion`. `desde = marca ?? (ahora - 3 días)`.
2. GET al endpoint externo con `password` (config) y `fecha_hora=desde` (aunque el server lo ignore, se envía por contrato).
3. Si `error:1` → abortar, no mover marca, devolver error.
4. Agrupar filas por `identificador_formulario` (cada grupo = una adhesión; todas las filas del grupo comparten `fecha_hora_registro`).
5. Filtrar grupos con `fecha_hora_registro >= desde`.
6. Descartar identificadores ya presentes en el histórico (dedupe permanente).
7. Mapear EAV → adhesión web, insertar nuevas, registrar sus identificadores en el histórico.
8. Marca `ultima_sincronizacion = max(fecha_hora_registro)` de lo procesado.
9. Devolver resumen `{ nuevas, duplicadasIgnoradas, desde, ultimaSincronizacion }`.

## Endpoint externo (fuente de datos)

`GET https://partidonacional.org.uy/admin/index.php/app/retornarValoresFormularioAdhesionFechaHora`

Query params:
- `password` (string) — **validado** por el servidor. Valor: `MiPn.2024` (secreto, va por config del backend; nunca en el repo ni en el FE).
- `fecha_hora` (string, `'YYYY-MM-DD HH:mm:ss'`) — **IGNORADO por el servidor** (probado en vivo 2026-07-01: cualquier valor devuelve la misma ventana fija de ~40 días / ~1100 filas / ~67 formularios). No confiar en el filtrado server-side.

Respuesta OK (array plano EAV):
```json
{
  "respuesta": [
    { "identificador_formulario": "04xTlVdZ4QPFxKQlYZ7n", "fecha_hora_registro": "2026-06-30 09:25:58", "nombre_campo": "Nombre completo: ", "valor_campo": "Tania  Alicia " }
  ]
}
```

Respuesta credenciales inválidas:
```json
{ "respuesta": [], "error": 1, "mensaje": "Error de credenciales" }
```

**Propiedades verificadas de la data:**
- `identificador_formulario` es **único por adhesión** y **estable entre llamadas** (2 llamadas a 2s → 67 identificadores idénticos). Es la clave natural para dedupe.
- Todas las filas de un mismo formulario comparten un único `fecha_hora_registro` (0 formularios con fechas distintas). Sirve como fecha de la adhesión para el filtro incremental.

Mapeo EAV `nombre_campo` → `AdhesionWebDto`:

| nombre_campo externo                         | AdhesionWebDto     |
|----------------------------------------------|--------------------|
| `Nombre completo: `                          | nombre             |
| `Apellido Completo: `                         | apellido           |
| `Cédula de Identidad Nro:`                   | cedula             |
| `Credencial Cívica:`                         | credCivica         |
| `Dirección de Correo Electrónico:`           | email              |
| `Teléfono Fijo:`                             | telefono           |
| `Celular`                                    | celular            |
| `Departamento:` (el real, NO el que vale `"0"`) | departamento    |
| `Fecha de Nacimiento:`                       | fechaNacimiento    |
| `fecha_hora_registro` (de la fila)           | fechaSistema       |
| `Defina el sistema de contribución: `        | sistContrib        |
| `Importe`                                    | importe            |

Notas de mapeo robusto:
- Las claves traen espacios/dos puntos; normalizar (trim) o comparar por clave exacta conocida.
- Fila con `nombre_campo: null` y `valor_campo: "votar_internas"` → marcador, ignorar.
- Clave `Departamento:` aparece dos veces por formulario (una con el nombre real, otra con `"0"`); tomar el valor no numérico / distinto de `"0"`.
- Estado de una adhesión recién sincronizada: `estado = "pendiente"`.

## API Contract (nuevo endpoint backend)

### POST /adhesiones/web/sincronizar

**Description**: Dispara la sincronización incremental de adhesiones web desde el endpoint externo del PN.
**Auth**: JWT (igual que el resto de `/adhesiones/*`).

**Request**: sin body (o body vacío `{}`).

**Response (200)**:
```json
{
  "nuevas": 12,                              // int - adhesiones insertadas en esta corrida
  "duplicadasIgnoradas": 55,                 // int - identificadores ya conocidos, no reinsertados
  "desde": "2026-06-28 00:00:00",            // string - fecha usada como piso (marca ?? ahora-3d)
  "ultimaSincronizacion": "2026-06-30 11:30:48"  // string - nueva marca = max(fecha_hora_registro) procesado (null si no hubo filas)
}
```

**Error Responses**:
| Code | Error | Description |
|------|-------|-------------|
| 401 | UNAUTHORIZED | Falta/expira el JWT del usuario. |
| 502 | EXTERNAL_UNAVAILABLE | Endpoint externo caído/timeout. No mueve la marca. |
| 502 | ERROR_CREDENCIALES | El endpoint externo devolvió `error:1`. No persiste, no mueve la marca. |
| 500 | INTERNAL_ERROR | Fallo de mapeo/persistencia. |

## Frontend (este repo)

### AdhesionesService (`src/app/features/adhesiones/adhesiones.service.ts`)

Agregar método + tipo de respuesta:
```ts
export interface SincronizacionResult {
  nuevas: number;
  duplicadasIgnoradas: number;
  desde: string;
  ultimaSincronizacion: string | null;
}

sincronizarWeb() {
  return this.http.post<SincronizacionResult>(`${this.base}/web/sincronizar`, {});
}
```

### AdhesionesListadoComponent (`adhesiones-listado.component.ts`)

- Botón "Sincronizar Nube" (línea ~41): pasar de `(click)="reloadWeb(); reloadStats()"` a `(click)="sincronizarNube()"`.
- Inyectar `AdhesionesService`.
- Signal `sincronizando = signal(false)` para el estado de carga; deshabilitar el botón mientras corre (`[disabled]="sincronizando()"`) y mostrar texto tipo "Sincronizando…".
- `sincronizarNube()`:
  - `sincronizando.set(true)`
  - `adhesionesSvc.sincronizarWeb().subscribe({ next: r => { mostrar resumen "r.nuevas nuevas, r.duplicadasIgnoradas ya existían"; reloadWeb(); reloadStats(); }, error: () => mostrar error, complete/finalize: () => sincronizando.set(false) })`
- Feedback del resumen: por ahora mensaje inline/simple (no hay sistema de toasts todavía — DEBT-002). Evitar `alert()` bloqueante; usar un signal con el mensaje y renderizarlo en el template.

## Data Model & Storage (backend — repo espejo)

- **Adhesión web**: persistir con clave natural `identificador_formulario` (único). Campos mapeados arriba + `estado`.
- **Histórico de identificadores vistos** (dedupe permanente): registro de todo `identificador_formulario` procesado alguna vez, independiente de si la adhesión web sigue activa, fue eliminada o pasada a local. Puede ser la propia PK natural si nunca se borra el registro base, o una tabla/columna dedicada de "identificadores vistos".
- **Marca de última sincronización**: valor único de estado (tabla settings/estado de sync) con el `max(fecha_hora_registro)` de la última corrida exitosa; nullable (null en primer arranque → default 3 días).
- Eliminar la data **mockeada** que hoy alimenta `GET /adhesiones/web`.

## External Integrations

### Endpoint externo del Partido Nacional
- **Purpose**: fuente de las adhesiones cargadas vía formulario web del sitio del PN.
- **Auth**: `password` por query string (config del backend).
- **Failure handling**: en error/timeout/credenciales → abortar sin persistir y sin mover la marca; el usuario puede reintentar. Sin retry automático en v1.

## Non-Functional Requirements

- **Security**: el `password` del endpoint externo NO se commitea (config/env del backend, patrón CLAUDE.md → Secrets). El FE nunca lo ve. La llamada externa es server-side.
- **Idempotencia**: syncs repetidas no duplican (dedupe permanente por `identificador_formulario`).
- **Performance**: ventana externa ~1100 filas / ~67 formularios → agrupación y filtrado en memoria triviales. Respuesta esperada < 3s (dominada por la latencia del endpoint externo).

## Implementation Notes

- El grueso del trabajo es backend (repo espejo `administracion-pn-backend`); el FE es un cambio chico (service + botón + estado de carga + mensaje).
- No confiar nunca en `fecha_hora` server-side: todo el filtrado incremental es responsabilidad del backend.
- Dedupe permanente > filtro por fecha: el filtro por fecha reduce el set; el dedupe por identificador es la garantía real contra reinserción (incluye adhesiones eliminadas/pasadas a local — AC-9).
- Referenciar el ID espejo del backend cuando se cree el ítem correspondiente.
