# Technical Specification: Adhesiones — Anuales por vencer

**Status**: Draft
**Created**: 2026-07-12

## Architecture Overview

Cross-repo.

**Backend** (`AdhesionesController`, `api/adhesiones`, ya con `[Authorize(Finanzas)]`):
- Nuevo `GET /api/adhesiones/anuales-por-vencer`: join `AdhesionesLocales` × `Contactos`, filtro `AporteConfirmado == true`, `SistContrib.ToLower() == "anual"`, `FechaVencimiento >= inicioMes && < inicioMesSiguiente` (mes+año actual, UTC). Proyecta a un DTO. Devuelve lista simple (dataset chico: los anuales que vencen en un mes).

**Frontend** (`adhesiones-listado.component.ts`):
- Nueva tab `'anuales'` ("Anuales por vencer") en la barra de tabs; bloque `@if (tab()==='anuales')` con la tabla + total + estado vacío.
- Servicio: `AdhesionesService.anualesPorVencer()` → GET.
- Botón de WhatsApp por fila: helper `waLink(celular, nombre, vencimiento)` que normaliza el teléfono y arma el deep link; si no hay número válido, no se renderiza el botón.

## API Contract

### GET /api/adhesiones/anuales-por-vencer
- **200**: `AnualPorVencerDto[]`
```json
[{ "contactoId": 718, "nombre": "Juan", "apellido": "Pérez",
   "celular": "099626036", "sistContrib": "ANUAL", "vencimiento": "15/07/2026" }]
```
- Auth: rol Finanzas (Hacienda/IT), heredado del controller.

## Data Model & Storage

`AdhesionLocal` (SistContrib, AporteConfirmado, FechaVencimiento) + `Contacto` (Nombre, Apellido, Celular). **Sin cambios de schema.**

## External Integrations

WhatsApp vía deep link `https://wa.me/<telefono>?text=<mensaje URL-encoded>`. No usa API oficial; abre WhatsApp (app/web) con el mensaje pre-cargado en una pestaña nueva (`target="_blank"`).

### Normalización de teléfono (UY)
```
digits = celular.replace(/\D/g,'')
if empieza con '0' → quitar el 0
if no empieza con '598' → anteponer '598'
if length < 11 → inválido (no se muestra el botón)
```
Mensaje: `Hola {nombre}, te recordamos desde el Partido Nacional que tu adhesión anual vence el {vencimiento}. ¡Gracias por tu apoyo!`

## Error Handling

| Code | Comportamiento |
|------|----------------|
| 4xx/5xx | Toast global (feature 021); la tabla queda vacía |

## Non-Functional Requirements

- Security: rol Finanzas (Hacienda/IT), como el resto de adhesiones. El `wa.me` no expone datos sensibles más allá del teléfono y el mensaje.
- Tests (production):
  - Backend: el filtro devuelve solo anuales+confirmados+vencimiento del mes actual; excluye no-anuales, no-confirmados y vencimientos de otros meses.
  - Frontend: `waLink` normaliza bien (099… → 598…), oculta el botón sin celular, y arma el mensaje con nombre+fecha.

## Implementation Notes

- La tabla espeja el estilo de "Adhesiones Locales"; columna de acción a la derecha con el botón de WhatsApp (ícono/verde).
- El total se muestra en el encabezado de la sección.
- `SistContrib` comparado case-insensitive por las dudas ("ANUAL"/"Anual").
