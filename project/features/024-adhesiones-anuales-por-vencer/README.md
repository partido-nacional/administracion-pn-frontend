# Feature 024 — Adhesiones: Anuales por vencer

Cross-repo. Nueva sección para avisar por WhatsApp a los adherentes anuales que vencen este mes.

## Qué se construyó

**Backend** (`AdhesionesController`, `[Authorize(Finanzas)]`):
- `GET /api/adhesiones/anuales-por-vencer`: adherentes con `AporteConfirmado == true`, `SistContrib == "anual"` (case-insensitive) y `FechaVencimiento` en el **mes+año actual** (UTC); join con `Contacto`. DTO `{ contactoId, nombre, apellido, celular, sistContrib, vencimiento }`.

**Frontend** (`adhesiones-listado`):
- Nueva tab **"Anuales por vencer"** con tabla (id contacto, nombre, apellido, celular, sistema, vencimiento) + total + estado vacío.
- Botón **WhatsApp** por fila → abre `wa.me/598…?text=…` con: *"Hola {Nombre}, te recordamos desde el Partido Nacional que tu adhesión anual vence el {vencimiento}. ¡Gracias por tu apoyo!"*.
- `wa-link.ts`: normaliza el celular UY (quita separadores y 0 inicial, antepone 598) y URL-encodea el mensaje; si no hay número válido, no se muestra el botón.

## Decisiones

- Mes **fijo al actual** (igual que la query original), sin selector.
- Sin celular válido → **se oculta** el botón (la fila igual aparece).
- Deep link `wa.me` (no API oficial de WhatsApp).

## Tests

- Backend: +3 (`AnualesPorVencerTests`) — solo anuales+confirmados+mes actual, case-insensitive, vencimiento null excluido. Suite **175/175**.
- Frontend: +7 (`wa-link.spec`) — normalización, encoding, sin/short número, mensaje con nombre+fecha. Suite **170**.
