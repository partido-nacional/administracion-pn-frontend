# Backend Backlog — CRUD de Convencionales y Organismos

> ✅ **COMPLETADO (2026-07-04).** Todos los ítems de abajo se implementaron en `administracion-pn-backend`
> y están documentados en `docs/INTEGRACION-FRONTEND.md` (§7.9 Convencionales, §7.10 Organismos): GET conectado
> a la DB + POST/PUT/DELETE por entidad. Este archivo queda como registro histórico del alcance backend.

Repo: **`administracion-pn-backend`** (.NET 8). Creado: 2026-07-04.

## Contexto (estado real del código)

- Las entidades de ambos dominios **ya existen** en `Domain/Entities/` y **ya tienen `DbSet` en
  `AppDbContext`** (`Infrastructure/Data/AppDbContext.cs`, líneas 19-27). No hay que crear entidades ni
  migraciones.
- Los endpoints **GET actuales devuelven datos mock en memoria** (arrays estáticos en
  `Api/Controllers/StubControllers.cs`), no consultan la DB.
- Faltan los endpoints de **Create / Update / Delete**, y **conectar los GET a la DB**.

Alcance: por cada entidad de los dos dominios → conectar el GET a la DB + agregar POST, PUT, DELETE.

## Definición de terminado (aplica a TODOS los ítems)

1. El endpoint persiste/lee vía `AppDbContext` (no arrays mock).
2. `[Authorize]` (igual que el resto de los controllers).
3. `PUT`/`DELETE` devuelven **404** si el `{id}` no existe.
4. Validar las FKs (ContactoId, OrganismoId, ListaId, etc.) antes de guardar.
5. Errores por el patrón existente (`ExceptionHandlingMiddleware` → `{ status, errorCode, message }`).

---

# DOMINIO A — CONVENCIONALES

Controller: `ConvencionalesController` (`StubControllers.cs:26`), ruta base `api/convencionales`.

## A1 — Convencional
- **DbSet**: `_db.Convencionales` · Entidad `Domain/Entities/Convencionales.cs:3`
- **Campos**: Id, ContactoId (FK Contacto), Tipo ("Nacional"/"Departamental"), Departamento, Condicion,
  Adherente (bool), NombreOrganismo, Posicion, FechaInicio (DateTime), FechaFin (DateTime?)
- **Hoy**: `GET /nacionales` y `GET /departamentales` devuelven mock (`StubControllers.cs:80-81`)
- **A implementar**:
  - `GET /nacionales` → `_db.Convencionales` where Tipo="Nacional" (reemplazar mock)
  - `GET /departamentales` → `_db.Convencionales` where Tipo="Departamental" (reemplazar mock)
  - `POST /api/convencionales` → crea; body: ContactoId, Tipo, Departamento, Condicion, Adherente, NombreOrganismo, Posicion, FechaInicio, FechaFin
  - `PUT /api/convencionales/{id}` → edita los mismos campos
  - `DELETE /api/convencionales/{id}` → borra

## A2 — Lista
- **DbSet**: `_db.Listas` · Entidad `Convencionales.cs:18`
- **Campos**: Id, Nombre, Tipo ("ODN"/"ODD"), AgrupacionId (FK Agrupacion, nullable)
- **Hoy**: `GET /listas/odn` y `GET /listas/odd` devuelven mock (`StubControllers.cs:83-84`)
- **A implementar**:
  - `GET /listas/odn` → `_db.Listas` where Tipo="ODN" (reemplazar mock)
  - `GET /listas/odd` → `_db.Listas` where Tipo="ODD" (reemplazar mock)
  - `POST /api/convencionales/listas` → crea; body: Nombre, Tipo, AgrupacionId
  - `PUT /api/convencionales/listas/{id}` → edita los mismos campos
  - `DELETE /api/convencionales/listas/{id}` → borra

## A3 — IntegranteLista
- **DbSet**: `_db.IntegrantesLista` · Entidad `Convencionales.cs:27`
- **Campos**: Id, ListaId (FK Lista), ConvencionalId (FK Convencional), Orden (int), Etiqueta
- **Hoy**: `GET /integrantes` devuelve mock (`StubControllers.cs:85`)
- **A implementar**:
  - `GET /integrantes` → `_db.IntegrantesLista` (reemplazar mock)
  - `POST /api/convencionales/integrantes` → crea; body: ListaId, ConvencionalId, Orden, Etiqueta
  - `PUT /api/convencionales/integrantes/{id}` → edita los mismos campos
  - `DELETE /api/convencionales/integrantes/{id}` → borra

---

# DOMINIO B — ORGANISMOS

Controller: `OrganismosController` (`StubControllers.cs:89`), ruta base `api/organismos`.

