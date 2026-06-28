---
phase: 23-nomina-personal
plan: "04"
subsystem: api-service-routes
tags: [express, prisma, nomina, contabilidad, transaction, gasto-602]
dependency_graph:
  requires: [schema-nomina-personal, routes-personal, routes-asistencia]
  provides: [routes-nomina, service-nomina]
  affects: [23-05, 23-06, 23-07]
tech_stack:
  added: []
  patterns: [prisma-transaction-atomic, upsert-cuenta-contable, requireRole-per-route, zod-safeParse, server-side-concepto]
key_files:
  created:
    - apps/api/src/services/nomina.service.ts
    - apps/api/src/routes/nomina.routes.ts
  modified:
    - apps/api/src/routes/index.ts
decisions:
  - "autoCreateGasto NO pasa origen — el modelo Gasto no tiene ese campo (diferente a Ingreso)"
  - "calcularDetallesPeriodo preserva deducciones existentes en update para no borrar ajustes manuales"
  - "concepto del Gasto construido server-side: nombre de staffProfile con fallback a user.email"
  - "requireRole('ADMIN') por-ruta (no global) para permitir GET /mi-historial a roles no-admin"
  - "/personal/nomina montado ANTES de /personal en index.ts (path más específico primero)"
metrics:
  duration: "20m"
  completed: "2026-06-28"
---

# Phase 23 Plan 04: Servicio Nómina y Rutas Summary

**One-liner:** nomina.service.ts (autoCreateGasto en cuenta 602 + calcularDetallesPeriodo) y nomina.routes.ts (CRUD períodos, recalcular, ajustar, aprobar con Gasto atómico en $transaction, marcar PAGADO, historial propio) montado en /personal/nomina.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | nomina.service.ts — autoCreateGasto y calcularDetallesPeriodo | a47ebec | apps/api/src/services/nomina.service.ts |
| 2 | nomina.routes.ts — CRUD períodos, recalcular, ajustar, aprobar, pagar, mi-historial | 3e760cb | apps/api/src/routes/nomina.routes.ts |
| 3 | Montar nominaRoutes en /personal/nomina en index.ts | e9f0d60 | apps/api/src/routes/index.ts |

## Verification

- `npm run build -w sarui-api` (tsc --noEmit) — PASSED: sin errores en todos los archivos
- `grep -c "cuentaCodigo\|'602'\|tipo: 'GASTO'\|calcularDetallesPeriodo\|autoCreateGasto" nomina.service.ts` — 6 coincidencias
- `grep -c "/periodos\|/recalcular\|/detalles\|/mi-historial\|BORRADOR" nomina.routes.ts` — 20 coincidencias
- `grep -c "router.use('/personal/nomina'" index.ts` — 1 coincidencia

## Threat Mitigations Applied

| Threat | Disposition | Implementation |
|--------|-------------|----------------|
| T-23-01 Tampering /aprobar | mitigated | Validación estado==='BORRADOR' ANTES de $transaction; retorna 409 si no |
| T-23-02 Info Disclosure /mi-historial | mitigated | Filtro por req.user!.id server-side; no acepta userId del query |
| T-23-03 Tampering concepto Gasto | mitigated | concepto construido 100% server-side desde BD; no usa input del cliente |
| T-23-04 EoP endpoints admin | mitigated | requireRole('ADMIN') por-ruta en crear/aprobar/pagar/recalcular/ajustar |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ApiError llama con 4 argumentos (no 5)**
- **Found during:** Task 2 (npm run build)
- **Issue:** El plan sugería pasar `parsed.error.issues` como 5to argumento a ApiError, pero la función acepta máximo 4 argumentos (res, code, message, status). El error era TS2554.
- **Fix:** Eliminados los argumentos extra en las dos llamadas de validación de schema. Los errores de Zod no se exponen en la respuesta (correcto para producción).
- **Files modified:** apps/api/src/routes/nomina.routes.ts
- **Commit:** 3e760cb

## Known Stubs

None — todos los endpoints están implementados con lógica real. El cálculo de nómina, la creación de Gastos contables y las validaciones de estado son funcionales.

## Threat Flags

None — los endpoints de nómina siguen los mismos patrones de seguridad de las rutas previas del proyecto. No se introducen nuevas superficies de red fuera de las documentadas en el threat model del plan.

## Self-Check: PASSED

- [x] apps/api/src/services/nomina.service.ts creado
- [x] autoCreateGasto exportada — upsert CuentaContable tipo 'GASTO', crea Gasto sin origen
- [x] calcularDetallesPeriodo exportada — cuenta presente:true en rango, upsert NominaDetalle
- [x] netoAPagar = Math.round((salarioSemanal/7)*dias*100)/100
- [x] deducciones NO sobreescritas en update (preserva ajustes manuales)
- [x] apps/api/src/routes/nomina.routes.ts creado
- [x] GET /periodos con requireRole('ADMIN') y include detalles→user→staffProfile→puesto
- [x] POST /periodos — $transaction: create + calcularDetallesPeriodo
- [x] POST /periodos/:id/recalcular — 409 si estado !== 'BORRADOR'
- [x] PATCH /detalles/:id — 409 si período no es BORRADOR, valida netoAPagar >= 0
- [x] POST /periodos/:id/aprobar — 409 si estado !== 'BORRADOR' ANTES de $transaction; crea Gasto por detalle con cuentaCodigo '602'; actualiza NominaDetalle.gastoId en la misma $transaction
- [x] Fallback nombre = user.email cuando staffProfile es null
- [x] POST /periodos/:id/pagar — 409 si estado !== 'APROBADO'
- [x] GET /mi-historial — filtra por req.user!.id, no acepta userId del query
- [x] apps/api/src/routes/index.ts — import nominaRoutes + router.use('/personal/nomina', nominaRoutes)
- [x] /personal/nomina montado antes de /personal en index.ts
- [x] npm run build (tsc) PASSED en todos los archivos
- [x] Commits a47ebec, 3e760cb, e9f0d60 existen
