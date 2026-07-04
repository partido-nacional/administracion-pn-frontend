# Arquitectura transversal — Frontend AdministracionPN (Angular 17)

> **Fuente de verdad transversal — verificado 2026-06-14**
> (rutas de interceptores actualizadas 2026-07-04 tras el scaffold `core/interceptors/`)
>
> Este documento describe la arquitectura transversal (no por feature) del frontend
> Angular ubicado en `E:\proyectos\PN\administracion-pn-frontend`. Todo lo afirmado
> está respaldado por código citado con `archivo:línea`. No se infiere comportamiento
> que no esté en el código.

---

## Resumen (3-5 líneas)

App Angular 17.3 **100% standalone** (sin NgModules), bootstrapeada con `bootstrapApplication`
(`src/main.ts:5`) y configurada vía `appConfig` con `provideRouter` + `provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor]))`
(`src/app/app.config.ts:8-13`). Routing **lazy por `loadComponent`** dividido en login público y un
shell protegido por `authGuard` (`src/app/app.routes.ts:4-39`). Estado de sesión con **signals**
(`AuthService`, sin NgRx); token JWT en `localStorage` bajo la clave `admpn_auth`
(`src/app/core/auth.service.ts:12,16`). El interceptor agrega `Authorization: Bearer <token>` y ante
**401 hace logout + redirect a /login** — **no hay refresh token** (`src/app/core/interceptors/auth.interceptor.ts:11,14-17`).
Deploy en Vercel con **SPA fallback** total (`vercel.json:6`).

**Hallazgos transversales clave:**
- **Manejo de 401:** el interceptor llama `auth.logout()` y navega a `/login` (`src/app/core/interceptors/auth.interceptor.ts:14-17`). No hay reintento ni cola de requests.
- **Refresh token:** NO existe. El `LoginResponse` solo tiene `token/usuario/rol` (`src/app/core/auth.service.ts:6-10`); no hay endpoint ni lógica de refresh.
- **SPA fallback Vercel:** rewrite `/(.*) -> /index.html` (`vercel.json:5-7`), sirviendo `dist/administracion-pn-frontend/browser` (`vercel.json:3`).
- **Sin tests:** no existe ningún `*.spec.ts` en `src/app` (búsqueda glob vacía), ni Karma/Jasmine en `package.json`.
- **Manejo global de errores HTTP:** existe `httpErrorInterceptor` (`src/app/core/interceptors/http-error.interceptor.ts:11-20`) que hoy solo **loguea** los status ≠401 y re-emite el error (`throwError`), dejando el manejo real (toasts, mapeo de `errorCode`) a cada componente — es el punto único a completar (DEBT-002). El 401 lo maneja `authInterceptor` (`src/app/core/interceptors/auth.interceptor.ts:18`).

---

## 1. Stack

| Pieza | Versión | Fuente |
|---|---|---|
| Angular (core/common/compiler/forms/router/animations/platform-browser[-dynamic]) | `^17.3.0` | `package.json:12-19` |
| RxJS | `~7.8.0` | `package.json:20` |
| zone.js | `~0.14.3` | `package.json:22` |
| tslib | `^2.3.0` | `package.json:21` |
| TypeScript | `~5.4.0` | `package.json:28` |
| @angular/cli + build-angular + compiler-cli | `^17.3.0` | `package.json:25-27` |

- **Sin librerías de UI** (no hay Angular Material, PrimeNG, Bootstrap, Tailwind, etc.): las únicas
  dependencias runtime son los paquetes `@angular/*`, `rxjs`, `tslib`, `zone.js` (`package.json:11-23`).
- **Sin librerías de estado** (no NgRx, NgXs, Akita) ni de HTTP de terceros (no axios).
- El estilado es **CSS plano propio** (un único `src/styles.css` con un design system de variables
  CSS, `src/styles.css:5-30`), sin preprocesador.
- `@angular/forms` está presente y se usa con **template-driven forms** (`FormsModule`/`ngModel`,
  ej. `src/app/features/auth/login.component.ts:3,22,26`).
