# Checkpoint de validación del piloto (TASK-007)

**Fecha**: 2026-06-30
**Piloto**: `listados/movimientos` + `agenda/contactos`
**Ramas** (ambos repos): `feature/paginacion-ordenamiento-server-side` (pusheadas a origin)

## ⚠️ Antes de mergear a prod

- El **backend se escribió sin compilar** (no había .NET SDK en la máquina de build).
  **Dejá que el CI compile el PR del backend antes de mergear.** Un error de compilación
  rompería todo el build del backend, no solo estos endpoints.
- El **frontend sí** se compiló localmente (`npm run build` OK en cada paso).
- Mergear cada repo de forma **coordinada** (back y front juntos): el shape de respuesta
  cambió de `T[]` a `PagedResult<T>` en `/contactos` y `/listados/movimientos`. Si mergeás
  solo el front, esas dos vistas quedan rotas hasta que entre el back (y viceversa).

## Qué verificar en prod (o dev con backend arriba)

### Movimientos (`/listados/movimientos`)
- [ ] Carga solo la primera página (25 filas), no las ~2.341 de una.
- [ ] Los botones `<` / números / `>` navegan páginas reales.
- [ ] El contador "Mostrando X–Y de N" usa el total real del backend.
- [ ] Selector 25 / 50 / 100 cambia el tamaño de página.
- [ ] Filtros (usuario, acción, módulo, detalle) aplican server-side con debounce.
- [ ] Filtro de fecha: acepta `dd/mm/aaaa` completo (fragmentos parciales se ignoran).
- [ ] Click en encabezado ordena server-side (toggle asc/desc), reinicia a página 1.
- [ ] "Exportar a Excel" baja el **dataset completo filtrado** (no solo la página).

### Contactos (`/agenda`, tab "Todos los contactos")
- [ ] Carga paginada (25), no todo el padrón.
- [ ] Paginador funcional + contador con total real.
- [ ] Los 8 filtros por columna (id, nombre, cédula, credencial, depto, celular, email, adhesión) aplican server-side.
- [ ] Orden por columna server-side (simple; se retiró el multi-sort Shift+Click).
- [ ] Export CSV e Imprimir usan el **dataset completo filtrado** (all=true), no la página visible.
- [ ] La fila expandible de detalle y el botón WhatsApp siguen funcionando.

## Cambios de comportamiento conocidos (esperados)

- **Contactos**: se retiró el orden multi-columna (Shift+Click) → ahora orden simple por una columna (decisión acordada).
- **Contactos**: el filtro de **ID** pasó de "contiene" a **coincidencia exacta** (por seguridad de traducción SQL sin poder compilar). Revisar si molesta.
- **Movimientos**: el filtro de fecha pasó de "contiene texto dd/mm/aaaa" a **día calendario exacto** (ISO).

## Pendiente tras validar el piloto

- TASK-002 (tests backend del helper), TASK-004 (montar test runner front + tests).
- TASK-008..011 (replicar a las 17 grillas restantes), TASK-012 (tests controllers).
- TASK-013..015 (code / performance / security review).
