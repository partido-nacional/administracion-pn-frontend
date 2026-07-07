# Technical Specification: Organismos — Integrantes Inline

**Version**: 1.0
**Status**: Draft
**Created**: 2026-07-07

## Architecture Overview

Cambio acotado a la feature **Organismos** del frontend (Angular 17.3, standalone + signals), con un **ítem espejo en el backend** (nuevo endpoint de lectura por id).

**Frontend** — `src/app/features/organismos/organismos.component.ts`:
- Se elimina la pestaña `'integrantes'` del `type Tab` y de todo su bloque de template, filtros, señal `integrantes`, computed `integrantesFiltrados`/`intDeptos`, filtros `fInt*`, la rama `integrantes` de `exportarCsvTab()`, la carga en `setTab()` y la interface inline `IntegranteOrg` local (se mueve a `core/models`).
- La tabla de **"Todos los Organismos"** pasa a tener **filas expandibles** (patrón ya existente en `integrantes-contacto.component.ts`: fila `clickable` + fila `detalle-row` condicional).
- Estado nuevo en el componente (signals):
  - `expandedOrgKey = signal<string | null>(null)` — clave del organismo abierto (`${ambito}:${id}`), acordeón (una sola abierta).
  - `integrantesPorOrg = signal<Record<string, IntegranteOrg[]>>({})` — caché de integrantes ya cargados.
  - `orgLoading = signal<Record<string, boolean>>({})` — loading por organismo.
  - `orgError = signal<Record<string, string>>({})` — error por organismo.
- `toggleOrg(o: OrganismoTodosDto)`: si ya está abierto → cerrar (`expandedOrgKey.set(null)`); si no → abrir y, si no hay caché, disparar `loadIntegrantes(o)`.
- `loadIntegrantes(o)`: setea loading, llama al service, guarda en caché o setea error; limpia loading. Guardar contra respuestas fuera de orden verificando la key contra el organismo pedido antes de escribir (EC-3).

**HTTP** — `src/app/core/services/organismos.service.ts`:
- Nuevo método tipado:
  ```ts
  getIntegrantes(ambito: Ambito, id: number): Observable<IntegranteOrg[]> {
    return this.http.get<IntegranteOrg[]>(`${this.base}/${this.ambitoPath(ambito)}/${id}/integrantes`);
  }
  ```
- Elimina la necesidad del `HttpClient` directo que hoy usa el componente para `/organismos/integrantes` (esa llamada desaparece).

**Modelos** — `src/app/core/models/organismos.ts`:
- Se agrega/mueve la interface `IntegranteOrg` (hoy inline en el componente) al modelo de dominio.

**Backend (cross-repo, `administracion-pn-backend`)**:
- Nuevo endpoint de lectura `GET /organismos/{estatales|partidarios}/{id}/integrantes` que devuelve los integrantes de ese organismo con el mismo shape que hoy produce `GET /organismos/integrantes`, filtrado por FK del organismo.

## API Contract

### GET /organismos/{ambitoPath}/{id}/integrantes
**Description**: Lista los integrantes de un organismo puntual, identificado por su id y ámbito. `{ambitoPath}` ∈ `estatales | partidarios`.
**Auth**: Requerido (JWT, igual que el resto de `/organismos`).

**Path params**:
| Param | Type | Description |
|-------|------|-------------|
| ambitoPath | string | `estatales` o `partidarios` (derivado del ámbito del organismo) |
| id | number | Id del organismo |

**Response (200)** — array (posiblemente vacío) con el shape actual de `IntegranteOrg`:
```json
[
  {
    "idContacto": 123,
    "credCivica": "ABC12345",
    "apellidos": "Pérez",
    "nombres": "Juan",
    "celular": "099123456",
    "mail": "jperez@example.com",
    "posicion": "Titular",
    "organismo": "Comisión Departamental",
    "departamento": "Montevideo"
  }
]
```

**Error Responses**:
| Code | Error | Description |
|------|-------|-------------|
| 401 | UNAUTHORIZED | Sin JWT válido |
| 404 | NOT_FOUND | Organismo inexistente para ese ámbito/id (opcional; puede devolver 200 con `[]`) |
| 500 | INTERNAL_ERROR | Error inesperado del backend |

> Nota: organismo sin integrantes → **200 con `[]`** (no 404), para que el front muestre estado vacío (AC-7).

## Data Model & Storage

Sin cambios de esquema. Se **reutiliza** el modelo existente.

### Interface `IntegranteOrg` (movida a `core/models/organismos.ts`)
| Field | Type | Description |
|-------|------|-------------|
| idContacto | number | Id del contacto |
| credCivica | string | Credencial cívica |
| apellidos | string | Apellidos |
| nombres | string | Nombres |
| celular | string | Celular |
| mail | string | Email |
| posicion | string | Posición en el organismo |
| organismo | string | Nombre del organismo (no se muestra en la grilla inline; se conserva por compatibilidad de shape) |
| departamento | string | Departamento |

### Estado de UI (en memoria, componente)
- `expandedOrgKey`, `integrantesPorOrg`, `orgLoading`, `orgError` — todo efímero, sin persistencia.

## External Integrations

Ninguna nueva. Consumo del propio backend `administracion-pn-backend` vía REST + JWT (interceptor `auth.interceptor` ya provee el token; `http-error.interceptor` maneja errores globales).

## Non-Functional Requirements

- **Performance**: carga **lazy** por organismo (solo al expandir) + **caché** en memoria (no refetch al re-expandir, AC-9). Evita traer la lista global de todos los integrantes de una.
- **Concurrencia**: al escribir el resultado de una petición, verificar que la key siga correspondiendo al organismo pedido para no pintar resultados cruzados (EC-3).
- **Security**: solo lectura; sin exponer endpoints nuevos de escritura. Mismos requisitos de auth que el resto de Organismos.
- **Accesibilidad/UX**: la fila expandible debe indicar estado (abierto/cerrado) e invitar al click (cursor + hover), reutilizando estilos del patrón `integrantes-contacto`.

## Implementation Notes

- **Reusar patrón existente**: copiar el enfoque de fila clickeable + `detalle-row` de `integrantes-contacto.component.ts` (estilos `.clickable`, `.selected`, `.detalle-row`, `.detalle-wrap`). La grilla anidada de integrantes va dentro de la `detalle-row` (colspan = nº de columnas de la tabla "Todos").
- **Acordeón**: una sola fila abierta (`expandedOrgKey` single value), coherente con `expandedId` de `integrantes-contacto`.
- **Key compuesta** `${ambito}:${id}` para diferenciar estatal/partidario con mismo id (EC-5).
- **Limpieza**: al eliminar la tab Integrantes, quitar también del CSV (`exportarCsvTab`) la rama `'integrantes'` y sus `CsvColumn`. El `import` de `environment`/`HttpClient` directo en el componente se elimina si ya no se usa para nada más (hoy se usa también para `referencias`; conservar mientras esa tab siga usándolo).
- **Tests** (project_type: production): al no haber runner montado (DEBT-001), como mínimo actualizar/extender `organismos.component.spec.ts` existente cuando el runner esté disponible; los ACs de toggle/caché/estados son los casos objetivo. Documentar en tasks si el runner sigue ausente al implementar.
- **Cross-repo**: registrar el endpoint como ítem espejo (convención de IDs cruzados del proyecto) — front depende de que exista en `administracion-pn-backend` antes de poder integrar de punta a punta.
