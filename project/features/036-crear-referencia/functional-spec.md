# Functional Specification: Crear referencia partidaria a mano

**Status**: Approved (2026-10-03) · **Created**: 2026-10-03 · **Repo**: solo frontend (el backend ya expone `POST /api/organismos/referencias`)

## Problem Statement
Hoy una referencia partidaria solo se crea sola, al finalizar un integrante de un organismo partidario. No hay forma
de cargar una a mano: por ejemplo, un cargo que no pasó por una ficha de integrante. El endpoint existe, pero las
vistas de referencias solo permiten editar.

## Acceptance Criteria
- AC-1: **Referencias de un contacto**: botón **"+ Crear referencia"** arriba de la lista. Abre un formulario con el
  contacto ya fijo y estos campos: **Organismo** (opcional, buscador entre los organismos partidarios), **Rol / Cargo**
  (obligatorio), Período, Fecha de designación, Fecha de cese, Art. 44 y Notas.
- AC-2: **Referencias de un organismo**: botón **"+ Crear referencia"**, con el organismo ya fijo y un **buscador de
  contacto** (por nombre o cédula) obligatorio, más los mismos campos. El botón solo aparece si el organismo es
  partidario (el backend rechaza referencias en organismos no partidarios).
- AC-3: Al guardar se crea la referencia, se cierra el formulario, se muestra un aviso de éxito y la lista se
  recarga. La nueva fila es una referencia normal (editable).
- AC-4: Sin rol, o sin contacto en la vista del organismo → mensaje en el formulario y no se envía.
- AC-5: Si el backend rechaza (por ejemplo, organismo no partidario) → el mensaje del backend aparece en el formulario,
  que queda abierto.
- AC-6: Si la referencia creada es del mismo contacto + organismo que una fila calculada "Desde integrante", esa
  fila deja de aparecer al recargar (regla de la feature 035/038).

## Out of Scope
- Convertir una fila calculada en referencia real con un botón (descartado por el usuario).
- Borrar referencias.
