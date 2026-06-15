# Specs — Administración PN Frontend

**Fuente de verdad** del frontend, derivada y verificada contra el código (2026-06-14). Una spec por feature + un documento transversal de arquitectura. Si el código cambia, actualizar la spec correspondiente en el mismo cambio.

## Transversal

- [`architecture.md`](architecture.md) — stack (Angular 17.3 standalone), bootstrap/config, routing lazy, auth en cliente (signals + interceptor + guard), estado, layout/shell, utilidades core (export CSV, page-title), build/deploy (Vercel), deuda transversal.

## Features

| Feature | Vista (front) | Backend que consume | Spec |
|---------|---------------|---------------------|------|
| Autenticación | ✅ | real | [features/auth.md](features/auth.md) |
| Dashboard (inicio) | ✅ | real | [features/dashboard.md](features/dashboard.md) |
| Agenda (contactos) | ✅ | real | [features/agenda.md](features/agenda.md) |
| Adhesiones | ✅ | real | [features/adhesiones.md](features/adhesiones.md) |
| Agrupaciones | ✅ | real | [features/agrupaciones.md](features/agrupaciones.md) |
| Productos / Ventas / Donaciones | ✅ | real | [features/productos.md](features/productos.md) |
| Listados / Reportería | ✅ | real | [features/listados.md](features/listados.md) |
| Débitos | ✅ vista | 🔸 backend stub | [features/debitos.md](features/debitos.md) |
| Organismos | ✅ vista | 🔸 stub (+ integrantes real) | [features/organismos.md](features/organismos.md) |
| Convencionales | ✅ vista | 🔸 backend stub | [features/convencionales.md](features/convencionales.md) |

> **Nota**: "Vista (front)" = el componente Angular existe y consume HTTP de verdad. "Backend que consume" indica si el endpoint del backend está implementado o es stub (datos estáticos). Débitos/Organismos/Convencionales tienen UI real pero el backend devuelve datos mock (ver specs del backend).

## Backlog

Bugs, UI sin cablear y deuda técnica detectados en la ingeniería inversa: [`../backlog.md`](../backlog.md).
