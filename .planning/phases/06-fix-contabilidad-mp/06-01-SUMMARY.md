---
phase: 06-fix-contabilidad-mp
plan: 01
subsystem: api
tags: [fix, accounting, mercadopago]
requirements-completed: [H-03]
---

# Phase 06: Fix Contabilidad MP Summary

## Accomplishments
- Added `autoCreateIngreso()` helper in both `webhook.routes.ts` and `portal.routes.ts`
- Webhook: creates Ingreso after membership upsert, uses first admin as creator
- Portal fallback: creates Ingreso after membership upsert, uses `req.user!.id` as creator
- Auto-creates/uses CuentaContable with code `401-ING` (Ingresos por Membresías MP)
- CuentaContable upsert uses `codigo: '401-ING'` as unique key so it only creates once

## Files Modified
- `apps/api/src/routes/webhook.routes.ts` — helper + Ingreso en membership activation
- `apps/api/src/routes/portal.routes.ts` — helper + Ingreso en verificar-pago-paquete

## Verification
- [x] Build compila sin errores