- `name`/`version` del paquete: `administracion-pn-frontend` / `0.1.0`, `private: true`
  (`package.json:2-3,10`).

---

## 2. Bootstrap y configuración

- **`src/main.ts:5-6`**: `bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err))`.
  No hay `platformBrowserDynamic().bootstrapModule` — confirma arquitectura standalone.
- **`src/app/app.component.ts`**: componente raíz mínimo, standalone, template
  `'<router-outlet></router-outlet>'` (`app.component.ts:6-8`). Solo importa `RouterOutlet`
  (`app.component.ts:2,7`). No tiene lógica.
- **`src/app/app.config.ts:8-13`** — `appConfig: ApplicationConfig` con dos providers:
  - `provideRouter(routes)` (`app.config.ts:10`).
  - `provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor]))` (`app.config.ts:11`) —
    registra **dos** interceptores funcionales, en orden: `authInterceptor` (Bearer + 401) y
    `httpErrorInterceptor` (log de errores ≠401). Importados desde `core/interceptors/`
    (`app.config.ts:5-6`).
- **No** se proveen aquí: `provideAnimations`, `provideClientHydration` (no SSR), zona custom, ni
  `ErrorHandler` global. Configuración deliberadamente mínima.
- **`src/index.html`**: `lang="es"` (`index.html:2`), `<base href="/">` (`index.html:7`),
  `<title>AdministracionPN</title>` (`index.html:6`), monta `<app-root>` (`index.html:10`).

---

## 3. Routing

Definido en `src/app/app.routes.ts:4-39`. Todo el routing es **lazy mediante `loadComponent`**
(no hay `loadChildren` ni módulos lazy).

### Estructura de alto nivel
- **Ruta pública** `login` → carga `LoginComponent` (`app.routes.ts:5`). Sin guard.
- **Shell protegido** `path: ''` con `canActivate: [authGuard]` (`app.routes.ts:6-10`) →
  carga `ShellComponent` y anida todas las features como `children` con su propio `<router-outlet>`.
- **Wildcard** `path: '**'` → `redirectTo: ''` (`app.routes.ts:38`). No hay página 404 dedicada;
  cualquier ruta desconocida cae al shell (y por el guard, a login si no hay sesión).

### Redirects
- `'' (full)` → `redirectTo: 'inicio'` (`app.routes.ts:11`).
- `'listados' (full)` → `redirectTo: 'listados/movimientos'` (`app.routes.ts:21`).

