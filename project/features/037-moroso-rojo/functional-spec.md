# Functional Specification: Resaltado del moroso en rojo

**Status**: Approved (2026-10-05)

## Problem Statement
En la grilla de contactos (Agenda), la fila de un contacto moroso tenía fondo `#fdecea`, un rosa casi blanco que
apenas se distinguía de las filas comunes.

## Acceptance Criteria
- AC-1: La fila del moroso (y su área desplegada) tiene fondo **`#e85d5d`**, el color elegido por el usuario. Al pasar
  el mouse se oscurece un poco (`#e04a4a`). Desplegada, lleva una barra lateral bordó (`#8e1b1b`).
- AC-2: El texto negro sigue legible (contraste 5,4:1, WCAG AA).
- AC-3: En tema oscuro se usa `#9b2c2c` (con texto claro el contraste es 7:1; el `#e85d5d` con texto blanco no se
  leería).
- AC-4: Las filas no morosas no cambian.
