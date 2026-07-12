# Functional Specification: Adhesiones — Anuales por vencer

**Status**: Draft
**Created**: 2026-07-12

## Problem Statement

En Adhesiones, nueva sección **"Anuales por vencer"**: mostrar los contactos adheridos con forma de pago **anual** cuya adhesión vence en el **mes actual**, para poder avisarles por WhatsApp antes del vencimiento. Query de referencia (sistema viejo):

```sql
select c.idcontacto, c.nombres, c.apellidos, c.telefonomovil, a.aporteconfirmado, a.sistemacontribucion, a.vencimiento
from contactos c join AdhesionesLocal a on c.idcontacto = a.idcontacto
where a.aporteconfirmado = 'S' and a.sistemacontribucion = 'ANUAL'
  and a.vencimiento between (1º del mes) and (último día del mes)
```

## Mapeo al modelo actual (verificado)

- `aporteconfirmado = 'S'` → `AdhesionLocal.AporteConfirmado == true`
- `sistemacontribucion = 'ANUAL'` → `AdhesionLocal.SistContrib == "ANUAL"`
- `vencimiento` → `AdhesionLocal.FechaVencimiento`
- `telefonomovil` → `Contacto.Celular`

## Objectives

- [ ] Nueva sección/tab "Anuales por vencer" dentro de Adhesiones.
- [ ] Listar los adherentes anuales (confirmados) cuyo `FechaVencimiento` cae en el **mes+año actual**.
- [ ] Mostrar por fila: contacto (id, nombre, apellido), celular, sistema de contribución y fecha de vencimiento.
- [ ] Botón de **WhatsApp** por fila (a la derecha) que abre el chat con un mensaje pre-cargado de recordatorio.

## Out of Scope

- Selector de mes/año (se fija al mes actual, igual que la query original).
- Envío automático/masivo de mensajes (el botón abre WhatsApp manualmente, uno a uno).
- Integración con la API oficial de WhatsApp Business (se usa el deep link `wa.me`).
- Registrar/persistir que se avisó (no se guarda estado del recordatorio).

## User Stories

### US-1: Ver los anuales por vencer del mes
**As a** usuario de Hacienda/IT
**I want to** ver la lista de adherentes anuales cuya adhesión vence este mes
**So that** puedo contactarlos antes del vencimiento

#### Acceptance Criteria
- AC-1: La sección lista solo adhesiones con `AporteConfirmado == true`, `SistContrib == "ANUAL"` y `FechaVencimiento` dentro del **mes+año actual** (1º a último día).
- AC-2: Cada fila muestra: Id contacto, Nombre, Apellido, Celular, Sistema (ANUAL) y Fecha de vencimiento.
- AC-3: Si no hay coincidencias este mes, se muestra un estado vacío claro ("Sin anuales por vencer este mes").
- AC-4: El total de la sección es visible (cantidad de filas).

### US-2: Avisar por WhatsApp
**As a** usuario
**I want to** abrir WhatsApp con un mensaje ya escrito para el contacto
**So that** le aviso rápido que su anualidad está por vencer

#### Acceptance Criteria
- AC-5: Cada fila con celular tiene, a la derecha, un botón de **WhatsApp**.
- AC-6: Al clickearlo, se abre `https://wa.me/<telefono>?text=<mensaje>` en una pestaña nueva.
- AC-7: El mensaje pre-cargado es: **"Hola {Nombre}, te recordamos desde el Partido Nacional que tu adhesión anual vence el {vencimiento}. ¡Gracias por tu apoyo!"** (con el nombre y la fecha de la fila).
- AC-8: El teléfono se normaliza a formato internacional de Uruguay (prefijo país 598, sin el 0 inicial).
- AC-9: Si el contacto **no tiene celular** (o no se puede normalizar), el botón **no se muestra** en esa fila (la fila sí aparece).

## Business Rules

- BR-1: "Mes actual" = mes y año corrientes (calculado en el backend, UTC): `FechaVencimiento >= 1º del mes && FechaVencimiento < 1º del mes siguiente`.
- BR-2: Filtro completo: `AporteConfirmado == true` AND `SistContrib == "ANUAL"` (case-insensitive) AND vencimiento en el mes.
- BR-3: Normalización de celular UY: quitar no-dígitos; si empieza con `0`, quitarlo; anteponer `598`. Si el resultado no parece un móvil válido, se considera "sin celular" (AC-9).

## Edge Cases

- EC-1: Mes actual sin vencimientos anuales → estado vacío (AC-3).
- EC-2: Celular con formato raro/espacios/guiones → se normaliza; si no queda un número válido, se oculta el botón.
- EC-3: `FechaVencimiento` null → no entra al listado (el filtro por mes lo excluye).
- EC-4: Contacto sin nombre → el mensaje usa lo que haya (no rompe).

## Success Metrics

- Se puede ver de un vistazo a quién hay que renovar este mes y contactarlo por WhatsApp en un click.

## Feature Dependencies

- Backend: nuevo `GET /api/adhesiones/anuales-por-vencer` (join AdhesionesLocales + Contactos con el filtro).
- WhatsApp: deep link `wa.me` (sin API; abre la app/web con el mensaje pre-cargado).