### Mapa ruta → componente → feature
| Ruta | Componente (lazy) | Feature |
|---|---|---|
| `login` | `LoginComponent` | `features/auth` (`app.routes.ts:5`) |
| `inicio` | `DashboardComponent` | `features/dashboard` (`app.routes.ts:12`) |
| `agenda` | `AgendaListadoComponent` | `features/agenda` (`app.routes.ts:13`) |
| `agenda/nuevo` | `AgendaNuevoComponent` | `features/agenda` (`app.routes.ts:14`) |
| `agenda/:contactoId/fichas/nueva` | `NuevaFichaComponent` | `features/adhesiones` (`app.routes.ts:15`) |
| `agenda/:contactoId/fichas` | `FichasContactoComponent` | `features/adhesiones` (`app.routes.ts:16`) |
| `agenda/:contactoId/organismos` | `IntegrantesContactoComponent` | `features/organismos` (`app.routes.ts:17`) |
| `agenda/:id` | `AgendaNuevoComponent` (reuso para editar) | `features/agenda` (`app.routes.ts:18`) |
| `adhesiones` | `AdhesionesListadoComponent` | `features/adhesiones` (`app.routes.ts:19`) |
| `productos` | `ProductosComponent` | `features/productos` (`app.routes.ts:20`) |
| `listados/movimientos` | `MovimientosComponent` | `features/listados` (`app.routes.ts:22`) |
| `listados/parlamentarias` | `ParlamentariasComponent` | `features/listados` (`app.routes.ts:23`) |
| `listados/gobierno` | `GobiernoComponent` | `features/listados` (`app.routes.ts:24`) |
| `listados/departamentales` | `DepartamentalesComponent` | `features/listados` (`app.routes.ts:25`) |
| `listados/intendencias-nacionalistas` | `IntendenciasNacComponent` | `features/listados` (`app.routes.ts:26`) |
| `listados/intendencias-pn` | `IntendenciasPnComponent` | `features/listados` (`app.routes.ts:27`) |
| `listados/alcaldes` | `AlcaldesComponent` | `features/listados` (`app.routes.ts:28`) |
| `listados/jovenes` | `JovenesComponent` | `features/listados` (`app.routes.ts:29`) |
| `listados/convencionales` | `ConvencionalesListadoComponent` | `features/listados` (`app.routes.ts:30`) |
| `listados/directorio` | `DirectorioComponent` | `features/listados` (`app.routes.ts:31`) |
| `debitos` | `DebitosComponent` | `features/debitos` (`app.routes.ts:32`) |
| `organismos` | `OrganismosComponent` | `features/organismos` (`app.routes.ts:33`) |
| `agrupaciones` | `AgrupacionesComponent` | `features/agrupaciones` (`app.routes.ts:34`) |
| `convencionales` | `ConvencionalesComponent` | `features/convencionales` (`app.routes.ts:35`) |

Notas:
- `agenda/:id` se declara **después** de las rutas literales `agenda/nuevo`, `agenda/:contactoId/...`
  (`app.routes.ts:14-18`), de modo que las literales y de más segmentos matchean primero.
- Hay dos áreas distintas de "convencionales": `convencionales` (`features/convencionales`,
  `app.routes.ts:35`) y `listados/convencionales` (`features/listados`, `app.routes.ts:30`).

---

## 4. Autenticación en el cliente

### `AuthService` — `src/app/core/auth.service.ts`
- `@Injectable({ providedIn: 'root' })` (`auth.service.ts:14`), singleton global.
- **Modelo de sesión** `LoginResponse { token, usuario, rol }` (`auth.service.ts:6-10`). No incluye
  expiración ni refresh token.
- **Clave de storage**: `STORAGE_KEY = 'admpn_auth'` en `localStorage` (`auth.service.ts:12`).
- **Estado con signals:**
  - `_session = signal<LoginResponse|null>(this.loadSession())` — inicializa leyendo localStorage en
    el constructor del servicio (`auth.service.ts:16`).
  - `session = _session.asReadonly()` (`auth.service.ts:17`) — expuesto de solo lectura.
  - `isLogged = computed(() => _session() !== null)` (`auth.service.ts:18`) — derivado.
  - `get token(): string|null => _session()?.token ?? null` (`auth.service.ts:35`).
- **`login(usuario, clave)`** (`auth.service.ts:22-28`): `POST {apiUrl}/auth/login` con
  `{ usuario, clave }`; en el `tap` guarda la respuesta en `localStorage` y setea `_session`
  (`auth.service.ts:23-27`). Devuelve el `Observable<LoginResponse>`.
- **`logout()`** (`auth.service.ts:30-33`): borra la clave de `localStorage` y setea `_session` a `null`.
- **`loadSession()`** (`auth.service.ts:37-40`): lee y `JSON.parse` el raw; sin try/catch — un valor
  corrupto en storage lanzaría excepción al iniciar (deuda, ver §10).

### `authGuard` — `src/app/core/auth.guard.ts`
- `CanActivateFn` funcional (`auth.guard.ts:5`). Inyecta `AuthService` y `Router` vía `inject()`
  (`auth.guard.ts:6-7`).
- Si `auth.isLogged()` → `true` (`auth.guard.ts:8`); si no, `router.navigate(['/login'])` y `false`
  (`auth.guard.ts:9-10`). Solo verifica presencia de sesión, **no valida el JWT ni su expiración**.

