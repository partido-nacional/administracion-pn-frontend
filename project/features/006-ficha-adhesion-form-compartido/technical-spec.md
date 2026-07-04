# Technical Specification: Ficha Adhesión — Formulario y Handlers Compartidos

**Status**: Draft
**Created**: 2026-07-04

## Architecture Overview

> Refactor front-only (Angular 17.3 standalone + signals). No hay cambios de backend ni de
> contrato HTTP. Se extrae la lógica y el markup duplicados a una pieza compartida y ambos
> componentes (`nueva-ficha`, `fichas-contacto`) pasan a consumirla.

**Enfoque candidato (a decidir en /project.plan):** dos capas de extracción, aplicables por separado.

1. **Constantes + reglas puras** → un módulo compartido `ficha-adhesion.constants.ts` (+ helpers `showTelefonoAntel/showCedula/showFechasPago` y funciones puras `applySistContribChange(f)`, `applyAporteTodoChange(f, v)`, `applyConfirmadoChange(f, v, promptFn)`). Sin dependencia de Angular → testeable en aislamiento. Baja fricción, sin riesgo de UI.

2. **Markup del formulario** → un componente presentacional standalone `FichaAdhesionFormComponent` que recibe la ficha (`FichaAdhesionDetalle`) y un flag `disabled`/`editMode`, emite cambios, y renderiza el bloque de campos condicionales una sola vez. `nueva-ficha` lo usa siempre editable; `fichas-contacto` lo embebe en la fila expandible con `[disabled]="!editMode()"`.

> **Decisión de alcance (fijada 2026-07-04, usuario):** se hacen **ambas fases, (1)+(2)** —
> eliminar toda la duplicación (constantes/handlers + markup). Fase 1 primero (base pura y
> testeable); fase 2 después (componente presentacional consumido por ambos). La regresión
> visual de la fase 2 se cubre con verificación manual de alta y edición antes de mergear.

## Ubicación (estándar objetivo)

- `src/app/shared/adhesiones/ficha-adhesion.constants.ts` — constantes + helpers/funciones puras.
- `src/app/shared/adhesiones/ficha-adhesion-form.component.ts` — (fase 2) componente presentacional.

> **Ubicación fijada (2026-07-04, usuario):** `shared/adhesiones/` — cohesión por dominio
> (constantes + funciones puras + componente presentacional juntos).

## API Contract

Sin cambios. Se preservan las llamadas existentes vía servicios de dominio:

- `AdhesionesService.getLocal(id)` → `FichaAdhesionDetalle`
- `AdhesionesService.updateLocal(f)` → `void`
- `AdhesionesService.createLocal(f)` → `void`
- `ContactosService.fichasAdhesion(contactoId)` → `FichaAdhesion[]`
- `ContactosService.get(contactoId)` → `Contacto` (para defaults del alta)
- `CatalogosService.sectores()` → lista de sectores (signal `sectores`)

## Data Model & Storage

Sin cambios de modelo. Se reutiliza `FichaAdhesionDetalle` (en `contactos.service.ts`; su
migración a `core/models/` es DEBT-009, fuera de alcance). Las funciones puras mutan/clonan la
ficha y devuelven el nuevo objeto para `signal.set({...})`, preservando el patrón actual.

## Firma propuesta de las funciones puras

```ts
// ficha-adhesion.constants.ts
export const SISTEMAS: string[];
export const DEPARTAMENTOS: string[];
export const APORTES_SEC_AGR: string[];

export const showTelefonoAntel = (s?: string) => s === 'Antel';
export const showCedula = (s?: string) => ['OCA','VISA','MASTER','EBROU'].includes(s ?? '');
export const showFechasPago = (s?: string) => s === 'ANUAL';

/** Devuelve una copia de f con el nuevo sistema y los campos no aplicables limpiados. */
export function applySistContrib(f: FichaAdhesionDetalle, s: string): FichaAdhesionDetalle;
/** Devuelve una copia de f con aporteTodoAlPartido=v y campos de sector limpiados si v. */
export function applyAporteTodo(f: FichaAdhesionDetalle, v: boolean): FichaAdhesionDetalle;
/**
 * Devuelve una copia de f según el nuevo estado de confirmado. Si v===false pide fecha vía
 * promptFn; si promptFn devuelve null/ inválida, retorna f sin cambios (marcador de "no aplicar").
 */
export function applyConfirmado(
  f: FichaAdhesionDetalle, v: boolean | null,
  promptFn: (defaultDate: string) => string | null
): FichaAdhesionDetalle;
```

Los componentes quedan como thin wrappers: `onConfirmadoChange(v){ const next = applyConfirmado(this.detalle()!, v, promptFecha); this.detalle.set(next); }`.

## Contrato del FichaAdhesionFormComponent (fase 2)

**Data flow fijado (2026-07-04, usuario):** `model()` two-way (signal input bidireccional de Angular 17.3).

```ts
@Component({ selector: 'app-ficha-adhesion-form', standalone: true, imports: [CommonModule, FormsModule], ... })
export class FichaAdhesionFormComponent {
  /** Ficha editable, two-way: el hijo aplica los handlers puros y reescribe el objeto. */
  ficha = model.required<FichaAdhesionDetalle>();
  /** Deshabilita todos los campos (modo lectura en la fila expandible). */
  disabled = input<boolean>(false);
  /** Sectores del catálogo (los provee el padre, que ya los carga vía CatalogosService). */
  sectores = input<string[]>([]);

  // handlers internos delegan en las funciones puras y hacen this.ficha.set(applyX(this.ficha(), ...))
}
```

- El padre pasa `[(ficha)]="ficha"` (nueva-ficha, siempre editable) o `[(ficha)]="detalle" [disabled]="!editMode()"` (fichas-contacto, en la fila expandible).
- El `window.prompt` de BR-3 se dispara desde el hijo vía `applyConfirmado(..., promptFn)`; el `promptFn` puede ser un default interno (mismo comportamiento actual) para no acoplar el hijo a `window`.
- Los `<option>` con `[ngValue]` y los `@if` de campos condicionales viven **solo** en el hijo.

**Compatibilidad**: `model()` requiere Angular ≥17.2; el proyecto está en 17.3 ✅. Verificar que `FormsModule` + `[(ngModel)]` sobre las props del objeto `ficha()` sigan disparando el two-way correctamente (el objeto se reescribe con `.set({...})` en cada handler, no se muta in-place para los cambios que gatillan reglas).

## External Integrations

Ninguna nueva.

## Error Handling

| Code | Error | Description |
|------|-------|-------------|
| N/A | — | Refactor sin nuevas rutas HTTP. Se preservan los flujos de error existentes de los servicios. |

Casos de control (no HTTP):
- Fecha de salida inválida/cancelada en `applyConfirmado` → no se aplica el cambio (return de f original).
- Ficha `null` (signal aún sin cargar) → los handlers hacen no-op, como hoy.

## Non-Functional Requirements

- **Performance**: sin impacto (mismo número de llamadas HTTP).
- **Security**: sin superficie nueva. Nota: el markup del formulario usa binding de Angular (auto-escapado), no `innerHTML` — sin riesgo XSS como el de los helpers de impresión.
- **Compatibilidad**: `npm run build` (Angular 17.3) y `npm test` (Karma) deben pasar. Sin cambios de API pública de rutas.
- **Testing (production)**: tests unitarios de las funciones puras (`applySistContrib`, `applyAporteTodo`, `applyConfirmado` incluyendo el camino de prompt cancelado) y, si se hace la fase 2, un spec de render/estado del `FichaAdhesionFormComponent`. Cobertura ≥80% sobre el módulo nuevo.
