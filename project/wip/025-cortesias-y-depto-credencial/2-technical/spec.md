# Technical Specification: Cortesías y Depto. Credencial

**Version**: 1.0
**Status**: Draft
**Created**: 2026-08-02

## Architecture Overview

Feature 100% frontend, contenida en un solo componente Angular standalone
(`AgendaNuevoComponent`). Sin cambios de API, de esquema ni de servicios. La lógica es de presentación:
un catálogo estático y una regla de habilitación derivada del modelo.

### Superficie de cambio

| Archivo | Líneas | Cambio |
|---|---|---|
| `src/app/features/agenda/agenda-nuevo.component.ts` | `41-45` | template: `<select name="cortesia">` pasa de 11 `<option>` hardcodeados a un `@for` sobre `cortesiasVisibles()` |
| `src/app/features/agenda/agenda-nuevo.component.ts` | `66-70` | template: `<select name="depCred">` suma `[disabled]="depCredBloqueado()"` |
| `src/app/features/agenda/agenda-nuevo.component.ts` | `238-251` | clase: nueva constante `CORTESIAS` + getter `cortesiasVisibles()` |
| `src/app/features/agenda/agenda-nuevo.component.ts` | `253-267` | `onCredencialInput()`: derivación con limpieza en letra no mapeada, se elimina el comentario de la feature previa |
| `src/app/features/agenda/agenda-nuevo.component.spec.ts` | nuevo | tests del componente (no existe spec hoy) |
| `project/specs/features/agenda.md` | `109`, `207` | resincronizar documentación |

### Decisiones de diseño

**D-1 — El catálogo vive en el archivo del componente, no en `core/`.**
Se agrega una constante de módulo `CORTESIAS: readonly string[]` junto a `FIELD_LABELS` (`:9`).
Justificación: hay un único consumidor (el editor de Contacto); el resto del front sólo renderiza el
string guardado. Extraerlo a `core/constants/` agregaría indirección sin consumidor real. `departamentos`
y `situaciones` ya siguen este patrón como campos del componente (`:238-244`).
*Si en el futuro aparece un filtro por cortesía en Listados, ahí corresponde mover la constante.*

**D-2 — El bloqueo se deriva del modelo, no del evento de input.**
`depCredBloqueado()` lee `this.c.credencialCivica`, no un flag seteado por `onCredencialInput()`. Es lo
que hace cumplir AC-10 (EC-2): el contacto en edición se carga async vía
`this.svc.get(id).subscribe(x => this.c = x)` (`:280`), después del primer render. Un flag booleano
seteado sólo en el handler del input dejaría el campo habilitado hasta que el operador tocara la
credencial — el bug exacto que la feature elimina.

```ts
depCredBloqueado(): boolean {
  return !!(this.c.credencialCivica || '').trim();
}
```

**D-3 — La opción legacy se calcula, no se persiste.**
`cortesiasVisibles()` devuelve `CORTESIAS` y, si `c.cortesia` tiene valor y no está en el catálogo, lo
appendea. Al cambiar el select a un valor del catálogo, el getter deja de incluirlo (AC-5) sin código
extra de limpieza.

**D-4 — El valor deshabilitado se envía igual.**
No requiere trabajo: `guardar()` (`:289-313`) serializa `this.c`, no `form.value`. Con
`[(ngModel)]="c.departamentoCredencial"` el binding escribe sobre `this.c` y `[disabled]` sólo afecta al
`FormControl`. AC-13 se cubre con un test de regresión, no con código.

**D-5 — Limpieza en letra no mapeada.**
`onCredencialInput()` pasa de "sólo asigna si el mapa tiene la letra" a asignar siempre el resultado del
lookup (`?? ''`), implementando EC-4. El `if (letters.length >= 1)` se mantiene para no pisar el valor
cuando la credencial queda vacía (BR-5 / AC-12).

## API Contract

Sin cambios. `POST /api/contactos` y `PUT /api/contactos/{id}` siguen recibiendo `cortesia` y
`departamentoCredencial` como strings opcionales sin validación server-side (BR-6).