### `authInterceptor` — `src/app/core/interceptors/auth.interceptor.ts`
- `HttpInterceptorFn` funcional (`auth.interceptor.ts:7`).
- **Agrega Bearer:** si hay `token`, clona el request con
  `setHeaders: { Authorization: 'Bearer <token>' }`; si no, pasa el request original
  (`auth.interceptor.ts:10-11`). Se aplica a **todas** las requests HTTP (incluido el propio login,
  donde el token aún es `null`).
- **Manejo de 401:** en `catchError`, si `err.status === 401` → `auth.logout()` + navega a `/login`,
  y siempre re-emite el error con `throwError(() => err)` (`auth.interceptor.ts:13-19`).
- **No** maneja otros status (403/500/etc.), **no** reintenta, **no** hay refresh ni cola de requests.

### `httpErrorInterceptor` — `src/app/core/interceptors/http-error.interceptor.ts`
- `HttpInterceptorFn` funcional (`http-error.interceptor.ts:11`), registrado **después** de
  `authInterceptor` en el pipeline (`app.config.ts:11`).
- **Qué hace hoy:** en `catchError`, si `err.status !== 401` loguea
  `[HTTP <status>] <method> <url>` por consola y siempre re-emite el error con `throwError(() => err)`
  (`http-error.interceptor.ts:13-18`). El 401 lo deja pasar (lo maneja `authInterceptor`).
- **Objetivo (DEBT-002):** es el punto único para centralizar el manejo de errores del backend
  (toasts, mapeo del `errorCode`/`message` del `ExceptionHandlingMiddleware`); hoy solo loguea.

---

## 5. Estado

- **Patrón:** Angular **Signals** (`signal` / `computed` / `asReadonly` / `update`), sin store global.
  Ejemplos: sesión en `AuthService` (`auth.service.ts:16-18`), título en `PageTitleService`
  (`page-title.service.ts:5`), menús abiertos en el shell con `signal<Record<string,boolean>>` y
  `.update()` (`shell.component.ts:19,22`).
- **No hay NgRx/NgXs/Akita** ni servicios con `BehaviorSubject` como store central — el estado vive
  en signals dentro de servicios `root` (transversal) o en signals locales de cada componente.
- Las features cargan datos haciendo `HttpClient` directo a `environment.apiUrl` y guardando el
  resultado en signals locales (patrón visible, p.ej. dashboard:
  `this.resumen.set(r)` tras `http.get(...)`, `features/dashboard/dashboard.component.ts:329-330`).

---

## 6. Layout / Shell

`ShellComponent` — `src/app/layout/shell.component.ts` + `shell.component.html`.

- Standalone; importa `CommonModule, RouterOutlet, RouterLink, RouterLinkActive`
  (`shell.component.ts:10`). Usa `inject()` para `AuthService`, `Router`, `PageTitleService`
  (`shell.component.ts:14-16`).
- **Sidebar fija** (`.sidebar`, `position: fixed`, ancho `--sidebar-width: 260px`,
  `styles.css:24,49-61`) con:
  - Header con logo "PN" y texto "AdministracionPN" (`shell.component.html:3-6`).
  - Navegación con `routerLink` + `routerLinkActive="active"` (`shell.component.html:8-32`).
  - **Submenú colapsable "Listados"**: estado en `openMenus` signal; `toggle('listados')` y
    `isOpen('listados')` controlan la clase `.open` (`shell.component.ts:19-25`,
    `shell.component.html:12-26`). Es el único menú con submenú.
  - **Footer de usuario**: muestra `initials(user()?.usuario)`, `user()?.usuario`, `user()?.rol`
    (de la signal de sesión) y botón **Salir** que llama `logout()` (`shell.component.html:34-43`,
    `shell.component.ts:18,27-30,34-37`). `logout()` aquí también navega a `/login`
    (`shell.component.ts:27-30`).
