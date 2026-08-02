# Feature 025 — Cortesías y Depto. Credencial

**Estado**: Completada · **Fecha**: 2026-08-02 · **Rama**: `feature/cortesias-y-depto-credencial`

Dos correcciones sobre el editor de Contacto (`/agenda/nuevo`, `/agenda/:id`), único punto del
sistema donde ambos campos se editan.

## Qué se construyó

### 1. Catálogo oficial de cortesías

El selector pasó de 11 tratamientos hardcodeados a los **28** del sistema de referencia del partido:

`Arq.` · `Cnel.` · `Cnel. (R)` · `Cr.` · `Cra.` · `Dr.` · `Dr. Esc.` · `Dra.` · `Dra. Esc.` · `Ec.` ·
`Ec. Cr.` · `Esc.` · `Gral.` · `Gral. (R)` · `Ing.` · `Ing. Agr.` · `Ing. Agrim.` · `Lic.` · `Mag.` ·
`Mtra.` · `Mtro.` · `Prof.` · `Psic.` · `QF.` · `Soc.` · `Sr.` · `Sra.` · `Tte. Gral.`

`Srta.` salió del catálogo. Los contactos que ya la tienen guardada **no se migraron**: al editarlos,
`cortesiasVisibles()` la ofrece como opción extra al final de la lista para que el dato no se pierda en
silencio. La opción desaparece en cuanto se elige un valor del catálogo.

### 2. Departamento Credencial bloqueado

Revierte la editabilidad independiente que había introducido la feature
`contactos-mejoras-credencial-y-listado`. La regla final:

| Estado de la credencial | Departamento Credencial |
|---|---|
| Vacía | Editable |
| Con valor (aunque sea 1 carácter) | Bloqueado, derivado de la primera letra vía `credencialMap` |
| Primera letra fuera de `A`–`T` | Bloqueado y limpiado — no es derivable |
| Se borra la credencial | Se desbloquea **conservando** el último valor |

## Componentes tocados

| Archivo | Qué cambió |
|---|---|
| `src/app/features/agenda/agenda-nuevo.component.ts` | Constante `CORTESIAS` (`:23-30`), `cortesiasVisibles()` (`:261-265`), `depCredBloqueado()` (`:278-280`), `onCredencialInput()` (`:282-296`), template de ambos selects |
| `src/app/features/agenda/agenda-nuevo.component.spec.ts` | **Nuevo** — 22 tests; el componente no tenía spec |
| `project/specs/features/agenda.md` | Resincronizado (documentaba el comportamiento previo a la feature anterior) |

## API

Sin cambios. `cortesia` y `departamentoCredencial` siguen siendo `string?` libres en el backend.

## Decisiones que vale recordar

- **El bloqueo se deriva del modelo, no de un flag del handler del input.** En edición el contacto llega
  async (`svc.get(id).subscribe`), así que un flag seteado sólo en `onCredencialInput()` dejaría el campo
  habilitado hasta que el operador tocara la credencial — exactamente el bug que la feature elimina.
- **El valor deshabilitado se sigue enviando** porque `guardar()` serializa `this.c`, no `form.value`.
  Es una propiedad frágil del componente, así que quedó fijada con un test.
- **`CORTESIAS` es `readonly`**: `cortesiasVisibles()` lo devuelve por referencia en el caso normal para
  no asignar en cada ciclo de change detection, lo que dejaba el catálogo global expuesto a mutación.

## Limitación conocida

La validación es **sólo client-side**. El backend no valida cortesía ni deriva el departamento
credencial, así que un cliente que hable directo con la API puede seguir guardando datos inconsistentes.
Decisión explícita del alcance (BR-6), no un descuido.

## Tests

22 tests nuevos en `agenda-nuevo.component.spec.ts`: 11 mapeados 1:1 a los acceptance criteria de esta
feature, y 11 que cubren el resto del componente (modo alta/edición, submit válido e inválido, errores
del backend, helpers numéricos, cancelar). El archivo pasó de **0 specs a 91.17%** de statements.
Suite completa: **197/197 verde**.
