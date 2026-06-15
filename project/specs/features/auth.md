# Feature: Auth (Login)

**Estado:** Implementado (funcional, sin gestión de recuperación/refresh) · **Ruta:** `/login` · **Componente(s):** `LoginComponent` (standalone), apoyado en `AuthService` (singleton root).

> Ver `../architecture.md` para lo transversal (Angular 17.3 standalone + signals, `authGuard`, `authInterceptor` con Bearer, `apiUrl = http://localhost:5000/api`). Este documento NO redocumenta esos componentes transversales; solo los referencia.

---

## Propósito

Autenticar al usuario administrador contra el backend y establecer una sesión persistente en el cliente. Es la única puerta de entrada al área protegida de la aplicación: todas las rutas bajo `''` están detrás de `authGuard` (`src/app/app.routes.ts:8`), por lo que sin una sesión válida el usuario queda confinado a `/login`.

`AuthService` es además la fuente de verdad de la sesión para el resto de la app: expone la sesión como signal de solo lectura, un `computed` `isLogged`, y el `token` que consume `authInterceptor` para inyectar el header Bearer (transversal, ver `../architecture.md`).

---

## Rutas y navegación

- **Ruta pública `/login`** — declarada en `src/app/app.routes.ts:5`. Es la única ruta de primer nivel sin `authGuard`. Carga `LoginComponent` mediante lazy loading (`loadComponent`).
- **Tras login OK** — `LoginComponent.submit()` navega imperativamente a `/inicio` (`src/app/features/auth/login.component.ts:54`) usando `Router.navigate(['/inicio'])`.
  - `/inicio` resuelve al `DashboardComponent` dentro del shell protegido (`src/app/app.routes.ts:12`).
  - La ruta raíz `''` redirige a `inicio` (`src/app/app.routes.ts:11`), de modo que `/inicio` es el destino canónico post-login.
- **Wildcard** — cualquier ruta desconocida redirige a `''` (`src/app/app.routes.ts:38`), que a su vez pasa por `authGuard`.

> Nota: el componente NO redirige automáticamente a `/login` cuando no hay sesión; esa responsabilidad recae en `authGuard` (transversal). `LoginComponent` tampoco redirige fuera de `/login` si ya existe sesión activa (ver Gaps).

---

## Componente `LoginComponent`

Archivo: `src/app/features/auth/login.component.ts`.

- **Standalone** — `standalone: true` (`login.component.ts:9`), selector `app-login` (`:8`).
- **Imports** — `CommonModule` y `FormsModule` (`:10`). Usa `FormsModule` para `ngModel` (template-driven forms).
- **Template inline** — definido en la propiedad `template` del decorador (`:11`–`:39`). No hay archivo de template externo ni `styleUrls`; todos los estilos son inline vía atributos `style` y clases globales (`card`, `btn`, `form-input`, etc.) más variables CSS (`var(--accent)`, `var(--gray-100)`, etc.).
- **Inyección** — `AuthService` y `Router` vía `inject()` (`:42`–`:43`).

### Formulario y campos

Form template-driven con `#f="ngForm"` y `(ngSubmit)="submit()"` (`login.component.ts:19`):

| Campo | Binding | Tipo input | Validación | Línea |
|-------|---------|-----------|-----------|-------|
| Usuario | `[(ngModel)]="usuario"` (name `usuario`) | text | `required`, `autofocus` | `:22` |
| Clave | `[(ngModel)]="clave"` (name `clave`) | `password` | `required` | `:26` |

- Ambos campos son `required` (validación HTML5/Angular template-driven). **No** se deshabilita el botón ante formulario inválido; el `[disabled]` del botón solo depende de `loading()` (ver más abajo). El submit dispara aun con campos vacíos salvo que el navegador bloquee por `required`.
- **Valores por defecto precargados**: `usuario = 'admin'` y `clave = 'admin123'` (`login.component.ts:45`–`:46`). El template muestra además el texto de ayuda `Demo: admin / admin123` (`:35`). Esto es claramente material de demo (ver Gaps).