## B1 — OrganismoEstatal
- **DbSet**: `_db.OrganismosEstatales` · Entidad `Domain/Entities/Organismos.cs:9`
- **Campos**: Id, Nombre, NombreCompania, TipoOrganismoId (FK), Categoria, Descripcion, Direccion,
  Ciudad, Departamento, Pais, Art44 (bool), OrdenDpto (int), Observaciones
- **Hoy**: `GET /estatales` (y `GET /todos`) devuelven mock (`StubControllers.cs:138,134`)
- **A implementar**:
  - `GET /estatales` → `_db.OrganismosEstatales` (reemplazar mock)
  - `POST /api/organismos/estatales` → crea (campos de arriba menos Id)
  - `PUT /api/organismos/estatales/{id}` → edita
  - `DELETE /api/organismos/estatales/{id}` → borra

## B2 — OrganismoPartidario
- **DbSet**: `_db.OrganismosPartidarios` · Entidad `Organismos.cs:27`
- **Campos**: (idénticos a OrganismoEstatal) Id, Nombre, NombreCompania, TipoOrganismoId, Categoria,
  Descripcion, Direccion, Ciudad, Departamento, Pais, Art44, OrdenDpto, Observaciones
- **Hoy**: `GET /partidarios` devuelve mock (`StubControllers.cs:139`)
- **A implementar**:
  - `GET /partidarios` → `_db.OrganismosPartidarios` (reemplazar mock)
  - `POST /api/organismos/partidarios` → crea
  - `PUT /api/organismos/partidarios/{id}` → edita
  - `DELETE /api/organismos/partidarios/{id}` → borra
- **Nota**: el `GET /todos` (`StubControllers.cs:134`) del tab "Todos" hoy devuelve un mock unificado;
  con datos reales corresponde a OrganismoEstatal + OrganismoPartidario.

## B3 — TipoOrganismo
- **DbSet**: `_db.TiposOrganismo` · Entidad `Organismos.cs:3`
- **Campos**: Id, Nombre
- **Hoy**: no expone GET propio en el stub
- **A implementar**:
  - `GET /api/organismos/tipos` → `_db.TiposOrganismo`
  - `POST /api/organismos/tipos` → crea; body: Nombre
  - `PUT /api/organismos/tipos/{id}` → edita Nombre
  - `DELETE /api/organismos/tipos/{id}` → borra

## B4 — InfoOrganizacion
- **DbSet**: `_db.InfoOrganizaciones` · Entidad `Organismos.cs:45`
- **Campos**: Id, TipoOrganismoId (FK?), OrganismoEstatalId (FK?), OrganismoPartidarioId (FK?),
  Direccion, Telefono, Email, Observaciones
- **Hoy**: `GET /info` devuelve mock (`StubControllers.cs:135`)
- **A implementar**:
  - `GET /info` → `_db.InfoOrganizaciones` (reemplazar mock)
  - `POST /api/organismos/info` → crea
  - `PUT /api/organismos/info/{id}` → edita
  - `DELETE /api/organismos/info/{id}` → borra

## B5 — MiembroOrganismo
- **DbSet**: `_db.MiembrosOrganismo` · Entidad `Organismos.cs:60`
- **Campos**: Id, ContactoId (FK), OrganismoEstatalId (FK?), OrganismoPartidarioId (FK?), Cargo,
  FechaFin, PartidoSector, PosicionOrganismo, Orden (decimal?), Orden2 (decimal?), Nota, Condicion,
  FechaDesignacion, Activo (bool)
- **Hoy**: `GET /integrantes` devuelve mock (`StubControllers.cs:136`). Existe además
  `IntegrantesOrganismoController` con un DELETE lógico (`Activo=false`) de esta entidad.
- **A implementar**:
  - `GET /integrantes` → `_db.MiembrosOrganismo` (reemplazar mock)
  - `POST /api/organismos/integrantes` → crea
  - `PUT /api/organismos/integrantes/{id}` → edita
  - `DELETE /api/organismos/integrantes/{id}` → borra (definir si es físico o lógico; ya hay DELETE lógico en `IntegrantesOrganismoController`)

## B6 — ReferentePartidario
- **DbSet**: `_db.ReferentesPartidarios` · Entidad `Organismos.cs:82`
- **Campos**: Id, ContactoId (FK), OrganismoPartidarioId (FK), Rol
- **Hoy**: `GET /referencias` devuelve mock (`StubControllers.cs:137`)
- **A implementar**:
  - `GET /referencias` → `_db.ReferentesPartidarios` (reemplazar mock)
  - `POST /api/organismos/referencias` → crea; body: ContactoId, OrganismoPartidarioId, Rol
  - `PUT /api/organismos/referencias/{id}` → edita
  - `DELETE /api/organismos/referencias/{id}` → borra

---

## Total

9 entidades → 3 (Convencionales) + 6 (Organismos). Por cada una: conectar GET a la DB + POST + PUT + DELETE.
