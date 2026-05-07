# SarUI Studio — Fixes & Help Center

## What This Is

SarUI Studio es una plataforma de gestión de estudio fitness con dashboard admin para staff y portal público para clientes. Ya tiene gestión de clases, reservaciones, membresías, pagos con MercadoPago, y kiosk de check-in. Este ciclo se enfoca en arreglar bugs críticos y agregar una página de ayuda integrada en el dashboard.

## Core Value

Los clientes pueden reservar clases y el staff puede gestionarlas sin errores — el sistema de reservaciones debe funcionar 100% del tiempo.

## Requirements

### Validated

<!-- Shipped and confirmed valuable from existing codebase. -->

- ✓ Admin dashboard con gestión de clientes, clases, instructores, membresías, paquetes — existente
- ✓ Portal público con booking y pagos — existente
- ✓ Kiosk check-in por QR y PIN — existente
- ✓ Integración MercadoPago con webhook — existente
- ✓ Autenticación JWT con roles (admin, staff, cliente) — existente
- ✓ Calendario FullCalendar para horarios de clases — existente

### Active

- [ ] **BUG-01**: Error 500 al asignar un cliente a una clase (ocurre en dashboard admin y portal)
- [ ] **BUG-02**: Al seleccionar horas en el calendario del admin, las horas no se reflejan visualmente
- [ ] **HELP-01**: Página de ayuda/soporte integrada en el dashboard admin
- [ ] **HELP-02**: Manual de uso para admin/staff dentro de la página de ayuda
- [ ] **HELP-03**: Manual de uso para portal de clientes dentro de la página de ayuda
- [ ] **AUDIT-01**: Investigar y reportar otros bugs o áreas grises encontrados durante el proceso

### Out of Scope

- Reescribir la arquitectura del calendario — solo se arregla el bug visual de selección de horas
- Generar PDFs externos — la documentación vive dentro de la app
- Testing infrastructure — no se pide en este ciclo (ya está en roadmap existente)
- Email notifications — ya está en roadmap existente

## Context

**Codebase:** Monorepo con npm workspaces:
- `apps/api` — Express + TypeScript + Prisma (MySQL) + Mongoose (MongoDB)
- `apps/web` — Next.js 15 App Router + React + TypeScript + Tailwind + MUI + FullCalendar

**Known issues from codebase map:**
- Inline business logic en routes (archivos > 500 líneas)
- Auth tokens en localStorage (XSS risk)
- PIN check hace full table scan O(n)
- Portal layout siempre muestra "Iniciar sesión" aunque esté autenticado
- `packages/shared` existe pero no se usa (tipos duplicados)
- Dual DB write en kiosk sin transacción distribuida

**Roadmap existente (ROADMAP.md v0.2):**
- Stabilize Payment Flow (critical)
- Fix Portal Bugs (high)
- Portal Security Hardening (high)
- Performance Optimization (medium)
- Testing Infrastructure (medium)
- Email Notifications (medium)

**Branding:** `#254F40` (verde oscuro), `#F6FFB5` (acento), `#FDFFEC` (claro)

## Constraints

- **Tech stack**: Mantener Express + Next.js + Prisma + FullCalendar — no cambiar tecnologías base
- **Spanish**: Nombres de dominio y UI en español
- **Files under 500 lines**: Regla existente del proyecto
- **API envelope**: Todas las respuestas usan `{ success: true/false, data/error }`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| La documentación vive dentro del dashboard como página de ayuda | Más mantenible que PDFs externos, siempre actualizada con el código | — Pending |
| Los bugs se arreglan primero, luego la página de ayuda | Core value es que las reservaciones funcionen | ✓ Good |
| Se reportan otros hallazgos encontrados durante el trabajo | El usuario pidió "más lo que encuentres" | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-06 after initialization*
