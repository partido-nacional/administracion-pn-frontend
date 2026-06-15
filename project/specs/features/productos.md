# Productos (Productos · Ventas · Donaciones · Stock)

**Estado:** Implementado (parcial — ver [No implementado / gaps](#no-implementado--gaps))
**Ruta:** `/productos`
**Componente:** `ProductosComponent` — `src/app/features/productos/productos.component.ts:520`

> Contexto transversal (Angular 17.3 standalone + signals, `authGuard`, `authInterceptor`, `apiUrl = http://localhost:5000/api`): ver `../architecture.md`. Esta spec no redocumenta esos aspectos.

---

## Propósito

Pantalla única que centraliza la gestión del catálogo de productos de la organización y sus operaciones asociadas, organizada en pestañas dentro de un solo componente standalone:

1. **Gestión de productos** — panel de métricas (stats) + tabla de **movimientos de stock** con filtros por columna.
2. **Listar productos** — catálogo (ABM): alta, edición y ajuste de stock de cada producto.
3. **Listar ventas** — historial de ventas + alta de venta (modal con buscador de producto y cálculo automático de recaudación).
4. **Listar donaciones** — historial de donaciones (solo lectura desde el front; ver gaps).

Todo vive en un único archivo: template y estilos inline, sin sub-componentes ni service intermedio (las llamadas HTTP se hacen con `HttpClient` directo).

---

## Rutas y navegación

- `app.routes.ts:20`: `{ path: 'productos', loadComponent: () => import('./features/productos/productos.component').then(m => m.ProductosComponent) }` — carga diferida (lazy) del componente standalone.
- La ruta cuelga del contenedor protegido por `authGuard` que monta `ShellComponent` como layout (`app.routes.ts:6-10`); por lo tanto `/productos` requiere sesión.
- El componente **no define rutas hijas ni navega programáticamente** (no inyecta `Router`). Toda la navegación interna es por **pestañas** y **modales**, manejada con el signal `tab`.

---

## Componente

Standalone, `imports: [CommonModule, FormsModule]` (`productos.component.ts:22-23`). Template inline (`:24-431`) y estilos inline (`:432-518`). Decorador en `:20`, clase en `:520`.

### Dependencias inyectadas (`productos.component.ts:521-523`)

- `HttpClient` — todas las llamadas a la API (no hay service intermedio).
- `PageTitleService` — fija el título de página a `'Productos'` en el constructor (`:756`).
- `AuthService` — para obtener el usuario logueado (`session()?.usuario`, ver `auth.service.ts:8,17`).

### Pestañas (tabs)

Tipo `type Tab = 'gestion' | 'listar' | 'ventas' | 'donaciones' | 'form'` (`:18`). Signal `tab = signal<Tab>('gestion')` (`:705`). Barra de pestañas en `:25-30` (solo expone 4 tabs visibles; `'form'` es interna, no es un botón de la barra):

| Tab | Etiqueta | Render | Contenido |
|---|---|---|---|
| `gestion` | "Gestion Productos" | `:32-99` | Toolbar de rango de fechas + botón "Generar reporte" (decorativos), 4 stat-cards y tabla de **movimientos** con filtros por columna y paginación estática. |
| `listar` | "Listar Productos" | `:101-167` | Botón "+ Nuevo Producto", tabla de productos con filtros por columna, acciones Editar / Stock. |
| `ventas` | "Listar Ventas" | `:169-217` | Toolbar (fechas + filtro comprador + botón "+ Nueva Venta"), tabla de ventas, acción "Eliminar" (decorativa). |
| `donaciones` | "Listar Donaciones" | `:219-264` | Toolbar (fechas + filtro destinatario + botón "+ Nueva Donacion" sin handler), tabla de donaciones, acción "Eliminar" (decorativa). |
| `form` | (sin botón) | `:266-284` | Formulario de alta/edición de producto (se llega vía `nuevoProducto()` / `editarProducto()`). |

Pestaña inicial: `'gestion'` (`:705`).

### Estado (signals)

| Signal | Tipo | Inicial | Línea | Rol |
|---|---|---|---|---|
| `tab` | `Tab` | `'gestion'` | `705` | Pestaña activa. |
| `productos` | `ProductoListado[]` | `[]` | `707` | Catálogo (origen de tabla "listar", buscador de venta, etc.). |
| `stats` | `Stats \| null` | `null` | `708` | Métricas de las stat-cards. |
| `movimientos` | `Movimiento[]` | `[]` | `709` | Movimientos de stock (tab gestión). |
| `ventas` | `Venta[]` | `[]` | `710` | Historial de ventas. |
| `donaciones` | `Donacion[]` | `[]` | `711` | Historial de donaciones. |
| `usuario` | `computed string` | `auth.session()?.usuario ?? 'desconocido'` | `525` | Usuario logueado (mostrado en modal de venta). |
| `ahora` | `string` | `''` | `526` | Timestamp local del modal de venta (`toLocaleString('es-UY')`). |
| `formP` | `Partial<ProductoListado>` | `{ activo: true, precio: 0 }` | `720` | Modelo (no-signal, mutable con `ngModel`) del formulario de producto. |

**Filtros reactivos (signals de texto/select), uno por columna:**

- Movimientos (`:713-714`): `fmFecha`, `fmProducto`, `fmTipo`, `fmCantidad`, `fmMotivo`, `fmObs`.
- Productos (`:715-716`): `fpId`, `fpNombre`, `fpDesc`, `fpPrecio`, `fpStock`, `fpEstado`.
- Ventas (`:717`): `fvComprador`.
- Donaciones (`:718`): `fdDest`.

**Computeds de filtrado (derivan las listas mostradas):**

- `movimientosFiltrados` (`:722-731`): combina includes (texto, case-insensitive) y match exacto (selects Tipo/Motivo). Helpers locales `t` (includes) y `e` (igualdad).
- `productosFiltrados` (`:733-743`): mismo patrón; `fpEstado` es match exacto.
- `ventasFiltradas` (`:745-748`): filtra por `v.comprador.includes(fvComprador)`.
- `donacionesFiltradas` (`:750-753`): filtra por `d.destinatario.includes(fdDest)`.

> Nota: las toolbars de rango de fechas (tabs gestión/ventas/donaciones) y los botones "Filtrar"/"Generar reporte" son **estáticos** — los `<input type="date">` no tienen binding y los botones no tienen `(click)`. La paginación ("< 1 >") también es decorativa (no pagina).

### Modal: Alta / edición de producto (tab `form`)

- Render `:266-284`. Título dinámico: `formP.id ? 'Editar' : 'Nuevo'` (`:269`).
- Campos con `[(ngModel)]`: Nombre (`:272`), Categoria (`:273`), Precio (`type=number step=0.01`, `:274`), Descripcion (textarea, `:275`).
- `nuevoProducto()` (`:768`): resetea `formP = { activo: true, precio: 0 }` y cambia a tab `'form'`.
- `editarProducto(p)` (`:769`): `formP = { ...p }` y tab `'form'`.
- `volver()` (`:770`): vuelve a tab `'listar'` (botón "Cancelar", `:279`).
- `guardar()` (`:772-778`): arma `body = { id, nombre, descripcion, precio, categoria, activo: activo ?? true }`; si `formP.id` existe → `PUT /productos/{id}`, si no → `POST /productos`; en éxito vuelve a `'listar'` y `reload()`. **Sin manejo de error ni de estado busy** en este flujo.

### Modal: Ajuste de stock

- Render `:286-353`. Se abre con `abrirStock(p)` desde el botón "Stock" de la tabla de productos (`:148`).
- Estado: `modalStock` (`signal<ProductoListado|null>`, `:528`), `sBusy` (`:529`), `sError` (`:530`), `sForm` (objeto mutable: `operacion: 'Alta'|'Baja'`, `cantidad`, `motivo`, `observaciones`, `:531-533`).
- Muestra stock actual y descripción (`:294-298`).
- Toggle de operación Alta (+ Ingreso) / Baja (− Baja) (`:302-307`); campo Cantidad (`type=number min=1`, `:312`); select **Motivo dependiente de la operación** (`:317-332`): para Alta → Ingreso/Reposición/Devolución/Ajuste; para Baja → Venta/Donación/Rotura/Ajuste/Pérdida; siempre + "Otro"; Observaciones (textarea, `:337`).
- `stockPreview` (computed, `:535-541`): `op==='Alta' ? stock + cantidad : stock - cantidad`. Se muestra como "Después del ajuste: {{ stockPreview() }}" (`:340-342`).
- `abrirStock(p)` (`:543-547`): resetea `sForm` a Alta/1, limpia error, setea `modalStock`.
- `cerrarStock()` (`:549-552`).
- `guardarStock()` (`:554-580`): validaciones — cantidad > 0 (`:557`), y en Baja no superar el stock actual (`:558-561`). Luego `POST /productos/{id}/stock/ajuste`; en éxito cierra y `reload()`; en error muestra `err?.error?.message || err?.message || 'No se pudo aplicar el ajuste.'` (`:577`).

### Modal: Nueva venta (con buscador de producto y recaudación automática)

- Render `:355-430`. Se abre con `abrirNuevaVenta()` desde el botón "+ Nueva Venta" (`:179`).
- Estado: `modalVenta` (`:582`), `vBusy` (`:583`), `vError` (`:584`); campos `vProductoId` (`signal<number|null>`, `:586`), `vUnidades` (`:587`), `vDescuento` (`:588`), `vNroRecibo` (`:589`), `vMetodoPago` (`:590`); combo: `vSearchOpen` (`:593`), `vSearchText` (`:594`).

**Buscador de producto (combo)** (`:363-387`):
- `productoSeleccionado` (computed, `:596-600`): busca en `productos()` por `vProductoId`.
- `nombreCounts` (computed privado, `:602-606`): cuenta cuántos productos comparten cada `nombre`.
- `labelProducto(p)` (`:608-615`): si el nombre se repite (>1) y hay descripción, muestra `"{nombre} · {descripcion}"`; si no, solo el nombre. (Resuelve ambigüedad de productos homónimos.)
- `productosBusqueda` (computed, `:617-625`): filtra `productos()` por `vSearchText` sobre nombre + descripción (case-insensitive), limitado a 50 resultados (`.slice(0,50)`).
- `onSearchInput(ev)` (`:639-643`): actualiza `vSearchText` y abre la lista.
- `seleccionarProducto(p)` (`:645-649`): fija `vProductoId`, cierra lista, limpia texto.
- El input muestra el label del producto cuando hay selección y la lista está cerrada; botón × para limpiar la selección (`:371-373`).
- `@HostListener('document:click') onDocClick()` (`:670-673`): cierra la lista del combo al clickear fuera (el combo hace `stopPropagation` en `:365`).

**Recaudación automática** (`:394-400`):
- `recaudacionSinDesc` (computed, `:627-631`): `precio * unidades`.
- `recaudacionCalc` (computed, `:633-637`): aplica descuento `d` acotado a `[0,100]`: `round(base * (1 - d/100) * 100)/100`. Se muestra formateado `| number:'1.2-2'` y, si hay descuento, también el monto sin descuento tachado (`:397-399`).

**Otros campos**: Unidades (`type=number min=1`, `:390`), Descuento % (`:391`), Nro. de recibo (`:402`), Método de pago (select obligatorio: Efectivo / Transferencia / Tarjeta Débito / Tarjeta Crédito / Cheque / MercadoPago / Otro, `:405-414`). Pie informativo: "Se registra automáticamente: {{ ahora() }} · vendedor: {{ usuario() }}" (`:416-419`).

- `abrirNuevaVenta()` (`:651-662`): resetea todos los campos, setea `ahora` con `new Date().toLocaleString('es-UY')`, abre el modal.
- `cerrarNuevaVenta()` (`:664-668`).
- `guardarVenta()` (`:675-703`): valida producto seleccionado (`:677`), unidades > 0 (`:679`), método de pago (`:680`), recaudación > 0 (`:682`); luego `POST /ventas/simple` con `{ productoId, unidades, recaudacion, nroRecibo|null, metodoPago }`; en éxito cierra y `reload()`; en error muestra `err?.error?.message || err?.message || 'No se pudo guardar la venta.'` (`:700`).

---

## API consumida

Todas relativas a `environment.apiUrl` (= `http://localhost:5000/api`, `environment.ts:3`). Todo vía `HttpClient` directo (sin service). El bearer token lo agrega el `authInterceptor` (ver `../architecture.md`).

| Método + ruta (relativa a apiUrl) | Vía | Dónde | Detalle |
|---|---|---|---|
| `GET /productos` | `http.get<ProductoListado[]>` | `productos.component.ts:761` (`reload`) | Catálogo → `productos.set(x)`. |
| `GET /productos/stats` | `http.get<Stats>` | `:762` (`reload`) | Métricas de las stat-cards → `stats.set(x)`. |
| `GET /productos/movimientos` | `http.get<Movimiento[]>` | `:763` (`reload`) | Movimientos de stock → `movimientos.set(x)`. |
| `GET /ventas` | `http.get<Venta[]>` | `:764` (`reload`) | Historial de ventas → `ventas.set(x)`. |
| `GET /donaciones` | `http.get<Donacion[]>` | `:765` (`reload`) | Historial de donaciones → `donaciones.set(x)`. |
| `POST /productos` | `http.post` | `:776` (`guardar`, alta) | Body: `{ id, nombre, descripcion, precio, categoria, activo }`. |
| `PUT /productos/{id}` | `http.put` | `:775` (`guardar`, edición) | Mismo body; `{id}` = `formP.id`. |
| `POST /productos/{id}/stock/ajuste` | `http.post` | `:564-569` (`guardarStock`) | Body: `{ operacion: 'Alta'\|'Baja', cantidad, motivo\|null, observaciones\|null }`. |
| `POST /ventas/simple` | `http.post` | `:686-692` (`guardarVenta`) | Body: `{ productoId, unidades, recaudacion, nroRecibo\|null, metodoPago }`. |

`reload()` (`:760-766`) dispara las 5 llamadas GET en paralelo; se invoca en el constructor (`:757`) y tras cada alta/edición/ajuste/venta exitosos.

**Endpoints mencionados pero NO consumidos por este componente:**
- `GET /productos/{id}/stock` — **no se usa**; el stock actual del modal sale del `ProductoListado` ya cargado (`modalStock()!.stock`), no de un fetch.
- `POST /ventas` (venta "completa") — **no se usa**; el front solo usa `POST /ventas/simple`.
- `POST /donaciones` (alta de donación) — **no se usa**; el botón "+ Nueva Donacion" (`:229`) **no tiene handler** (no abre modal ni llama API).

---

## Modelos / interfaces

Definidos localmente en el archivo (no compartidos):

**`ProductoListado`** (`productos.component.ts:9-12`):
```
id: number
nombre: string
descripcion?: string
precio: number
stock: number
estado: string        // 'Disponible' | 'Sin stock' | 'Stock bajo' (valores observados en filtros/badges)
activo: boolean
categoria?: string
```

**`Stats`** (`:13`):
```
productosUnicosTotales: number
productosSinStock: number
productosPocoStock: number   // definido pero NO mostrado en el template
ventasMes: number
donacionesMes: number
```

**`Movimiento`** (`:14`):
```
fecha: string
producto: string
tipo: string          // 'Alta' | 'Baja' (badges)
cantidad: number
motivo: string        // Ingreso | Venta | Donacion | Ajuste (opciones de filtro)
observaciones: string
```

**`Venta`** (`:15`):
```
id: string
fecha: string
producto: string
cantidad: number
precioUnit: number
total: number
comprador: string     // usado por el filtro fvComprador, no se muestra en la tabla
vendedor: string
metodoPago: string
nroRecibo: string
```

**`Donacion`** (`:16`):
```
id: string
fecha: string
producto: string
cantidad: number
destinatario: string
observaciones: string
```

**DTOs implícitos (bodies de request, no tipados como interface):**
- Producto (alta/edición): `{ id, nombre, descripcion, precio, categoria, activo }` (`:773`).
- Ajuste de stock: `{ operacion, cantidad, motivo, observaciones }` (`:565-568`).
- Venta simple: `{ productoId, unidades, recaudacion, nroRecibo, metodoPago }` (`:687-691`).

---

## Interacciones / UX

- **Filtros por columna con signals**: cada input/select de la fila de filtro escribe en su signal (`(ngModelChange)="fX.set($event)"`); los computeds `*Filtrados` recalculan reactivamente la tabla. Texto = includes case-insensitive; selects de Tipo/Motivo/Estado = match exacto.
- **Cambio de pestañas**: clicks en `.tab` hacen `tab.set(...)` (`:26-29`); el contenido se muestra con `@if (tab() === ...)`.
- **Buscador de producto en venta** (combo): escribir filtra hasta 50 productos; `labelProducto` desambigua homónimos con la descripción; click selecciona; × limpia; click fuera cierra la lista (`HostListener`).
- **Cálculo automático de recaudación**: cambia en vivo según producto, unidades y descuento (`recaudacionCalc`), con monto sin descuento tachado cuando aplica.
- **Ajuste de stock**: preview en vivo del stock resultante; validación cantidad>0 y, en Baja, no superar el stock; motivos contextuales según operación.
- **Registro automático**: la venta muestra fecha/hora local (`ahora()`) y vendedor (`usuario()` de la sesión) como informativos.
- **Estados de carga / error**: presentes en venta (`vBusy`/`vError`) y stock (`sBusy`/`sError`) con botón deshabilitado mientras `*Busy` y mensaje de error inline. **Ausentes** en alta/edición de producto (`guardar`, `:772-778`) y en los 5 GET de `reload()`.
- **Empty states** por tabla (`@empty`) cuando la lista filtrada queda vacía (`:84-86`, `:152-154`, `:202-204`, `:249-251`).

---

## Dependencias

- Angular: `Component, HostListener, computed, inject, signal` (`productos.component.ts:1`), `CommonModule` (`:2`), `FormsModule` (`:3`, para `ngModel`), `HttpClient` (`:4`).
- `environment` (`:5`) para `apiUrl`.
- `PageTitleService` (`:6`, `src/app/core/page-title.service.ts`) — fija título "Productos".
- `AuthService` (`:7`, `src/app/core/auth.service.ts`) — `session()?.usuario` para mostrar el vendedor.
- Layout `ShellComponent` como contenedor de ruta (`app.routes.ts:9`), protegido por `authGuard` (`app.routes.ts:8`).
- API backend: módulos `productos`, `ventas`, `donaciones`.

---

## No implementado / gaps

- **Donaciones es solo lectura desde el front**: el botón "+ Nueva Donacion" (`:229`) no tiene `(click)` ni modal; no se consume `POST /donaciones`. El filtro de fecha y "Eliminar" (`:247`) son decorativos.
- **Eliminar venta / movimiento**: el enlace "Eliminar" en ventas (`:200`) y donaciones (`:247`) es un `<a>` sin handler ni llamada `DELETE`.
- **Filtros de rango de fecha decorativos**: los `<input type="date">` de las toolbars (gestión `:36,38`; ventas `:173,175`; donaciones `:223,225`) no tienen binding; "Generar reporte para periodo" (`:39`) y "Filtrar" (`:177,227`) no tienen `(click)`.
- **Paginación falsa**: los controles "< 1 >" (`:91-95`, `:159-163`, `:209-213`, `:255-259`) son estáticos; muestran siempre "1–{filtradas} de {total}" sin paginar realmente.
- **Sin estado de carga/error en `reload()`** (`:760-766`): si algún GET falla, la sección queda vacía sin aviso.
- **Sin busy/error en alta/edición de producto** (`guardar`, `:772-778`): no deshabilita el botón ni informa errores; siempre navega a `'listar'`.
- **`GET /productos/{id}/stock` no se usa**: el stock del modal proviene del listado cacheado, no de un fetch fresco (posible desincronización).
- **`POST /ventas` (venta completa) no se usa**: solo `POST /ventas/simple`; no se captura comprador en el alta de venta (aunque `Venta.comprador` existe y se filtra por él).
- **`Stats.productosPocoStock` definido pero no mostrado** en las stat-cards (`:43-48`); tampoco se renderiza `donacionesMes` como tarjeta separada de "Donaciones este mes" usa `stats()?.donacionesMes` (`:47`).
- **`formP` sin tipado fuerte de venta/donación**; el alta de producto no captura `stock` inicial (no está en el form ni en el body).
- **`architecture.md` referenciada no existe aún** en `project/specs/` (al redactar esta spec solo existen `auth.md` y `dashboard.md`).
