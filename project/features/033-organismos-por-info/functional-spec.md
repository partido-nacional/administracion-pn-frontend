# Functional Specification: Organismos agrupados por info de organización

**Status**: Approved (2026-10-03)
**Created**: 2026-10-03
**Espejo**: backend `036-organismos-por-info` (endpoints que necesita esta pantalla)

## Problem Statement

Desde la feature 035/032, cada organismo apunta a su **info de organización**, que es un grupo compartido
(por ejemplo, "Municipios en Canelones" agrupa 63 organismos). La pantalla Organismos sigue teniendo dos pestañas
desconectadas: "Todos los Organismos" (grilla plana de 923 filas) e "Info de la Organización" (una grilla sin
nombre, que solo muestra Id, dirección y teléfono). Lo natural es navegar **info → organismos → integrantes**.

## Objectives

- [ ] Una sola pantalla: la lista de infos de organización, cada una desplegable con sus organismos.
- [ ] Cada organismo desplegado se ve y se comporta igual que una fila de la grilla de organismos actual
      (mismas columnas, editar, botón de referencias, despliegue de integrantes).
- [ ] Buscador por nombre de organismo.
- [ ] Ningún organismo queda inaccesible (los que no tienen info van a una fila especial).

## Out of Scope

- Los filtros de clasificación, departamento y Art. 44 de la grilla de organismos se quitan (decisión del
  usuario: solo el buscador por nombre).
- No cambia el modelo de datos (sin columnas nuevas): el nombre de la info se deriva de sus organismos.
- Las otras vistas de organismos (por contacto, referencias, alta de integrante) no cambian.

## User Stories

### US-1: Navegar info → organismos
**As a** usuario de Organismos **I want to** desplegar una info de organización y ver sus organismos
**So that** encuentre los organismos agrupados como en el sistema viejo.

- AC-1: Se elimina la pestaña "Todos los Organismos". La pantalla `/organismos` muestra solo la lista de infos.
- AC-2: Cada fila de info muestra su **nombre**, tomado del `NombreCompania` de sus organismos (ej.
  "PARTIDO NACIONAL - Directorio"), la cantidad de organismos y los datos que ya tiene (Id, tipo, dirección,
  teléfono, email, observaciones, editar).
- AC-3: Una info sin organismos (17) muestra "Info #<id>" como nombre y "0" organismos; no se puede desplegar.
- AC-4: Al desplegar una info se listan **todos** sus organismos (sin paginar dentro del desplegable: el máximo
  es 63), ordenados por nombre.
- AC-5: La fila de organismo tiene la misma estructura que la grilla actual: Id, Clasificación (badges),
  Nombre, Descripción, Dirección, Ciudad, Departamento, País, Art. 44, Orden Dpto., Observaciones, editar y
  "Referencias partidarias".
- AC-6: Al desplegar un organismo se ven sus integrantes, igual que hoy.
- AC-7: La lista de infos se ordena por nombre y está paginada como hoy.

### US-2: Buscar por nombre de organismo
**As a** usuario **I want to** buscar un organismo por nombre **So that** no tenga que recorrer las infos.

- AC-8: Hay un buscador "Buscar organismo…" arriba de la lista. Usa la misma comparación que los demás
  filtros: sin acentos ni mayúsculas, por "contiene".
- AC-9: Con texto, la lista muestra **solo las infos que tienen al menos un organismo que coincide**, y al
  desplegarlas se ven **solo los organismos que coinciden**.
- AC-10: Sin coincidencias → "Sin resultados".
- AC-11: Al cambiar el texto se vuelve a la página 1 y se colapsan los desplegables abiertos.

### US-3: Organismos sin info
- AC-12: Si hay organismos sin info (8 hoy) que pasan el filtro, aparece una fila especial
  **"Sin info de organización"** al principio de la lista, desplegable igual que las demás. Si no hay, no aparece.

### US-4: Alta y edición
- AC-13: Se mantienen "+ Nueva Info" y "+ Nuevo Organismo" arriba. Editar una info o un organismo actualiza
  la lista. Si al editar un organismo cambia su info, pasa a mostrarse bajo la info nueva.
- AC-14: El CSV exporta las infos (con nombre y cantidad de organismos) y respeta el buscador.

## Business Rules

- BR-1: Nombre de una info = `NombreCompania` de sus organismos (todos los de una misma info tienen el mismo,
  verificado sobre los datos); si no tiene organismos o el nombre está vacío → "Info #<id>".
- BR-2: El buscador filtra por `Organismo.Nombre`, no por el nombre de la info.

## Edge Cases

- EC-1: Info con 63 organismos ("Municipios en Canelones"): se listan todos al desplegar.
- EC-2: Error al cargar los organismos de una info o los integrantes de un organismo: mensaje y "Reintentar"
  dentro del desplegable, como hoy.
- EC-3: Se crea un organismo sin info → aparece en "Sin info de organización".
