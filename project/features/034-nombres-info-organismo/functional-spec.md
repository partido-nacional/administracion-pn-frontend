# Functional Specification: Nombre propio de la info de organización (corrección)

**Status**: Approved (2026-10-03) · **Espejo**: frontend `034-nombres-info-organismo`

## Problem Statement
Organismo e info de organización son entidades distintas con nombres distintos (en AGENDA: `NombreOrganismo` vs.
`NombreCompania`). La migración no creó el nombre de la info: lo copió a cada organismo (`Organismo.NombreCompania`),
y la feature 036 derivó el nombre de la info desde ahí. También completó la dirección del organismo con la de su info.
El usuario pidió que ninguna use nunca el nombre (ni los datos) de la otra.

## Acceptance Criteria
- AC-1: `InfoOrganizaciones.Nombre` con el `NombreCompania` del viejo para las 243 infos; editable desde la info.
- AC-2: Se elimina `Organismo.NombreCompania`; el organismo solo tiene su `Nombre`.
- AC-3: "Compañía" en Gobierno, Comisiones del Directorio, ficha de integrantes del contacto y alta de integrante
  = nombre de la info del organismo, por la relación. Totales iguales (Gobierno 20, Comisiones del Directorio 60).
- AC-4: La dirección del organismo es solo la propia: se vacían las 306 copiadas de la info (si no fueron editadas).