## Data Model & Storage

Sin cambios de esquema ni de tipos. `contactos.service.ts` ya declara `cortesia?: string` (`:10`) y
`departamentoCredencial?: string` (`:23`).

**Datos existentes**: los contactos con `Srta.` u otras cortesías fuera del catálogo permanecen en BD
sin migrar. El manejo es en runtime vía D-3.

### Catálogo `CORTESIAS` (28 valores, orden alfabético)

```ts
const CORTESIAS = [
  'Arq.', 'Cnel.', 'Cnel. (R)', 'Cr.', 'Cra.', 'Dr.', 'Dr. Esc.', 'Dra.', 'Dra. Esc.',
  'Ec.', 'Ec. Cr.', 'Esc.', 'Gral.', 'Gral. (R)', 'Ing.', 'Ing. Agr.', 'Ing. Agrim.',
  'Lic.', 'Mag.', 'Mtra.', 'Mtro.', 'Prof.', 'Psic.', 'QF.', 'Soc.', 'Sr.', 'Sra.',
  'Tte. Gral.'
] as const;
```

## External Integrations

Ninguna. `credencialMap` (`:246-251`) es una tabla local y no se modifica.

## Non-Functional Requirements

- **Performance**: sin impacto. `cortesiasVisibles()` se evalúa en cada ciclo de change detection sobre
  un array de 28 ítems; el costo es despreciable y evita estado duplicado.
- **Security**: sin impacto. La regla es de UX — la API sigue aceptando cualquier combinación (BR-6).
  Un cliente que hable directo con la API puede seguir guardando datos inconsistentes; asumido y
  documentado como fuera de alcance.
- **Accesibilidad**: el select deshabilitado usa el estilo nativo del navegador, que ya expone
  `aria-disabled` y mantiene el texto legible (AC-14). No se agrega CSS propio salvo que el contraste
  del `:disabled` resulte insuficiente.
- **Compatibilidad**: sin cambios de contrato, no requiere despliegue coordinado con el backend.

## Testing

`project_type: production` → se agrega `src/app/features/agenda/agenda-nuevo.component.spec.ts`
(hoy el componente no tiene spec; el repo usa Karma + Jasmine, 23 specs existentes).

| Test | Cubre |
|---|---|
| El select de cortesía renderiza 29 opciones (vacío + 28) en el orden del catálogo | AC-1, AC-2 |
| Contacto con cortesía del catálogo → aparece seleccionada, sin opción extra | AC-3 |
| Contacto con `Srta.` → aparece como opción extra al final y seleccionada | AC-4 |
| Cambiar la cortesía a un valor del catálogo → la opción legacy desaparece | AC-5 |
| Sin credencial → `depCredBloqueado()` es `false` | AC-7, AC-11 |
| Con credencial cargada desde el modelo (edición) → `depCredBloqueado()` es `true` en el primer render | AC-8, **AC-10 / EC-2** |
| `onCredencialInput('E...')` → `departamentoCredencial === 'Rocha'` | AC-9 |
| Vaciar la credencial → se desbloquea y retiene el departamento | AC-12, BR-5 |
| `guardar()` envía `departamentoCredencial` con el control deshabilitado | **AC-13 / D-4** |
| Credencial con letra `U` → bloqueado y departamento vacío | EC-4 |

## Implementation Notes

- **Riesgo principal**: AC-10. Es el que un fix "obvio" (flag booleano en el handler) rompe en silencio.
  El test de carga async es obligatorio.
- **Riesgo secundario**: AC-13. Deshabilitar un control con `ngModel` es un patrón que suele dejar
  campos fuera del payload; acá no aplica por D-4, pero el test lo fija para que no se rompa si
  `guardar()` migra a `form.value`.
- Al reescribir `onCredencialInput()`, **borrar** el comentario `:261-262` que justifica la editabilidad
  independiente — quedaría contradiciendo el código.
- La deuda de sincronización de `project/specs/features/agenda.md:207` no es un cambio de esta feature,
  es una corrección arrastrada; se resuelve en `/project.finish`.