- **Topbar**: `<h1>{{ titleSvc.title() }}</h1>` (título reactivo desde el servicio) y la fecha de hoy
  formateada `es-UY` (`shell.component.html:48-51`, `shell.component.ts:32`).
- **Contenido**: `<router-outlet>` dentro de `.content` (`shell.component.html:53-55`).
- Responsive: a `<768px` la sidebar se oculta y `.main` pierde el margen
  (`styles.css:682-688`); **no hay botón hamburguesa** para reabrirla en mobile (deuda, §10).

### `PageTitleService` — `src/app/core/page-title.service.ts`
- `@Injectable({ providedIn: 'root' })` con `title = signal<string>('')` y `set(t)` (`page-title.service.ts:3-7`).
- **Patrón de uso:** cada componente de feature inyecta el servicio y llama `.set('...')` al
  inicializar; el shell lo renderiza reactivamente. Ej.: `DashboardComponent` hace
  `this.title.set('Inicio')` (`features/dashboard/dashboard.component.ts:277,329`). El servicio es
  referenciado por las 27 features (no se usa el `Title` de `@angular/platform-browser` ni
  `data.title` en rutas).

---

## 7. Utilidades core

### `exportar-csv.ts` — `src/app/core/exportar-csv.ts`
- API genérica `exportarCSV<T>(rows, columnas, filename)` (`exportar-csv.ts:26`) +
  interfaz `CsvColumn<T> { get: keyof T | (row)=>any; label }` (`exportar-csv.ts:6-10`).
- **Qué hace:** construye un CSV **RFC 4180** y dispara la descarga en el navegador
  (creando un `<a download>` y haciendo click, `exportar-csv.ts:37-44`).
- **Formato/detalles:**
  - Separador de campos `,`; separador de líneas `\r\n` (`exportar-csv.ts:27,28-33,34`).
  - `escape()` (`exportar-csv.ts:12-24`): `null/undefined` → `''`; `boolean` → `'Sí'/'No'`;
    `Date` → ISO recortado a `YYYY-MM-DD` (`.slice(0,10)`); resto `String(v)`. Si el valor contiene
    `"`, `,`, `\n` o `\r`, lo encierra en comillas y **duplica** las comillas internas
    (`exportar-csv.ts:20-22`).
  - **BOM UTF-8** (`'﻿'`) al inicio del `Blob` para que Excel detecte UTF-8
    (`exportar-csv.ts:35-36`).
  - Revoca el `ObjectURL` tras 1 s (`exportar-csv.ts:44`).
- Soporta el botón `.btn-export` definido en estilos (`styles.css:794-802`).

### `PageTitleService`
- Ver §6 (`page-title.service.ts`).

> Nota: `src/app/core` contiene 4 archivos sueltos (auth.guard, auth.service, exportar-csv,
> page-title.service) + la carpeta `interceptors/` con `auth.interceptor.ts` y `http-error.interceptor.ts`.
> El scaffold estándar agregó además carpetas vacías `core/services/` y `core/models/` (con `.gitkeep`,
> objetivo de la migración DEBT-011). No hay todavía un `ApiService` base ni un `ErrorHandler` global.

---

## 8. Build / Deploy

### Scripts npm — `package.json:4-9`
- `start`: `ng serve --port 4200`.
- `build`: `ng build` (configuración default = **production**, ver abajo).
- `watch`: `ng build --watch --configuration development`.
- `ng`: passthrough al CLI. **No hay** `test`/`lint`/`e2e`.

### `angular.json`
- **Builder moderno** `@angular-devkit/build-angular:application` (esbuild/Vite) (`angular.json:13`).
- Entradas: `index: src/index.html`, `browser: src/main.ts`, `polyfills: ["zone.js"]`,
  `assets: ["src/assets"]`, `styles: ["src/styles.css"]`, `scripts: []` (`angular.json:15-22`).
- **`outputPath: dist/administracion-pn-frontend`** (`angular.json:15`); el bundle de navegador queda
  bajo `.../browser` (convención del builder `application`, usada por Vercel — ver abajo).
