# Project State

**Project:** SarUI Studio — Portal & Tienda
**Created:** 2026-05-06
**Current Phase:** v0.5 Automatización Operativa
**Version:** v0.5

## Active Phase

**Phase 22 complete** — Módulo de Inventario implementado. CRUD + movimientos + alertas + job diario 08:00. Phase 21 (Comisiones) deferred.

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-06)

**Core value:** Los clientes pueden navegar tienda, comprar paquetes y gestionar su cuenta sin errores.

## Phase History

| Phase | Name | Status | Completed |
|-------|------|--------|-----------|
| 1 | Debug Asignación de Clases (500) | ✓ Complete | 2026-05-06 |
| 2 | Fix Selección de Horas en Calendario | ✓ Complete | 2026-05-06 |
| 3 | Página de Ayuda en Dashboard | ✓ Complete | 2026-05-08 |
| 4-9 | Hotfixes v0.3.1 (H-01 through H-10) | ✓ Complete | 2026-05-08 |
| 10 | Dashboard Contable | Deferred | — |
| 11 | Portal → Tienda Refactor | ✓ Complete | 2026-05-12 |
| 12 | Email Integration (Resend) | ✓ Complete | 2026-05-12 |
| 13 | Session & Auth Management | ✓ Complete | 2026-05-12 |
| 14 | Landing Page Polish | ✓ Complete | 2026-05-12 |
| 15 | Payment Flow Stabilization | ◐ In progress | — |
| 16 | Store UI (membresia 3-col grid) | ✓ Complete | 2026-05-12 |
| 17 | Production Readiness (envs + deploy docs) | ✓ Complete | 2026-05-12 |
| 18 | Job Scheduler Infrastructure | ✓ Complete | 2026-05-29 |
| 19 | Horario Automático Semanal | ✓ Complete | 2026-05-29 |
| 20 | Corte de Caja por Clase | ✓ Complete | 2026-05-29 |
| 21 | Comisiones e Informe Contable | ○ Pending | — |
| 22 | Módulo de Inventario | ✓ Complete | 2026-05-29 |

## Notes

- Server: localhost:4000 (api) / localhost:3001 (web)
- MP credenciales APP_USR requieren HTTPS — usar TEST en dev
- Logo SVG implementado en todas las vistas (sarui-logo.svg / sarui-logo-dark.svg)
- v0.5 inicia por Phase 18 (scheduler) — bloquea 19–22
