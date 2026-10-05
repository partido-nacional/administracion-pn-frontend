# Feature 038 — "Mercado Pago" como sistema de contribución

**Estado**: Completada · **Fecha**: 2026-10-05 · **Rama**: `feature/sist-contrib-mercado-pago` · Solo frontend

- Se agrega "Mercado Pago" a las dos listas de sistema de contribución: la ficha de adhesión (`SISTEMAS` en
  `ficha-adhesion.constants.ts`) y el modal de adhesión local de Adhesiones.
- No pide campos extra (cédula, teléfono Antel ni fechas de pago), igual que "Otro".
- El backend guarda el sistema como texto libre: no requiere cambios.
- **Observación**: las dos listas difieren entre sí desde antes (ANUAL/Otro solo en la ficha; Efectivo solo en el
  modal; EBROU vs. eBROU; Antel vs. ANTEL). Unificarlas es un cambio aparte.
