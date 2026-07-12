# Feature 023 — Agrupaciones: alta/baja de integrantes (TODO-008)

Solo frontend. Usa endpoints del backend ya existentes.

## Qué se construyó

En Agrupaciones → tab "Por Período", sección "Integrantes" del detalle expandido:
- Botón **"+ Agregar integrante"** → form inline: **autocomplete de contacto** (server-side vía `ContactosService.listado`, debounce 250ms) + **Cargo** (opcional) + **Fecha de ingreso** (default hoy) → `POST /agrupacion-integrantes`.
- **"Quitar"** por fila → `confirm()` con el nombre → `DELETE /agrupacion-integrantes/{id}` (borrado físico).
- Tras cada alta/baja → `load()` refresca la tabla (la fila expandida se mantiene).
- Errores por el toast global (feature 021).

## Fuera de alcance

- Edición de un integrante: el backend no expone PUT (se quita y se re-agrega).

## Tests

+4 (`agrupaciones-por-periodo.component.spec`): POST con el body correcto + refresco, no guarda sin contacto, quitar con confirm → DELETE, quitar cancelado no borra. Suite **161**, build limpio.
