---
phase: 23-nomina-personal
plan: "02"
subsystem: api-routes
tags: [express, prisma, personal, puestos, staff, crud]
dependency_graph:
  requires: [schema-nomina-personal]
  provides: [routes-personal]
  affects: [23-03, 23-04]
tech_stack:
  added: []
  patterns: [requireRole-per-route, prisma-transaction-inline, zod-safeParse]
key_files:
  created:
    - apps/api/src/routes/personal.routes.ts
  modified:
    - apps/api/src/routes/index.ts
decisions:
  - "requireRole('ADMIN') aplicado por-ruta (no global) para que los planes 03/04 puedan agregar rutas de empleado/cliente sin quitar protección admin"
  - "POST /staff acepta nuevoPuesto inline y usa prisma.$transaction para crear puesto+staffProfile atómicamente"
metrics:
  duration: "12m"
  completed: "2026-06-28"
---

# Phase 23 Plan 02: Rutas de Personal y Puestos Summary

**One-liner:** CRUD de Puestos y StaffProfile en personal.routes.ts con requireRole per-ruta, creación inline de puesto en $transaction, montado en /personal.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Crear personal.routes.ts con CRUD de Puestos | cc07d38 | apps/api/src/routes/personal.routes.ts |
| 2 | Agregar CRUD de Personal (StaffProfile) con creación inline de puesto | cc07d38 | apps/api/src/routes/personal.routes.ts |
| 3 | Montar personalRoutes en el router principal | 47bd529 | apps/api/src/routes/index.ts |

## Verification

- `npx tsc --noEmit` — PASSED: sin errores de tipos
- `grep "router.use('/personal', personalRoutes)"` — PASSED: 1 coincidencia en index.ts
- `grep "export default router"` — PASSED: presente en personal.routes.ts

## Deviations from Plan

None - plan ejecutado exactamente como fue escrito.

## Known Stubs

None.

## Threat Flags

None — el archivo personal.routes.ts está completamente protegido por authMiddleware global + requireRole('ADMIN') por-ruta. No se exponen endpoints sin autenticación.

## Self-Check: PASSED

- [x] apps/api/src/routes/personal.routes.ts creado (228 líneas)
- [x] GET/POST/PATCH/DELETE /puestos presentes con requireRole('ADMIN') por-ruta
- [x] DELETE /puestos/:id retorna 409 IN_USE si hay StaffProfile con ese puestoId
- [x] POST /puestos retorna 409 DUPLICATE ante nombre duplicado (P2002)
- [x] GET/POST/PATCH/DELETE /staff presentes con requireRole('ADMIN') por-ruta
- [x] GET /staff incluye user (id, email, role) y puesto en cada registro
- [x] POST /staff crea puesto inline dentro de $transaction cuando viene nuevoPuesto sin puestoId
- [x] POST /staff retorna 409 DUPLICATE si userId ya tiene StaffProfile (P2002)
- [x] fechaIngreso se persiste como new Date(fechaIngreso)
- [x] apps/api/src/routes/index.ts contiene import personalRoutes
- [x] apps/api/src/routes/index.ts contiene router.use('/personal', personalRoutes)
- [x] tsc --noEmit PASSED
- [x] Commit cc07d38 existe
- [x] Commit 47bd529 existe