### Estado con signals

- `loading = signal(false)` (`login.component.ts:47`) — controla el texto del botón (`'Ingresando…'` vs `'Ingresar'`, `:32`) y su atributo `[disabled]` (`:31`).
- `error = signal<string | null>(null)` (`login.component.ts:48`) — cuando es no nulo, se renderiza un bloque de error rojo (`@if (error())`, `:28`–`:30`) con estilos inline (`background:#fee2e2;color:#991b1b`).

`usuario` y `clave` son propiedades planas (no signals) ligadas por `ngModel`.

### Flujo `submit()`

`login.component.ts:50`–`:57`:

1. `loading.set(true)` y `error.set(null)` (`:51`–`:52`).
2. Llama `this.auth.login(this.usuario, this.clave).subscribe({...})` (`:53`).
3. **next** — `() => this.router.navigate(['/inicio'])` (`:54`). Nota: `loading` NO se vuelve a poner en `false` en el camino feliz (queda en `true` hasta que la navegación destruye el componente; ver Gaps).
4. **error** — `e => { this.error.set(e?.error?.message ?? 'Error de autenticación'); this.loading.set(false); }` (`:55`). Toma el mensaje del backend (`e.error.message`) o usa el fallback `'Error de autenticación'`.

---

## API consumida

Toda la comunicación HTTP de auth vive en `AuthService` (`src/app/core/auth.service.ts`).

### `POST /auth/login`

- Método: `AuthService.login(usuario, clave)` (`auth.service.ts:22`).
- Request: `this.http.post<LoginResponse>(\`${environment.apiUrl}/auth/login\`, { usuario, clave })` (`auth.service.ts:23`).
  - URL efectiva: `http://localhost:5000/api/auth/login` (`apiUrl` transversal, ver `../architecture.md`).
  - **Payload**: `{ usuario, clave }` (objeto con los dos strings, `:23`).
- Respuesta esperada: `LoginResponse` (ver Modelos).
- **Efecto secundario** (`.pipe(tap(...))`, `auth.service.ts:24`–`:27`): al recibir respuesta `r`:
  1. `localStorage.setItem(STORAGE_KEY, JSON.stringify(r))` (`:25`) — persiste la sesión completa (token + usuario + rol).
  2. `this._session.set(r)` (`:26`) — actualiza el signal de sesión, lo que recalcula `isLogged`.

### Persistencia / sesión

- `STORAGE_KEY = 'admpn_auth'` (`auth.service.ts:12`) — clave de `localStorage`.
- `_session` es un `signal<LoginResponse | null>` inicializado desde `loadSession()` (`auth.service.ts:16`), lo que rehidrata la sesión al arrancar la app leyendo `localStorage` (`:37`–`:40`: `JSON.parse` del raw, o `null` si no existe).
- Expuesto como:
  - `session` — `_session.asReadonly()` (`auth.service.ts:17`).
  - `isLogged` — `computed(() => this._session() !== null)` (`auth.service.ts:18`).
  - `token` getter — `this._session()?.token ?? null` (`auth.service.ts:35`); es lo que consume `authInterceptor` (transversal).
- `logout()` (`auth.service.ts:30`–`:33`): `localStorage.removeItem(STORAGE_KEY)` + `_session.set(null)`. No llama a ningún endpoint del backend (logout puramente cliente).

---

## Modelos / interfaces

### `LoginResponse`

Definida en `src/app/core/auth.service.ts:6`–`:10`:

```ts
export interface LoginResponse {
  token: string;
  usuario: string;
  rol: string;
}
```

- `token` — JWT/credencial que usa `authInterceptor` para el header Bearer (transversal).
- `usuario` — nombre del usuario autenticado.
- `rol` — rol del usuario. Se persiste pero **no se observa ningún consumo de `rol`** para control de acceso en esta feature (ver Gaps).

No existe una interfaz separada para el request; el payload `{ usuario, clave }` es un objeto literal inline (`auth.service.ts:23`).

