# administracion-pn-frontend — Claude Context

Frontend de Administración PN. Ver [README.md](README.md) para setup y `project/specs/` para la especificación (fuente de verdad derivada del código).

---

## Producto

SPA de **administración partidaria** (Partido Nacional, Uruguay): agenda de contactos, adhesiones, agrupaciones, productos/merchandising, órganos partidarios, convencionales y reportería. Consume el backend [`administracion-pn-backend`](https://github.com/ChrisReznio/administracion-pn-backend) (.NET 8) vía REST + JWT.

---

## Stack

Angular **17.3** (standalone components + signals) · TypeScript 5.4 · RxJS 7.8 · CSS plano (sin librerías de UI ni Tailwind) · deploy en Vercel.

---

## Arquitectura — estado y objetivo

> ⚠️ **El proyecto está en transición.** Hoy la estructura es **plana** (componentes con `HttpClient` directo, sin capa de servicios consistente, interfaces inline, sin `shared/`). El **objetivo** es la estructura estándar que ya está scaffoldeada. La migración es deuda técnica de **alta prioridad** (ver `project/backlog.md` → DEBT-011/012).

### Estructura objetivo

```
src/app/
├── core/
│   ├── interceptors/   → auth.interceptor, http-error.interceptor   (ya migrados)
│   ├── services/       → servicios singleton por dominio            (objetivo)
│   └── models/         → interfaces/modelos globales                (objetivo)
├── shared/
│   ├── components/     → componentes reutilizables (tabla, modal, etc.)
│   ├── directives/
│   └── pipes/
└── features/           → una subcarpeta por feature (ya existe)
```

### Reglas duras (objetivo)

- Componentes **siempre standalone** (sin `NgModule`). ✅ ya se cumple.
- Estado con **Angular Signals** — sin NgRx. ✅ ya se cumple.
- HTTP vía **services por dominio** en `core/services/` (no `HttpClient` directo en componentes). ⏳ objetivo (DEBT-006).
- Interfaces/modelos en `core/models/` (no inline duplicadas). ⏳ objetivo (DEBT-009).
- Manejo de errores centralizado en `core/interceptors/http-error.interceptor.ts`. ✅ scaffoldeado; falta UX (toasts) → DEBT-002.
- Rutas lazy con `loadComponent`. ✅ ya se cumple.

### Cómo se construye una feature nueva (estándar objetivo)

1. Modelos/interfaces en `core/models/<feature>.ts`.
2. Service por dominio en `core/services/<feature>.service.ts` (todas las llamadas HTTP, tipadas).
3. Componentes standalone en `features/<feature>/`, consumiendo el service (no `HttpClient` directo).
4. Estado con signals; UI reutilizable en `shared/`.
5. Ruta lazy en `app.routes.ts`.
6. Manejar error/loading/vacío en cada vista.

---

## Comandos útiles

```bash
npm install
npm start                              # ng serve → http://localhost:4200 (backend en :5000)
npm run build                          # ng build
npm run build -- --configuration production
```

---

## Tests

El runner **ya está montado**: Karma/Jasmine + `tsconfig.spec.json` + target `test` en `angular.json`, con `*.spec.ts` distribuidos por el proyecto (models, services, componentes y utils). El CI corre los tests además de build + secrets scan.

```bash
npm test                                                  # ng test (watch, navegador local)
npm test -- --watch=false --browsers=ChromeHeadless       # una corrida (lo que usa el CI/gate)
```

Ampliar la cobertura al resto de las features sigue siendo deuda técnica → **DEBT-001** (ya `partially-resolved`: el runner lo montó la feature 002).

---

## Workflow SDD (`project/`)

```
project/
├── specs/        # fuente de verdad: architecture.md + features/*.md
└── backlog.md    # deuda técnica e ítems pendientes (WEB)
```

Comandos: `/project.start` → `/project.spec` → `/project.plan` → `/project.build` → `/project.finish`. `/project.check --sync` valida specs ↔ código.

---

## Convenciones

- **Branches**: `main` (prod) · `develop` (integración) · `feature/<kebab>`, `chore/<kebab>`, `fix/<kebab>`, `docs/<kebab>`.
- **Commits**: Conventional Commits.
- **Código** en inglés donde sea natural; **dominio y UI en español** (rutas, labels) por consistencia con el negocio.
- **Archivos** kebab-case, clases PascalCase, componentes standalone dentro de su feature.
- **PRs**: `feature/*`, `fix/*`, `chore/*`, `docs/*` → PR a `develop`; `develop` → PR a `main` en release. CI corre en cada PR.

---

## Secrets — NO commitear nunca

Angular **no** gitignorea `environment.*.ts`. Antes de commitear cambios en `src/environments/`, verificar que no contengan API keys de terceros ni credenciales. Para config por ambiente usar `environment.ts` (dev) / `environment.prod.ts` (prod) con placeholders.

> ⚠️ El login trae credenciales demo (`admin`/`admin123`) precargadas y visibles (DEBT-004) — quitar antes de prod.

---

## Workspace — relación con el backend

Repo independiente; su contraparte es `administracion-pn-backend` (.NET 8). El backend debe estar corriendo en `http://localhost:5000` para que la app funcione en dev.

**Convención de IDs cruzados**: cuando un requerimiento toca ambos repos, referenciar el ítem espejo. Ejemplo ya existente: el frontend **DEBT-007** (catálogos hardcodeados) es espejo de la feature `catalogos` del backend (`/api/catalogos/sectores`, `/api/catalogos/partido-sectores`).
