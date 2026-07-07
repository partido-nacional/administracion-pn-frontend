# Organismos — Integrantes Inline

Reemplaza la pestaña global **"Integrantes"** de la vista Organismos por integrantes **contextuales por organismo**: al desplegar (expandir) una fila en "Todos los Organismos", se muestran inline los integrantes de ese organismo.

## Qué se construyó

- **Pestaña "Integrantes" eliminada** (tab, filtros, señal, computeds y rama de CSV asociados).
- **Filas expandibles** en "Todos los Organismos" (patrón acordeón, una sola abierta a la vez), reutilizando el estilo `clickable`/`detalle-row` de `integrantes-contacto`.
- **Carga lazy + caché por organismo**: los integrantes se piden en el primer expand (`getIntegrantes(ambito, id)`) y se cachean por clave `${ambito}:${id}`; re-expandir no dispara nueva petición.
- **Estados** loading / vacío / error (con botón Reintentar) dentro de la fila-detalle.

## Componentes clave

| Archivo | Cambio |
|---------|--------|
| `core/models/organismos.ts` | Nueva interface exportada `IntegranteOrg` (antes inline en el componente). |
| `core/services/organismos.service.ts` | Nuevo `getIntegrantes(ambito, id)`. |
| `features/organismos/organismos.component.ts` | Filas expandibles + estado (`expandedOrgKey`, `integrantesPorOrg`, `orgLoading`, `orgError`) y helpers `orgKey/isExpanded/integrantesDe/toggleOrg/loadIntegrantes`; se elimina la tab Integrantes. |
| `*.spec.ts` (service + componente) | Tests de `getIntegrantes` y de toggle/acordeón/caché/estados/ausencia de tab. |

## API consumida

`GET /organismos/{estatales|partidarios}/{id}/integrantes` → `IntegranteOrg[]` (200 con `[]` si no hay integrantes).

## Tests

`ng test` (Karma/ChromeHeadless): **139 SUCCESS**. Cobertura de la feature: URL por ámbito, expand/colapso, acordeón, caché (no refetch), estados vacío/error, reintento, ausencia de la tab.

## Dependencia cross-repo (pendiente)

El endpoint `GET /organismos/{ambito}/{id}/integrantes` es un **ítem espejo** que debe existir en `administracion-pn-backend`. El frontend compila y testea con mocks; la integración end-to-end lo requiere. Hasta entonces, contra backend real la fila-detalle mostrará el estado de error.
