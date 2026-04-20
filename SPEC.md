# Administración PN — Especificación Técnica

Sistema de administración partidaria. Backend en .NET 8 + Angular 17, basado en los mockups en `mockups/`.

## Repos

- **Backend**: `ChrisReznio/administracion-pn-backend` (privado) — .NET 8 Web API
- **Frontend**: `ChrisReznio/administracion-pn-frontend` (privado) — Angular 17

## Stack

### Backend
- .NET 8 / ASP.NET Core Web API
- EF Core 8 + SQLite (dev) / SQL Server (prod)
- Migraciones EF Core
- Autenticación JWT
- Swagger/OpenAPI
- Serilog (logging básico)
- AutoMapper

### Frontend
- Angular 17 (standalone components + signals)
- Angular Router
- HttpClient con interceptor JWT
- RxJS
- Plantillas HTML/CSS basadas 1:1 en los mockups (mismo sidebar, topbar, paleta)
- Sin frameworks UI pesados (los mocks ya están en HTML/CSS plano)

## Alcance — MVP funcional vs Stubs

### Funcional (CRUD completo + UI conectada)
1. **Autenticación / Login**
2. **Dashboard** (resumen + calendario)
3. **Agenda** (contactos)
4. **Adhesiones** (web pendiente + locales)
5. **Productos** (productos, ventas, donaciones)

### Scaffolded (entidades + endpoints stub + componentes vacíos navegables)
- Débitos
- Agrupaciones (grupos, miembros, padrón electoral)
- Convencionales (ODN/ODD)
- Organismos (jerarquía Tipo/Estatal/Partidaria)
- Listados / Auditoría
- Calendario de eventos

## Modelo de datos (26 entidades)

Origen: `mockups/db-schema.drawio`. Mapeo módulo → tablas:

### Agenda
- `Contacto` — datos personales, contacto, dirección, laboral

### Adhesiones
- `AdhesionWeb` — bandeja de pendientes (sin FK a Contacto hasta "pasar a local")
- `AdhesionLocal` — adhesión confirmada, FK a Contacto

### Débitos
- `Debito` — débito automático
- `TipoTarjeta` — Visa/Master/Amex/etc.

### Agrupaciones
- `Agrupacion`
- `AgrupacionIntegrante` — doble FK a Agrupacion (origen + actual)
- `PadronElectoral`
- `EleccionInterna`

### Convencionales
- `Convencional` — Nacional o Departamental
- `Lista` — ODN / ODD
- `IntegranteLista` — FK con etiqueta ODN/ODD

### Organismos
- `TipoOrganismo`
- `OrganismoEstatal`
- `OrganismoPartidario`
- `InfoOrganizacion` — triple FK opcional (a uno de los 3 tipos)
- `MiembroOrganismo`
- `ReferentePartidario`

### Productos
- `Producto`
- `Stock`
- `Venta`
- `DetalleVenta`
- `Donacion`

### Sistema
- `Usuario`
- `Rol`
- `MovimientoAuditoria` — log de acciones

### Calendario
- `EventoCalendario`

## Endpoints principales (REST)

```
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/contactos
GET    /api/contactos/{id}
POST   /api/contactos
PUT    /api/contactos/{id}
DELETE /api/contactos/{id}

GET    /api/adhesiones/web
POST   /api/adhesiones/web/{id}/pasar-a-local
GET    /api/adhesiones/locales
POST   /api/adhesiones/locales

GET    /api/productos
POST   /api/productos
PUT    /api/productos/{id}
GET    /api/productos/{id}/stock
POST   /api/ventas
GET    /api/ventas
POST   /api/donaciones
GET    /api/donaciones

GET    /api/dashboard/resumen
GET    /api/calendario/eventos
```

Stubs (devuelven `[]` o 501 hasta implementarlas):
```
/api/debitos/*
/api/agrupaciones/*
/api/convencionales/*
/api/organismos/*
/api/listados/*
```

## Autenticación

- Login con usuario/clave → devuelve JWT (15 min) + refresh token (7 días)
- Frontend guarda en `localStorage`, interceptor agrega `Authorization: Bearer ...`
- Backend usa `[Authorize]` en todos los endpoints excepto `/api/auth/login`

## Seed inicial

- 1 usuario admin: `admin / admin123` (rol Administrador)
- Catálogos básicos: tipos de tarjeta, tipos de organismo

## Estructura de carpetas

### Backend
```
src/
  AdministracionPn.Api/         # Controllers, Program.cs
  AdministracionPn.Domain/      # Entidades + enums
  AdministracionPn.Infrastructure/  # DbContext, Migrations, Repos
  AdministracionPn.Application/ # DTOs, Services, Mappings
tests/
  AdministracionPn.Tests/
```

### Frontend
```
src/
  app/
    core/           # auth, interceptors, guards
    layout/         # sidebar, topbar, shell
    shared/         # componentes y pipes comunes
    features/
      auth/
      dashboard/
      agenda/
      adhesiones/
      productos/
      debitos/        (stub)
      agrupaciones/   (stub)
      convencionales/ (stub)
      organismos/     (stub)
      listados/       (stub)
    app.routes.ts
    app.config.ts
  styles/
    _variables.css
    _layout.css   # extraído de los mocks
```

## Convenciones

- Terminología: **mantener nombres originales** de los mocks (no renombrar módulos)
- Scroll horizontal: solo en grillas (`overflow-x: auto` en `<table>`, `hidden` en `.main`/`.content`)
- Idioma: UI en español, código y nombres de entidades en español también (consistente con mocks)

## Entregables

1. Repo backend con: solución compilable, migración inicial, seed, CRUD funcional de los 5 módulos MVP, stubs del resto, README con instrucciones
2. Repo frontend con: app navegable, auth funcional, 5 módulos MVP conectados al backend, layout idéntico a los mocks, README

## Cómo correr (post-clone)

### Backend
```bash
cd administracion-pn-backend
dotnet restore
dotnet ef database update --project src/AdministracionPn.Infrastructure --startup-project src/AdministracionPn.Api
dotnet run --project src/AdministracionPn.Api
# API en http://localhost:5000, Swagger en /swagger
```

### Frontend
```bash
cd administracion-pn-frontend
npm install
npm start
# App en http://localhost:4200
```