- **Configuración `production`** (`angular.json:25-40`): `optimization`, `outputHashing: all`,
  `sourceMap: false`, `extractLicenses`, y **fileReplacement** `environment.ts → environment.prod.ts`
  (`angular.json:31-36`).
- **Budgets** (solo en production): `initial` warning `500kb`, error `2mb` (`angular.json:37-39`).
- **`defaultConfiguration: production`** para `build` (`angular.json:46`) y `development` para `serve`
  (`angular.json:54`).

### tsconfig
- `tsconfig.json`: `strict: true` + flags estrictos extra (`noImplicitOverride`,
  `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`),
  `target/module: ES2022`, `lib: ["ES2022","dom"]`, `useDefineForClassFields: false`
  (`tsconfig.json:5-21`). Angular: `strictTemplates`, `strictInjectionParameters`,
  `strictInputAccessModifiers` (`tsconfig.json:22-27`).
- `tsconfig.app.json`: extiende el base, `types: []`, `files: ["src/main.ts"]`
  (`tsconfig.app.json:2-8`). **No hay `tsconfig.spec.json`** (sin setup de tests).

### `vercel.json` — deploy
- `buildCommand: "npm run build"` (`vercel.json:2`).
- `outputDirectory: "dist/administracion-pn-frontend/browser"` (`vercel.json:3`) — apunta al subdir
  `browser` del output del builder `application`.
- `framework: null` (`vercel.json:4`) — Vercel no autodetecta; usa la config explícita.
- **SPA fallback / rewrites:** `{ source: "/(.*)", destination: "/index.html" }` (`vercel.json:5-7`):
  todas las rutas se reescriben a `index.html`, dejando el routing del lado del cliente. Necesario
  porque las rutas Angular son client-side.

### Environments
- `environment.ts` (dev): `production: false`, `apiUrl: 'http://localhost:5000/api'`
  (`environment.ts:1-4`).
- `environment.prod.ts` (prod): `production: true`,
  `apiUrl: 'https://administracion-pn-backend.onrender.com/api'` (`environment.prod.ts:1-4`).
- El swap dev→prod ocurre por el `fileReplacements` de production (`angular.json:31-36`).

### `.gitignore` (raíz)
- Ignora `node_modules/`, `dist/`, `.angular/`, `.idea/`, `.vscode/`, `*.log`, `.DS_Store`
  (`.gitignore:1-7`).

---

## 9. Convenciones

- **Standalone components en todo**: todos los componentes declaran `standalone: true`
  (ej. `app.component.ts:6`, `shell.component.ts:9`, `login.component.ts:9`). No hay un solo
  `@NgModule` en `src/app`.
- **Inyección con `inject()`** (function-based DI) en guard/interceptor/componentes
  (`auth.guard.ts:6-7`, `auth.interceptor.ts:8-9`, `shell.component.ts:14-16`), aunque `AuthService`
  usa constructor injection clásico para `HttpClient` (`auth.service.ts:20`).
- **Guard e interceptor funcionales** (`CanActivateFn`/`HttpInterceptorFn`), no clases.
- **Signals como estado** (`signal`/`computed`/`update`), control-flow nuevo `@if`/`@for` en templates
  (ej. `login.component.ts:28`).
- **UI en español** (labels, mensajes, `lang="es"` en `index.html:2`, fechas `es-UY`
  `shell.component.ts:32`). Identificadores de código en español (`usuario`, `clave`, `agrupaciones`,
  `exportarCSV`).
- **Organización por feature**: `src/app/features/<dominio>/<componente>.component.ts`; lo transversal
  vive en `src/app/core/` y `src/app/layout/`.
- **Estilos globales únicos** en `src/styles.css` con design system de variables CSS y clases
  utilitarias (`.card`, `.btn`, `.table`, `.form-*`, etc., `styles.css:5-803`); poco estilo inline
  salvo casos puntuales (ej. login, `login.component.ts:12-37`).
