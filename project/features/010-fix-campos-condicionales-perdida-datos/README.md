# Feature 010 — Fix campos condicionales que borraban datos sin aviso

**Estado**: Completada · **Tipo**: production · **Fecha**: 2026-07-04
> Renumerada de 009 → 010: el 009 lo tomó `habilitar-botones-edicion` (#54), mergeada en paralelo.

## Qué se hizo

En la sección Adhesiones, los campos condicionales del formulario (según Sistema de
contribución y el toggle "Aporte todo al partido") borraban los datos cargados en el
acto y sin aviso al cambiar la selección — destruyendo datos ya guardados ante un clic
accidental (reporte del equipo de testing).

## Fix (enfoque A: ocultar sin borrar; sanear al guardar)

- `applySistContrib` / `applyAporteTodo` (en `ficha-adhesion.constants.ts`) dejan de
  borrar: solo setean el campo disparador.
- Nueva función pura `sanitizarFichaParaGuardar` que aplica la limpieza de campos
  irrelevantes, invocada en `guardar()` de `nueva-ficha` (alta) y `fichas-contacto`
  (edición), antes del POST/PUT.
- Resultado neto: lo persistido es equivalente al comportamiento previo, pero alternar
  selecciones ya no destruye datos.

## Tests

Specs de `ficha-adhesion.constants` y del form component actualizados (ahora asertan
preservación) + tests nuevos de `sanitizarFichaParaGuardar` y de "alternar y volver
conserva el dato" (AC-1/AC-2).

## Verificación

`ng build` OK · `ng test` (ChromeHeadless) → 66/66 en la rama; 101/101 tras mergear
`develop` (convive con la feature del compañero).

## Entrega

- Commit `1c8cc2f`; merge de develop `2c32b29` (resolución de colisión de número).
- PR #55 → merge a `develop` (merge commit `ca15771`).
