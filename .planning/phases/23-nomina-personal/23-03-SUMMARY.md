---
phase: 23-nomina-personal
plan: "03"
subsystem: api-routes
tags: [express, prisma, asistencia, upsert, staff, nomina]
dependency_graph:
  requires: [schema-nomina-personal, routes-personal]
  provides: [routes-asistencia]
  affects: [23-04, 23-05, 23-06, 23-07]
tech_stack:
  added: []
  patterns: [upsert-composite-key, date-server-side, requireRole-per-route, zod-safeParse]
key_files:
  created:
    - apps/api/src/routes/asistencia.routes.ts
  modified:
    - apps/api/src/routes/index.ts
decisions:
  - "Fecha de autoregistro derivada 100% del servidor (new Date() + setHours(0,0,0,0)); el body nunca puede inyectar fecha ni userId"
  - "GET /admin excluye salarioSemanal del include de puesto — solo expone id y nombre del puesto para INSTRUCTOR"
  - "/personal/asistencia montado ANTES de /personal en index.ts para que Express resuelva el path más específico primero"
metrics:
  duration: "10m"
  completed: "2026-06-28"
---

# Phase 23 Plan 03: Rutas de Asistencia Summary

**One-liner:** asistencia.routes.ts con autoregistro idempotente por upsert userId_fecha (fecha forzada al servidor), historial propio, grilla semanal admin sin salarios, y edición retroactiva ADMIN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Crear asistencia.routes.ts con autoregistro de empleado (solo HOY) | 068d864 | apps/api/src/routes/asistencia.routes.ts |
| 2 | Endpoints admin de lectura semanal y edición retroactiva | 068d864 | apps/api/src/routes/asistencia.routes.ts |
| 3 | Montar asistenciaRoutes bajo /personal/asistencia | e54fde2 | apps/api/src/routes/index.ts |

## Verification

- `tsc --noEmit` — PASSED: sin errores de tipos
- `grep -c "userId_fecha\|hoy.setHours"` — PASSED: 3 coincidencias en asistencia.routes.ts
- `grep -c "router.use('/personal/asistencia', asistenciaRoutes)"` — PASSED: 1 en index.ts
- `/personal/asistencia` registrado antes de `/personal` en index.ts — PASSED

## Deviations from Plan

None — plan ejecutado exactamente como fue escrito.

## Known Stubs

None.

## Threat Flags

None — todos los endpoints protegidos por authMiddleware + requireRole por-ruta. No se expone información salarial en el endpoint de INSTRUCTOR (GET /admin).

## Self-Check: PASSED

- [x] apps/api/src/routes/asistencia.routes.ts creado (187 líneas)
- [x] POST /hoy usa `new Date()` + `setHours(0,0,0,0)` del servidor
- [x] POST /hoy usa `req.user!.id`; NO lee userId ni fecha del body
- [x] autoregistroSchema solo contiene `presente` y `observaciones`
- [x] upsert con clave compuesta `userId_fecha` — idempotente
- [x] GET /mi-semana devuelve asistencias de req.user!.id en rango de 7 días
- [x] GET /admin devuelve `{ staff, asistencias }` sin salarioSemanal
- [x] PATCH /admin requiere requireRole('ADMIN') y acepta fecha arbitraria
- [x] PATCH /admin usa upsert con clave userId_fecha
- [x] index.ts importa asistenciaRoutes
- [x] index.ts monta /personal/asistencia ANTES de /personal
- [x] tsc --noEmit PASSED
- [x] Commit 068d864 existe
- [x] Commit e54fde2 existe
