---
phase: 23-nomina-personal
plan: "01"
subsystem: database
tags: [prisma, schema, mysql, nomina, personal]
dependency_graph:
  requires: []
  provides: [schema-nomina-personal]
  affects: [23-02, 23-03, 23-04, 23-05, 23-06, 23-07]
tech_stack:
  added: []
  patterns: [prisma-db-push, decimal-10-2, unique-constraints]
key_files:
  created: []
  modified:
    - apps/api/prisma/schema.prisma
decisions:
  - "Se eliminó nominaDetalles NominaDetalle[] de StaffProfile — Prisma requiere FK inversa explícita; la relación semántica es StaffProfile→User→NominaDetalle por userId compartido, sin FK directa"
metrics:
  duration: "15m"
  completed: "2026-06-28"
---

# Phase 23 Plan 01: Schema Prisma — Nómina y Personal Summary

**One-liner:** Cuatro modelos de nómina (Puesto, AsistenciaPersonal, PeriodoNomina, NominaDetalle) + enum EstadoNomina + extensión de StaffProfile aplicados a MySQL con db push y cliente Prisma regenerado.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Agregar enum EstadoNomina y 4 modelos nuevos | f4a7f9d | apps/api/prisma/schema.prisma |
| 2 | Extender StaffProfile y relaciones inversas en User | f4a7f9d | apps/api/prisma/schema.prisma |
| 3 | Aplicar migración y regenerar cliente Prisma | f4a7f9d | apps/api/prisma/schema.prisma |

## Verification

- `npx prisma validate` — PASSED: "The schema at prisma/schema.prisma is valid"
- `npx prisma db push` — PASSED: MySQL sincronizado, tablas puestos/asistencia_personal/periodos_nomina/nomina_detalles creadas
- `npx prisma generate` — PASSED: cliente regenerado con nuevos tipos
- `npx tsc --noEmit` — PASSED: sin errores de tipos

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Eliminada relación nominaDetalles en StaffProfile**
- **Found during:** Task 3 (prisma validate)
- **Issue:** El plan pedía `nominaDetalles NominaDetalle[]` en StaffProfile, pero Prisma requiere una FK inversa explícita en NominaDetalle para soportar esa relación. NominaDetalle no tiene campo staffProfileId — solo tiene userId y periodoId.
- **Fix:** Removida la relación `nominaDetalles NominaDetalle[]` de StaffProfile. La conexión semántica entre StaffProfile y NominaDetalle se resuelve por userId compartido (ambos referencian al mismo User). Los planes de backend pueden hacer joins o includes a través de User.
- **Files modified:** apps/api/prisma/schema.prisma
- **Commit:** f4a7f9d

## Known Stubs

None.

## Threat Flags

None — plan modifica únicamente el schema de base de datos. No se introducen nuevos endpoints de red ni paths de autenticación.

## Self-Check: PASSED

- [x] apps/api/prisma/schema.prisma modificado
- [x] Commit f4a7f9d existe
- [x] enum EstadoNomina con BORRADOR, APROBADO, PAGADO
- [x] model Puesto con @@map("puestos")
- [x] model AsistenciaPersonal con @@unique([userId, fecha])
- [x] model PeriodoNomina con @@index([estado])
- [x] model NominaDetalle con @@unique([periodoId, userId]) y gastoId String? @unique
- [x] StaffProfile extendido con puestoId, fechaIngreso, activo
- [x] User con relaciones inversas asistencias, periodosNomina, nominaDetalles
- [x] prisma validate PASSED
- [x] prisma db push PASSED (MySQL disponible)
- [x] prisma generate PASSED
- [x] tsc --noEmit PASSED