---

## Interacciones / UX

- **Submit del form** — botón único `Ingresar` (`login.component.ts:31`–`:33`). Mientras `loading()` es `true`, el botón se deshabilita y muestra `Ingresando…`.
- **Manejo de error de credenciales** — ante respuesta de error HTTP, se muestra el banner rojo con `e.error.message` del backend o el fallback `'Error de autenticación'` (`login.component.ts:55`, `:28`–`:30`). El error se limpia (`error.set(null)`) al reintentar el submit (`:52`).
- **Redirección post-login** — navegación a `/inicio` (`login.component.ts:54`).
- **Autofocus** — el campo Usuario tiene `autofocus` (`login.component.ts:22`).
- **Layout** — tarjeta centrada a pantalla completa (`min-height:100vh; display:flex; align-items:center; justify-content:center`, `:12`) con logo "PN", título "AdministracionPN" y la nota de credenciales demo.

---

## Dependencias

- `AuthService` — `src/app/core/auth.service.ts` (inyectado en `login.component.ts:42`). Es `providedIn: 'root'` (`auth.service.ts:14`).
- `Router` (`@angular/router`) — para la navegación post-login (`login.component.ts:43`, `:54`).
- `HttpClient` (`@angular/common/http`) — inyectado en `AuthService` (`auth.service.ts:20`) para el POST.
- `environment` — `src/environments/environment` para `apiUrl` (`auth.service.ts:4`, `:23`).
- `FormsModule` / `CommonModule` — `login.component.ts:10`.
- **Transversales (ver `../architecture.md`)**: `authGuard` (`src/app/core/auth.guard.ts`) protege las rutas; `authInterceptor` (`src/app/core/auth.interceptor.ts`) inyecta el Bearer usando `AuthService.token`.

---

## No implementado / gaps

- **Sin recuperación de contraseña** — no existe enlace ni ruta "olvidé mi clave"; tampoco endpoint asociado.
- **Sin refresh token en cliente** — `LoginResponse` solo trae `token` (`auth.service.ts:6`–`:10`); no hay refresh token, ni lógica de renovación/expiración, ni manejo de 401 para re-login automático en esta feature.
- **`loading` no se resetea en el camino feliz** — en `next` no se llama `loading.set(false)` (`login.component.ts:54`); el botón queda en estado "Ingresando…" hasta que la navegación destruye el componente. Si la navegación a `/inicio` fallara, el botón quedaría bloqueado.
- **Validación de formulario no bloquea el submit** — `#f="ngForm"` existe (`login.component.ts:19`) pero su validez (`f.invalid`) no se usa: el botón solo se deshabilita por `loading()` (`:31`). La protección ante campos vacíos depende solo del atributo `required` del navegador.
- **Credenciales demo hardcodeadas** — `usuario='admin'` / `clave='admin123'` precargados (`login.component.ts:45`–`:46`) y mostrados en el template (`:35`). Pendiente de quitar para producción.
- **`rol` no se aprovecha** — se persiste en sesión (`auth.service.ts:9`) pero no se observa autorización por rol; `authGuard` (transversal) solo verifica existencia de sesión, no rol.
- **Sin redirect si ya hay sesión** — `LoginComponent` no comprueba `auth.isLogged()` al montar; un usuario ya logueado puede ver `/login` de nuevo.
- **Logout solo del lado cliente** — `logout()` no invalida el token en el backend (`auth.service.ts:30`–`:33`).
- **Manejo de error genérico** — no se distinguen casos (credenciales inválidas vs error de red vs 500); todo cae en el mismo banner con el mensaje del backend o el fallback. Errores sin `e.error.message` (p. ej. fallo de red) muestran solo `'Error de autenticación'`.
- **Persistencia en `localStorage` sin cifrado** — el token se guarda en claro en `localStorage` bajo `admpn_auth` (`auth.service.ts:12`, `:25`); sin expiración ni protección XSS adicional.
