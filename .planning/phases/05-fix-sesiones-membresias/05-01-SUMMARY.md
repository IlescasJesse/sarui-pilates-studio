---
phase: 05-fix-sesiones-membresias
plan: 01
subsystem: api
tags: [fix, sessions, memberships]
requirements-completed: [H-01, H-02]
---

# Phase 05: Fix Sesiones y Membresías Summary

## Accomplishments

### H-02: EXHAUSTED status en portal
- `portal.routes.ts` — `/reservar-provisional` ahora setea `status: EXHAUSTED` cuando `sessionsRemaining - 1 <= 0` (mismo patrón que admin flow)

### H-01: sessionsRemaining consistency en cancelaciones
- `reservaciones.routes.ts` — `DELETE /:id` ahora: carga reservación, si tiene membershipId restaura sesión (+1 remaining, -1 used, ACTIVE), decrementa spotsBooked
- `reservaciones.routes.ts` — `PATCH /:id/declinar` ahora también restaura sesión si membershipId existe
- `webhook.routes.ts` — pago rechazado ahora restaura sesión si membershipId existe

## Files Modified
- `apps/api/src/routes/portal.routes.ts` — EXHAUSTED en reservar-provisional
- `apps/api/src/routes/reservaciones.routes.ts` — sesiones restauradas en DELETE y declinar
- `apps/api/src/routes/webhook.routes.ts` — sesiones restauradas en pago rechazado

## Verification
- [x] Build compila sin errores (`npm run build --workspace=apps/api`)
