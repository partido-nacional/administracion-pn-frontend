# Technical Specification: Normalizar departamentos (frontend)

**Version**: 1.0
**Status**: Draft
**Created**: 2026-09-30
**Espejo**: backend `034-normalizar-departamentos` (limpieza de datos + normalización al guardar)

## Architecture Overview

### `core/departamentos.ts`
- Nuevo `DEPARTAMENTOS_CON_NACIONAL = [...DEPARTAMENTOS, 'Nacional']`.
- Nuevo `canonDepto(valor): string`: devuelve el canónico si `normDepto(valor)` coincide con uno de la lista (incluido Nacional); si no, `''`. Misma regla que `DepartamentoCanonico` del backend.

### Formularios (DEBT-015, AC-6/AC-7)
| Archivo | Hoy | Cambio |
|---|---|---|
| `agenda/agenda-nuevo.component.ts` | lista propia **sin tildes** + `credencialMap` sin tildes | `DEPARTAMENTOS`; `credencialMap` con nombres canónicos; al cargar un contacto para editar, el valor se pasa por `canonDepto` (o queda el original si no se reconoce) para que el `<select>` lo muestre seleccionado |
| `agrupaciones/agrupaciones.component.ts` | copia 19 + Nacional | `DEPARTAMENTOS_CON_NACIONAL` |
| `agrupaciones/agrupaciones-pendientes.component.ts` | `const DEPARTAMENTOS` local | `DEPARTAMENTOS_CON_NACIONAL` (se borra la constante local y el alias de la feature 030) |
| `shared/adhesiones/ficha-adhesion.constants.ts` | copia 19 + Nacional | reexporta desde `core/departamentos` (mismo nombre exportado: los consumidores no cambian) |

En los formularios de **edición**, un valor guardado que no está en la lista (una letra de serie, `ARGENTINA`) se sigue mostrando: se agrega como opción extra en vez de perderse en silencio. *(Ya pasaba con las letras de agrupaciones: el usuario decidió conservarlas.)*

### nueva-ficha (DEBT-016, AC-8/AC-9)
`adhesiones/nueva-ficha.component.ts:63`:
```ts
// antes: DEPARTAMENTOS.includes(c.departamento) ? c.departamento : ''
departamentoAgrupacion: canonDepto(c.departamento)
```

## API Contract

Sin cambios.

## Testing

- `canonDepto`: tabla de casos (MAYÚSCULAS, sin tilde, espacios, Nacional, letra, null).
- agenda-nuevo:
  - Escribir una credencial `KAB 123` deriva "Paysandú".
  - Editar un contacto con `PAYSANDÚ` deja "Paysandú" seleccionado.
  - Las opciones del dropdown son `DEPARTAMENTOS`.
- nueva-ficha: un contacto con `PAYSANDÚ` precarga "Paysandú"; uno con `ARGENTINA` deja el campo vacío.
- Agrupaciones y pendientes: el formulario ofrece `DEPARTAMENTOS_CON_NACIONAL`. Si un valor guardado no está en la lista, aparece como opción extra.
- Grep de control: no queda ninguna lista literal de departamentos fuera de `core/departamentos.ts`.
