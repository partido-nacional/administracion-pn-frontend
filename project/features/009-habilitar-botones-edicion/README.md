# 005 — Habilitar botones de edición + alta (Convencionales / Organismos)

## Qué se construyó

Se habilitaron los **4 botones de edición ("lápiz") colgados** en Convencionales y Organismos y se agregó
**alta (POST)** para esas mismas entidades, con modales de edición/creación consistentes con el resto de la app
(patrón de `agrupaciones.component.ts`). Los endpoints ya existían en el backend (implementados en la
contraparte `administracion-pn-backend`, documentados en `docs/INTEGRACION-FRONTEND.md` §7.9 y §7.10).

## Entidades en alcance

| Entidad | Vista / Tab | Alta | Edición | Endpoints |
|---|---|---|---|---|
| Convencional | Convencionales → Nacionales | ✅ | ✅ | `POST/PUT /api/convencionales[/{id}]` |
| Lista | Convencionales → ODN/ODD | ✅ | ✅ | `POST/PUT /api/convencionales/listas[/{id}]` |
| Organismo | Organismos → Todos | ✅ | ✅ | `POST/PUT /api/organismos/{estatales\|partidarios}[/{id}]` |
| InfoOrganización | Organismos → Info | ✅ | ✅ | `POST/PUT /api/organismos/info[/{id}]` |

**Fuera de alcance**: baja (DELETE), tabs sin botón (Convencional departamental, Integrante de lista,
TipoOrganismo, Integrante/Referente de organismo), y los 5 lápices que ya funcionaban.

## Componentes clave

- `core/models/convencionales.ts`, `core/models/organismos.ts` — DTOs/Inputs alineados al contrato real.
- `core/services/convencionales.service.ts`, `organismos.service.ts` — llamadas HTTP tipadas (DEBT-006);
  `organismos` resuelve la ruta `estatales`/`partidarios` según el `ambito`.
- `features/convencionales/convencionales.component.ts` — grillas Nacionales/Listas realineadas + modal alta/edición.
- `features/organismos/organismos.component.ts` — grillas Todos/Info realineadas + select de tipos + modal alta/edición.

## Detalles de comportamiento

- Modal con validación de obligatorios (`contactoId`/`fechaInicio` en Convencional; `nombre`/`tipoOrganismoId`
  en Organismo), botón "Guardando…" que evita doble-submit.
- Errores del backend (400 `FK_INVALID` / 404 `NOT_FOUND`) se muestran en el form sin cerrarlo.
- JWT y 401 gestionados por los interceptores globales (`authInterceptor`, `httpErrorInterceptor`).
- Tras guardar OK: cierre del modal + refetch acotado al tab (no recarga toda la app).

## Tests

35 tests nuevos (suite total **64/64** en verde):
- `convencionales.service.spec.ts` / `organismos.service.spec.ts` — URL/verbo/body de cada GET/POST/PUT y
  propagación de errores 400/404; resolución de ruta por ámbito.
- `convencionales.component.spec.ts` / `organismos.component.spec.ts` — apertura de modal (alta/edición),
  submit → service correcto + refetch, error → modal abierto con mensaje, ausencia de botones "no implementado".

## Deuda derivada

- **DEBT-014**: extraer el modal duplicado (agrupaciones/convencionales/organismos) a `shared/`.
- Nota: se verificó que el runner de tests ya está operativo → **DEBT-012** ("no hay runner") quedó desactualizado.