- **Forms template-driven** (`FormsModule` + `[(ngModel)]`), no Reactive Forms
  (`login.component.ts:3,19-26`).

---

## 10. Gaps / deuda transversal

1. **Sin tests.** No existe ningún `*.spec.ts` en `src/app` (glob vacío); no hay Karma/Jasmine/Jest
   en `package.json:24-29` ni script `test`. Cero cobertura automatizada.
2. **Sin refresh token / expiración.** `LoginResponse` no trae expiración (`auth.service.ts:6-10`);
   el guard solo chequea presencia de sesión (`auth.guard.ts:8`), no valida el JWT. Un token vencido
   pasa el guard y solo se detecta cuando el backend responde 401.
3. **Manejo de errores HTTP a medio hacer.** `authInterceptor` trata el 401 (logout+redirect,
   `auth.interceptor.ts:14-18`) y `httpErrorInterceptor` **solo loguea** los demás status
   (`http-error.interceptor.ts:13-18`); el manejo real (toasts, mapeo de `errorCode`) sigue ad hoc en
   cada componente. **No hay `ErrorHandler` global** ni provider de animaciones/toasts central (DEBT-002).
4. **`loadSession()` sin try/catch.** `JSON.parse` directo del localStorage (`auth.service.ts:38-39`):
   un valor corrupto/manipulado lanza excepción durante el bootstrap del servicio.
5. **Credenciales demo hardcodeadas en el cliente.** El login precarga `admin/admin123` y muestra
   "Demo: admin / admin123" (`login.component.ts:45-46,35`).
6. **Sin lazy *modules* / sin route-level code-splitting por área.** Todo es `loadComponent` a nivel de
   ruta (correcto para standalone), pero no hay agrupación lazy por dominio ni `preloadingStrategy`
   configurada en `provideRouter` (`app.config.ts:9`).
7. **Sin 404 dedicada.** El wildcard redirige a `''` (`app.routes.ts:38`); rutas inexistentes no dan
   feedback (caen al shell o, sin sesión, a login).
8. **`environment.prod` con apiUrl hardcodeado** a Render (`environment.prod.ts:3`); no se lee de
   variables de entorno en build (no hay capa de config en runtime). Cambiar de backend exige
   recompilar.
9. **Token en `localStorage`** (`auth.service.ts:25`): accesible por JS, expuesto a XSS (no httpOnly
   cookie). Decisión consciente pero es deuda de seguridad transversal.
10. **El interceptor agrega Bearer también al `/auth/login`** (token `null` → no se agrega, ok), pero
    no excluye explícitamente rutas públicas; si en el futuro hubiera token presente, lo mandaría a
    todas las URLs incluidas terceros (`auth.interceptor.ts:10-11`).
11. **Sidebar no reabrible en mobile.** A `<768px` se oculta sin control para mostrarla
    (`styles.css:682-684`); no hay toggle hamburguesa en el template del shell.
12. **`@angular/animations` declarado pero no provisto.** Está en dependencies (`package.json:12`)
    pero `appConfig` no incluye `provideAnimations()` (`app.config.ts:8-11`): no hay animaciones
    activas (dependencia potencialmente innecesaria).

---

### Apéndice — inventario de archivos transversales leídos
- Bootstrap/config: `src/main.ts`, `src/app/app.config.ts`, `src/app/app.component.ts`,
  `src/index.html`, `src/styles.css`, `src/app/app.routes.ts`.
- Core: `src/app/core/auth.service.ts`, `auth.guard.ts`, `exportar-csv.ts`, `page-title.service.ts`,
  `core/interceptors/auth.interceptor.ts`, `core/interceptors/http-error.interceptor.ts`.
- Layout: `src/app/layout/shell.component.ts`, `shell.component.html`.
- Environments: `src/environments/environment.ts`, `environment.prod.ts`.
- Config raíz: `angular.json`, `package.json`, `tsconfig.json`, `tsconfig.app.json`, `vercel.json`,
  `.gitignore`.
