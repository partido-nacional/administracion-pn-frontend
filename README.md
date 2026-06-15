# Administración PN — Frontend

App Angular 17 (standalone components + signals) para el sistema de administración partidaria. Especificación (fuente de verdad, derivada del código): `project/specs/architecture.md` y `project/specs/features/`.

## Requisitos

- Node 18+
- Angular CLI: `npm install -g @angular/cli`

## Setup

```bash
npm install
npm start
```

Abre `http://localhost:4200`.

## Login

- Usuario: `admin`
- Clave: `admin123`

Asegurate de tener el backend corriendo en `http://localhost:5000` (ver `administracion-pn-backend/README.md`).

## Estructura

```
src/app/
  core/           # auth, guard, interceptor, page-title
  layout/         # shell (sidebar + topbar)
  features/
    auth/         # login
    dashboard/    # inicio (stats + calendario)
    agenda/       # contactos — CRUD
    adhesiones/   # pendientes web + locales
    productos/    # CRUD + stock
    stubs/        # componente genérico para módulos en construcción
  app.routes.ts
  app.config.ts
```

## Módulos funcionales

Auth, Dashboard, Agenda, Adhesiones, Productos.

## Módulos stub

Listados, Débitos, Organismos, Agrupaciones, Convencionales.

## API

Configurable en `src/environments/environment.ts` (por defecto `http://localhost:5000/api`).
